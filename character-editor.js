// Character Editor JavaScript

let currentUser = null;
let currentCharacterId = null;
let cloudCharacters = [];
let unsubscribeCharacters = null;
let initialCharacterIdFromLocation = null;
let hasAppliedCharacterFromLocation = false;
let hasUnsavedChanges = false;
let autosaveTimeoutId = null;
let currentEditingStatKey = '';
let currentSignedStatId = '';
let lastSavedCharacterData = null;
let charactersInitialLoaded = false;
const AUTOSAVE_DELAY_MS = 3000;
let editorSpellsData = [];
let editorSpellsDataLoaded = false;
let editorSpellsDataPromise = null;
let currentSpellSelectType = '';
let currentSpellSelectId = '';
let editorSchoolsData = [];
let editorSchoolsDataLoaded = false;
let editorSchoolsDataPromise = null;
let spellSelectFilters = {
  type: [],
  source: [],
  school: [],
  damage: [],
  concentration: [],
  requiredLevel: [],
  signature: []
};
let tempSpellSelectFilters = {
  type: [],
  source: [],
  school: [],
  damage: [],
  concentration: [],
  requiredLevel: [],
  signature: []
};
let spellSelectFiltersInitialized = false;
let currentSchoolSelectId = '';
let schoolSelectFilters = {
  rarity: [],
  properties: [],
  difficulty: []
};
let tempSchoolSelectFilters = {
  rarity: [],
  properties: [],
  difficulty: []
};
let schoolSelectFiltersInitialized = false;

const MAGIC_SKILLS = [
  { id: 'construction', name: 'Конструирование' },
  { id: 'spontaneity', name: 'Спонтанность' },
  { id: 'metamagic', name: 'Метамагия' },
  { id: 'creation', name: 'Созидание' },
  { id: 'ritualism', name: 'Ритуалогия' },
  { id: 'versatility', name: 'Многогранность' }
];

const PERSONALITY_SKILLS = [
  { id: 'communication', name: 'Общение' },
  { id: 'contacts', name: 'Контакты' },
  { id: 'knowledge', name: 'Знания' },
  { id: 'perception', name: 'Внимательность' },
  { id: 'stealth', name: 'Скрытность' },
  { id: 'physique', name: 'Телосложение' }
];

function renderSkillRows() {
  const magicContainer = document.getElementById('magic-skills-list');
  const personalityContainer = document.getElementById('personality-skills-list');

  if (magicContainer) {
    magicContainer.innerHTML = MAGIC_SKILLS.map(function(skill) {
      return '<div class="stat-row signed-stat-row" data-stat-id="' + skill.id + '">' +
        '<span class="stat-label">' + skill.name + '</span>' +
        '<input type="text" id="' + skill.id + '" class="readonly-field stat-value-input" readonly value="+0">' +
      '</div>';
    }).join('');
  }

  if (personalityContainer) {
    personalityContainer.innerHTML = PERSONALITY_SKILLS.map(function(skill) {
      return '<div class="stat-row signed-stat-row" data-stat-id="' + skill.id + '">' +
        '<span class="stat-label">' + skill.name + '</span>' +
        '<input type="text" id="' + skill.id + '" class="readonly-field stat-value-input" readonly value="+0">' +
      '</div>';
    }).join('');
  }
}

function showEditorLoader(message) {
  if (typeof showPageLoader === 'function') {
    showPageLoader(message || 'Загружаем редактор...');
  }
}

function hideEditorLoader() {
  if (typeof hidePageLoader === 'function') {
    hidePageLoader();
  }
}

function updateEditorLoaderMessage(message) {
  if (typeof setPageLoaderMessage === 'function' && message) {
    setPageLoaderMessage(message);
  }
}

// --- Вспомогательные функции для заклинаний ---
// Определяем, считается ли заклинание фирменным по блоку «Бонус Фирменного Заклинания» в описании
function editorSpellHasSignatureBonus(spell) {
  if (!spell || !spell.description) {
    return false;
  }
  const text = String(spell.description);
  return text.indexOf('Бонус Фирменного Заклинания') !== -1;
}

// Возвращаем человеко-читаемый источник заклинания:
// - если есть явное поле source — используем его;
// - если поля нет, но есть бонус фирменного заклинания — считаем «Фирменное»;
// - иначе оставляем пустым (учебные/прочие без явного ярлыка).
function getSpellSourceLabel(spell) {
  if (!spell) {
    return '';
  }
  const rawSource = typeof spell.source === 'string' ? spell.source.trim() : '';
  if (rawSource === 'Учебное' || rawSource === 'Фирменное') {
    return rawSource;
  }
  if (editorSpellHasSignatureBonus(spell)) {
    return 'Фирменное';
  }
  return '';
}

function renderSpellDescription(text) {
  if (!text) {
    return '<p>—</p>';
  }
  const paragraphs = String(text)
    .split(/\n{2,}/)
    .map(function (p) {
      return p.trim();
    })
    .filter(function (p) {
      return p.length > 0;
    });
  if (!paragraphs.length) {
    return '<p>—</p>';
  }
  return paragraphs
    .map(function (p) {
      return '<p>' + p + '</p>';
    })
    .join('');
}

// Оборачиваем формулы бросков (2d4, 3d8, 2d4+1 и т.п.) в кликабельные ссылки
// spellName — название заклинания для контекста, source — строковый идентификатор источника
function editorLinkifyDiceExpressions(html, spellName, source) {
  if (!html) {
    return html;
  }
  var safeSpell = spellName || '';
  var safeSource = source || 'editor-spell';

  return String(html).replace(/\b(\d{1,3})d(2|4|6|8|10|12|20|100)([+\-]\d+)?\b/g, function (match) {
    var expr = match;
    var escapedExpr = expr.replace(/"/g, '&quot;');
    var escapedSpell = safeSpell.replace(/"/g, '&quot;');
    var escapedSource = safeSource.replace(/"/g, '&quot;');
    return (
      '<a href="javascript:void(0)" class="dice-roll-link" data-dice-expression="' +
      escapedExpr +
      '" data-spell-name="' +
      escapedSpell +
      '" data-dice-source="' +
      escapedSource +
      '">' +
      match +
      '</a>'
    );
  });
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

  if (text === 'Близкая' || text === 'Малая' || text === 'Средняя' || text === 'Дальняя') {
    return '<a href="' + base + '#категории-дальности" ' + style + '>' + text + '</a>';
  }

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

function getRarityId(rarity) {
  const rarityMap = {
    'Редкая': 'rare',
    'Эпическая': 'epic',
    'Скрытая': 'hidden'
  };
  return rarityMap[rarity] || 'rare';
}

function getCharacterIdFromLocation() {
  const url = new URL(window.location.href);
  const param = url.searchParams.get('characterId');
  return param || '';
}

function setCharacterIdInLocation(id) {
  const url = new URL(window.location.href);
  if (id) {
    url.searchParams.set('characterId', id);
  } else {
    url.searchParams.delete('characterId');
  }
  window.history.replaceState({}, '', url.toString());
}

function showCharactersListPage() {
  const listSection = document.getElementById('characters-list-page');
  const editorSection = document.getElementById('character-editor-page');

  if (listSection) {
    listSection.classList.remove('hidden');
  }
  if (editorSection) {
    editorSection.classList.add('hidden');
  }
}

function showCharacterEditorPage() {
  const listSection = document.getElementById('characters-list-page');
  const editorSection = document.getElementById('character-editor-page');

  if (listSection) {
    listSection.classList.add('hidden');
  }
  if (editorSection) {
    editorSection.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  fetchSpellsData().then(function () {
    renderSpellsFromData(null);
    updateSpellRecommendations();
  });
  fetchSchoolsData();

  initialCharacterIdFromLocation = getCharacterIdFromLocation();

  const levelInput = document.getElementById('level');
  if (levelInput) {
    levelInput.addEventListener('input', updateCalculations);
  }

  initEditorTabs();
  initBonusAddButton();
  initEditorNavigation();
  renderSkillRows();
  initSignedStatInputs();
  initDescriptionFeatures();
  initHealthWillStatBlocks();
  initDefenseShields();
  initSignedStatModal();
  initSpellSelectModal();
  initSchoolSelectModal();
  initSpellDetailsModal();

  if (initialCharacterIdFromLocation) {
    showCharacterEditorPage();
  } else {
    showCharactersListPage();
  }

  updateCalculations();
  renderCharactersList([]);
});

function fetchSpellsData() {
  if (editorSpellsDataPromise) {
    return editorSpellsDataPromise;
  }

  editorSpellsDataPromise = fetch('data/spells.json')
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (Array.isArray(data)) {
        editorSpellsData = data;
      } else {
        editorSpellsData = [];
      }
      editorSpellsDataLoaded = true;
      return editorSpellsData;
    })
    .catch(function () {
      editorSpellsData = [];
      editorSpellsDataLoaded = true;
      return editorSpellsData;
    });

  return editorSpellsDataPromise;
}

function fetchSchoolsData() {
  if (editorSchoolsDataPromise) {
    return editorSchoolsDataPromise;
  }

  editorSchoolsDataPromise = fetch('data/schools.json')
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (Array.isArray(data)) {
        editorSchoolsData = data;
      } else {
        editorSchoolsData = [];
      }
      editorSchoolsDataLoaded = true;
      return editorSchoolsData;
    })
    .catch(function () {
      editorSchoolsData = [];
      editorSchoolsDataLoaded = true;
      return editorSchoolsData;
    });

  return editorSchoolsDataPromise;
}

function scheduleAutosave() {
  return;
}

function performAutosave() {
  if (!currentUser || !hasUnsavedChanges) {
    return;
  }

  const data = collectFormData();

  if (!data.name) {
    return;
  }

  data.lastModified = new Date().toISOString();

  const db = getDb();
  const ref = db.collection('users').doc(currentUser.uid).collection('characters');

  if (currentCharacterId) {
    ref
      .doc(currentCharacterId)
      .set(data)
      .then(function () {
        lastSavedCharacterData = JSON.parse(JSON.stringify(data));
        hasUnsavedChanges = false;
      })
      .catch(function (error) {
        console.error('Failed to update character in Firestore (autosave):', error);
      });
  } else {
    ref
      .add(data)
      .then(function (docRef) {
        currentCharacterId = docRef.id;
        setCharacterIdInLocation(currentCharacterId || '');
        lastSavedCharacterData = JSON.parse(JSON.stringify(data));
        hasUnsavedChanges = false;
      })
      .catch(function (error) {
        console.error('Failed to create character in Firestore (autosave):', error);
      });
  }
}

function initAutosaveListeners() {
  return;
}

function getHealthWillValues() {
  const healthCurrentInput = document.getElementById('health-current');
  const healthMaxInput = document.getElementById('health-max');
  const willCurrentInput = document.getElementById('will-current');
  const willMaxInput = document.getElementById('will-max');

  const healthCurrent = parseInt(healthCurrentInput.value, 10) || 0;
  const healthMax = parseInt(healthMaxInput.value, 10) || 0;
  const willCurrent = parseInt(willCurrentInput.value, 10) || 0;
  const willMax = parseInt(willMaxInput.value, 10) || 0;

  return {
    health: {
      current: healthCurrent,
      max: healthMax
    },
    will: {
      current: willCurrent,
      max: willMax
    }
  };
}

function updateHealthWillDisplay() {
  const values = getHealthWillValues();
  const healthDisplay = document.getElementById('stat-health-display');
  const willDisplay = document.getElementById('stat-will-display');

  if (healthDisplay) {
    healthDisplay.textContent = values.health.current + '/' + values.health.max;
  }
  if (willDisplay) {
    willDisplay.textContent = values.will.current + '/' + values.will.max;
  }
}

function openStatEditModal(statKey) {
  currentEditingStatKey = statKey;

  const values = getHealthWillValues();
  const titleElement = document.getElementById('stat-edit-title');
  const currentInput = document.getElementById('stat-edit-current');
  const maxInput = document.getElementById('stat-edit-max');
  const modal = document.getElementById('stat-edit-modal');

  if (titleElement && currentInput && maxInput && modal) {
    if (statKey === 'health') {
      titleElement.textContent = 'Здоровье';
      currentInput.value = values.health.current;
      maxInput.value = values.health.max;
    } else if (statKey === 'will') {
      titleElement.textContent = 'Воля';
      currentInput.value = values.will.current;
      maxInput.value = values.will.max;
    }
    modal.classList.remove('hidden');
  }
}

