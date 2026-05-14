import {
  checkAccess,
  showPasswordModal,
  checkPassword,
  goToHome,
  initPasswordProtection,
  logout,
  addResetPasswordButton,
  isBookLocked
} from './access.js?v=435f5ee0';
import { initSidebar, toggleBook } from './sidebar.js?v=e501a190';
import { smoothScrollTo, initScrollToTop } from './scroll.js?v=7df88915';

// E'Magios Core - Common JavaScript Functions

// Immediately hide protected book content until password is entered
const EARLY_BOOK_KEY = document.body ? document.body.getAttribute('data-book') : null;
if (EARLY_BOOK_KEY && isBookLocked(EARLY_BOOK_KEY) && !checkAccess()) {
  const mainEl = document.querySelector('main');
  if (mainEl) {
    mainEl.style.display = 'none';
  }
}

// Simple page loader helpers reused across pages
const PAGE_LOADER_ID = 'page-loader';
const PAGE_LOADER_MESSAGE_ID = 'page-loader-message';

function ensurePageLoaderElement() {
  if (typeof document === 'undefined') {
    return null;
  }
  let loader = document.getElementById(PAGE_LOADER_ID);
  if (loader) {
    return loader;
  }

  const container = document.querySelector('.page-with-sidebar');
  loader = document.createElement('div');
  loader.id = PAGE_LOADER_ID;
  loader.className = container ? 'page-loader content-only hidden' : 'page-loader hidden';
  loader.innerHTML =
    '<div class="page-loader-content">' +
    '<div class="page-loader-spinner"></div>' +
    '<p id="' +
    PAGE_LOADER_MESSAGE_ID +
    '" class="page-loader-message">Загружаем...</p>' +
    '</div>';

  if (container) {
    container.insertBefore(loader, container.firstChild);
  } else {
    document.body.appendChild(loader);
  }

  return loader;
}

function setPageLoaderMessage(message) {
  if (!message) {
    return;
  }
  const label = document.getElementById(PAGE_LOADER_MESSAGE_ID);
  if (label) {
    label.textContent = message;
  }
}

function showPageLoader(message) {
  const loader = ensurePageLoaderElement();
  if (!loader) {
    return;
  }
  if (message) {
    setPageLoaderMessage(message);
  }
  loader.classList.remove('hidden');
}

function hidePageLoader() {
  const loader = document.getElementById(PAGE_LOADER_ID);
  if (loader) {
    loader.classList.add('hidden');
  }
}

// Character Editor helpers
/**
 * Расчёт базовых характеристик по уровню
 * Соответствует описанию из главы «Характеристики» (Obsidian, 03. Характеристики).
 */
function calculateStatsByLevel(level) {
  const safeLevel = level >= 1 ? level : 1;
  const fortitudeBase = safeLevel + 1; // базовая Стойкость: старт 2, +1 за уровень
  const fortitudeLow = fortitudeBase * 4;
  const fortitudeMid = fortitudeBase * 8;
  const fortitudeHigh = fortitudeBase * 12;

  return {
    health: 8, // фиксированное значение
    will: 6, // фиксированное значение
    arcana: safeLevel * 2,
    passiveAttentiveness: safeLevel * 2 + 4, // Пассивная внимательность: Аркана + Восприятие + 4
    evasion: 4 + (safeLevel * 2),
    savingThrow: 2 + (safeLevel * 2),
    crafting: 4 * safeLevel,
    fortitudeBase: fortitudeBase,
    fortitudeLow: fortitudeLow,
    fortitudeMid: fortitudeMid,
    fortitudeHigh: fortitudeHigh,
    spellSlots: 4 + ((safeLevel - 1) * 2)
  };
}

/**
 * Download JSON file
 */
function downloadJSON(data, filename) {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Shared filter controls used by database and editor popups
function toggleFilterCategory(headerElement) {
  const category = headerElement ? headerElement.closest('.filter-category') : null;
  if (category) {
    category.classList.toggle('collapsed');
  }
}

function selectAllInCategory(containerId, filterKey, filterObject) {
  const container = document.getElementById(containerId);
  if (!container || !filterObject || !filterKey) {
    return;
  }

  const tags = container.querySelectorAll('.filter-tag');
  if (!filterObject[filterKey]) {
    filterObject[filterKey] = [];
  }

  tags.forEach(function (tag) {
    const value = tag.getAttribute('data-value');
    if (value && filterObject[filterKey].indexOf(value) === -1) {
      filterObject[filterKey].push(value);
    }
    tag.classList.add('active');
  });
}

function clearAllInCategory(containerId, filterKey, filterObject) {
  const container = document.getElementById(containerId);
  if (!container || !filterObject || !filterKey) {
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
  if (!container || !filterObject || !filterCategory) {
    return;
  }

  container.innerHTML = '';

  options.forEach(function (value) {
    const tag = document.createElement('div');
    tag.className = 'filter-tag';
    tag.textContent = value;
    tag.setAttribute('data-value', value);

    const isActive = Array.isArray(filterObject[filterCategory])
      ? filterObject[filterCategory].indexOf(value) !== -1
      : false;
    if (isActive) {
      tag.classList.add('active');
    }

    tag.addEventListener('click', function () {
      if (!Array.isArray(filterObject[filterCategory])) {
        filterObject[filterCategory] = [];
      }
      const list = filterObject[filterCategory];
      const index = list.indexOf(value);
      if (index === -1) {
        list.push(value);
        tag.classList.add('active');
      } else {
        list.splice(index, 1);
        tag.classList.remove('active');
      }
    });

    container.appendChild(tag);
  });
}

function syncFilterTagsState(containerId, filterCategory, filterObject) {
  const container = document.getElementById(containerId);
  if (!container || !filterObject || !filterCategory) {
    return;
  }

  const list = Array.isArray(filterObject[filterCategory]) ? filterObject[filterCategory] : [];
  const tags = container.querySelectorAll('.filter-tag');
  tags.forEach(function (tag) {
    const value = tag.getAttribute('data-value');
    if (value && list.indexOf(value) !== -1) {
      tag.classList.add('active');
    } else {
      tag.classList.remove('active');
    }
  });
}

/**
 * Load JSON file
 */
function loadJSONFile(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      callback(data);
    } catch (error) {
      alert('Ошибка чтения файла: ' + error.message);
    }
  };
  reader.readAsText(file);
}

// Dice roller widget
const DICE_ROLLER_STATE = {
  user: null,
  db: null,
  history: [],
  historyLoaded: false,
  maxHistory: 50,
  openDetails: new Set(),
  discordWebhookUrl: null,
  discordDisplayName: null,
  discordColor: null,
  characters: {
    items: [],
    loading: false,
    fetched: false,
    selected: null
  },
  settings: {
    sendToDiscord: true,
    detailedMode: false,
    rollFromCharacter: false,
    rollFromSheetCharacter: true,
    characterId: null
  }
};

const DICE_SETTINGS_STORAGE_KEY = 'diceSettings';

function loadDiceLocalSettings() {
  try {
    const raw = localStorage.getItem(DICE_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      DICE_ROLLER_STATE.settings.sendToDiscord =
        typeof parsed.sendToDiscord === 'boolean' ? parsed.sendToDiscord : true;
      DICE_ROLLER_STATE.settings.detailedMode =
        typeof parsed.detailedMode === 'boolean' ? parsed.detailedMode : false;
      DICE_ROLLER_STATE.settings.rollFromCharacter =
        typeof parsed.rollFromCharacter === 'boolean' ? parsed.rollFromCharacter : false;
      DICE_ROLLER_STATE.settings.rollFromSheetCharacter =
        typeof parsed.rollFromSheetCharacter === 'boolean' ? parsed.rollFromSheetCharacter : true;
      DICE_ROLLER_STATE.settings.characterId =
        parsed.characterId && typeof parsed.characterId === 'string' ? parsed.characterId : null;
    }
  } catch (e) {
    console.error('Failed to load dice settings from storage:', e);
  }
}

function saveDiceLocalSettings() {
  try {
    localStorage.setItem(DICE_SETTINGS_STORAGE_KEY, JSON.stringify(DICE_ROLLER_STATE.settings));
  } catch (e) {
    console.error('Failed to save dice settings to storage:', e);
  }
}

function initDiceRoller() {
  loadDiceLocalSettings();
  // Создаём кнопку и панель
  createDiceRollerUI();

  // Если Firebase/авторизация недоступны, просто покажем подсказку о профиле
  if (typeof initDiceAuth !== 'function') {
    updateDiceAuthState(null);
    return;
  }

  initDiceAuth(function (user) {
    DICE_ROLLER_STATE.user = user;

    if (typeof firebase !== 'undefined' && firebase.firestore && user) {
      DICE_ROLLER_STATE.db = firebase.firestore();
      loadDiceUserSettingsAndHistory();
    } else {
      DICE_ROLLER_STATE.db = null;
      DICE_ROLLER_STATE.history = [];
      DICE_ROLLER_STATE.historyLoaded = true;
      clearDiceCharacters();
      renderDiceHistory();
    }

    updateDiceAuthState(user);
  });
}

function loadDiceUserSettingsAndHistory() {
  if (!DICE_ROLLER_STATE.db || !DICE_ROLLER_STATE.user) {
    DICE_ROLLER_STATE.discordWebhookUrl = null;
    DICE_ROLLER_STATE.discordDisplayName = null;
    DICE_ROLLER_STATE.discordColor = null;
    clearDiceCharacters();
    loadDiceHistory();
    return;
  }

  DICE_ROLLER_STATE.db
    .collection('users')
    .doc(DICE_ROLLER_STATE.user.uid)
    .get()
    .then((snapshot) => {
      const data = snapshot.exists ? snapshot.data() : null;
      DICE_ROLLER_STATE.discordWebhookUrl =
        data && typeof data.discordWebhookUrl === 'string' && data.discordWebhookUrl.trim()
          ? data.discordWebhookUrl.trim()
          : null;
      DICE_ROLLER_STATE.discordDisplayName =
        data && typeof data.discordDisplayName === 'string' && data.discordDisplayName.trim()
          ? data.discordDisplayName.trim()
          : null;
      DICE_ROLLER_STATE.discordColor =
        data && typeof data.discordColor === 'string' && data.discordColor.trim()
          ? data.discordColor.trim()
          : null;
    })
    .catch((err) => {
      console.error('Failed to load dice user settings:', err);
      DICE_ROLLER_STATE.discordWebhookUrl = null;
      DICE_ROLLER_STATE.discordDisplayName = null;
      DICE_ROLLER_STATE.discordColor = null;
    })
    .finally(() => {
      refreshDiceCharacters();
      loadDiceHistory();
    });
}

function clearDiceCharacters() {
  DICE_ROLLER_STATE.characters = {
    items: [],
    loading: false,
    fetched: false,
    selected: null
  };
  updateDiceCharacterSectionState();
}

function normalizeCharacterBonuses(rawBonuses) {
  if (!Array.isArray(rawBonuses)) {
    return [];
  }
  return rawBonuses
    .map((bonus) => {
      const value = parseInt(bonus && bonus.value, 10);
      if (Number.isNaN(value)) {
        return null;
      }
      return {
        name: bonus && typeof bonus.name === 'string' ? bonus.name.trim() : '',
        stat: bonus && bonus.stat ? String(bonus.stat) : 'arcana',
        value
      };
    })
    .filter(Boolean);
}

function groupCharacterBonusesByStat(bonuses) {
  const grouped = {
    arcana: [],
    attack: [],
    cast: []
  };
  const normalized = normalizeCharacterBonuses(bonuses);
  normalized.forEach((bonus) => {
    if (grouped[bonus.stat]) {
      grouped[bonus.stat].push(bonus);
    }
  });
  return grouped;
}

