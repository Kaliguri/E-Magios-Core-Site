// E'Magios Core — Lobby page
// Функции: список лобби, создание/присоединение, чат с /roll, простой совместный холст.

const IS_ROOM_PAGE = document.body.dataset.page === 'lobby-room';
const MAX_CANVAS_BOARDS = 4;

const state = {
  user: null,
  db: null,
  lobbiesUnsub: null,
  lobbyList: [],
  initialLobbyListLoaded: false,
  lobbyId: null,
  lobbyData: null,
  isOwner: false,
  boards: [],
  currentBoardId: null,
  boardsUnsub: null,
  membersUnsub: null,
  messagesUnsub: null,
  newMessagesUnsub: null,
  strokesUnsub: null,
  canvasMetaUnsub: null,
  messages: [],
  messageMap: new Map(),
  oldestMessageDoc: null,
  newestMessageDoc: null,
  loadingOlder: false,
  reachedHistoryEnd: false,
  chatPageSize: 100,
  strokes: [],
  canvasMeta: {},
  canvas: null,
  ctx: null,
  drawing: false,
  currentStroke: null,
  resizeObserver: null,
  redoStack: [],
  canvasHotkeysHandler: null,
  boardEnsureInProgress: false,
  boardData: {},
  strokesUnsubMap: {},
  canvasMetaUnsubMap: {},
  pendingBoardLoads: new Set(),
  allBoardsLoaded: false
};

const els = {};

function showLobbyLoader(message) {
  if (typeof showPageLoader === 'function') {
    showPageLoader(message || 'Загружаем...');
    return;
  }
  const loader = qs('page-loader');
  if (loader) {
    loader.classList.remove('hidden');
  }
  const label = qs('page-loader-message');
  if (label && message) {
    label.textContent = message;
  }
}

function hideLobbyLoader() {
  if (typeof hidePageLoader === 'function') {
    hidePageLoader();
    return;
  }
  const loader = qs('page-loader');
  if (loader) {
    loader.classList.add('hidden');
  }
}

function qs(id) {
  return document.getElementById(id);
}

function showCanvasLoader(message) {
  const el = qs('canvas-loader');
  if (!el) return;
  const msg = el.querySelector('.canvas-loader-message');
  if (msg && message) msg.textContent = message;
  el.classList.remove('hidden');
}

function hideCanvasLoader() {
  const el = qs('canvas-loader');
  if (!el) return;
  el.classList.add('hidden');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseInviteInput(raw) {
  const text = (raw || '').trim();
  if (!text) return { code: null, room: null };

  // Если это полная ссылка
  try {
    const url = new URL(text);
    const room = url.searchParams.get('room');
    const invite = url.searchParams.get('invite');
    return { code: invite || null, room: room || null };
  } catch (e) {
    // Не ссылка, возможно просто код
    const isCode = /^[A-Za-z0-9_-]{4,}$/;
    if (isCode.test(text)) {
      return { code: text, room: null };
    }
    return { code: null, room: null };
  }
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function setLoading(el, isLoading, label = 'Обработка...') {
  if (!el) return;
  if (isLoading) {
    el.dataset.prevText = el.textContent;
    el.textContent = label;
    el.setAttribute('disabled', 'disabled');
  } else {
    if (el.dataset.prevText) {
      el.textContent = el.dataset.prevText;
      delete el.dataset.prevText;
    }
    el.removeAttribute('disabled');
  }
}

function formatDateTime(value) {
  if (!value) return '—';
  const ts = typeof value.toMillis === 'function' ? value.toMillis() : value;
  try {
    return new Date(ts).toLocaleString();
  } catch (e) {
    return '—';
  }
}

function openConfirmModal(options = {}) {
  const { title, message, confirmText = 'Удалить', cancelText = 'Отмена' } = options;
  return new Promise((resolve) => {
    const existing = document.getElementById('lobby-confirm-modal');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'lobby-confirm-modal';
    overlay.innerHTML =
      '<div class="modal">' +
      '<div class="modal-header"><h3 class="modal-title">' +
      escapeHtml(title || 'Подтверждение') +
      '</h3></div>' +
      '<div class="modal-body"><p>' +
      escapeHtml(message || 'Вы уверены?') +
      '</p></div>' +
      '<div class="modal-footer">' +
      '<button type="button" class="btn btn-secondary" id="lobby-confirm-cancel">' +
      escapeHtml(cancelText) +
      '</button>' +
      '<button type="button" class="btn btn-primary" id="lobby-confirm-accept">' +
      escapeHtml(confirmText) +
      '</button>' +
      '</div>' +
      '</div>';

    function cleanup(result) {
      document.body.classList.remove('modal-open');
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      resolve(result);
    }

    overlay.addEventListener('click', (evt) => {
      if (evt.target === overlay) {
        cleanup(false);
      }
    });

    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');

    const cancelBtn = document.getElementById('lobby-confirm-cancel');
    const acceptBtn = document.getElementById('lobby-confirm-accept');

    if (cancelBtn) cancelBtn.onclick = () => cleanup(false);
    if (acceptBtn) acceptBtn.onclick = () => cleanup(true);
  });
}

function showAuthGuard(show) {
  const guard = qs('lobby-auth-guard');
  const main = qs('lobby-main');
  if (guard) guard.classList.toggle('hidden', !show);
  if (main) main.classList.toggle('hidden', show);
}

function showRoomView(show) {
  const list = qs('lobby-list-view');
  const room = qs('lobby-room-view');
  if (list) list.classList.toggle('hidden', show);
  if (room) room.classList.toggle('hidden', !show);
  document.body.classList.toggle('hide-sidebar', show);
}

function renderLobbyList(lobbies) {
  const listEl = qs('lobby-list');
  const emptyEl = qs('lobby-list-empty');
  if (!listEl || !emptyEl) return;

  listEl.innerHTML = '';
  emptyEl.classList.toggle('hidden', lobbies.length > 0);

  lobbies.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'lobby-card';

    const lastVisitedLabel = item.lastVisitedAt ? formatDateTime(item.lastVisitedAt) : '—';
    const membersCount = Array.isArray(item.memberIds) ? item.memberIds.length : 0;

    const isOwner = item.ownerUid === (state.user && state.user.uid);
    const isMember =
      Array.isArray(item.memberIds) && state.user && item.memberIds.includes(state.user.uid);

    card.innerHTML = `
      <div class="lobby-card-main">
        <div>
          <div class="lobby-card-title">${escapeHtml(item.name || 'Без названия')}</div>
          <div class="lobby-card-meta text-muted small-text">
            Создатель: ${escapeHtml(item.ownerName || '—')} · Последний визит: ${lastVisitedLabel}
          </div>
        </div>
        <div class="lobby-card-tags">
          <span class="pill">Участников: ${membersCount}</span>
        </div>
      </div>
      <div class="lobby-card-actions">
        <button class="btn btn-primary lobby-open-btn" data-id="${item.id}" data-invite="${escapeHtml(
          item.inviteCode || ''
        )}">Открыть</button>
        ${
          isOwner
            ? '<button class="btn btn-secondary lobby-delete-btn" data-id="' +
              item.id +
              '" data-owner="' +
              escapeHtml(item.ownerUid || '') +
              '">Удалить</button>'
            : isMember
            ? '<button class="btn btn-secondary lobby-leave-btn" data-id="' +
              item.id +
              '">Покинуть</button>'
            : ''
        }
      </div>
    `;

    listEl.appendChild(card);
  });

  listEl.querySelectorAll('.lobby-open-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const invite = btn.getAttribute('data-invite') || null;
      goToRoom(id, invite);
    });
  });

  listEl.querySelectorAll('.lobby-delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const ownerUid = btn.getAttribute('data-owner');
      if (id) {
        deleteLobby(id, ownerUid, btn);
      }
    });
  });

  listEl.querySelectorAll('.lobby-leave-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (id) {
        await leaveLobbyForever(id);
        await loadLobbies(); // refresh list after leaving
      }
    });
  });
}

