// Database JavaScript

let spellsData = [];
let schoolsData = [];
let effectsData = [];
let archetypesData = [];
let actionsData = [];

let currentSpellSort = { field: 'name', ascending: true };
let currentSchoolSort = { field: 'name', ascending: true };
let currentEffectSort = { field: 'name', ascending: true };
let currentArchetypeSort = { field: 'name', ascending: true };
let currentActionSort = { field: 'name', ascending: true };

let spellFilters = {
  type: [],
  source: [],
  school: [],
  damage: [],
  concentration: []
};

let tempSpellFilters = {
  type: [],
  source: [],
  school: [],
  damage: [],
  concentration: []
};

let schoolFilters = {
  rarity: [],
  properties: [],
  difficulty: []
};

let tempSchoolFilters = {
  rarity: [],
  properties: [],
  difficulty: []
};

let effectFilters = {
  actionType: []
};

let tempEffectFilters = {
  actionType: []
};

function splitToArray(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split(',')
    .map(function (part) {
      return part.trim();
    })
    .filter(function (part) {
      return part.length > 0;
    });
}

function hasAny(values, selected) {
  if (!values || !values.length || !selected || !selected.length) {
    return false;
  }
  for (let i = 0; i < values.length; i += 1) {
    if (selected.indexOf(values[i]) !== -1) {
      return true;
    }
  }
  return false;
}

function formatDifficultyStars(value) {
  if (!value && value !== 0) {
    return '';
  }
  if (typeof value === 'string') {
    if (value.indexOf('★') !== -1) {
      return value;
    }
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      value = parsed;
    }
  }
  if (typeof value === 'number') {
    if (value < 1) {
      value = 1;
    }
    if (value > 5) {
      value = 5;
    }
    let stars = '';
    for (let i = 0; i < value; i += 1) {
      stars += '★';
    }
    return stars;
  }
  return '';
}

function collectSpellOptions(field, split) {
  const values = [];
  spellsData.forEach(function (spell) {
    const raw = spell[field];
    if (!raw) {
      return;
    }
    // Handle arrays (like damageType)
    let parts;
    if (Array.isArray(raw)) {
      parts = raw;
    } else {
      parts = split ? splitToArray(raw) : [String(raw).trim()];
    }
    parts.forEach(function (value) {
      if (value && values.indexOf(value) === -1) {
        values.push(value);
      }
    });
  });
  values.sort();
  return values;
}

function collectSchoolRarities() {
  const values = [];
  schoolsData.forEach(function (school) {
    if (school.rarity && values.indexOf(school.rarity) === -1) {
      values.push(school.rarity);
    }
  });
  values.sort();
  return values;
}

function collectSchoolProperties() {
  const values = [];
  schoolsData.forEach(function (school) {
    if (!school.properties || !school.properties.length) {
      return;
    }
    school.properties.forEach(function (property) {
      if (property && values.indexOf(property) === -1) {
        values.push(property);
      }
    });
  });
  values.sort();
  return values;
}

function collectSchoolDifficulties() {
  const values = [];
  schoolsData.forEach(function (school) {
    if (school.difficulty || school.difficulty === 0) {
      const stars = formatDifficultyStars(school.difficulty);
      if (stars && values.indexOf(stars) === -1) {
        values.push(stars);
      }
    }
  });
  values.sort(function (a, b) {
    return a.length - b.length;
  });
  return values;
}

function toggleFilterCategory(headerElement) {
  const category = headerElement.closest('.filter-category');
  if (category) {
    category.classList.toggle('collapsed');
  }
}

function selectAllInCategory(containerId, filterKey, filterObject) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  
  const tags = container.querySelectorAll('.filter-tag');
  tags.forEach(function (tag) {
    const value = tag.getAttribute('data-value');
    if (value && filterObject[filterKey].indexOf(value) === -1) {
      filterObject[filterKey].push(value);
      tag.classList.add('active');
    }
  });
}

function clearAllInCategory(containerId, filterKey, filterObject) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  
  filterObject[filterKey] = [];
  
  const tags = container.querySelectorAll('.filter-tag');
  tags.forEach(function (tag) {
    tag.classList.remove('active');
  });
}

function createFilterTags(containerId, options, filterCategory, filterObject) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  
  container.innerHTML = '';
  
  options.forEach(function (value) {
    const tag = document.createElement('div');
    tag.className = 'filter-tag';
    tag.textContent = value;
    tag.setAttribute('data-value', value);
    
    const isActive = filterObject[filterCategory].indexOf(value) !== -1;
    if (isActive) {
      tag.classList.add('active');
    }
    
    tag.addEventListener('click', function () {
      const index = filterObject[filterCategory].indexOf(value);
      if (index === -1) {
        filterObject[filterCategory].push(value);
        tag.classList.add('active');
      } else {
        filterObject[filterCategory].splice(index, 1);
        tag.classList.remove('active');
      }
    });
    
    container.appendChild(tag);
  });
}

document.addEventListener('DOMContentLoaded', async function () {
  await loadAllData();
  
  const urlParams = new URLSearchParams(window.location.search);
  const spellId = urlParams.get('spell');
  const schoolId = urlParams.get('school');
  const effectId = urlParams.get('effect');
  const archetypeId = urlParams.get('archetype');
  const actionId = urlParams.get('action');
  
  if (spellId) {
    showSpellPage(spellId);
  } else if (schoolId) {
    showSchoolPage(schoolId);
  } else if (effectId) {
    showEffectPage(effectId);
  } else if (archetypeId) {
    showArchetypePage(archetypeId);
  } else if (actionId) {
    showActionPage(actionId);
  } else {
    initializeDynamicFilters();
    loadFiltersFromSession();
    restoreActiveFilterTags();
    setupFilterListeners();
    
    // Restore active tab
    const savedTab = sessionStorage.getItem('db_activeTab');
    if (savedTab && ['spells', 'schools', 'archetypes', 'actions', 'effects'].indexOf(savedTab) !== -1) {
      switchTab(savedTab);
    }
    
    filterAndDisplaySpells();
    filterAndDisplaySchools();
    filterAndDisplayEffects();
    filterAndDisplayArchetypes();
    filterAndDisplayActions();
    
    updateClearButtonsVisibility();
  }
});

async function loadAllData() {
  await Promise.all([
    loadSpells(),
    loadSchools(),
    loadEffects(),
    loadArchetypes(),
    loadActions()
  ]);
}

async function loadSpells() {
  try {
    const response = await fetch('./data/spells.json', { cache: 'no-store' });
    spellsData = await response.json();
  } catch (error) {
    console.error('Error loading spells:', error);
    spellsData = [];
  }
}

async function loadSchools() {
  try {
    const response = await fetch('./data/schools.json', { cache: 'no-store' });
    schoolsData = await response.json();
  } catch (error) {
    console.error('Error loading schools:', error);
    schoolsData = [];
  }
}

async function loadEffects() {
  try {
    const response = await fetch('./data/effects.json', { cache: 'no-store' });
    effectsData = await response.json();
  } catch (error) {
    console.error('Error loading effects:', error);
    effectsData = [];
  }
}

async function loadArchetypes() {
  try {
    const response = await fetch('./data/archetypes.json', { cache: 'no-store' });
    archetypesData = await response.json();
  } catch (error) {
    console.error('Error loading archetypes:', error);
    archetypesData = [];
  }
}

