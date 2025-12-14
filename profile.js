// Профиль пользователя — E'Magios Core

let profileUser = null;
let profileDocData = null;

function showProfileLoader(message) {
  if (typeof showPageLoader === 'function') {
    showPageLoader(message || 'Загружаем профиль...');
  }
}

function hideProfileLoader() {
  if (typeof hidePageLoader === 'function') {
    hidePageLoader();
  }
}

function updateProfileLoaderMessage(message) {
  if (typeof setPageLoaderMessage === 'function' && message) {
    setPageLoaderMessage(message);
  }
}

function getProfileDb() {
  if (typeof firebase === 'undefined' || !firebase.firestore) {
    return null;
  }
  return firebase.firestore();
}

function setProfileStatus(message, isError) {
  const el = document.getElementById('profile-status');
  if (!el) {
    return;
  }
  el.textContent = message || '';
  if (!message) {
    return;
  }
  el.style.color = isError ? '#f87171' : 'var(--text-muted)';
}

function setDiscordStatus(message, isError) {
  const el = document.getElementById('discord-status');
  if (!el) {
    return;
  }
  el.textContent = message || '';
  if (!message) {
    return;
  }
  el.style.color = isError ? '#f87171' : 'var(--text-muted)';
}

function updateAvatarPreview(url, sourceText) {
  const previewContainer = document.getElementById('profile-avatar-preview');
  if (!previewContainer) {
    return;
  }

  const circle = previewContainer;

  circle.innerHTML = '';

  if (url) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Avatar';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    circle.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.className = 'text-muted';
    span.style.fontSize = '0.8rem';
    span.textContent = 'Нет аватара';
    circle.appendChild(span);
  }

  // profile-avatar-note больше нет в вёрстке, но оставляем поддержку на случай будущего использования
  const note = document.getElementById('profile-avatar-note');
  if (note) {
    note.textContent = sourceText || '';
  }
}

function fillProfileFormFromUser(user, docData) {
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const headerName = document.getElementById('profile-display-name');
  const headerEmail = document.getElementById('profile-display-email');
  const discordWebhookInput = document.getElementById('discord-webhook-url');
  const discordNameInput = document.getElementById('discord-display-name');
  const discordColorInput = document.getElementById('discord-color');
  const discordColorPreview = document.getElementById('discord-color-preview');
  const defaultDiscordColor = '#10B981';

  if (!nameInput || !emailInput || !headerName || !headerEmail) {
    return;
  }

  const displayName = (docData && docData.displayName) || user.displayName || '';
  const avatarUrl = user.photoURL || '';

  nameInput.value = displayName;
  emailInput.value = user.email || '';
  headerName.textContent = displayName || 'Без имени';
  headerEmail.textContent = user.email || '';

  const source = avatarUrl ? 'Аватар из Google аккаунта' : '';

  updateAvatarPreview(avatarUrl, source);

  const discordWebhookUrl = (docData && docData.discordWebhookUrl) || '';
  const discordDisplayName = (docData && docData.discordDisplayName) || '';
  const discordColor = (docData && docData.discordColor) || defaultDiscordColor;

  if (discordWebhookInput) {
    discordWebhookInput.value = discordWebhookUrl;
  }
  if (discordNameInput) {
    discordNameInput.value = discordDisplayName;
  }
  if (discordColorInput) {
    discordColorInput.value = discordColor;
  }

  if (discordColorPreview) {
    updateDiscordColorPreviewFromValue(discordColor || '');
  }
}

function loadUserProfile(user) {
  const db = getProfileDb();
  if (!db) {
    setProfileStatus('Онлайн-профиль недоступен. Проверьте подключение.', true);
    profileDocData = null;
    fillProfileFormFromUser(user, null);
    return Promise.resolve();
  }

  return db
    .collection('users')
    .doc(user.uid)
    .get()
    .then(function (snapshot) {
      if (snapshot.exists) {
        profileDocData = snapshot.data();
      } else {
        profileDocData = null;
      }
      fillProfileFormFromUser(user, profileDocData);
    })
    .catch(function (error) {
      console.error('Failed to load profile document:', error);
      profileDocData = null;
      fillProfileFormFromUser(user, null);
    });
}

