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
  setupFilterListeners();
  filterAndDisplaySpells();
  filterAndDisplaySchools();
  filterAndDisplayEffects();
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
        tags: ["Контроль"],
        description: "Вы не можете перемещаться"
      }
    ];
  }
}

/**
 * Setup filter input listeners
 */
function setupFilterListeners() {
  // Spell filters
  ['spell-name', 'spell-rarity', 'spell-type', 'spell-source', 'spell-school'].forEach(id => {
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
  ['effect-name', 'effect-type', 'effect-tags'].forEach(id => {
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
  // Update tab buttons
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  event.target.classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

/**
 * Filter and display spells
 */
function filterAndDisplaySpells() {
  const nameFilter = document.getElementById('spell-name').value.toLowerCase();
  const rarityFilter = document.getElementById('spell-rarity').value;
  const typeFilter = document.getElementById('spell-type').value;
  const sourceFilter = document.getElementById('spell-source').value;
  const schoolFilter = document.getElementById('spell-school').value.toLowerCase();

  let filtered = spellsData.filter(spell => {
    if (nameFilter && !spell.name.toLowerCase().includes(nameFilter)) return false;
    if (rarityFilter && spell.rarity !== rarityFilter) return false;
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
      <td><strong>${spell.name}</strong></td>
      <td>${spell.school}</td>
      <td>${spell.type}</td>
      <td>${spell.source}</td>
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
  document.getElementById('spell-rarity').value = '';
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
  const propertiesFilter = document.getElementById('school-properties').value.toLowerCase();

  let filtered = schoolsData.filter(school => {
    if (nameFilter && !school.name.toLowerCase().includes(nameFilter)) return false;
    if (rarityFilter && school.rarity !== rarityFilter) return false;
    if (propertiesFilter) {
      const hasProperty = school.properties.some(prop => 
        prop.toLowerCase().includes(propertiesFilter)
      );
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
    tbody.innerHTML = '<tr><td colspan="4" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = schools.map(school => `
    <tr>
      <td><strong>${school.name}</strong></td>
      <td>${school.rarity}</td>
      <td>${school.properties.join(', ') || '—'}</td>
      <td>${school.description || '—'}</td>
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
  const tagsFilter = document.getElementById('effect-tags').value.toLowerCase();

  let filtered = effectsData.filter(effect => {
    if (nameFilter && !effect.name.toLowerCase().includes(nameFilter)) return false;
    if (typeFilter && effect.actionType !== typeFilter) return false;
    if (tagsFilter) {
      const hasTag = effect.tags.some(tag => 
        tag.toLowerCase().includes(tagsFilter)
      );
      if (!hasTag) return false;
    }
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
    tbody.innerHTML = '<tr><td colspan="4" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = effects.map(effect => `
    <tr>
      <td><strong>${effect.name}</strong></td>
      <td>${effect.actionType}</td>
      <td>${effect.tags.join(', ') || '—'}</td>
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
  document.getElementById('effect-tags').value = '';
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

