const $ = (id) => document.getElementById(id);
let state = { latest: null, selectedEvidence: null, health: null };
const DEMO_TARGET = 'https://demo.webreceipt.dev/hotel/ocean-house';
const fixtureTarget = () => `${location.origin}/fixture/hotel`;

const money = (m) => m ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: m.currency, maximumFractionDigits: 2 }).format(m.amount) : '—';
const pctDelta = (start, end) => start ? `${(((end - start) / start) * 100).toFixed(1)}%` : '—';
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const operatorKey = () => $('operatorKey')?.value?.trim() || sessionStorage.getItem('webreceiptOperator') || '';

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body != null) headers.set('Content-Type', 'application/json');
  const key = operatorKey();
  if (key) headers.set('X-WebReceipt-Operator', key);
  const res = await fetch(path, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

function busy(button, value) {
  if (!button) return;
  button.disabled = value;
  button.setAttribute('aria-busy', value ? 'true' : 'false');
}
function toast(message, type = 'success') {
  const el = $('toast');
  el.textContent = message;
  el.className = `toast ${type}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add('hidden'), 3200);
}
function banner(message, type = 'success') {
  const el = $('statusBanner');
  el.textContent = message;
  el.className = `status-banner ${type}`;
}

function repairSummary(result) {
  const repair = result.repair;
  const chip = $('repairGateChip');
  if (!repair) {
    chip.textContent = 'verification gate armed';
    chip.className = 'chip';
    return result.integrity.status === 'valid'
      ? ['Receipt compiled and Deal Contract integrity verified.', 'success']
      : [`Contract integrity is ${result.integrity.status}.`, result.integrity.status === 'invalid' ? 'error' : 'warning'];
  }

  if (repair.rejected) {
    chip.textContent = 'repair rejected';
    chip.className = 'chip chip-danger';
    const failures = repair.previewIntegrity?.failures?.map((x) => x.id).join(', ') || 'invalid preview';
    return [`Semantic drift detected → proposed repair failed verification (${failures}) → repair rejected before deployment.`, 'error'];
  }

  if (repair.postApprovalVerified) {
    const preview = repair.previewIntegrity;
    chip.textContent = preview ? 'preview verified → approved' : 'post-heal verified';
    chip.className = 'chip chip-success';
    const gate = preview ? `repair preview passed ${preview.passed}/${preview.total}` : 'repair completed without an approval gate';
    return [`Semantic drift detected → ${gate} → repair approved → fresh collector run verified.`, 'success'];
  }

  chip.textContent = 'repair verification failed';
  chip.className = 'chip chip-danger';
  return ['A repair was attempted, but the fresh collector run did not pass semantic verification.', 'error'];
}

function renderReceipt(result) {
  state.latest = result;
  const { contract, integrity, anomalies } = result;
  $('metricAdvertised').textContent = money(contract.offer.advertisedPrice);
  $('metricFinal').textContent = money(contract.checkout.finalTotal);
  $('metricDelta').textContent = pctDelta(contract.offer.advertisedPrice.amount, contract.checkout.finalTotal.amount);
  $('metricIntegrity').textContent = `${integrity.passed}/${integrity.total}`;
  $('metricIntegritySub').textContent = integrity.status === 'valid' ? 'all contract checks pass' : `${integrity.failures.length} failures`;
  $('contractHash').textContent = contract.contractHash;

  $('journey').className = 'journey';
  $('journey').innerHTML = contract.journey.map((step, i) => `<button type="button" class="journey-stage" data-evidence="${esc(step.evidenceId)}"><span class="stage-dot">${String(i+1).padStart(2, '0')}</span><span class="stage-label">${esc(step.label)}</span><span class="stage-price">${money(step.displayedPrice)}</span></button>`).join('');
  document.querySelectorAll('.journey-stage').forEach((el) => el.addEventListener('click', () => selectEvidence(el.dataset.evidence)));

  $('contract').className = 'contract';
  const rows = [
    ['Advertised price', money(contract.offer.advertisedPrice)],
    ['Base price', money(contract.checkout.basePrice)],
    ['Mandatory fees', money(contract.checkout.mandatoryFees)],
    ['Taxes', money(contract.checkout.taxes)],
    ['Optional add-ons', money(contract.checkout.optionalAddons)],
    ['Discounts', money(contract.checkout.discounts)],
    ['Final total', money(contract.checkout.finalTotal)],
    ['Cancellation', contract.terms.cancellation],
    ['Refundability', contract.terms.refundability],
    ['Payment timing', contract.terms.paymentTiming],
    ['Inclusions', contract.terms.inclusions.join(', ') || 'None']
  ];
  $('contract').innerHTML = `<div class="contract-table">${rows.map(([k,v]) => `<div class="contract-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`;

  $('checks').className = 'checks';
  $('checks').innerHTML = integrity.checks.map((check) => `<div class="check ${check.pass ? 'pass' : 'fail'}"><span class="indicator"></span><div><strong>${esc(check.label)}</strong><small>${check.pass ? 'Passed' : esc(JSON.stringify(check.details))}</small></div></div>`).join('');

  $('anomalies').className = 'anomalies';
  $('anomalies').innerHTML = anomalies.length ? anomalies.map((a) => `<div class="anomaly ${a.severity === 'high' ? 'warn' : ''}"><span class="indicator"></span><div><strong>${esc(a.label)} · ${esc(a.value)}</strong><small>${esc(a.details)}</small></div></div>`).join('') : '<div class="empty-state">No observable anomalies in this run.</div>';
  selectEvidence(contract.journey.at(-1)?.evidenceId || contract.evidence[0]?.id);
  const [message, type] = repairSummary(result);
  banner(message, type);
}

function selectEvidence(id) {
  if (!state.latest) return;
  const e = state.latest.contract.evidence.find((x) => x.id === id)
    || state.latest.contract.evidence.find((x) => x.field === 'checkout.finalTotal')
    || state.latest.contract.evidence[0];
  if (!e) return;
  state.selectedEvidence = e.id;
  document.querySelectorAll('.journey-stage').forEach((el) => el.classList.toggle('active', el.dataset.evidence === e.id));
  const screenshot = /^https:\/\//i.test(e.screenshotRef || '')
    ? `<img class="evidence-shot" src="${esc(e.screenshotRef)}" alt="Captured evidence for ${esc(e.field)}" loading="lazy" referrerpolicy="no-referrer" />`
    : '';
  $('evidence').className = 'evidence';
  $('evidence').innerHTML = `<div class="evidence-card">${screenshot}<div class="mini-label">${esc(e.field)}</div><div class="value">${esc(e.capturedText)}</div><div class="evidence-grid"><span>Source</span><code>${esc(e.sourceUrl)}</code><span>Observed</span><code>${esc(e.observedAt)}</code><span>DOM</span><code>${esc(e.domPath || '—')}</code><span>Screenshot</span><code>${esc(e.screenshotRef || '—')}</code><span>Evidence SHA-256</span><code>${esc(e.hash)}</code></div></div>`;
}

function renderStress(run) {
  $('stress').className = 'stress-grid';
  $('stress').innerHTML = run.results.map((r) => {
    const status = r.initiallyValid ? 'SURVIVED' : r.healed ? 'VERIFIED + HEALED' : r.rejected ? 'REJECTED' : 'FAILED';
    return `<div class="stress-item"><div class="top"><span>${esc(r.mutation)}</span><span class="${r.initiallyValid || r.healed ? 'status-ok' : 'status-heal'}">${status}</span></div><small>${r.failedChecks.length ? `Detected: ${esc(r.failedChecks.join(', '))}${r.previewVerified ? ' · preview verified before approval' : ''}` : 'No integrity breach'}</small></div>`;
  }).join('');
  banner(`Chaos Checkout recovered ${run.recovered}/${run.total} scenarios; ${run.previewVerified || 0} repair previews were verified before approval.`, run.recovered === run.total ? 'success' : 'error');
}

function renderDiff(data) {
  $('diff').className = 'diff-list';
  $('diff').innerHTML = data.changes.length ? data.changes.map((c) => {
    const before = c.kind === 'money' ? `${c.before} ${c.currency}` : Array.isArray(c.before) ? c.before.join(', ') || 'None' : c.before ?? 'None';
    const after = c.kind === 'money' ? `${c.after} ${c.currency}` : Array.isArray(c.after) ? c.after.join(', ') || 'None' : c.after ?? 'None';
    return `<div class="diff-item"><div class="diff-path">${esc(c.path)}</div><div class="diff-values"><span class="before">${esc(before)}</span><span class="arrow">→</span><span class="after">${esc(after)}</span></div></div>`;
  }).join('') : '<div class="empty-state">No changes observed between the two receipts.</div>';
}

function renderEvents(events) {
  $('events').className = 'event-log';
  $('events').innerHTML = events.length ? events.slice(0, 18).map((e) => `<div class="event ${esc(e.type)}"><time>${new Date(e.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</time><span class="event-dot"></span><div><strong>${esc(e.message)}</strong><small>${esc(e.meta?.mutation || e.type)}</small></div></div>`).join('') : '<div class="empty-state">No events yet.</div>';
}

async function refreshState() {
  const s = await api('/api/state');
  renderEvents(s.events || []);
  if (!state.latest && s.contracts?.[0]) renderReceipt(s.contracts[0]);
  if (s.stressRuns?.[0]) renderStress(s.stressRuns[0]);
}

function updateModeUi() {
  const live = $('mode').value === 'brightdata';
  const currentTarget = $('targetUrl').value.trim();
  const localFixture = fixtureTarget();
  if (live && (!currentTarget || currentTarget === DEMO_TARGET)) $('targetUrl').value = localFixture;
  if (!live && (!currentTarget || currentTarget === localFixture)) $('targetUrl').value = DEMO_TARGET;
  const protectedLive = Boolean(state.health?.liveAccess?.protected);
  $('operatorField').classList.toggle('hidden', !(live && protectedLive));
  $('stressBtn').disabled = live;
  $('stressBtn').title = live ? 'Chaos Checkout is deterministic simulator-only.' : '';
  $('diffBtn').textContent = live ? 'Compare stored runs' : 'Simulate day +3';
  if (live && !state.health?.liveAccess?.configured) banner('This deployment does not have a Bright Data collector configured yet.', 'warning');
  if (live && state.health?.liveAccess?.configured && !state.health?.liveAccess?.enabled) banner('Bright Data is configured but live operations are locked until an operator token is set on the deployment.', 'warning');
}

async function runObserve(mutation = 'healthy') {
  const button = mutation === 'healthy' ? $('observeBtn') : $('breakBtn');
  busy(button, true);
  try {
    const mode = $('mode').value;
    const targetUrl = $('targetUrl').value.trim();
    let runMutation = mutation;
    if (mode === 'brightdata' && targetUrl.includes('/fixture/hotel')) {
      await api(mutation === 'healthy' ? '/api/fixture/reset' : '/api/fixture/break', {method:'POST', body:'{}'});
      runMutation = 'healthy';
    }
    if (mutation !== 'healthy') banner('Website redesign injected. The legacy selector still returns a plausible subtotal; WebReceipt must catch the semantic contradiction.', 'error');
    const result = await api('/api/observe', { method: 'POST', body: JSON.stringify({ targetUrl, mode, mutation: runMutation }) });
    renderReceipt(result);
    await refreshState();
    toast(mutation === 'healthy' ? 'Receipt generated and verified' : result.healed ? 'Repair preview verified, approved, and rerun' : 'Break detected; repair was not accepted', result.healed || mutation === 'healthy' ? 'success' : 'error');
  } catch (e) {
    banner(e.message, 'error');
    toast(e.message, 'error');
  } finally {
    busy(button, false);
  }
}

$('observeBtn').addEventListener('click', () => runObserve('healthy'));
$('breakBtn').addEventListener('click', () => runObserve('wrong-valid-total'));
$('stressBtn').addEventListener('click', async () => {
  busy($('stressBtn'), true);
  try {
    renderStress(await api('/api/stress', { method: 'POST', body: JSON.stringify({ mode: 'simulator' }) }));
    await refreshState();
    toast('Chaos suite complete');
  } catch (e) {
    banner(e.message, 'error');
    toast(e.message, 'error');
  } finally {
    busy($('stressBtn'), false);
  }
});
$('diffBtn').addEventListener('click', async () => {
  busy($('diffBtn'), true);
  try {
    const live = $('mode').value === 'brightdata';
    const data = await api('/api/diff', {
      method:'POST',
      body: JSON.stringify({ mode: $('mode').value, simulate: !live, targetUrl: $('targetUrl').value.trim() })
    });
    renderDiff(data);
    await refreshState();
    toast(live ? 'Stored observations compared' : 'Promise changes reconstructed');
  } catch (e) {
    banner(e.message, 'error');
    toast(e.message, 'error');
  } finally {
    busy($('diffBtn'), false);
  }
});
$('resetBtn').addEventListener('click', async () => {
  try {
    await api('/api/reset',{method:'POST',body:'{}'});
    location.reload();
  } catch (e) {
    banner(e.message, 'error');
    toast(e.message, 'error');
  }
});
$('mode').addEventListener('change', updateModeUi);
$('operatorKey').addEventListener('change', () => {
  const value = $('operatorKey').value.trim();
  if (value) sessionStorage.setItem('webreceiptOperator', value);
  else sessionStorage.removeItem('webreceiptOperator');
});

if (!$('targetUrl').value) $('targetUrl').value = DEMO_TARGET;
const savedOperator = sessionStorage.getItem('webreceiptOperator');
if (savedOperator) $('operatorKey').value = savedOperator;

api('/api/health').then((health) => {
  state.health = health;
  $('health').textContent = health.liveAccess?.configured ? '● Bright Data configured' : '● Demo mode';
  updateModeUi();
}).catch(() => {
  $('health').textContent = '● offline';
  updateModeUi();
});
refreshState().catch(console.error);
