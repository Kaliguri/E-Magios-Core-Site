import { BOOKS } from './books.js?v=579174ea';

export function initSidebar() {
  const body = document.body;
  const currentBook = body.getAttribute('data-book');
  const currentChapter = body.getAttribute('data-chapter');
  const isHomePage = body.getAttribute('data-page') === 'home';

  const currentPage = body.getAttribute('data-page');
  const isInSubfolder = currentBook !== null;
  const homeLink = isInSubfolder ? '../index.html' : 'index.html';
  const newsLink = isInSubfolder ? '../news.html' : 'news.html';
  const lobbyLink = isInSubfolder ? '../lobby.html' : 'lobby.html';
  const profileLink = isInSubfolder ? '../profile.html' : 'profile.html';
  const isHomeActive = isHomePage ? 'active' : '';
  const isNewsActive = currentPage === 'news' ? 'active' : '';
  const isLobbyActive = currentPage === 'lobby' ? 'active' : '';
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
            <li><a href="${newsLink}" class="${isNewsActive}">Новости</a></li>
            <li><a href="${lobbyLink}" class="${isLobbyActive}">Лобби</a></li>
          </ul>
        </div>
        <div class="sidebar-section">
          <h3>Книги</h3>
  `;

  for (const [bookKey, book] of Object.entries(BOOKS)) {
    const isCurrentBook = bookKey === currentBook;
    const lockIcon = book.locked ? ' 🔒' : '';

    sidebarHTML += `
      <div class="book-item ${isCurrentBook ? 'active' : ''}">
        <div class="book-header" onclick="toggleBook(event, '${bookKey}')">
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

  const pageContainer = document.querySelector('.page-with-sidebar');
  if (pageContainer) {
    pageContainer.insertAdjacentHTML('afterbegin', sidebarHTML);
  }
}

export function toggleBook(event, bookKey) {
  const bookItem = event.target.closest('.book-item');
  if (!bookItem) return;
  const chapterList = bookItem.querySelector('.chapter-list');
  const toggleIcon = bookItem.querySelector('.toggle-icon');

  if (chapterList && toggleIcon) {
    const expanded = chapterList.classList.toggle('expanded');
    toggleIcon.textContent = expanded ? '▼' : '▶';
  }
}

