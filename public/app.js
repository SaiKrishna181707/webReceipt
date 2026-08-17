const $ = (id) => document.getElementById(id);
let state = { latest: null, selectedEvidence: null };

const money = (m) => m ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: m.currency, maximumFractionDigits: 0 }).format(m.amount) : '—';
const pctDelta = (start, end) => start ? `${(((end - start) / start) * 100).toFixed(1)}%` : '—';
const esc = (value) => String(value ?? '').replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function api(path, options = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}
function busy(button, value) { button.disabled = value; }
function toast(message, type = 'success') { const el = $('toast'); el.textContent = message; el.className = `toast ${type}`; setTimeout(() => el.classList.add('hidden'), 3200); }
function banner(message, type) { const el = $('statusBanner'); el.textContent = message; el.className = `status-banner ${type}`; }

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
  $('journey').innerHTML = contract.journey.map((step, i) => `<div class="journey-stage" data-evidence="${esc(step.evidenceId)}"><div class="stage-dot">0${i+1}</div><div class="stage-label">${esc(step.label)}</div><div class="stage-price">${money(step.displayedPrice)}</div></div>`).join('');
  document.querySelectorAll('.journey-stage').forEach((el) => el.addEventListener('click', () => selectEvidence(el.dataset.evidence)));

  $('contract').className = 'contract';
  const rows = [
    ['Advertised price', money(contract.offer.advertisedPrice)],
    ['Base price', money(contract.checkout.basePrice)],
    ['Mandatory fees', money(contract.checkout.mandatoryFees)],
    ['Taxes', money(contract.checkout.taxes)],
    ['Discounts', money(contract.checkout.discounts)],
    ['Final total', money(contract.checkout.finalTotal)],
    ['Cancellation', contract.terms.cancellation],
    ['Refundability', contract.terms.refundability],
    ['Inclusions', contract.terms.inclusions.join(', ') || 'None']
  ];
  $('contract').innerHTML = `<div class="contract-table">${rows.map(([k,v]) => `<div class="contract-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`;

  $('checks').className = 'checks';
  $('checks').innerHTML = integrity.checks.map((check) => `<div class="check ${check.pass ? 'pass' : 'fail'}"><span class="indicator"></span><div><strong>${esc(check.label)}</strong><small>${check.pass ? 'Passed' : esc(JSON.stringify(check.details))}</small></div></div>`).join('');

  $('anomalies').className = 'anomalies';
  $('anomalies').innerHTML = anomalies.length ? anomalies.map((a) => `<div class="anomaly ${a.severity === 'high' ? 'warn' : ''}"><span class="indicator"></span><div><strong>${esc(a.label)} · ${esc(a.value)}</strong><small>${esc(a.details)}</small></div></div>`).join('') : '<div class="empty-state">No observable anomalies in this run.</div>';
  selectEvidence(contract.journey.at(-1)?.evidenceId || contract.evidence[0]?.id);
  banner(result.healed ? 'Semantic drift detected → Bright Data self-heal simulated → contract re-verified.' : 'Receipt compiled and contract integrity verified.', 'success');
}

function selectEvidence(id) {
  if (!state.latest) return;
  const e = state.latest.contract.evidence.find((x) => x.id === id) || state.latest.contract.evidence.find((x) => x.field === 'checkout.finalTotal') || state.latest.contract.evidence[0];
  if (!e) return;
  state.selectedEvidence = e.id;
  document.querySelectorAll('.journey-stage').forEach((el) => el.classList.toggle('active', el.dataset.evidence === e.id));
  $('evidence').className = 'evidence';
  $('evidence').innerHTML = `<div class="evidence-card"><div class="mini-label">${esc(e.field)}</div><div class="value">${esc(e.capturedText)}</div><div class="evidence-grid"><span>Source</span><code>${esc(e.sourceUrl)}</code><span>Observed</span><code>${esc(e.observedAt)}</code><span>DOM</span><code>${esc(e.domPath || '—')}</code><span>Screenshot</span><code>${esc(e.screenshotRef || '—')}</code><span>SHA-256</span><code>${esc(e.hash)}</code></div></div>`;
}