async function loadActions() {
  try {
    const response = await fetch('./data/actions.json', { cache: 'no-store' });
    actionsData = await response.json();
  } catch (error) {
    console.error('Error loading actions:', error);
    actionsData = [];
  }
}

function initializeDynamicFilters() {
  const spellTypeOptions = collectSpellOptions('type', true);
  const spellSchoolOptions = collectSpellOptions('school', false);
  const spellDamageOptions = collectSpellOptions('damageType', true);
  const spellSourceOptions = ['Учебное', 'Фирменное'];
  const spellConcentrationOptions = ['Да', 'Нет'];

  createFilterTags('spell-type-tags', spellTypeOptions, 'type', tempSpellFilters);
  createFilterTags('spell-source-tags', spellSourceOptions, 'source', tempSpellFilters);
  createFilterTags('spell-school-tags', spellSchoolOptions, 'school', tempSpellFilters);
  createFilterTags('spell-damage-tags', spellDamageOptions, 'damage', tempSpellFilters);
  createFilterTags('spell-concentration-tags', spellConcentrationOptions, 'concentration', tempSpellFilters);

  const rarityOptions = collectSchoolRarities();
  const propertiesOptions = collectSchoolProperties();
  const difficultyOptions = collectSchoolDifficulties();

  createFilterTags('school-rarity-tags', rarityOptions, 'rarity', tempSchoolFilters);
  createFilterTags('school-properties-tags', propertiesOptions, 'properties', tempSchoolFilters);
  createFilterTags('school-difficulty-tags', difficultyOptions, 'difficulty', tempSchoolFilters);

  const effectTypeOptions = ['Обычный', 'Относительное'];
  createFilterTags('effect-type-tags', effectTypeOptions, 'actionType', tempEffectFilters);
}

function setupFilterListeners() {
  const spellName = document.getElementById('spell-name');
  if (spellName) {
    spellName.addEventListener('input', function() {
      saveFiltersToSession();
      filterAndDisplaySpells();
    });
  }

  const schoolName = document.getElementById('school-name');
  if (schoolName) {
    schoolName.addEventListener('input', function() {
      saveFiltersToSession();
      filterAndDisplaySchools();
    });
  }

  const effectName = document.getElementById('effect-name');
  if (effectName) {
    effectName.addEventListener('input', function() {
      saveFiltersToSession();
      filterAndDisplayEffects();
    });
  }

  const archetypeName = document.getElementById('archetype-name');
  if (archetypeName) {
    archetypeName.addEventListener('input', function() {
      saveFiltersToSession();
      filterAndDisplayArchetypes();
    });
  }

  const actionName = document.getElementById('action-name');
  if (actionName) {
    actionName.addEventListener('input', function() {
      saveFiltersToSession();
      filterAndDisplayActions();
    });
  }
}

function switchTab(tabName) {
  document.getElementById('databaseView').style.display = 'block';
  document.getElementById('detailView').style.display = 'none';
  
  const tabs = document.querySelectorAll('.tab');
  for (let i = 0; i < tabs.length; i += 1) {
    tabs[i].classList.remove('active');
    if (tabs[i].getAttribute('data-tab') === tabName) {
      tabs[i].classList.add('active');
    }
  }

  const tabContents = document.querySelectorAll('.tab-content');
  for (let i = 0; i < tabContents.length; i += 1) {
    tabContents[i].classList.remove('active');
  }

  const filtersPanels = document.querySelectorAll('.filters-panel');
  for (let i = 0; i < filtersPanels.length; i += 1) {
    filtersPanels[i].classList.remove('open');
  }

  const container = document.getElementById(tabName + '-tab');
  if (container) {
    container.classList.add('active');
  }
  
  // Save active tab to session
  try {
    sessionStorage.setItem('db_activeTab', tabName);
  } catch (e) {
    console.error('Failed to save active tab:', e);
  }
}

function toggleFiltersPanel(tabName) {
  const panel = document.getElementById(tabName + '-filters-panel');
  if (!panel) {
    return;
  }
  const isOpen = panel.classList.contains('open');
  closeFiltersPanel();
  if (!isOpen) {
    if (tabName === 'spells') {
      tempSpellFilters.type = spellFilters.type.slice();
      tempSpellFilters.source = spellFilters.source.slice();
      tempSpellFilters.school = spellFilters.school.slice();
      tempSpellFilters.damage = spellFilters.damage.slice();
      tempSpellFilters.concentration = spellFilters.concentration.slice();
      
      document.querySelectorAll('#spells-filters-panel .filter-tag').forEach(function (tag) {
        const value = tag.getAttribute('data-value');
        const categoryElement = tag.closest('.filter-category');
        const categoryName = categoryElement ? categoryElement.getAttribute('data-category') : null;
        
        let isActive = false;
        if (categoryName === 'type') {
          isActive = tempSpellFilters.type.indexOf(value) !== -1;
        } else if (categoryName === 'source') {
          isActive = tempSpellFilters.source.indexOf(value) !== -1;
        } else if (categoryName === 'school') {
          isActive = tempSpellFilters.school.indexOf(value) !== -1;
        } else if (categoryName === 'damage') {
          isActive = tempSpellFilters.damage.indexOf(value) !== -1;
        } else if (categoryName === 'concentration') {
          isActive = tempSpellFilters.concentration.indexOf(value) !== -1;
        }
        
        if (isActive) {
          tag.classList.add('active');
        } else {
          tag.classList.remove('active');
        }
      });
    } else if (tabName === 'schools') {
      tempSchoolFilters.rarity = schoolFilters.rarity.slice();
      tempSchoolFilters.properties = schoolFilters.properties.slice();
      tempSchoolFilters.difficulty = schoolFilters.difficulty.slice();
      
      document.querySelectorAll('#schools-filters-panel .filter-tag').forEach(function (tag) {
        const value = tag.getAttribute('data-value');
        const categoryElement = tag.closest('.filter-category');
        const categoryName = categoryElement ? categoryElement.getAttribute('data-category') : null;
        
        let isActive = false;
        if (categoryName === 'rarity') {
          isActive = tempSchoolFilters.rarity.indexOf(value) !== -1;
        } else if (categoryName === 'properties') {
          isActive = tempSchoolFilters.properties.indexOf(value) !== -1;
        } else if (categoryName === 'difficulty') {
          isActive = tempSchoolFilters.difficulty.indexOf(value) !== -1;
        }
        
        if (isActive) {
          tag.classList.add('active');
        } else {
          tag.classList.remove('active');
        }
      });
    } else if (tabName === 'effects') {
      tempEffectFilters.actionType = effectFilters.actionType.slice();
      
      document.querySelectorAll('#effects-filters-panel .filter-tag').forEach(function (tag) {
        const value = tag.getAttribute('data-value');
        const isActive = tempEffectFilters.actionType.indexOf(value) !== -1;
        
        if (isActive) {
          tag.classList.add('active');
        } else {
          tag.classList.remove('active');
        }
      });
    }
    
    panel.classList.add('open');
  }
}

function closeFiltersPanel() {
  document.querySelectorAll('.filters-panel').forEach(function (p) {
    p.classList.remove('open');
  });
}

