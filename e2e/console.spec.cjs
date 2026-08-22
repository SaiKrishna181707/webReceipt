const { test, expect } = require('@playwright/test')

const BASE = process.env.WEBRECEIPT_E2E_BASE || 'http://127.0.0.1:3000'
const DEMO_URL = 'https://demo.webreceipt.dev/hotel/ocean-house'

test.use({ channel: 'chrome', viewport: { width: 1440, height: 1000 } })
test.setTimeout(90_000)

function action(page, text) {
  return page.locator('button').filter({ hasText: text }).first()
}

test('real browser completes the Console workflow and navigation on localhost', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(String(error)))

  await page.goto(`${BASE}/console`, { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: /Proof of promise, end to end/i })).toBeVisible()

  const target = page.getByPlaceholder('https://…')
  await target.fill(DEMO_URL)

  await action(page, 'Observe journey').click()
  await expect(page.getByText('Journey Replay', { exact: true })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Contract sealed', { exact: true }).first()).toBeVisible()

  // Open the evidence drawer through the actual journey button, then prove the
  // keyboard-accessible modal close path works.
  await page.locator('button').filter({ hasText: 'View evidence' }).first().click()
  await expect(page.getByRole('dialog', { name: 'Tamper-evident evidence' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Tamper-evident evidence' })).toBeHidden()

  await action(page, 'Simulate redesign').click()
  await expect(page.getByText('Integrity failure', { exact: true }).first()).toBeVisible({ timeout: 20_000 })

  await action(page, 'Heal the extraction').click()
  await expect(page.getByText('Contract sealed', { exact: true }).first()).toBeVisible({ timeout: 20_000 })

  await action(page, 'Promise Diff').click()
  await expect(page.getByText('git diff for commercial promises', { exact: true })).toBeVisible({ timeout: 20_000 })

  await action(page, 'Reset').click()
  await expect(page.getByRole('heading', { name: 'Awaiting command' })).toBeVisible({ timeout: 20_000 })

  // A pasted private URL must surface an actionable UI error instead of hanging
  // or silently manufacturing a receipt.
  await target.fill('http://127.0.0.1:3000/product')
  await action(page, 'Observe journey').click()
  await expect(page.getByText(/publicly reachable targets/i).first()).toBeVisible({ timeout: 20_000 })

  // Exercise the desktop navigation through actual clicks, not direct HTTP GETs.
  for (const [label, path] of [
    ['Docs', '/docs'],
    ['Receipts', '/receipts'],
    ['Mutation Lab', '/mutation-lab'],
    ['Home', '/'],
    ['Console', '/console'],
  ]) {
    await page.getByRole('link', { name: label, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/$' : `${path}$`}`))
  }

  expect(pageErrors, `uncaught browser page errors: ${pageErrors.join('\n')}`).toEqual([])
})
