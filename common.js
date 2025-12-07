// E'Magios Core - Common JavaScript Functions

// Password Protection System
const MASTER_PASSWORD = '147';
const PASSWORD_KEY = 'emagiosMasterAccess';

/**
 * Check if the user has access to protected content
 */
function checkAccess() {
  return localStorage.getItem(PASSWORD_KEY) === 'true';
}

/**
 * Show password modal for protected pages
 */
function showPasswordModal() {
  // Get current book name
  const bookKey = document.body.getAttribute('data-book');
  const bookInfo = BOOKS[bookKey];
  const bookTitle = bookInfo ? bookInfo.title : 'эта книга';
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'password-modal';
  
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Защищенный контент: ${bookTitle}</h3>
      </div>
      <div class="modal-body">
        <p>Эта страница защищена паролем. Введите пароль для доступа:</p>
        <div class="form-group">
          <input type="password" id="password-input" placeholder="Введите пароль" autofocus>
          <p id="password-error" class="text-muted hidden" style="color: #ef4444; margin-top: 0.5rem;">
            Неверный пароль. Попробуйте снова.
          </p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="goToHome()">Вернуться на главную</button>
        <button class="btn btn-primary" onclick="checkPassword()">Войти</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Allow Enter key to submit
  document.getElementById('password-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkPassword();
    }
  });
}

/**
 * Check the entered password
 */
function checkPassword() {
  const input = document.getElementById('password-input');
  const errorMsg = document.getElementById('password-error');
  
  if (input.value === MASTER_PASSWORD) {
    localStorage.setItem(PASSWORD_KEY, 'true');
    document.getElementById('password-modal').remove();
    // Show the main content
    const main = document.querySelector('main');
    if (main) {
      main.style.display = 'block';
    }
    // Add reset password button after successful login
    addResetPasswordButton();
    // Trigger page-specific initialization if needed
    if (typeof onAccessGranted === 'function') {
      onAccessGranted();
    }
  } else {
    errorMsg.classList.remove('hidden');
    input.value = '';
    input.focus();
  }
}

/**
 * Go back to home page
 */
function goToHome() {
  window.location.href = '../index.html';
}

/**
 * Initialize password protection for pages that require it
 */
function initPasswordProtection() {
  if (!checkAccess()) {
    // Hide the main content
    const main = document.querySelector('main');
    if (main) {
      main.style.display = 'none';
    }
    showPasswordModal();
  } else {
    // Show the main content
    const main = document.querySelector('main');
    if (main) {
      main.style.display = 'block';
    }
  }
}

/**
 * Logout / Clear access (Reset password)
 */
function logout() {
  localStorage.removeItem(PASSWORD_KEY);
  window.location.reload();
}

/**
 * Add reset password button (visible on all pages, but only works if logged in)
 */
function addResetPasswordButton() {
  // Prevent duplicate buttons
  if (document.querySelector('.reset-password-btn')) return;
  
  const button = document.createElement('button');
  button.className = 'reset-password-btn';
  button.textContent = '🔓';
  button.title = 'Сбросить пароль';
  button.style.position = 'fixed';
  button.style.top = 'var(--spacing-md)';
  button.style.right = 'var(--spacing-md)';
  button.style.zIndex = '1000';
  button.style.padding = '8px';
  button.style.fontSize = '1.2rem';
  button.style.background = 'var(--bg-elevated)';
  button.style.border = '1px solid var(--border-color)';
  button.style.borderRadius = 'var(--radius-md)';
  button.style.cursor = 'pointer';
  button.style.opacity = '0';
  button.style.transition = 'opacity 0.2s ease';
  button.style.width = '40px';
  button.style.height = '40px';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  
  // Create hover area
  const hoverArea = document.createElement('div');
  hoverArea.style.position = 'fixed';
  hoverArea.style.top = '0';
  hoverArea.style.right = '0';
  hoverArea.style.width = '100px';
  hoverArea.style.height = '80px';
  hoverArea.style.zIndex = '999';
  
  // Show button on hover
  hoverArea.addEventListener('mouseenter', () => {
    button.style.opacity = '1';
  });
  hoverArea.addEventListener('mouseleave', () => {
    button.style.opacity = '0';
  });
  button.addEventListener('mouseenter', () => {
    button.style.opacity = '1';
  });
  button.addEventListener('mouseleave', () => {
    button.style.opacity = '0';
  });
  
  button.onclick = logout;
  
  document.body.appendChild(hoverArea);
  document.body.appendChild(button);
}