function closeStatEditModal() {
  const modal = document.getElementById('stat-edit-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  currentEditingStatKey = '';
}

function applyStatEditValues() {
  const currentInput = document.getElementById('stat-edit-current');
  const maxInput = document.getElementById('stat-edit-max');

  if (!currentInput || !maxInput || !currentEditingStatKey) {
    closeStatEditModal();
    return;
  }

  let currentValue = parseInt(currentInput.value, 10);
  let maxValue = parseInt(maxInput.value, 10);

  if (Number.isNaN(currentValue)) {
    currentValue = 0;
  }
  if (Number.isNaN(maxValue)) {
    maxValue = 0;
  }
  if (maxValue < 1) {
    maxValue = 1;
  }
  if (currentValue < 0) {
    currentValue = 0;
  }
  if (currentValue > maxValue) {
    currentValue = maxValue;
  }

  if (currentEditingStatKey === 'health') {
    const healthCurrentInput = document.getElementById('health-current');
    const healthMaxInput = document.getElementById('health-max');
    if (healthCurrentInput && healthMaxInput) {
      healthCurrentInput.value = currentValue;
      healthMaxInput.value = maxValue;
    }
  } else if (currentEditingStatKey === 'will') {
    const willCurrentInput = document.getElementById('will-current');
    const willMaxInput = document.getElementById('will-max');
    if (willCurrentInput && willMaxInput) {
      willCurrentInput.value = currentValue;
      willMaxInput.value = maxValue;
    }
  }

  updateHealthWillDisplay();
  closeStatEditModal();
}

function initHealthWillStatBlocks() {
  updateHealthWillDisplay();

  const healthRow = document.getElementById('health-stat-row');
  const willRow = document.getElementById('will-stat-row');
  const healthMinusButton = document.getElementById('health-minus');
  const healthPlusButton = document.getElementById('health-plus');
  const willMinusButton = document.getElementById('will-minus');
  const willPlusButton = document.getElementById('will-plus');
  const saveButton = document.getElementById('stat-edit-save');
  const cancelButton = document.getElementById('stat-edit-cancel');
  const modal = document.getElementById('stat-edit-modal');

  if (healthRow) {
    healthRow.addEventListener('click', function () {
      openStatEditModal('health');
    });
  }

  if (willRow) {
    willRow.addEventListener('click', function () {
      openStatEditModal('will');
    });
  }

  if (healthMinusButton) {
    healthMinusButton.addEventListener('click', function (event) {
      event.stopPropagation();
      changeHealthCurrent(-1);
    });
  }

  if (healthPlusButton) {
    healthPlusButton.addEventListener('click', function (event) {
      event.stopPropagation();
      changeHealthCurrent(1);
    });
  }

  if (willMinusButton) {
    willMinusButton.addEventListener('click', function (event) {
      event.stopPropagation();
      changeWillCurrent(-1);
    });
  }

  if (willPlusButton) {
    willPlusButton.addEventListener('click', function (event) {
      event.stopPropagation();
      changeWillCurrent(1);
    });
  }

  if (saveButton) {
    saveButton.addEventListener('click', function () {
      applyStatEditValues();
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      closeStatEditModal();
    });
  }

  if (modal) {
    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        closeStatEditModal();
      }
    });
  }
}

function changeHealthCurrent(delta) {
  const currentInput = document.getElementById('health-current');
  const maxInput = document.getElementById('health-max');

  if (!currentInput || !maxInput) {
    return;
  }

  let current = parseInt(currentInput.value, 10);
  let max = parseInt(maxInput.value, 10);

  if (Number.isNaN(current)) {
    current = 0;
  }
  if (Number.isNaN(max) || max < 1) {
    max = 1;
  }

  current += delta;

  if (current < 0) {
    current = 0;
  }
  if (current > max) {
    current = max;
  }

  currentInput.value = current;
  updateHealthWillDisplay();
}

function changeWillCurrent(delta) {
  const currentInput = document.getElementById('will-current');
  const maxInput = document.getElementById('will-max');

  if (!currentInput || !maxInput) {
    return;
  }

  let current = parseInt(currentInput.value, 10);
  let max = parseInt(maxInput.value, 10);

  if (Number.isNaN(current)) {
    current = 0;
  }
  if (Number.isNaN(max) || max < 1) {
    max = 1;
  }

  current += delta;

  if (current < 0) {
    current = 0;
  }
  if (current > max) {
    current = max;
  }

  currentInput.value = current;
  updateHealthWillDisplay();
}

function renderDefenseShields() {
  const valueElement = document.getElementById('defense-value');
  const container = document.getElementById('defense-shields');

  if (!valueElement || !container) {
    return;
  }

  let current = parseInt(valueElement.value, 10);
  if (Number.isNaN(current) || current < 0) {
    current = 0;
  }
  if (current > 5) {
    current = 5;
  }
  valueElement.value = current;

  const shields = container.querySelectorAll('.defense-shield');
  shields.forEach(function (shield, index) {
    if (index < current) {
      shield.classList.add('active');
    } else {
      shield.classList.remove('active');
    }
  });
}

function changeDefenseValue(delta) {
  const valueElement = document.getElementById('defense-value');

  if (!valueElement) {
    return;
  }

  let current = parseInt(valueElement.value, 10);
  if (Number.isNaN(current) || current < 0) {
    current = 0;
  }
  if (current > 5) {
    current = 5;
  }
  current += delta;
  if (current < 0) {
    current = 0;
  }
  if (current > 5) {
    current = 5;
  }

  valueElement.value = current;
  renderDefenseShields();
}

function initDefenseShields() {
  renderDefenseShields();

  const minusButton = document.getElementById('defense-minus');
  const plusButton = document.getElementById('defense-plus');

  if (minusButton) {
    minusButton.addEventListener('click', function () {
      changeDefenseValue(-1);
    });
  }

  if (plusButton) {
    plusButton.addEventListener('click', function () {
      changeDefenseValue(1);
    });
  }
}

function formatSignedStatInput(input) {
  const raw = input.value.trim();
  const parsed = parseInt(raw, 10);
  const value = Number.isNaN(parsed) ? 0 : parsed;
  const prefix = value >= 0 ? '+' : '';
  input.value = prefix + value;
}

function initSignedStatInputs() {
  const ids = [
    'construction',
    'spontaneity',
    'metamagic',
    'creation',
    'ritualism',
    'versatility',
    'communication',
    'contacts',
    'knowledge',
    'perception',
    'stealth',
    'physique'
  ];

  ids.forEach(function (id) {
    const input = document.getElementById(id);
    if (!input) {
      return;
    }

    formatSignedStatInput(input);

    if (!input.dataset.signedInit) {
      input.addEventListener('blur', function () {
        formatSignedStatInput(input);
      });
      input.dataset.signedInit = '1';
    }
  });
}

function getSignedStatConfig(statId) {
  if (statId === 'construction') {
    return {
      title: 'Конструирование',
      min: -2,
      max: 2,
      helpText: 'Допустимый диапазон: от -2 до +2.'
    };
  }
  if (statId === 'spontaneity') {
    return {
      title: 'Спонтанность',
      min: -2,
      max: 2,
      helpText: 'Допустимый диапазон: от -2 до +2.'
    };
  }
  if (statId === 'metamagic') {
    return {
      title: 'Метамагия',
      min: -2,
      max: 2,
      helpText: 'Допустимый диапазон: от -2 до +2.'
    };
  }
  if (statId === 'creation') {
    return {
      title: 'Созидание',
      min: -2,
      max: 2,
      helpText: 'Допустимый диапазон: от -2 до +2.'
    };
  }
  if (statId === 'ritualism') {
    return {
      title: 'Ритуалогия',
      min: -2,
      max: 2,
      helpText: 'Допустимый диапазон: от -2 до +2.'
    };
  }
  if (statId === 'versatility') {
    return {
      title: 'Многогранность',
      min: -2,
      max: 2,
      helpText: 'Допустимый диапазон: от -2 до +2.'
    };
  }
  if (statId === 'communication') {
    return {
      title: 'Общение',
      min: -3,
      max: 3,
      helpText: 'Допустимый диапазон: от -3 до +3.'
    };
  }
  if (statId === 'contacts') {
    return {
      title: 'Контакты',
      min: -3,
      max: 3,
      helpText: 'Допустимый диапазон: от -3 до +3.'
    };
  }
  if (statId === 'knowledge') {
    return {
      title: 'Знания',
      min: -3,
      max: 3,
      helpText: 'Допустимый диапазон: от -3 до +3.'
    };
  }
  if (statId === 'perception') {
    return {
      title: 'Внимательность',
      min: -3,
      max: 3,
      helpText: 'Допустимый диапазон: от -3 до +3.'
    };
  }
  if (statId === 'stealth') {
    return {
      title: 'Скрытность',
      min: -3,
      max: 3,
      helpText: 'Допустимый диапазон: от -3 до +3.'
    };
  }
  if (statId === 'physique') {
    return {
      title: 'Телосложение',
      min: -3,
      max: 3,
      helpText: 'Допустимый диапазон: от -3 до +3.'
    };
  }

  return {
    title: 'Характеристика',
    min: -10,
    max: 10,
    helpText: 'Введите значение характеристики.'
  };
}

function openSignedStatModal(statId) {
  currentSignedStatId = statId;

  const config = getSignedStatConfig(statId);
  const modal = document.getElementById('signed-stat-modal');
  const titleElement = document.getElementById('signed-stat-title');
  const input = document.getElementById('signed-stat-input');
  const helpElement = document.getElementById('signed-stat-help');
  const targetInput = document.getElementById(statId);

  if (!modal || !titleElement || !input || !helpElement || !targetInput) {
    return;
  }

  titleElement.textContent = config.title;
  helpElement.textContent = config.helpText;
  input.min = String(config.min);
  input.max = String(config.max);

  const currentValue = parseInt(targetInput.value, 10);
  input.value = Number.isNaN(currentValue) ? 0 : currentValue;

  modal.classList.remove('hidden');
  input.focus();
  input.select();
}

function closeSignedStatModal() {
  const modal = document.getElementById('signed-stat-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  currentSignedStatId = '';
}

function applySignedStatModal() {
  const input = document.getElementById('signed-stat-input');

  if (!input || !currentSignedStatId) {
    closeSignedStatModal();
    return;
  }

  const config = getSignedStatConfig(currentSignedStatId);
  let value = parseInt(input.value, 10);

  if (Number.isNaN(value)) {
    value = 0;
  }
  if (value < config.min) {
    value = config.min;
  }
  if (value > config.max) {
    value = config.max;
  }

  const targetInput = document.getElementById(currentSignedStatId);

  if (targetInput) {
    targetInput.value = value;
    formatSignedStatInput(targetInput);
  }

  closeSignedStatModal();
}

function initSignedStatModal() {
  const rows = document.querySelectorAll('.signed-stat-row');
  const modal = document.getElementById('signed-stat-modal');
  const saveButton = document.getElementById('signed-stat-save');
  const cancelButton = document.getElementById('signed-stat-cancel');
  const valueInput = document.getElementById('signed-stat-input');

  if (!rows.length || !modal || !saveButton || !cancelButton || !valueInput) {
    return;
  }

  rows.forEach(function (row) {
    const statId = row.getAttribute('data-stat-id');
    if (!statId) {
      return;
    }
    row.addEventListener('click', function () {
      openSignedStatModal(statId);
    });
  });

  saveButton.addEventListener('click', function () {
    applySignedStatModal();
  });

  cancelButton.addEventListener('click', function () {
    closeSignedStatModal();
  });

  modal.addEventListener('click', function (event) {
    if (event.target === modal) {
      closeSignedStatModal();
    }
  });

  valueInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      applySignedStatModal();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSignedStatModal();
    }
  });
}

function getBonusesFromUI() {
  const result = [];
  const container = document.getElementById('bonuses-list');

  if (!container) {
    return result;
  }

  const items = container.querySelectorAll('.bonus-item');
  items.forEach(function (item) {
    const nameInput = item.querySelector('.bonus-name');
    const statSelect = item.querySelector('.bonus-stat');
    const valueDisplay = item.querySelector('.bonus-value-display');
    const rawText = valueDisplay ? valueDisplay.textContent.trim() : '+0';
    const value = parseInt(rawText, 10);

    result.push({
      name: nameInput ? nameInput.value.trim() : '',
      stat: statSelect ? statSelect.value : 'arcana',
      value: Number.isNaN(value) ? 0 : value
    });
  });

  return result;
}

function calculateBonusForStat(bonuses, statKey) {
  const combined = Array.isArray(bonuses) ? bonuses : [];
  let total = 0;

  combined.forEach(function (bonus) {
    if (bonus.stat === statKey) {
      total += bonus.value;
    }
  });

  return total;
}

function getCurrentSpellRollBonuses() {
  const level = parseInt(document.getElementById('level').value, 10) || 1;
  const stats = calculateStatsByLevel(level);
  const bonuses = getBonusesFromUI();

  const arcana = stats.arcana + calculateBonusForStat(bonuses, 'arcana');
  const hit = arcana + calculateBonusForStat(bonuses, 'attack');
  const apply = arcana + calculateBonusForStat(bonuses, 'cast');

  return {
    arcana,
    hit,
    apply
  };
}

function editorExtractSpellRollInfo(spell) {
  const result = {
    hitBonus: null,
    applyBonus: null
  };

  if (!spell || !spell.description) {
    return result;
  }

  const text = String(spell.description);

  try {
    const hitMatch = text.match(/Бросок на [Пп]опадание[\s\S]*?\(([+-]?\d+)\)/);
    if (hitMatch && hitMatch[1] !== undefined) {
      const hitValue = parseInt(hitMatch[1], 10);
      if (!Number.isNaN(hitValue)) {
        result.hitBonus = hitValue;
      }
    }
  } catch (e) {
    // no-op
  }

  try {
    const applyMatch = text.match(/Бросок на [Нн]аложение эффекта[\s\S]*?\(([+-]?\d+)\)/);
    if (applyMatch && applyMatch[1] !== undefined) {
      const applyValue = parseInt(applyMatch[1], 10);
      if (!Number.isNaN(applyValue)) {
        result.applyBonus = applyValue;
      }
    }
  } catch (e) {
    // no-op
  }

  return result;
}