function mapCharacterForDice(doc) {
  if (!doc || !doc.data) {
    return null;
  }
  const data = doc.data();
  const baseLevel = typeof data.level === 'number' ? data.level : parseInt(data.level, 10) || 1;
  const stats = calculateStatsByLevel(baseLevel);
  const bonuses = Array.isArray(data.bonuses) ? data.bonuses : [];
  const groupedBonuses = groupCharacterBonusesByStat(bonuses);
  const sumGroup = function (list) {
    return list.reduce((acc, bonus) => acc + (Number.isFinite(bonus.value) ? bonus.value : 0), 0);
  };

  const arcanaBonusTotal = sumGroup(groupedBonuses.arcana);
  const attackBonusTotal = sumGroup(groupedBonuses.attack);
  const castBonusTotal = sumGroup(groupedBonuses.cast);

  const arcana = stats.arcana + arcanaBonusTotal;
  const hit = arcana + attackBonusTotal;
  const apply = arcana + castBonusTotal;

  return {
    id: doc.id,
    name: data.name || 'Без имени',
    level: baseLevel,
    baseArcana: stats.arcana,
    arcana,
    hit,
    apply,
    bonuses: normalizeCharacterBonuses(bonuses),
    bonusGroups: groupedBonuses,
    bonusTotals: {
      arcana: arcanaBonusTotal,
      attack: attackBonusTotal,
      cast: castBonusTotal
    }
  };
}

function refreshDiceCharacters() {
  const loadingEl = document.getElementById('dice-character-loading');
  if (!DICE_ROLLER_STATE.db || !DICE_ROLLER_STATE.user) {
    clearDiceCharacters();
    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
    return;
  }

  DICE_ROLLER_STATE.characters.loading = true;
  updateDiceCharacterSectionState();

  DICE_ROLLER_STATE.db
    .collection('users')
    .doc(DICE_ROLLER_STATE.user.uid)
    .collection('characters')
    .orderBy('lastModified', 'desc')
    .get()
    .then((snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        const mapped = mapCharacterForDice(doc);
        if (mapped) {
          list.push(mapped);
        }
      });
      DICE_ROLLER_STATE.characters.items = list;
      DICE_ROLLER_STATE.characters.fetched = true;

      const savedId = DICE_ROLLER_STATE.settings.characterId;
      let selected = list.find((c) => c.id === savedId) || null;
      if (!selected && list.length && DICE_ROLLER_STATE.settings.rollFromCharacter) {
        selected = list[0];
        DICE_ROLLER_STATE.settings.characterId = selected.id;
        saveDiceLocalSettings();
      }
      DICE_ROLLER_STATE.characters.selected = selected;
      updateDiceCharacterSectionState();
    })
    .catch((err) => {
      console.error('Failed to load characters for dice:', err);
      DICE_ROLLER_STATE.characters.items = [];
      DICE_ROLLER_STATE.characters.selected = null;
      updateDiceCharacterSectionState();
    })
    .finally(() => {
      DICE_ROLLER_STATE.characters.loading = false;
      DICE_ROLLER_STATE.characters.fetched = true;
      updateDiceCharacterSectionState();
    });
}

function getSelectedDiceCharacter() {
  return DICE_ROLLER_STATE.characters.selected || null;
}

function setSelectedDiceCharacter(characterId) {
  const selected =
    DICE_ROLLER_STATE.characters.items.find((item) => item.id === characterId) || null;
  DICE_ROLLER_STATE.characters.selected = selected;
  DICE_ROLLER_STATE.settings.characterId = selected ? selected.id : null;
  saveDiceLocalSettings();
  updateDiceCharacterSectionState();
}

function renderDiceCharacterOptions(filterText) {
  const optionsEl = document.getElementById('dice-character-options');
  const emptyEl = document.getElementById('dice-character-empty');
  if (!optionsEl || !emptyEl) {
    return;
  }

  const list = DICE_ROLLER_STATE.characters.items || [];
  const search = (filterText || '').toLowerCase();
  const filtered = list.filter((item) => {
    if (!search) return true;
    return (
      String(item.name || '').toLowerCase().indexOf(search) !== -1 ||
      String(item.level || '').toLowerCase().indexOf(search) !== -1
    );
  });

  optionsEl.innerHTML = '';
  if (!filtered.length) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  filtered.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dice-character-option';
    btn.setAttribute('data-id', item.id);
    btn.innerHTML = '<div class="dice-character-option-title">' + escapeHtml(item.name || 'Без имени') + '</div>';
    btn.addEventListener('click', () => {
      setSelectedDiceCharacter(item.id);
      closeDiceCharacterDropdown();
    });
    optionsEl.appendChild(btn);
  });
}

function updateDiceCharacterSectionState() {
  const row = document.getElementById('dice-character-row');
  const valueBtn = document.getElementById('dice-character-value');
  const loadingEl = document.getElementById('dice-character-loading');
  const searchInput = document.getElementById('dice-character-search');
  const dropdown = document.getElementById('dice-character-dropdown');
  const bonusArcana = document.getElementById('dice-bonus-arcana');
  const bonusHit = document.getElementById('dice-bonus-hit');
  const bonusApply = document.getElementById('dice-bonus-apply');
  const bonusContainer = document.getElementById('dice-character-bonuses');
  const selected = getSelectedDiceCharacter();
  const enabled = !!DICE_ROLLER_STATE.settings.rollFromCharacter && !!DICE_ROLLER_STATE.user;

  if (row) {
    row.classList.toggle('disabled', !enabled);
  }
  if (valueBtn) {
    valueBtn.disabled = !enabled || !!DICE_ROLLER_STATE.characters.loading;
    valueBtn.textContent = selected
      ? `${selected.name}`
      : DICE_ROLLER_STATE.characters.loading
      ? 'Загружаем...'
      : 'Не выбран';
  }
  if (loadingEl) {
    if (DICE_ROLLER_STATE.characters.loading) {
      loadingEl.classList.remove('hidden');
    } else {
      loadingEl.classList.add('hidden');
    }
  }
  if (searchInput) {
    searchInput.value = '';
    searchInput.disabled = !enabled || !DICE_ROLLER_STATE.characters.items.length;
  }
  if (dropdown && !enabled) {
    dropdown.classList.add('hidden');
  }

  renderDiceCharacterOptions('');

  const applyBonusValue = (el, value, active) => {
    if (!el) return;
    const safe = typeof value === 'number' ? value : 0;
    el.textContent = (safe >= 0 ? '+' : '') + safe;
    el.setAttribute('data-bonus', safe);
    el.disabled = !active;
    el.classList.toggle('disabled', !active);
  };
  const active = enabled && !!selected;
  if (bonusContainer) {
    bonusContainer.classList.toggle('disabled', !active);
  }
  applyBonusValue(bonusArcana, selected ? selected.arcana : 0, active);
  applyBonusValue(bonusHit, selected ? selected.hit : 0, active);
  applyBonusValue(bonusApply, selected ? selected.apply : 0, active);

  updateQuickRollButtons();
}

function openDiceCharacterDropdown() {
  const dropdown = document.getElementById('dice-character-dropdown');
  const searchInput = document.getElementById('dice-character-search');
  if (!dropdown || !searchInput) {
    return;
  }
  dropdown.classList.remove('hidden');
  searchInput.focus();
  renderDiceCharacterOptions(searchInput.value || '');
}

function closeDiceCharacterDropdown() {
  const dropdown = document.getElementById('dice-character-dropdown');
  if (dropdown) {
    dropdown.classList.add('hidden');
  }
}

