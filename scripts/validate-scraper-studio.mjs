import { readFile } from 'node:fs/promises';

const interaction = await readFile(new URL('../brightdata/interaction.js', import.meta.url), 'utf8');
const parser = await readFile(new URL('../brightdata/parser.js', import.meta.url), 'utf8');
const inputSchema = JSON.parse(await readFile(new URL('../brightdata/input-schema.json', import.meta.url), 'utf8'));
const outputSchema = JSON.parse(await readFile(new URL('../brightdata/output-schema.json', import.meta.url), 'utf8'));
const previewInput = JSON.parse(await readFile(new URL('../brightdata/preview-input.json', import.meta.url), 'utf8'));
const healPrompt = await readFile(new URL('../brightdata/SELF_HEAL_PROMPT.md', import.meta.url), 'utf8');

// Scraper Studio stores both code areas as function bodies with platform globals.
// new Function validates JavaScript syntax without executing Bright Data-only globals.
new Function(interaction);
new Function(parser);

const interactionPrimitives = ['navigate(', 'wait_visible(', 'click(', 'wait_network_idle(', 'wait_page_idle(', 'tag_screenshot(', 'parse()', 'collect('];
for (const primitive of interactionPrimitives) {
  if (!interaction.includes(primitive)) throw new Error(`Missing Browser Worker primitive: ${primitive}`);
}

if (inputSchema?.type !== 'object' || inputSchema?.fields?.url?.type !== 'url' || !inputSchema?.fields?.url?.required) throw new Error('Input schema must require a public URL input.');
if (!interaction.includes('isPrivateHost') || !interaction.includes('decodeURIComponent') || !interaction.includes('split(/[\\\\/]/)')) throw new Error('Browser Worker must fail closed for obvious private hosts and encoded login/private path separators.');
if (!parser.includes("money('.total-price')")) throw new Error('Demo parser must preserve the deliberate wrong-but-valid legacy total selector.');
if (!parser.includes('offer_screenshot') || !parser.includes('checkout_screenshot')) throw new Error('Parser must bind both journey screenshots into evidence.');
if (outputSchema?.type !== 'object' || !outputSchema?.fields?.recordType?.required) throw new Error('Output schema must distinguish complete Deal Contracts from offer-only product observations.');
if (!outputSchema?.fields?.commercial?.fields?.productPrice?.required) throw new Error('Output schema must define a semantic commercial.productPrice field.');
if (outputSchema?.fields?.checkout?.required === true) throw new Error('Checkout must be optional at the top level because a public product page does not prove checkout occurred.');
if (!outputSchema?.fields?.checkout?.fields?.finalTotal?.required) throw new Error('When checkout is present, checkout.finalTotal must remain required.');
if (!outputSchema?.fields?.evidence?.items?.fields?.sourceUrl?.required) throw new Error('Output schema must require evidence source URLs.');
if (!parser.includes("recordType: 'product_observation'") || !interaction.includes('must not fabricate checkout fields')) throw new Error('Generic product mode must remain offer-only and must not invent checkout totals.');
if (!Array.isArray(previewInput) || !previewInput[0]?.url) throw new Error('Preview input must be a URL input array.');
if (/\[data-testid=|\.total-price/i.test(healPrompt)) throw new Error('Self-heal prompt must describe semantic field meaning, not hard-code replacement selectors.');

console.log('Scraper Studio package validated: public URL guardrails, Browser Worker syntax/primitives, dual observation schema, evidence provenance, no fabricated product checkout, preview input, and selector-agnostic semantic-heal prompt are present.');
