// E'Magios Core - Firebase Authentication (Google)

/**
 * Инициализация Firebase приложения.
 * Ожидает, что глобально определён объект window.FIREBASE_CONFIG.
 */
function initFirebaseApp() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK is not loaded.');
    return null;
  }

  if (!window.FIREBASE_CONFIG) {
    console.warn('FIREBASE_CONFIG is not defined. Google Auth is disabled.');
    return null;
  }

  // Переиспользуем уже инициализированное приложение, если оно есть
  if (firebase.apps && firebase.apps.length > 0) {
    return firebase.apps[0];
  }

  try {
    const app = firebase.initializeApp(window.FIREBASE_CONFIG);
    return app;
  } catch (e) {
    console.error('Failed to initialize Firebase app:', e);
    return null;
  }
}

/**
 * Инициализация блока авторизации на странице редактора персонажей.
 */
function initCharacterEditorAuth() {
  const body = document.body;
  const page = body && body.getAttribute('data-page');
  const isProfilePage = page === 'profile';
  const isEditorPage = page === 'editor';
  const container = document.getElementById('auth-status');

  if (isProfilePage && !container) {
    return;
  }

  const app = initFirebaseApp();
  if (!app) {
    container.innerHTML = '<p class="text-muted">Онлайн-авторизация пока не настроена.</p>';
    if (typeof hidePageLoader === 'function') {
      hidePageLoader();
    }
    return;
  }

  const auth = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();
  const editorMain = isEditorPage ? document.querySelector('main') : null;

  function setEditorVisible(visible) {
    if (!editorMain) {
      return;
    }
    editorMain.style.display = visible ? 'block' : 'none';
  }

  function showAuthModal() {
    if (!isEditorPage) {
      return;
    }

    if (document.getElementById('auth-required-modal')) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'auth-required-modal';

    overlay.innerHTML =
      '<div class="modal">' +
      '<div class="modal-header">' +
      '<h3 class="modal-title">Авторизация</h3>' +
      '</div>' +
      '<div class="modal-body">' +
      '<p>Для использования редактора персонажей требуется вход через Google.</p>' +
      '</div>' +
      '<div class="modal-footer">' +
      '<button class="btn btn-secondary" id="auth-required-home">Вернуться на главную</button>' +
      '<button class="btn btn-primary" id="auth-required-signin">Открыть профиль</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    const btnHome = document.getElementById('auth-required-home');
    const btnSignin = document.getElementById('auth-required-signin');

    if (btnHome) {
      btnHome.addEventListener('click', function () {
        window.location.href = 'index.html';
      });
    }

    if (btnSignin) {
      btnSignin.addEventListener('click', function () {
        window.location.href = 'profile.html';
      });
    }
  }

  function hideAuthModal() {
    const existing = document.getElementById('auth-required-modal');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  function renderSignedOut() {
    if (!container) {
      return;
    }

    if (isProfilePage) {
      container.innerHTML =
        '<p class="text-muted">Вы не вошли в аккаунт. Используйте форму ниже, чтобы войти через Google.</p>';
      return;
    }

    container.innerHTML =
      '<p class="text-muted">Онлайн-режим доступен после входа на странице профиля.</p>';
  }

  function renderSignedIn(user) {
    const name = user.displayName || user.email || 'Без имени';

    if (isProfilePage) {
      container.innerHTML =
        '<p class="text-muted">Вы вошли как <strong>' + name + '</strong>.</p>';
      return;
    }

    if (!container) {
      return;
    }
  }

  if (isEditorPage) {
    setEditorVisible(false);
  }

  auth.onAuthStateChanged(function (user) {
    if (user) {
      hideAuthModal();
      if (isEditorPage) {
        setEditorVisible(true);
      }
      renderSignedIn(user);
    } else {
      if (isEditorPage) {
        setEditorVisible(false);
        showAuthModal();
      } else {
        hideAuthModal();
      }
      renderSignedOut();
    }

    if (typeof window.onAuthUserChanged === 'function') {
      window.onAuthUserChanged(user);
    }
  });
}

/**
 * Универсальный слушатель авторизации для небольших виджетов (например, бросков кубов).
 * Не рисует собственный UI, а просто прокидывает пользователя в переданный callback.
 */
function initDiceAuth(onUserChanged) {
  const app = initFirebaseApp();
  if (!app || typeof firebase === 'undefined' || !firebase.auth) {
    if (typeof onUserChanged === 'function') {
      onUserChanged(null);
    }
    return;
  }

  const auth = firebase.auth();

  auth.onAuthStateChanged(function (user) {
    if (typeof onUserChanged === 'function') {
      onUserChanged(user);
    }
  });
}


