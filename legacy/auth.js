// E'Magios Core - Firebase Authentication (Google)

// #region agent log
function agentAuthDebugLog(hypothesisId, location, message, data) {
  fetch('http://127.0.0.1:7505/ingest/6fe2bbd0-0b0b-4dd2-93c9-a900d2b0a38b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'787a5f'},body:JSON.stringify({sessionId:'787a5f',runId:'auth-popup',hypothesisId:hypothesisId,location:location,message:message,data:data,timestamp:Date.now()})}).catch(function () {});
}
// #endregion

/**
 * Инициализация Firebase приложения.
 * Ожидает, что глобально определён объект window.FIREBASE_CONFIG.
 */
function initFirebaseApp() {
  // #region agent log
  agentAuthDebugLog('H3', 'auth.js:14', 'Firebase init requested', {
    hasFirebase: typeof firebase !== 'undefined',
    hasConfig: Boolean(window.FIREBASE_CONFIG),
    origin: window.location.origin,
    protocol: window.location.protocol,
    host: window.location.host
  });
  // #endregion

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
    // #region agent log
    agentAuthDebugLog('H3', 'auth.js:34', 'Firebase app reused', {
      appCount: firebase.apps.length,
      authDomain: window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.authDomain
    });
    // #endregion
    return firebase.apps[0];
  }

  try {
    const app = firebase.initializeApp(window.FIREBASE_CONFIG);
    // #region agent log
    agentAuthDebugLog('H3', 'auth.js:43', 'Firebase app initialized', {
      appCount: firebase.apps ? firebase.apps.length : null,
      authDomain: window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.authDomain
    });
    // #endregion
    return app;
  } catch (e) {
    // #region agent log
    agentAuthDebugLog('H3', 'auth.js:51', 'Firebase app initialization failed', {
      code: e && e.code,
      message: e && e.message
    });
    // #endregion
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
      container.innerHTML = '';
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
    // #region agent log
    agentAuthDebugLog('H4', 'auth.js:183', 'Auth state changed', {
      page: page,
      hasUser: Boolean(user),
      uidPresent: Boolean(user && user.uid),
      providerCount: user && user.providerData ? user.providerData.length : 0
    });
    // #endregion

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