function formatBonusLabel(bonus) {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

function updateQuickRollButtons() {
  const types = [
    { type: 'arcana', label: 'Бросок на Аркану' },
    { type: 'hit', label: 'Бросок на Попадание' },
    { type: 'apply', label: 'Бросок на Наложение эффекта' }
  ];
  const selected = getSelectedDiceCharacter();
  const canUseChar = DICE_ROLLER_STATE.settings.rollFromCharacter && !!selected;
  types.forEach((t) => {
    const btn = document.getElementById(`dice-quick-${t.type}`);
    if (!btn) return;
    let bonus = 0;
    if (canUseChar) {
      if (t.type === 'arcana') bonus = selected.arcana || 0;
      if (t.type === 'hit') bonus = selected.hit || 0;
      if (t.type === 'apply') bonus = selected.apply || 0;
    }
    btn.textContent = `${t.label} (${formatBonusLabel(bonus)})`;
    btn.setAttribute('data-bonus', bonus);
  });
}

/**
 * Открыть панель бросков кубов из других модулей (например, Базы заклинаний)
 */
function openDiceRollerPanel() {
  let panel = document.getElementById('dice-roller-panel');
  if (!panel) {
    // Если панель ещё не создана, инициализируем виджет
    initDiceRoller();
    panel = document.getElementById('dice-roller-panel');
  }
  if (panel) {
    panel.classList.remove('hidden');
  }
}

function createDiceRollerUI() {
  if (document.getElementById('dice-roller-toggle')) return;

  const toggle = document.createElement('button');
  toggle.id = 'dice-roller-toggle';
  toggle.className = 'dice-roller-toggle';
  toggle.type = 'button';
  toggle.title = 'Броски кубов';
  toggle.textContent = 'D12';

  const panel = document.createElement('div');
  panel.id = 'dice-roller-panel';
  panel.className = 'dice-roller-panel hidden';
  panel.innerHTML = `
        <div class="dice-roller-header">
      <div class="dice-roller-title">Броски кубов</div>
      <div class="dice-roller-header-actions">
        <div class="dice-settings">
          <button type="button" class="btn btn-icon btn-ghost dice-settings-button" id="dice-settings-toggle" aria-label="Настройки">⚙</button>
          <div class="dice-settings-menu hidden" id="dice-settings-menu">
            <label class="dice-settings-item">
              <input type="checkbox" id="dice-setting-discord">
              Отправлять Броски в Discord
            </label>
            <label class="dice-settings-item">
              <input type="checkbox" id="dice-setting-detailed">
              Автоматический Подробный Режим у Броска
            </label>
            <label class="dice-settings-item">
              <input type="checkbox" id="dice-setting-sheet-authoritative">
              В Листе Персонажа проводить броски от этого Персонажа
            </label>
            <label class="dice-settings-item">
              <input type="checkbox" id="dice-setting-roll-character">
              Совершать Броски от Персонажа
            </label>
            <div class="dice-character-row" id="dice-character-row">
              <div class="dice-character-label">Выбранный Персонаж</div>
              <div class="dice-character-select" id="dice-character-select">
                <div class="dice-character-loading hidden" id="dice-character-loading">
                  <div class="page-loader-spinner small"></div>
                </div>
                <button type="button" class="btn btn-secondary btn-sm dice-character-value" id="dice-character-value">Не выбран</button>
                <div class="dice-character-dropdown hidden" id="dice-character-dropdown">
                  <input type="text" id="dice-character-search" class="dice-character-search" placeholder="Поиск персонажа" autocomplete="off">
                  <div class="dice-character-options" id="dice-character-options"></div>
                  <div class="dice-character-empty hidden" id="dice-character-empty">Нет персонажей. Откройте Редактор персонажей.</div>
                </div>
              </div>
              <div class="dice-character-bonuses" id="dice-character-bonuses">
                <div class="dice-character-bonus">
                  <span><a class="dice-character-link" href="db.html">Аркана</a></span>
                  <button type="button" class="btn btn-secondary btn-sm dice-character-bonus-value" id="dice-bonus-arcana" data-roll-type="arcana" data-bonus="0">+0</button>
                </div>
                <div class="dice-character-bonus">
                  <span><a class="dice-character-link" href="db.html">Бонус на Попадание</a></span>
                  <button type="button" class="btn btn-secondary btn-sm dice-character-bonus-value" id="dice-bonus-hit" data-roll-type="hit" data-bonus="0">+0</button>
                </div>
                <div class="dice-character-bonus">
                  <span><a class="dice-character-link" href="db.html">Бонус на Наложение</a></span>
                  <button type="button" class="btn btn-secondary btn-sm dice-character-bonus-value" id="dice-bonus-apply" data-roll-type="apply" data-bonus="0">+0</button>
                </div>
              </div>
            </div>
            <button type="button" class="btn btn-ghost btn-sm btn-block dice-settings-clear" id="dice-settings-clear">Очистить историю</button>
          </div>
        </div>
        <button type="button" class="btn btn-icon btn-ghost" id="dice-roller-close" aria-label="Скрыть">×</button>
      </div>
    </div>
    <div class="dice-roller-body" id="dice-roller-messages">
      <p class="dice-roller-empty">История бросков появится здесь.</p>
    </div>
    <div class="dice-roller-footer">
      <div class="dice-quick-buttons" id="dice-quick-buttons">
        <button type="button" class="btn btn-secondary btn-sm btn-pill dice-quick-button" data-dice="2">D2</button>
        <button type="button" class="btn btn-secondary btn-sm btn-pill dice-quick-button" data-dice="4">D4</button>
        <button type="button" class="btn btn-secondary btn-sm btn-pill dice-quick-button" data-dice="6">D6</button>
        <button type="button" class="btn btn-secondary btn-sm btn-pill dice-quick-button" data-dice="8">D8</button>
        <button type="button" class="btn btn-secondary btn-sm btn-pill dice-quick-button" data-dice="10">D10</button>
        <button type="button" class="btn btn-secondary btn-sm btn-pill dice-quick-button" data-dice="12">D12</button>
        <button type="button" class="btn btn-secondary btn-sm btn-pill dice-quick-button" data-dice="20">D20</button>
        <button type="button" class="btn btn-secondary btn-sm btn-pill dice-quick-button" data-dice="100">D100</button>
        <button type="button" class="btn btn-secondary btn-sm btn-pill dice-quick-roll-button" id="dice-quick-arcana" data-roll-type="arcana" data-bonus="0">Бросок на Аркану (+0)</button>
        <button type="button" class="btn btn-secondary btn-sm btn-pill dice-quick-roll-button" id="dice-quick-hit" data-roll-type="hit" data-bonus="0">Бросок на Попадание (+0)</button>
        <button type="button" class="btn btn-secondary btn-sm btn-pill dice-quick-roll-button" id="dice-quick-apply" data-roll-type="apply" data-bonus="0">Бросок на Наложение эффекта (+0)</button>
      </div>
      <div class="dice-input-row">
        <input type="text" id="dice-command-input" placeholder="/roll 2d4+3d6+2" autocomplete="off">
        <button type="button" class="btn btn-primary btn-sm" id="dice-roll-submit">Бросить</button>
      </div>
      <div class="dice-auth-hint" id="dice-auth-hint"></div>
    </div>
  `;

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  toggle.addEventListener('click', () => {
    panel.classList.toggle('hidden');
  });

  const closeBtn = document.getElementById('dice-roller-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.classList.add('hidden');
    });
  }

  const quickButtons = panel.querySelectorAll('.dice-quick-button');
  quickButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sides = parseInt(btn.getAttribute('data-dice'), 10);
      if (!Number.isNaN(sides)) {
        handleDiceRollCommand(`1d${sides}`);
      }
    });
  });

  const input = document.getElementById('dice-command-input');
  const submitBtn = document.getElementById('dice-roll-submit');
  const settingsToggle = document.getElementById('dice-settings-toggle');
  const settingsMenu = document.getElementById('dice-settings-menu');
  const discordToggle = document.getElementById('dice-setting-discord');
  const detailedToggle = document.getElementById('dice-setting-detailed');
  const sheetAuthToggle = document.getElementById('dice-setting-sheet-authoritative');
  const rollFromCharToggle = document.getElementById('dice-setting-roll-character');
  const characterValueBtn = document.getElementById('dice-character-value');
  const characterSearch = document.getElementById('dice-character-search');
  const clearBtn = document.getElementById('dice-settings-clear');

  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const value = input.value.trim();
        if (value) {
          handleDiceRollCommand(value);
        }
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (!input) return;
      const value = input.value.trim();
      if (value) {
        handleDiceRollCommand(value);
      }
    });
  }

  if (settingsToggle && settingsMenu) {
    settingsToggle.addEventListener('click', () => {
      settingsMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', (event) => {
      if (!settingsMenu || !settingsToggle) return;
      if (
        event.target === settingsToggle ||
        settingsToggle.contains(event.target) ||
        settingsMenu.contains(event.target)
      ) {
        return;
      }
      settingsMenu.classList.add('hidden');
    });
  }

  if (discordToggle) {
    discordToggle.checked = !!DICE_ROLLER_STATE.settings.sendToDiscord;
    discordToggle.addEventListener('change', () => {
      DICE_ROLLER_STATE.settings.sendToDiscord = !!discordToggle.checked;
      saveDiceLocalSettings();
    });
  }

  if (detailedToggle) {
    detailedToggle.checked = !!DICE_ROLLER_STATE.settings.detailedMode;
    detailedToggle.addEventListener('change', () => {
      DICE_ROLLER_STATE.settings.detailedMode = !!detailedToggle.checked;
      saveDiceLocalSettings();
    });
  }

  if (sheetAuthToggle) {
    sheetAuthToggle.checked = !!DICE_ROLLER_STATE.settings.rollFromSheetCharacter;
    sheetAuthToggle.addEventListener('change', () => {
      DICE_ROLLER_STATE.settings.rollFromSheetCharacter = !!sheetAuthToggle.checked;
      saveDiceLocalSettings();
    });
  }

  if (rollFromCharToggle) {
    rollFromCharToggle.checked = !!DICE_ROLLER_STATE.settings.rollFromCharacter;
    rollFromCharToggle.addEventListener('change', () => {
      DICE_ROLLER_STATE.settings.rollFromCharacter = !!rollFromCharToggle.checked;
      saveDiceLocalSettings();
      if (DICE_ROLLER_STATE.settings.rollFromCharacter && !DICE_ROLLER_STATE.characters.fetched) {
        refreshDiceCharacters();
      }
      updateDiceCharacterSectionState();
    });
  }

  if (characterValueBtn) {
    characterValueBtn.addEventListener('click', () => {
      if (characterValueBtn.disabled) return;
      const dropdown = document.getElementById('dice-character-dropdown');
      if (dropdown && dropdown.classList.contains('hidden')) {
        openDiceCharacterDropdown();
      } else {
        closeDiceCharacterDropdown();
      }
    });
  }

  if (characterSearch) {
    characterSearch.addEventListener('input', (e) => {
      renderDiceCharacterOptions(e.target.value || '');
    });
    characterSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDiceCharacterDropdown();
      }
    });
  }

  document.addEventListener('click', (event) => {
    const isInside = event.target.closest('.dice-character-select');
    if (!isInside) {
      closeDiceCharacterDropdown();
    }
  });

  const labelMap = {
    arcana: (bonus) => `Бросок на Аркану (${formatBonusLabel(bonus)})`,
    hit: (bonus) => `Бросок на Попадание (${formatBonusLabel(bonus)})`,
    apply: (bonus) => `Бросок на Наложение эффекта (${formatBonusLabel(bonus)})`
  };

  const getCharacterBonus = (type) => {
    const selected = getSelectedDiceCharacter();
    if (!selected) return 0;
    if (type === 'arcana') return selected.arcana || 0;
    if (type === 'hit') return selected.hit || 0;
    if (type === 'apply') return selected.apply || 0;
    return 0;
  };

  const bonusButtons = document.querySelectorAll('.dice-character-bonus-value');
  bonusButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;
      const type = btn.getAttribute('data-roll-type');
      // Используем бонус выбранного персонажа только для подписи; формула — базовая,
      // автодоливка + детализация придут из персонажа.
      const bonus = getCharacterBonus(type);
      const expr = '1d12';
      const context = {
        label: (labelMap[type] && labelMap[type](bonus)) || `Бросок (${formatBonusLabel(bonus)})`,
        source: 'settings-bonus',
        rollType: type || null,
        baseExpression: expr
      };
      handleDiceRollCommand(expr, context);
    });
  });

  // Быстрые кнопки "Бросок на ..." рядом с кубами
  const quickRollButtons = panel.querySelectorAll('.dice-quick-roll-button');
  const quickLabelMap = {
    arcana: (bonus) => `Бросок на Аркану (${formatBonusLabel(bonus)})`,
    hit: (bonus) => `Бросок на Попадание (${formatBonusLabel(bonus)})`,
    apply: (bonus) => `Бросок на Наложение эффекта (${formatBonusLabel(bonus)})`
  };
  quickRollButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-roll-type');
      const bonus = parseInt(btn.getAttribute('data-bonus'), 10) || 0;
      const expr = '1d12';
      const label =
        (quickLabelMap[type] && quickLabelMap[type](bonus)) || `Бросок (${formatBonusLabel(bonus)})`;
      const context = {
        label,
        rollType: type || null,
        baseExpression: expr
      };
      handleDiceRollCommand(expr, context);
    });
  });

  updateDiceCharacterSectionState();

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearDiceHistory();
      if (settingsMenu) {
        settingsMenu.classList.add('hidden');
      }
    });
  }
}

function clearDiceHistory() {
  if (!DICE_ROLLER_STATE.historyLoaded) {
    return;
  }

  // Сначала очищаем локальную историю и UI
  DICE_ROLLER_STATE.history = [];
  renderDiceHistory();

  // Если нет подключённой БД или пользователя — на этом всё
  if (!DICE_ROLLER_STATE.db || !DICE_ROLLER_STATE.user) {
    return;
  }

  // Удаляем сохранённые броски из Firestore (только последние maxHistory записей)
  DICE_ROLLER_STATE.db
    .collection('users')
    .doc(DICE_ROLLER_STATE.user.uid)
    .collection('diceRolls')
    .limit(DICE_ROLLER_STATE.maxHistory)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) return null;
      const batch = DICE_ROLLER_STATE.db.batch();
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      return batch.commit();
    })
    .catch((err) => {
      console.error('Failed to clear dice history:', err);
    });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSpellLinkHtml(spellName) {
  if (!spellName) return '';
  const safeName = escapeHtml(spellName);
  const href = 'db.html?spell=' + encodeURIComponent(spellName);
  return `<a href="${href}" class="dice-spell-link" data-spell-name="${safeName}">${safeName}</a>`;
}

function buildRollLabelLink(rollType) {
  if (!rollType) return '';
  const map = {
    arcana: 'db.html?combat=аркана',
    hit: 'db.html?combat=бонус-к-попаданию',
    apply: 'db.html?combat=бонус-к-наложению'
  };
  return map[rollType] || '';
}

function buildCharacterLinkHtml(characterId, characterName) {
  const safeName = escapeHtml(characterName || 'Нет');
  if (characterId) {
    const href = 'character-editor.html?characterId=' + encodeURIComponent(String(characterId));
    return `<a href="${href}" class="dice-character-link">${safeName}</a>`;
  }
  return safeName;
}

function formatRollLabel(label, rollType) {
  if (!label) return '';
  const href = buildRollLabelLink(rollType);
  if (!href) {
    return escapeHtml(label);
  }
  let working = label;
  let prefix = '';

  // Отделяем бонус в скобках, чтобы не включать его в ссылку
  let baseLabel = working;
  let bonusSuffix = '';
  const bonusMatch = working.match(/^(.*?)(\s*\([^)]+\))\s*$/);
  if (bonusMatch) {
    baseLabel = bonusMatch[1] || working;
    bonusSuffix = bonusMatch[2] || '';
  }

  return `${escapeHtml(prefix)}<a href="${escapeHtml(href)}" class="dice-message-link">${escapeHtml(
    baseLabel
  )}</a>${bonusSuffix ? ' ' + escapeHtml(bonusSuffix.trim()) : ''}`;
}

