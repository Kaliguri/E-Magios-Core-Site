import {
  checkAccess,
  showPasswordModal,
  checkPassword,
  goToHome,
  initPasswordProtection,
  logout,
  addResetPasswordButton,
  isBookLocked
} from './access.js';
import { initSidebar, toggleBook } from './sidebar.js';
import { smoothScrollTo, initScrollToTop } from './scroll.js';

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

  return {
    arcana: safeLevel * 2,
    evasion: 4 + (safeLevel * 2),
    savingThrow: 2 + (safeLevel * 2),
    crafting: 4 * safeLevel,
    fortitudeLow: 4 + (safeLevel * 4),
    fortitudeMid: 8 + (safeLevel * 8),
    fortitudeHigh: 12 + (safeLevel * 12),
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
  discordWebhookUrl: null,
  discordDisplayName: null,
  discordColor: null
};

function initDiceRoller() {
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
      loadDiceHistory();
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
      <button type="button" id="dice-roller-close" aria-label="Скрыть">×</button>
    </div>
    <div class="dice-roller-body" id="dice-roller-messages">
      <p class="dice-roller-empty">История бросков появится здесь.</p>
    </div>
    <div class="dice-roller-footer">
      <div class="dice-quick-buttons" id="dice-quick-buttons">
        <button type="button" class="dice-quick-button" data-dice="2">D2</button>
        <button type="button" class="dice-quick-button" data-dice="4">D4</button>
        <button type="button" class="dice-quick-button" data-dice="6">D6</button>
        <button type="button" class="dice-quick-button" data-dice="8">D8</button>
        <button type="button" class="dice-quick-button" data-dice="10">D10</button>
        <button type="button" class="dice-quick-button" data-dice="12">D12</button>
        <button type="button" class="dice-quick-button" data-dice="20">D20</button>
        <button type="button" class="dice-quick-button" data-dice="100">D100</button>
      </div>
      <div class="dice-input-row">
        <input type="text" id="dice-command-input" placeholder="/roll 2d4+3d6+2" autocomplete="off">
        <button type="button" class="btn btn-primary btn-sm" id="dice-roll-submit">Бросить</button>
      </div>
      <div class="dice-auth-hint" id="dice-auth-hint"></div>
      <button type="button" class="dice-clear-history-button" id="dice-clear-history">Очистить историю</button>
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
  const clearBtn = document.getElementById('dice-clear-history');

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

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearDiceHistory();
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

function handleDiceRollCommand(rawCommand, context) {
  if (!DICE_ROLLER_STATE.user) {
    updateDiceAuthState(null);
    return;
  }

  const input = document.getElementById('dice-command-input');

  try {
    const parsed = parseRollExpression(rawCommand);
    const result = rollDiceExpression(parsed);

    // Заполняем контекст броска
    if (context && typeof context === 'object') {
      if (context.label) {
        result.contextLabel = String(context.label);
      }
      if (context.spell) {
        result.contextSpell = String(context.spell);
      }
      if (context.source) {
        result.contextSource = String(context.source);
      }
    } else {
      // Свободный бросок без контекста
      result.contextLabel = 'Свободный Бросок';
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
        total: entry.total,
        parts: entry.parts,
        createdAt: entry.createdAt,
        contextLabel: entry.contextLabel || null,
        contextSpell: entry.contextSpell || null,
        contextSource: entry.contextSource || null
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

  if (shouldPersist && !entry.system) {
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

  const expression = entry.expression || '';
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
        detailLines.push(`${signLabel} ${Math.abs(part.value)}`);
      } else if (part.type === 'dice') {
        const rollsLegacy = Array.isArray(part.rolls) ? part.rolls.join(' + ') : '';
        detailLines.push(`${part.count}d${part.sides}: ${rollsLegacy} = ${part.sum}`);
      } else if (part.type === 'modifier') {
        const signLegacy = part.value >= 0 ? '+' : '-';
        detailLines.push(`Бонус: ${signLegacy}${Math.abs(part.value)}`);
      }
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

  // Формируем описание в формате:
  // Формула: [8d12]
  // Броски:
  // + 8d12: [1, 2, 3, 7] = [12]
  // Итого: [63] — КРИТИЧЕСКИЙ УСПЕХ
  const blocks = [];
  blocks.push(expression ? `**Формула:** [${expression}]` : '**Формула:** —');
  blocks.push('**Броски:**');
  if (detailLines.length) {
    const detailsText = detailLines.join('\n');
    blocks.push(detailsText.length > 1000 ? detailsText.slice(0, 1000) + '\n…' : detailsText);
  } else {
    blocks.push('—');
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

  // Блок источника с аккуратной ссылкой только на название заклинания
  if (spellUrl && entry.contextSpell) {
    blocks.push('');
    if (entry.contextLabel) {
      blocks.push(`Источник: ${entry.contextLabel} — [${entry.contextSpell}](${spellUrl})`);
    } else {
      blocks.push(`Источник: [${entry.contextSpell}](${spellUrl})`);
    }
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
          total: typeof data.total === 'number' ? data.total : null,
          parts: Array.isArray(data.parts) ? data.parts : [],
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          contextLabel: data.contextLabel || null,
          contextSpell: data.contextSpell || null,
          contextSource: data.contextSource || null
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
      labelParts.push(escapeHtml(entry.contextLabel));
    }
    if (entry.contextSpell) {
      labelParts.push(buildSpellLinkHtml(entry.contextSpell));
    }
    // Всегда добавляем само выражение в подпись
    if (entry.expression) {
      labelParts.push('[' + escapeHtml(entry.expression) + ']');
    }
    const headerLabel = labelParts.length ? labelParts.join(' — ') : '';
    const totalLabel = typeof entry.total === 'number' ? `[${entry.total}]` : '—';

    item.innerHTML = `
      <div class="dice-message-header">
        <div class="dice-message-expression">${headerLabel}</div>
        <div class="dice-message-total">= ${totalLabel}${isCrit ? ' <span class="dice-crit-label">КРИТ</span>' : ''}</div>
      </div>
      <div class="dice-message-meta">
        <span>${timeLabel}</span>
        <button
          type="button"
          class="dice-message-details-toggle"
          data-target="${detailsId}"
          aria-label="Раскрыть детали"
          title="Раскрыть детали"
        >▾</button>
      </div>
      <div class="dice-message-details hidden" id="${detailsId}">
        ${formatDiceDetails(entry)}
      </div>
    `;

    container.appendChild(item);
  });

  // Подключаем обработчики разворота деталей — по клику на строку или кнопку
  const detailButtons = container.querySelectorAll('.dice-message-details-toggle');
  detailButtons.forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      if (!targetId) return;
      const details = document.getElementById(targetId);
      if (!details) return;
      const nowHidden = details.classList.toggle('hidden');
      btn.classList.toggle('expanded', !nowHidden);
    });
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
      const toggleBtn = block.querySelector('.dice-message-details-toggle');
      if (toggleBtn) {
        toggleBtn.classList.toggle('expanded', !nowHidden);
      }
    });
  });

  if (!container.dataset.spellLinkBound) {
    container.addEventListener('click', (event) => {
      const link = event.target.closest('.dice-spell-link');
      if (!link) return;
      event.preventDefault();
      event.stopPropagation();
      const spellName = link.getAttribute('data-spell-name') || link.textContent || '';
      if (!spellName) return;

      if (typeof showSpellPage === 'function') {
        try {
          showSpellPage(spellName);
          return;
        } catch (e) {
          console.error('Failed to open spell popup from dice history:', e);
        }
      }

      const targetUrl = 'db.html?spell=' + encodeURIComponent(spellName);
      window.location.href = targetUrl;
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
      lines.push(
        `<div class="dice-detail-line"><span class="dice-detail-meta">${signLabel} [${Math.abs(part.value)}]</span></div>`
      );
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

  const totalLabel =
    typeof entry.total === 'number' ? `[${entry.total}]` : entry.total === null ? '—' : String(entry.total || '—');
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
  syncFilterTagsState
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
  
  // Handle hash on page load
  if (window.location.hash) {
    setTimeout(() => {
      const targetId = window.location.hash.substring(1);
      smoothScrollTo(targetId);
    }, 100);
  }
});
