// Database JavaScript

// Data storage
let spellsData = [];
let schoolsData = [];
let effectsData = [];

// Sorting state
let currentSpellSort = { field: 'name', ascending: true };
let currentSchoolSort = { field: 'name', ascending: true };
let currentEffectSort = { field: 'name', ascending: true };

// Initialize database on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllData();
  
  // Check if we're viewing a specific item
  const urlParams = new URLSearchParams(window.location.search);
  const spellId = urlParams.get('spell');
  const schoolId = urlParams.get('school');
  const effectId = urlParams.get('effect');

  if (spellId) {
    showSpellPage(spellId);
  } else if (schoolId) {
    showSchoolPage(schoolId);
  } else if (effectId) {
    showEffectPage(effectId);
  } else {
    // Show database view
    setupFilterListeners();
    filterAndDisplaySpells();
    filterAndDisplaySchools();
    filterAndDisplayEffects();
  }
});

/**
 * Load all JSON data
 */
async function loadAllData() {
  await Promise.all([
    loadSpells(),
    loadSchools(),
    loadEffects()
  ]);
}

/**
 * Load spells data
 */
async function loadSpells() {
  try {
    const response = await fetch('./data/spells.json');
    spellsData = await response.json();
  } catch (error) {
    console.error('Error loading spells:', error);
    // Fallback data
    spellsData = [
      {
        id: "arcane-shot",
        name: "Выстрел Арканы",
        rarity: "Редкая",
        range: "Средняя",
        type: "Атака",
        school: "Базовая Аркана",
        source: "Учебное",
        actions: 1,
        damageTypes: ["Аркана"]
      }
    ];
  }
}

/**
 * Load schools data
 */
async function loadSchools() {
  try {
    const response = await fetch('./data/schools.json');
    schoolsData = await response.json();
  } catch (error) {
    console.error('Error loading schools:', error);
    // Fallback data
    schoolsData = [
      {
        id: "basic-arcana",
        name: "Базовая Аркана",
        rarity: "Редкая",
        properties: [],
        description: "Начальная школа магии"
      }
    ];
  }
}

/**
 * Load effects data
 */
async function loadEffects() {
  try {
    const response = await fetch('./data/effects.json');
    effectsData = await response.json();
  } catch (error) {
    console.error('Error loading effects:', error);
    // Fallback data
    effectsData = [
      {
        id: "immobilized",
        name: "Обездвижен",
        actionType: "Обычный",
        description: "Вы не можете перемещаться"
      }
    ];
  }
}

/**
 * Setup filter input listeners
 */
