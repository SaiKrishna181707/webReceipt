import { readFile } from 'node:fs/promises';

const interaction = await readFile(new URL('../brightdata/interaction.js', import.meta.url), 'utf8');
const parser = await readFile(new URL('../brightdata/parser.js', import.meta.url), 'utf8');
const outputSchema = JSON.parse(await readFile(new URL('../brightdata/output-schema.json', import.meta.url), 'utf8'));
const previewInput = JSON.parse(await readFile(new URL('../brightdata/preview-input.json', import.meta.url), 'utf8'));

// Scraper Studio stores both code areas as function bodies with platform globals.
// new Function validates JavaScript syntax without executing Bright Data-only globals.
new Function(interaction);
new Function(parser);

const interactionPrimitives = ['navigate(', 'wait_visible(', 'click(', 'wait_network_idle(', 'wait_page_idle(', 'tag_screenshot(', 'parse()', 'collect('];
for (const primitive of interactionPrimitives) {
  if (!interaction.includes(primitive)) throw new Error(`Missing Browser Worker primitive: ${primitive}`);
}

if (!parser.includes("money('.total-price')")) throw new Error('Demo parser must preserve the deliberate wrong-but-valid legacy total selector.');
if (!parser.includes('offer_screenshot') || !parser.includes('checkout_screenshot')) throw new Error('Parser must bind both journey screenshots into evidence.');
if (outputSchema?.type !== 'object' || !outputSchema?.fields?.checkout?.fields?.finalTotal?.required) throw new Error('Output schema must require checkout.finalTotal.');
if (!outputSchema?.fields?.evidence?.items?.fields?.sourceUrl?.required) throw new Error('Output schema must require evidence source URLs.');
if (!Array.isArray(previewInput) || !previewInput[0]?.url) throw new Error('Preview input must be a URL input array.');

console.log('Scraper Studio package validated: Browser Worker syntax, required primitives, evidence schema, preview input, and semantic-failure fixture contract are present.');