function saveUserProfile() {
  if (!profileUser) {
    return;
  }

  const nameInput = document.getElementById('profile-name');
  const discordWebhookInput = document.getElementById('discord-webhook-url');
  const discordNameInput = document.getElementById('discord-display-name');
  const discordColorInput = document.getElementById('discord-color');

  if (!nameInput) {
    return;
  }

  const displayName = nameInput.value.trim();
  const discordWebhookUrl = discordWebhookInput ? discordWebhookInput.value.trim() : '';
  const discordDisplayName = discordNameInput ? discordNameInput.value.trim() : '';
  const discordColor = discordColorInput ? discordColorInput.value.trim() : '';

  if (discordWebhookUrl && !/^https:\/\/discord\.com\/api\/webhooks\//.test(discordWebhookUrl)) {
    setDiscordStatus('Похоже, это не ссылка вебхука Discord. Проверьте URL.', true);
    return;
  }

  if (discordColor && !/^#?[0-9a-fA-F]{6}$/.test(discordColor)) {
    setDiscordStatus('Цвет должен быть в формате HEX, например #10b981.', true);
    return;
  }

  const db = getProfileDb();
  const docRef = db.collection('users').doc(profileUser.uid);

  const data = {
    displayName: displayName || null,
    discordWebhookUrl: discordWebhookUrl || null,
    discordDisplayName: discordDisplayName || null,
    discordColor: discordColor || null
  };

  setProfileStatus('Сохранение профиля...', false);

  docRef
    .set(data, { merge: true })
    .then(function () {
      return profileUser.updateProfile({
        displayName: displayName || null
      });
    })
    .then(function () {
      profileDocData = data;
      const avatarUrl = profileUser.photoURL || '';
      const source = avatarUrl ? 'Аватар из Google аккаунта' : '';
      const headerName = document.getElementById('profile-display-name');
      if (headerName) {
        headerName.textContent = displayName || 'Без имени';
      }
      updateAvatarPreview(avatarUrl, source);
      setProfileStatus('Профиль сохранён', false);
      setDiscordStatus('', false);
    })
    .catch(function (error) {
      console.error('Failed to save profile:', error);
      setProfileStatus('Не удалось сохранить профиль', true);
    });
}

function resetUserProfile() {
  if (!profileUser) {
    return;
  }
  fillProfileFormFromUser(profileUser, profileDocData);
}

function sendDiscordTestMessage() {
  if (!profileUser) {
    setDiscordStatus('Сначала войдите через Google, чтобы настроить Discord.', true);
    return;
  }

  const webhookInput = document.getElementById('discord-webhook-url');
  const nameInput = document.getElementById('discord-display-name');
  const colorInput = document.getElementById('discord-color');

  if (!webhookInput) {
    return;
  }

  const webhookUrl = webhookInput.value.trim();
  const displayName = (nameInput && nameInput.value.trim()) || '';
  const colorHex = (colorInput && colorInput.value.trim()) || '';

  if (!webhookUrl) {
    setDiscordStatus('Укажите URL вебхука Discord, чтобы отправить тестовое сообщение.', true);
    return;
  }

  if (!/^https:\/\/discord\.com\/api\/webhooks\//.test(webhookUrl)) {
    setDiscordStatus('Похоже, это не ссылка вебхука Discord. Проверьте URL.', true);
    return;
  }

  let colorInt = null;
  if (colorHex) {
    const normalized = colorHex.startsWith('#') ? colorHex.slice(1) : colorHex;
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
      setDiscordStatus('Цвет должен быть в формате HEX, например #10b981.', true);
      return;
    }
    colorInt = parseInt(normalized, 16);
  }

  const username =
    displayName ||
    (profileDocData && profileDocData.displayName) ||
    profileUser.displayName ||
    'E\'Magios Dice';

  const payload = {
    username: username,
    embeds: [
      {
        title: 'Тестовое сообщение E\'Magios Core',
        description: 'Если вы видите это сообщение, интеграция Discord настроена корректно.',
        color: colorInt !== null ? colorInt : 0x10b981,
        footer: {
          text: 'Настройки Discord можно изменить на странице профиля.'
        }
      }
    ]
  };

  setDiscordStatus('Отправка тестового сообщения...', false);

  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      setDiscordStatus('Тестовое сообщение отправлено. Проверьте канал в Discord.', false);
    })
    .catch(function (error) {
      console.error('Failed to send Discord test message:', error);
      setDiscordStatus('Не удалось отправить сообщение в Discord.', true);
    });
}