function setupFilterListeners() {
  // Spell filters (removed 'spell-rarity' as it doesn't exist in Obsidian)
  ['spell-name', 'spell-type', 'spell-source', 'spell-school'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', filterAndDisplaySpells);
    }
  });

  // School filters
  ['school-name', 'school-rarity', 'school-properties'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', filterAndDisplaySchools);
    }
  });

  // Effect filters
  ['effect-name', 'effect-type'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', filterAndDisplayEffects);
    }
  });
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
  // Show database view if it was hidden
  document.getElementById('databaseView').style.display = 'block';
  document.getElementById('detailView').style.display = 'none';
  
  // Update tab buttons
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(tab => {
    if (tab.textContent.toLowerCase().includes(tabName)) {
      tab.classList.add('active');
    }
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

/**
 * Filter and display spells
 */
function filterAndDisplaySpells() {
  const nameFilter = document.getElementById('spell-name').value.toLowerCase();
  const typeFilter = document.getElementById('spell-type').value;
  const sourceFilter = document.getElementById('spell-source').value;
  const schoolFilter = document.getElementById('spell-school').value.toLowerCase();

  let filtered = spellsData.filter(spell => {
    if (nameFilter && !spell.name.toLowerCase().includes(nameFilter)) return false;
    if (typeFilter && spell.type !== typeFilter) return false;
    if (sourceFilter && spell.source !== sourceFilter) return false;
    if (schoolFilter && !spell.school.toLowerCase().includes(schoolFilter)) return false;
    return true;
  });

  // Sort
  filtered = sortArray(filtered, currentSpellSort.field, currentSpellSort.ascending);

  displaySpells(filtered);
}

/**
 * Display spells in table
 */
function displaySpells(spells) {
  const tbody = document.getElementById('spells-results');
  const count = document.getElementById('spells-count');

  count.textContent = `${spells.length} ${getPlural(spells.length, 'заклинание', 'заклинания', 'заклинаний')}`;

  if (spells.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = spells.map(spell => `
    <tr>
      <td><strong><a href="db.html?spell=${spell.id}" style="color: var(--accent-emerald); text-decoration: none;">${spell.name}</a></strong></td>
      <td><a href="phb.html#schools" style="color: var(--text-secondary); text-decoration: none;">${spell.school}</a></td>
      <td>${spell.type}</td>
      <td><a href="phb.html#source-${spell.source === 'Учебное' ? 'educational' : 'signature'}" style="color: var(--text-secondary); text-decoration: none;">${spell.source}</a></td>
      <td>${spell.actions || '—'}</td>
      <td>${spell.range}</td>
    </tr>
  `).join('');
}

/**
 * Sort spells
 */
function sortSpells(field) {
  if (currentSpellSort.field === field) {
    currentSpellSort.ascending = !currentSpellSort.ascending;
  } else {
    currentSpellSort.field = field;
    currentSpellSort.ascending = true;
  }
  filterAndDisplaySpells();
}

/**
 * Clear spell filters
 */
function clearSpellFilters() {
  document.getElementById('spell-name').value = '';
  document.getElementById('spell-type').value = '';
  document.getElementById('spell-source').value = '';
  document.getElementById('spell-school').value = '';
  filterAndDisplaySpells();
}

/**
 * Filter and display schools
 */
function filterAndDisplaySchools() {
  const nameFilter = document.getElementById('school-name').value.toLowerCase();
  const rarityFilter = document.getElementById('school-rarity').value;
  const propertiesFilter = document.getElementById('school-properties').value;

  let filtered = schoolsData.filter(school => {
    if (nameFilter && !school.name.toLowerCase().includes(nameFilter)) return false;
    if (rarityFilter && school.rarity !== rarityFilter) return false;
    if (propertiesFilter) {
      // Exact match for property (now it's a select dropdown)
      const hasProperty = school.properties.some(prop => prop === propertiesFilter);
      if (!hasProperty) return false;
    }
    return true;
  });

  // Sort
  filtered = sortArray(filtered, currentSchoolSort.field, currentSchoolSort.ascending);

  displaySchools(filtered);
}

/**
 * Display schools in table
 */
function displaySchools(schools) {
  const tbody = document.getElementById('schools-results');
  const count = document.getElementById('schools-count');

  count.textContent = `${schools.length} ${getPlural(schools.length, 'школа', 'школы', 'школ')}`;

  if (schools.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = schools.map(school => `
    <tr>
      <td><strong><a href="db.html?school=${school.id}" style="color: var(--accent-emerald); text-decoration: none;">${school.name}</a></strong></td>
      <td><a href="phb.html#rarity-${getRarityId(school.rarity)}" style="color: var(--text-secondary); text-decoration: none;">${school.rarity}</a></td>
      <td>${school.properties.length > 0 ? school.properties.join(', ') : '—'}</td>
    </tr>
  `).join('');
}

/**
 * Sort schools
 */
function sortSchools(field) {
  if (currentSchoolSort.field === field) {
    currentSchoolSort.ascending = !currentSchoolSort.ascending;
  } else {
    currentSchoolSort.field = field;
    currentSchoolSort.ascending = true;
  }
  filterAndDisplaySchools();
}

/**
 * Clear school filters
 */
function clearSchoolFilters() {
  document.getElementById('school-name').value = '';
  document.getElementById('school-rarity').value = '';
  document.getElementById('school-properties').value = '';
  filterAndDisplaySchools();
}

/**
 * Filter and display effects
 */
function filterAndDisplayEffects() {
  const nameFilter = document.getElementById('effect-name').value.toLowerCase();
  const typeFilter = document.getElementById('effect-type').value;

  let filtered = effectsData.filter(effect => {
    if (nameFilter && !effect.name.toLowerCase().includes(nameFilter)) return false;
    if (typeFilter && effect.actionType !== typeFilter) return false;
    return true;
  });

  // Sort
  filtered = sortArray(filtered, currentEffectSort.field, currentEffectSort.ascending);

  displayEffects(filtered);
}

/**
 * Display effects in table
 */
function displayEffects(effects) {
  const tbody = document.getElementById('effects-results');
  const count = document.getElementById('effects-count');

  count.textContent = `${effects.length} ${getPlural(effects.length, 'эффект', 'эффекта', 'эффектов')}`;

  if (effects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = effects.map(effect => `
    <tr>
      <td><strong><a href="db.html?effect=${effect.id}" style="color: var(--accent-emerald); text-decoration: none;">${effect.name}</a></strong></td>
      <td>${effect.actionType}</td>
      <td>${effect.description || '—'}</td>
    </tr>
  `).join('');
}

/**
 * Sort effects
 */
function sortEffects(field) {
  if (currentEffectSort.field === field) {
    currentEffectSort.ascending = !currentEffectSort.ascending;
  } else {
    currentEffectSort.field = field;
    currentEffectSort.ascending = true;
  }
  filterAndDisplayEffects();
}

/**
 * Clear effect filters
 */
function clearEffectFilters() {
  document.getElementById('effect-name').value = '';
  document.getElementById('effect-type').value = '';
  filterAndDisplayEffects();
}

/**
 * Generic array sorting function
 */
function sortArray(array, field, ascending) {
  return array.sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    // Handle null/undefined
    if (valA == null) return 1;
    if (valB == null) return -1;

    // Convert to string for comparison
    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();

    if (valA < valB) return ascending ? -1 : 1;
    if (valA > valB) return ascending ? 1 : -1;
    return 0;
  });
}

/**
 * Get plural form for Russian words
 */
function getPlural(number, one, two, five) {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) return five;
  n %= 10;
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return two;
  return five;
}

/**
 * Convert school name to ID
 */
function getSchoolId(schoolName) {
  // Try to find exact match in schoolsData
  const school = schoolsData.find(s => s.name === schoolName);
  if (school) return school.id;
  
  // Fallback: convert name to ID format
  return schoolName.toLowerCase()
    .replace(/['\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Convert rarity to ID
 */
function getRarityId(rarity) {
  const rarityMap = {
    'Редкая': 'rare',
    'Эпическая': 'epic',
    'Скрытая': 'hidden'
  };
  return rarityMap[rarity] || 'rare';
}

/**
 * Show spell detail page
 */
function showSpellPage(spellId) {
  const spell = spellsData.find(s => s.id === spellId);
  if (!spell) {
    window.location.href = 'db.html';
    return;
  }

  document.getElementById('databaseView').style.display = 'none';
  document.getElementById('detailView').style.display = 'block';
  document.title = `${spell.name} — E'Magios Core`;

  const detailContent = document.getElementById('detailContent');
  
  // Build parameters list
  let parametersHTML = `
    <h2>Параметры</h2>
    <ul>
      <li><strong>Действие:</strong> ${spell.actionType || 'Действие'} (${spell.actions || '—'})</li>
      <li><strong>Дистанция:</strong> ${spell.range || '—'}</li>
      ${spell.target ? `<li><strong>Цель/Область:</strong> ${spell.target}</li>` : ''}
      <li><strong>Длительность:</strong> ${spell.duration || '—'}</li>
      ${spell.damageType ? `<li><strong>Тип урона:</strong> ${spell.damageType}</li>` : ''}
      ${spell.concentration ? `<li><strong>Концентрация:</strong> ${spell.concentration}${spell.maintenance ? `; <strong>Поддержание:</strong> ${spell.maintenance}` : ''}</li>` : ''}
      <li><strong>Школа Магии:</strong> <a href="db.html?school=${encodeURIComponent(spell.school)}" style="color: var(--accent-emerald); text-decoration: none;">${spell.school}</a></li>
      <li><strong>Источник Заклинания:</strong> ${spell.source}</li>
      <li><strong>Тип Заклинания:</strong> ${spell.type}</li>
      ${spell.trigger ? `<li><strong>Триггер:</strong> ${spell.trigger}</li>` : ''}
    </ul>
  `;
  
  detailContent.innerHTML = `
    <h1>${spell.name}</h1>
    
    ${parametersHTML}
    
    <h2>Описание</h2>
    <p>${spell.description || '—'}</p>
    
    <hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">
    <p class="text-muted">
      <strong>Связи:</strong> <a href="db.html?school=${encodeURIComponent(spell.school)}" style="color: var(--accent-emerald); text-decoration: none;">${spell.school}</a>, <a href="spellbook/intro.html" style="color: var(--accent-emerald); text-decoration: none;">Учебные заклинания</a>
    </p>
  `;
}

/**
 * Show school detail page
 */
function showSchoolPage(schoolId) {
  // Try to find by ID first, then by name
  let school = schoolsData.find(s => s.id === schoolId);
  if (!school) {
    school = schoolsData.find(s => s.name === schoolId);
  }
  
  if (!school) {
    // If not found, switch to schools tab and filter by name
    switchTab('schools');
    document.getElementById('school-name').value = schoolId;
    filterAndDisplaySchools();
    return;
  }

  document.getElementById('databaseView').style.display = 'none';
  document.getElementById('detailView').style.display = 'block';
  document.title = `${school.name} — E'Magios Core`;

  const detailContent = document.getElementById('detailContent');
  
  // Format description
  let descriptionHTML = '';
  if (school.description) {
    descriptionHTML = `
      <h2>Описание</h2>
      <p>${school.description}</p>
    `;
  }
  
  // Format principles if they exist
  let principlesHTML = '';
  if (school.principles && school.principles.length > 0) {
    principlesHTML = `
      <h2>Принципы</h2>
      <ul>
        ${school.principles.map(p => `<li>${p}</li>`).join('')}
      </ul>
    `;
  }
  
  // Format features if they exist
  let featuresHTML = '';
  if (school.features && school.features.length > 0) {
    featuresHTML = `
      <h2>Особенности</h2>
      <ul>
        ${school.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
    `;
  }
  
  // Format educational spells if they exist
  let spellsHTML = '';
  if (school.educationalSpells && school.educationalSpells.length > 0) {
    spellsHTML = `
      <h2>Учебные Заклинания</h2>
      <ul>
        ${school.educationalSpells.map(spell => `<li>${spell}</li>`).join('')}
      </ul>
    `;
  }
  
  // Format related schools (links)
  let linksHTML = '<a href="spellbook/schools.html" style="color: var(--accent-emerald); text-decoration: none;">Школы Магии</a>';
  if (school.relatedSchools && school.relatedSchools.length > 0) {
    const relatedLinks = school.relatedSchools.map(relatedName => {
      return `<a href="db.html?school=${encodeURIComponent(relatedName)}" style="color: var(--accent-emerald); text-decoration: none;">${relatedName}</a>`;
    }).join(', ');
    linksHTML = relatedLinks + ', ' + linksHTML;
  }
  
  detailContent.innerHTML = `
    <h1>${school.name}</h1>
    
    <h2>Параметры</h2>
    <ul>
      <li><strong>Редкость:</strong> <a href="spellbook/schools.html#rarity-${getRarityId(school.rarity)}" style="color: var(--accent-emerald); text-decoration: none;">${school.rarity}</a></li>
      ${school.properties && school.properties.length > 0 ? `<li><strong>Свойства:</strong> ${school.properties.join(', ')}</li>` : ''}
    </ul>
    
    ${descriptionHTML}
    ${principlesHTML}
    ${featuresHTML}
    ${spellsHTML}
    
    <hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">
    <p class="text-muted">
      <strong>Связи:</strong> ${linksHTML}
    </p>
  `;
}

/**
 * Show effect detail page
 */
function showEffectPage(effectId) {
  const effect = effectsData.find(e => e.id === effectId);
  if (!effect) {
    window.location.href = 'db.html';
    return;
  }

  document.getElementById('databaseView').style.display = 'none';
  document.getElementById('detailView').style.display = 'block';
  document.title = `${effect.name} — E'Magios Core`;

  const detailContent = document.getElementById('detailContent');
  detailContent.innerHTML = `
    <h1>${effect.name}</h1>
    
    <h2>Параметры</h2>
    <ul>
      <li><strong>Тип Действия:</strong> ${effect.actionType}</li>
    </ul>
    
    <h2>Описание</h2>
    <p>${effect.description || '—'}</p>
    
    <hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">
    <p class="text-muted">
      <strong>Связи:</strong> <a href="phb/conditions.html" style="color: var(--accent-emerald); text-decoration: none;">Эффекты</a>
    </p>
  `;
}