function renderStress(run) {
  $('stress').className = 'stress-grid';
  $('stress').innerHTML = run.results.map((r) => `<div class="stress-item"><div class="top"><span>${esc(r.mutation)}</span><span class="${r.initiallyValid ? 'status-ok' : 'status-heal'}">${r.initiallyValid ? 'SURVIVED' : r.healed ? 'HEALED' : 'FAILED'}</span></div><small>${r.failedChecks.length ? `Detected: ${esc(r.failedChecks.join(', '))}` : 'No integrity breach'}</small></div>`).join('');
  banner(`Chaos Checkout recovered ${run.recovered}/${run.total} mutation scenarios.`, run.recovered === run.total ? 'success' : 'error');
}

function renderDiff(data) {
  $('diff').className = 'diff-list';
  $('diff').innerHTML = data.changes.length ? data.changes.map((c) => {
    const before = c.kind === 'money' ? `${c.before} ${c.currency}` : Array.isArray(c.before) ? c.before.join(', ') || 'None' : c.before;
    const after = c.kind === 'money' ? `${c.after} ${c.currency}` : Array.isArray(c.after) ? c.after.join(', ') || 'None' : c.after;
    return `<div class="diff-item"><div class="diff-path">${esc(c.path)}</div><div class="diff-values"><span class="before">${esc(before)}</span><span class="arrow">→</span><span class="after">${esc(after)}</span></div></div>`;
  }).join('') : '<div class="empty-state">No changes observed.</div>';
}

function renderEvents(events) {
  $('events').className = 'event-log';
  $('events').innerHTML = events.length ? events.slice(0, 16).map((e) => `<div class="event ${esc(e.type)}"><time>${new Date(e.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</time><span class="event-dot"></span><div><strong>${esc(e.message)}</strong><small>${esc(e.meta?.mutation || e.type)}</small></div></div>`).join('') : '<div class="empty-state">No events yet.</div>';
}

async function refreshState() { const s = await api('/api/state'); renderEvents(s.events || []); if (!state.latest && s.contracts?.[0]) renderReceipt(s.contracts[0]); if (s.stressRuns?.[0]) renderStress(s.stressRuns[0]); }
async function runObserve(mutation = 'healthy') {
  const button = mutation === 'healthy' ? $('observeBtn') : $('breakBtn'); busy(button, true);
  try {
    const mode = $('mode').value;
    const targetUrl = $('targetUrl').value;
    let runMutation = mutation;
    if (mode === 'brightdata' && targetUrl.includes('/fixture/hotel')) {
      await api(mutation === 'healthy' ? '/api/fixture/reset' : '/api/fixture/break', {method:'POST', body:'{}'});
      runMutation = 'healthy';
    }
    if (mutation !== 'healthy') banner('Website redesign injected. The legacy selector still returns a plausible but wrong subtotal…', 'error');
    const result = await api('/api/observe', { method: 'POST', body: JSON.stringify({ targetUrl, mode, mutation: runMutation }) });
    renderReceipt(result); await refreshState(); toast(mutation === 'healthy' ? 'Receipt generated' : 'Semantic failure healed and verified');
  } catch (e) { banner(e.message, 'error'); toast(e.message, 'error'); } finally { busy(button, false); }
}

$('observeBtn').addEventListener('click', () => runObserve('healthy'));
$('breakBtn').addEventListener('click', () => runObserve('wrong-valid-total'));
$('stressBtn').addEventListener('click', async () => { busy($('stressBtn'), true); try { if ($('mode').value === 'brightdata') throw new Error('Chaos Checkout is deterministic simulator mode; use Break website for the live Bright Data fixture.'); renderStress(await api('/api/stress', { method: 'POST', body: JSON.stringify({ mode: 'simulator' }) })); await refreshState(); toast('Chaos suite complete'); } catch(e){ toast(e.message,'error'); } finally { busy($('stressBtn'), false); } });
$('diffBtn').addEventListener('click', async () => { busy($('diffBtn'), true); try { renderDiff(await api('/api/diff', { method:'POST', body: JSON.stringify({ mode: $('mode').value }) })); await refreshState(); toast('Promise changes reconstructed'); } catch(e){toast(e.message,'error');} finally{busy($('diffBtn'),false);} });
$('resetBtn').addEventListener('click', async () => { await api('/api/reset',{method:'POST',body:'{}'}); location.reload(); });

if (!$('targetUrl').value) $('targetUrl').value = `${location.origin}/fixture/hotel`;

api('/api/health').then((h) => { $('health').textContent = h.mode === 'brightdata-ready' ? '● Bright Data ready' : '● Demo mode'; }).catch(() => $('health').textContent = '● offline');
refreshState().catch(console.error);
