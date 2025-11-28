// Профиль пользователя — E'Magios Core

let profileUser = null;
let profileDocData = null;

function getProfileDb() {
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
}

function loadUserProfile(user) {
  const db = getProfileDb();
  db.collection('users')
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

  if (!nameInput) {
    return;
  }

  const displayName = nameInput.value.trim();

  const db = getProfileDb();
  const docRef = db.collection('users').doc(profileUser.uid);

  const data = {
    displayName: displayName || null
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

function onAuthUserChanged(user) {
  profileUser = user;

  const content = document.getElementById('profile-content');
  if (!content) {
    return;
  }

  if (!profileUser) {
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    updateAvatarPreview('', '');
    return;
  }

  loadUserProfile(profileUser);
}

document.addEventListener('DOMContentLoaded', function () {
  const saveBtn = document.getElementById('profile-save-btn');
  const resetBtn = document.getElementById('profile-reset-btn');
  const logoutBtn = document.getElementById('profile-logout-btn');

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
        firebase
          .auth()
          .signOut()
          .catch(function (error) {
            console.error('Failed to sign out from profile page:', error);
          });
      }
    });
  }

  initCharacterEditorAuth();
});


