/* Cataclysm Codex — Frontend Application */
'use strict';

// ─── Section Configuration ────────────────────────────────────────────────
const SECTIONS = {
  people: {
    label: 'People',
    endpoint: '/api/people',
    primaryKey: 'name',
    badgeKey: 'race',
    badgeColor: 'badge-blue',
    metaKeys: [
      { key: 'class', label: 'Class' },
      { key: 'level', label: 'Lvl', prefix: 'Lvl ' },
      { key: 'affiliation', label: 'Affiliation' }
    ],
    descKey: 'description',
    provenanceType: 'people',
    fields: [
      { key: 'name',        label: 'Name',        type: 'text', required: true, wide: false },
      { key: 'race',        label: 'Race/Species', type: 'text', wide: false },
      { key: 'class',       label: 'Class',        type: 'text', wide: false },
      { key: 'level',       label: 'Level',        type: 'text', wide: false },
      { key: 'age',         label: 'Age',          type: 'text', wide: false },
      { key: 'sex',         label: 'Sex',          type: 'text', wide: false },
      { key: 'rank',        label: 'Rank',         type: 'text', wide: false },
      { key: 'occupation',  label: 'Occupation',   type: 'text', wide: false },
      { key: 'encounter_context', label: 'Encountered', type: 'text', wide: true },
      { key: 'affiliation', label: 'Affiliation',  type: 'text', wide: true },
      { key: 'description', label: 'Description',  type: 'textarea', wide: true },
      { key: 'notes',       label: 'Notes',        type: 'textarea', wide: true }
    ]
  },
  species: {
    label: 'Species',
    endpoint: '/api/species',
    primaryKey: 'name',
    badgeKey: 'type',
    badgeColor: 'badge-blue',
    metaKeys: [
      { key: 'home_world', label: 'Home World' },
      { key: 'size', label: 'Size' }
    ],
    descKey: 'description',
    provenanceType: 'species',
    fields: [
      { key: 'name',              label: 'Name',              type: 'text',     required: true, wide: false },
      { key: 'home_world',        label: 'Home World',        type: 'text',     wide: false },
      { key: 'size',              label: 'Size',              type: 'text',     wide: false },
      { key: 'type',              label: 'Type',              type: 'text',     wide: false },
      { key: 'atmosphere',        label: 'Atmosphere',        type: 'text',     wide: false },
      { key: 'sexes',             label: 'Sexes',             type: 'text',     wide: false },
      { key: 'hours_of_sleep',    label: 'Hours of Sleep',    type: 'text',     wide: false },
      { key: 'days_without_food', label: 'Days Without Food', type: 'text',     wide: false },
      { key: 'days_without_water', label: 'Days Without Water', type: 'text',   wide: false },
      { key: 'attribute_bonuses', label: 'Attribute Bonuses', type: 'text',     wide: true },
      { key: 'traits',            label: 'Racial Traits',     type: 'textarea', wide: true },
      { key: 'description',       label: 'Description',       type: 'textarea', wide: true },
      { key: 'background',        label: 'Background',        type: 'textarea', wide: true },
      { key: 'sociology',         label: 'Sociology',         type: 'textarea', wide: true },
      { key: 'physiology',        label: 'Physiology',        type: 'textarea', wide: true },
      { key: 'ruleset',           label: 'Ruleset',           type: 'text',     wide: false },
      { key: 'content_origin',    label: 'Content Origin',    type: 'text',     wide: false },
      { key: 'approval_status',   label: 'Approval Status',   type: 'text',     wide: false },
      { key: 'notes',             label: 'Notes',             type: 'textarea', wide: true }
    ]
  },
  parties: {
    label: 'Parties',
    endpoint: '/api/parties',
    primaryKey: 'name',
    badgeKey: null,
    badgeColor: 'badge-green',
    metaKeys: [
      { key: 'home_base', label: 'Base' }
    ],
    descKey: 'description',
    fields: [
      { key: 'name',        label: 'Name',      type: 'text', required: true, wide: false },
      { key: 'home_base',   label: 'Home Base', type: 'text', wide: true },
      { key: 'members',     label: 'Members',   type: 'textarea', wide: true },
      { key: 'description', label: 'Description', type: 'textarea', wide: true },
      { key: 'notes',       label: 'Notes',     type: 'textarea', wide: true }
    ]
  },
  factions: {
    label: 'Factions',
    endpoint: '/api/factions',
    primaryKey: 'name',
    badgeKey: 'alignment',
    badgeColor: 'badge-orange',
    metaKeys: [
      { key: 'leader', label: 'Leader' },
      { key: 'headquarters', label: 'HQ' }
    ],
    descKey: 'description',
    fields: [
      { key: 'name',         label: 'Name',         type: 'text', required: true, wide: false },
      { key: 'alignment',    label: 'Alignment',    type: 'text', wide: false },
      { key: 'leader',       label: 'Leader',       type: 'text', wide: false },
      { key: 'headquarters', label: 'Headquarters', type: 'text', wide: false },
      { key: 'goals',        label: 'Goals',        type: 'textarea', wide: true },
      { key: 'description',  label: 'Description',  type: 'textarea', wide: true },
      { key: 'notes',        label: 'Notes',        type: 'textarea', wide: true }
    ]
  },
  weapons: {
    label: 'Weapons',
    endpoint: '/api/weapons',
    primaryKey: 'name',
    badgeKey: 'type',
    badgeColor: 'badge-red',
    metaKeys: [
      { key: 'level', label: 'Level', prefix: 'Lvl ' },
      { key: 'damage', label: 'Damage' },
      { key: 'price', label: 'Price' }
    ],
    descKey: 'description',
    fields: [
      { key: 'name',      label: 'Name',     type: 'text', required: true, wide: false },
      { key: 'type',      label: 'Type',     type: 'text', wide: false },
      { key: 'level',     label: 'Level',    type: 'text', wide: false },
      { key: 'damage',    label: 'Damage',   type: 'text', wide: false },
      { key: 'critical',  label: 'Critical', type: 'text', wide: false },
      { key: 'range',     label: 'Range',    type: 'text', wide: false },
      { key: 'capacity',  label: 'Capacity', type: 'text', wide: false },
      { key: 'usage',     label: 'Usage',    type: 'text', wide: false },
      { key: 'bulk',      label: 'Bulk',     type: 'text', wide: false },
      { key: 'special',   label: 'Special',  type: 'text', wide: false },
      { key: 'price',     label: 'Price',    type: 'text', wide: false },
      { key: 'description', label: 'Description', type: 'textarea', wide: true }
    ]
  },
  starships: {
    label: 'Starships',
    endpoint: '/api/starships',
    primaryKey: 'name',
    badgeKey: 'size',
    badgeColor: 'badge-blue',
    metaKeys: [
      { key: 'model', label: 'Model' },
      { key: 'affiliation', label: 'Owner' }
    ],
    descKey: 'description',
    fields: [
      { key: 'name',            label: 'Name',              type: 'text', required: true, wide: false },
      { key: 'model',           label: 'Model',             type: 'text', wide: false },
      { key: 'size',            label: 'Size',              type: 'text', wide: false },
      { key: 'speed',           label: 'Speed',             type: 'text', wide: false },
      { key: 'maneuverability', label: 'Maneuverability',   type: 'text', wide: false },
      { key: 'shields',         label: 'Shields',           type: 'text', wide: true },
      { key: 'hull_points',     label: 'Hull Points',       type: 'text', wide: false },
      { key: 'crew',            label: 'Crew',              type: 'text', wide: false },
      { key: 'affiliation',     label: 'Owner/Affiliation', type: 'text', wide: false },
      { key: 'weapons',         label: 'Weapons',           type: 'textarea', wide: true },
      { key: 'description',     label: 'Description',       type: 'textarea', wide: true },
      { key: 'notes',           label: 'Notes',             type: 'textarea', wide: true }
    ]
  },
  armors: {
    label: 'Armors',
    endpoint: '/api/armors',
    primaryKey: 'name',
    badgeKey: 'type',
    badgeColor: 'badge-gray',
    metaKeys: [
      { key: 'level', label: 'Level', prefix: 'Lvl ' },
      { key: 'eac_bonus', label: 'EAC', prefix: 'EAC +' },
      { key: 'kac_bonus', label: 'KAC', prefix: 'KAC +' }
    ],
    descKey: 'description',
    fields: [
      { key: 'name',               label: 'Name',              type: 'text', required: true, wide: false },
      { key: 'type',               label: 'Type',              type: 'text', wide: false },
      { key: 'level',              label: 'Level',             type: 'text', wide: false },
      { key: 'eac_bonus',          label: 'EAC Bonus',         type: 'text', wide: false },
      { key: 'kac_bonus',          label: 'KAC Bonus',         type: 'text', wide: false },
      { key: 'max_dex',            label: 'Max DEX',           type: 'text', wide: false },
      { key: 'armor_check_penalty', label: 'Armor Check Penalty', type: 'text', wide: false },
      { key: 'speed_adjustment',   label: 'Speed Adjustment',  type: 'text', wide: false },
      { key: 'upgrade_slots',      label: 'Upgrade Slots',     type: 'text', wide: false },
      { key: 'bulk',               label: 'Bulk',              type: 'text', wide: false },
      { key: 'price',              label: 'Price',             type: 'text', wide: false },
      { key: 'description',        label: 'Description',       type: 'textarea', wide: true }
    ]
  },
  timeline: {
    label: 'Timeline',
    endpoint: '/api/timeline',
    primaryKey: 'title',
    badgeKey: 'significance',
    badgeColor: 'badge-orange',
    metaKeys: [
      { key: 'year', label: 'Year', prefix: 'Year ' },
      { key: 'era', label: 'Era' }
    ],
    descKey: 'description',
    fields: [
      { key: 'title',       label: 'Event Title',  type: 'text', required: true, wide: true },
      { key: 'year',        label: 'Year',         type: 'text', wide: false },
      { key: 'era',         label: 'Era',          type: 'text', wide: false },
      { key: 'significance', label: 'Significance', type: 'text', wide: false },
      { key: 'description', label: 'Description',  type: 'textarea', wide: true },
      { key: 'notes',       label: 'Notes',        type: 'textarea', wide: true }
    ]
  },
  items: {
    label: 'Item Catalog', endpoint: '/api/reference/items', primaryKey: 'name',
    badgeKey: 'item_kind', badgeColor: 'badge-orange', descKey: 'description', readOnly: true, provenanceType: 'items',
    metaKeys: [{ key: 'category' }, { key: 'damage' }, { key: 'rarity' }],
    fields: [
      { key: 'name', label: 'Name' }, { key: 'item_kind', label: 'Kind' },
      { key: 'category', label: 'Category' }, { key: 'rarity', label: 'Rarity' },
      { key: 'damage', label: 'Damage' }, { key: 'damage_type', label: 'Damage Type' },
      { key: 'critical', label: 'Critical' }, { key: 'range', label: 'Range' },
      { key: 'capacity', label: 'Capacity' }, { key: 'fire_rate', label: 'Fire Rate' },
      { key: 'armor_class', label: 'Armor Class' }, { key: 'eac_bonus', label: 'EAC' },
      { key: 'kac_bonus', label: 'KAC' }, { key: 'max_dex', label: 'Max DEX' },
      { key: 'upgrade_slots', label: 'Upgrade Slots' }, { key: 'bulk', label: 'Bulk' },
      { key: 'special', label: 'Special', wide: true }, { key: 'description', label: 'Description', wide: true },
      { key: 'approval_status', label: 'Approval' }
    ]
  },
  upgrades: {
    label: 'Upgrades', endpoint: '/api/reference/upgrades', primaryKey: 'name',
    badgeKey: 'compatibility', badgeColor: 'badge-blue', descKey: 'effect', readOnly: true, provenanceType: 'upgrades',
    metaKeys: [{ key: 'rarity' }, { key: 'bulk', prefix: 'Bulk ' }],
    fields: [
      { key: 'name', label: 'Name' }, { key: 'compatibility', label: 'Compatibility' },
      { key: 'rarity', label: 'Rarity' }, { key: 'bulk', label: 'Bulk' },
      { key: 'manufacturer', label: 'Manufacturer' }, { key: 'effect', label: 'Effect', wide: true },
      { key: 'approval_status', label: 'Approval' }
    ]
  },
  shipDesigns: {
    label: 'Ship Designs', endpoint: '/api/reference/ship-designs', primaryKey: 'name',
    badgeKey: 'ship_class', badgeColor: 'badge-blue', descKey: 'notes', readOnly: true, provenanceType: 'shipDesigns',
    metaKeys: [{ key: 'role' }, { key: 'faction_name' }, { key: 'status' }],
    fields: [
      { key: 'name', label: 'Design' }, { key: 'ship_class', label: 'Class' },
      { key: 'role', label: 'Role' }, { key: 'faction_name', label: 'Faction' },
      { key: 'status', label: 'Status' }, { key: 'length', label: 'Length' },
      { key: 'width', label: 'Width' }, { key: 'height', label: 'Height' },
      { key: 'decks', label: 'Decks' }, { key: 'fore_weapons', label: 'Fore Weapons', wide: true },
      { key: 'aft_weapons', label: 'Aft Weapons', wide: true },
      { key: 'port_weapons', label: 'Port Weapons', wide: true },
      { key: 'starboard_weapons', label: 'Starboard Weapons', wide: true },
      { key: 'notable_ships_raw', label: 'Notable Ships', wide: true }, { key: 'notes', label: 'Notes', wide: true }
    ]
  },
  history: {
    label: 'World History', endpoint: '/api/reference/events', primaryKey: 'title',
    badgeKey: 'date_precision', badgeColor: 'badge-gray', descKey: 'description', readOnly: true, provenanceType: 'events',
    metaKeys: [{ key: 'start_year', prefix: 'Year ' }, { key: 'end_year', prefix: 'to ' }],
    fields: [
      { key: 'title', label: 'Event' }, { key: 'raw_date', label: 'Source Date' },
      { key: 'start_year', label: 'Start Year' }, { key: 'end_year', label: 'End Year' },
      { key: 'date_precision', label: 'Precision' }, { key: 'event_kind', label: 'Kind' },
      { key: 'description', label: 'Description', wide: true }
    ]
  },
  lore: {
    label: 'Lore Library', endpoint: '/api/lore', primaryKey: 'title', badgeKey: 'document_kind',
    badgeColor: 'badge-orange', descKey: 'summary', readOnly: true, fetchDetail: true, provenanceType: 'loreDocuments',
    metaKeys: [{ key: 'section_count', prefix: 'Sections ' }],
    fields: [
      { key: 'title', label: 'Title', wide: true }, { key: 'document_kind', label: 'Document Type' },
      { key: 'section_count', label: 'Sections' }, { key: 'ruleset', label: 'Ruleset' }
    ]
  },
  sessions: {
    label: 'Episodes', endpoint: '/api/reference/sessions', primaryKey: 'title',
    badgeKey: 'episode_number', badgeColor: 'badge-orange', descKey: 'summary', readOnly: true, provenanceType: 'sessions',
    metaKeys: [{ key: 'in_world_date_raw' }, { key: 'location_raw' }],
    fields: [
      { key: 'episode_number', label: 'Episode' }, { key: 'title', label: 'Title', wide: true },
      { key: 'in_world_date_raw', label: 'In-world Date' }, { key: 'location_raw', label: 'Location' },
      { key: 'summary', label: 'Important Event', wide: true }
    ]
  },
  organizations: {
    label: 'Organizations', endpoint: '/api/reference/organizations', primaryKey: 'name',
    badgeKey: 'organization_kind', badgeColor: 'badge-blue', descKey: 'products_raw', readOnly: true, provenanceType: 'organizations',
    metaKeys: [{ key: 'industry' }, { key: 'leader_raw' }],
    fields: [
      { key: 'name', label: 'Name', wide: true }, { key: 'organization_kind', label: 'Kind' },
      { key: 'industry', label: 'Industry' }, { key: 'leader_raw', label: 'Leadership', wide: true },
      { key: 'products_raw', label: 'Major Products', wide: true }
    ]
  },
  atlas: {
    label: 'Star Atlas', endpoint: '/api/atlas/systems', primaryKey: 'name',
    badgeKey: 'star_type', badgeColor: 'badge-blue', descKey: 'notes', readOnly: true,
    fetchDetail: true, provenanceType: 'starSystems',
    metaKeys: [{ key: 'sector', prefix: 'Sector ' }, { key: 'world_count', prefix: 'Worlds ' }, { key: 'inhabited' }],
    fields: [
      { key: 'name', label: 'System' }, { key: 'source_code', label: 'Chart Code' },
      { key: 'sector', label: 'Sector' }, { key: 'star_type', label: 'Star Type' },
      { key: 'inhabited', label: 'Inhabited' }, { key: 'discovered_by', label: 'Discovered By' },
      { key: 'notes', label: 'Notes', wide: true }
    ]
  }
};