function filterAndDisplaySpells() {
  const nameElement = document.getElementById('spell-name');
  const nameFilter = nameElement ? nameElement.value.toLowerCase() : '';

  let filtered = spellsData.filter(function (spell) {
    if (nameFilter && (!spell.name || spell.name.toLowerCase().indexOf(nameFilter) === -1)) {
      return false;
    }

    if (spellFilters.type.length) {
      const spellTypes = splitToArray(spell.type);
      if (!hasAny(spellTypes, spellFilters.type)) {
        return false;
      }
    }

    if (spellFilters.source.length) {
      const spellSource = spell.source || '';
      if (spellFilters.source.indexOf(spellSource) === -1) {
        return false;
      }
    }

    if (spellFilters.school.length) {
      const schoolName = spell.school || '';
      if (spellFilters.school.indexOf(schoolName) === -1) {
        return false;
      }
    }

    if (spellFilters.damage.length) {
      const damages = Array.isArray(spell.damageType) ? spell.damageType : splitToArray(spell.damageType);
      if (!hasAny(damages, spellFilters.damage)) {
        return false;
      }
    }

    if (spellFilters.concentration.length) {
      const hasConcentration = spell.concentration === 'Да';
      const needsConcentration = spellFilters.concentration.indexOf('Да') !== -1;
      const needsNoConcentration = spellFilters.concentration.indexOf('Нет') !== -1;
      
      if (needsConcentration && needsNoConcentration) {
        return true;
      }
      if (needsConcentration && !hasConcentration) {
        return false;
      }
      if (needsNoConcentration && hasConcentration) {
        return false;
      }
    }

    return true;
  });

  filtered = sortArray(filtered, currentSpellSort.field, currentSpellSort.ascending);
  displaySpells(filtered);
}