function initAuth() {
  showLobbyLoader('Проверяем авторизацию...');
  const app = typeof initFirebaseApp === 'function' ? initFirebaseApp() : null;
  if (!app || typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
    console.error('Firebase не инициализирован. Проверьте подключение SDK.');
    qs('lobby-auth-guard').innerHTML =
      '<h2>Онлайн-режим недоступен</h2><p class="text-muted">Проверьте подключение Firebase.</p>';
    hideLobbyLoader();
    return;
  }

  state.db = firebase.firestore();
  const auth = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();

  const loginBtn = qs('lobby-google-login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      auth.signInWithPopup(provider).catch((err) => console.error(err));
    });
  }

  auth.onAuthStateChanged(async (user) => {
    state.user = user;

    if (!user) {
      showAuthGuard(true);
      teardownActiveLobby();
      hideLobbyLoader();
      return;
    }

    showAuthGuard(false);
    state.initialLobbyListLoaded = false;
    if (!IS_ROOM_PAGE) {
      showLobbyLoader('Загружаем список лобби...');
      watchUserLobbies(hideLobbyLoader);
      const urlRoom = getQueryParam('room');
      const urlInvite = getQueryParam('invite');
      if (urlRoom || urlInvite) {
        goToRoom(urlRoom, urlInvite);
      }
    } else {
      document.body.classList.add('hide-sidebar');
      const urlRoom = getQueryParam('room');
      const urlInvite = getQueryParam('invite');
      showLobbyLoader('Подключаемся к комнате...');
      if (urlRoom) {
        openLobbyById(urlRoom);
      } else if (urlInvite) {
        joinByInviteCode(urlInvite);
      } else {
        const status = qs('lobby-room-subtitle');
        if (status) status.textContent = 'Укажите room или invite в ссылке.';
        hideLobbyLoader();
      }
    }
  });
}

function watchUserLobbies(onLoaded) {
  if (!state.db || !state.user) return;
  state.initialLobbyListLoaded = false;
  if (state.lobbiesUnsub) {
    state.lobbiesUnsub();
    state.lobbiesUnsub = null;
  }

  const ref = state.db.collection('lobbies');
  state.lobbiesUnsub = ref.where('memberIds', 'array-contains', state.user.uid).onSnapshot(
    (snap) => {
      (async () => {
        const entries = [];
        snap.forEach((doc) => {
          const data = doc.data() || {};
          if (data.deleted) return;
          entries.push({
            docId: doc.id,
            lobby: {
              id: doc.id,
              name: data.name || 'Лобби',
              ownerUid: data.ownerUid || null,
              ownerName: data.ownerName || '',
              memberIds: data.memberIds || [],
              inviteCode: data.inviteCode || '',
              createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : null
            }
          });
        });

        const metas = await Promise.all(
          entries.map((entry) => loadMemberMeta(entry.docId).catch(() => ({ lastVisitedAt: null })))
        );

        const list = entries.map((entry, idx) => ({
          ...entry.lobby,
          lastVisitedAt: metas[idx] ? metas[idx].lastVisitedAt : null
        }));

        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        state.lobbyList = list;
        renderLobbyList(list);
        if (!state.initialLobbyListLoaded) {
          state.initialLobbyListLoaded = true;
          if (typeof onLoaded === 'function') {
            onLoaded();
          }
        }
      })().catch((err) => {
        console.error('Failed to process lobbies:', err);
        if (!state.initialLobbyListLoaded) {
          state.initialLobbyListLoaded = true;
          if (typeof onLoaded === 'function') {
            onLoaded();
          }
        }
      });
    },
    (err) => {
      console.error('Failed to load lobbies:', err);
      if (!state.initialLobbyListLoaded) {
        state.initialLobbyListLoaded = true;
        if (typeof onLoaded === 'function') {
          onLoaded();
        }
      }
    }
  );
}

async function loadMemberMeta(lobbyId) {
  if (!state.db || !state.user) return { lastVisitedAt: null };
  try {
    const snap = await state.db
      .collection('lobbies')
      .doc(lobbyId)
      .collection('members')
      .doc(state.user.uid)
      .get();
    const data = snap.exists ? snap.data() || {} : {};
    const lastVisitedAt =
      data.lastVisitedAt && typeof data.lastVisitedAt.toMillis === 'function'
        ? data.lastVisitedAt.toMillis()
        : data.lastVisitedAt || null;
    return { lastVisitedAt };
  } catch (e) {
    console.error('Failed to load member meta:', e);
    return { lastVisitedAt: null };
  }
}