function updateDiceAuthState(user) {
  const hintEl = document.getElementById('dice-auth-hint');
  const quickButtons = document.querySelectorAll('.dice-quick-button');
  const input = document.getElementById('dice-command-input');
  const submitBtn = document.getElementById('dice-roll-submit');

  const disabled = !user;

  quickButtons.forEach((btn) => {
    if (disabled) {
      btn.setAttribute('disabled', 'disabled');
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.removeAttribute('disabled');
      btn.style.opacity = '';
      btn.style.cursor = '';
    }
  });

  if (input) {
    input.disabled = disabled;
  }
  if (submitBtn) {
    submitBtn.disabled = disabled;
  }

  if (hintEl) {
    if (!user) {
      hintEl.innerHTML =
        'Броски доступны только после входа через Google. Откройте раздел <a href="profile.html">Профиль</a>, чтобы авторизоваться.';
    } else {
      hintEl.textContent = '';
    }
  }

  updateDiceCharacterSectionState();
}

function parseRollExpression(raw) {
  const trimmed = raw.trim();
  const withoutCommand = trimmed.toLowerCase().startsWith('/roll')
    ? trimmed.slice(5).trim()
    : trimmed;

  if (!withoutCommand) {
    throw new Error('Пустая команда броска.');
  }

  const normalized = withoutCommand.replace(/\s+/g, '');

  if (!/^[0-9dD+\-*/]+$/.test(normalized)) {
    throw new Error('Допускаются только цифры, d, +, -, * и /. Пример: /roll 2d4*2+3d6-1');
  }

  // Разбиваем выражение на сегменты по + и -, сохраняя знак каждого сегмента.
  const segments = [];
  let current = '';
  let currentSign = 1;

  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (ch === '+' || ch === '-') {
      if (i === 0) {
        // ведущий знак
        currentSign = ch === '+' ? 1 : -1;
        continue;
      }
      // разделитель между сегментами
      if (!current) {
        throw new Error('Выражение не должно содержать два знака подряд. Пример: 2d4+3d6-1');
      }
      segments.push({ sign: currentSign, text: current });
      current = '';
      currentSign = ch === '+' ? 1 : -1;
    } else {
      current += ch;
    }
  }

  if (!current) {
    throw new Error('Выражение не должно заканчиваться знаком + или -.');
  }
  segments.push({ sign: currentSign, text: current });

  const parsedSegments = [];

  segments.forEach((seg) => {
    const text = seg.text;
    const hasDice = /[dD]/.test(text);

    if (hasDice) {
      // Формат: XdY, XdY*N или XdY/N
      const m = text.match(/^(\d*)[dD](\d+)(?:([*/])(\d+))?$/);
      if (!m) {
        throw new Error('Неверный формат кубов. Пример: 2d4*2+3d6-1');
      }
      const count = m[1] ? parseInt(m[1], 10) : 1;
      const sides = parseInt(m[2], 10);
      const scaleOp = m[3] || null;
      const scale = m[4] ? parseInt(m[4], 10) : null;

      if (!Number.isFinite(count) || count <= 0 || count > 100) {
        throw new Error('Количество кубов должно быть от 1 до 100.');
      }
      if (![2, 4, 6, 8, 10, 12, 20, 100].includes(sides)) {
        throw new Error('Разрешены только D2, D4, D6, D8, D10, D12, D20 и D100.');
      }
      if (scaleOp && (!Number.isFinite(scale) || scale <= 0 || scale > 1000)) {
        throw new Error('Множитель/делитель должен быть положительным числом (1–1000).');
      }

      parsedSegments.push({
        kind: 'dice',
        sign: seg.sign,
        count,
        sides,
        scaleOp,
        scale
      });
    } else {
      // Чистое число — численный бонус / штраф
      if (!/^\d+$/.test(text)) {
        throw new Error('Неверный числовой модификатор. Пример: +5 или -10');
      }
      const value = parseInt(text, 10);
      if (!Number.isFinite(value) || value < 0 || value > 100000) {
        throw new Error('Численный бонус/штраф должен быть в разумных пределах (0–100000).');
      }
      parsedSegments.push({
        kind: 'number',
        sign: seg.sign,
        value
      });
    }
  });

  return {
    expression: normalized,
    segments: parsedSegments
  };
}

function rollDiceExpression(parsed) {
  const parts = [];
  let total = 0;

  parsed.segments.forEach((seg) => {
    if (seg.kind === 'dice') {
      const rolls = [];
      let baseSum = 0;
      for (let i = 0; i < seg.count; i += 1) {
        const value = 1 + Math.floor(Math.random() * seg.sides);
        rolls.push(value);
        baseSum += value;
      }

      let segmentTotal = baseSum;
      if (seg.scaleOp && seg.scale) {
        if (seg.scaleOp === '*') {
          segmentTotal = baseSum * seg.scale;
        } else if (seg.scaleOp === '/') {
          segmentTotal = baseSum / seg.scale;
        }
      }

      const signedContribution = seg.sign * segmentTotal;
      total += signedContribution;

      parts.push({
        kind: 'dice',
        sign: seg.sign,
        count: seg.count,
        sides: seg.sides,
        rolls,
        baseSum,
        scaleOp: seg.scaleOp,
        scale: seg.scale,
        segmentTotal
      });
    } else if (seg.kind === 'number') {
      const signedContribution = seg.sign * seg.value;
      total += signedContribution;
      parts.push({
        kind: 'number',
        sign: seg.sign,
        value: seg.value
      });
    }
  });

  return {
    expression: parsed.expression,
    total,
    parts,
    createdAt: Date.now()
  };
}

function getRollTypeFromContext(context) {
  if (!context) {
    return null;
  }
  if (context.rollType) {
    return String(context.rollType);
  }
  if (!context.source) {
    return null;
  }
  const source = String(context.source);
  if (source.indexOf('arcana') !== -1) return 'arcana';
  if (source.indexOf('hit') !== -1) return 'hit';
  if (source.indexOf('apply') !== -1) return 'apply';
  return null;
}

function buildRollBonusBreakdown(character, rollType) {
  if (!character || !rollType) {
    return null;
  }

  const bonusLabels = {
    arcana: 'Бонус от Арканы',
    attack: 'Бонус на Попадание',
    cast: 'Бонус на Наложение эффекта'
  };

  const groups = character.bonusGroups || groupCharacterBonusesByStat(character.bonuses || []);
  const arcanaBonusTotal =
    (character.bonusTotals && character.bonusTotals.arcana) || groups.arcana.reduce((acc, bonus) => acc + bonus.value, 0);

  let baseArcana = typeof character.baseArcana === 'number' ? character.baseArcana : null;
  if (baseArcana === null || Number.isNaN(baseArcana)) {
    const fallbackArcana = typeof character.arcana === 'number' ? character.arcana : 0;
    baseArcana = fallbackArcana - arcanaBonusTotal;
  }

  const items = [];
  if (Number.isFinite(baseArcana)) {
    items.push({
      label: 'Бонус от Арканы',
      value: baseArcana,
      stat: 'arcana',
      kind: 'base'
    });
  }

  const pushBonuses = function (list, statKey) {
    list.forEach((bonus) => {
      const label =
        bonus && bonus.name ? 'Бонус от "' + bonus.name + '"' : bonusLabels[statKey] || 'Бонус';
      items.push({
        label,
        value: bonus.value,
        stat: statKey,
        kind: 'bonus'
      });
    });
  };

  pushBonuses(groups.arcana || [], 'arcana');
  if (rollType === 'hit') {
    pushBonuses(groups.attack || [], 'attack');
  } else if (rollType === 'apply') {
    pushBonuses(groups.cast || [], 'cast');
  }

  const targetTotals = {
    arcana: typeof character.arcana === 'number' ? character.arcana : 0,
    hit: typeof character.hit === 'number' ? character.hit : 0,
    apply: typeof character.apply === 'number' ? character.apply : 0
  };
  const targetTotal = targetTotals[rollType] || 0;

  const breakdownSum = items.reduce((acc, bonus) => acc + (Number.isFinite(bonus.value) ? bonus.value : 0), 0);
  if (Math.round(breakdownSum) !== Math.round(targetTotal)) {
    const remainder = targetTotal - breakdownSum;
    if (remainder !== 0) {
      items.push({
        label: 'Доп. модификатор',
        value: remainder,
        stat: rollType,
        kind: 'adjustment'
      });
    }
  }

  return {
    total: targetTotal,
    items
  };
}

function addBonusToExpression(rawCommand, bonus) {
  if (!bonus) {
    return rawCommand;
  }
  const trimmed = rawCommand.trim();
  const hasCommand = trimmed.toLowerCase().startsWith('/roll');
  const prefix = hasCommand ? '/roll ' : '';
  const body = hasCommand ? trimmed.slice(5).trim() : trimmed;
  const suffix = bonus > 0 ? `+${bonus}` : `${bonus}`;
  if (!body) {
    return `${prefix}1d12${suffix}`;
  }
  return `${prefix}${body}${suffix}`;
}

function applyCharacterBonusIfNeeded(rawCommand, context) {
  const rollType = getRollTypeFromContext(context);

  // Определяем, какого персонажа использовать (с листа или глобального)
  const sheetCharacter = context && context.sheetCharacter ? context.sheetCharacter : null;
  const useSheetCharacter = sheetCharacter && DICE_ROLLER_STATE.settings.rollFromSheetCharacter;
  const globalSelected = DICE_ROLLER_STATE.settings.rollFromCharacter && DICE_ROLLER_STATE.user && DICE_ROLLER_STATE.characters.selected
    ? DICE_ROLLER_STATE.characters.selected
    : null;
  
  const selected = useSheetCharacter ? sheetCharacter : globalSelected;

  // Если бонус уже включён в формулу, но нужно показать разбивку — возвращаем формулу как есть,
  // но прикладываем breakdown по выбранному персонажу.
  if (context && context.noAutoCharacterBonus) {
    if (
      context.allowCharacterBreakdown &&
      rollType &&
      selected
    ) {
      const breakdown = buildRollBonusBreakdown(selected, rollType);
      return {
        command: rawCommand,
        bonus: breakdown
      };
    }
    return {
      command: rawCommand,
      bonus: null
    };
  }

  if (!rollType) {
    return {
      command: rawCommand,
      bonus: null
    };
  }

  // Нет права тянуть бонусы персонажа — возвращаем исходный бросок без автодоливки
  if (!selected) {
    return {
      command: rawCommand,
      bonus: null
    };
  }

  const breakdown = buildRollBonusBreakdown(selected, rollType);
  const bonusTotal =
    breakdown && typeof breakdown.total === 'number'
      ? breakdown.total
      : rollType === 'arcana'
      ? selected.arcana || 0
      : rollType === 'hit'
      ? selected.hit || 0
      : selected.apply || 0;
  return {
    command: addBonusToExpression(rawCommand, bonusTotal),
    bonus: breakdown
  };
}