function displaySpells(spells) {
  const tbody = document.getElementById('spells-results');
  const count = document.getElementById('spells-count');

  count.textContent = `${spells.length} ${getPlural(spells.length, 'заклинание', 'заклинания', 'заклинаний')}`;

  if (!spells.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = spells
    .map(function (spell) {
      const schoolName = spell.school || '';
      const source = spell.source || '';
      const type = spell.type || '';
      const schoolLink = schoolName
        ? `<a href="db.html?school=${encodeURIComponent(schoolName)}" style="color: var(--accent-emerald); text-decoration: none;">${schoolName}</a>`
        : '—';
      const sourceLink = source
        ? `<a href="phb.html#source-${source === 'Учебное' ? 'educational' : 'signature'}" style="color: var(--text-secondary); text-decoration: none;">${source}</a>`
        : '—';
      const hasSubSpells = spell.subSpells && spell.subSpells.length > 0;
      const subSpellIndicator = hasSubSpells 
        ? ` <span style="color: var(--text-muted); font-size: 0.8em;" title="Имеет ${spell.subSpells.length} вариантов использования">[+${spell.subSpells.length}]</span>` 
        : '';
      return (
        '<tr>' +
        `<td><strong><a href="db.html?spell=${spell.id}" style="color: var(--accent-emerald); text-decoration: none;">${spell.name}</a></strong>${subSpellIndicator}</td>` +
        `<td>${schoolLink}</td>` +
        `<td>${type || '—'}</td>` +
        `<td>${sourceLink}</td>` +
        '</tr>'
      );
    })
    .join('');
}

function sortSpells(field) {
  if (currentSpellSort.field === field) {
    currentSpellSort.ascending = !currentSpellSort.ascending;
  } else {
    currentSpellSort.field = field;
    currentSpellSort.ascending = true;
  }
  filterAndDisplaySpells();
  saveFiltersToSession();
}

function clearSpellFilters() {
  tempSpellFilters.type = [];
  tempSpellFilters.source = [];
  tempSpellFilters.school = [];
  tempSpellFilters.damage = [];
  tempSpellFilters.concentration = [];
  
  document.querySelectorAll('#spells-filters-panel .filter-tag.active').forEach(function (tag) {
    tag.classList.remove('active');
  });
}

function applySpellFilters() {
  spellFilters.type = tempSpellFilters.type.slice();
  spellFilters.source = tempSpellFilters.source.slice();
  spellFilters.school = tempSpellFilters.school.slice();
  spellFilters.damage = tempSpellFilters.damage.slice();
  spellFilters.concentration = tempSpellFilters.concentration.slice();
  
  saveFiltersToSession();
  filterAndDisplaySpells();
  updateClearButtonsVisibility();
  closeFiltersPanel();
}

function cancelSpellFilters() {
  tempSpellFilters.type = spellFilters.type.slice();
  tempSpellFilters.source = spellFilters.source.slice();
  tempSpellFilters.school = spellFilters.school.slice();
  tempSpellFilters.damage = spellFilters.damage.slice();
  tempSpellFilters.concentration = spellFilters.concentration.slice();
  
  document.querySelectorAll('#spells-filters-panel .filter-tag').forEach(function (tag) {
    const value = tag.getAttribute('data-value');
    const categoryElement = tag.closest('.filter-category');
    const categoryName = categoryElement ? categoryElement.getAttribute('data-category') : null;
    
    let isActive = false;
    if (categoryName === 'type') {
      isActive = tempSpellFilters.type.indexOf(value) !== -1;
    } else if (categoryName === 'source') {
      isActive = tempSpellFilters.source.indexOf(value) !== -1;
    } else if (categoryName === 'school') {
      isActive = tempSpellFilters.school.indexOf(value) !== -1;
    } else if (categoryName === 'damage') {
      isActive = tempSpellFilters.damage.indexOf(value) !== -1;
    } else if (categoryName === 'concentration') {
      isActive = tempSpellFilters.concentration.indexOf(value) !== -1;
    }
    
    if (isActive) {
      tag.classList.add('active');
    } else {
      tag.classList.remove('active');
    }
  });
  
  closeFiltersPanel();
}

function filterAndDisplaySchools() {
  const nameElement = document.getElementById('school-name');
  const nameFilter = nameElement ? nameElement.value.toLowerCase() : '';

  let filtered = schoolsData.filter(function (school) {
    if (nameFilter && (!school.name || school.name.toLowerCase().indexOf(nameFilter) === -1)) {
      return false;
    }

    if (schoolFilters.rarity.length && (!school.rarity || schoolFilters.rarity.indexOf(school.rarity) === -1)) {
      return false;
    }

    if (schoolFilters.properties.length) {
      const properties = school.properties || [];
      if (!hasAny(properties, schoolFilters.properties)) {
        return false;
      }
    }

    if (schoolFilters.difficulty.length) {
      if (!school.difficulty && school.difficulty !== 0) {
        return false;
      }
      const stars = formatDifficultyStars(school.difficulty);
      if (!stars || schoolFilters.difficulty.indexOf(stars) === -1) {
        return false;
      }
    }

    return true;
  });

  filtered = sortArray(filtered, currentSchoolSort.field, currentSchoolSort.ascending);
  displaySchools(filtered);
}

function displaySchools(schools) {
  const tbody = document.getElementById('schools-results');
  const count = document.getElementById('schools-count');

  count.textContent = `${schools.length} ${getPlural(schools.length, 'школа', 'школы', 'школ')}`;

  if (!schools.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = schools
    .map(function (school) {
      const rarityLink = school.rarity
        ? `<a href="phb.html#rarity-${getRarityId(school.rarity)}" style="color: var(--text-secondary); text-decoration: none;">${school.rarity}</a>`
        : '—';
      const propertiesText = school.properties && school.properties.length
        ? school.properties
            .map(function (property) {
              return linkifySchoolProperty(property);
            })
            .join(', ')
        : '—';
      const difficultyText = formatDifficultyStars(school.difficulty);
      return (
        '<tr>' +
        `<td><strong><a href="db.html?school=${school.id}" style="color: var(--accent-emerald); text-decoration: none;">${school.name}</a></strong></td>` +
        `<td>${rarityLink}</td>` +
        `<td>${difficultyText || '—'}</td>` +
        `<td>${propertiesText}</td>` +
        '</tr>'
      );
    })
    .join('');
}

function sortSchools(field) {
  if (currentSchoolSort.field === field) {
    currentSchoolSort.ascending = !currentSchoolSort.ascending;
  } else {
    currentSchoolSort.field = field;
    currentSchoolSort.ascending = true;
  }
  filterAndDisplaySchools();
  saveFiltersToSession();
}

function clearSchoolFilters() {
  tempSchoolFilters.rarity = [];
  tempSchoolFilters.properties = [];
  tempSchoolFilters.difficulty = [];
  
  document.querySelectorAll('#schools-filters-panel .filter-tag.active').forEach(function (tag) {
    tag.classList.remove('active');
  });
}

function applySchoolFilters() {
  schoolFilters.rarity = tempSchoolFilters.rarity.slice();
  schoolFilters.properties = tempSchoolFilters.properties.slice();
  schoolFilters.difficulty = tempSchoolFilters.difficulty.slice();
  
  saveFiltersToSession();
  filterAndDisplaySchools();
  updateClearButtonsVisibility();
  closeFiltersPanel();
}

function cancelSchoolFilters() {
  tempSchoolFilters.rarity = schoolFilters.rarity.slice();
  tempSchoolFilters.properties = schoolFilters.properties.slice();
  tempSchoolFilters.difficulty = schoolFilters.difficulty.slice();
  
  document.querySelectorAll('#schools-filters-panel .filter-tag').forEach(function (tag) {
    const value = tag.getAttribute('data-value');
    const categoryElement = tag.closest('.filter-category');
    const categoryName = categoryElement ? categoryElement.getAttribute('data-category') : null;
    
    let isActive = false;
    if (categoryName === 'rarity') {
      isActive = tempSchoolFilters.rarity.indexOf(value) !== -1;
    } else if (categoryName === 'properties') {
      isActive = tempSchoolFilters.properties.indexOf(value) !== -1;
    } else if (categoryName === 'difficulty') {
      isActive = tempSchoolFilters.difficulty.indexOf(value) !== -1;
    }
    
    if (isActive) {
      tag.classList.add('active');
    } else {
      tag.classList.remove('active');
    }
  });
  
  closeFiltersPanel();
}

function filterAndDisplayEffects() {
  const nameElement = document.getElementById('effect-name');
  const nameFilter = nameElement ? nameElement.value.toLowerCase() : '';

  let filtered = effectsData.filter(function (effect) {
    if (nameFilter && (!effect.name || effect.name.toLowerCase().indexOf(nameFilter) === -1)) {
      return false;
    }
    
    if (effectFilters.actionType.length) {
      const effectType = effect.actionType || '';
      if (effectFilters.actionType.indexOf(effectType) === -1) {
        return false;
      }
    }
    
    return true;
  });

  filtered = sortArray(filtered, currentEffectSort.field, currentEffectSort.ascending);
  displayEffects(filtered);
}

function displayEffects(effects) {
  const tbody = document.getElementById('effects-results');
  const count = document.getElementById('effects-count');

  count.textContent = effects.length + ' ' + getPlural(effects.length, 'эффект', 'эффекта', 'эффектов');

  if (!effects.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = effects
    .map(function (effect) {
      const actionType = effect.actionType || '—';
      const description = effect.description || '—';
      return (
        '<tr>' +
        '<td><strong><a href="db.html?effect=' + effect.id + '" style="color: var(--accent-emerald); text-decoration: none;">' + effect.name + '</a></strong></td>' +
        '<td>' + actionType + '</td>' +
        '<td>' + description + '</td>' +
        '</tr>'
      );
    })
    .join('');
}

function renderSpellDescription(text) {
  if (!text) {
    return '<p>—</p>';
  }
  const paragraphs = text.split(/\n{2,}/);
  const safeParagraphs = paragraphs
    .map(function (p) {
      return p.trim();
    })
    .filter(function (p) {
      return p.length > 0;
    });
  if (!safeParagraphs.length) {
    return '<p>—</p>';
  }
  return safeParagraphs
    .map(function (p) {
      return '<p>' + p + '</p>';
    })
    .join('');
}

function formatActionLabel(actionType) {
  const style = 'style="color: var(--accent-emerald); text-decoration: none;"';
  if (actionType === 'Реакция') {
    return '<a href="phb/combat.html#реакции" ' + style + '>Реакция</a>';
  }
  return '<a href="phb/combat.html#действия-в-ходу" ' + style + '>Действие</a>';
}

function linkifyDistance(value) {
  if (!value) {
    return '—';
  }
  const text = String(value).trim();
  const style = 'style="color: var(--accent-emerald); text-decoration: none;"';
  const base = 'phb/abstract-categories.html';

  // Стандартные дистанции
  if (text === 'Близкая' || text === 'Малая' || text === 'Средняя' || text === 'Дальняя') {
    return '<a href="' + base + '#категории-дальности" ' + style + '>' + text + '</a>';
  }

  // Области
  if (text.indexOf('область') !== -1 || text.indexOf('Область') !== -1) {
    return '<a href="' + base + '#категории-областей" ' + style + '>' + text + '</a>';
  }

  return text;
}

function linkifyResources(value) {
  if (!value) {
    return '';
  }
  const style = 'style="color: var(--accent-emerald); text-decoration: none;"';
  return String(value).replace(/Воля/g, '<a href="phb/combat.html#воля" ' + style + '>Воля</a>');
}

function linkifySchoolProperty(property) {
  if (!property) {
    return '';
  }
  const style = 'style="color: var(--accent-emerald); text-decoration: none;"';
  if (property === 'Конклав') {
    return '<a href="spellbook/schools.html#property-conclave" ' + style + '>' + property + '</a>';
  }
  if (property === 'Часть Конклава') {
    return '<a href="spellbook/schools.html#property-conclave-part" ' + style + '>' + property + '</a>';
  }
  if (property === 'Запретная') {
    return '<a href="spellbook/schools.html#property-forbidden" ' + style + '>' + property + '</a>';
  }
  if (property === 'Вспомогательная') {
    return '<a href="spellbook/schools.html#property-support" ' + style + '>' + property + '</a>';
  }
  return property;
}

function linkifySchoolText(text) {
  if (!text) {
    return '';
  }
  const style = 'style="color: var(--accent-emerald); text-decoration: none;"';
  let result = text;

  result = result.replace(/Концентраци(я|и|ю|ей)/g, function (match, ending) {
    return '<a href="phb/combat.html#концентрация" ' + style + '>' + 'Концентраци' + ending + '</a>';
  });

  result = result.replace(/Воля/g, '<a href="phb/combat.html#воля" ' + style + '>Воля</a>');

  result = result.replace(/Всплеск(а|ом|у|е)?/g, function (match) {
    return '<a href="phb/effects.html" ' + style + '>' + match + '</a>';
  });

  return result;
}

function sortEffects(field) {
  if (currentEffectSort.field === field) {
    currentEffectSort.ascending = !currentEffectSort.ascending;
  } else {
    currentEffectSort.field = field;
    currentEffectSort.ascending = true;
  }
  filterAndDisplayEffects();
  saveFiltersToSession();
}

function clearEffectFilters() {
  tempEffectFilters.actionType = [];
  
  document.querySelectorAll('#effects-filters-panel .filter-tag.active').forEach(function (tag) {
    tag.classList.remove('active');
  });
}

function applyEffectFilters() {
  effectFilters.actionType = tempEffectFilters.actionType.slice();
  
  saveFiltersToSession();
  filterAndDisplayEffects();
  updateClearButtonsVisibility();
  closeFiltersPanel();
}

function cancelEffectFilters() {
  tempEffectFilters.actionType = effectFilters.actionType.slice();
  
  document.querySelectorAll('#effects-filters-panel .filter-tag').forEach(function (tag) {
    const value = tag.getAttribute('data-value');
    const isActive = tempEffectFilters.actionType.indexOf(value) !== -1;
    
    if (isActive) {
      tag.classList.add('active');
    } else {
      tag.classList.remove('active');
    }
  });
  
  closeFiltersPanel();
}

function sortArray(array, field, ascending) {
  return array.sort(function (a, b) {
    let valA = a[field];
    let valB = b[field];

    if (valA == null) {
      return 1;
    }
    if (valB == null) {
      return -1;
    }

    // Special handling for difficulty - sort numerically
    if (field === 'difficulty') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      if (valA < valB) {
        return ascending ? -1 : 1;
      }
      if (valA > valB) {
        return ascending ? 1 : -1;
      }
      return 0;
    }

    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();

    if (valA < valB) {
      return ascending ? -1 : 1;
    }
    if (valA > valB) {
      return ascending ? 1 : -1;
    }
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
 * Restore active filter tags visual state
 */
function restoreActiveFilterTags() {
  // Restore spell filter tags
  document.querySelectorAll('#spell-type-tags .filter-tag').forEach(function (tag) {
    if (spellFilters.type.indexOf(tag.textContent) !== -1) {
      tag.classList.add('active');
    }
  });
  document.querySelectorAll('#spell-source-tags .filter-tag').forEach(function (tag) {
    if (spellFilters.source.indexOf(tag.textContent) !== -1) {
      tag.classList.add('active');
    }
  });
  document.querySelectorAll('#spell-school-tags .filter-tag').forEach(function (tag) {
    if (spellFilters.school.indexOf(tag.textContent) !== -1) {
      tag.classList.add('active');
    }
  });
  document.querySelectorAll('#spell-damage-tags .filter-tag').forEach(function (tag) {
    if (spellFilters.damage.indexOf(tag.textContent) !== -1) {
      tag.classList.add('active');
    }
  });
  document.querySelectorAll('#spell-concentration-tags .filter-tag').forEach(function (tag) {
    if (spellFilters.concentration.indexOf(tag.textContent) !== -1) {
      tag.classList.add('active');
    }
  });
  
  // Restore school filter tags
  document.querySelectorAll('#school-rarity-tags .filter-tag').forEach(function (tag) {
    if (schoolFilters.rarity.indexOf(tag.textContent) !== -1) {
      tag.classList.add('active');
    }
  });
  document.querySelectorAll('#school-properties-tags .filter-tag').forEach(function (tag) {
    if (schoolFilters.properties.indexOf(tag.textContent) !== -1) {
      tag.classList.add('active');
    }
  });
  document.querySelectorAll('#school-difficulty-tags .filter-tag').forEach(function (tag) {
    if (schoolFilters.difficulty.indexOf(tag.textContent) !== -1) {
      tag.classList.add('active');
    }
  });
  
  // Restore effect filter tags
  document.querySelectorAll('#effect-type-tags .filter-tag').forEach(function (tag) {
    if (effectFilters.actionType.indexOf(tag.textContent) !== -1) {
      tag.classList.add('active');
    }
  });
}

/**
 * Save filters to sessionStorage
 */
function saveFiltersToSession() {
  try {
    sessionStorage.setItem('db_spellFilters', JSON.stringify(spellFilters));
    sessionStorage.setItem('db_schoolFilters', JSON.stringify(schoolFilters));
    sessionStorage.setItem('db_effectFilters', JSON.stringify(effectFilters));
    sessionStorage.setItem('db_spellSort', JSON.stringify(currentSpellSort));
    sessionStorage.setItem('db_schoolSort', JSON.stringify(currentSchoolSort));
    sessionStorage.setItem('db_effectSort', JSON.stringify(currentEffectSort));
    sessionStorage.setItem('db_archetypeSort', JSON.stringify(currentArchetypeSort));
    sessionStorage.setItem('db_actionSort', JSON.stringify(currentActionSort));
    
    // Save search inputs
    const spellName = document.getElementById('spell-name');
    const schoolName = document.getElementById('school-name');
    const effectName = document.getElementById('effect-name');
    const archetypeName = document.getElementById('archetype-name');
    const actionName = document.getElementById('action-name');
    
    if (spellName) sessionStorage.setItem('db_spellName', spellName.value);
    if (schoolName) sessionStorage.setItem('db_schoolName', schoolName.value);
    if (effectName) sessionStorage.setItem('db_effectName', effectName.value);
    if (archetypeName) sessionStorage.setItem('db_archetypeName', archetypeName.value);
    if (actionName) sessionStorage.setItem('db_actionName', actionName.value);
  } catch (e) {
    console.error('Failed to save filters:', e);
  }
}

/**
 * Load filters from sessionStorage
 */
function loadFiltersFromSession() {
  try {
    const savedSpellFilters = sessionStorage.getItem('db_spellFilters');
    const savedSchoolFilters = sessionStorage.getItem('db_schoolFilters');
    const savedEffectFilters = sessionStorage.getItem('db_effectFilters');
    const savedSpellSort = sessionStorage.getItem('db_spellSort');
    const savedSchoolSort = sessionStorage.getItem('db_schoolSort');
    const savedEffectSort = sessionStorage.getItem('db_effectSort');
    const savedArchetypeSort = sessionStorage.getItem('db_archetypeSort');
    const savedActionSort = sessionStorage.getItem('db_actionSort');
    
    if (savedSpellFilters) {
      const parsed = JSON.parse(savedSpellFilters);
      spellFilters.type = parsed.type || [];
      spellFilters.source = parsed.source || [];
      spellFilters.school = parsed.school || [];
      spellFilters.damage = parsed.damage || [];
      spellFilters.concentration = parsed.concentration || [];
      
      // Copy to temp filters
      tempSpellFilters.type = spellFilters.type.slice();
      tempSpellFilters.source = spellFilters.source.slice();
      tempSpellFilters.school = spellFilters.school.slice();
      tempSpellFilters.damage = spellFilters.damage.slice();
      tempSpellFilters.concentration = spellFilters.concentration.slice();
    }
    
    if (savedSchoolFilters) {
      const parsed = JSON.parse(savedSchoolFilters);
      schoolFilters.rarity = parsed.rarity || [];
      schoolFilters.properties = parsed.properties || [];
      schoolFilters.difficulty = parsed.difficulty || [];
      
      // Copy to temp filters
      tempSchoolFilters.rarity = schoolFilters.rarity.slice();
      tempSchoolFilters.properties = schoolFilters.properties.slice();
      tempSchoolFilters.difficulty = schoolFilters.difficulty.slice();
    }
    
    if (savedEffectFilters) {
      const parsed = JSON.parse(savedEffectFilters);
      effectFilters.actionType = parsed.actionType || [];
      
      // Copy to temp filters
      tempEffectFilters.actionType = effectFilters.actionType.slice();
    }

    if (savedSpellSort) {
      const parsedSort = JSON.parse(savedSpellSort);
      if (parsedSort.field) {
        currentSpellSort.field = parsedSort.field;
      }
      if (typeof parsedSort.ascending === 'boolean') {
        currentSpellSort.ascending = parsedSort.ascending;
      }
    }

    if (savedSchoolSort) {
      const parsedSort = JSON.parse(savedSchoolSort);
      if (parsedSort.field) {
        currentSchoolSort.field = parsedSort.field;
      }
      if (typeof parsedSort.ascending === 'boolean') {
        currentSchoolSort.ascending = parsedSort.ascending;
      }
    }

    if (savedEffectSort) {
      const parsedSort = JSON.parse(savedEffectSort);
      if (parsedSort.field) {
        currentEffectSort.field = parsedSort.field;
      }
      if (typeof parsedSort.ascending === 'boolean') {
        currentEffectSort.ascending = parsedSort.ascending;
      }
    }

    if (savedArchetypeSort) {
      const parsedSort = JSON.parse(savedArchetypeSort);
      if (parsedSort.field) {
        currentArchetypeSort.field = parsedSort.field;
      }
      if (typeof parsedSort.ascending === 'boolean') {
        currentArchetypeSort.ascending = parsedSort.ascending;
      }
    }

    if (savedActionSort) {
      const parsedSort = JSON.parse(savedActionSort);
      if (parsedSort.field) {
        currentActionSort.field = parsedSort.field;
      }
      if (typeof parsedSort.ascending === 'boolean') {
        currentActionSort.ascending = parsedSort.ascending;
      }
    }
    
    // Restore search inputs
    const spellName = document.getElementById('spell-name');
    const schoolName = document.getElementById('school-name');
    const effectName = document.getElementById('effect-name');
    const archetypeName = document.getElementById('archetype-name');
    const actionName = document.getElementById('action-name');
    
    if (spellName) spellName.value = sessionStorage.getItem('db_spellName') || '';
    if (schoolName) schoolName.value = sessionStorage.getItem('db_schoolName') || '';
    if (effectName) effectName.value = sessionStorage.getItem('db_effectName') || '';
    if (archetypeName) archetypeName.value = sessionStorage.getItem('db_archetypeName') || '';
    if (actionName) actionName.value = sessionStorage.getItem('db_actionName') || '';
  } catch (e) {
    console.error('Failed to load filters:', e);
  }
}

/**
 * Convert school name to ID
 */
function getSchoolId(schoolName) {
  const school = schoolsData.find(function (s) {
    return s.name === schoolName;
  });
  if (school) {
    return school.id;
  }
  
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
  const spell = spellsData.find(function (s) {
    return s.id === spellId;
  });
  if (!spell) {
    window.location.href = 'db.html';
    return;
  }

  document.getElementById('databaseView').style.display = 'none';
  document.getElementById('detailView').style.display = 'block';
  document.title = spell.name + ' — E\'Magios Core';

  const detailContent = document.getElementById('detailContent');
  
  let parametersHTML = '<h2>Параметры</h2><ul>';
  const actionLabel = formatActionLabel(spell.actionType || 'Действие');
  parametersHTML += '<li><strong>Действие:</strong> ' + actionLabel + ' (' + (spell.actions || '—') + ')</li>';
  
  if (spell.resources) {
    parametersHTML += '<li><strong>Ресурсы:</strong> ' + linkifyResources(spell.resources) + '</li>';
  }
  
  parametersHTML += '<li><strong>Дистанция:</strong> ' + linkifyDistance(spell.range || '—') + '</li>';
  
  if (spell.target) {
    parametersHTML += '<li><strong>Цель/Область:</strong> ' + linkifyDistance(spell.target) + '</li>';
  }
  
  parametersHTML += '<li><strong>Длительность:</strong> ' + (spell.duration || '—') + '</li>';
  
  if (spell.damageType && (Array.isArray(spell.damageType) ? spell.damageType.length : true)) {
    let damageText = Array.isArray(spell.damageType) ? spell.damageType.join(', ') : spell.damageType;
    if (spell.damageTypeNote) {
      damageText += ' (' + spell.damageTypeNote + ')';
    }
    parametersHTML += '<li><strong>Тип урона:</strong> ' + damageText + '</li>';
  }
  
  if (spell.concentration) {
    const style = 'style="color: var(--accent-emerald); text-decoration: none;"';
    const concLink = '<a href="phb/combat.html#концентрация" ' + style + '>' + spell.concentration + '</a>';
    parametersHTML += '<li><strong>Концентрация:</strong> ' + concLink;
    if (spell.maintenance) {
      parametersHTML += '; <strong>Поддержание:</strong> ' + spell.maintenance;
    }
    parametersHTML += '</li>';
  }
  
  parametersHTML += '<li><strong>Школа Магии:</strong> <a href="db.html?school=' + encodeURIComponent(spell.school) + '" style="color: var(--accent-emerald); text-decoration: none;">' + spell.school + '</a></li>';
  parametersHTML += '<li><strong>Источник Заклинания:</strong> ' + spell.source + '</li>';
  
  if (spell.supportMagic) {
    parametersHTML += '<li><strong>Вспомогательная Магия:</strong> ' + spell.supportMagic + '</li>';
  }
  
  parametersHTML += '<li><strong>Тип Действия:</strong> ' + spell.type + '</li>';
  
  if (spell.trigger) {
    parametersHTML += '<li><strong>Триггер:</strong> ' + spell.trigger + '</li>';
  }
  
  parametersHTML += '</ul>';
  
  let subSpellsHTML = '';
  if (spell.subSpells && spell.subSpells.length > 0) {
    subSpellsHTML = '<h2>Варианты использования</h2>';
    spell.subSpells.forEach(function(subSpell) {
      subSpellsHTML += '<div style="margin-bottom: var(--spacing-lg); padding: var(--spacing-md); background: rgba(42, 42, 42, 0.4); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">';
      subSpellsHTML += '<h3 style="margin-top: 0; color: var(--accent-emerald);">' + subSpell.name + '</h3>';
      
      if (subSpell.actions || subSpell.range || subSpell.target || subSpell.duration || subSpell.damageType || subSpell.type) {
        subSpellsHTML += '<h4 style="margin-top: var(--spacing-md); margin-bottom: var(--spacing-sm); font-size: 1.1em;">Параметры</h4>';
        subSpellsHTML += '<ul style="margin: 0; font-size: 0.95em;">';
        
        if (subSpell.actions) {
          const subActionLabel = formatActionLabel(subSpell.actionType || 'Действие');
          subSpellsHTML += '<li><strong>Действие:</strong> ' + subActionLabel + ' (' + subSpell.actions + ')</li>';
        }
        if (subSpell.range) {
          subSpellsHTML += '<li><strong>Дистанция:</strong> ' + linkifyDistance(subSpell.range) + '</li>';
        }
        if (subSpell.target) {
          subSpellsHTML += '<li><strong>Цель/Область:</strong> ' + linkifyDistance(subSpell.target) + '</li>';
        }
        if (subSpell.duration) {
          subSpellsHTML += '<li><strong>Длительность:</strong> ' + subSpell.duration + '</li>';
        }
        if (subSpell.damageType && (Array.isArray(subSpell.damageType) ? subSpell.damageType.length : true)) {
          let damageText = Array.isArray(subSpell.damageType) ? subSpell.damageType.join(', ') : subSpell.damageType;
          if (subSpell.damageTypeNote) {
            damageText += ' (' + subSpell.damageTypeNote + ')';
          }
          subSpellsHTML += '<li><strong>Тип урона:</strong> ' + damageText + '</li>';
        }
        if (subSpell.type) {
          subSpellsHTML += '<li><strong>Тип Действия:</strong> ' + subSpell.type + '</li>';
        }
        
        subSpellsHTML += '</ul>';
      }
      
      if (subSpell.description) {
        subSpellsHTML += '<h4 style="margin-top: var(--spacing-md); margin-bottom: var(--spacing-sm); font-size: 1.1em;">Описание</h4>';
        subSpellsHTML += renderSpellDescription(subSpell.description);
      }
      
      subSpellsHTML += '</div>';
    });
  }
  
  detailContent.innerHTML = 
    '<h1>' + spell.name + '</h1>' +
    parametersHTML +
    '<h2>Описание</h2>' +
    renderSpellDescription(spell.description) +
    subSpellsHTML +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> <a href="db.html?school=' + encodeURIComponent(spell.school) + '" style="color: var(--accent-emerald); text-decoration: none;">' + spell.school + '</a>, <a href="spellbook/intro.html" style="color: var(--accent-emerald); text-decoration: none;">Учебные заклинания</a></p>';
}

/**
 * Show school detail page
 */
function showSchoolPage(schoolId) {
  let school = schoolsData.find(function (s) {
    return s.id === schoolId;
  });
  if (!school) {
    school = schoolsData.find(function (s) {
      return s.name === schoolId;
    });
  }
  
  if (!school) {
    switchTab('schools');
    document.getElementById('school-name').value = schoolId;
    filterAndDisplaySchools();
    return;
  }

  document.getElementById('databaseView').style.display = 'none';
  document.getElementById('detailView').style.display = 'block';
  document.title = school.name + ' — E\'Magios Core';

  const detailContent = document.getElementById('detailContent');
  
  let descriptionHTML = '';
  if (school.description) {
    descriptionHTML = '<h2>Описание</h2>' + renderSpellDescription(linkifySchoolText(school.description));
  }
  
  function renderListWithFormatting(text) {
    if (!text) return '';
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = linkifySchoolText(text);
    return text;
  }
  
  let principlesHTML = '';
  if (school.principles && school.principles.length > 0) {
    const principleItems = school.principles
      .map(function (p) {
        return '<li>' + renderListWithFormatting(p) + '</li>';
      })
      .join('');
    principlesHTML = '<h2>Принципы</h2><ul>' + principleItems + '</ul>';
  }
  
  let featuresHTML = '';
  if (school.features && school.features.length > 0) {
    const featureItems = school.features
      .map(function (f) {
        return '<li>' + renderListWithFormatting(f) + '</li>';
      })
      .join('');
    featuresHTML = '<h2>Особенности</h2><ul>' + featureItems + '</ul>';
  }
  
  let spellsHTML = '';
  if (school.educationalSpells && school.educationalSpells.length > 0) {
    const spellItems = school.educationalSpells
      .map(function (spellName) {
        const spell = spellsData.find(function (s) {
          return s.name === spellName;
        });
        if (spell) {
          return '<li><a href="db.html?spell=' + spell.id + '" style="color: var(--accent-emerald); text-decoration: none;">' + spellName + '</a></li>';
        }
        return '<li>' + spellName + '</li>';
      })
      .join('');
    spellsHTML = '<h2>Учебные Заклинания</h2><ul>' + spellItems + '</ul>';
  }
  
  let linksHTML = '<a href="spellbook/schools.html" style="color: var(--accent-emerald); text-decoration: none;">Школы Магии</a>';
  if (school.relatedSchools && school.relatedSchools.length > 0) {
    const relatedLinks = school.relatedSchools
      .map(function (relatedName) {
        return '<a href="db.html?school=' + encodeURIComponent(relatedName) + '" style="color: var(--accent-emerald); text-decoration: none;">' + relatedName + '</a>';
      })
      .join(', ');
    linksHTML = relatedLinks + ', ' + linksHTML;
  }
  
  let propertiesHTML = '';
  if (school.properties && school.properties.length > 0) {
    const propertiesText = school.properties
      .map(function (property) {
        return linkifySchoolProperty(property);
      })
      .join(', ');
    propertiesHTML = '<li><strong>Свойства:</strong> ' + propertiesText + '</li>';
  }
  
  let difficultyHTML = '';
  if (school.difficulty) {
    difficultyHTML = '<li><strong>Сложность:</strong> ' + formatDifficultyStars(school.difficulty) + '</li>';
  }
  
  detailContent.innerHTML = 
    '<h1>' + school.name + '</h1>' +
    '<h2>Параметры</h2>' +
    '<ul>' +
    '<li><strong>Редкость:</strong> <a href="spellbook/schools.html#rarity-' + getRarityId(school.rarity) + '" style="color: var(--accent-emerald); text-decoration: none;">' + school.rarity + '</a></li>' +
    propertiesHTML +
    difficultyHTML +
    '</ul>' +
    descriptionHTML +
    principlesHTML +
    featuresHTML +
    spellsHTML +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> ' + linksHTML + '</p>';
}

/**
 * Show effect detail page
 */
function showEffectPage(effectId) {
  const effect = effectsData.find(function (e) {
    return e.id === effectId;
  });
  if (!effect) {
    window.location.href = 'db.html';
    return;
  }

  document.getElementById('databaseView').style.display = 'none';
  document.getElementById('detailView').style.display = 'block';
  document.title = effect.name + ' — E\'Magios Core';

  const detailContent = document.getElementById('detailContent');
  const description = effect.description || '—';
  detailContent.innerHTML = 
    '<h1>' + effect.name + '</h1>' +
    '<h2>Параметры</h2>' +
    '<ul><li><strong>Тип Действия:</strong> ' + effect.actionType + '</li></ul>' +
    '<h2>Описание</h2>' +
    '<p>' + description + '</p>' +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> <a href="phb/effects.html" style="color: var(--accent-emerald); text-decoration: none;">Эффекты</a></p>';
}

function showArchetypePage(archetypeId) {
  const archetype = archetypesData.find(function (a) {
    return a.id === archetypeId;
  });
  if (!archetype) {
    window.location.href = 'db.html';
    return;
  }

  document.getElementById('databaseView').style.display = 'none';
  document.getElementById('detailView').style.display = 'block';
  document.title = archetype.name + ' — E\'Magios Core';

  const detailContent = document.getElementById('detailContent');
  const description = archetype.description || '—';
  
  let improvementsHTML = '';
  if (archetype.improvements && archetype.improvements.length > 0) {
    const improvementItems = archetype.improvements
      .map(function (imp) {
        return '<h3>' + imp.name + '</h3><p>' + imp.description + '</p>';
      })
      .join('');
    improvementsHTML = '<h2>Улучшения</h2>' + improvementItems;
  }
  
  detailContent.innerHTML = 
    '<h1>' + archetype.name + '</h1>' +
    '<h2>Описание</h2>' +
    '<p>' + description + '</p>' +
    improvementsHTML +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> <a href="phb/archetypes.html" style="color: var(--accent-emerald); text-decoration: none;">Архетипы</a></p>';
}

function showActionPage(actionId) {
  const action = actionsData.find(function (a) {
    return a.id === actionId;
  });
  if (!action) {
    window.location.href = 'db.html';
    return;
  }

  document.getElementById('databaseView').style.display = 'none';
  document.getElementById('detailView').style.display = 'block';
  document.title = action.name + ' — E\'Magios Core';

  const detailContent = document.getElementById('detailContent');
  
  let parametersHTML = '<h2>Параметры</h2><ul>';
  
  if (action.actions) {
    parametersHTML += '<li><strong>Действие:</strong> ' + action.actions + '</li>';
  }
  if (action.range) {
    parametersHTML += '<li><strong>Дистанция:</strong> ' + action.range + '</li>';
  }
  if (action.target) {
    parametersHTML += '<li><strong>Цель/Область:</strong> ' + action.target + '</li>';
  }
  if (action.duration) {
    parametersHTML += '<li><strong>Длительность:</strong> ' + action.duration + '</li>';
  }
  
  parametersHTML += '</ul>';
  
  const description = action.description || '—';
  detailContent.innerHTML = 
    '<h1>' + action.name + '</h1>' +
    parametersHTML +
    '<h2>Описание</h2>' +
    '<p>' + description + '</p>' +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> <a href="phb/actions.html" style="color: var(--accent-emerald); text-decoration: none;">Базовые Действия</a></p>';
}

function displayArchetypes(archetypes) {
  const tbody = document.getElementById('archetypes-results');
  const count = document.getElementById('archetypes-count');

  count.textContent = `${archetypes.length} ${getPlural(archetypes.length, 'архетип', 'архетипа', 'архетипов')}`;

  if (!archetypes.length) {
    tbody.innerHTML = '<tr><td colspan="2" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = archetypes
    .map(function (archetype) {
      const desc = archetype.description || '—';
      return (
        '<tr>' +
        `<td><strong><a href="db.html?archetype=${archetype.id}" style="color: var(--accent-emerald); text-decoration: none;">${archetype.name}</a></strong></td>` +
        `<td>${desc}</td>` +
        '</tr>'
      );
    })
    .join('');
}

function filterAndDisplayArchetypes() {
  const nameInput = document.getElementById('archetype-name');
  const searchName = nameInput ? nameInput.value.toLowerCase() : '';

  let filtered = archetypesData.filter(function (archetype) {
    if (searchName && archetype.name.toLowerCase().indexOf(searchName) === -1) {
      return false;
    }
    return true;
  });

  filtered = sortArray(filtered, currentArchetypeSort.field, currentArchetypeSort.ascending);
  displayArchetypes(filtered);
}

function sortArchetypes(field) {
  if (currentArchetypeSort.field === field) {
    currentArchetypeSort.ascending = !currentArchetypeSort.ascending;
  } else {
    currentArchetypeSort.field = field;
    currentArchetypeSort.ascending = true;
  }
  filterAndDisplayArchetypes();
  saveFiltersToSession();
}

function displayActions(actions) {
  const tbody = document.getElementById('actions-results');
  const count = document.getElementById('actions-count');

  count.textContent = `${actions.length} ${getPlural(actions.length, 'действие', 'действия', 'действий')}`;

  if (!actions.length) {
    tbody.innerHTML = '<tr><td colspan="2" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = actions
    .map(function (action) {
      const desc = action.description || '—';
      return (
        '<tr>' +
        `<td><strong><a href="db.html?action=${action.id}" style="color: var(--accent-emerald); text-decoration: none;">${action.name}</a></strong></td>` +
        `<td>${desc}</td>` +
        '</tr>'
      );
    })
    .join('');
}

function filterAndDisplayActions() {
  const nameInput = document.getElementById('action-name');
  const searchName = nameInput ? nameInput.value.toLowerCase() : '';

  let filtered = actionsData.filter(function (action) {
    if (searchName && action.name.toLowerCase().indexOf(searchName) === -1) {
      return false;
    }
    return true;
  });

  filtered = sortArray(filtered, currentActionSort.field, currentActionSort.ascending);
  displayActions(filtered);
}

function sortActions(field) {
  if (currentActionSort.field === field) {
    currentActionSort.ascending = !currentActionSort.ascending;
  } else {
    currentActionSort.field = field;
    currentActionSort.ascending = true;
  }
  filterAndDisplayActions();
  saveFiltersToSession();
}

function hasActiveSpellFilters() {
  return spellFilters.type.length > 0 ||
         spellFilters.source.length > 0 ||
         spellFilters.school.length > 0 ||
         spellFilters.damage.length > 0 ||
         spellFilters.concentration.length > 0;
}

function hasActiveSchoolFilters() {
  return schoolFilters.rarity.length > 0 ||
         schoolFilters.properties.length > 0 ||
         schoolFilters.difficulty.length > 0;
}

function hasActiveEffectFilters() {
  return effectFilters.actionType.length > 0;
}

function updateClearButtonsVisibility() {
  const spellClearBtn = document.getElementById('spell-filters-clear');
  const schoolClearBtn = document.getElementById('school-filters-clear');
  const effectClearBtn = document.getElementById('effect-filters-clear');
  
  if (spellClearBtn) {
    if (hasActiveSpellFilters()) {
      spellClearBtn.classList.add('visible');
    } else {
      spellClearBtn.classList.remove('visible');
    }
  }
  
  if (schoolClearBtn) {
    if (hasActiveSchoolFilters()) {
      schoolClearBtn.classList.add('visible');
    } else {
      schoolClearBtn.classList.remove('visible');
    }
  }
  
  if (effectClearBtn) {
    if (hasActiveEffectFilters()) {
      effectClearBtn.classList.add('visible');
    } else {
      effectClearBtn.classList.remove('visible');
    }
  }
}

function quickClearSpellFilters() {
  spellFilters.type = [];
  spellFilters.source = [];
  spellFilters.school = [];
  spellFilters.damage = [];
  spellFilters.concentration = [];
  
  tempSpellFilters.type = [];
  tempSpellFilters.source = [];
  tempSpellFilters.school = [];
  tempSpellFilters.damage = [];
  tempSpellFilters.concentration = [];
  
  saveFiltersToSession();
  filterAndDisplaySpells();
  updateClearButtonsVisibility();
}

function quickClearSchoolFilters() {
  schoolFilters.rarity = [];
  schoolFilters.properties = [];
  schoolFilters.difficulty = [];
  
  tempSchoolFilters.rarity = [];
  tempSchoolFilters.properties = [];
  tempSchoolFilters.difficulty = [];
  
  saveFiltersToSession();
  filterAndDisplaySchools();
  updateClearButtonsVisibility();
}

function quickClearEffectFilters() {
  effectFilters.actionType = [];
  tempEffectFilters.actionType = [];
  
  saveFiltersToSession();
  filterAndDisplayEffects();
  updateClearButtonsVisibility();
}