async function createLobby() {
  if (!state.db || !state.user) return;
  const nameInput = qs('lobby-name-input');
  const statusEl = qs('lobby-create-status');
  const btn = qs('lobby-create-btn');
  const name = (nameInput && nameInput.value.trim()) || 'Новое лобби';

  setLoading(btn, true, 'Создаём...');
  statusEl.textContent = '';

  try {
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const lobbyDoc = await state.db.collection('lobbies').add({
      name,
      ownerUid: state.user.uid,
      ownerName: state.user.displayName || state.user.email || 'Без имени',
      memberIds: [state.user.uid],
      inviteCode,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      deleted: false
    });

    await state.db
      .collection('lobbies')
      .doc(lobbyDoc.id)
      .collection('members')
      .doc(state.user.uid)
      .set({
        displayName: state.user.displayName || state.user.email || 'Игрок',
        lastVisitedAt: firebase.firestore.FieldValue.serverTimestamp(),
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

    statusEl.textContent = 'Создано. Открываем...';
    nameInput.value = '';
    statusEl.textContent = 'Создано. Скопируйте ссылку из списка или откройте позже.';
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Не удалось создать лобби. Попробуйте ещё раз.';
  } finally {
    setLoading(btn, false);
  }
}

async function joinByInviteInput() {
  const input = qs('lobby-join-input');
  const statusEl = qs('lobby-join-status');
  const btn = qs('lobby-join-btn');
  const parsed = parseInviteInput(input ? input.value : '');

  statusEl.textContent = '';
  if (!parsed.code && !parsed.room) {
    statusEl.textContent = 'Укажите ссылку или код приглашения.';
    return;
  }

  setLoading(btn, true, 'Ищем...');
  showLobbyLoader('Подключаемся к комнате...');

  try {
    if (parsed.room) {
      goToRoom(parsed.room, parsed.code);
      return;
    }
    await joinByInviteCode(parsed.code);
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Не удалось подключиться.';
    hideLobbyLoader();
  } finally {
    setLoading(btn, false);
  }
}

async function joinByInviteCode(code) {
  if (!state.db || !state.user) return;
  showLobbyLoader('Подключаемся к комнате...');
  const statusEl = qs('lobby-join-status');
  statusEl.textContent = '';

  const snap = await state.db
    .collection('lobbies')
    .where('inviteCode', '==', code)
    .limit(1)
    .get();

  if (snap.empty) {
    statusEl.textContent = 'Лобби с таким кодом не найдено.';
    hideLobbyLoader();
    return;
  }

  const doc = snap.docs[0];
  await openLobbyDoc(doc);
}

async function openLobbyById(id) {
  if (!state.db || !state.user || !id) return;
  try {
    const doc = await state.db.collection('lobbies').doc(id).get();
    if (!doc.exists) {
      const status = qs('lobby-join-status') || qs('lobby-room-subtitle');
      if (status) status.textContent = 'Лобби не найдено.';
      hideLobbyLoader();
      return;
    }
    if (!IS_ROOM_PAGE) {
      const data = doc.data() || {};
      goToRoom(doc.id, data.inviteCode || null);
    } else {
      await openLobbyDoc(doc);
    }
  } catch (err) {
    console.error(err);
    const statusEl = qs('lobby-join-status');
    if (statusEl) statusEl.textContent = 'Не удалось открыть лобби.';
    hideLobbyLoader();
  }
}

async function openLobbyDoc(doc) {
  try {
    const data = doc.data() || {};
    if (data.deleted) {
      const joinStatus = qs('lobby-join-status') || qs('lobby-room-subtitle');
      if (joinStatus) {
        joinStatus.textContent = 'Лобби удалено владельцем.';
      }
      hideLobbyLoader();
      return;
    }

    state.lobbyId = doc.id;
    state.lobbyData = data;
    state.isOwner = data.ownerUid === (state.user && state.user.uid);

    await ensureMembership(doc.id, data);
    await initRoomUI(doc.id, data);
    hideLobbyLoader();
  } catch (err) {
    console.error('Failed to open lobby doc:', err);
    const statusEl = qs('lobby-join-status') || qs('lobby-room-subtitle');
    if (statusEl) {
      statusEl.textContent = 'Не удалось открыть лобби.';
    }
    hideLobbyLoader();
  }
}

async function ensureMembership(lobbyId, lobbyData) {
  if (!state.db || !state.user) return;
  const lobbyRef = state.db.collection('lobbies').doc(lobbyId);
  const memberRef = lobbyRef.collection('members').doc(state.user.uid);

  const memberSnap = await memberRef.get();
  const wasMember = memberSnap.exists;

  await lobbyRef.update({
    memberIds: firebase.firestore.FieldValue.arrayUnion(state.user.uid)
  });

  await memberRef.set(
    {
      displayName: state.user.displayName || state.user.email || 'Игрок',
      lastVisitedAt: firebase.firestore.FieldValue.serverTimestamp(),
      joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  if (!wasMember) {
    await sendSystemMessage(lobbyId, `${state.user.displayName || 'Игрок'} присоединился.`);
  }
}

function teardownActiveLobby() {
  state.lobbyId = null;
  state.lobbyData = null;
  state.isOwner = false;
  showRoomView(false);

  [
    state.membersUnsub,
    state.messagesUnsub,
    state.newMessagesUnsub,
    state.boardsUnsub
  ].forEach((fn) => {
    if (fn) fn();
  });
  state.membersUnsub = null;
  state.messagesUnsub = null;
  state.newMessagesUnsub = null;
  state.boardsUnsub = null;
  Object.values(state.strokesUnsubMap || {}).forEach((fn) => fn && fn());
  Object.values(state.canvasMetaUnsubMap || {}).forEach((fn) => fn && fn());
  state.strokesUnsubMap = {};
  state.canvasMetaUnsubMap = {};

  state.messages = [];
  state.messageMap.clear();
  state.oldestMessageDoc = null;
  state.newestMessageDoc = null;
  state.reachedHistoryEnd = false;
  state.strokes = [];
  state.canvasMeta = {};
  state.boards = [];
  state.currentBoardId = null;
  state.boardData = {};
  state.pendingBoardLoads = new Set();
  state.allBoardsLoaded = false;

  if (state.ctx && state.canvas) {
    state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
  }
}

async function initRoomUI(lobbyId, data) {
  showRoomView(true);
  const titleEl = qs('lobby-room-title');
  const subtitleEl = qs('lobby-room-subtitle');
  const inviteInput = qs('lobby-invite-link');
  const ownerPill = qs('lobby-owner-pill');
  const membersPill = qs('lobby-members-pill');
  const deleteBtn = qs('lobby-delete-btn');

  if (titleEl) titleEl.textContent = data.name || 'Лобби';
  if (subtitleEl) {
    const created =
      data.createdAt && data.createdAt.toMillis ? new Date(data.createdAt.toMillis()).toLocaleString() : '—';
    subtitleEl.textContent = `Создатель: ${data.ownerName || '—'} · Создано: ${created}`;
  }

  const inviteUrl = buildInviteUrl(lobbyId, data.inviteCode);
  if (inviteInput) {
    inviteInput.value = inviteUrl;
  }
  if (ownerPill) {
    ownerPill.textContent = `Владелец: ${data.ownerName || '—'}`;
  }
  if (membersPill) {
    const count = Array.isArray(data.memberIds) ? data.memberIds.length : 1;
    membersPill.textContent = `Участников: ${count}`;
  }

  if (deleteBtn) {
    deleteBtn.classList.toggle('hidden', !state.isOwner);
  }

  bindRoomButtons();
  watchMembers(lobbyId);
  const chatReady = initChat(lobbyId);
  initCanvas(lobbyId);
  try {
    await chatReady;
  } catch (e) {
    // already logged inside initChat
  }
}

function bindRoomButtons() {
  const copyBtn = qs('lobby-copy-link');
  const inviteInput = qs('lobby-invite-link');
  if (copyBtn && inviteInput) {
    const copyLabelEl = copyBtn.querySelector('.label');
    const defaultCopyText = copyLabelEl ? copyLabelEl.textContent : copyBtn.textContent;
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(inviteInput.value);
        if (copyLabelEl) {
          copyLabelEl.textContent = 'Скопировано';
          setTimeout(() => (copyLabelEl.textContent = defaultCopyText), 1500);
        } else {
          copyBtn.textContent = 'Скопировано';
          setTimeout(() => (copyBtn.textContent = defaultCopyText || 'Копировать'), 1500);
        }
      } catch (e) {
        console.error(e);
      }
    };
  }

  const leaveBtn = qs('lobby-leave-btn');
  if (leaveBtn) {
    leaveBtn.onclick = () => leaveLobby(state.lobbyId);
  }

  const deleteBtn = qs('lobby-delete-btn');
  if (deleteBtn) {
    deleteBtn.onclick = () => deleteLobby(state.lobbyId, state.lobbyData && state.lobbyData.ownerUid, deleteBtn);
  }
}

function buildInviteUrl(lobbyId, code) {
  try {
    const { origin, pathname } = window.location;
    const base = pathname.includes('/') ? pathname.substring(0, pathname.lastIndexOf('/') + 1) : '/';
    const url = new URL(origin + base + 'lobby-room.html');
    url.searchParams.set('room', lobbyId);
    if (code) url.searchParams.set('invite', code);
    return url.toString();
  } catch (e) {
    return `lobby-room.html?room=${encodeURIComponent(lobbyId)}${code ? `&invite=${encodeURIComponent(code)}` : ''}`;
  }
}

function watchMembers(lobbyId) {
  if (!state.db) return;
  if (state.membersUnsub) state.membersUnsub();
  const membersEl = qs('lobby-members-pill');

  state.membersUnsub = state.db
    .collection('lobbies')
    .doc(lobbyId)
    .collection('members')
    .onSnapshot((snap) => {
      const members = [];
      snap.forEach((doc) => {
        members.push(doc.data().displayName || 'Игрок');
      });
      if (membersEl) {
        membersEl.textContent = `Участников: ${members.length}`;
      }
    });
}

async function leaveLobby(lobbyId) {
  // Теперь просто уходим на список лобби, не удаляя участника
  teardownActiveLobby();
  if (IS_ROOM_PAGE) {
    window.location.href = 'lobby.html';
  } else {
    showRoomView(false);
  }
}

async function leaveLobbyForever(lobbyId) {
  if (!lobbyId || !state.db || !state.user) return;
  try {
    const lobbyRef = state.db.collection('lobbies').doc(lobbyId);
    await lobbyRef.update({
      memberIds: firebase.firestore.FieldValue.arrayRemove(state.user.uid)
    });
    await lobbyRef.collection('members').doc(state.user.uid).delete().catch(() => {});
    await sendSystemMessage(lobbyId, `${state.user.displayName || 'Игрок'} покинул лобби.`);
  } catch (err) {
    console.error('Failed to leave lobby forever:', err);
  }
}

async function deleteLobby(lobbyId, ownerUid, triggerBtn) {
  if (!lobbyId || !state.db || !state.user) return;

  // В списке лобби state.isOwner может быть false, поэтому проверяем владельца
  const isOwner =
    state.isOwner ||
    (state.lobbyData && state.lobbyData.ownerUid === state.user.uid) ||
    ownerUid === state.user.uid;
  if (!isOwner) {
    console.warn('Удалять лобби может только владелец.');
    return;
  }

  const confirmDelete = await openConfirmModal({
    title: 'Удалить лобби?',
    message: 'Лобби и его содержимое будут помечены как удалённые. Продолжить?',
    confirmText: 'Удалить',
    cancelText: 'Отмена'
  });
  if (!confirmDelete) return;

  const btn = triggerBtn || qs('lobby-delete-btn');
  setLoading(btn, true, 'Удаляем...');
  try {
    await state.db.collection('lobbies').doc(lobbyId).set({ deleted: true }, { merge: true });
    await sendSystemMessage(lobbyId, 'Лобби помечено как удалённое владельцем.');
  } catch (err) {
    console.error('Failed to delete lobby:', err);
  } finally {
    setLoading(btn, false);
    teardownActiveLobby();
  }
}

async function sendSystemMessage(lobbyId, text) {
  if (!state.db) return;
  const messagesRef = state.db.collection('lobbies').doc(lobbyId).collection('messages');
  return messagesRef.add({
    type: 'system',
    text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    clientCreatedAt: Date.now()
  });
}

// ----- Chat -----

function initChat(lobbyId) {
  cleanupChat();
  const chatStatus = qs('chat-status');
  if (chatStatus) chatStatus.textContent = 'Загружаем...';

  return loadInitialMessages(lobbyId)
    .then(() => {
      bindChatForm(lobbyId);
      bindChatScroll(lobbyId);
      if (chatStatus) chatStatus.textContent = 'Онлайн';
      return true;
    })
    .catch((err) => {
      console.error(err);
      if (chatStatus) chatStatus.textContent = 'Ошибка загрузки';
      throw err;
    });
}

function cleanupChat() {
  if (state.messagesUnsub) state.messagesUnsub();
  if (state.newMessagesUnsub) state.newMessagesUnsub();
  state.messagesUnsub = null;
  state.newMessagesUnsub = null;
  state.messages = [];
  state.messageMap.clear();
  state.oldestMessageDoc = null;
  state.newestMessageDoc = null;
  state.reachedHistoryEnd = false;
  const list = qs('chat-list');
  if (list) list.innerHTML = '';
}

async function loadInitialMessages(lobbyId) {
  const messagesRef = state.db.collection('lobbies').doc(lobbyId).collection('messages');
  const snap = await messagesRef.orderBy('createdAt', 'desc').limit(state.chatPageSize).get();

  const docsDesc = snap.docs;
  if (docsDesc.length) {
    state.oldestMessageDoc = docsDesc[docsDesc.length - 1];
    state.newestMessageDoc = docsDesc[0];
    addMessages(docsDesc, { prepend: false, inputOrderDesc: true });
  }

  toggleChatEmpty();
  const chatLoading = qs('chat-loading');
  if (chatLoading) chatLoading.classList.add('hidden');

  // Реалтайм для новых сообщений
  const baseQuery = messagesRef.orderBy('createdAt', 'asc');
  const realtimeQuery = state.newestMessageDoc ? baseQuery.startAfter(state.newestMessageDoc) : baseQuery;
  state.newMessagesUnsub = realtimeQuery.onSnapshot((snapNew) => {
    const added = snapNew.docChanges().filter((c) => c.type === 'added').map((c) => c.doc);
    if (added.length) {
      state.newestMessageDoc = added[added.length - 1];
      addMessages(added, { prepend: false, inputOrderDesc: false, autoScroll: true });
    }
  });
}

async function loadOlderMessages(lobbyId) {
  if (state.loadingOlder || state.reachedHistoryEnd) return;
  if (!state.oldestMessageDoc) return;
  state.loadingOlder = true;
  const loader = qs('chat-older-loader');
  if (loader) loader.classList.remove('hidden');

  try {
    const messagesRef = state.db.collection('lobbies').doc(lobbyId).collection('messages');
    const snap = await messagesRef
      .orderBy('createdAt', 'desc')
      .startAfter(state.oldestMessageDoc)
      .limit(state.chatPageSize)
      .get();

    if (snap.empty) {
      state.reachedHistoryEnd = true;
    } else {
      const docsDesc = snap.docs;
      state.oldestMessageDoc = docsDesc[docsDesc.length - 1];
      const container = qs('lobby-chat-body');
      const prevHeight = container ? container.scrollHeight : 0;
      addMessages(docsDesc, { prepend: true, inputOrderDesc: true });
      if (container) {
        const newHeight = container.scrollHeight;
        container.scrollTop = newHeight - prevHeight + container.scrollTop;
      }
    }
  } catch (err) {
    console.error('Failed to load older messages:', err);
  } finally {
    state.loadingOlder = false;
    const loader = qs('chat-older-loader');
    if (loader) loader.classList.add('hidden');
  }
}

function addMessages(docs, { prepend = false, inputOrderDesc = false, autoScroll = false }) {
  const listEl = qs('chat-list');
  if (!listEl) return;

  const container = qs('lobby-chat-body');
  const nearBottom = container ? container.scrollHeight - container.scrollTop - container.clientHeight < 120 : false;

  const ordered = inputOrderDesc ? docs.slice().reverse() : docs;
  ordered.forEach((doc) => {
    if (state.messageMap.has(doc.id)) return;
    const data = doc.data() || {};
    const createdAt =
      data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : data.clientCreatedAt || Date.now();
    const item = {
      id: doc.id,
      type: data.type || 'chat',
      text: data.text || '',
      userUid: data.userUid || null,
      userName: data.userName || 'Игрок',
      rollTotal: data.rollTotal,
      rollExpression: data.rollExpression,
      rollParts: data.rollParts || [],
      createdAt
    };
    state.messageMap.set(doc.id, item);
    if (prepend) {
      state.messages.unshift(item);
    } else {
      state.messages.push(item);
    }
  });

  renderMessages();
  toggleChatEmpty();

  if ((autoScroll || nearBottom) && container) {
    container.scrollTop = container.scrollHeight;
  }
}

function renderMessages() {
  const listEl = qs('chat-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  state.messages
    .slice()
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .forEach((msg) => {
      const el = document.createElement('div');
      el.className = 'chat-message';
      if (msg.type === 'system') {
        el.classList.add('chat-message-system');
        el.innerHTML = `<div class="chat-system-text">${escapeHtml(msg.text)}</div>`;
      } else if (msg.type === 'roll') {
        const totalLabel =
          typeof msg.rollTotal === 'number'
            ? msg.rollTotal
            : msg.rollTotal === null
            ? '—'
            : escapeHtml(String(msg.rollTotal || ''));
        el.classList.add('chat-message-roll');
        el.innerHTML = `
          <div class="chat-message-header">
            <span class="chat-author">${escapeHtml(msg.userName || 'Игрок')}</span>
            <span class="chat-time">${formatTime(msg.createdAt)}</span>
          </div>
          <div class="chat-roll-body">
            <div class="chat-roll-expression">${escapeHtml(msg.rollExpression || '')}</div>
            <div class="chat-roll-total">= ${totalLabel}</div>
          </div>
          <div class="chat-roll-details">${formatRollDetails(msg.rollParts)}</div>
        `;
      } else {
        el.innerHTML = `
          <div class="chat-message-header">
            <span class="chat-author">${escapeHtml(msg.userName || 'Игрок')}</span>
            <span class="chat-time">${formatTime(msg.createdAt)}</span>
          </div>
          <div class="chat-text">${escapeHtml(msg.text)}</div>
        `;
      }
      listEl.appendChild(el);
    });
}

function formatRollDetails(parts) {
  if (!Array.isArray(parts) || !parts.length) return '';
  return parts
    .map((p) => {
      if (p.kind === 'dice') {
        const rolls = Array.isArray(p.rolls) ? p.rolls.join(' + ') : '';
        const base = p.baseSum != null ? p.baseSum : '';
        let line = `${p.count}d${p.sides}`;
        if (rolls) line += `: ${rolls}`;
        if (p.scaleOp && p.scale) line += ` ${p.scaleOp}${p.scale}`;
        if (base !== '') line += ` = ${p.segmentTotal != null ? p.segmentTotal : base}`;
        return escapeHtml(line);
      }
      if (p.kind === 'number') {
        return escapeHtml(`${p.sign < 0 ? '-' : '+'} ${p.value}`);
      }
      return '';
    })
    .filter(Boolean)
    .map((line) => `<div class="chat-roll-line">${line}</div>`)
    .join('');
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '—';
  }
}

function toggleChatEmpty() {
  const empty = qs('chat-empty');
  if (!empty) return;
  empty.classList.toggle('hidden', state.messages.length > 0);
}

function bindChatForm(lobbyId) {
  const form = qs('chat-form');
  const input = qs('chat-input');
  const sendBtn = qs('chat-send-btn');
  if (!form || !input) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    setLoading(sendBtn, true, 'Отправка');
    try {
      if (text.toLowerCase().startsWith('/roll')) {
        await sendRollMessage(lobbyId, text);
      } else {
        await sendChatMessage(lobbyId, text);
      }
      input.value = '';
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(sendBtn, false);
    }
  };
}

function bindChatScroll(lobbyId) {
  const container = qs('lobby-chat-body');
  if (!container) return;
  container.onscroll = () => {
    if (container.scrollTop < 80) {
      loadOlderMessages(lobbyId);
    }
  };
}

async function sendChatMessage(lobbyId, text) {
  if (!state.db || !state.user) return;
  const messagesRef = state.db.collection('lobbies').doc(lobbyId).collection('messages');
  return messagesRef.add({
    type: 'chat',
    text,
    userUid: state.user.uid,
    userName: state.user.displayName || state.user.email || 'Игрок',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    clientCreatedAt: Date.now()
  });
}

async function sendRollMessage(lobbyId, rawCommand) {
  if (!state.db || !state.user) return;
  if (typeof parseRollExpression !== 'function' || typeof rollDiceExpression !== 'function') {
    throw new Error('Модуль бросков не доступен.');
  }
  const parsed = parseRollExpression(rawCommand);
  const result = rollDiceExpression(parsed);
  const messagesRef = state.db.collection('lobbies').doc(lobbyId).collection('messages');
  return messagesRef.add({
    type: 'roll',
    rollTotal: result.total,
    rollExpression: result.expression,
    rollParts: result.parts,
    userUid: state.user.uid,
    userName: state.user.displayName || state.user.email || 'Игрок',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    clientCreatedAt: Date.now()
  });
}

// ----- Canvas -----

function initCanvas(lobbyId) {
  state.canvas = qs('battle-canvas');
  if (!state.canvas) return;
  state.ctx = state.canvas.getContext('2d');
  state.strokes = [];
  state.canvasMeta = {};
  state.boards = [];
  state.currentBoardId = null;
  state.redoStack = [];
  state.boardData = {};
  state.pendingBoardLoads = new Set();
  state.allBoardsLoaded = false;
  showCanvasLoader('Загружаем холсты...');
  if (!state.db) {
    hideCanvasLoader();
  }

  updateUndoRedoUI();
  attachCanvasHandlers(lobbyId);
  observeCanvasResize();
  initCanvasBoards(lobbyId);
  bindCanvasHotkeys(lobbyId);
}

function observeCanvasResize() {
  const wrapper = state.canvas ? state.canvas.parentElement : null;
  if (!wrapper || typeof ResizeObserver === 'undefined') return;
  if (state.resizeObserver) state.resizeObserver.disconnect();
  state.resizeObserver = new ResizeObserver(() => resizeCanvas());
  state.resizeObserver.observe(wrapper);
  resizeCanvas();
}

function resizeCanvas() {
  if (!state.canvas || !state.ctx) return;
  const wrapper = state.canvas.parentElement;
  const rect = wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  state.canvas.width = rect.width * dpr;
  state.canvas.height = rect.height * dpr;
  state.canvas.style.width = `${rect.width}px`;
  state.canvas.style.height = `${rect.height}px`;
  state.ctx.setTransform(1, 0, 0, 1, 0, 0);
  state.ctx.scale(dpr, dpr);
  redrawCanvas();
}

function attachCanvasHandlers(lobbyId) {
  const canvas = state.canvas;
  if (!canvas) return;

  const sizeInput = qs('brush-size');
  const colorInputs = Array.from(document.querySelectorAll('input[name="brush-color"]'));
  let brushColor = '#ffffff';
  let brushSize = 4;

  function updateBrush() {
    const selected = colorInputs.find((i) => i.checked);
    brushColor = selected ? selected.value : '#ffffff';
    brushSize = sizeInput ? parseInt(sizeInput.value, 10) || 4 : 4;
  }
  updateBrush();

  colorInputs.forEach((input) => input.addEventListener('change', updateBrush));
  if (sizeInput) sizeInput.addEventListener('input', updateBrush);

  function getPos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) / rect.width,
      y: (evt.clientY - rect.top) / rect.height
    };
  }

  canvas.addEventListener('mousedown', (evt) => {
    if (!state.user || !state.currentBoardId) return;
    updateBrush();
    state.drawing = true;
    const pos = getPos(evt);
    state.currentStroke = {
      color: brushColor,
      size: brushSize,
      points: [pos]
    };
    drawStroke(state.currentStroke, true);
  });

  canvas.addEventListener('mousemove', (evt) => {
    if (!state.drawing || !state.currentStroke) return;
    const pos = getPos(evt);
    state.currentStroke.points.push(pos);
    drawStrokeSegment(state.currentStroke);
  });

  const finishStroke = async () => {
    if (!state.drawing || !state.currentStroke) return;
    state.drawing = false;
    const stroke = state.currentStroke;
    state.currentStroke = null;
    state.strokes.push(stroke);
    state.redoStack = [];
    toggleCanvasHint();
    updateUndoRedoUI();
    await pushStroke(lobbyId, stroke);
  };

  canvas.addEventListener('mouseup', finishStroke);
  canvas.addEventListener('mouseleave', finishStroke);

  const clearBtn = qs('canvas-clear-btn');
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (!state.currentBoardId) return;
      clearCanvasRemote(lobbyId);
    };
  }

  const undoBtn = qs('canvas-undo-btn');
  if (undoBtn) {
    undoBtn.onclick = () => handleUndo(lobbyId);
  }

  const redoBtn = qs('canvas-redo-btn');
  if (redoBtn) {
    redoBtn.onclick = () => handleRedo(lobbyId);
  }

  updateUndoRedoUI();
}

function shouldIgnoreHotkeyTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  if (!tag) return false;
  const lowered = tag.toLowerCase();
  return lowered === 'input' || lowered === 'textarea' || target.isContentEditable;
}

function bindCanvasHotkeys(lobbyId) {
  if (state.canvasHotkeysHandler) {
    document.removeEventListener('keydown', state.canvasHotkeysHandler);
  }

  const handler = (evt) => {
    if (!(evt.ctrlKey || evt.metaKey)) return;
    if (shouldIgnoreHotkeyTarget(evt.target)) return;
    const key = (evt.key || '').toLowerCase();
    if (key === 'z') {
      evt.preventDefault();
      handleUndo(lobbyId);
    } else if (key === 'y' || (key === 'z' && evt.shiftKey)) {
      evt.preventDefault();
      handleRedo(lobbyId);
    }
  };

  state.canvasHotkeysHandler = handler;
  document.addEventListener('keydown', handler);
}

function drawStroke(stroke, isLive = false) {
  if (!state.ctx || !state.canvas) return;
  const ctx = state.ctx;
  const rect = state.canvas.getBoundingClientRect();
  ctx.save();
  ctx.strokeStyle = stroke.color || '#ffffff';
  ctx.lineWidth = stroke.size || 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();

  stroke.points.forEach((p, idx) => {
    const x = p.x * rect.width;
    const y = p.y * rect.height;
    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  ctx.restore();

  if (isLive) toggleCanvasHint();
}

function drawStrokeSegment(stroke) {
  if (!state.ctx || !state.canvas) return;
  const ctx = state.ctx;
  const rect = state.canvas.getBoundingClientRect();
  const pts = stroke.points;
  if (pts.length < 2) return;
  const lastTwo = pts.slice(-2);
  ctx.save();
  ctx.strokeStyle = stroke.color || '#ffffff';
  ctx.lineWidth = stroke.size || 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lastTwo[0].x * rect.width, lastTwo[0].y * rect.height);
  ctx.lineTo(lastTwo[1].x * rect.width, lastTwo[1].y * rect.height);
  ctx.stroke();
  ctx.restore();
}

async function handleUndo(lobbyId) {
  if (!state.currentBoardId) return;
  
  // Find last non-deleted action
  let actionToUndo = null;
  for (let i = state.strokes.length - 1; i >= 0; i--) {
    if (!state.strokes[i].deleted) {
      actionToUndo = state.strokes[i];
      break;
    }
  }

  if (!actionToUndo) return;

  actionToUndo.deleted = true;
  redrawCanvas();

  if (actionToUndo.id && !String(actionToUndo.id).startsWith('temp-')) {
    try {
      await getBoardsRef(lobbyId)
        .doc(state.currentBoardId)
        .collection('strokes')
        .doc(actionToUndo.id)
        .update({ deleted: true });
    } catch(e) { console.error(e); }
  }
}

async function handleRedo(lobbyId) {
  if (!state.currentBoardId) return;

  let lastActiveIdx = -1;
  for (let i = state.strokes.length - 1; i >= 0; i--) {
    if (!state.strokes[i].deleted) {
      lastActiveIdx = i;
      break;
    }
  }
  
  let actionToRedo = null;
  for (let i = lastActiveIdx + 1; i < state.strokes.length; i++) {
    if (state.strokes[i].deleted) {
      actionToRedo = state.strokes[i];
      break;
    }
  }

  if (!actionToRedo) return;

  actionToRedo.deleted = false;
  redrawCanvas();

  if (actionToRedo.id && !String(actionToRedo.id).startsWith('temp-')) {
     try {
      await getBoardsRef(lobbyId)
        .doc(state.currentBoardId)
        .collection('strokes')
        .doc(actionToRedo.id)
        .update({ deleted: false });
    } catch(e) { console.error(e); }
  }
}

async function pushStroke(lobbyId, stroke) {
  if (!state.db || !state.user || !state.currentBoardId) return;
  
  stroke.type = 'stroke';
  const boardData = getBoardData(state.currentBoardId);
  boardData.strokes = state.strokes;
  
  try {
    const docRef = await getBoardsRef(lobbyId)
      .doc(state.currentBoardId)
      .collection('strokes')
      .add({
        type: 'stroke',
        color: stroke.color,
        size: stroke.size,
        points: stroke.points,
        userUid: state.user.uid,
        userName: state.user.displayName || state.user.email || 'Игрок',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        clientCreatedAt: Date.now(),
        deleted: !!stroke.deleted
      });
    if (docRef && stroke) {
      stroke.id = docRef.id;
      // Обновляем ссылку в кеше, чтобы у уже загруженных данных был ID
      const idx = boardData.strokes.indexOf(stroke);
      if (idx >= 0) {
        boardData.strokes[idx] = stroke;
      }
    }
  } catch (err) {
    console.error('Failed to save stroke:', err);
  }
}

function getBoardsRef(lobbyId) {
  return state.db.collection('lobbies').doc(lobbyId).collection('boards');
}

function getBoardIndex(boardId) {
  if (!Array.isArray(state.boards) || !boardId) return -1;
  return state.boards.findIndex((board) => board.id === boardId);
}

function getBoardData(boardId) {
  if (!boardId) return null;
  if (!state.boardData[boardId]) {
    state.boardData[boardId] = { strokes: [], meta: {} };
  }
  return state.boardData[boardId];
}

function updateCanvasTitles() {
  const idx = getBoardIndex(state.currentBoardId);
  const suffix = idx >= 0 ? ` - №${idx + 1}` : '';
  const titleEl = qs('canvas-title');
  const areaEl = qs('canvas-area-label');

  if (titleEl) {
    titleEl.textContent = `Холст${suffix}`;
  }
  if (areaEl) {
    areaEl.textContent = 'Основная область';
  }
}

async function ensureBoardCount(lobbyId, boards) {
  if (!state.db) return;
  if (state.boardEnsureInProgress) return;

  const count = Array.isArray(boards) ? boards.length : 0;
  const missing = MAX_CANVAS_BOARDS - count;

  if (missing <= 0) return;

  state.boardEnsureInProgress = true;
  try {
    const tasks = [];
    for (let i = count + 1; i <= MAX_CANVAS_BOARDS; i += 1) {
      tasks.push(createBoard(lobbyId, `Холст ${i}`));
    }
    await Promise.all(tasks);
  } finally {
    state.boardEnsureInProgress = false;
  }
}

async function createBoard(lobbyId, name) {
  if (!state.db) return null;
  const nextIndex = (state.boards && state.boards.length ? state.boards.length : 0) + 1;
  const boardName = (name || '').trim() || `Холст ${nextIndex}`;
  try {
    const docRef = await getBoardsRef(lobbyId).add({
      name: boardName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      clearedAt: null
    });
    return docRef.id;
  } catch (err) {
    console.error('Failed to create board:', err);
    if (err.code === 'permission-denied') {
      alert('Ошибка доступа: Не удалось создать холст. Обновите правила безопасности Firestore.');
    }
    return null;
  }
}

async function renameBoard(lobbyId, boardId, currentName) {
  if (!state.db || !boardId) return;
  const newName = window.prompt('Название холста', currentName || '');
  if (!newName || !newName.trim()) return;
  try {
    await getBoardsRef(lobbyId).doc(boardId).set({ name: newName.trim() }, { merge: true });
  } catch (err) {
    console.error('Failed to rename board:', err);
  }
}

function renderCanvasBoards() {
  const tabsEl = qs('canvas-board-tabs');
  if (!tabsEl) return;
  tabsEl.innerHTML = '';

  const boardsToRender = Array.isArray(state.boards)
    ? state.boards.slice(0, MAX_CANVAS_BOARDS)
    : [];

  boardsToRender.forEach((board, idx) => {
    const btn = document.createElement('button');
    btn.className = `canvas-board-tab${board.id === state.currentBoardId ? ' active' : ''}`;
    btn.textContent = `${idx + 1}`;
    btn.title = board.name ? `${board.name} (№${idx + 1})` : `Холст №${idx + 1}`;
    btn.addEventListener('click', () => setActiveBoard(state.lobbyId, board.id));
    tabsEl.appendChild(btn);
  });

  updateCanvasTitles();
}

async function setActiveBoard(lobbyId, boardId) {
  if (!boardId) return;

  // Handle placeholder
  if (String(boardId).startsWith('placeholder-')) {
    const idx = parseInt(boardId.split('-')[1], 10);
    // Visual feedback
    const tabs = qs('canvas-board-tabs');
    if (tabs && tabs.children[idx]) {
      tabs.children[idx].textContent = '...';
      tabs.children[idx].disabled = true;
    }

    const newId = await createBoard(lobbyId, `Холст ${idx + 1}`);
    if (newId) {
      await setActiveBoard(lobbyId, newId);
    } else {
      // Restore if failed
      renderCanvasBoards();
    }
    return;
  }

  if (state.currentBoardId === boardId) {
    renderCanvasBoards();
    updateCanvasTitles();
    const cached = getBoardData(boardId);
    if (cached && cached.strokes) {
      state.strokes = cached.strokes;
      state.redoStack = [];
      redrawCanvas();
      hideCanvasLoader();
    }
    return;
  }

  state.currentBoardId = boardId;
  const cached = getBoardData(boardId);
  state.strokes = cached ? cached.strokes || [] : [];
  state.canvasMeta = {};
  state.redoStack = [];
  redrawCanvas();

  if (state.db) {
    ensureBoardWatcher(lobbyId, boardId);
  }
  if (!cached || (cached.strokes || []).length === 0) {
    showCanvasLoader('Загружаем холст...');
    if (state.allBoardsLoaded) {
      hideCanvasLoader();
    }
  } else if (state.allBoardsLoaded) {
    hideCanvasLoader();
  }
  renderCanvasBoards();
  updateCanvasTitles();
  updateUndoRedoUI();
}

function initCanvasBoards(lobbyId) {
  // 1. Сразу создаем 4 слота для кнопок, чтобы интерфейс не прыгал
  // Используем временные ID, пока не придут реальные из базы
  const placeholders = Array.from({ length: MAX_CANVAS_BOARDS }, (_, i) => ({
    id: `placeholder-${i}`,
    name: `Холст ${i + 1}`,
    isPlaceholder: true,
    index: i
  }));

  // Если список пуст (первый запуск), заполняем заглушками
  if (!state.boards || !state.boards.length) {
    state.boards = placeholders;
  }

  // Если активный холст не выбран, выбираем первый
  if (!state.currentBoardId) {
    state.currentBoardId = state.boards[0].id;
  }

  // Рендерим кнопки НЕМЕДЛЕННО
  renderCanvasBoards();
  updateCanvasTitles();

  // Если нет БД (оффлайн/ошибка), на этом всё
  if (!state.db) return;

  // 2. Подключаемся к базе данных
  if (state.boardsUnsub) state.boardsUnsub();

  state.boardsUnsub = getBoardsRef(lobbyId)
    .orderBy('createdAt', 'asc')
    .onSnapshot((snap) => {
      const realBoards = [];
      snap.forEach((doc) => {
        const d = doc.data() || {};
        realBoards.push({
          id: doc.id,
          name: d.name || 'Холст',
          clearedAt: d.clearedAt || null,
          createdAt: d.createdAt && d.createdAt.toMillis ? d.createdAt.toMillis() : 0,
          isPlaceholder: false
        });
      });

      // Если в базе меньше 4 холстов, создаем недостающие в фоне
      if (realBoards.length < MAX_CANVAS_BOARDS) {
        ensureBoardCount(lobbyId, realBoards);
      }

      const realIds = realBoards.map((b) => b.id);

      // Удаляем подписки на удалённые холсты
      Object.keys(state.strokesUnsubMap || {}).forEach((id) => {
        if (!realIds.includes(id)) {
          if (state.strokesUnsubMap[id]) state.strokesUnsubMap[id]();
          delete state.strokesUnsubMap[id];
          delete state.boardData[id];
          state.pendingBoardLoads.delete(id);
        }
      });

      // Запускаем загрузку данных для всех реальных холстов
      realBoards.forEach((board) => ensureBoardWatcher(lobbyId, board.id));

      if (state.pendingBoardLoads.size === 0 && realBoards.length > 0) {
        state.allBoardsLoaded = true;
        hideCanvasLoader();
      }

      // 3. Объединяем реальные данные с заглушками, чтобы всегда было 4 кнопки
      const finalBoards = [];
      for (let i = 0; i < MAX_CANVAS_BOARDS; i++) {
        if (i < realBoards.length) {
          finalBoards.push(realBoards[i]);
        } else {
          finalBoards.push({
            id: `placeholder-${i}`,
            name: `Холст ${i + 1}`,
            isPlaceholder: true,
            index: i
          });
        }
      }

      // Сохраняем текущий ID, чтобы проверить, не исчез ли он (был заглушкой)
      const prevId = state.currentBoardId;
      state.boards = finalBoards;

      // Проверяем, существует ли текущий выбранный холст в новом списке
      const currentStillExists = state.boards.find((b) => b.id === prevId);

      if (currentStillExists) {
        // Просто обновляем UI (названия могли измениться)
        renderCanvasBoards();
        updateCanvasTitles();
        // Если это реальный холст, данные штрихов обновятся через watchBoardData
      } else {
        // Если текущий ID исчез (например, placeholder-0 заменился на реальный ID из базы)
        // Пытаемся остаться на том же индексе
        if (String(prevId).startsWith('placeholder-')) {
          const idx = parseInt(prevId.split('-')[1], 10);
          const newBoard = state.boards[idx] || state.boards[0];
          setActiveBoard(lobbyId, newBoard.id);
        } else {
          // Если был реальный ID и исчез — переключаемся на первый
          setActiveBoard(lobbyId, state.boards[0].id);
        }
      }
    });
}

function ensureBoardWatcher(lobbyId, boardId) {
  if (!state.db || !boardId) return;
  if (String(boardId).startsWith('placeholder-') || String(boardId).startsWith('local-')) return;
  if (state.strokesUnsubMap[boardId]) return;

  const boardRef = getBoardsRef(lobbyId).doc(boardId);
  state.pendingBoardLoads.add(boardId);

  state.strokesUnsubMap[boardId] = boardRef
    .collection('strokes')
    .orderBy('createdAt', 'asc')
    .onSnapshot((snap) => {
      const actions = [];
      snap.forEach((doc) => {
        const data = doc.data() || {};
        actions.push({
          id: doc.id,
          type: data.type || 'stroke',
          color: data.color || '#ffffff',
          size: data.size || 4,
          points: data.points || [],
          createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : Date.now(),
          deleted: !!data.deleted
        });
      });

      const cache = getBoardData(boardId);
      cache.strokes = actions;

      // Если смотрим активный холст — обновляем сразу
      if (state.currentBoardId === boardId) {
        state.strokes = actions;
        state.redoStack = [];
        redrawCanvas();
      }

      state.pendingBoardLoads.delete(boardId);
      if (state.pendingBoardLoads.size === 0) {
        state.allBoardsLoaded = true;
        hideCanvasLoader();
      }
    });
}

function redrawCanvas() {
  if (!state.ctx || !state.canvas) return;
  const ctx = state.ctx;
  ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);

  state.strokes.forEach((action) => {
    if (action.deleted) return;

    if (action.type === 'clear') {
      ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    } else {
      drawStroke(action, false);
    }
  });

  toggleCanvasHint();
  updateUndoRedoUI();
}