function rollSpellFromEditor(rollType, spellName) {
  const bonuses = getCurrentSpellRollBonuses();
  const bonusValue = rollType === 'arcana' ? bonuses.arcana : rollType === 'hit' ? bonuses.hit : bonuses.apply;
  let expression = '1d12';
  if (bonusValue > 0) {
    expression += '+' + bonusValue;
  } else if (bonusValue < 0) {
    expression += bonusValue;
  }

  const labelMap = {
    arcana: 'Бросок на Аркану',
    hit: 'Бросок на Попадание',
    apply: 'Бросок на Наложение эффекта'
  };

  const labelBonus = bonusValue >= 0 ? '+' + bonusValue : String(bonusValue);
  const sheetCharacter = {
    id: 'editor-current',
    name: (document.getElementById('name') && document.getElementById('name').value.trim()) || 'Персонаж',
    arcana: bonuses.arcana,
    hit: bonuses.hit,
    apply: bonuses.apply,
    baseArcana: bonuses.arcana
  };
  const context = {
    label: (labelMap[rollType] || 'Бросок') + ' (' + labelBonus + ')',
    rollType: rollType,
    spell: spellName || '',
    source: 'editor-spell-' + rollType,
    baseExpression: '1d12',
    noAutoCharacterBonus: true,
    sheetCharacter: sheetCharacter,
    allowCharacter: true,
    allowCharacterBreakdown: false
  };

  if (typeof openDiceRollerPanel === 'function') {
    openDiceRollerPanel();
  }
  if (typeof handleDiceRollCommand === 'function') {
    handleDiceRollCommand(expression, context);
  } else {
    console.error('Dice roller is not available.');
  }
}

function updateCalculations() {
  const level = parseInt(document.getElementById('level').value, 10) || 1;
  const stats = calculateStatsByLevel(level);
  const bonuses = getBonusesFromUI();

  const arcanaBonus = calculateBonusForStat(bonuses, 'arcana');
  const arcanaTotal = stats.arcana + arcanaBonus;
  const attackTotal = arcanaTotal + calculateBonusForStat(bonuses, 'attack');
  const castTotal = arcanaTotal + calculateBonusForStat(bonuses, 'cast');
  const evasionTotal = stats.evasion + calculateBonusForStat(bonuses, 'evasion');
  const saveTotal = stats.savingThrow + calculateBonusForStat(bonuses, 'save');
  const fortitudeBaseTotal = stats.fortitudeBase + calculateBonusForStat(bonuses, 'fortitude');
  const fortitudeLowTotal = fortitudeBaseTotal * 4 + calculateBonusForStat(bonuses, 'fortitudeLow');
  const fortitudeMidTotal = fortitudeBaseTotal * 8 + calculateBonusForStat(bonuses, 'fortitudeMid');
  const fortitudeHighTotal = fortitudeBaseTotal * 12 + calculateBonusForStat(bonuses, 'fortitudeHigh');
  const passiveAttentionTotal = stats.passiveAttentiveness;

  const arcanaElement = document.getElementById('stat-arcana');
  const attackElement = document.getElementById('stat-attack-bonus');
  const castElement = document.getElementById('stat-cast-bonus');
  const evasionElement = document.getElementById('stat-evasion');
  const saveElement = document.getElementById('stat-save');
  const fortBaseElement = document.getElementById('stat-fort-base');
  const fortLowElement = document.getElementById('stat-fort-low');
  const fortMidElement = document.getElementById('stat-fort-mid');
  const fortHighElement = document.getElementById('stat-fort-high');
  const attentivenessElement = document.getElementById('stat-attentiveness');

  if (arcanaElement) {
    arcanaElement.textContent = '+' + arcanaTotal;
  }
  if (attackElement) {
    attackElement.textContent = '+' + attackTotal;
  }
  if (castElement) {
    castElement.textContent = '+' + castTotal;
  }
  if (evasionElement) {
    evasionElement.textContent = evasionTotal;
  }
  if (saveElement) {
    saveElement.textContent = saveTotal;
  }
  if (fortBaseElement) {
    fortBaseElement.textContent = fortitudeBaseTotal;
  }
  if (fortLowElement) {
    fortLowElement.textContent = fortitudeLowTotal;
  }
  if (fortMidElement) {
    fortMidElement.textContent = fortitudeMidTotal;
  }
  if (fortHighElement) {
    fortHighElement.textContent = fortitudeHighTotal;
  }
  if (attentivenessElement) {
    attentivenessElement.textContent = passiveAttentionTotal;
  }
  updateSpellRecommendations();
}

function findSpellById(spellId) {
  if (!editorSpellsDataLoaded || !Array.isArray(editorSpellsData)) {
    return null;
  }
  for (let i = 0; i < editorSpellsData.length; i += 1) {
    if (editorSpellsData[i] && typeof editorSpellsData[i].id === 'string' && editorSpellsData[i].id === spellId) {
      return editorSpellsData[i];
    }
  }
  return null;
}

function findSchoolById(schoolId) {
  if (!editorSchoolsDataLoaded || !Array.isArray(editorSchoolsData)) {
    return null;
  }
  for (let i = 0; i < editorSchoolsData.length; i += 1) {
    if (editorSchoolsData[i] && typeof editorSchoolsData[i].id === 'string' && editorSchoolsData[i].id === schoolId) {
      return editorSchoolsData[i];
    }
  }
  return null;
}

function findSchoolByName(schoolName) {
  if (!editorSchoolsDataLoaded || !Array.isArray(editorSchoolsData)) {
    return null;
  }
  const trimmed = typeof schoolName === 'string' ? schoolName.trim() : '';
  if (!trimmed) {
    return null;
  }
  for (let i = 0; i < editorSchoolsData.length; i += 1) {
    const school = editorSchoolsData[i];
    if (school && typeof school.name === 'string' && school.name === trimmed) {
      return school;
    }
  }
  return null;
}

function formatSpellActionLabel(actionType) {
  if (actionType === 'Реакция') {
    return 'Реакция';
  }
  return 'Действие';
}

function formatSpellDistance(value) {
  if (!value) {
    return '—';
  }
  return String(value).trim();
}