function updateDiscordColorPreviewFromValue(raw) {
  const preview = document.getElementById('discord-color-preview');
  if (!preview) {
    return;
  }

  const trimmed = (raw || '').trim();
  if (!trimmed) {
    preview.style.backgroundColor = 'transparent';
    preview.classList.add('discord-color-preview-empty');
    return;
  }

  const hasHash = trimmed.startsWith('#');
  const hexBody = hasHash ? trimmed.slice(1) : trimmed;

  if (!/^[0-9a-fA-F]{6}$/.test(hexBody)) {
    preview.style.backgroundColor = 'transparent';
    preview.classList.add('discord-color-preview-empty');
    return;
  }

  preview.style.backgroundColor = '#' + hexBody.toUpperCase();
  preview.classList.remove('discord-color-preview-empty');
}

function updateDiscordColorPreviewFromInput() {
  const input = document.getElementById('discord-color');
  if (!input) {
    return;
  }
  updateDiscordColorPreviewFromValue(input.value);
}

function onAuthUserChanged(user) {
  profileUser = user;
  updateProfileLoaderMessage('Проверяем авторизацию...');
  showProfileLoader('Проверяем авторизацию...');

  const content = document.getElementById('profile-content');
  const guestSection = document.getElementById('profile-guest');
  const discordSection = document.getElementById('profile-discord-section');
  const actionsBar = document.querySelector('.profile-actions-bar');

  if (!profileUser) {
    if (guestSection) {
      guestSection.style.display = 'block';
    }
    if (content) {
      content.style.display = 'none';
    }
    if (discordSection) {
      discordSection.style.display = 'none';
    }
    if (actionsBar) {
      actionsBar.style.display = 'none';
    }

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    updateAvatarPreview('', '');
    hideProfileLoader();
    return;
  }

  updateProfileLoaderMessage('Загружаем профиль...');
  showProfileLoader('Загружаем профиль...');
  if (guestSection) {
    guestSection.style.display = 'none';
  }
  if (content) {
    content.style.display = 'block';
  }
  if (discordSection) {
    discordSection.style.display = 'block';
  }
  if (actionsBar) {
    actionsBar.style.display = 'block';
  }

  try {
    const loadPromise = loadUserProfile(profileUser);
    if (loadPromise && typeof loadPromise.finally === 'function') {
      loadPromise
        .catch(function (error) {
          console.error('Profile load failed:', error);
        })
        .finally(function () {
          hideProfileLoader();
        });
    } else {
      hideProfileLoader();
    }
  } catch (error) {
    console.error('Profile load failed (sync):', error);
    hideProfileLoader();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const saveBtn = document.getElementById('profile-save-btn');
  const resetBtn = document.getElementById('profile-reset-btn');
  const logoutBtn = document.getElementById('profile-logout-btn');
  const loginBtn = document.getElementById('profile-google-login-btn');
  const discordColorInput = document.getElementById('discord-color');
  const discordColorPalette = document.getElementById('discord-color-palette');
  const discordColorPopover = document.getElementById('discord-color-popover');
  const discordColorPreviewBtn = document.getElementById('discord-color-preview');
  const discordColorPickerInput = document.getElementById('discord-color-picker');
  const discordTestBtn = document.getElementById('discord-test-btn');

  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      saveUserProfile();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      resetUserProfile();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      if (firebase && firebase.auth) {
        const confirmed = window.confirm('Вы действительно хотите выйти из аккаунта Google?');
        if (!confirmed) {
          return;
        }
        firebase
          .auth()
          .signOut()
          .catch(function (error) {
            console.error('Failed to sign out from profile page:', error);
          });
      }
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', function () {
      if (firebase && firebase.auth && firebase.auth.GoogleAuthProvider) {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase
          .auth()
          .signInWithPopup(provider)
          .catch(function (error) {
            console.error('Google sign-in failed (profile page):', error);
          });
      }
    });
  }

  if (discordColorInput) {
    discordColorInput.addEventListener('input', function () {
      updateDiscordColorPreviewFromInput();
    });
  }

  if (discordColorPalette) {
    const swatches = discordColorPalette.querySelectorAll('.discord-color-swatch[data-color]');
    swatches.forEach(function (btn) {
      const swatchColor = btn.getAttribute('data-color');
      if (swatchColor && swatchColor !== 'custom') {
        btn.style.backgroundColor = swatchColor;
      }
      btn.addEventListener('click', function () {
        const color = btn.getAttribute('data-color') || '';
        if (color === 'custom') {
          openNativeColorPicker();
          return;
        }
        if (discordColorInput) {
          discordColorInput.value = color;
        }
        updateDiscordColorPreviewFromValue(color);
        setDiscordStatus('', false);
        if (discordColorPopover) {
          discordColorPopover.classList.add('hidden');
        }
      });
    });
  }

  function toggleColorPopover() {
    if (!discordColorPopover) return;
    const isHidden = discordColorPopover.classList.contains('hidden');
    if (isHidden) {
      discordColorPopover.classList.remove('hidden');
    } else {
      discordColorPopover.classList.add('hidden');
    }
  }

  if (discordColorPreviewBtn) {
    discordColorPreviewBtn.addEventListener('click', function () {
      toggleColorPopover();
    });
  }

  document.addEventListener('click', function (event) {
    if (!discordColorPopover || !discordColorPreviewBtn) return;
    const isInsidePopover = discordColorPopover.contains(event.target);
    const isPreview = discordColorPreviewBtn.contains(event.target);
    if (!isInsidePopover && !isPreview) {
      discordColorPopover.classList.add('hidden');
    }
  });

  function sanitizeHexColor(raw, fallback) {
    const trimmed = (raw || '').trim();
    const hexBody = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
    if (/^[0-9a-fA-F]{6}$/.test(hexBody)) {
      return '#' + hexBody.toUpperCase();
    }
    return fallback;
  }

  function openNativeColorPicker() {
    if (!discordColorPickerInput) return;
    // Проставляем текущее значение в picker, чтобы оно совпадало с вводом
    const normalized = sanitizeHexColor(discordColorInput ? discordColorInput.value : '', '#10B981');
    discordColorPickerInput.value = normalized;
    discordColorPickerInput.click();
  }

  if (discordColorPickerInput) {
    discordColorPickerInput.addEventListener('input', function () {
      const normalized = sanitizeHexColor(discordColorPickerInput.value, '#10B981');
      if (discordColorInput) {
        discordColorInput.value = normalized;
      }
      updateDiscordColorPreviewFromValue(normalized);
      setDiscordStatus('', false);
      if (discordColorPopover) {
        discordColorPopover.classList.add('hidden');
      }
    });
  }

  if (discordTestBtn) {
    discordTestBtn.addEventListener('click', function () {
      sendDiscordTestMessage();
    });
  }

  initCharacterEditorAuth();
});