function handleDiceRollCommand(rawCommand, context) {
  if (!DICE_ROLLER_STATE.user) {
    updateDiceAuthState(null);
    return;
  }

  const input = document.getElementById('dice-command-input');

  try {
    const extractSpellBonus = (expr) => {
      if (!expr) return 0;
      try {
        const parsed = parseRollExpression(expr);
        if (!parsed || !Array.isArray(parsed.segments)) return 0;
        return parsed.segments
          .filter((seg) => seg && seg.kind === 'number')
          .reduce((acc, seg) => acc + seg.sign * seg.value, 0);
      } catch (e) {
        return 0;
      }
    };

    const normalizeRawBody = (command) => {
      const trimmed = (command || '').trim();
      const lower = trimmed.toLowerCase();
      if (lower.startsWith('/roll')) {
        return trimmed.slice(5).trim();
      }
      return trimmed;
    };

    const rawBody = normalizeRawBody(rawCommand);
    const spellBonusRaw = extractSpellBonus(rawBody);

    // Детектим персонажа с листа, если он не передан
    let effectiveContext = context;
    if ((!context || !context.sheetCharacter) && DICE_ROLLER_STATE.settings.rollFromSheetCharacter) {
        const editorPage = document.getElementById('character-editor-page');
        if (editorPage && !editorPage.classList.contains('hidden')) {
            const nameInput = document.getElementById('name');
            const arcanaEl = document.getElementById('stat-arcana');
            const hitEl = document.getElementById('stat-attack-bonus');
            const applyEl = document.getElementById('stat-cast-bonus');
            
            if (nameInput) {
               const parseBonus = (el) => {
                  if (!el) return 0;
                  return parseInt(el.textContent.replace('+', ''), 10) || 0;
               };
               
               effectiveContext = context ? { ...context } : {};
               effectiveContext.sheetCharacter = {
                  id: 'sheet-detected', 
                  name: nameInput.value || 'Персонаж с листа',
                  arcana: parseBonus(arcanaEl),
                  hit: parseBonus(hitEl),
                  apply: parseBonus(applyEl),
                  baseArcana: parseBonus(arcanaEl)
               };
            }
        }
    }

    const commandData = applyCharacterBonusIfNeeded(rawCommand, effectiveContext);
    const commandWithBonus = commandData.command;
    const parsed = parseRollExpression(commandWithBonus);
    const diceOnlyExpression = (() => {
      if (!parsed || !Array.isArray(parsed.segments) || !parsed.segments.length) return null;
      let result = '';
      parsed.segments
        .filter((seg) => seg && seg.kind === 'dice')
        .forEach((seg, index) => {
          const sign = seg.sign < 0 ? '-' : index === 0 ? '' : '+';
          const count = seg.count || 1;
          result += `${sign}${count}d${seg.sides}`;
        });
      return result || null;
    })();
    const displayExpression =
      (effectiveContext && effectiveContext.baseExpression) ||
      diceOnlyExpression ||
      (rawCommand && rawCommand.trim()) ||
      commandWithBonus;
    const result = rollDiceExpression(parsed);

    // Заполняем контекст броска
    const rollType = getRollTypeFromContext(effectiveContext);
    const sheetCharacter = effectiveContext && effectiveContext.sheetCharacter ? effectiveContext.sheetCharacter : null;
    const useSheetCharacter = sheetCharacter && DICE_ROLLER_STATE.settings.rollFromSheetCharacter;

    const freeLabelMap = {
      arcana: 'Бросок на Аркану',
      hit: 'Бросок на Попадание',
      apply: 'Бросок на Наложение эффекта'
    };
    if (effectiveContext && typeof effectiveContext === 'object') {
      if (effectiveContext.label) {
        result.contextLabel = String(effectiveContext.label);
      } else if (rollType && freeLabelMap[rollType]) {
        result.contextLabel = freeLabelMap[rollType];
      }
      if (effectiveContext.spell) {
        result.contextSpell = String(effectiveContext.spell);
      }
      if (effectiveContext.source) {
        result.contextSource = String(effectiveContext.source);
      }
    } else {
      // Бросок без контекста
      result.contextLabel = rollType && freeLabelMap[rollType] ? freeLabelMap[rollType] : 'Бросок';
    }
    // Если метка так и не определена (например, контекст без label и без rollType)
    if (!result.contextLabel) {
      result.contextLabel = rollType && freeLabelMap[rollType] ? freeLabelMap[rollType] : 'Бросок';
    }

    // Сохраняем выражение для отображения без автодобавленного бонуса (если есть)
    result.displayExpression = displayExpression;
    result.contextRollType = rollType || null;
    if (commandData.bonus) {
      result.contextBonuses = commandData.bonus;
      result.contextBonusTotal = commandData.bonus.total;
    }
    result.contextSpellBonus = spellBonusRaw;

    const hasRollType = !!rollType;
    const allowCharacterFlag = effectiveContext && effectiveContext.allowCharacter === true;
    const shouldAttachCharacter =
      !!useSheetCharacter ||
      hasRollType ||
      (DICE_ROLLER_STATE.settings.rollFromCharacter && (hasRollType || allowCharacterFlag));
    const useSelectedCharacter = shouldAttachCharacter && DICE_ROLLER_STATE.settings.rollFromCharacter;
    
    // Если useSheetCharacter = true, мы должны использовать именно его, даже если он не selected в меню.
    const selectedChar = useSheetCharacter ? sheetCharacter : (useSelectedCharacter ? getSelectedDiceCharacter() : null);
    
    if (selectedChar) {
      result.contextCharacterId = selectedChar.id || null;
      result.contextCharacterName = selectedChar.name || 'Персонаж';
    } else if (shouldAttachCharacter) {
      // Режим "от персонажа" включён, но персонаж не выбран
      result.contextCharacterName = 'Нет';
    }

    addDiceResultToHistory(result, true);
    if (input) {
      input.value = '';
    }
  } catch (error) {
    addDiceSystemMessage(error.message);
  }
}

function addDiceSystemMessage(text) {
  const entry = {
    expression: 'Сообщение',
    total: null,
    parts: [],
    createdAt: Date.now(),
    system: true,
    text
  };
  addDiceResultToHistory(entry, false);
}

function addDiceResultToHistory(entry, shouldPersist) {
  // Добавляем новые броски в конец, чтобы свежие сообщения были внизу
  DICE_ROLLER_STATE.history.push(entry);
  if (DICE_ROLLER_STATE.history.length > DICE_ROLLER_STATE.maxHistory) {
    const overflow = DICE_ROLLER_STATE.history.length - DICE_ROLLER_STATE.maxHistory;
    DICE_ROLLER_STATE.history.splice(0, overflow);
  }
  renderDiceHistory();

  if (shouldPersist && DICE_ROLLER_STATE.db && DICE_ROLLER_STATE.user && !entry.system) {
    try {
      const payload = {
        expression: entry.expression,
        displayExpression: entry.displayExpression || null,
        total: entry.total,
        parts: entry.parts,
        createdAt: entry.createdAt,
        contextLabel: entry.contextLabel || null,
        contextSpell: entry.contextSpell || null,
        contextSource: entry.contextSource || null,
        contextRollType: entry.contextRollType || null,
        contextBonuses: entry.contextBonuses || null,
        contextBonusTotal:
          typeof entry.contextBonusTotal === 'number' ? entry.contextBonusTotal : null,
        contextCharacterId: entry.contextCharacterId || null,
        contextCharacterName: entry.contextCharacterName || null
      };
      DICE_ROLLER_STATE.db
        .collection('users')
        .doc(DICE_ROLLER_STATE.user.uid)
        .collection('diceRolls')
        .add(payload)
        .catch((err) => {
          console.error('Failed to persist dice roll:', err);
        });
    } catch (err) {
      console.error('Failed to persist dice roll:', err);
    }
  }

  if (shouldPersist && !entry.system && DICE_ROLLER_STATE.settings.sendToDiscord) {
    try {
      sendDiceResultToDiscord(entry);
    } catch (err) {
      console.error('Failed to send dice roll to Discord:', err);
    }
  }
}

