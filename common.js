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
  const bookTitle = bookInfo ? `${bookInfo.icon} ${bookInfo.title}` : 'эта книга';
  
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
    icon: '⚔️',
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
    icon: '🔮',
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
    icon: '🎭',
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
    icon: '⚒️',
    locked: true,
    chapters: [
      { id: 'intro', title: 'Введение', file: 'craftbook/intro.html' },
      { id: 'professions', title: 'Виды профессий', file: 'craftbook/professions.html' },
      { id: 'magical-crafts', title: 'Магические ремесла', file: 'craftbook/magical-crafts.html' }
    ]
  },
  rumors: {
    title: 'Compendium of Rumors',
    icon: '💭',
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
  const isInSubfolder = currentBook !== null; // если есть data-book, значит мы в подпапке
  const homeLink = isInSubfolder ? '../index.html' : 'index.html';
  const isHomeActive = currentPage === 'home' ? 'active' : '';
  
  let sidebarHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <h2><a href="${homeLink}" style="color: var(--accent-emerald); text-decoration: none;">E'Magios Core</a></h2>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-section">
          <h3>📄 Главная</h3>
          <ul>
            <li><a href="${homeLink}" class="${isHomeActive}">Главная страница</a></li>
          </ul>
        </div>
        <div class="sidebar-section">
          <h3>📖 Книги</h3>
  `;
  
  // Generate book list with chapters
  for (const [bookKey, book] of Object.entries(BOOKS)) {
    const isCurrentBook = bookKey === currentBook;
    const lockIcon = book.locked ? ' 🔒' : '';
    
    sidebarHTML += `
      <div class="book-item ${isCurrentBook ? 'active' : ''}">
        <div class="book-header" onclick="toggleBook('${bookKey}')">
          <span>${book.icon} ${book.title}${lockIcon}</span>
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
          <h3>⚙️ Инструменты</h3>
          <ul>
            <li><a href="${isInSubfolder ? '../character-editor.html' : 'character-editor.html'}" class="${currentPage === 'editor' ? 'active' : ''}">📝 Редактор персонажей</a></li>
            <li><a href="${isInSubfolder ? '../db.html' : 'db.html'}" class="${currentPage === 'db' ? 'active' : ''}">📊 База данных</a></li>
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
 * Calculate stats based on level
 */
function calculateStatsByLevel(level) {
  return {
    arcana: 4 + (level * 4),
    evasion: 10 + (level * 4),
    crafting: 4 + (level * 4),
    fortitudeLow: 4 + (level * 2),
    fortitudeMid: 8 + (level * 4),
    fortitudeHigh: 12 + (level * 6),
    spellSlots: 4 + ((level - 1) * 2)
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
  
  // Handle hash on page load
  if (window.location.hash) {
    setTimeout(() => {
      const targetId = window.location.hash.substring(1);
      smoothScrollTo(targetId);
    }, 100);
  }
});
