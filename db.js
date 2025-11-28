// Database JavaScript

let spellsData = [];
let schoolsData = [];
let effectsData = [];
let archetypesData = [];
let actionsData = [];
let skillsData = [];
let actionTypesData = [];
let combatComponentsData = [];

let currentSpellSort = { field: 'name', ascending: true };
let currentSchoolSort = { field: 'name', ascending: true };
let currentEffectSort = { field: 'name', ascending: true };
let currentArchetypeSort = { field: 'name', ascending: true };
let currentActionSort = { field: 'name', ascending: true };
let currentSkillSort = { field: 'name', ascending: true };
let currentActionTypeSort = { field: 'name', ascending: true };
let currentCombatSort = { field: 'name', ascending: true };

let spellFilters = {
  type: [],
  school: [],
  damage: [],
  concentration: [],
  requiredLevel: []
};

let tempSpellFilters = {
  type: [],
  school: [],
  damage: [],
  concentration: [],
  requiredLevel: []
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

let skillFilters = {
  type: []
};

let tempSkillFilters = {
  type: []
};

let actionFilters = {
  kind: []
};

let tempActionFilters = {
  kind: []
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

function collectSpellRequiredLevels() {
  const values = [];
  spellsData.forEach(function (spell) {
    if (typeof spell.requiredLevel === 'number') {
      const level = String(spell.requiredLevel);
      if (values.indexOf(level) === -1) {
        values.push(level);
      }
    }
  });
  values.sort(function (a, b) {
    return Number(a) - Number(b);
  });
  return values;
}

function collectSkillTypes() {
  const values = [];
  skillsData.forEach(function (skill) {
    if (skill.type && values.indexOf(skill.type) === -1) {
      values.push(skill.type);
    }
  });
  values.sort();
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
  const skillId = urlParams.get('skill');
  const actionTypeId = urlParams.get('actionType');
  const combatId = urlParams.get('combat');
  const openSpellFilters = urlParams.get('openSpellFilters');

  const detailModal = document.getElementById('spell-detail-modal');
  const detailModalClose = document.getElementById('spell-detail-close');
  if (detailModal && detailModalClose) {
    detailModalClose.addEventListener('click', function () {
      closeSpellDetailModal();
    });
    detailModal.addEventListener('click', function (event) {
      if (event.target === detailModal) {
        closeSpellDetailModal();
      }
    });
  }

  // Инициализируем фильтры и таблицы всегда,
  // чтобы база данных была готова даже при открытии по прямым ссылкам (?spell=...)
  initializeDynamicFilters();
  loadFiltersFromSession();
  restoreActiveFilterTags();
  setupFilterListeners();

  if (openSpellFilters) {
    switchTab('spells');
    toggleFiltersPanel('spells');
    try {
      urlParams.delete('openSpellFilters');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    } catch (e) {
      console.error('Failed to clean URL params:', e);
    }
  } else {
    const openTab = urlParams.get('openTab');
    if (openTab && ['spells', 'schools', 'archetypes', 'actions', 'effects', 'skills', 'action-types', 'combat'].indexOf(openTab) !== -1) {
      switchTab(openTab);
    } else {
      // Restore active tab
      const savedTab = sessionStorage.getItem('db_activeTab');
      if (savedTab && ['spells', 'schools', 'archetypes', 'actions', 'effects', 'skills', 'action-types', 'combat'].indexOf(savedTab) !== -1) {
        switchTab(savedTab);
      }
    }
  }

  filterAndDisplaySpells();
  filterAndDisplaySchools();
  filterAndDisplayEffects();
  filterAndDisplayArchetypes();
  filterAndDisplayActions();
  filterAndDisplaySkills();
  filterAndDisplayActionTypes();
  filterAndDisplayCombat();

  updateClearButtonsVisibility();

  // После инициализации — открываем детальную карточку, если есть параметры в URL
  if (spellId) {
    showSpellPage(spellId);
  } else if (schoolId) {
    switchTab('schools');
    showSchoolPage(schoolId);
  } else if (effectId) {
    showEffectPage(effectId);
  } else if (archetypeId) {
    showArchetypePage(archetypeId);
  } else if (actionId) {
    showActionPage(actionId);
  } else if (skillId) {
    showSkillPage(skillId);
  } else if (actionTypeId) {
    showActionTypePage(actionTypeId);
  } else if (combatId) {
    showCombatPage(combatId);
  }
});

async function loadAllData() {
  await Promise.all([
    loadSpells(),
    loadSchools(),
    loadEffects(),
    loadArchetypes(),
    loadActions(),
    loadSkills(),
    loadActionTypes(),
    loadCombatComponents()
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

async function loadSkills() {
  try {
    const response = await fetch('./data/skills.json', { cache: 'no-store' });
    skillsData = await response.json();
  } catch (error) {
    console.error('Error loading skills:', error);
    skillsData = [];
  }
}

async function loadActionTypes() {
  try {
    const response = await fetch('./data/action_types.json', { cache: 'no-store' });
    actionTypesData = await response.json();
  } catch (error) {
    console.error('Error loading action types:', error);
    actionTypesData = [];
  }
}

async function loadCombatComponents() {
  try {
    const response = await fetch('./data/combat_components.json', { cache: 'no-store' });
    combatComponentsData = await response.json();
  } catch (error) {
    console.error('Error loading combat components:', error);
    combatComponentsData = [];
  }
}

function initializeDynamicFilters() {
  // Для заклинаний используем полный список типов действий из базы типов действий,
  // чтобы фильтры охватывали всю типологию (даже если часть типов пока не задействована в заклинаниях)
  let spellTypeOptions = [];
  if (actionTypesData && actionTypesData.length) {
    spellTypeOptions = actionTypesData
      .map(function (t) { return t.name; })
      .filter(function (name, index, arr) {
        return !!name && arr.indexOf(name) === index;
      })
      .sort();
  } else {
    spellTypeOptions = collectSpellOptions('type', true);
  }
  const spellSchoolOptions = collectSpellOptions('school', true);
  const spellDamageOptions = collectSpellOptions('damageType', true);
  const spellConcentrationOptions = ['Да', 'Нет'];
  const spellLevelOptions = collectSpellRequiredLevels();

  createFilterTags('spell-type-tags', spellTypeOptions, 'type', tempSpellFilters);
  createFilterTags('spell-school-tags', spellSchoolOptions, 'school', tempSpellFilters);
  createFilterTags('spell-damage-tags', spellDamageOptions, 'damage', tempSpellFilters);
  createFilterTags('spell-concentration-tags', spellConcentrationOptions, 'concentration', tempSpellFilters);
  createFilterTags('spell-level-tags', spellLevelOptions, 'requiredLevel', tempSpellFilters);

  const rarityOptions = collectSchoolRarities();
  const propertiesOptions = collectSchoolProperties();
  const difficultyOptions = collectSchoolDifficulties();

  createFilterTags('school-rarity-tags', rarityOptions, 'rarity', tempSchoolFilters);
  createFilterTags('school-properties-tags', propertiesOptions, 'properties', tempSchoolFilters);
  createFilterTags('school-difficulty-tags', difficultyOptions, 'difficulty', tempSchoolFilters);

  const effectTypeOptions = ['Обычный', 'Относительное'];
  createFilterTags('effect-type-tags', effectTypeOptions, 'actionType', tempEffectFilters);

  const skillTypeOptions = collectSkillTypes();
  createFilterTags('skill-type-tags', skillTypeOptions, 'type', tempSkillFilters);

  const actionKindOptions = ['Базовое', 'Отдых'];
  createFilterTags('action-kind-tags', actionKindOptions, 'kind', tempActionFilters);
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

  const skillName = document.getElementById('skill-name');
  if (skillName) {
    skillName.addEventListener('input', function() {
      saveFiltersToSession();
      filterAndDisplaySkills();
    });
  }

  const actionTypeName = document.getElementById('action-type-name');
  if (actionTypeName) {
    actionTypeName.addEventListener('input', function() {
      saveFiltersToSession();
      filterAndDisplayActionTypes();
    });
  }

  const combatName = document.getElementById('combat-name');
  if (combatName) {
    combatName.addEventListener('input', function() {
      saveFiltersToSession();
      filterAndDisplayCombat();
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
      tempSpellFilters.school = spellFilters.school.slice();
      tempSpellFilters.damage = spellFilters.damage.slice();
      tempSpellFilters.concentration = spellFilters.concentration.slice();
      tempSpellFilters.requiredLevel = spellFilters.requiredLevel.slice();
      
      document.querySelectorAll('#spells-filters-panel .filter-tag').forEach(function (tag) {
        const value = tag.getAttribute('data-value');
        const categoryElement = tag.closest('.filter-category');
        const categoryName = categoryElement ? categoryElement.getAttribute('data-category') : null;
        
        let isActive = false;
        if (categoryName === 'type') {
          isActive = tempSpellFilters.type.indexOf(value) !== -1;
        } else if (categoryName === 'school') {
          isActive = tempSpellFilters.school.indexOf(value) !== -1;
        } else if (categoryName === 'damage') {
          isActive = tempSpellFilters.damage.indexOf(value) !== -1;
        } else if (categoryName === 'concentration') {
          isActive = tempSpellFilters.concentration.indexOf(value) !== -1;
        } else if (categoryName === 'requiredLevel') {
          isActive = tempSpellFilters.requiredLevel.indexOf(value) !== -1;
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
    } else if (tabName === 'skills') {
      tempSkillFilters.type = skillFilters.type.slice();

      document.querySelectorAll('#skills-filters-panel .filter-tag').forEach(function (tag) {
        const value = tag.getAttribute('data-value');
        const isActive = tempSkillFilters.type.indexOf(value) !== -1;

        if (isActive) {
          tag.classList.add('active');
        } else {
          tag.classList.remove('active');
        }
      });
    } else if (tabName === 'actions') {
      tempActionFilters.kind = actionFilters.kind.slice();

      document.querySelectorAll('#actions-filters-panel .filter-tag').forEach(function (tag) {
        const value = tag.getAttribute('data-value');
        const isActive = tempActionFilters.kind.indexOf(value) !== -1;

        if (isActive) {
          tag.classList.add('active');
        } else {
          tag.classList.remove('active');
        }
      });
    }
    
    panel.classList.add('open');

    // Блокируем прокрутку основной страницы, пока открыт фильтр
    try {
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
    } catch (e) {
      // no-op
    }
  }
}

function closeFiltersPanel() {
  document.querySelectorAll('.filters-panel').forEach(function (p) {
    p.classList.remove('open');
  });

  // Если не открыт детальный поп-ап, возвращаем прокрутку странице
  try {
    const detailOverlay = document.getElementById('spell-detail-modal');
    const detailHidden = !detailOverlay || detailOverlay.classList.contains('hidden');
    if (detailHidden) {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }
  } catch (e) {
    // no-op
  }
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

    if (spellFilters.school.length) {
      const schoolNames = getSpellSchoolNames(spell);
      if (!hasAny(schoolNames, spellFilters.school)) {
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

    if (spellFilters.requiredLevel.length) {
      const level = typeof spell.requiredLevel === 'number' ? String(spell.requiredLevel) : null;
      if (!level || spellFilters.requiredLevel.indexOf(level) === -1) {
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
      const schoolNames = getSpellSchoolNames(spell);
      const typeHtml = buildSpellTypesCell(spell);
      const levelText = typeof spell.requiredLevel === 'number' ? String(spell.requiredLevel) : '—';
      const schoolLink = schoolNames.length
        ? schoolNames
            .map(function (name) {
              const id = getSchoolId(name);
              return `<a href="javascript:void(0)" onclick="showSchoolPage('${id}')" style="color: var(--accent-emerald); text-decoration: none;">${name}</a>`;
            })
            .join(', ')
        : '—';
      const hasSubSpells = spell.subSpells && spell.subSpells.length > 0;
      const subSpellIndicator = hasSubSpells 
        ? ` <span style="color: var(--text-muted); font-size: 0.8em;" title="Имеет ${spell.subSpells.length} вариантов использования">[+${spell.subSpells.length}]</span>` 
        : '';
      return (
        '<tr>' +
        `<td><strong><a href="javascript:void(0)" onclick="showSpellPage('${spell.id}')" style="color: var(--accent-emerald); text-decoration: none;">${spell.name}</a></strong>${subSpellIndicator}</td>` +
        `<td>${schoolLink}</td>` +
        `<td>${typeHtml}</td>` +
        `<td style="white-space: nowrap;">${levelText}</td>` +
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
  tempSpellFilters.school = [];
  tempSpellFilters.damage = [];
  tempSpellFilters.concentration = [];
  tempSpellFilters.requiredLevel = [];
  
  document.querySelectorAll('#spells-filters-panel .filter-tag.active').forEach(function (tag) {
    tag.classList.remove('active');
  });
}

function applySpellFilters() {
  spellFilters.type = tempSpellFilters.type.slice();
  spellFilters.school = tempSpellFilters.school.slice();
  spellFilters.damage = tempSpellFilters.damage.slice();
  spellFilters.concentration = tempSpellFilters.concentration.slice();
  spellFilters.requiredLevel = tempSpellFilters.requiredLevel.slice();
  
  saveFiltersToSession();
  filterAndDisplaySpells();
  updateClearButtonsVisibility();
  closeFiltersPanel();
}

function cancelSpellFilters() {
  tempSpellFilters.type = spellFilters.type.slice();
  tempSpellFilters.school = spellFilters.school.slice();
  tempSpellFilters.damage = spellFilters.damage.slice();
  tempSpellFilters.concentration = spellFilters.concentration.slice();
  tempSpellFilters.requiredLevel = spellFilters.requiredLevel.slice();
  
  document.querySelectorAll('#spells-filters-panel .filter-tag').forEach(function (tag) {
    const value = tag.getAttribute('data-value');
    const categoryElement = tag.closest('.filter-category');
    const categoryName = categoryElement ? categoryElement.getAttribute('data-category') : null;
    
    let isActive = false;
    if (categoryName === 'type') {
      isActive = tempSpellFilters.type.indexOf(value) !== -1;
    } else if (categoryName === 'school') {
      isActive = tempSpellFilters.school.indexOf(value) !== -1;
    } else if (categoryName === 'damage') {
      isActive = tempSpellFilters.damage.indexOf(value) !== -1;
    } else if (categoryName === 'concentration') {
      isActive = tempSpellFilters.concentration.indexOf(value) !== -1;
    } else if (categoryName === 'requiredLevel') {
      isActive = tempSpellFilters.requiredLevel.indexOf(value) !== -1;
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
        `<td><strong><a href="javascript:void(0)" onclick="showSchoolPage('${school.id}')" style="color: var(--accent-emerald); text-decoration: none;">${school.name}</a></strong></td>` +
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
    tbody.innerHTML = '<tr><td colspan="2" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = effects
    .map(function (effect) {
      const actionType = effect.actionType || '—';
      return (
        '<tr>' +
        '<td><strong><a href="javascript:void(0)" onclick="showEffectPage(\'' + effect.id + '\')" style="color: var(--accent-emerald); text-decoration: none;">' + effect.name + '</a></strong></td>' +
        '<td>' + actionType + '</td>' +
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

/**
 * Построить HTML-ссылки для типов действий заклинания
 * (каждый тип ведёт на свою страницу в разделе "Типы Действий")
 */
function buildSpellTypesCell(spell) {
  if (!spell || !spell.type) {
    return '—';
  }

  const rawTypes = splitToArray(spell.type);
  if (!rawTypes.length) {
    return '—';
  }

  const style = 'style="color: var(--accent-emerald); text-decoration: none;"';

  const parts = rawTypes.map(function (typeName) {
    // Ищем точное совпадение по названию типа действия
    const match = actionTypesData.find(function (t) {
      return t && t.name === typeName;
    });

    if (match && match.id) {
      return '<a href="javascript:void(0)" ' + style + ' onclick="showActionTypePage(\'' + match.id + '\')">' + typeName + '</a>';
    }

    // Если тип ещё не описан отдельно, показываем простой текст
    return typeName;
  });

  return parts.join(', ');
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

    // Числовая сортировка для требования к уровню заклинаний
    if (field === 'requiredLevel') {
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
  document.querySelectorAll('#spell-level-tags .filter-tag').forEach(function (tag) {
    if (spellFilters.requiredLevel.indexOf(tag.textContent) !== -1) {
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

  document.querySelectorAll('#skill-type-tags .filter-tag').forEach(function (tag) {
    if (skillFilters.type.indexOf(tag.textContent) !== -1) {
      tag.classList.add('active');
    }
  });

  document.querySelectorAll('#action-kind-tags .filter-tag').forEach(function (tag) {
    if (actionFilters.kind.indexOf(tag.textContent) !== -1) {
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
    sessionStorage.setItem('db_skillFilters', JSON.stringify(skillFilters));
    sessionStorage.setItem('db_actionFilters', JSON.stringify(actionFilters));
    sessionStorage.setItem('db_spellSort', JSON.stringify(currentSpellSort));
    sessionStorage.setItem('db_schoolSort', JSON.stringify(currentSchoolSort));
    sessionStorage.setItem('db_effectSort', JSON.stringify(currentEffectSort));
    sessionStorage.setItem('db_archetypeSort', JSON.stringify(currentArchetypeSort));
    sessionStorage.setItem('db_actionSort', JSON.stringify(currentActionSort));
    sessionStorage.setItem('db_skillSort', JSON.stringify(currentSkillSort));
    sessionStorage.setItem('db_actionTypeSort', JSON.stringify(currentActionTypeSort));
    sessionStorage.setItem('db_combatSort', JSON.stringify(currentCombatSort));
    
    // Save search inputs
    const spellName = document.getElementById('spell-name');
    const schoolName = document.getElementById('school-name');
    const effectName = document.getElementById('effect-name');
    const archetypeName = document.getElementById('archetype-name');
    const actionName = document.getElementById('action-name');
    const skillName = document.getElementById('skill-name');
    const actionTypeName = document.getElementById('action-type-name');
    const combatName = document.getElementById('combat-name');
    
    if (spellName) sessionStorage.setItem('db_spellName', spellName.value);
    if (schoolName) sessionStorage.setItem('db_schoolName', schoolName.value);
    if (effectName) sessionStorage.setItem('db_effectName', effectName.value);
    if (archetypeName) sessionStorage.setItem('db_archetypeName', archetypeName.value);
    if (actionName) sessionStorage.setItem('db_actionName', actionName.value);
    if (skillName) sessionStorage.setItem('db_skillName', skillName.value);
    if (actionTypeName) sessionStorage.setItem('db_actionTypeName', actionTypeName.value);
    if (combatName) sessionStorage.setItem('db_combatName', combatName.value);
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
    const savedSkillFilters = sessionStorage.getItem('db_skillFilters');
    const savedActionFilters = sessionStorage.getItem('db_actionFilters');
    const savedSpellSort = sessionStorage.getItem('db_spellSort');
    const savedSchoolSort = sessionStorage.getItem('db_schoolSort');
    const savedEffectSort = sessionStorage.getItem('db_effectSort');
    const savedArchetypeSort = sessionStorage.getItem('db_archetypeSort');
    const savedActionSort = sessionStorage.getItem('db_actionSort');
    const savedSkillSort = sessionStorage.getItem('db_skillSort');
    const savedActionTypeSort = sessionStorage.getItem('db_actionTypeSort');
    const savedCombatSort = sessionStorage.getItem('db_combatSort');
    
    if (savedSpellFilters) {
      const parsed = JSON.parse(savedSpellFilters);
      spellFilters.type = parsed.type || [];
      spellFilters.school = parsed.school || [];
      spellFilters.damage = parsed.damage || [];
      spellFilters.concentration = parsed.concentration || [];
      spellFilters.requiredLevel = parsed.requiredLevel || [];
      
      // Copy to temp filters
      tempSpellFilters.type = spellFilters.type.slice();
      tempSpellFilters.school = spellFilters.school.slice();
      tempSpellFilters.damage = spellFilters.damage.slice();
      tempSpellFilters.concentration = spellFilters.concentration.slice();
      tempSpellFilters.requiredLevel = spellFilters.requiredLevel.slice();
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

    if (savedSkillFilters) {
      const parsed = JSON.parse(savedSkillFilters);
      skillFilters.type = parsed.type || [];

      tempSkillFilters.type = skillFilters.type.slice();
    }

    if (savedActionFilters) {
      const parsed = JSON.parse(savedActionFilters);
      actionFilters.kind = parsed.kind || [];

      tempActionFilters.kind = actionFilters.kind.slice();
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
    
    if (savedSkillSort) {
      const parsedSort = JSON.parse(savedSkillSort);
      if (parsedSort.field) {
        currentSkillSort.field = parsedSort.field;
      }
      if (typeof parsedSort.ascending === 'boolean') {
        currentSkillSort.ascending = parsedSort.ascending;
      }
    }

    if (savedActionTypeSort) {
      const parsedSort = JSON.parse(savedActionTypeSort);
      if (parsedSort.field) {
        currentActionTypeSort.field = parsedSort.field;
      }
      if (typeof parsedSort.ascending === 'boolean') {
        currentActionTypeSort.ascending = parsedSort.ascending;
      }
    }

    if (savedCombatSort) {
      const parsedSort = JSON.parse(savedCombatSort);
      if (parsedSort.field) {
        currentCombatSort.field = parsedSort.field;
      }
      if (typeof parsedSort.ascending === 'boolean') {
        currentCombatSort.ascending = parsedSort.ascending;
      }
    }
    
    // Restore search inputs
    const spellName = document.getElementById('spell-name');
    const schoolName = document.getElementById('school-name');
    const effectName = document.getElementById('effect-name');
    const archetypeName = document.getElementById('archetype-name');
    const actionName = document.getElementById('action-name');
    const skillName = document.getElementById('skill-name');
    const actionTypeName = document.getElementById('action-type-name');
    const combatName = document.getElementById('combat-name');
    
    if (spellName) spellName.value = sessionStorage.getItem('db_spellName') || '';
    if (schoolName) schoolName.value = sessionStorage.getItem('db_schoolName') || '';
    if (effectName) effectName.value = sessionStorage.getItem('db_effectName') || '';
    if (archetypeName) archetypeName.value = sessionStorage.getItem('db_archetypeName') || '';
    if (actionName) actionName.value = sessionStorage.getItem('db_actionName') || '';
    if (skillName) skillName.value = sessionStorage.getItem('db_skillName') || '';
    if (actionTypeName) actionTypeName.value = sessionStorage.getItem('db_actionTypeName') || '';
    if (combatName) combatName.value = sessionStorage.getItem('db_combatName') || '';
  } catch (e) {
    console.error('Failed to load filters:', e);
  }
}

/**
 * Helpers: slugify Russian/Latin text to compare school names
 */
function slugifyRu(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^а-яa-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Convert school name (possibly alias like "Природа") to ID
 */
function getSchoolId(schoolName) {
  // Явные алиасы, у которых название в спеллах отличается от названия школы
  const aliasMap = {
    'Природа': 'природная-магия'
  };

  if (aliasMap[schoolName]) {
    return aliasMap[schoolName];
  }

  const school = schoolsData.find(function (s) {
    return s.name === schoolName;
  });
  if (school) {
    return school.id;
  }
  // Попробуем сопоставить по "слизганному" названию (учёт алиасов вроде "Природа")
  const targetSlug = slugifyRu(schoolName);
  const slugMatch = schoolsData.find(function (s) {
    const nameSlug = slugifyRu(s.name);
    return nameSlug === targetSlug || nameSlug.indexOf(targetSlug) !== -1 || targetSlug.indexOf(nameSlug) !== -1;
  });
  if (slugMatch) {
    return slugMatch.id;
  }
  // В крайнем случае возвращаем исходное имя — showSchoolPage попробует найти по name
  return schoolName;
}

/**
 * Получить список названий школ для заклинания (учёт мультишкол)
 */
function getSpellSchoolNames(spell) {
  if (!spell || !spell.school) {
    return [];
  }
  if (Array.isArray(spell.school)) {
    return spell.school;
  }
  return splitToArray(spell.school);
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
 * Build spell detail HTML (parameters, description, subspells, links)
 */
function buildSpellDetailHtml(spell) {
  const params = [];

  if (spell.actions || spell.actionType) {
    const actionLabel = formatActionLabel(spell.actionType || 'Действие');
    params.push('<li><strong>Действие:</strong> ' + actionLabel + ' (' + (spell.actions || '—') + ')</li>');
  }

  if (spell.resources) {
    params.push('<li><strong>Ресурсы:</strong> ' + linkifyResources(spell.resources) + '</li>');
  }

  if (spell.range) {
    params.push('<li><strong>Дистанция:</strong> ' + linkifyDistance(spell.range) + '</li>');
  }

  if (spell.target) {
    params.push('<li><strong>Цель/Область:</strong> ' + linkifyDistance(spell.target) + '</li>');
  }

  if (spell.duration) {
    params.push('<li><strong>Длительность:</strong> ' + spell.duration + '</li>');
  }

  if (spell.damageType && (Array.isArray(spell.damageType) ? spell.damageType.length : true)) {
    let damageText = Array.isArray(spell.damageType) ? spell.damageType.join(', ') : spell.damageType;
    if (spell.damageTypeNote) {
      damageText += ' (' + spell.damageTypeNote + ')';
    }
    params.push('<li><strong>Тип урона:</strong> ' + damageText + '</li>');
  }

  if (spell.concentration) {
    const style = 'style="color: var(--accent-emerald); text-decoration: none;"';
    const concLink = '<a href="phb/combat.html#концентрация" ' + style + '>' + spell.concentration + '</a>';
    let line = '<li><strong>Концентрация:</strong> ' + concLink;
    if (spell.maintenance) {
      line += '; <strong>Поддержание:</strong> ' + spell.maintenance;
    }
    line += '</li>';
    params.push(line);
  }

  if (spell.school) {
    const schoolNames = getSpellSchoolNames(spell);
    const schoolsText = schoolNames.length
      ? schoolNames
          .map(function (name) {
            const id = getSchoolId(name);
            return '<a href="javascript:void(0)" onclick="showSchoolPage(\'' + id + '\')" style="color: var(--accent-emerald); text-decoration: none;">' + name + '</a>';
          })
          .join(', ')
      : spell.school;
    params.push('<li><strong>Школа Магии:</strong> ' + schoolsText + '</li>');
  }

  if (typeof spell.requiredLevel === 'number') {
    params.push('<li><strong>Требование к уровню:</strong> ' + spell.requiredLevel + '</li>');
  }

  if (typeof spell.value === 'number') {
    params.push('<li><strong>Ценность:</strong> ' + spell.value + '</li>');
  }

  if (spell.supportMagic) {
    params.push('<li><strong>Вспомогательная Магия:</strong> ' + spell.supportMagic + '</li>');
  }

  if (spell.type) {
    params.push('<li><strong>Тип Действия:</strong> ' + spell.type + '</li>');
  }

  if (spell.trigger) {
    params.push('<li><strong>Триггер:</strong> ' + spell.trigger + '</li>');
  }

  let parametersHTML = '';
  if (params.length) {
    parametersHTML = '<h3>Параметры</h3><ul>' + params.join('') + '</ul>';
  }
  
  let subSpellsHTML = '';
  if (spell.subSpells && spell.subSpells.length > 0) {
    subSpellsHTML = '<h3>Варианты использования</h3>';
    spell.subSpells.forEach(function(subSpell, index) {
      const subId = 'subspell-' + (spell.id || 'spell') + '-' + index;
      const typeInfo = subSpell.type ? ' — ' + subSpell.type : '';
      subSpellsHTML += '<div class="subspell-block" style="margin-bottom: var(--spacing-lg); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); background: rgba(42, 42, 42, 0.4);">';
      subSpellsHTML +=
        '<div class="subspell-header" style="display:flex; align-items:center; justify-content:space-between; padding: var(--spacing-md); cursor:pointer;" onclick="toggleSubSpell(\'' +
        subId +
        '\')">' +
        '<div style="display:flex; flex-direction:column; gap:2px;">' +
        '<h3 style="margin: 0; color: var(--accent-emerald); font-size: 1.05em;">' +
        subSpell.name +
        '</h3>' +
        (typeInfo
          ? '<span style="font-size: 0.8em; color: var(--text-muted);">Тип действия: ' + typeInfo.replace(' — ', '') + '</span>'
          : '') +
        '</div>' +
        '<span style="font-size: 0.85em; color: var(--text-muted); margin-left: var(--spacing-md);">Показать детали</span>' +
        '</div>';

      subSpellsHTML +=
        '<div id="' +
        subId +
        '" class="subspell-body" style="display: none; padding: 0 var(--spacing-md) var(--spacing-md);">';

      if (subSpell.actions || subSpell.range || subSpell.target || subSpell.duration || subSpell.damageType || subSpell.type) {
        subSpellsHTML += '<h4 style="margin-top: var(--spacing-md); margin-bottom: var(--spacing-sm); font-size: 1.0em;">Параметры</h4>';
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
        subSpellsHTML += '<h4 style="margin-top: var(--spacing-md); margin-bottom: var(--spacing-sm); font-size: 1.0em;">Описание</h4>';
        subSpellsHTML += renderSpellDescription(subSpell.description);
      }
      
      subSpellsHTML += '</div></div>';
    });
  }

  // Блок с требованиями к ритуалу (если это ритуальное заклинание)
  let ritualHTML = '';
  if (spell.type && String(spell.type).indexOf('Ритуал') !== -1 && spell.ritual) {
    const parts = [];
    if (spell.ritual.time) {
      parts.push(
        '<h4>Время проведения</h4>' +
          '<p>' +
          renderSpellDescription(spell.ritual.time) +
          '</p>'
      );
    }
    if (spell.ritual.participants) {
      parts.push(
        '<h4>Обязательные участники</h4>' +
          '<p>' +
          renderSpellDescription(spell.ritual.participants) +
          '</p>'
      );
    }
    if (spell.ritual.components || spell.ritual.componentsValue) {
      let componentsText = '';
      if (spell.ritual.componentsValue) {
        componentsText += '<p><strong>Ценность компонентов:</strong> ' + spell.ritual.componentsValue + '</p>';
      }
      if (spell.ritual.components) {
        // Компоненты могут быть списком с "- ". Разобьём на пункты.
        const lines = String(spell.ritual.components)
          .split('\n')
          .map(function (l) {
            return l.trim();
          })
          .filter(function (l) {
            return l.length > 0;
          });
        if (lines.length) {
          componentsText += '<ul>';
          lines.forEach(function (line) {
            const clean = line.replace(/^-+\s*/, '');
            componentsText += '<li>' + renderSpellDescription(clean) + '</li>';
          });
          componentsText += '</ul>';
        }
      }
      if (componentsText) {
        parts.push('<h4>Требуемые компоненты</h4>' + componentsText);
      }
    }
    if (parts.length) {
      ritualHTML =
        '<h3>Требования к ритуалу</h3>' +
        '<div class="spell-ritual-block">' +
        parts.join('') +
        '</div>';
    }
  }

  // Основное описание заклинания
  let descriptionHTML = '';
  if (spell.description) {
    descriptionHTML = '<h3>Описание</h3>' + renderSpellDescription(spell.description);
  }

  return (
    parametersHTML +
    descriptionHTML +
    ritualHTML +
    subSpellsHTML +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> ' +
    (getSpellSchoolNames(spell).length
      ? getSpellSchoolNames(spell)
          .map(function (name) {
            var id = getSchoolId(name);
            return '<a href="javascript:void(0)" onclick="showSchoolPage(\'' + id + '\')" style="color: var(--accent-emerald); text-decoration: none;">' + name + '</a>';
          })
          .join(', ')
      : '—') +
    '</p>'
  );
}

function openDbDetailModal(title, html) {
  const overlay = document.getElementById('spell-detail-modal');
  const titleElement = document.getElementById('spell-detail-title');
  const contentElement = document.getElementById('spell-detail-content');

  if (!overlay || !titleElement || !contentElement) {
    return;
  }

  titleElement.textContent = title;
  contentElement.innerHTML = html;
  overlay.classList.remove('hidden');

  // Блокируем прокрутку основной страницы, пока открыт поп-ап
  try {
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
  } catch (e) {
    // no-op
  }
}

function toggleSubSpell(subId) {
  var body = document.getElementById(subId);
  if (!body) {
    return;
  }
  var isHidden = body.style.display === 'none' || body.style.display === '';
  body.style.display = isHidden ? 'block' : 'none';
}

function closeSpellDetailModal() {
  const overlay = document.getElementById('spell-detail-modal');
  if (overlay) {
    overlay.classList.add('hidden');
  }
  // Возвращаем прокрутку основной странице
  try {
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
  } catch (e) {
    // no-op
  }
}

/**
 * Show spell detail (used for deep links and table links)
 */
function showSpellPage(spellId) {
  switchTab('spells');
  const spell = spellsData.find(function (s) {
    return s.id === spellId;
  });
  if (!spell) {
    return;
  }
  document.title = spell.name + ' — E\'Magios Core';
  openDbDetailModal(spell.name, buildSpellDetailHtml(spell));
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
    const input = document.getElementById('school-name');
    if (input) {
      input.value = schoolId;
      filterAndDisplaySchools();
    }
    return;
  }

  document.title = school.name + ' — E\'Magios Core';

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
  
  const html =
    '<h3>Параметры</h3>' +
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

  openDbDetailModal(school.name, html);
}

/**
 * Show effect detail page
 */
function showEffectPage(effectId) {
  const effect = effectsData.find(function (e) {
    return e.id === effectId;
  });
  if (!effect) {
    return;
  }

  document.title = effect.name + ' — E\'Magios Core';

  const description = effect.description || '—';

  const params = ['<li><strong>Тип Действия:</strong> ' + (effect.actionType || '—') + '</li>'];
  const hasParameters = params.length > 0;
  let html = '';

  if (hasParameters) {
    html += '<h3>Параметры</h3><ul>' + params.join('') + '</ul>';
    html += '<h3>Описание</h3>';
  }

  html +=
    renderSpellDescription(description) +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> <a href="phb/effects.html" style="color: var(--accent-emerald); text-decoration: none;">Эффекты</a></p>';

  openDbDetailModal(effect.name, html);
}

function showArchetypePage(archetypeId) {
  const archetype = archetypesData.find(function (a) {
    return a.id === archetypeId;
  });
  if (!archetype) {
    return;
  }

  document.title = archetype.name + ' — E\'Magios Core';

  const description = archetype.description || '—';
  
  let improvementsHTML = '';
  if (archetype.improvements && archetype.improvements.length > 0) {
    improvementsHTML = '<h2>Улучшения</h2>';
    archetype.improvements.forEach(function (imp) {
      improvementsHTML += '<h4 style="margin-top: var(--spacing-md); margin-bottom: var(--spacing-xs); font-size: 1.05rem;">' + imp.name + '</h4>';
      if (imp.description) {
        improvementsHTML += renderSpellDescription(imp.description);
      }
    });
  }
  
  const html =
    '<h3>Описание</h3>' +
    renderSpellDescription(description) +
    improvementsHTML +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> <a href="phb/archetypes.html" style="color: var(--accent-emerald); text-decoration: none;">Архетипы</a></p>';

  openDbDetailModal(archetype.name, html);
}

function showActionPage(actionId) {
  const action = actionsData.find(function (a) {
    return a.id === actionId;
  });
  if (!action) {
    return;
  }

  document.title = action.name + ' — E\'Magios Core';

  const params = [];
  if (action.actions) {
    params.push('<li><strong>Действие:</strong> ' + action.actions + '</li>');
  }
  if (action.range) {
    params.push('<li><strong>Дистанция:</strong> ' + action.range + '</li>');
  }
  if (action.target) {
    params.push('<li><strong>Цель/Область:</strong> ' + action.target + '</li>');
  }
  if (action.duration) {
    params.push('<li><strong>Длительность:</strong> ' + action.duration + '</li>');
  }
  if (action.cost) {
    params.push('<li><strong>Стоимость:</strong> ' + action.cost + '</li>');
  }
  if (action.availability) {
    params.push('<li><strong>Доступность:</strong> ' + action.availability + '</li>');
  }

  const hasParameters = params.length > 0;
  let html = '';

  if (hasParameters) {
    html += '<h3>Параметры</h3><ul>' + params.join('') + '</ul>';
    html += '<h3>Описание</h3>';
  }

  const description = action.description || '—';
  html +=
    renderSpellDescription(description) +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> <a href="phb/actions.html" style="color: var(--accent-emerald); text-decoration: none;">Базовые Действия</a></p>';

  openDbDetailModal(action.name, html);
}

function showSkillPage(skillId) {
  const skill = skillsData.find(function (s) {
    return s.id === skillId;
  });
  if (!skill) {
    return;
  }

  document.title = skill.name + ' — E\'Magios Core';

  const params = [];
  if (skill.type) {
    params.push('<li><strong>Тип навыка:</strong> ' + skill.type + '</li>');
  }
  if (skill.category) {
    params.push('<li><strong>Категория:</strong> ' + skill.category + '</li>');
  }
  const hasParameters = params.length > 0;
  let html = '';

  if (hasParameters) {
    html += '<h3>Параметры</h3><ul>' + params.join('') + '</ul>';
    html += '<h3>Описание</h3>';
  }

  const description = skill.description || '—';
  html += buildSkillDescriptionHtml(skill, description) +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> <a href="phb/stats.html" style="color: var(--accent-emerald); text-decoration: none;">Характеристики и навыки</a></p>';

  openDbDetailModal(skill.name, html);
}

function buildSkillDescriptionHtml(skill, description) {
  if (!description || description === '—') {
    return '<p>—</p>';
  }

  const paragraphs = description.split(/\n{2,}/);
  const blocks = [];
  let currentBlock = null;

  const namePattern = new RegExp('^' + skill.name + '\\s*\\((\\d+)\\)\\s*-\\s*(.+)$');

  paragraphs.forEach(function (raw) {
    const text = raw.trim();
    if (!text) {
      return;
    }

    const match = text.match(namePattern);
    if (match) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        title: skill.name + ' (' + match[1] + ') - ' + match[2],
        paragraphs: []
      };
    } else {
      if (!currentBlock) {
        currentBlock = {
          title: null,
          paragraphs: []
        };
      }
      currentBlock.paragraphs.push(text);
    }
  });

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  if (!blocks.length) {
    return renderSpellDescription(description);
  }

  let html = '';
  blocks.forEach(function (block) {
    if (block.title) {
      html += '<h4 style="margin-top: var(--spacing-md); margin-bottom: var(--spacing-xs); font-size: 1.05rem;">' + block.title + '</h4>';
    }
    if (block.paragraphs && block.paragraphs.length) {
      html += renderSpellDescription(block.paragraphs.join('\n\n'));
    }
  });

  return html;
}

function buildSummary(text, maxLength) {
  if (!text) {
    return '—';
  }
  var clean = String(text).trim();
  if (!clean.length) {
    return '—';
  }

  // Обрезаем по первому переводу строки
  var newlineIndex = clean.indexOf('\n');
  if (newlineIndex !== -1) {
    clean = clean.slice(0, newlineIndex).trim();
  }

  // Если есть точка достаточно рано — берём первое предложение
  var sentenceEnd = clean.indexOf('.');
  if (sentenceEnd !== -1 && sentenceEnd < maxLength) {
    return clean.slice(0, sentenceEnd + 1).trim();
  }

  if (clean.length <= maxLength) {
    return clean;
  }

  return clean.slice(0, maxLength - 1).trimEnd() + '…';
}

function showActionTypePage(actionTypeId) {
  let actionType = actionTypesData.find(function (t) {
    return t.id === actionTypeId;
  });

  // Поддержка ссылок по названию (db.html?actionType=Атака)
  if (!actionType) {
    actionType = actionTypesData.find(function (t) {
      return t.name === actionTypeId;
    });
  }
  if (!actionType) {
    return;
  }

  document.title = actionType.name + ' — E\'Magios Core';

  const params = [];
  if (actionType.category) {
    params.push('<li><strong>Категория:</strong> ' + actionType.category + '</li>');
  }
  const hasParameters = params.length > 0;

  const description = actionType.description || '—';

  let subActionsHTML = '';
  if (actionType.subActions && actionType.subActions.length > 0) {
    subActionsHTML = '<h3>Примеры режимов</h3>';
    actionType.subActions.forEach(function (sub) {
      subActionsHTML += '<div style="margin-bottom: var(--spacing-md); padding: var(--spacing-sm) var(--spacing-md); background: rgba(42,42,42,0.6); border-radius: var(--radius-md); border: 1px solid var(--border-color);">';
      if (sub.name) {
        subActionsHTML += '<h4 style="margin-top: 0;">' + sub.name + '</h4>';
      }
      if (sub.description) {
        subActionsHTML += renderSpellDescription(sub.description);
      }
      subActionsHTML += '</div>';
    });
  }

  let html = '';
  if (hasParameters) {
    html += '<h3>Параметры</h3><ul>' + params.join('') + '</ul>';
    html += '<h3>Описание</h3>';
  }

  html +=
    renderSpellDescription(description) +
    subActionsHTML +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> <a href="phb/actions.html" style="color: var(--accent-emerald); text-decoration: none;">Действия</a></p>';

  openDbDetailModal(actionType.name, html);
}

function showCombatPage(combatId) {
  const component = combatComponentsData.find(function (c) {
    return c.id === combatId;
  });
  if (!component) {
    return;
  }

  document.title = component.name + ' — E\'Magios Core';

  const params = [];
  if (component.section) {
    params.push('<li><strong>Раздел:</strong> ' + component.section + '</li>');
  }
  const hasParameters = params.length > 0;

  const description = component.description || '—';
  let html = '';

  if (hasParameters) {
    html += '<h3>Параметры</h3><ul>' + params.join('') + '</ul>';
    html += '<h3>Описание</h3>';
  }

  html +=
    renderSpellDescription(description) +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> <a href="phb/combat.html" style="color: var(--accent-emerald); text-decoration: none;">Боевая система</a></p>';

  openDbDetailModal(component.name, html);
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
      const desc = archetype.description || '';
      const summary = buildSummary(desc, 120);
      return (
        '<tr>' +
        `<td><strong><a href="javascript:void(0)" onclick="showArchetypePage('${archetype.id}')" style="color: var(--accent-emerald); text-decoration: none;">${archetype.name}</a></strong></td>` +
        `<td>${summary}</td>` +
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
      const kind = action.kind || 'Базовое';
      return (
        '<tr>' +
        `<td><strong><a href="javascript:void(0)" onclick="showActionPage('${action.id}')" style="color: var(--accent-emerald); text-decoration: none;">${action.name}</a></strong></td>` +
        `<td>${kind}</td>` +
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
    
    if (actionFilters.kind.length) {
      const kind = action.kind || 'Базовое';
      if (actionFilters.kind.indexOf(kind) === -1) {
        return false;
      }
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

function displaySkills(skills) {
  const tbody = document.getElementById('skills-results');
  const count = document.getElementById('skills-count');

  count.textContent = `${skills.length} ${getPlural(skills.length, 'навык', 'навыка', 'навыков')}`;

  if (!skills.length) {
    tbody.innerHTML = '<tr><td colspan="2" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = skills
    .map(function (skill) {
      const type = skill.type || '—';
      return (
        '<tr>' +
        `<td><strong><a href="javascript:void(0)" onclick="showSkillPage('${skill.id}')" style="color: var(--accent-emerald); text-decoration: none;">${skill.name}</a></strong></td>` +
        `<td>${type}</td>` +
        '</tr>'
      );
    })
    .join('');
}

function filterAndDisplaySkills() {
  const nameInput = document.getElementById('skill-name');
  const searchName = nameInput ? nameInput.value.toLowerCase() : '';

  let filtered = skillsData.filter(function (skill) {
    if (searchName && skill.name.toLowerCase().indexOf(searchName) === -1) {
      return false;
    }

    if (skillFilters.type.length) {
      const skillType = skill.type || '';
      if (skillFilters.type.indexOf(skillType) === -1) {
        return false;
      }
    }

    return true;
  });

  filtered = sortArray(filtered, currentSkillSort.field, currentSkillSort.ascending);
  displaySkills(filtered);
}

function sortSkills(field) {
  if (currentSkillSort.field === field) {
    currentSkillSort.ascending = !currentSkillSort.ascending;
  } else {
    currentSkillSort.field = field;
    currentSkillSort.ascending = true;
  }
  filterAndDisplaySkills();
  saveFiltersToSession();
}

function displayActionTypes(types) {
  const tbody = document.getElementById('action-types-results');
  const count = document.getElementById('action-types-count');

  count.textContent = `${types.length} ${getPlural(types.length, 'тип', 'типа', 'типов')}`;

  if (!types.length) {
    tbody.innerHTML = '<tr><td colspan="2" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = types
    .map(function (type) {
      const desc = type.description || '';
      const summary = buildSummary(desc, 120);
      return (
        '<tr>' +
        `<td><strong><a href="javascript:void(0)" onclick="showActionTypePage('${type.id}')" style="color: var(--accent-emerald); text-decoration: none;">${type.name}</a></strong></td>` +
        `<td>${summary}</td>` +
        '</tr>'
      );
    })
    .join('');
}

function filterAndDisplayActionTypes() {
  const nameInput = document.getElementById('action-type-name');
  const searchName = nameInput ? nameInput.value.toLowerCase() : '';

  let filtered = actionTypesData.filter(function (type) {
    if (searchName && type.name.toLowerCase().indexOf(searchName) === -1) {
      return false;
    }
    return true;
  });

  filtered = sortArray(filtered, currentActionTypeSort.field, currentActionTypeSort.ascending);
  displayActionTypes(filtered);
}

function sortActionTypes(field) {
  if (currentActionTypeSort.field === field) {
    currentActionTypeSort.ascending = !currentActionTypeSort.ascending;
  } else {
    currentActionTypeSort.field = field;
    currentActionTypeSort.ascending = true;
  }
  filterAndDisplayActionTypes();
  saveFiltersToSession();
}

function displayCombat(components) {
  const tbody = document.getElementById('combat-results');
  const count = document.getElementById('combat-count');

  count.textContent = `${components.length} ${getPlural(components.length, 'компонент', 'компонента', 'компонентов')}`;

  if (!components.length) {
    tbody.innerHTML = '<tr><td colspan="2" class="no-results">Ничего не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = components
    .map(function (component) {
      const desc = component.description || '';
      const summary = buildSummary(desc, 120);
      return (
        '<tr>' +
        `<td><strong><a href="javascript:void(0)" onclick="showCombatPage('${component.id}')" style="color: var(--accent-emerald); text-decoration: none;">${component.name}</a></strong></td>` +
        `<td>${summary}</td>` +
        '</tr>'
      );
    })
    .join('');
}

function filterAndDisplayCombat() {
  const nameInput = document.getElementById('combat-name');
  const searchName = nameInput ? nameInput.value.toLowerCase() : '';

  let filtered = combatComponentsData.filter(function (component) {
    if (searchName && component.name.toLowerCase().indexOf(searchName) === -1) {
      return false;
    }
    return true;
  });

  filtered = sortArray(filtered, currentCombatSort.field, currentCombatSort.ascending);
  displayCombat(filtered);
}

function sortCombat(field) {
  if (currentCombatSort.field === field) {
    currentCombatSort.ascending = !currentCombatSort.ascending;
  } else {
    currentCombatSort.field = field;
    currentCombatSort.ascending = true;
  }
  filterAndDisplayCombat();
  saveFiltersToSession();
}

function hasActiveSpellFilters() {
  return spellFilters.type.length > 0 ||
         spellFilters.school.length > 0 ||
         spellFilters.damage.length > 0 ||
         spellFilters.concentration.length > 0 ||
         spellFilters.requiredLevel.length > 0;
}

function hasActiveSchoolFilters() {
  return schoolFilters.rarity.length > 0 ||
         schoolFilters.properties.length > 0 ||
         schoolFilters.difficulty.length > 0;
}

function hasActiveEffectFilters() {
  return effectFilters.actionType.length > 0;
}

function hasActiveSkillFilters() {
  return skillFilters.type.length > 0;
}

function hasActiveActionFilters() {
  return actionFilters.kind.length > 0;
}

function updateClearButtonsVisibility() {
  const spellClearBtn = document.getElementById('spell-filters-clear');
  const schoolClearBtn = document.getElementById('school-filters-clear');
  const effectClearBtn = document.getElementById('effect-filters-clear');
  const skillClearBtn = document.getElementById('skill-filters-clear');
  const actionClearBtn = document.getElementById('action-filters-clear');
  
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

  if (skillClearBtn) {
    if (hasActiveSkillFilters()) {
      skillClearBtn.classList.add('visible');
    } else {
      skillClearBtn.classList.remove('visible');
    }
  }

  if (actionClearBtn) {
    if (hasActiveActionFilters()) {
      actionClearBtn.classList.add('visible');
    } else {
      actionClearBtn.classList.remove('visible');
    }
  }
}

function quickClearSpellFilters() {
  spellFilters.type = [];
  spellFilters.school = [];
  spellFilters.damage = [];
  spellFilters.concentration = [];
  spellFilters.requiredLevel = [];
  
  tempSpellFilters.type = [];
  tempSpellFilters.school = [];
  tempSpellFilters.damage = [];
  tempSpellFilters.concentration = [];
  tempSpellFilters.requiredLevel = [];
  
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

function clearSkillFilters() {
  tempSkillFilters.type = [];

  document.querySelectorAll('#skills-filters-panel .filter-tag.active').forEach(function (tag) {
    tag.classList.remove('active');
  });
}

function applySkillFilters() {
  skillFilters.type = tempSkillFilters.type.slice();

  saveFiltersToSession();
  filterAndDisplaySkills();
  updateClearButtonsVisibility();
  closeFiltersPanel();
}

function cancelSkillFilters() {
  tempSkillFilters.type = skillFilters.type.slice();

  document.querySelectorAll('#skills-filters-panel .filter-tag').forEach(function (tag) {
    const value = tag.getAttribute('data-value');
    const isActive = tempSkillFilters.type.indexOf(value) !== -1;

    if (isActive) {
      tag.classList.add('active');
    } else {
      tag.classList.remove('active');
    }
  });

  closeFiltersPanel();
}

function quickClearSkillFilters() {
  skillFilters.type = [];
  tempSkillFilters.type = [];

  saveFiltersToSession();
  filterAndDisplaySkills();
  updateClearButtonsVisibility();
}

function clearActionFilters() {
  tempActionFilters.kind = [];

  document.querySelectorAll('#actions-filters-panel .filter-tag.active').forEach(function (tag) {
    tag.classList.remove('active');
  });
}

function applyActionFilters() {
  actionFilters.kind = tempActionFilters.kind.slice();

  saveFiltersToSession();
  filterAndDisplayActions();
  updateClearButtonsVisibility();
  closeFiltersPanel();
}

function cancelActionFilters() {
  tempActionFilters.kind = actionFilters.kind.slice();

  document.querySelectorAll('#actions-filters-panel .filter-tag').forEach(function (tag) {
    const value = tag.getAttribute('data-value');
    const isActive = tempActionFilters.kind.indexOf(value) !== -1;

    if (isActive) {
      tag.classList.add('active');
    } else {
      tag.classList.remove('active');
    }
  });

  closeFiltersPanel();
}

function quickClearActionFilters() {
  actionFilters.kind = [];
  tempActionFilters.kind = [];

  saveFiltersToSession();
  filterAndDisplayActions();
  updateClearButtonsVisibility();
}