function sendDiceResultToDiscord(entry) {
  if (!DICE_ROLLER_STATE.discordWebhookUrl) {
    return;
  }

  const webhookUrl = DICE_ROLLER_STATE.discordWebhookUrl;

  if (typeof webhookUrl !== 'string' || !/^https:\/\/discord\.com\/api\/webhooks\//.test(webhookUrl)) {
    return;
  }

  const usernameFallback = "E'Magios Dice";
  const username =
    DICE_ROLLER_STATE.discordDisplayName && DICE_ROLLER_STATE.discordDisplayName.trim()
      ? DICE_ROLLER_STATE.discordDisplayName.trim()
      : usernameFallback;

  const expression = entry.displayExpression || entry.expression || '';
  const totalLabel =
    typeof entry.total === 'number' ? String(entry.total) : entry.total === null ? '—' : String(entry.total);

  // Формируем URL страницы заклинания, если есть контекст заклинания.
  // Для Discord всегда стараемся использовать абсолютный адрес:
  // - на локалке это будет http://localhost:8000/db.html?spell=...
  // - на GitHub Pages — https://kaliguri.github.io/E-Magios-Core-Site/db.html?spell=...
  let spellUrl = null;
  if (entry.contextSpell) {
    try {
      let baseUrl = 'https://kaliguri.github.io/E-Magios-Core-Site/';
      if (typeof window !== 'undefined' && window.location && window.location.origin) {
        const origin = window.location.origin;
        const pathname = window.location.pathname || '/';
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length && segments[0] === 'E-Magios-Core-Site') {
          baseUrl = origin + '/E-Magios-Core-Site/';
        } else {
          baseUrl = origin.replace(/\/+$/, '') + '/';
        }
      }
      spellUrl = baseUrl + 'db.html?spell=' + encodeURIComponent(String(entry.contextSpell));
    } catch (e) {
      // В крайнем случае, если что-то пошло не так, просто не добавляем ссылку
      spellUrl = null;
    }
  }

  // Определяем, был ли критический успех (как в истории бросков на сайте)
  let isCrit = false;
  if (entry && Array.isArray(entry.parts)) {
    entry.parts.forEach((part) => {
      if (
        part &&
        ((part.kind === 'dice' &&
          part.sides === 12 &&
          part.count === 1 &&
          Array.isArray(part.rolls) &&
          part.rolls.indexOf(12) !== -1) ||
          (part.type === 'dice' &&
            part.sides === 12 &&
            part.count === 1 &&
            Array.isArray(part.rolls) &&
            part.rolls.indexOf(12) !== -1))
      ) {
        isCrit = true;
      }
    });
  }
  // Отключаем "крит" для бросков на наложение эффекта
  if (isCrit && entry.contextSource && String(entry.contextSource).indexOf('apply') !== -1) {
    isCrit = false;
  }

  // Детализация броска — одна строка или несколько, если частей несколько
  const detailLines = [];
  const contextBonuses =
    entry && entry.contextBonuses
      ? Array.isArray(entry.contextBonuses.items)
        ? entry.contextBonuses.items
        : Array.isArray(entry.contextBonuses)
        ? entry.contextBonuses
        : []
      : [];
  const hasContextBonusBreakdown = contextBonuses.length > 0;
  const normalizedExpression =
    entry && entry.expression ? String(entry.expression).replace(/\s+/g, '') : null;
  const normalizedDisplayExpression =
    entry && entry.displayExpression ? String(entry.displayExpression).replace(/\s+/g, '') : null;
  const contextBonusTotal =
    entry && typeof entry.contextBonusTotal === 'number' ? entry.contextBonusTotal : null;
  const hasHiddenAutoBonus =
    hasContextBonusBreakdown &&
    normalizedExpression &&
    normalizedDisplayExpression &&
    normalizedExpression !== normalizedDisplayExpression;
  // Бонус от заклинания считаем только из исходной формулы (до автодоливки персонажа),
  // чтобы не цеплять бонус персонажа как бонус заклинания.
  let spellBonusValue = typeof entry.contextSpellBonus === 'number' ? entry.contextSpellBonus : 0;
  let hasSpellBonus = spellBonusValue !== 0;

  const buildSumParts = function (parts, totalValue) {
    if (!Array.isArray(parts) || !parts.length || !Number.isFinite(totalValue)) {
      return null;
    }

    const toNumber = (part) => {
      if (!part) return null;
      if (part.kind === 'dice') {
        if (Number.isFinite(part.segmentTotal)) return part.sign * part.segmentTotal;
        if (Number.isFinite(part.baseSum)) return part.sign * part.baseSum;
        if (Array.isArray(part.rolls)) {
          const sum = part.rolls.reduce((acc, v) => acc + (Number(v) || 0), 0);
          return part.sign * sum;
        }
        return null;
      }
      if (part.kind === 'number') {
        return part.sign * part.value;
      }
      if (part.type === 'dice') {
        if (Number.isFinite(part.sum)) return part.sum;
        if (Number.isFinite(part.baseSum)) return part.baseSum;
        if (Array.isArray(part.rolls)) {
          return part.rolls.reduce((acc, v) => acc + (Number(v) || 0), 0);
        }
        return null;
      }
      if (part.type === 'modifier') {
        return part.value;
      }
      return null;
    };

    const partsLabels = [];
    let componentCount = 0;

    parts.forEach((part) => {
      const val = toNumber(part);
      // Если есть детальная разбивка бонусов персонажа — не добавляем суммарный числовой бонус,
      // его заменим подробными значениями ниже.
      if (hasContextBonusBreakdown && part && part.kind === 'number') {
        const signedValue = Number.isFinite(part.sign) ? part.sign * part.value : part.value;
        // Прячем только автодоливку персонажа (когда формула отличается от отображаемой)
        // и значение совпадает с суммой бонусов персонажа.
        if (
          Number.isFinite(contextBonusTotal) &&
          Math.round(signedValue) === Math.round(contextBonusTotal)
        ) {
          return;
        }
      }
      if (!Number.isFinite(val) || val === 0) return;
      const abs = Math.abs(val);
      const isFirst = partsLabels.length === 0;
      const label =
        val >= 0
          ? isFirst
            ? String(abs)
            : `+ ${abs}`
          : isFirst
          ? `-${abs}`
          : `- ${abs}`;
      partsLabels.push(label);
      componentCount += 1;
    });

    // Добавляем разобранные бонусы (если они есть) вместо суммарного числа
    if (hasContextBonusBreakdown) {
      contextBonuses.forEach((bonus) => {
        const rawValue =
          bonus && typeof bonus.value === 'number' ? bonus.value : parseInt(bonus && bonus.value, 10);
        if (!Number.isFinite(rawValue) || rawValue === 0) return;
        const abs = Math.abs(rawValue);
        const isFirst = partsLabels.length === 0;
        const label =
          rawValue >= 0
            ? isFirst
              ? String(abs)
              : `+ ${abs}`
            : isFirst
            ? `-${abs}`
            : `- ${abs}`;
        partsLabels.push(label);
        componentCount += 1;
      });
    }

    if (!partsLabels.length) {
      return null;
    }

    return {
      label: `[${partsLabels.join(' ')}] = [${totalValue}]`,
      count: componentCount
    };
  };

  if (entry.parts && Array.isArray(entry.parts) && entry.parts.length) {
    entry.parts.forEach((part) => {
      if (part.kind === 'dice') {
        const signLabel = part.sign < 0 ? '-' : '+';
        const rolls = Array.isArray(part.rolls) ? '[' + part.rolls.join(', ') + ']' : '';
        const sumLabel = typeof part.baseSum === 'number' ? '[' + part.baseSum + ']' : '';
        let line = `${signLabel} **${part.count}d${part.sides}**`;
        if (rolls) {
          line += `: ${rolls}`;
        }
        if (sumLabel) {
          line += ` = ${sumLabel}`;
        }
        if (part.scaleOp && part.scale) {
          const scaled = typeof part.segmentTotal === 'number' ? '[' + part.segmentTotal + ']' : String(part.segmentTotal || '');
          line += `; после ${part.scaleOp}${part.scale} = ${scaled}`;
        }
        detailLines.push(line);
      } else if (part.kind === 'number') {
        const signLabel = part.sign < 0 ? '-' : '+';
        // Если есть детальная разбивка бонусов персонажа, не дублируем агрегированный бонус.
        if (hasContextBonusBreakdown) {
          const signedValue = Number.isFinite(part.sign) ? part.sign * part.value : part.value;
          if (
            !(hasHiddenAutoBonus && Number.isFinite(contextBonusTotal) && Math.round(signedValue) === Math.round(contextBonusTotal))
          ) {
            detailLines.push(`${signLabel} ${Math.abs(part.value)}`);
          }
        } else {
          // Нет детальной разбивки — выводим числовую часть как есть
          detailLines.push(`${signLabel} ${Math.abs(part.value)}`);
        }
      } else if (part.type === 'dice') {
        const rollsLegacy = Array.isArray(part.rolls) ? part.rolls.join(' + ') : '';
        detailLines.push(`${part.count}d${part.sides}: ${rollsLegacy} = ${part.sum}`);
      } else if (part.type === 'modifier') {
        const signLegacy = part.value >= 0 ? '+' : '-';
        detailLines.push(`Бонус: ${signLegacy}${Math.abs(part.value)}`);
      }
    });
  }

  if (hasSpellBonus && spellBonusValue !== 0 && entry && entry.contextSpell) {
    detailLines.push(`**Бонус от Заклинания** (${formatBonusLabel(spellBonusValue)}): [${spellBonusValue}]`);
  }

  if (contextBonuses.length) {
    contextBonuses.forEach((bonus) => {
      const rawValue = bonus && typeof bonus.value === 'number' ? bonus.value : parseInt(bonus && bonus.value, 10);
      if (!Number.isFinite(rawValue) || rawValue === 0) {
        return;
      }
      const label = bonus && bonus.label ? String(bonus.label) : 'Бонус';
      detailLines.push(`**${label}**: [${rawValue}]`);
    });
  }

  let colorInt = 0x10b981;
  if (DICE_ROLLER_STATE.discordColor && typeof DICE_ROLLER_STATE.discordColor === 'string') {
    const raw = DICE_ROLLER_STATE.discordColor.trim();
    const normalized = raw.startsWith('#') ? raw.slice(1) : raw;
    if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
      // eslint-disable-next-line no-restricted-globals
      const parsed = parseInt(normalized, 16);
      if (!Number.isNaN(parsed)) {
        colorInt = parsed;
      }
    }
  }

  const blocks = [];
  const isSimpleRoll =
    !entry.contextSpell &&
    !entry.contextSource &&
    !entry.contextCharacterName &&
    !entry.contextRollType &&
    (!entry.contextLabel || entry.contextLabel === 'Бросок');

  blocks.push(expression ? `**Формула:** [${expression}]` : '**Формула:** —');
  blocks.push('');

  if (!isSimpleRoll) {
    const characterLabel =
      entry && entry.contextCharacterName ? String(entry.contextCharacterName) : 'Нет';
    blocks.push(`**Персонаж:** ${characterLabel}`);
    if (spellUrl && entry.contextSpell) {
      if (entry.contextLabel) {
        blocks.push(`**Источник:** ${entry.contextLabel} — [${entry.contextSpell}](${spellUrl})`);
      } else {
        blocks.push(`**Источник:** [${entry.contextSpell}](${spellUrl})`);
      }
    } else {
      blocks.push('**Источник:** Нет');
    }
    blocks.push('');
  }

  if (detailLines.length) {
    const detailsText = detailLines.join('\n');
    blocks.push(detailsText.length > 1000 ? detailsText.slice(0, 1000) + '\n…' : detailsText);
  } else {
    blocks.push('—');
  }
  blocks.push('');
  const sumInfo = buildSumParts(entry.parts, entry.total);
  if (sumInfo && sumInfo.count > 1) {
    blocks.push(`**Итого (сумма):** ${sumInfo.label}`);
  }
  if (typeof entry.total === 'number') {
    if (isCrit) {
      blocks.push(`**Итого:** [${totalLabel}] — **КРИТИЧЕСКИЙ УСПЕХ**`);
    } else {
      blocks.push(`**Итого:** [${totalLabel}]`);
    }
  } else {
    blocks.push('**Итого:** —');
  }

  const description = blocks.join('\n');

  const payload = {
    username,
    embeds: [
      {
        description,
        color: colorInt,
        author: {
          name: username
        }
      }
    ]
  };

  try {
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch((err) => {
      console.error('Failed to send dice roll to Discord (network error):', err);
    });
  } catch (err) {
    console.error('Failed to send dice roll to Discord (fetch error):', err);
  }
}

function loadDiceHistory() {
  if (!DICE_ROLLER_STATE.db || !DICE_ROLLER_STATE.user) {
    DICE_ROLLER_STATE.history = [];
    DICE_ROLLER_STATE.historyLoaded = true;
    renderDiceHistory();
    return;
  }

  DICE_ROLLER_STATE.db
    .collection('users')
    .doc(DICE_ROLLER_STATE.user.uid)
    .collection('diceRolls')
    .orderBy('createdAt', 'desc')
    .limit(DICE_ROLLER_STATE.maxHistory)
    .get()
    .then((snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data) return;
        items.push({
          expression: data.expression || '',
          displayExpression: data.displayExpression || null,
          total: typeof data.total === 'number' ? data.total : null,
          parts: Array.isArray(data.parts) ? data.parts : [],
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          contextLabel: data.contextLabel || null,
          contextSpell: data.contextSpell || null,
          contextSource: data.contextSource || null,
          contextRollType: data.contextRollType || null,
        contextBonuses: data.contextBonuses || null,
        contextBonusTotal:
          typeof data.contextBonusTotal === 'number' ? data.contextBonusTotal : null,
          contextCharacterId: data.contextCharacterId || null,
          contextCharacterName: data.contextCharacterName || null
        });
      });
      // Сортируем по времени по возрастанию, чтобы новые записи отображались внизу
      items.sort((a, b) => {
        const aTs = typeof a.createdAt === 'number' ? a.createdAt : 0;
        const bTs = typeof b.createdAt === 'number' ? b.createdAt : 0;
        return aTs - bTs;
      });
      DICE_ROLLER_STATE.history = items;
      DICE_ROLLER_STATE.historyLoaded = true;
      renderDiceHistory();
    })
    .catch((err) => {
      console.error('Failed to load dice history:', err);
      DICE_ROLLER_STATE.history = [];
      DICE_ROLLER_STATE.historyLoaded = true;
      renderDiceHistory();
    });
}

