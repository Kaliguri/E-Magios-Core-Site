import { MASTER_PASSWORD, PASSWORD_KEY } from './config.js';
import { BOOKS } from './books.js';

export function checkAccess() {
  return localStorage.getItem(PASSWORD_KEY) === 'true';
}

export function showPasswordModal() {
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

  const input = overlay.querySelector('#password-input');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        checkPassword();
      }
    });
  }
}

export function checkPassword() {
  const input = document.getElementById('password-input');
  const errorMsg = document.getElementById('password-error');

  if (input && input.value === MASTER_PASSWORD) {
    localStorage.setItem(PASSWORD_KEY, 'true');
    const modal = document.getElementById('password-modal');
    if (modal) {
      modal.remove();
    }
    const main = document.querySelector('main');
    if (main) {
      main.style.display = 'block';
    }
    addResetPasswordButton();
    if (typeof window.onAccessGranted === 'function') {
      window.onAccessGranted();
    }
  } else if (errorMsg) {
    errorMsg.classList.remove('hidden');
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

export function goToHome() {
  window.location.href = '../index.html';
}

export function initPasswordProtection() {
  if (!checkAccess()) {
    const main = document.querySelector('main');
    if (main) {
      main.style.display = 'none';
    }
    showPasswordModal();
  } else {
    const main = document.querySelector('main');
    if (main) {
      main.style.display = 'block';
    }
  }
}

export function logout() {
  localStorage.removeItem(PASSWORD_KEY);
  window.location.reload();
}

export function addResetPasswordButton() {
  if (document.querySelector('.reset-password-btn')) return;

  const button = document.createElement('button');
  button.className = 'reset-password-btn';
  button.textContent = '🔓';
  button.title = 'Сбросить пароль';

  const hoverArea = document.createElement('div');
  hoverArea.className = 'reset-password-hover-area';

  const showButton = () => button.classList.add('visible');
  const hideButton = () => button.classList.remove('visible');

  hoverArea.addEventListener('mouseenter', showButton);
  hoverArea.addEventListener('mouseleave', hideButton);
  button.addEventListener('mouseenter', showButton);
  button.addEventListener('mouseleave', hideButton);

  button.addEventListener('click', logout);

  document.body.appendChild(hoverArea);
  document.body.appendChild(button);
}

export function isBookLocked(bookKey) {
  const meta = BOOKS[bookKey];
  return Boolean(meta && meta.locked);
}