// Navigation helpers
/**
 * Smooth scroll to anchor
 */
function smoothScrollTo(targetId) {
  const element = document.getElementById(targetId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Book and chapter structure
const BOOKS = {
  phb: {
    title: 'Player\'s Handbook',
    locked: false,
    chapters: [
      { id: 'intro', title: 'Введение', file: 'phb/intro.html' },
      { id: 'creation', title: 'Создание Персонажа', file: 'phb/creation.html' },
      { id: 'stats', title: 'Характеристики', file: 'phb/stats.html' },
      { id: 'study-spells', title: 'Учебные Заклинания', file: 'phb/study-spells.html' },
      { id: 'signature-spells', title: 'Фирменные Заклинания', file: 'phb/signature-spells.html' },
      { id: 'spontaneous-spells', title: 'Спонтанные Заклинания', file: 'phb/spontaneous-spells.html' },
      { id: 'metamagic', title: 'Метамагия', file: 'phb/metamagic.html' },
      { id: 'abstract-categories', title: 'Абстрактные Категории', file: 'phb/abstract-categories.html' },
      { id: 'rituals', title: 'Ритуалы', file: 'phb/rituals.html' },
      { id: 'support-magic', title: 'Вспомогательная Магия', file: 'phb/support-magic.html' },
      { id: 'combat', title: 'Компоненты Боевой Системы', file: 'phb/combat.html' },
      { id: 'actions', title: 'Базовые Действия', file: 'phb/actions.html' },
      { id: 'critical-success', title: 'Критический Успех', file: 'phb/critical-success.html' },
      { id: 'wounds', title: 'Раны', file: 'phb/wounds.html' },
      { id: 'archetypes', title: 'Архетипы', file: 'phb/archetypes.html' },
      { id: 'leveling', title: 'Повышение Уровня', file: 'phb/leveling.html' },
      { id: 'long-term-projects', title: 'Долгосрочные Проекты', file: 'phb/long-term-projects.html' },
      { id: 'equipment', title: 'Экипировка', file: 'phb/equipment.html' },
      { id: 'crafting', title: 'Ремесло', file: 'phb/crafting.html' },
      { id: 'effects', title: 'Эффекты', file: 'phb/effects.html' }
    ]
  },
  spellbook: {
    title: 'Spellbook',
    locked: true,
    chapters: [
      { id: 'intro', title: 'Введение', file: 'spellbook/intro.html' },
      { id: 'schools', title: 'Школы Магии', file: 'spellbook/schools.html' },
      { id: 'typology', title: 'Типология Магии', file: 'spellbook/typology.html' },
      { id: 'study-spells', title: 'Учебные заклинания', file: 'spellbook/study-spells.html' },
      { id: 'signature-spells', title: 'Фирменные заклинания', file: 'spellbook/signature-spells.html' },
      { id: 'spell-creation', title: 'Создание Заклинания', file: 'spellbook/spell-creation.html' },
      { id: 'spontaneous-spells', title: 'Спонтанные заклинания', file: 'spellbook/spontaneous-spells.html' },
      { id: 'metamagic', title: 'Метамагия', file: 'spellbook/metamagic.html' }
    ]
  },
  master: {
    title: 'Master\'s Handbook',
    locked: true,
    chapters: [
      { id: 'intro', title: 'Введение', file: 'master/intro.html' },
      { id: 'genre', title: 'Жанр повествования', file: 'master/genre.html' },
      { id: 'how-to-gm', title: 'Как водить игру', file: 'master/how-to-gm.html' },
      { id: 'long-term-projects', title: 'Долгосрочные проекты', file: 'master/long-term-projects.html' },
      { id: 'milestones', title: 'Вехи', file: 'master/milestones.html' },
      { id: 'mage-power-level', title: 'Уровень Силы Мага', file: 'master/mage-power-level.html' }
    ]
  },
  craftbook: {
    title: 'Craftbook',
    locked: true,
    chapters: [
      { id: 'intro', title: 'Введение', file: 'craftbook/intro.html' },
      { id: 'professions', title: 'Виды профессий', file: 'craftbook/professions.html' },
      { id: 'magical-crafts', title: 'Магические ремесла', file: 'craftbook/magical-crafts.html' }
    ]
  },
  rumors: {
    title: 'Compendium of Rumors',
    locked: true,
    chapters: [
      { id: 'intro', title: 'Введение', file: 'rumors/intro.html' },
      { id: 'ideas', title: 'Идеи', file: 'rumors/ideas.html' }
    ]
  }
};

/**
 * Generate and inject sidebar navigation with chapter list
 */
function initSidebar() {
  const body = document.body;
  const currentBook = body.getAttribute('data-book');
  const currentChapter = body.getAttribute('data-chapter');
  const isHomePage = body.getAttribute('data-page') === 'home';
  
  const currentPage = body.getAttribute('data-page');
  const isInSubfolder = currentBook !== null;
  const homeLink = isInSubfolder ? '../index.html' : 'index.html';
  const newsLink = isInSubfolder ? '../news.html' : 'news.html';
  const profileLink = isInSubfolder ? '../profile.html' : 'profile.html';
  const isHomeActive = currentPage === 'home' ? 'active' : '';
  const isNewsActive = currentPage === 'news' ? 'active' : '';
  const isProfileActive = currentPage === 'profile' ? 'active' : '';
  
  let sidebarHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <h2><a href="${homeLink}" style="color: var(--accent-emerald); text-decoration: none;">E'Magios Core</a></h2>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-section">
          <h3>Главная</h3>
          <ul>
            <li><a href="${homeLink}" class="${isHomeActive}">Главная страница</a></li>
            <li><a href="${profileLink}" class="${isProfileActive}">Профиль</a></li>
            <li><a href="${newsLink}" class="${isNewsActive}">Новости</a></li>
          </ul>
        </div>
        <div class="sidebar-section">
          <h3>Книги</h3>
  `;
  
  // Generate book list with chapters
  for (const [bookKey, book] of Object.entries(BOOKS)) {
    const isCurrentBook = bookKey === currentBook;
    const lockIcon = book.locked ? ' 🔒' : '';
    
    sidebarHTML += `
      <div class="book-item ${isCurrentBook ? 'active' : ''}">
        <div class="book-header" onclick="toggleBook('${bookKey}')">
          <span>${book.title}${lockIcon}</span>
          <span class="toggle-icon">${isCurrentBook ? '▼' : '▶'}</span>
        </div>
        <ul class="chapter-list ${isCurrentBook ? 'expanded' : ''}">
    `;
    
    for (const chapter of book.chapters) {
      const isActive = isCurrentBook && chapter.id === currentChapter;
      const chapterLink = isInSubfolder ? `../${chapter.file}` : chapter.file;
      sidebarHTML += `
        <li>
          <a href="${chapterLink}" class="${isActive ? 'active-chapter' : ''}">
            ${chapter.title}
          </a>
        </li>
      `;
    }
    
    sidebarHTML += `
        </ul>
      </div>
    `;
  }
  
  sidebarHTML += `
        </div>
        <div class="sidebar-section">
          <h3>Инструменты</h3>
          <ul>
            <li><a href="${isInSubfolder ? '../character-editor.html' : 'character-editor.html'}" class="${currentPage === 'editor' ? 'active' : ''}">Редактор персонажей</a></li>
            <li><a href="${isInSubfolder ? '../db.html' : 'db.html'}" class="${currentPage === 'db' ? 'active' : ''}">База данных</a></li>
          </ul>
        </div>
      </nav>
    </aside>
  `;
  
  // Find the page-with-sidebar container and inject sidebar
  const pageContainer = document.querySelector('.page-with-sidebar');
  if (pageContainer) {
    pageContainer.insertAdjacentHTML('afterbegin', sidebarHTML);
  }
}

/**
 * Toggle book chapter list
 */
function toggleBook(bookKey) {
  const bookItem = event.target.closest('.book-item');
  const chapterList = bookItem.querySelector('.chapter-list');
  const toggleIcon = bookItem.querySelector('.toggle-icon');
  
  if (chapterList.classList.contains('expanded')) {
    chapterList.classList.remove('expanded');
    toggleIcon.textContent = '▶';
  } else {
    chapterList.classList.add('expanded');
    toggleIcon.textContent = '▼';
  }
}

/**
 * Initialize scroll-to-top button
 */
function initScrollToTop() {
  const scrollBtn = document.getElementById('scroll-to-top');
  if (!scrollBtn) return;
  
  // Show/hide button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  });
  
  // Scroll to top on click
  scrollBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
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
  maxHistory: 50
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
      loadDiceHistory();
    } else {
      DICE_ROLLER_STATE.db = null;
      DICE_ROLLER_STATE.history = [];
      DICE_ROLLER_STATE.historyLoaded = true;
      renderDiceHistory();
    }

    updateDiceAuthState(user);
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
  toggle.textContent = 'd12';

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
  DICE_ROLLER_STATE.history.unshift(entry);
  if (DICE_ROLLER_STATE.history.length > DICE_ROLLER_STATE.maxHistory) {
    DICE_ROLLER_STATE.history.length = DICE_ROLLER_STATE.maxHistory;
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
      labelParts.push(entry.contextLabel);
    }
    if (entry.contextSpell) {
      labelParts.push(entry.contextSpell);
    }
    // Всегда добавляем само выражение в подпись
    if (entry.expression) {
      labelParts.push('(' + entry.expression + ')');
    }
    const headerLabel = labelParts.length ? labelParts.join(' — ') : '';

    item.innerHTML = `
      <div class="dice-message-header">
        <div class="dice-message-expression">${headerLabel}</div>
        <div class="dice-message-total">= ${entry.total}${
          isCrit ? ' <span class="dice-crit-label">КРИТ</span>' : ''
        }</div>
      </div>
      <div class="dice-message-meta">
        <span>${timeLabel}</span>
        <button type="button" class="dice-message-details-toggle" data-target="${detailsId}">подробно</button>
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
      details.classList.toggle('hidden');
    });
  });

  const messageBlocks = container.querySelectorAll('.dice-message');
  messageBlocks.forEach((block) => {
    block.addEventListener('click', () => {
      const details = block.querySelector('.dice-message-details');
      if (!details) return;
      details.classList.toggle('hidden');
    });
  });
}