function renderDiceHistory() {
  const container = document.getElementById('dice-roller-messages');
  if (!container) return;

  // Сохраняем состояние открытых деталей до перерисовки
  const openDetails = new Set(DICE_ROLLER_STATE.openDetails || []);
  container.querySelectorAll('.dice-message-details-toggle.expanded').forEach((btn) => {
    const targetId = btn.getAttribute('data-target');
    if (targetId) {
      openDetails.add(targetId);
    }
  });
  container.querySelectorAll('.dice-message-details:not(.hidden)').forEach((details) => {
    if (details.id) {
      openDetails.add(details.id);
    }
  });
  DICE_ROLLER_STATE.openDetails = openDetails;

  container.innerHTML = '';

  if (!DICE_ROLLER_STATE.historyLoaded) {
    const p = document.createElement('p');
    p.className = 'dice-roller-empty';
    p.textContent = 'Загрузка истории бросков...';
    container.appendChild(p);
    return;
  }

  if (!DICE_ROLLER_STATE.history.length) {
    const p = document.createElement('p');
    p.className = 'dice-roller-empty';
    p.textContent = 'История бросков появится здесь.';
    container.appendChild(p);
    return;
  }

  DICE_ROLLER_STATE.history.forEach((entry, index) => {
    let isCrit = false;

    if (entry && Array.isArray(entry.parts)) {
      entry.parts.forEach((part) => {
        if (
          part &&
          ((part.kind === 'dice' && part.sides === 12 && part.count === 1 && Array.isArray(part.rolls) && part.rolls.indexOf(12) !== -1) ||
            (part.type === 'dice' && part.sides === 12 && part.count === 1 && Array.isArray(part.rolls) && part.rolls.indexOf(12) !== -1))
        ) {
          isCrit = true;
        }
      });
    }

    // Отключаем подсветку крита для бросков на наложение эффекта,
    // оставляем только для Арканы и Попадания
    if (isCrit && entry.contextSource && String(entry.contextSource).indexOf('apply') !== -1) {
      isCrit = false;
    }

    const item = document.createElement('div');
    item.className = 'dice-message' + (isCrit ? ' dice-message-crit' : '');

    if (entry.system) {
      item.innerHTML = `
        <div class="dice-message-header">
          <div class="dice-message-expression" style="color: var(--text-muted);">Система</div>
        </div>
        <div class="dice-message-details">
          ${entry.text}
        </div>
      `;
      container.appendChild(item);
      return;
    }

    const time = new Date(entry.createdAt);
    const timeLabel = `${String(time.getHours()).padStart(2, '0')}:${String(
      time.getMinutes()
    ).padStart(2, '0')}`;

    const detailsId = `dice-details-${index}`;

    const labelParts = [];

    if (entry.contextLabel) {
      labelParts.push(formatRollLabel(entry.contextLabel, entry.contextRollType));
    }
    if (entry.contextSpell) {
      labelParts.push(buildSpellLinkHtml(entry.contextSpell));
    }
    // Всегда добавляем само выражение в подпись
    const exprToShow = entry.displayExpression || entry.expression;
    if (exprToShow) {
      labelParts.push('[' + escapeHtml(exprToShow) + ']');
    }
    const headerLabel = labelParts.length ? labelParts.join(' — ') : '';
    const totalValue = typeof entry.total === 'number' ? entry.total : '—';

    item.innerHTML = `
      <div class="dice-message-header">
        <div class="dice-message-expression">${headerLabel}</div>
        <div class="dice-message-total-box">
          <span class="dice-message-total-value">${escapeHtml(String(totalValue))}</span>
        </div>
      </div>
      <div class="dice-message-meta">
        <span>${timeLabel}</span>
        ${isCrit ? '<span class="dice-crit-label">Критический Успех</span>' : ''}
      </div>
      <div class="dice-message-details hidden" id="${detailsId}">
        ${formatDiceDetails(entry)}
      </div>
    `;

    container.appendChild(item);

    // Восстанавливаем открытое состояние, если оно было сохранено
    if (DICE_ROLLER_STATE.openDetails.has(detailsId)) {
      const detailsEl = item.querySelector('.dice-message-details');
      if (detailsEl) detailsEl.classList.remove('hidden');
    }
  });

  const messageBlocks = container.querySelectorAll('.dice-message');
  messageBlocks.forEach((block) => {
    block.addEventListener('click', (event) => {
      // Клик по ссылке заклинания не должен менять режим отображения деталей
      if (event.target.closest('.dice-spell-link')) {
        return;
      }

      const details = block.querySelector('.dice-message-details');
      if (!details) return;
      const nowHidden = details.classList.toggle('hidden');
      if (!nowHidden && details.id) {
        DICE_ROLLER_STATE.openDetails.add(details.id);
      } else if (details.id) {
        DICE_ROLLER_STATE.openDetails.delete(details.id);
      }
    });
  });

  if (DICE_ROLLER_STATE.settings.detailedMode && DICE_ROLLER_STATE.history.length) {
    const lastIndex = DICE_ROLLER_STATE.history.length - 1;
    const lastDetails = document.getElementById(`dice-details-${lastIndex}`);
    if (lastDetails) {
      lastDetails.classList.remove('hidden');
      DICE_ROLLER_STATE.openDetails.add(lastDetails.id);
    }
  }

  if (!container.dataset.spellLinkBound) {
    container.addEventListener('click', (event) => {
      const link = event.target.closest('.dice-spell-link');
      if (!link) return;
      event.preventDefault();
      event.stopPropagation();
      const spellName = link.getAttribute('data-spell-name') || link.textContent || '';
      if (!spellName) return;

      openDbEntity('spell', spellName).catch((e) => {
        console.error('Failed to open spell popup from dice history:', e);
        const targetUrl = 'db.html?spell=' + encodeURIComponent(spellName);
        window.location.href = targetUrl;
      });
    });
    container.dataset.spellLinkBound = '1';
  }

  // Всегда скроллим к последнему сообщению, чтобы новые броски были видны
  container.scrollTop = container.scrollHeight;
}

function formatDiceDetails(entry) {
  if (!entry.parts || !entry.parts.length) {
    return 'Нет подробностей по броску.';
  }

  const expression = entry.displayExpression || entry.expression || '';
  const contextBonuses =
    entry && entry.contextBonuses
      ? Array.isArray(entry.contextBonuses.items)
        ? entry.contextBonuses.items
        : Array.isArray(entry.contextBonuses)
        ? entry.contextBonuses
        : []
      : [];
  const hasContextBonusBreakdown = contextBonuses.length > 0;
  const normalizedExpression =
    entry && entry.expression ? String(entry.expression).replace(/\s+/g, '') : null;
  const normalizedDisplayExpression =
    entry && entry.displayExpression ? String(entry.displayExpression).replace(/\s+/g, '') : null;
  const contextBonusTotal =
    entry && typeof entry.contextBonusTotal === 'number' ? entry.contextBonusTotal : null;
  const hasHiddenAutoBonus =
    hasContextBonusBreakdown &&
    normalizedExpression &&
    normalizedDisplayExpression &&
    normalizedExpression !== normalizedDisplayExpression;

  const buildSumParts = function (parts, totalValue) {
    if (!Array.isArray(parts) || !parts.length || !Number.isFinite(totalValue)) {
      return null;
    }

    const toNumber = (part) => {
      if (!part) return null;
      if (part.kind === 'dice') {
        if (Number.isFinite(part.segmentTotal)) return part.sign * part.segmentTotal;
        if (Number.isFinite(part.baseSum)) return part.sign * part.baseSum;
        if (Array.isArray(part.rolls)) {
          const sum = part.rolls.reduce((acc, v) => acc + (Number(v) || 0), 0);
          return part.sign * sum;
        }
        return null;
      }
      if (part.kind === 'number') {
        return part.sign * part.value;
      }
      if (part.type === 'dice') {
        if (Number.isFinite(part.sum)) return part.sum;
        if (Number.isFinite(part.baseSum)) return part.baseSum;
        if (Array.isArray(part.rolls)) {
          return part.rolls.reduce((acc, v) => acc + (Number(v) || 0), 0);
        }
        return null;
      }
      if (part.type === 'modifier') {
        return part.value;
      }
      return null;
    };

    const partsLabels = [];
    let componentCount = 0;

    parts.forEach((part) => {
      const val = toNumber(part);
      // Если есть детальная разбивка бонусов персонажа — не добавляем суммарный числовой бонус,
      // его заменим подробными значениями ниже.
      if (hasContextBonusBreakdown && part && part.kind === 'number') {
        const signedValue = Number.isFinite(part.sign) ? part.sign * part.value : part.value;
        if (
          Number.isFinite(contextBonusTotal) &&
          Math.round(signedValue) === Math.round(contextBonusTotal)
        ) {
          return;
        }
      }
      if (!Number.isFinite(val) || val === 0) return;
      const abs = Math.abs(val);
      const isFirst = partsLabels.length === 0;
      const label =
        val >= 0
          ? isFirst
            ? String(abs)
            : `+ ${abs}`
          : isFirst
          ? `-${abs}`
          : `- ${abs}`;
      partsLabels.push(label);
      componentCount += 1;
    });

    // Добавляем разобранные бонусы (если они есть) вместо суммарного числа
    if (hasContextBonusBreakdown) {
      contextBonuses.forEach((bonus) => {
        const rawValue =
          bonus && typeof bonus.value === 'number' ? bonus.value : parseInt(bonus && bonus.value, 10);
        if (!Number.isFinite(rawValue) || rawValue === 0) return;
        const abs = Math.abs(rawValue);
        const isFirst = partsLabels.length === 0;
        const label =
          rawValue >= 0
            ? isFirst
              ? String(abs)
              : `+ ${abs}`
            : isFirst
            ? `-${abs}`
            : `- ${abs}`;
        partsLabels.push(label);
        componentCount += 1;
      });
    }

    if (!partsLabels.length) {
      return null;
    }

    return {
      label: `[${partsLabels.join(' ')}] = [${totalValue}]`,
      count: componentCount
    };
  };

  let isCrit = false;
  if (entry && Array.isArray(entry.parts)) {
    entry.parts.forEach((part) => {
      if (
        part &&
        ((part.kind === 'dice' &&
          part.sides === 12 &&
          part.count === 1 &&
          Array.isArray(part.rolls) &&
          part.rolls.indexOf(12) !== -1) ||
          (part.type === 'dice' &&
            part.sides === 12 &&
            part.count === 1 &&
            Array.isArray(part.rolls) &&
            part.rolls.indexOf(12) !== -1))
      ) {
        isCrit = true;
      }
    });
  }
  if (isCrit && entry.contextSource && String(entry.contextSource).indexOf('apply') !== -1) {
    isCrit = false;
  }

  const lines = [];
  const bonusLabelUsed = { used: false };
  // Бонус от заклинания считаем только из исходной формулы (до автодоливки персонажа),
  // чтобы не цеплять бонус персонажа как бонус заклинания.
  let spellBonusValue = typeof entry.contextSpellBonus === 'number' ? entry.contextSpellBonus : 0;
  let hasSpellBonus = spellBonusValue !== 0;
  // Формула
  lines.push(
    `<div class="dice-detail-line"><span class="dice-detail-meta">Формула</span>: ${
      expression ? '[' + escapeHtml(expression) + ']' : '—'
    }</div>`
  );
  // Персонаж (если есть) вынесен сюда, а не в заголовок
  if (entry.contextCharacterName) {
    const charLabel = buildCharacterLinkHtml(entry.contextCharacterId, entry.contextCharacterName);
    lines.push(
      `<div class="dice-detail-line dice-detail-section"><span class="dice-detail-meta">Персонаж: ${charLabel}</span></div>`
    );
  }

  entry.parts.forEach((part) => {
    // Новый формат частей
    if (part.kind === 'dice') {
      const signLabel = part.sign < 0 ? '-' : '+';
      const rolls = Array.isArray(part.rolls) ? '[' + part.rolls.join(', ') + ']' : '';
      const baseSum = typeof part.baseSum === 'number' ? '[' + part.baseSum + ']' : '';
      let line = `<span class="dice-detail-dice">${signLabel} ${part.count}d${part.sides}</span>`;

      if (rolls) {
        line += `: <span class="dice-detail-rolls">${rolls}</span>`;
      }

      if (part.scaleOp && part.scale) {
        const segmentValue =
          typeof part.segmentTotal === 'number' ? '[' + part.segmentTotal + ']' : baseSum ? baseSum : '';
        line += ` <span class="dice-detail-meta">; после ${part.scaleOp}${part.scale} = ${segmentValue}</span>`;
      } else if (baseSum !== '') {
        line += ` <span class="dice-detail-meta">= ${baseSum}</span>`;
      }

      lines.push(`<div class="dice-detail-line">${line}</div>`);
    } else if (part.kind === 'number') {
      const signLabel = part.sign < 0 ? '-' : '+';
      const bonusLabels = {
        arcana: 'Бонус от Арканы',
        hit: 'Бонус на Попадание',
        apply: 'Бонус на Наложение эффекта'
      };
      const rawBonus = part.sign * part.value;
      const isContextBonus = entry.contextRollType && bonusLabels[entry.contextRollType];
      const shouldShowBonus =
        isContextBonus &&
        !bonusLabelUsed.used &&
        typeof rawBonus === 'number' &&
        rawBonus !== 0 &&
        !hasContextBonusBreakdown &&
        !entry.contextSpell;
      if (shouldShowBonus) {
        const labeled = `${signLabel} ${bonusLabels[entry.contextRollType]} (${formatBonusLabel(rawBonus)})`;
        lines.push(
          `<div class="dice-detail-line"><span class="dice-detail-bonus">${labeled}</span>: <span class="dice-detail-meta">[${Math.abs(
            part.value
          )}]</span></div>`
        );
        bonusLabelUsed.used = true;
      } else if (!isContextBonus && !entry.contextSpell) {
        lines.push(
          `<div class="dice-detail-line"><span class="dice-detail-meta">${signLabel} [${Math.abs(
            part.value
          )}]</span></div>`
        );
      }
    } else if (part.type === 'dice') {
      // Обратная совместимость со старым форматом
      const rollsLegacy = Array.isArray(part.rolls) ? '[' + part.rolls.join(', ') + ']' : '';
      const legacySum =
        typeof part.sum === 'number'
          ? '[' + part.sum + ']'
          : typeof part.baseSum === 'number'
          ? '[' + part.baseSum + ']'
          : '';
      let line = `<span class="dice-detail-dice">${part.count}d${part.sides}</span>`;
      if (rollsLegacy) {
        line += `: <span class="dice-detail-rolls">${rollsLegacy}</span>`;
      }
      if (legacySum !== '') {
        line += ` <span class="dice-detail-meta">= ${legacySum}</span>`;
      }
      lines.push(`<div class="dice-detail-line">${line}</div>`);
    } else if (part.type === 'modifier') {
      const signLegacy = part.value >= 0 ? '+' : '-';
      lines.push(
        `<div class="dice-detail-line"><span class="dice-detail-meta">Бонус: ${signLegacy}[${Math.abs(part.value)}]</span></div>`
      );
    }
  });

  if (hasSpellBonus && spellBonusValue !== 0 && entry && entry.contextSpell) {
    const signSpell = spellBonusValue >= 0 ? '+' : '';
    lines.push(
      `<div class="dice-detail-line"><span class="dice-detail-bonus">Бонус от Заклинания (${signSpell}${spellBonusValue})</span>: <span class="dice-detail-meta">[${spellBonusValue}]</span></div>`
    );
  }

  if (contextBonuses.length) {
    contextBonuses.forEach((bonus) => {
      const rawValue = bonus && typeof bonus.value === 'number' ? bonus.value : parseInt(bonus && bonus.value, 10);
      if (!Number.isFinite(rawValue) || rawValue === 0) {
        return;
      }
      const signLabel = rawValue >= 0 ? '+' : '-';
      const safeLabel = escapeHtml(bonus && bonus.label ? String(bonus.label) : 'Бонус');
      lines.push(
        `<div class="dice-detail-line"><span class="dice-detail-bonus">${safeLabel} (${signLabel}${Math.abs(
          rawValue
        )})</span>: <span class="dice-detail-meta">[${Math.abs(rawValue)}]</span></div>`
      );
    });
  }

  const sumInfo = buildSumParts(entry.parts, entry.total);
  const totalLabel =
    typeof entry.total === 'number' ? `[${entry.total}]` : entry.total === null ? '—' : String(entry.total || '—');
  if (sumInfo && sumInfo.count > 1) {
    lines.push(
      `<div class="dice-detail-line dice-detail-total"><span class="dice-detail-total-label">Итого (сумма)</span>: ${sumInfo.label}</div>`
    );
  }
  lines.push(
    `<div class="dice-detail-line dice-detail-total"><span class="dice-detail-total-label">Итого</span>: ${totalLabel}${
      isCrit ? ' — <span class="dice-crit-label">КРИТИЧЕСКИЙ УСПЕХ</span>' : ''
    }</div>`
  );

  return lines.join('');
}

