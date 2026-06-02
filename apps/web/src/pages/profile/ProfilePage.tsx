import { useEffect, useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/shared/firebase/client';
import { useAuth } from '@/features/auth';
import { Button } from '@/shared/ui/Button';
import styles from './ProfilePage.module.css';

interface ProfileData {
  displayName: string;
  discordWebhookUrl: string;
  discordDisplayName: string;
  discordColor: string;
}

const EMPTY_PROFILE: ProfileData = {
  displayName: '',
  discordWebhookUrl: '',
  discordDisplayName: '',
  discordColor: '#10B981',
};

export function ProfilePage() {
  const { user, loading, signIn: contextSignIn, signOutUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (!user) {
      setProfile(EMPTY_PROFILE);
      return;
    }

    const ref = doc(db, 'users', user.uid);
    getDoc(ref)
      .then((snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : {};
        setProfile({
          displayName: String(data.displayName ?? user.displayName ?? ''),
          discordWebhookUrl: String(data.discordWebhookUrl ?? ''),
          discordDisplayName: String(data.discordDisplayName ?? ''),
          discordColor: String(data.discordColor ?? '#10B981'),
        });
      })
      .catch(() => {
        setProfile({
          ...EMPTY_PROFILE,
          displayName: user.displayName ?? '',
        });
        setError('Не удалось загрузить профиль. Можно продолжить с данными Google.');
      });
  }, [user]);

  async function signIn() {
    setError('');
    setStatus('');
    try {
      await contextSignIn();
    } catch (err) {
      const code = typeof err === 'object' && err && 'code' in err ? String(err.code) : 'unknown';
      setError(`Ошибка входа Google: ${code}`);
    }
  }

  async function save() {
    if (!user) return;
    if (
      profile.discordWebhookUrl &&
      !/^https:\/\/discord\.com\/api\/webhooks\//.test(profile.discordWebhookUrl)
    ) {
      setError('Похоже, это не ссылка вебхука Discord. Проверьте URL.');
      return;
    }
    if (profile.discordColor && !/^#?[0-9a-fA-F]{6}$/.test(profile.discordColor)) {
      setError('Цвет должен быть в формате HEX, например #10b981.');
      return;
    }

    setSaving(true);
    setError('');
    setStatus('Сохранение профиля...');
    try {
      const normalizedColor = profile.discordColor.startsWith('#')
        ? profile.discordColor
        : `#${profile.discordColor}`;
      const next = { ...profile, discordColor: normalizedColor };
      await setDoc(
        doc(db, 'users', user.uid),
        {
          displayName: next.displayName || null,
          discordWebhookUrl: next.discordWebhookUrl || null,
          discordDisplayName: next.discordDisplayName || null,
          discordColor: next.discordColor || null,
        },
        { merge: true },
      );
      await updateProfile(user, { displayName: next.displayName || null });
      setProfile(next);
      setStatus('Профиль сохранён');
    } catch {
      setError('Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <h1>Профиль</h1>
      <div className={styles.authStatus}>
        {loading
          ? 'Проверка статуса авторизации...'
          : user
            ? `Вы вошли как ${user.displayName ?? user.email ?? 'пользователь'}`
            : 'Вы не вошли в аккаунт. Используйте форму ниже, чтобы войти через Google.'}
      </div>

      {!user && !loading && (
        <section className={styles.section}>
          <h2>Требуется авторизация</h2>
          <p className={styles.hint}>
            Для доступа ко всем возможностям сайта, включая сохранение персонажей, историю бросков и
            интеграцию с Discord, требуется вход через Google.
          </p>
          <Button variant="primary" onClick={signIn}>
            Войти через Google
          </Button>
        </section>
      )}

      {user && (
        <>
          <section className={styles.section}>
            <div className={styles.profileHeader}>
              <div className={styles.avatar}>
                {user.photoURL ? <img src={user.photoURL} alt="Avatar" /> : 'Нет аватара'}
              </div>
              <div>
                <h2>{profile.displayName || user.displayName || 'Без имени'}</h2>
                <p className={styles.hint}>{user.email}</p>
              </div>
            </div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="profile-name">Отображаемое имя</label>
                <input
                  id="profile-name"
                  value={profile.displayName}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, displayName: event.target.value }))
                  }
                  placeholder="Имя, которое будет видно в интерфейсе"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="profile-email">Email</label>
                <input id="profile-email" value={user.email ?? ''} readOnly />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Интеграция с Discord</h2>
            <p className={styles.hint}>
              Здесь вы можете настроить отправку ваших бросков кубов в Discord через вебхук.
              Настройки сохраняются для вашего аккаунта и используются на всех страницах.
            </p>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="discord-webhook-url">URL вебхука Discord</label>
                <input
                  id="discord-webhook-url"
                  value={profile.discordWebhookUrl}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, discordWebhookUrl: event.target.value }))
                  }
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="discord-display-name">Имя в Discord для бросков</label>
                <input
                  id="discord-display-name"
                  value={profile.discordDisplayName}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, discordDisplayName: event.target.value }))
                  }
                  placeholder="Например: Эльдриан, маг 5 уровня"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="discord-color">Цвет сообщений (HEX)</label>
                <input
                  id="discord-color"
                  value={profile.discordColor}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, discordColor: event.target.value }))
                  }
                  placeholder="#10b981"
                />
              </div>
            </div>
          </section>

          <div className={styles.actions}>
            <Button variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button variant="secondary" onClick={() => void signOutUser()}>
              Выйти из аккаунта
            </Button>
            {status && <span className={styles.status}>{status}</span>}
            {error && <span className={styles.error}>{error}</span>}
          </div>
        </>
      )}

      {!user && error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