function formatDiceDetails(entry) {
  if (!entry.parts || !entry.parts.length) {
    return 'Нет подробностей по броску.';
  }

  const lines = [];

  if (entry.expression) {
    lines.push('Выражение: ' + entry.expression);
  }

  entry.parts.forEach((part) => {
    // Новый формат частей
    if (part.kind === 'dice') {
      const signLabel = part.sign < 0 ? '-' : '+';
      const rolls = Array.isArray(part.rolls) ? part.rolls.join(' + ') : '';
      let line = `${signLabel} ${part.count}d${part.sides}: ${rolls} = ${part.baseSum}`;

      if (part.scaleOp && part.scale) {
        line += `; после ${part.scaleOp}${part.scale} = ${part.segmentTotal}`;
      }

      lines.push(line);
    } else if (part.kind === 'number') {
      const signLabel = part.sign < 0 ? '-' : '+';
      lines.push(`${signLabel} ${Math.abs(part.value)}`);
    } else if (part.type === 'dice') {
      // Обратная совместимость со старым форматом
      const rollsLegacy = Array.isArray(part.rolls) ? part.rolls.join(' + ') : '';
      lines.push(`${part.count}d${part.sides}: ${rollsLegacy} = ${part.sum}`);
    } else if (part.type === 'modifier') {
      const signLegacy = part.value >= 0 ? '+' : '-';
      lines.push(`Бонус: ${signLegacy}${Math.abs(part.value)}`);
    }
  });

  lines.push(`Итого: ${entry.total}`);

  return lines.join('<br>');
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

// Initialize common features on page load
document.addEventListener('DOMContentLoaded', () => {
  // Generate and inject sidebar for chapter pages and home page
  if (document.body.hasAttribute('data-book') || document.body.hasAttribute('data-page')) {
    initSidebar();
  }
  
  // Add reset password button on ALL pages (visible only on hover)
  addResetPasswordButton();
  
  // Initialize scroll-to-top button
  initScrollToTop();

  // Initialize dice roller widget (виден на всех страницах)
  initDiceRoller();
  // Включаем поддержку кликабельных формул бросков в текстах
  initGlobalDiceLinks();
  
  // Handle hash on page load
  if (window.location.hash) {
    setTimeout(() => {
      const targetId = window.location.hash.substring(1);
      smoothScrollTo(targetId);
    }, 100);
  }
});