function buildSpellDetailsHtml(spell) {
  let parametersHTML = '<h3>Параметры</h3><ul>';
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

  if (spell.school) {
    parametersHTML +=
      '<li><strong>Школа Магии:</strong> <a href="db.html?school=' +
      encodeURIComponent(spell.school) +
      '" style="color: var(--accent-emerald); text-decoration: none;">' +
      spell.school +
      '</a></li>';
  }

  const sourceLabel = getSpellSourceLabel(spell);
  if (sourceLabel) {
    parametersHTML += '<li><strong>Источник Заклинания:</strong> ' + sourceLabel + '</li>';
  }


  if (spell.type) {
    parametersHTML += '<li><strong>Тип Действия:</strong> ' + spell.type + '</li>';
  }

  if (spell.trigger) {
    parametersHTML += '<li><strong>Триггер:</strong> ' + spell.trigger + '</li>';
  }

  parametersHTML += '</ul>';

  let subSpellsHTML = '';
  if (spell.subSpells && spell.subSpells.length > 0) {
    subSpellsHTML = '<h3>Варианты использования</h3>';
    spell.subSpells.forEach(function (subSpell) {
      subSpellsHTML +=
        '<div style="margin-bottom: var(--spacing-lg); padding: var(--spacing-md); background: rgba(42, 42, 42, 0.4); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">';
      subSpellsHTML +=
        '<h3 style="margin-top: 0; color: var(--accent-emerald);">' + String(subSpell.name || '') + '</h3>';

      if (
        subSpell.actions ||
        subSpell.range ||
        subSpell.target ||
        subSpell.duration ||
        subSpell.damageType ||
        subSpell.type
      ) {
        subSpellsHTML +=
          '<h4 style="margin-top: var(--spacing-md); margin-bottom: var(--spacing-sm); font-size: 1.1em;">Параметры</h4>';
        subSpellsHTML += '<ul style="margin: 0; font-size: 0.95em;">';

        if (subSpell.actions) {
          const subActionLabel = formatActionLabel(subSpell.actionType || 'Действие');
          subSpellsHTML +=
            '<li><strong>Действие:</strong> ' + subActionLabel + ' (' + String(subSpell.actions) + ')</li>';
        }
        if (subSpell.range) {
          subSpellsHTML +=
            '<li><strong>Дистанция:</strong> ' + linkifyDistance(subSpell.range) + '</li>';
        }
        if (subSpell.target) {
          subSpellsHTML +=
            '<li><strong>Цель/Область:</strong> ' + linkifyDistance(subSpell.target) + '</li>';
        }
        if (subSpell.duration) {
          subSpellsHTML += '<li><strong>Длительность:</strong> ' + subSpell.duration + '</li>';
        }
        if (subSpell.damageType && (Array.isArray(subSpell.damageType) ? subSpell.damageType.length : true)) {
          let damageText = Array.isArray(subSpell.damageType)
            ? subSpell.damageType.join(', ')
            : subSpell.damageType;
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
        subSpellsHTML +=
          '<h4 style="margin-top: var(--spacing-md); margin-bottom: var(--spacing-sm); font-size: 1.1em;">Описание</h4>';
        subSpellsHTML += editorLinkifyDiceExpressions(
          renderSpellDescription(subSpell.description),
          spell.name,
          'editor-subspell-description'
        );
      }

      subSpellsHTML += '</div>';
    });
  }

  return (
    parametersHTML +
    '<h3>Описание</h3>' +
    editorLinkifyDiceExpressions(
      renderSpellDescription(spell.description),
      spell.name,
      'editor-spell-description'
    ) +
    subSpellsHTML +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> ' +
    (spell.school
      ? '<a href="db.html?school=' +
        encodeURIComponent(spell.school) +
        '" style="color: var(--accent-emerald); text-decoration: none;">' +
        spell.school +
        '</a>, '
      : '') +
    '<a href="spellbook/intro.html" style="color: var(--accent-emerald); text-decoration: none;">Учебные заклинания</a></p>'
  );
}

function openSpellDetailsModal(spellId) {
  // Используем унифицированный поп-ап базы данных, чтобы были кнопки бросков
  if (typeof openDbEntity === 'function') {
    openDbEntity('spell', spellId).catch(function (err) {
      console.error('Failed to open spell popup from character editor:', err);
    });
    return;
  }

  // Fallback: старое поведение (без кнопок бросков)
  const spell = findSpellById(spellId);
  if (!spell) {
    return;
  }
  const overlay = document.getElementById('spell-details-modal');
  const titleElement = document.getElementById('spell-details-title');
  const contentElement = document.getElementById('spell-details-content');
  if (!overlay || !titleElement || !contentElement) {
    return;
  }
  titleElement.textContent = spell.name;
  contentElement.innerHTML = buildSpellDetailsHtml(spell);
  overlay.classList.remove('hidden');
}

function closeSpellDetailsModal() {
  const overlay = document.getElementById('spell-details-modal');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

function initSpellDetailsModal() {
  const overlay = document.getElementById('spell-details-modal');
  const closeButton = document.getElementById('spell-details-close');

  if (!overlay || !closeButton) {
    return;
  }

  closeButton.addEventListener('click', function () {
    closeSpellDetailsModal();
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) {
      closeSpellDetailsModal();
    }
  });
}

function buildSchoolDetailsHtml(school) {
  let descriptionHTML = '';
  if (school.description) {
    descriptionHTML = '<h3>Описание</h3>' + renderSpellDescription(linkifySchoolText(school.description));
  }

  function renderListWithFormatting(text) {
    if (!text) {
      return '';
    }
    let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    processed = linkifySchoolText(processed);
    return processed;
  }

  let principlesHTML = '';
  if (school.principles && school.principles.length > 0) {
    const principleItems = school.principles
      .map(function (p) {
        return '<li>' + renderListWithFormatting(p) + '</li>';
      })
      .join('');
    principlesHTML = '<h3>Принципы</h3><ul>' + principleItems + '</ul>';
  }

  let featuresHTML = '';
  if (school.features && school.features.length > 0) {
    const featureItems = school.features
      .map(function (f) {
        return '<li>' + renderListWithFormatting(f) + '</li>';
      })
      .join('');
    featuresHTML = '<h3>Особенности</h3><ul>' + featureItems + '</ul>';
  }

  let spellsHTML = '';
  if (school.educationalSpells && school.educationalSpells.length > 0) {
    const spellItems = school.educationalSpells
      .map(function (spellName) {
        const spell = editorSpellsData.find(function (s) {
          return s.name === spellName;
        });
        if (spell) {
          return (
            '<li><a href="db.html?spell=' +
            spell.id +
            '" style="color: var(--accent-emerald); text-decoration: none;">' +
            spellName +
            '</a></li>'
          );
        }
        return '<li>' + spellName + '</li>';
      })
      .join('');
    spellsHTML = '<h3>Учебные Заклинания</h3><ul>' + spellItems + '</ul>';
  }

  let linksHTML = '<a href="spellbook/schools.html" style="color: var(--accent-emerald); text-decoration: none;">Школы Магии</a>';
  if (school.relatedSchools && school.relatedSchools.length > 0) {
    const relatedLinks = school.relatedSchools
      .map(function (relatedName) {
        return (
          '<a href="db.html?school=' +
          encodeURIComponent(relatedName) +
          '" style="color: var(--accent-emerald); text-decoration: none;">' +
          relatedName +
          '</a>'
        );
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
  if (school.difficulty || school.difficulty === 0) {
    difficultyHTML = '<li><strong>Сложность:</strong> ' + formatDifficultyStars(school.difficulty) + '</li>';
  }

  const rarityPart = school.rarity
    ? '<li><strong>Редкость:</strong> <a href="spellbook/schools.html#rarity-' +
      getRarityId(school.rarity) +
      '" style="color: var(--accent-emerald); text-decoration: none;">' +
      school.rarity +
      '</a></li>'
    : '';

  const html =
    '<h3>Параметры</h3>' +
    '<ul>' +
    rarityPart +
    propertiesHTML +
    difficultyHTML +
    '</ul>' +
    descriptionHTML +
    principlesHTML +
    featuresHTML +
    spellsHTML +
    '<hr style="margin: var(--spacing-xl) 0; border: none; border-top: 1px solid var(--border-color);">' +
    '<p class="text-muted"><strong>Связи:</strong> ' +
    linksHTML +
      '</p>';

  return html;
}

function openSchoolDetailsModal(schoolId) {
  const school = findSchoolById(schoolId);
  if (!school) {
    return;
  }

  const overlay = document.getElementById('spell-details-modal');
  const titleElement = document.getElementById('spell-details-title');
  const contentElement = document.getElementById('spell-details-content');

  if (!overlay || !titleElement || !contentElement) {
    return;
  }

  titleElement.textContent = school.name;
  contentElement.innerHTML = buildSchoolDetailsHtml(school);
  overlay.classList.remove('hidden');
}

function findSpellByName(spellName) {
  if (!editorSpellsDataLoaded || !Array.isArray(editorSpellsData)) {
    return null;
  }
  const trimmed = typeof spellName === 'string' ? spellName.trim() : '';
  if (!trimmed) {
    return null;
  }
  for (let i = 0; i < editorSpellsData.length; i += 1) {
    const spell = editorSpellsData[i];
    if (spell && typeof spell.name === 'string' && spell.name === trimmed) {
      return spell;
    }
  }
  return null;
}

function getSpellsForType(type) {
  if (!Array.isArray(editorSpellsData)) {
    return [];
  }
  const result = [];
  for (let i = 0; i < editorSpellsData.length; i += 1) {
    const spell = editorSpellsData[i];
    if (!spell || typeof spell.id !== 'string') {
      continue;
    }
    // Определяем источник заклинания:
    // учитываем как старое поле source, так и новый способ определения по «Бонус Фирменного Заклинания»
    const sourceLabel = getSpellSourceLabel(spell);
    const isSignature = sourceLabel === 'Фирменное';
    const isStudy = !isSignature;

    if (type === 'signature') {
      // Для фирменных заклинаний показываем только явно помеченные как "Фирменное"
      if (isSignature) {
        result.push(spell);
      }
    } else {
      // Для учебных заклинаний показываем всё, что помечено как "Учебное"
      // или не имеет источника (старые данные без поля source)
      if (isStudy) {
        result.push(spell);
      }
    }
  }
  return result;
}

function createSpellItem(type, initialData) {
  const listId = type === 'signature' ? 'signature-spells-list' : 'study-spells-list';
  const list = document.getElementById(listId);
  if (!list) {
    return;
  }

  let selectedId = '';
  let selectedName = '';
  let selectedSchool = '';
  let selectedType = '';

  if (initialData) {
    if (typeof initialData.id === 'string' && initialData.id) {
      const byId = findSpellById(initialData.id);
      if (byId) {
        selectedId = byId.id;
        selectedName = typeof byId.name === 'string' ? byId.name : '';
        selectedSchool = typeof byId.school === 'string' ? byId.school : '';
        selectedType = typeof byId.type === 'string' ? byId.type : '';
      }
    }
    if (!selectedId && typeof initialData.name === 'string' && initialData.name) {
      const byName = findSpellByName(initialData.name);
      if (byName) {
        selectedId = byName.id;
        selectedName = typeof byName.name === 'string' ? byName.name : '';
        selectedSchool = typeof byName.school === 'string' ? byName.school : '';
        selectedType = typeof byName.type === 'string' ? byName.type : '';
      }
    }
  }

  if (!selectedId) {
    return;
  }

  const item = document.createElement('div');
  item.className = 'spell-item';
  item.setAttribute('data-spell-type', type);
  item.setAttribute('data-spell-id', selectedId);

  const main = document.createElement('div');
  main.className = 'spell-main';

  const nameButton = document.createElement('button');
  nameButton.type = 'button';
  nameButton.className = 'spell-name-btn';
  nameButton.textContent = selectedName;
  nameButton.addEventListener('click', function () {
    openSpellDetailsModal(selectedId);
  });

  const meta = document.createElement('div');
  meta.className = 'spell-meta';
  if (selectedSchool && selectedType) {
    meta.textContent = selectedSchool + ' • ' + selectedType;
  } else if (selectedSchool) {
    meta.textContent = selectedSchool;
  } else if (selectedType) {
    meta.textContent = selectedType;
  }

  main.appendChild(nameButton);
  if (meta.textContent) {
    main.appendChild(meta);
  }

  const controls = document.createElement('div');
  controls.className = 'spell-controls';

  const rollButtons = document.createElement('div');
  rollButtons.className = 'spell-roll-mini';

  const spellData = selectedId ? findSpellById(selectedId) : null;
  const rollInfo = spellData ? editorExtractSpellRollInfo(spellData) : null;
  const hasHit = !!(rollInfo && rollInfo.hitBonus !== null && rollInfo.hitBonus !== undefined);
  const hasApply = !!(rollInfo && rollInfo.applyBonus !== null && rollInfo.applyBonus !== undefined);

  const arcanaBtn = document.createElement('button');
  arcanaBtn.type = 'button';
  arcanaBtn.className = 'spell-roll-mini-btn';
  arcanaBtn.textContent = 'А';
  arcanaBtn.title = 'Бросок на Аркану';
  arcanaBtn.addEventListener('click', function () {
    rollSpellFromEditor('arcana', selectedName);
  });

  const hitBtn = document.createElement('button');
  hitBtn.type = 'button';
  hitBtn.className = 'spell-roll-mini-btn';
  hitBtn.textContent = 'П';
  hitBtn.title = 'Бросок на Попадание';
  if (!hasHit) {
    hitBtn.classList.add('disabled');
    hitBtn.disabled = true;
  } else {
    hitBtn.addEventListener('click', function () {
      rollSpellFromEditor('hit', selectedName);
    });
  }

  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.className = 'spell-roll-mini-btn';
  applyBtn.textContent = 'Э';
  applyBtn.title = 'Бросок на Наложение эффекта';
  if (!hasApply) {
    applyBtn.classList.add('disabled');
    applyBtn.disabled = true;
  } else {
    applyBtn.addEventListener('click', function () {
      rollSpellFromEditor('apply', selectedName);
    });
  }

  rollButtons.appendChild(arcanaBtn);
  rollButtons.appendChild(hitBtn);
  rollButtons.appendChild(applyBtn);

  const activeButton = document.createElement('button');
  activeButton.type = 'button';
  activeButton.className = 'spell-active-toggle-btn';
  activeButton.textContent = '✓';
  if (initialData && initialData.active) {
    activeButton.classList.add('spell-active-on');
  }
  activeButton.addEventListener('click', function () {
    if (activeButton.classList.contains('spell-active-on')) {
      activeButton.classList.remove('spell-active-on');
    } else {
      activeButton.classList.add('spell-active-on');
    }
    updateSpellRecommendations();
  });

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'bonus-remove-btn';
  removeButton.innerHTML = '&times;';
  removeButton.addEventListener('click', function () {
    removeSpell(removeButton);
  });

  controls.appendChild(rollButtons);
  controls.appendChild(activeButton);
  controls.appendChild(removeButton);

  item.appendChild(main);
  item.appendChild(controls);

  list.appendChild(item);
  updateSpellRecommendations();
}

function createSchoolItem(initialData) {
  const list = document.getElementById('magic-schools-list');
  if (!list) {
    return;
  }

  let selectedId = '';
  let selectedName = '';

  if (initialData) {
    if (typeof initialData.id === 'string' && initialData.id) {
      const byId = findSchoolById(initialData.id);
      if (byId) {
        selectedId = byId.id;
        selectedName = typeof byId.name === 'string' ? byId.name : '';
      }
    }
    if (!selectedId && typeof initialData.name === 'string' && initialData.name) {
      const byName = findSchoolByName(initialData.name);
      if (byName) {
        selectedId = byName.id;
        selectedName = typeof byName.name === 'string' ? byName.name : '';
      }
    }
  }

  if (!selectedId) {
    return;
  }

  const item = document.createElement('div');
  item.className = 'spell-item';
  item.setAttribute('data-school-id', selectedId);

  const main = document.createElement('div');
  main.className = 'spell-main';

  const nameButton = document.createElement('button');
  nameButton.type = 'button';
  nameButton.className = 'spell-name-btn';
  nameButton.textContent = selectedName;
  nameButton.addEventListener('click', function () {
    openSchoolDetailsModal(selectedId);
  });

  main.appendChild(nameButton);

  const controls = document.createElement('div');
  controls.className = 'spell-controls';

  const activeButton = document.createElement('button');
  activeButton.type = 'button';
  activeButton.className = 'spell-active-toggle-btn';
  activeButton.textContent = '✓';
  if (initialData && initialData.active) {
    activeButton.classList.add('spell-active-on');
  }
  activeButton.addEventListener('click', function () {
    if (activeButton.classList.contains('spell-active-on')) {
      activeButton.classList.remove('spell-active-on');
    } else {
      activeButton.classList.add('spell-active-on');
    }
    updateSpellRecommendations();
  });

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'bonus-remove-btn';
  removeButton.innerHTML = '&times;';
  removeButton.addEventListener('click', function () {
    if (item.parentElement) {
      item.parentElement.removeChild(item);
    }
    updateSpellRecommendations();
  });

  controls.appendChild(activeButton);
  controls.appendChild(removeButton);

  item.appendChild(main);
  item.appendChild(controls);

  list.appendChild(item);
  updateSpellRecommendations();
}

function openSchoolSelectModal() {
  currentSchoolSelectId = '';
  const modal = document.getElementById('school-select-modal');
  const titleElement = document.getElementById('school-select-title');
  const searchInput = document.getElementById('school-search-input');

  if (!modal || !titleElement || !searchInput) {
    return;
  }

  titleElement.textContent = 'Выбор школы магии';

  fetchSchoolsData().then(function () {
    initSchoolSelectFilters();
    searchInput.value = '';
    renderSchoolSelectList();
    modal.classList.remove('hidden');
    searchInput.focus();
  });
}

function addStudySpell(initialData) {
  createSpellItem('study', initialData);
}

function addSignatureSpell(initialData) {
  createSpellItem('signature', initialData);
}

function removeSpell(button) {
  const item = button.closest('.spell-item');
  if (item && item.parentElement) {
    item.parentElement.removeChild(item);
  }
  updateSpellRecommendations();
}

function normalizeSpellsArray(spellsArray) {
  if (!Array.isArray(spellsArray)) {
    return [];
  }
  const result = [];
  for (let i = 0; i < spellsArray.length; i += 1) {
    const item = spellsArray[i];
    if (typeof item === 'string') {
      result.push({
        id: '',
        name: item,
        active: false
      });
    } else if (item && (typeof item.id === 'string' || typeof item.name === 'string')) {
      result.push({
        id: typeof item.id === 'string' ? item.id : '',
        name: typeof item.name === 'string' ? item.name : '',
        active: Boolean(item.active)
      });
    }
  }
  return result;
}

function normalizeSchoolsArray(schoolsArray) {
  if (!Array.isArray(schoolsArray)) {
    return [];
  }
  const result = [];
  for (let i = 0; i < schoolsArray.length; i += 1) {
    const item = schoolsArray[i];
    if (typeof item === 'string') {
      result.push({
        id: '',
        name: item,
        active: false
      });
    } else if (item && (typeof item.id === 'string' || typeof item.name === 'string')) {
      result.push({
        id: typeof item.id === 'string' ? item.id : '',
        name: typeof item.name === 'string' ? item.name : '',
        active: Boolean(item.active)
      });
    }
  }
  return result;
}

function renderSchoolSelectList() {
  const listElement = document.getElementById('school-select-list');
  const searchInput = document.getElementById('school-search-input');

  if (!listElement || !searchInput) {
    return;
  }

  const search = searchInput.value ? searchInput.value.toLowerCase() : '';

  if (!Array.isArray(editorSchoolsData)) {
    return;
  }

  listElement.innerHTML = '';

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML =
    '<tr>' +
    '<th>Название</th>' +
    '<th>Редкость</th>' +
    '<th>Сложность</th>' +
    '<th>Свойства</th>' +
    '</tr>';
  const tbody = document.createElement('tbody');

  editorSchoolsData.forEach(function (school) {
    const name = typeof school.name === 'string' ? school.name : '';
    const rarity = typeof school.rarity === 'string' ? school.rarity : '';
    const difficulty = school.difficulty || school.difficulty === 0 ? school.difficulty : null;
    const properties = Array.isArray(school.properties) ? school.properties : [];

    if (search && name.toLowerCase().indexOf(search) === -1) {
      return;
    }

    if (schoolSelectFilters.rarity.length) {
      if (!rarity || schoolSelectFilters.rarity.indexOf(rarity) === -1) {
        return;
      }
    }

    if (schoolSelectFilters.properties.length) {
      const properties = Array.isArray(school.properties) ? school.properties : [];
      if (!spellSelectHasAny(properties, schoolSelectFilters.properties)) {
        return;
      }
    }

    if (schoolSelectFilters.difficulty.length) {
      if (!difficulty && difficulty !== 0) {
        return;
      }
      let starsValue = '';
      for (let i = 0; i < difficulty; i += 1) {
        starsValue += '★';
      }
      if (!starsValue || schoolSelectFilters.difficulty.indexOf(starsValue) === -1) {
        return;
      }
    }

    const tr = document.createElement('tr');
    tr.setAttribute('data-school-id', school.id);

    const nameCell = document.createElement('td');
    nameCell.innerHTML = '<strong>' + name + '</strong>';

    const rarityCell = document.createElement('td');
    if (rarity) {
      rarityCell.innerHTML =
        '<a href="spellbook/schools.html#rarity-' +
        getRarityId(rarity) +
        '" style="color: var(--accent-emerald); text-decoration: none;">' +
        rarity +
        '</a>';
    } else {
      rarityCell.textContent = '—';
    }

    const difficultyCell = document.createElement('td');
    const difficultyText = formatDifficultyStars(difficulty);
    difficultyCell.textContent = difficultyText || '—';

    const propertiesCell = document.createElement('td');
    if (properties.length) {
      propertiesCell.innerHTML = properties
        .map(function (property) {
          return linkifySchoolProperty(property);
        })
        .join(', ');
    } else {
      propertiesCell.textContent = '—';
    }

    tr.appendChild(nameCell);
    tr.appendChild(rarityCell);
    tr.appendChild(difficultyCell);
    tr.appendChild(propertiesCell);

    tr.addEventListener('click', function () {
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(function (other) {
        other.classList.remove('selected');
      });
      tr.classList.add('selected');
      currentSchoolSelectId = school.id;
    });

    tbody.appendChild(tr);
  });

  if (!tbody.children.length) {
    const emptyRow = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.textContent = 'Ничего не найдено';
    emptyRow.appendChild(cell);
    tbody.appendChild(emptyRow);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  listElement.appendChild(table);
}

function closeSchoolSelectModal() {
  const modal = document.getElementById('school-select-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  currentSchoolSelectId = '';
}

function applySchoolSelection() {
  if (!currentSchoolSelectId) {
    closeSchoolSelectModal();
    return;
  }

  const school = findSchoolById(currentSchoolSelectId);
  if (!school) {
    closeSchoolSelectModal();
    return;
  }

  const initialData = {
    id: school.id,
    name: school.name,
    active: false
  };

  createSchoolItem(initialData);
  closeSchoolSelectModal();
}

function initSchoolSelectModal() {
  const modal = document.getElementById('school-select-modal');
  const cancelButton = document.getElementById('school-select-cancel');
  const applyButton = document.getElementById('school-select-apply');
  const searchInput = document.getElementById('school-search-input');
  const filterButton = document.getElementById('school-select-filters-btn');

  if (!modal || !cancelButton || !applyButton || !searchInput || !filterButton) {
    return;
  }

  cancelButton.addEventListener('click', function () {
    closeSchoolSelectModal();
  });

  applyButton.addEventListener('click', function () {
    applySchoolSelection();
  });

  modal.addEventListener('click', function (event) {
    if (event.target === modal) {
      closeSchoolSelectModal();
    }
  });

  searchInput.addEventListener('input', function () {
    renderSchoolSelectList();
  });

  filterButton.addEventListener('click', function () {
    openSchoolSelectFiltersPanel();
  });
}

function getUniqueSpellValues(items, key) {
  const values = [];
  const seen = {};
  for (let i = 0; i < items.length; i += 1) {
    const raw = items[i] && items[i][key];
    if (!raw) {
      continue;
    }
    const value = String(raw).trim();
    if (!value) {
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(seen, value)) {
      seen[value] = true;
      values.push(value);
    }
  }
  return values;
}

function schoolSelectCollectRarities() {
  const values = [];
  if (!Array.isArray(editorSchoolsData)) {
    return values;
  }
  editorSchoolsData.forEach(function (school) {
    if (school.rarity && values.indexOf(school.rarity) === -1) {
      values.push(school.rarity);
    }
  });
  values.sort();
  return values;
}

function schoolSelectCollectProperties() {
  const values = [];
  if (!Array.isArray(editorSchoolsData)) {
    return values;
  }
  editorSchoolsData.forEach(function (school) {
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

function schoolSelectCollectDifficulties() {
  const values = [];
  if (!Array.isArray(editorSchoolsData)) {
    return values;
  }
  editorSchoolsData.forEach(function (school) {
    if (school.difficulty || school.difficulty === 0) {
      let stars = '';
      const value = Number(school.difficulty) || 0;
      for (let i = 0; i < value; i += 1) {
        stars += '★';
      }
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

function spellSelectSplitToArray(value) {
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

function spellSelectHasAny(values, selected) {
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

function spellSelectCollectOptions(field, split) {
  const values = [];
  if (!Array.isArray(editorSpellsData)) {
    return values;
  }
  editorSpellsData.forEach(function (spell) {
    const raw = spell[field];
    if (!raw) {
      return;
    }
    let parts;
    if (Array.isArray(raw)) {
      parts = raw;
    } else if (split) {
      parts = spellSelectSplitToArray(raw);
    } else {
      parts = [String(raw).trim()];
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

function spellSelectCollectLevels() {
  const values = [];
  if (!Array.isArray(editorSpellsData)) {
    return values;
  }
  editorSpellsData.forEach(function (spell) {
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

function spellSelectCreateFilterTags(containerId, options, filterKey, filterObject) {
  createFilterTags(containerId, options, filterKey, filterObject);
}

function initSpellSelectFilters() {
  if (spellSelectFiltersInitialized) {
    return;
  }

  const schema = window.DB_SCHEMAS && window.DB_SCHEMAS.spells ? window.DB_SCHEMAS.spells : null;
  if (!schema || !schema.filters) {
    return;
  }

  schema.filters.forEach(function (filter) {
    let options = [];
    if (Array.isArray(filter.options)) {
      options = filter.options;
    } else if (filter.sourceField === 'requiredLevel') {
      options = spellSelectCollectLevels();
    } else if (filter.sourceField) {
      options = spellSelectCollectOptions(filter.sourceField, !!filter.split);
    }

    const containerIdMap = {
      type: 'spell-select-type-tags',
      source: 'spell-select-source-tags',
      school: 'spell-select-school-tags',
      damage: 'spell-select-damage-tags',
      concentration: 'spell-select-concentration-tags',
      requiredLevel: 'spell-select-level-tags',
      signature: 'spell-select-signature-tags'
    };

    const containerId = containerIdMap[filter.key];
    if (containerId) {
      spellSelectCreateFilterTags(containerId, options, filter.key, tempSpellSelectFilters);
    }
  });

  spellSelectFiltersInitialized = true;
}

function spellSelectToggleFilterCategory(element) {
  toggleFilterCategory(element);
}

function spellSelectSelectAllInCategory(containerId, filterKey) {
  selectAllInCategory(containerId, filterKey, tempSpellSelectFilters);
}

function spellSelectClearAllInCategory(containerId, filterKey) {
  clearAllInCategory(containerId, filterKey, tempSpellSelectFilters);
}

function syncSpellSelectFilterTags() {
  syncFilterTagsState('spell-select-type-tags', 'type', tempSpellSelectFilters);
  syncFilterTagsState('spell-select-source-tags', 'source', tempSpellSelectFilters);
  syncFilterTagsState('spell-select-school-tags', 'school', tempSpellSelectFilters);
  syncFilterTagsState('spell-select-damage-tags', 'damage', tempSpellSelectFilters);
  syncFilterTagsState('spell-select-concentration-tags', 'concentration', tempSpellSelectFilters);
  syncFilterTagsState('spell-select-level-tags', 'requiredLevel', tempSpellSelectFilters);
  syncFilterTagsState('spell-select-signature-tags', 'signature', tempSpellSelectFilters);
}

function openSpellSelectFiltersPanel() {
  const panel = document.getElementById('spell-select-filters-panel');
  if (!panel) {
    return;
  }

  tempSpellSelectFilters.type = spellSelectFilters.type.slice();
  tempSpellSelectFilters.source = spellSelectFilters.source.slice();
  tempSpellSelectFilters.school = spellSelectFilters.school.slice();
  tempSpellSelectFilters.damage = spellSelectFilters.damage.slice();
  tempSpellSelectFilters.concentration = spellSelectFilters.concentration.slice();
  tempSpellSelectFilters.requiredLevel = spellSelectFilters.requiredLevel.slice();
  tempSpellSelectFilters.signature = spellSelectFilters.signature.slice();

  syncSpellSelectFilterTags();

  panel.classList.add('open');
}

function closeSpellSelectFiltersPanel() {
  const panel = document.getElementById('spell-select-filters-panel');
  if (panel) {
    panel.classList.remove('open');
  }
}

function applySpellSelectFilters() {
  spellSelectFilters.type = tempSpellSelectFilters.type.slice();
  spellSelectFilters.source = tempSpellSelectFilters.source.slice();
  spellSelectFilters.school = tempSpellSelectFilters.school.slice();
  spellSelectFilters.damage = tempSpellSelectFilters.damage.slice();
  spellSelectFilters.concentration = tempSpellSelectFilters.concentration.slice();
  spellSelectFilters.requiredLevel = tempSpellSelectFilters.requiredLevel.slice();
  spellSelectFilters.signature = tempSpellSelectFilters.signature.slice();

  renderSpellSelectList();
  closeSpellSelectFiltersPanel();
}

function cancelSpellSelectFilters() {
  tempSpellSelectFilters.type = spellSelectFilters.type.slice();
  tempSpellSelectFilters.source = spellSelectFilters.source.slice();
  tempSpellSelectFilters.school = spellSelectFilters.school.slice();
  tempSpellSelectFilters.damage = spellSelectFilters.damage.slice();
  tempSpellSelectFilters.concentration = spellSelectFilters.concentration.slice();
  tempSpellSelectFilters.requiredLevel = spellSelectFilters.requiredLevel.slice();
  tempSpellSelectFilters.signature = spellSelectFilters.signature.slice();

  syncSpellSelectFilterTags();
  closeSpellSelectFiltersPanel();
}

function clearSpellSelectFilters() {
  spellSelectFilters.type = [];
  spellSelectFilters.source = [];
  spellSelectFilters.school = [];
  spellSelectFilters.damage = [];
  spellSelectFilters.concentration = [];
  spellSelectFilters.requiredLevel = [];
  spellSelectFilters.signature = [];

  tempSpellSelectFilters.type = [];
  tempSpellSelectFilters.source = [];
  tempSpellSelectFilters.school = [];
  tempSpellSelectFilters.damage = [];
  tempSpellSelectFilters.concentration = [];
  tempSpellSelectFilters.requiredLevel = [];
  tempSpellSelectFilters.signature = [];

  syncSpellSelectFilterTags();
  renderSpellSelectList();
}

function schoolSelectCreateFilterTags(containerId, options, filterKey, filterObject) {
  createFilterTags(containerId, options, filterKey, filterObject);
}

function initSchoolSelectFilters() {
  if (schoolSelectFiltersInitialized) {
    return;
  }

  const rarityOptions = schoolSelectCollectRarities();
  const propertiesOptions = schoolSelectCollectProperties();
  const difficultyOptions = schoolSelectCollectDifficulties();

  schoolSelectCreateFilterTags('school-select-rarity-tags', rarityOptions, 'rarity', tempSchoolSelectFilters);
  schoolSelectCreateFilterTags(
    'school-select-properties-tags',
    propertiesOptions,
    'properties',
    tempSchoolSelectFilters
  );
  schoolSelectCreateFilterTags(
    'school-select-difficulty-tags',
    difficultyOptions,
    'difficulty',
    tempSchoolSelectFilters
  );

  schoolSelectFiltersInitialized = true;
}

function schoolSelectToggleFilterCategory(element) {
  toggleFilterCategory(element);
}

function syncSchoolSelectFilterTags() {
  syncFilterTagsState('school-select-rarity-tags', 'rarity', tempSchoolSelectFilters);
  syncFilterTagsState('school-select-properties-tags', 'properties', tempSchoolSelectFilters);
  syncFilterTagsState('school-select-difficulty-tags', 'difficulty', tempSchoolSelectFilters);
}

function openSchoolSelectFiltersPanel() {
  const panel = document.getElementById('school-select-filters-panel');
  if (!panel) {
    return;
  }

  tempSchoolSelectFilters.rarity = schoolSelectFilters.rarity.slice();
  tempSchoolSelectFilters.properties = schoolSelectFilters.properties.slice();
  tempSchoolSelectFilters.difficulty = schoolSelectFilters.difficulty.slice();

  syncSchoolSelectFilterTags();

  panel.classList.add('open');
}

function closeSchoolSelectFiltersPanel() {
  const panel = document.getElementById('school-select-filters-panel');
  if (panel) {
    panel.classList.remove('open');
  }
}

function schoolSelectSelectAllInCategory(containerId, filterKey) {
  selectAllInCategory(containerId, filterKey, tempSchoolSelectFilters);
}

function schoolSelectClearAllInCategory(containerId, filterKey) {
  clearAllInCategory(containerId, filterKey, tempSchoolSelectFilters);
}

function applySchoolSelectFilters() {
  schoolSelectFilters.rarity = tempSchoolSelectFilters.rarity.slice();
  schoolSelectFilters.properties = tempSchoolSelectFilters.properties.slice();
  schoolSelectFilters.difficulty = tempSchoolSelectFilters.difficulty.slice();

  renderSchoolSelectList();
  closeSchoolSelectFiltersPanel();
}

function cancelSchoolSelectFilters() {
  tempSchoolSelectFilters.rarity = schoolSelectFilters.rarity.slice();
  tempSchoolSelectFilters.properties = schoolSelectFilters.properties.slice();
  tempSchoolSelectFilters.difficulty = schoolSelectFilters.difficulty.slice();

  syncSchoolSelectFilterTags();
  closeSchoolSelectFiltersPanel();
}

function clearSchoolSelectFilters() {
  schoolSelectFilters.rarity = [];
  schoolSelectFilters.properties = [];
  schoolSelectFilters.difficulty = [];

  tempSchoolSelectFilters.rarity = [];
  tempSchoolSelectFilters.properties = [];
  tempSchoolSelectFilters.difficulty = [];

  syncSchoolSelectFilterTags();
  renderSchoolSelectList();
}

function renderSpellSelectList() {
  const listElement = document.getElementById('spell-select-list');
  const searchInput = document.getElementById('spell-search-input');

  if (!listElement || !searchInput) {
    return;
  }

  const search = searchInput.value ? searchInput.value.toLowerCase() : '';

  const baseSpells = getSpellsForType(currentSpellSelectType || 'study');
  listElement.innerHTML = '';

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const spellSchema = window.DB_SCHEMAS && window.DB_SCHEMAS.spells ? window.DB_SCHEMAS.spells : null;
  const popupColumns = spellSchema
    ? spellSchema.columns.filter(function (col) {
        return !col.contexts || col.contexts.indexOf('popup') !== -1;
      })
    : [
        { key: 'name', label: 'Название' },
        { key: 'school', label: 'Школа' },
        { key: 'type', label: 'Тип' },
        { key: 'requiredLevel', label: 'Требуемый уровень' }
      ];

  thead.innerHTML =
    '<tr>' +
    popupColumns
      .map(function (col) {
        return '<th>' + col.label + '</th>';
      })
      .join('') +
    '</tr>';
  const tbody = document.createElement('tbody');
  tbody.id = 'spell-select-results';

  baseSpells.forEach(function (spell) {
    const name = typeof spell.name === 'string' ? spell.name : '';
    const school = typeof spell.school === 'string' ? spell.school : '';
    const type = typeof spell.type === 'string' ? spell.type : '';
    const source = getSpellSourceLabel(spell);
    const requiredLevel = typeof spell.requiredLevel === 'number' ? spell.requiredLevel : '';

    if (search && name.toLowerCase().indexOf(search) === -1) {
      return;
    }

    if (spellSelectFilters.type.length) {
      const spellTypes = spellSelectSplitToArray(spell.type);
      if (!spellSelectHasAny(spellTypes, spellSelectFilters.type)) {
        return;
      }
    }

    if (spellSelectFilters.source.length) {
      if (!source || spellSelectFilters.source.indexOf(source) === -1) {
        return;
      }
    }

    if (spellSelectFilters.requiredLevel.length) {
      const levelStr = requiredLevel !== '' ? String(requiredLevel) : '';
      if (!levelStr || spellSelectFilters.requiredLevel.indexOf(levelStr) === -1) {
        return;
      }
    }

    if (spellSelectFilters.signature.length) {
      const hasSignature = editorSpellHasSignatureBonus(spell);
      const label = hasSignature ? 'Да' : 'Нет';
      if (spellSelectFilters.signature.indexOf(label) === -1) {
        return;
      }
    }

    if (spellSelectFilters.school.length) {
      const schoolName = school || '';
      if (!schoolName || spellSelectFilters.school.indexOf(schoolName) === -1) {
        return;
      }
    }

    if (spellSelectFilters.damage.length) {
      const damages = Array.isArray(spell.damageType)
        ? spell.damageType
        : spellSelectSplitToArray(spell.damageType);
      if (!spellSelectHasAny(damages, spellSelectFilters.damage)) {
        return;
      }
    }

    if (spellSelectFilters.concentration.length) {
      const hasConcentration = spell.concentration === 'Да';
      const needsConcentration = spellSelectFilters.concentration.indexOf('Да') !== -1;
      const needsNoConcentration = spellSelectFilters.concentration.indexOf('Нет') !== -1;
      if (needsConcentration && needsNoConcentration) {
        // both selected, no filtering
      } else if (needsConcentration && !hasConcentration) {
        return;
      } else if (needsNoConcentration && hasConcentration) {
        return;
      }
    }

    const tr = document.createElement('tr');
    tr.setAttribute('data-spell-id', spell.id);

    const nameCell = document.createElement('td');
    nameCell.innerHTML =
      '<strong><a href="javascript:void(0)" onclick="openSpellDetailsModal(\'' +
      String(spell.id) +
      '\')" style="color: var(--accent-emerald); text-decoration: none;">' +
      name +
      '</a></strong>';

    const schoolCell = document.createElement('td');
    if (school) {
      schoolCell.innerHTML =
        '<a href="db.html?school=' +
        encodeURIComponent(school) +
        '" style="color: var(--accent-emerald); text-decoration: none;">' +
        school +
        '</a>';
    } else {
      schoolCell.textContent = '—';
    }

    const typeCell = document.createElement('td');
    typeCell.textContent = type || '—';

    const levelCell = document.createElement('td');
    levelCell.textContent = requiredLevel !== '' ? requiredLevel : '—';

    tr.appendChild(nameCell);
    tr.appendChild(schoolCell);
    tr.appendChild(typeCell);
    tr.appendChild(levelCell);

    tr.addEventListener('click', function () {
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(function (other) {
        other.classList.remove('selected');
      });
      tr.classList.add('selected');
      currentSpellSelectId = spell.id;
    });

    tbody.appendChild(tr);
  });

  if (!tbody.children.length) {
    const emptyRow = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.textContent = 'Ничего не найдено';
    emptyRow.appendChild(cell);
    tbody.appendChild(emptyRow);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  listElement.appendChild(table);
}

function openSpellSelectModal(type) {
  currentSpellSelectType = type;
  currentSpellSelectId = '';

  const modal = document.getElementById('spell-select-modal');
  const titleElement = document.getElementById('spell-select-title');
  const searchInput = document.getElementById('spell-search-input');

  if (!modal || !titleElement || !searchInput) {
    return;
  }

  if (type === 'signature') {
    titleElement.textContent = 'Выбор фирменного заклинания';
  } else {
    titleElement.textContent = 'Выбор учебного заклинания';
  }

  fetchSpellsData().then(function () {
    initSpellSelectFilters();
    searchInput.value = '';
    renderSpellSelectList();
    modal.classList.remove('hidden');
    searchInput.focus();
  });
}

function closeSpellSelectModal() {
  const modal = document.getElementById('spell-select-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  currentSpellSelectType = '';
  currentSpellSelectId = '';
}

function applySpellSelection() {
  if (!currentSpellSelectId || !currentSpellSelectType) {
    closeSpellSelectModal();
    return;
  }

  const spell = findSpellById(currentSpellSelectId);
  if (!spell) {
    closeSpellSelectModal();
    return;
  }

  const initialData = {
    id: spell.id,
    name: spell.name,
    active: true
  };

  if (currentSpellSelectType === 'signature') {
    addSignatureSpell(initialData);
  } else {
    addStudySpell(initialData);
  }

  closeSpellSelectModal();
  updateSpellRecommendations();
}

function initSpellSelectModal() {
  const modal = document.getElementById('spell-select-modal');
  const cancelButton = document.getElementById('spell-select-cancel');
  const applyButton = document.getElementById('spell-select-apply');
  const searchInput = document.getElementById('spell-search-input');
  const filterButton = document.getElementById('spell-select-filters-btn');

  if (!modal || !cancelButton || !applyButton || !searchInput || !filterButton) {
    return;
  }

  cancelButton.addEventListener('click', function () {
    closeSpellSelectModal();
  });

  applyButton.addEventListener('click', function () {
    applySpellSelection();
  });

  modal.addEventListener('click', function (event) {
    if (event.target === modal) {
      closeSpellSelectModal();
    }
  });

  searchInput.addEventListener('input', function () {
    renderSpellSelectList();
  });

  filterButton.addEventListener('click', function () {
    openSpellSelectFiltersPanel();
  });
}

function renderSpellsFromData(spells) {
  const studyList = document.getElementById('study-spells-list');
  const signatureList = document.getElementById('signature-spells-list');
  const schoolsList = document.getElementById('magic-schools-list');

  if (!studyList || !signatureList || !schoolsList) {
    return;
  }

  studyList.innerHTML = '';
  signatureList.innerHTML = '';
  schoolsList.innerHTML = '';

  fetchSpellsData().then(function () {
    fetchSchoolsData().then(function () {
    const studyArray = spells && Array.isArray(spells.study) ? normalizeSpellsArray(spells.study) : [];
    const signatureArray = spells && Array.isArray(spells.signature) ? normalizeSpellsArray(spells.signature) : [];
      const schoolsArray =
        spells && Array.isArray(spells.schools) ? normalizeSchoolsArray(spells.schools) : [];

    if (studyArray.length) {
      for (let i = 0; i < studyArray.length; i += 1) {
        addStudySpell(studyArray[i]);
      }
    }

    if (signatureArray.length) {
      for (let k = 0; k < signatureArray.length; k += 1) {
        addSignatureSpell(signatureArray[k]);
      }
    }

      if (schoolsArray.length) {
        for (let j = 0; j < schoolsArray.length; j += 1) {
          createSchoolItem(schoolsArray[j]);
        }
      }

    updateSpellRecommendations();
    });
  });
}

function countActiveSpells(type) {
  const rows = document.querySelectorAll('.spell-item[data-spell-type="' + type + '"]');
  let count = 0;
  rows.forEach(function (row) {
    const activeButton = row.querySelector('.spell-active-toggle-btn');
    const id = row.getAttribute('data-spell-id');
    if (id && activeButton && activeButton.classList.contains('spell-active-on')) {
      count += 1;
    }
  });
  return count;
}

function countActiveSchools() {
  const rows = document.querySelectorAll('#magic-schools-list .spell-item');
  let count = 0;
  rows.forEach(function (row) {
    const activeButton = row.querySelector('.spell-active-toggle-btn');
    if (activeButton && activeButton.classList.contains('spell-active-on')) {
      count += 1;
    }
  });
  return count;
}

function getRecommendedSpellCount(type, level) {
  if (type === 'study') {
    return 5 + (level - 1) * 2;
  }
  if (type === 'signature') {
    return 2 + (level - 1) * 2;
  }
  return 0;
}

function getRecommendedSchoolCount() {
  return 2;
}

function updateSingleSpellRecommendation(type, elementId) {
  const element = document.getElementById(elementId);
  const levelInput = document.getElementById('level');
  if (!element || !levelInput) {
    return;
  }

  let level = parseInt(levelInput.value, 10);
  if (Number.isNaN(level) || level < 1) {
    level = 1;
  }

  const activeCount = countActiveSpells(type);
  const recommended = getRecommendedSpellCount(type, level);

  element.textContent = String(activeCount) + ' / ' + String(recommended);
  element.classList.remove('spell-recommendation-ok');
  element.classList.remove('spell-recommendation-over');

  if (activeCount > recommended) {
    element.classList.add('spell-recommendation-over');
  } else {
    element.classList.add('spell-recommendation-ok');
  }
}

function updateSpellRecommendations() {
  updateSingleSpellRecommendation('study', 'study-spells-recommendation');
  updateSingleSpellRecommendation('signature', 'signature-spells-recommendation');
  const element = document.getElementById('magic-schools-recommendation');
  if (element) {
    const activeCount = countActiveSchools();
    const recommended = getRecommendedSchoolCount();
    element.textContent = String(activeCount) + ' / ' + String(recommended);
    element.classList.remove('spell-recommendation-ok');
    element.classList.remove('spell-recommendation-over');
    if (activeCount > recommended) {
      element.classList.add('spell-recommendation-over');
    } else {
      element.classList.add('spell-recommendation-ok');
    }
  }
}

function collectFormData() {
  const level = parseInt(document.getElementById('level').value, 10) || 1;
  const stats = calculateStatsByLevel(level);
  const bonuses = getBonusesFromUI();
  const defenseValueElement = document.getElementById('defense-value');
  const defenseValue = defenseValueElement ? parseInt(defenseValueElement.value, 10) || 0 : 0;

  const studySpells = [];
  const studyRows = document.querySelectorAll('.spell-item[data-spell-type="study"]');
  studyRows.forEach(function (row) {
    const id = row.getAttribute('data-spell-id');
    if (!id) {
      return;
    }
    const spellFromDb = findSpellById(id);
    let spellName = '';
    if (spellFromDb && typeof spellFromDb.name === 'string') {
      spellName = spellFromDb.name;
    }
    const activeButton = row.querySelector('.spell-active-toggle-btn');
    studySpells.push({
      id: id,
      name: spellName,
      active: Boolean(activeButton && activeButton.classList.contains('spell-active-on'))
    });
  });

  const signatureSpells = [];
  const signatureRows = document.querySelectorAll('.spell-item[data-spell-type="signature"]');
  signatureRows.forEach(function (row) {
    const id = row.getAttribute('data-spell-id');
    if (!id) {
      return;
    }
    const spellFromDb = findSpellById(id);
    let spellName = '';
    if (spellFromDb && typeof spellFromDb.name === 'string') {
      spellName = spellFromDb.name;
    }
    const activeButton = row.querySelector('.spell-active-toggle-btn');
    signatureSpells.push({
      id: id,
      name: spellName,
      active: Boolean(activeButton && activeButton.classList.contains('spell-active-on'))
    });
  });

  return {
    version: '1.0',
    name: document.getElementById('name').value,
    level: level,
    calculated: {
      fortitudeBase: stats.fortitudeBase,
      arcana: stats.arcana,
      passiveAttentiveness: stats.passiveAttentiveness,
      evasion: stats.evasion,
      savingThrow: stats.savingThrow,
      crafting: stats.crafting,
      spellSlots: stats.spellSlots,
      fortitude: {
        low: stats.fortitudeLow,
        mid: stats.fortitudeMid,
        high: stats.fortitudeHigh
      }
    },
    combat: {
      health: {
        current: parseInt(document.getElementById('health-current').value, 10),
        max: parseInt(document.getElementById('health-max').value, 10)
      },
      will: {
        current: parseInt(document.getElementById('will-current').value, 10),
        max: parseInt(document.getElementById('will-max').value, 10)
      },
      defense: defenseValue
    },
    magicMastery: {
      construction: parseInt(document.getElementById('construction').value, 10) || 0,
      spontaneity: parseInt(document.getElementById('spontaneity').value, 10) || 0,
      metamagic: parseInt(document.getElementById('metamagic').value, 10) || 0,
      creation: parseInt(document.getElementById('creation').value, 10) || 0,
      ritualism: parseInt(document.getElementById('ritualism').value, 10) || 0,
      versatility: parseInt(document.getElementById('versatility').value, 10) || 0
    },
    personalitySkills: {
      communication: parseInt(document.getElementById('communication').value, 10) || 0,
      contacts: parseInt(document.getElementById('contacts').value, 10) || 0,
      knowledge: parseInt(document.getElementById('knowledge').value, 10) || 0,
      perception: parseInt(document.getElementById('perception').value, 10) || 0,
      stealth: parseInt(document.getElementById('stealth').value, 10) || 0,
      physique: parseInt(document.getElementById('physique').value, 10) || 0
    },
    spells: {
      study: studySpells,
      signature: signatureSpells,
      schools: (function () {
        const result = [];
        const rows = document.querySelectorAll('#magic-schools-list .spell-item');
        rows.forEach(function (row) {
          const id = row.getAttribute('data-school-id');
          if (!id) {
            return;
          }
          const schoolFromDb = findSchoolById(id);
          let schoolName = '';
          if (schoolFromDb && typeof schoolFromDb.name === 'string') {
            schoolName = schoolFromDb.name;
          }
          const activeButton = row.querySelector('.spell-active-toggle-btn');
          result.push({
            id: id,
            name: schoolName,
            active: Boolean(activeButton && activeButton.classList.contains('spell-active-on'))
          });
        });
        return result;
      })()
    },
    bonuses: bonuses,
    description: {
      background: document.getElementById('description-background') ? document.getElementById('description-background').value : '',
      beliefs: document.getElementById('description-beliefs') ? document.getElementById('description-beliefs').value : '',
      misc: document.getElementById('description-misc') ? document.getElementById('description-misc').value : '',
      appearance: {
        gender: document.getElementById('appearance-gender') ? document.getElementById('appearance-gender').value : '',
        race: document.getElementById('appearance-race') ? document.getElementById('appearance-race').value : '',
        height: document.getElementById('appearance-height') ? document.getElementById('appearance-height').value : '',
        eyes: document.getElementById('appearance-eyes') ? document.getElementById('appearance-eyes').value : '',
        hair: document.getElementById('appearance-hair') ? document.getElementById('appearance-hair').value : '',
        skin: document.getElementById('appearance-skin') ? document.getElementById('appearance-skin').value : '',
        notes: document.getElementById('appearance-notes') ? document.getElementById('appearance-notes').value : ''
      },
      relations: getRelationsFromUI()
    }
  };
}

function getRelationsFromUI() {
  const list = document.getElementById('relations-list');
  if (!list) return [];
  const items = list.querySelectorAll('.recipe-item');
  const result = [];
  items.forEach(function(item) {
    const name = item.querySelector('.relation-name').value;
    const role = item.querySelector('.relation-role').value;
    const desc = item.querySelector('.relation-desc').value;
    result.push({ name: name, role: role, desc: desc });
  });
  return result;
}

function renderRelations(relations) {
  const list = document.getElementById('relations-list');
  if (!list) return;
  list.innerHTML = '';
  if (!Array.isArray(relations)) return;
  
  relations.forEach(function(rel) {
    addRelationItem(rel);
  });
}

function addRelationItem(data) {
  const list = document.getElementById('relations-list');
  if (!list) return;
  
  const initial = data || { name: '', role: '', desc: '' };
  const item = document.createElement('div');
  item.className = 'recipe-item';
  item.innerHTML = 
    '<div class="recipe-row">' +
      '<input type="text" class="relation-name" placeholder="Имя / Группа" value="' + (initial.name || '').replace(/"/g, '&quot;') + '">' +
      '<input type="text" class="relation-role" placeholder="Роль / Статус" value="' + (initial.role || '').replace(/"/g, '&quot;') + '">' +
    '</div>' +
    '<textarea class="relation-desc" rows="2" placeholder="Описание отношений">' + (initial.desc || '') + '</textarea>' +
    '<div class="recipe-controls">' +
      '<button type="button" class="btn btn-secondary btn-sm" onclick="this.closest(\'.recipe-item\').remove()">Удалить</button>' +
    '</div>';
    
  list.appendChild(item);
}

function initDescriptionFeatures() {
  // Accordion
  const accHeaders = document.querySelectorAll('.accordion-header');
  accHeaders.forEach(function(header) {
    header.addEventListener('click', function() {
      const item = header.parentElement;
      item.classList.toggle('open');
    });
  });
  
  // Relations
  const addBtn = document.getElementById('add-relation-btn');
  if (addBtn) {
    addBtn.addEventListener('click', function() {
      addRelationItem();
    });
  }
}

function fillForm(data) {
  document.getElementById('name').value = data.name || '';
  document.getElementById('level').value = data.level || 1;

  if (data.combat) {
    document.getElementById('health-current').value = data.combat.health.current;
    document.getElementById('health-max').value = data.combat.health.max;
    document.getElementById('will-current').value = data.combat.will.current;
    document.getElementById('will-max').value = data.combat.will.max;
    updateHealthWillDisplay();
    const defenseValueElement = document.getElementById('defense-value');
    if (defenseValueElement) {
      defenseValueElement.value = data.combat.defense || 0;
    }
    renderDefenseShields();
  }

  if (data.magicMastery) {
    document.getElementById('construction').value = data.magicMastery.construction || 0;
    document.getElementById('spontaneity').value = data.magicMastery.spontaneity || 0;
    document.getElementById('metamagic').value = data.magicMastery.metamagic || 0;
    document.getElementById('creation').value = data.magicMastery.creation || 0;
    document.getElementById('ritualism').value = data.magicMastery.ritualism || 0;
    document.getElementById('versatility').value = data.magicMastery.versatility || 0;
  }

  if (data.personalitySkills) {
    document.getElementById('communication').value = data.personalitySkills.communication || 0;
    document.getElementById('contacts').value = data.personalitySkills.contacts || 0;
    document.getElementById('knowledge').value = data.personalitySkills.knowledge || 0;
    document.getElementById('perception').value = data.personalitySkills.perception || 0;
    document.getElementById('stealth').value = data.personalitySkills.stealth || 0;
    document.getElementById('physique').value = data.personalitySkills.physique || 0;
  }

  const bonusesContainer = document.getElementById('bonuses-list');

  if (bonusesContainer) {
    bonusesContainer.innerHTML = '';
  }

  if (data.bonuses && bonusesContainer) {
    if (Array.isArray(data.bonuses)) {
      data.bonuses.forEach(function (bonus) {
        addBonusRow(bonus);
      });
    } else {
      const merged = [];

      if (Array.isArray(data.bonuses.permanent)) {
        merged.push.apply(merged, data.bonuses.permanent);
      }
      if (Array.isArray(data.bonuses.temporary)) {
        merged.push.apply(merged, data.bonuses.temporary);
      }

      merged.forEach(function (bonus) {
        addBonusRow(bonus);
      });
    }
  }

  if (data.spells) {
    renderSpellsFromData(data.spells);
  } else {
    renderSpellsFromData(null);
  }

  // Description
  const descData = data.description || '';
  if (typeof descData === 'string') {
    // Legacy support
    if (document.getElementById('description-background')) {
        document.getElementById('description-background').value = descData;
    }
    renderRelations([]);
  } else if (typeof descData === 'object' && descData) {
    if (document.getElementById('description-background')) document.getElementById('description-background').value = descData.background || '';
    if (document.getElementById('description-beliefs')) document.getElementById('description-beliefs').value = descData.beliefs || '';
    if (document.getElementById('description-misc')) document.getElementById('description-misc').value = descData.misc || '';
    
    if (descData.appearance) {
      const app = descData.appearance;
      const ids = ['gender', 'race', 'height', 'eyes', 'hair', 'skin', 'notes'];
      ids.forEach(function(key) {
        const el = document.getElementById('appearance-' + key);
        if (el) el.value = app[key] || '';
      });
    }
    
    if (descData.relations && Array.isArray(descData.relations)) {
        renderRelations(descData.relations);
    } else {
        renderRelations([]);
    }
  } else {
    // Empty
    if (document.getElementById('description-background')) document.getElementById('description-background').value = '';
    renderRelations([]);
  }

  initSignedStatInputs();
  updateCalculations();

  lastSavedCharacterData = JSON.parse(JSON.stringify(data));
  hasUnsavedChanges = false;
  if (autosaveTimeoutId) {
    clearTimeout(autosaveTimeoutId);
    autosaveTimeoutId = null;
  }
}

function initEditorTabs() {
  const buttons = document.querySelectorAll('.editor-tab-button');
  const contents = document.querySelectorAll('.editor-tab-content');

  if (!buttons.length || !contents.length) {
    return;
  }

   let initialTabId = 'tab-main';
   try {
     const savedTab = sessionStorage.getItem('editor_activeTab');
     if (savedTab && document.getElementById(savedTab)) {
       initialTabId = savedTab;
     }
   } catch (e) {
     // ignore storage errors
   }

   buttons.forEach(function (button) {
     const targetId = button.getAttribute('data-tab');
     if (targetId === initialTabId) {
       button.classList.add('active');
     } else {
       button.classList.remove('active');
     }
   });

   contents.forEach(function (content) {
     if (content.id === initialTabId) {
       content.classList.add('active');
     } else {
       content.classList.remove('active');
     }
   });

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      const targetId = button.getAttribute('data-tab');

      buttons.forEach(function (btn) {
        btn.classList.remove('active');
      });
      contents.forEach(function (content) {
        content.classList.remove('active');
      });

      button.classList.add('active');
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.add('active');
      }

      try {
        sessionStorage.setItem('editor_activeTab', targetId);
      } catch (e) {
        // ignore storage errors
      }
    });
  });
}

function buildBonusRowHtml(bonus) {
  const safeBonus = bonus || {};
  const name = safeBonus.name || '';
  const stat = safeBonus.stat || 'arcana';
  const value = typeof safeBonus.value === 'number' ? safeBonus.value : 0;

  const statOptions =
    '<option value="arcana"' +
    (stat === 'arcana' ? ' selected' : '') +
    '>Аркана</option>' +
    '<option value="attack"' +
    (stat === 'attack' ? ' selected' : '') +
    '>Бонус к Попаданию</option>' +
    '<option value="cast"' +
    (stat === 'cast' ? ' selected' : '') +
    '>Бонус к Наложению</option>' +
    '<option value="evasion"' +
    (stat === 'evasion' ? ' selected' : '') +
    '>Уклонение</option>' +
    '<option value="save"' +
    (stat === 'save' ? ' selected' : '') +
    '>Спасбросок</option>' +
    '<option value="fortitude"' +
    (stat === 'fortitude' ? ' selected' : '') +
    '>Базовая Стойкость</option>' +
    '<option value="fortitudeLow"' +
    (stat === 'fortitudeLow' ? ' selected' : '') +
    '>Нижняя Стойкость</option>' +
    '<option value="fortitudeMid"' +
    (stat === 'fortitudeMid' ? ' selected' : '') +
    '>Средняя Стойкость</option>' +
    '<option value="fortitudeHigh"' +
    (stat === 'fortitudeHigh' ? ' selected' : '') +
    '>Верхняя Стойкость</option>' +
    '<option value="defense"' +
    (stat === 'defense' ? ' selected' : '') +
    '>Защита</option>';

  return (
    '<div class="bonus-item" draggable="true">' +
    '<span class="bonus-drag-handle" title="Drag to reorder">⋮⋮</span>' +
    '<input type="text" class="bonus-name" placeholder="Название бонуса" value="' +
    name.replace(/"/g, '&quot;') +
    '" onchange="updateCalculations()">' +
    '<select class="bonus-stat" onchange="updateCalculations()">' +
    statOptions +
    '</select>' +
    '<div class="defense-control">' +
    '<button type="button" class="defense-step-btn bonus-value-minus" aria-label="Уменьшить бонус">−</button>' +
    '<div class="readonly-field stat-value bonus-value-display">' +
    (value >= 0 ? '+' + value : String(value)) +
    '</div>' +
    '<button type="button" class="defense-step-btn bonus-value-plus" aria-label="Увеличить бонус">+</button>' +
    '</div>' +
    '<button type="button" class="bonus-remove-btn" onclick="removeBonusRow(this)">&times;</button>' +
    '</div>'
  );
}

function addBonusRow(bonus) {
  const container = document.getElementById('bonuses-list');

  if (!container) {
    return;
  }

  const html = buildBonusRowHtml(bonus);
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const item = wrapper.firstElementChild;
  container.appendChild(item);

  const minusButton = item.querySelector('.bonus-value-minus');
  const plusButton = item.querySelector('.bonus-value-plus');

  if (minusButton) {
    minusButton.addEventListener('click', function () {
      changeBonusValue(item, -1);
    });
  }

  if (plusButton) {
    plusButton.addEventListener('click', function () {
      changeBonusValue(item, 1);
    });
  }

  initBonusDragAndDropForItem(item);

  updateCalculations();
}

function changeBonusValue(item, delta) {
  const display = item.querySelector('.bonus-value-display');
  if (!display) {
    return;
  }

  const rawText = display.textContent.trim();
  let value = parseInt(rawText, 10);

  if (Number.isNaN(value)) {
    value = 0;
  }

  value += delta;

  if (value < -10) {
    value = -10;
  }
  if (value > 10) {
    value = 10;
  }

  display.textContent = value >= 0 ? '+' + value : String(value);
  updateCalculations();
}

function removeBonusRow(button) {
  const item = button.parentElement;
  if (item && item.parentElement) {
    item.parentElement.removeChild(item);
  }
  updateCalculations();
}

function initEditorNavigation() {
  const backButton = document.getElementById('back-to-list-btn');
  const createButton = document.getElementById('create-new-character-btn');
  const cancelButton = document.getElementById('cancel-changes-btn');
  const saveButton = document.getElementById('save-character-btn');

  if (backButton) {
    backButton.addEventListener('click', function () {
      setCharacterIdInLocation('');
      showCharactersListPage();
    });
  }

  if (createButton) {
    createButton.addEventListener('click', function () {
      clearForm();
      currentCharacterId = null;
      setCharacterIdInLocation('');
      showCharacterEditorPage();
      const nameInput = document.getElementById('name');
      if (nameInput) {
        nameInput.focus();
      }
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      cancelChanges();
    });
  }

  if (saveButton) {
    saveButton.addEventListener('click', function () {
      saveCharacter();
    });
  }
}

function cancelChanges() {
  if (lastSavedCharacterData) {
    fillForm(lastSavedCharacterData);
  } else {
    clearForm();
  }

  hasUnsavedChanges = false;

  if (autosaveTimeoutId) {
    clearTimeout(autosaveTimeoutId);
    autosaveTimeoutId = null;
  }
}

function getDb() {
  return firebase.firestore();
}

function saveCharacter() {
  const data = collectFormData();

  if (!data.name) {
    document.getElementById('name').focus();
    return;
  }

  if (!currentUser) {
    return;
  }

  data.lastModified = new Date().toISOString();

  const db = getDb();
  const ref = db.collection('users').doc(currentUser.uid).collection('characters');

  if (currentCharacterId) {
    ref
      .doc(currentCharacterId)
      .set(data)
      .catch(function (error) {
        console.error('Failed to update character in Firestore:', error);
      });
  } else {
    ref
      .add(data)
      .then(function (docRef) {
        currentCharacterId = docRef.id;
      })
      .catch(function (error) {
        console.error('Failed to create character in Firestore:', error);
      });
  }

  lastSavedCharacterData = JSON.parse(JSON.stringify(data));
}

function exportCharacter() {
  const data = collectFormData();

  if (!data.name) {
    document.getElementById('name').focus();
    return;
  }

  const json = JSON.stringify(data, null, 2);
  const filename = data.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_') + '.json';
  downloadJSON(json, filename);
}

function loadCharacter(file) {
  if (!file) {
    return;
  }

  loadJSONFile(file, function (data) {
    fillForm(data);
  });
}

function renderCharactersList(characters) {
  const container = document.getElementById('saved-characters-list');

  if (!container) {
    return;
  }

  if (!characters.length) {
    container.innerHTML = '<p class="text-muted">Нет сохранённых персонажей. Создайте нового персонажа.</p>';
  } else {
    container.innerHTML = characters
      .map(function (char, index) {
        const date = char.lastModified ? new Date(char.lastModified).toLocaleDateString('ru-RU') : '';
        const meta = date ? ' • ' + date : '';
        return (
          '<div class="character-card" onclick="selectCharacterFromList(' +
          index +
          ')">' +
          '<div class="character-main">' +
          '<strong>' +
          char.name +
          '</strong>' +
          '<span class="text-muted character-meta">Уровень ' +
          char.level +
          meta +
          '</span>' +
          '</div>' +
          '<div class="character-menu-wrapper" onclick="event.stopPropagation()">' +
          '<button type="button" class="character-menu-button" onclick="toggleCharacterMenu(event, ' +
          index +
          ')">⋯</button>' +
          '<div class="character-menu" data-menu-index="' +
          index +
          '">' +
          '<button type="button" onclick="cloneSavedCharacter(' +
          index +
          ')">Клонировать</button>' +
          '<button type="button" onclick="exportSavedCharacter(' +
          index +
          ')">Скачать .json</button>' +
          '<button type="button" onclick="deleteSavedCharacter(' +
          index +
          ')">Удалить</button>' +
          '</div>' +
          '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  if (initialCharacterIdFromLocation && !hasAppliedCharacterFromLocation && characters.length) {
    const index = characters.findIndex(function (char) {
      return char.id === initialCharacterIdFromLocation;
    });
    if (index !== -1) {
      const data = characters[index];
      currentCharacterId = data.id;
      fillForm(data);
      showCharacterEditorPage();
      hasAppliedCharacterFromLocation = true;
    }
  }
}

function selectCharacterFromList(index) {
  if (!cloudCharacters[index]) {
    return;
  }
  const data = cloudCharacters[index];
  currentCharacterId = data.id || null;
  fillForm(data);
  setCharacterIdInLocation(currentCharacterId || '');
  showCharacterEditorPage();
}

function toggleCharacterMenu(event, index) {
  const menu = document.querySelector('.character-menu[data-menu-index="' + index + '"]');
  if (!menu) {
    return;
  }

  const isOpen = menu.classList.contains('open');
  const allMenus = document.querySelectorAll('.character-menu');
  allMenus.forEach(function (item) {
    item.classList.remove('open');
  });

  if (!isOpen) {
    menu.classList.add('open');
  }

  event.stopPropagation();
}

function loadSavedCharacter(index) {
  if (!cloudCharacters[index]) {
    return;
  }
  const data = cloudCharacters[index];
  currentCharacterId = data.id || null;
  fillForm(data);
}

function exportSavedCharacter(index) {
  if (!cloudCharacters[index]) {
    return;
  }
  const data = cloudCharacters[index];
  const json = JSON.stringify(data, null, 2);
  const filename = data.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_') + '.json';
  downloadJSON(json, filename);
}

function deleteSavedCharacter(index) {
  if (!cloudCharacters[index] || !currentUser) {
    return;
  }
  const db = getDb();
  const id = cloudCharacters[index].id;
  db
    .collection('users')
    .doc(currentUser.uid)
    .collection('characters')
    .doc(id)
    .delete()
    .catch(function (error) {
      console.error('Failed to delete character from Firestore:', error);
    });
}

function cloneSavedCharacter(index) {
  if (!cloudCharacters[index] || !currentUser) {
    return;
  }

  const db = getDb();
  const original = cloudCharacters[index];
  const data = JSON.parse(JSON.stringify(original));

  delete data.id;
  data.name = data.name + ' (копия)';
  data.lastModified = new Date().toISOString();

  db.collection('users')
    .doc(currentUser.uid)
    .collection('characters')
    .add(data)
    .catch(function (error) {
      console.error('Failed to clone character in Firestore:', error);
    });
}

function clearForm() {
  document.getElementById('character-form').reset();
  document.getElementById('level').value = 1;

  document.getElementById('study-spells-list').innerHTML = '';
  document.getElementById('signature-spells-list').innerHTML = '';

  renderSpellsFromData(null);

  const bonusesContainer = document.getElementById('bonuses-list');
  if (bonusesContainer) {
    bonusesContainer.innerHTML = '';
  }

  currentCharacterId = null;
  initSignedStatInputs();
  updateCalculations();
}

function initBonusAddButton() {
  const addBonusButton = document.getElementById('add-bonus-btn');

  if (!addBonusButton) {
    return;
  }

  addBonusButton.addEventListener('click', function () {
    addBonusRow({
      name: '',
      stat: 'arcana',
      value: 0
    });
  });
}

function initBonusDragAndDropForItem(item) {
  const container = document.getElementById('bonuses-list');

  if (!container || !item) {
    return;
  }

  const handle = item.querySelector('.bonus-drag-handle');

  if (!handle) {
    return;
  }

  handle.addEventListener('mousedown', function () {
    item.dataset.dragAllowed = '1';
  });

  document.addEventListener('mouseup', function () {
    delete item.dataset.dragAllowed;
  });

  item.addEventListener('dragstart', function (event) {
    if (item.dataset.dragAllowed !== '1') {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    item.classList.add('dragging');
  });

  item.addEventListener('dragend', function () {
    item.classList.remove('dragging');
    scheduleAutosave();
  });

  container.addEventListener('dragover', function (event) {
    event.preventDefault();
    const afterElement = getBonusDragAfterElement(container, event.clientY);
    const dragging = container.querySelector('.dragging');
    if (!dragging) {
      return;
    }
    if (afterElement == null) {
      container.appendChild(dragging);
    } else {
      container.insertBefore(dragging, afterElement);
    }
  });
}

function getBonusDragAfterElement(container, y) {
  const draggableElements = Array.prototype.slice
    .call(container.querySelectorAll('.bonus-item:not(.dragging)'));

  let closest = {
    offset: Number.NEGATIVE_INFINITY,
    element: null
  };

  draggableElements.forEach(function (child) {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      closest = {
        offset: offset,
        element: child
      };
    }
  });

  return closest.element;
}

function initBonusesModalControls() {
  const openButton = document.getElementById('open-bonuses-modal-btn');
  const closeButton = document.getElementById('close-bonuses-modal-btn');
  const addBonusButton = document.getElementById('open-bonus-edit-modal');

  if (openButton) {
    openButton.addEventListener('click', function () {
      openBonusesModal();
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', function () {
      closeBonusesModal();
    });
  }

  if (addBonusButton) {
    addBonusButton.addEventListener('click', function () {
      openBonusEditModalFromButton();
    });
  }

  document.addEventListener('click', function (event) {
    const isMenuButton = event.target.classList.contains('character-menu-button');
    const isMenu = event.target.closest('.character-menu');
    if (!isMenuButton && !isMenu) {
      const allMenus = document.querySelectorAll('.character-menu');
      allMenus.forEach(function (item) {
        item.classList.remove('open');
      });
    }
  });
}

function subscribeCharacters() {
  if (!currentUser) {
    return;
  }
  charactersInitialLoaded = false;
  const db = getDb();
  const ref = db
    .collection('users')
    .doc(currentUser.uid)
    .collection('characters')
    .orderBy('lastModified', 'desc');

  unsubscribeCharacters = ref.onSnapshot(
    function (snapshot) {
      const list = [];
      snapshot.forEach(function (doc) {
        const data = doc.data();
        data.id = doc.id;
        list.push(data);
      });
      cloudCharacters = list;
      renderCharactersList(list);
      if (!charactersInitialLoaded) {
        charactersInitialLoaded = true;
        hideEditorLoader();
      }
    },
    function (error) {
      console.error('Failed to subscribe to characters:', error);
      if (!charactersInitialLoaded) {
        charactersInitialLoaded = true;
        hideEditorLoader();
      }
    }
  );
}

function clearCharactersSubscription() {
  if (unsubscribeCharacters) {
    unsubscribeCharacters();
    unsubscribeCharacters = null;
  }
  cloudCharacters = [];
  currentCharacterId = null;
  renderCharactersList([]);
}

function onAuthUserChanged(user) {
  currentUser = user;
  clearCharactersSubscription();
  if (!currentUser) {
    hideEditorLoader();
    return;
  }
  updateEditorLoaderMessage('Загружаем персонажей...');
  showEditorLoader('Загружаем персонажей...');
  subscribeCharacters();
}

// Expose for dice roller
window.getCurrentSheetCharacter = function() {
  if (typeof collectFormData === 'function') {
    const data = collectFormData();
    if (data) {
      // Add ID if available
      data._id = currentCharacterId || 'temp-sheet';
      return data;
    }
  }
  return null;
};