// Глобальные кликабельные ссылки для бросков кубов в текстах заклинаний
function initGlobalDiceLinks() {
  document.addEventListener('click', (event) => {
    const target = event.target.closest('.dice-roll-link');
    if (!target) {
      return;
    }
    event.preventDefault();

    const expression = (target.getAttribute('data-dice-expression') || '').trim();
    if (!expression) {
      return;
    }

    const spellName = target.getAttribute('data-spell-name') || '';
    const source = target.getAttribute('data-dice-source') || 'spell-text';

    if (typeof openDiceRollerPanel === 'function') {
      openDiceRollerPanel();
    } else {
      // На случай, если виджет ещё не инициализирован
      initDiceRoller();
      openDiceRollerPanel();
    }

    if (typeof handleDiceRollCommand !== 'function') {
      console.error('Dice roller is not available.');
      return;
    }

    const context = {
      spell: spellName,
      source: source
    };

    if (spellName) {
      context.label = 'Бросок из Заклинания';
    }

    handleDiceRollCommand(expression, context);
  });
}

// ----- Database detail modal (cross-page) -----
const DB_MODAL_STATE_KEY = 'db_open_detail';
let dbScriptPromise = null;

function ensureDbDetailModal() {
  if (document.getElementById('spell-detail-modal')) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'spell-detail-modal';
  overlay.className = 'modal-overlay hidden';

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title" id="spell-detail-title">Объект базы данных</h3>
        <div class="modal-header-actions">
          <button type="button" class="modal-nav-btn" id="db-modal-back" aria-label="Назад" disabled>←</button>
          <button type="button" class="modal-nav-btn" id="db-modal-forward" aria-label="Вперёд" disabled>→</button>
          <button type="button" class="modal-close-btn" id="spell-detail-close" aria-label="Закрыть">×</button>
        </div>
      </div>
      <div class="modal-body">
        <div id="spell-detail-content"></div>
      </div>
      <div class="spell-detail-footer" id="spell-detail-footer"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('#spell-detail-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (typeof window.closeSpellDetailModal === 'function') {
        window.closeSpellDetailModal();
      } else {
        overlay.classList.add('hidden');
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        sessionStorage.removeItem(DB_MODAL_STATE_KEY);
      }
    });
  }

  const backBtn = overlay.querySelector('#db-modal-back');
  const forwardBtn = overlay.querySelector('#db-modal-forward');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (typeof window.goBackInDbModalHistory === 'function') {
        window.goBackInDbModalHistory();
      }
    });
  }
  if (forwardBtn) {
    forwardBtn.addEventListener('click', () => {
      if (typeof window.goForwardInDbModalHistory === 'function') {
        window.goForwardInDbModalHistory();
      }
    });
  }

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      if (typeof window.closeSpellDetailModal === 'function') {
        window.closeSpellDetailModal();
      } else {
        overlay.classList.add('hidden');
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        sessionStorage.removeItem(DB_MODAL_STATE_KEY);
      }
    }
  });
}

function resolveDbScriptUrl() {
  const scripts = Array.from(document.getElementsByTagName('script'));
  const commonScript = scripts.find((s) => (s.getAttribute('src') || '').indexOf('common.js?v=4f2957ea') !== -1);
  if (commonScript) {
    const abs = new URL(commonScript.getAttribute('src'), window.location.href).href;
    return abs.replace(/common\.js.*$/i, 'db.js?v=e0c86bb5');
  }
  return new URL('db.js?v=e0c86bb5', window.location.href).href;
}

function ensureDbModuleLoaded() {
  if (window.showSpellPage) {
    return Promise.resolve();
  }
  if (dbScriptPromise) {
    return dbScriptPromise;
  }
  const scriptUrl = resolveDbScriptUrl();
  dbScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load db.js?v=e0c86bb5'));
    document.body.appendChild(script);
  });
  return dbScriptPromise;
}

function parseDbLinkTarget(url) {
  if (!url) {
    return null;
  }
  const params = url.searchParams;
  const kinds = [
    'spell',
    'school',
    'effect',
    'archetype',
    'action',
    'skill',
    'basic',
    'actionType',
    'combat',
    'craftComponent',
    'craftProfession',
    'craftSpecialization',
    'recipeType',
    'recipe'
  ];
  for (let i = 0; i < kinds.length; i += 1) {
    const key = kinds[i];
    const value = params.get(key);
    if (value) {
      return { kind: key, id: value };
    }
  }
  return null;
}

async function openDbEntity(kind, id) {
  if (!kind || !id) {
    return;
  }
  await ensureDbModuleLoaded();
  ensureDbDetailModal();
  const map = {
    spell: window.showSpellPage,
    school: window.showSchoolPage,
    effect: window.showEffectPage,
    archetype: window.showArchetypePage,
    action: window.showActionPage,
    skill: window.showSkillPage,
    basic: window.showBasicPage,
    actionType: window.showActionTypePage,
    combat: window.showCombatPage,
    craftComponent: window.showCraftComponentPage,
    craftProfession: window.showCraftProfessionPage,
    craftSpecialization: window.showCraftSpecializationPage,
    recipeType: window.showRecipeTypePage,
    recipe: window.showRecipePage
  };
  const fn = map[kind];
  if (typeof fn === 'function') {
    fn(id);
  } else {
    console.error('DB entity opener is missing for kind:', kind);
  }
}

function handleDbLinkClick(event) {
  const link = event.target.closest('a[href]');
  if (!link) {
    return;
  }
  const href = link.getAttribute('href') || '';
  if (href.indexOf('db.html') === -1) {
    return;
  }
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  const url = new URL(href, window.location.href);
  const target = parseDbLinkTarget(url);
  if (!target) {
    return;
  }
  event.preventDefault();
  openDbEntity(target.kind, target.id);
}

function restoreDbDetailOnLoad() {
  // На самой странице базы восстановления займётся db.js?v=e0c86bb5
  if (document.body.getAttribute('data-page') === 'db') {
    return;
  }
  let saved = null;
  try {
    const raw = sessionStorage.getItem(DB_MODAL_STATE_KEY);
    if (raw) {
      saved = JSON.parse(raw);
    }
  } catch (e) {
    saved = null;
  }
  if (!saved || !saved.kind || !saved.id || saved.path !== window.location.pathname) {
    return;
  }
  openDbEntity(saved.kind, saved.id);
}

// Expose selected helpers for legacy inline handlers and other scripts
Object.assign(window, {
  checkAccess,
  showPasswordModal,
  checkPassword,
  goToHome,
  initPasswordProtection,
  logout,
  addResetPasswordButton,
  toggleBook,
  smoothScrollTo,
  calculateStatsByLevel,
  downloadJSON,
  loadJSONFile,
  openDiceRollerPanel,
  handleDiceRollCommand,
  parseRollExpression,
  rollDiceExpression,
  showPageLoader,
  hidePageLoader,
  setPageLoaderMessage,
  toggleFilterCategory,
  selectAllInCategory,
  clearAllInCategory,
  createFilterTags,
  syncFilterTagsState,
  // Делаем доступными для редактора общий поп-ап базы данных
  openDbEntity,
  ensureDbDetailModal
});

// Initialize common features on page load
document.addEventListener('DOMContentLoaded', () => {
  const isLobbyRoom = document.body.getAttribute('data-page') === 'lobby-room';
  const isLobbyPage = document.body.getAttribute('data-page') === 'lobby';

  // Inject scroll-to-top if missing
  if (!document.getElementById('scroll-to-top')) {
    const btn = document.createElement('button');
    btn.id = 'scroll-to-top';
    btn.className = 'scroll-to-top';
    btn.setAttribute('aria-label', 'Наверх');
    btn.textContent = '↑';
    document.body.appendChild(btn);
  }

  // Generate and inject sidebar for chapter pages and home page
  if ((document.body.hasAttribute('data-book') || document.body.hasAttribute('data-page')) && !isLobbyRoom) {
    initSidebar();
  }
  
  // Auto-protect locked books without inline script calls
  const bookKey = document.body.getAttribute('data-book');
  if (bookKey && isBookLocked(bookKey)) {
    initPasswordProtection();
  }
  
  // Add reset password button on most pages (скрыто в лобби)
  if (!isLobbyPage && !isLobbyRoom) {
    addResetPasswordButton();
  }
  
  // Initialize scroll-to-top button
  initScrollToTop();

  // Initialize dice roller widget (скрываем в комнате лобби)
  if (!isLobbyRoom) {
    initDiceRoller();
    // Включаем поддержку кликабельных формул бросков в текстах
    initGlobalDiceLinks();
  }

  // Унифицированные поп-апы БД по ссылкам db.html?... без перехода между страницами
  document.addEventListener('click', handleDbLinkClick);
  document.addEventListener('click', handleSpellLinkClick);
  restoreDbDetailOnLoad();
  
  // Handle hash on page load
  if (window.location.hash) {
    setTimeout(() => {
      const targetId = window.location.hash.substring(1);
      smoothScrollTo(targetId);
    }, 100);
  }
});

function handleSpellLinkClick(event) {
  const link = event.target.closest('a');
  if (!link) {
    return;
  }
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  const isSpellLink = link.classList.contains('dice-spell-link');
  const href = link.getAttribute('href') || '';
  const hasSpellParam = href.indexOf('db.html?spell=') !== -1;
  if (!isSpellLink && !hasSpellParam) {
    return;
  }
  event.preventDefault();
  const spellName = link.getAttribute('data-spell-name') || decodeURIComponent((href.split('spell=')[1] || '').split('&')[0] || link.textContent || '');
  if (!spellName) {
    return;
  }
  openDbEntity('spell', spellName).catch((err) => {
    console.error('Failed to open spell link:', err);
    window.location.href = href;
  });
}