// ─── App State ────────────────────────────────────────────────────────────
let currentSection = 'people';
let currentData = [];
let editingId = null;
let detailId = null;

// ─── DOM Refs ─────────────────────────────────────────────────────────────
const cardsContainer = document.getElementById('cards-container');
const sectionTitle = document.getElementById('section-title');
const recordCount = document.getElementById('record-count');
const searchInput = document.getElementById('search-input');
const addBtn = document.getElementById('add-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalForm = document.getElementById('modal-form');
const formFields = document.getElementById('form-fields');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const detailOverlay = document.getElementById('detail-overlay');
const detailTitle = document.getElementById('detail-title');
const detailBody = document.getElementById('detail-body');
const detailClose = document.getElementById('detail-close');
const detailEdit = document.getElementById('detail-edit');
const detailDelete = document.getElementById('detail-delete');
const toast = document.getElementById('toast');

// ─── API Helpers ──────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const defaults = { headers: { 'Content-Type': 'application/json' } };
  const res = await fetch(url, { ...defaults, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

function apiGet(endpoint)          { return apiFetch(endpoint); }
function apiPost(endpoint, body)   { return apiFetch(endpoint, { method: 'POST',   body: JSON.stringify(body) }); }
function apiPut(endpoint, id, body){ return apiFetch(`${endpoint}/${id}`, { method: 'PUT', body: JSON.stringify(body) }); }
function apiDelete(endpoint, id)   { return apiFetch(`${endpoint}/${id}`, { method: 'DELETE' }); }

// ─── Toast ────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.color = isError ? 'var(--danger)' : 'var(--success)';
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ─── Navigation ───────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn[data-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSection = btn.dataset.section;
    searchInput.value = '';
    loadSection();
  });
});

