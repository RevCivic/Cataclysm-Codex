'use strict';

const sourceGrid = document.getElementById('source-grid');
const tokenInput = document.getElementById('admin-token');
const refreshButton = document.getElementById('refresh-btn');
const previewPanel = document.getElementById('preview-panel');
const previewTitle = document.getElementById('preview-title');
const previewSummary = document.getElementById('preview-summary');
const previewIssues = document.getElementById('preview-issues');
const applyButton = document.getElementById('apply-btn');
const toast = document.getElementById('toast');
let reviewed = null;

tokenInput.value = sessionStorage.getItem('codexAdminToken') || '';
tokenInput.addEventListener('change', () => sessionStorage.setItem('codexAdminToken', tokenInput.value));

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-admin-token': tokenInput.value, ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

function showToast(message, failure = false) {
  toast.textContent = message;
  toast.className = failure ? 'error' : '';
  setTimeout(() => { toast.className = 'hidden'; }, 4000);
}

function addText(parent, tag, value, className) {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  parent.appendChild(element);
  return element;
}

function metaRow(list, label, value) {
  addText(list, 'dt', label);
  addText(list, 'dd', value || '—');
}

function renderSources(sources) {
  sourceGrid.replaceChildren();
  for (const source of sources) {
    const card = document.createElement('article');
    card.className = 'source-card';
    const header = document.createElement('div');
    header.className = 'source-card-header';
    const identity = document.createElement('div');
    addText(identity, 'h3', source.id.replaceAll('-', ' '));
    addText(identity, 'p', source.parser, 'source-id');
    header.appendChild(identity);
    addText(header, 'span', source.latestSnapshot ? 'Snapshot ready' : 'Not fetched', `status-pill ${source.latestSnapshot ? 'ready' : ''}`);
    card.appendChild(header);
    const meta = document.createElement('dl');
    meta.className = 'source-meta';
    metaRow(meta, 'Source type', `${source.kind.toUpperCase()} · ${source.format.toUpperCase()}`);
    metaRow(meta, 'Expected tabs', source.expectedTabs.join(', ') || 'Document paragraphs');
    metaRow(meta, 'Last fetched', source.latestSnapshot ? new Date(source.latestSnapshot.fetchedAt).toLocaleString() : null);
    metaRow(meta, 'Checksum', source.latestSnapshot ? source.latestSnapshot.sha256.slice(0, 16) + '…' : null);
    card.appendChild(meta);
    const actions = document.createElement('div');
    actions.className = 'source-actions';
    const fetchButton = addText(actions, 'button', source.latestSnapshot ? 'Fetch latest' : 'Fetch snapshot', 'btn btn-secondary');
    fetchButton.addEventListener('click', () => fetchSource(source, fetchButton));
    const previewButton = addText(actions, 'button', 'Preview import', 'btn btn-primary');
    previewButton.disabled = !source.canPreview || !source.latestSnapshot;
    previewButton.title = source.canPreview ? '' : 'Parser not implemented yet';
    previewButton.addEventListener('click', () => previewSource(source, previewButton));
    card.appendChild(actions);
    sourceGrid.appendChild(card);
  }
}

async function loadSources() {
  sourceGrid.innerHTML = '<p class="loading">Loading configured sources…</p>';
  try { renderSources(await api('/api/admin/sources')); }
  catch (error) { sourceGrid.replaceChildren(); showToast(error.message, true); addText(sourceGrid, 'p', error.message, 'loading'); }
}

async function fetchSource(source, button) {
  button.disabled = true;
  button.textContent = 'Fetching…';
  try {
    const result = await api(`/api/admin/sources/${source.id}/fetch`, { method: 'POST', body: '{}' });
    showToast(`${source.id}: ${result.created ? 'new snapshot saved' : 'snapshot unchanged'}`);
    await loadSources();
  } catch (error) { showToast(error.message, true); button.disabled = false; button.textContent = 'Retry fetch'; }
}

async function previewSource(source, button) {
  button.disabled = true;
  button.textContent = 'Inspecting…';
  try {
    const result = await api(`/api/admin/sources/${source.id}/preview`);
    reviewed = { sourceId: source.id, sha256: result.snapshot.sha256 };
    previewTitle.textContent = source.id.replaceAll('-', ' ');
    previewSummary.replaceChildren();
    const metrics = [
      ['Create', result.preview.counts.create], ['Update', result.preview.counts.update],
      ['Unchanged', result.preview.counts.unchanged], ['Aliases', result.preview.aliases]
    ];
    for (const [label, value] of metrics) {
      const metric = document.createElement('div'); metric.className = 'metric';
      addText(metric, 'strong', String(value)); addText(metric, 'span', label); previewSummary.appendChild(metric);
    }
    if (result.preview.breakdown) {
      const detail = Object.entries(result.preview.breakdown).map(([name, counts]) =>
        `${name}: ${counts.create} create, ${counts.update} update, ${counts.unchanged} unchanged`).join(' · ');
      addText(previewSummary, 'p', detail, 'breakdown');
    }
    previewIssues.replaceChildren();
    const blocking = result.preview.issues.filter(issue => issue.severity === 'error');
    if (result.preview.issues.length) {
      addText(previewIssues, 'h4', 'Validation issues');
      const list = document.createElement('ul'); list.className = 'issue-list';
      for (const issue of result.preview.issues) addText(list, 'li', `${issue.code} at ${issue.sourceLocator}`);
      previewIssues.appendChild(list);
    }
    applyButton.disabled = blocking.length > 0;
    previewPanel.classList.remove('hidden');
    previewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { showToast(error.message, true); }
  finally { button.disabled = false; button.textContent = 'Preview import'; }
}

applyButton.addEventListener('click', async () => {
  if (!reviewed || !confirm('Apply this exact reviewed snapshot to the Codex?')) return;
  applyButton.disabled = true; applyButton.textContent = 'Applying…';
  try {
    const result = await api(`/api/admin/sources/${reviewed.sourceId}/apply`, {
      method: 'POST', body: JSON.stringify({ snapshotSha256: reviewed.sha256 })
    });
    showToast(`Import complete: ${result.run.counts.create} created, ${result.run.counts.update} updated`);
    previewPanel.classList.add('hidden'); reviewed = null; await loadSources();
  } catch (error) { showToast(error.message, true); }
  finally { applyButton.disabled = false; applyButton.textContent = 'Apply reviewed snapshot'; }
});

document.getElementById('close-preview').addEventListener('click', () => { previewPanel.classList.add('hidden'); reviewed = null; });
refreshButton.addEventListener('click', loadSources);
loadSources();