async function clearCanvasRemote(lobbyId) {
  if (!state.db || !state.user || !state.currentBoardId) return;
  
  const action = {
    type: 'clear',
    userUid: state.user.uid,
    createdAt: Date.now(),
    id: 'temp-clear-' + Date.now(),
    deleted: false
  };
  state.strokes.push(action);
  const boardData = getBoardData(state.currentBoardId);
  boardData.strokes = state.strokes;
  redrawCanvas();

  try {
    await getBoardsRef(lobbyId)
      .doc(state.currentBoardId)
      .collection('strokes')
      .add({
        type: 'clear',
        userUid: state.user.uid,
        userName: state.user.displayName || 'Игрок',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        clientCreatedAt: Date.now(),
        deleted: false
      });
  } catch (err) {
    console.error('Failed to clear canvas:', err);
  }
}

function hasVisibleStrokes() {
  return state.strokes.some(s => !s.deleted);
}

function toggleCanvasHint() {
  const hint = qs('canvas-empty-hint');
  if (!hint) return;
  const hasContent = hasVisibleStrokes();
  const hasLive = state.currentStroke && state.currentStroke.points && state.currentStroke.points.length > 1;
  hint.classList.toggle('hidden', hasContent || hasLive);
}

function updateUndoRedoUI() {
  const undoBtn = qs('canvas-undo-btn');
  const redoBtn = qs('canvas-redo-btn');
  
  const hasUndo = state.strokes.some(s => !s.deleted) || 
    (state.currentStroke && state.currentStroke.points && state.currentStroke.points.length > 1);
  
  let lastActiveIdx = -1;
  for (let i = state.strokes.length - 1; i >= 0; i--) {
    if (!state.strokes[i].deleted) {
      lastActiveIdx = i;
      break;
    }
  }
  const hasRedo = state.strokes.slice(lastActiveIdx + 1).some(s => s.deleted);

  if (undoBtn) {
    undoBtn.disabled = !hasUndo;
    undoBtn.classList.toggle('disabled', !hasUndo);
  }
  if (redoBtn) {
    redoBtn.disabled = !hasRedo;
    redoBtn.classList.toggle('disabled', !hasRedo);
  }
}

// ----- Init bindings -----

function initControls() {
  if (!IS_ROOM_PAGE) {
    const createBtn = qs('lobby-create-btn');
    if (createBtn) createBtn.addEventListener('click', createLobby);
    const joinBtn = qs('lobby-join-btn');
    if (joinBtn) joinBtn.addEventListener('click', joinByInviteInput);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initControls();
});

function goToRoom(roomId, inviteCode) {
  if (!roomId) return;
  const url = buildInviteUrl(roomId, inviteCode);
  window.location.href = url;
}

