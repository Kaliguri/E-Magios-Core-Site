// E'Magios Core - Common JavaScript Functions

// Password Protection System
const MASTER_PASSWORD = '147';
const PASSWORD_KEY = 'masterAccess';

/**
 * Check if the user has access to protected content
 */
function checkAccess() {
  return sessionStorage.getItem(PASSWORD_KEY) === 'true';
}

/**
 * Show password modal for protected pages
 */
function showPasswordModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'password-modal';
  
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Защищенный контент</h3>
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
    sessionStorage.setItem(PASSWORD_KEY, 'true');
    document.getElementById('password-modal').remove();
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
  window.location.href = 'index.html';
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
  }
}

/**
 * Logout / Clear access
 */
function logout() {
  sessionStorage.removeItem(PASSWORD_KEY);
  window.location.reload();
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

/**
 * Setup table of contents links
 */
function setupTOCLinks() {
  const tocLinks = document.querySelectorAll('#toc a[href^="#"]');
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      smoothScrollTo(targetId);
      // Update URL without scrolling
      history.pushState(null, null, `#${targetId}`);
    });
  });
}

/**
 * Highlight active TOC link based on scroll position
 */
function updateActiveTOCLink() {
  const sections = document.querySelectorAll('main section[id]');
  const tocLinks = document.querySelectorAll('#toc a');
  
  let currentSection = '';
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    if (window.scrollY >= sectionTop) {
      currentSection = section.getAttribute('id');
    }
  });
  
  tocLinks.forEach(link => {
    link.style.background = '';
    link.style.color = '';
    if (link.getAttribute('href') === `#${currentSection}`) {
      link.style.background = 'var(--bg-elevated)';
      link.style.color = 'var(--accent-emerald)';
    }
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

/**
 * Generate and inject sidebar navigation
 */
function initSidebar() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  const sidebarHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <h2><a href="index.html" style="color: var(--accent-emerald); text-decoration: none;">E'Magios Core</a></h2>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-section">
          <h3>📄 Главная</h3>
          <ul>
            <li><a href="index.html" class="${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">Главная страница</a></li>
          </ul>
        </div>
        <div class="sidebar-section">
          <h3>📚 Книги</h3>
          <ul>
            <li><a href="phb.html" class="${currentPage === 'phb.html' ? 'active' : ''}">Player's Handbook</a></li>
            <li><a href="master.html" class="${currentPage === 'master.html' ? 'active' : ''}">Master's Handbook <span class="lock-icon">🔒</span></a></li>
            <li><a href="spellbook.html" class="${currentPage === 'spellbook.html' ? 'active' : ''}">Spellbook <span class="lock-icon">🔒</span></a></li>
            <li><a href="craftbook.html" class="${currentPage === 'craftbook.html' ? 'active' : ''}">Craftbook <span class="lock-icon">🔒</span></a></li>
            <li><a href="rumors.html" class="${currentPage === 'rumors.html' ? 'active' : ''}">Compendium of Rumors <span class="lock-icon">🔒</span></a></li>
          </ul>
        </div>
        <div class="sidebar-section">
          <h3>🛠️ Инструменты</h3>
          <ul>
            <li><a href="character-editor.html" class="${currentPage === 'character-editor.html' ? 'active' : ''}">Редактор персонажей</a></li>
            <li><a href="db.html" class="${currentPage === 'db.html' ? 'active' : ''}">База данных</a></li>
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

// Initialize common features on page load
document.addEventListener('DOMContentLoaded', () => {
  // Generate and inject sidebar
  initSidebar();
  
  // Setup TOC if it exists
  if (document.getElementById('toc')) {
    setupTOCLinks();
    window.addEventListener('scroll', updateActiveTOCLink);
    updateActiveTOCLink();
  }
  
  // Handle hash on page load
  if (window.location.hash) {
    setTimeout(() => {
      const targetId = window.location.hash.substring(1);
      smoothScrollTo(targetId);
    }, 100);
  }
});