// ─── Load Section ─────────────────────────────────────────────────────────
async function loadSection() {
  const cfg = SECTIONS[currentSection];
  sectionTitle.textContent = cfg.label;
  addBtn.classList.toggle('hidden', Boolean(cfg.readOnly));
  cardsContainer.innerHTML = '<p style="color:var(--text-muted);padding:20px">Loading…</p>';

  // Timeline gets single-column layout
  cardsContainer.className = currentSection === 'timeline'
    ? 'cards-grid timeline-layout'
    : 'cards-grid';

  try {
    currentData = await apiGet(cfg.endpoint);
    renderCards(currentData);
  } catch (e) {
    cardsContainer.innerHTML = `<p style="color:var(--danger);padding:20px">Error: ${e.message}</p>`;
  }
}

// ─── Render Cards ─────────────────────────────────────────────────────────
function renderCards(data) {
  const cfg = SECTIONS[currentSection];
  recordCount.textContent = data.length;

  if (!data.length) {
    const emptyHelp = cfg.readOnly
      ? 'Import this source from <strong>Data Admin</strong> to populate the reference library.'
      : 'Click <strong>+ Add Entry</strong> to create the first one.';
    cardsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>No entries yet</h3>
        <p>${emptyHelp}</p>
      </div>`;
    return;
  }

  if (currentSection === 'timeline') {
    cardsContainer.innerHTML = data.map(item => renderTimelineCard(item, cfg)).join('');
  } else {
    cardsContainer.innerHTML = data.map(item => renderCard(item, cfg)).join('');
  }

  cardsContainer.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openDetail(card.dataset.id));
  });
}

function renderCard(item, cfg) {
  const badge = cfg.badgeKey && item[cfg.badgeKey]
    ? `<span class="card-badge ${cfg.badgeColor}">${esc(item[cfg.badgeKey])}</span>`
    : '';

  const meta = cfg.metaKeys
    .filter(m => item[m.key])
    .map(m => `<span>${m.prefix || ''}${esc(item[m.key])}</span>`)
    .join('');

  const desc = item[cfg.descKey]
    ? `<p class="card-description">${esc(item[cfg.descKey])}</p>`
    : '';

  return `
    <div class="card" data-id="${esc(item.id)}">
      <div class="card-header">
        <span class="card-title">${esc(item[cfg.primaryKey])}</span>
        ${badge}
      </div>
      ${meta ? `<div class="card-meta">${meta}</div>` : ''}
      ${desc}
    </div>`;
}

function renderTimelineCard(item, cfg) {
  const sigColor = {
    'Critical': 'badge-red',
    'High': 'badge-orange',
    'Medium': 'badge-blue',
    'Low': 'badge-gray'
  }[item.significance] || 'badge-gray';

  const badge = item.significance
    ? `<span class="card-badge ${sigColor}">${esc(item.significance)}</span>`
    : '';

  return `
    <div class="card" data-id="${esc(item.id)}" style="cursor:pointer">
      <div class="timeline-card">
        <div class="timeline-year">
          <span class="year-num">${esc(item.year || '?')}</span>
          <span class="year-era">${esc(item.era || '')}</span>
        </div>
        <div class="timeline-line"><div class="timeline-dot"></div></div>
        <div class="timeline-content">
          <div class="card-header">
            <span class="card-title">${esc(item.title)}</span>
            ${badge}
          </div>
          ${item.description ? `<p class="card-description">${esc(item.description)}</p>` : ''}
        </div>
      </div>
    </div>`;
}

// ─── Search ───────────────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) { renderCards(currentData); return; }
  const filtered = currentData.filter(item =>
    Object.values(item).some(v => v && String(v).toLowerCase().includes(q))
  );
  renderCards(filtered);
});

// ─── Add / Edit Modal ─────────────────────────────────────────────────────
addBtn.addEventListener('click', () => openModal(null));

function openModal(item) {
  const cfg = SECTIONS[currentSection];
  editingId = item ? item.id : null;
  modalTitle.textContent = item ? `Edit ${cfg.label.slice(0, -1)}` : `Add ${cfg.label.slice(0, -1)}`;

  formFields.innerHTML = cfg.fields.map(f => `
    <div class="field-group ${f.wide ? 'full-width' : ''}">
      <label for="field-${f.key}">${f.label}${f.required ? ' *' : ''}</label>
      ${f.type === 'textarea'
        ? `<textarea id="field-${f.key}" name="${f.key}" rows="3">${item ? esc(item[f.key] || '') : ''}</textarea>`
        : `<input id="field-${f.key}" name="${f.key}" type="text" value="${item ? esc(item[f.key] || '') : ''}" />`
      }
    </div>`
  ).join('');

  modalOverlay.classList.remove('hidden');
  formFields.querySelector('input, textarea')?.focus();
}

function closeModal() { modalOverlay.classList.add('hidden'); editingId = null; }
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

modalForm.addEventListener('submit', async e => {
  e.preventDefault();
  const cfg = SECTIONS[currentSection];
  const body = {};
  cfg.fields.forEach(f => {
    const el = document.getElementById(`field-${f.key}`);
    if (el) body[f.key] = el.value.trim();
  });

  try {
    if (editingId) {
      await apiPut(cfg.endpoint, editingId, body);
      showToast('Entry updated.');
    } else {
      await apiPost(cfg.endpoint, body);
      showToast('Entry created.');
    }
    closeModal();
    await loadSection();
  } catch (err) {
    showToast(err.message, true);
  }
});

// ─── Detail Modal ─────────────────────────────────────────────────────────
async function openDetail(id) {
  let item = currentData.find(r => r.id === id);
  if (!item) return;
  const cfg = SECTIONS[currentSection];
  if (cfg.fetchDetail) {
    try { item = await apiGet(`${cfg.endpoint}/${id}`); }
    catch (error) { showToast(error.message, true); return; }
  }
  let provenance = null;
  if (cfg.provenanceType) {
    try { provenance = await apiGet(`/api/provenance/${cfg.provenanceType}/${id}`); }
    catch (error) { showToast(error.message, true); }
  }
  detailId = id;

  detailTitle.textContent = item[cfg.primaryKey];

  const rows = cfg.fields.map(f => {
    const val = item[f.key];
    if (!val) return '';
    return `
      <div class="detail-item ${f.wide ? 'full-width' : ''}">
        <label>${f.label}</label>
        <div class="detail-value">${esc(val)}</div>
      </div>`;
  }).filter(Boolean).join('');

  const sections = Array.isArray(item.sections) ? `
    <div class="lore-sections">${item.sections.map(section => `
      <article class="lore-section">
        ${section.heading ? `<h4>${esc(section.heading)}</h4>` : ''}
        ${section.body ? `<p>${esc(section.body)}</p>` : ''}
      </article>`).join('')}
    </div>` : '';
  const worlds = Array.isArray(item.worlds) ? `
    <div class="world-list">
      <h4>Known worlds</h4>
      ${item.worlds.map(world => `<article class="world-row">
        <span class="world-orbit">${esc(world.orbital_position)}</span>
        <div><strong>${esc(world.name)}</strong><p>Class ${esc(world.planet_class || '?')}${world.inhabited ? ` · Inhabited: ${esc(world.inhabited)}` : ''}</p></div>
      </article>`).join('')}
    </div>` : '';
  const provenanceBlock = provenance?.imported ? `
    <section class="provenance-panel">
      <div class="provenance-heading">
        <div><span class="provenance-kicker">SOURCE EVIDENCE</span><h4>${esc(provenance.source_records[0]?.source_id || 'Imported record')}</h4></div>
        <span class="card-badge badge-green">${esc(provenance.fields.length)} mapped fields</span>
      </div>
      <p class="provenance-meta">${esc(provenance.source_records[0]?.source_locator || '')} · ${esc(provenance.fields[0]?.transform_version || '')}</p>
      <div class="provenance-fields">${provenance.fields.map(field => `
        <span title="${esc(field.source_locator)}">${esc(field.field)}</span>`).join('')}</div>
      <p class="provenance-history">${esc(provenance.history_count)} provenance entries retained across import history.</p>
    </section>` : '';
  detailBody.innerHTML = `<div class="detail-grid">${rows}</div>${sections}${worlds}${provenanceBlock}`;
  const sourceOwned = Boolean(cfg.readOnly || provenance?.imported);
  detailEdit.classList.toggle('hidden', sourceOwned);
  detailDelete.classList.toggle('hidden', sourceOwned);
  detailOverlay.classList.remove('hidden');
}

function closeDetail() { detailOverlay.classList.add('hidden'); detailId = null; }
detailClose.addEventListener('click', closeDetail);
detailOverlay.addEventListener('click', e => { if (e.target === detailOverlay) closeDetail(); });

detailEdit.addEventListener('click', () => {
  const item = currentData.find(r => r.id === detailId);
  if (!item) return;
  closeDetail();
  openModal(item);
});

detailDelete.addEventListener('click', async () => {
  if (!confirm('Delete this entry?')) return;
  const cfg = SECTIONS[currentSection];
  try {
    await apiDelete(cfg.endpoint, detailId);
    showToast('Entry deleted.');
    closeDetail();
    await loadSection();
  } catch (err) {
    showToast(err.message, true);
  }
});

// ─── Utility ─────────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Boot ─────────────────────────────────────────────────────────────────
loadSection();
