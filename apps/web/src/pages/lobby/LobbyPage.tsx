import styles from './LobbyPage.module.css';

export function LobbyPage() {
  return (
    <div className={styles.page}>
      <h1>Лобби</h1>
      <section className={styles.panel}>
        <h2>Перенос лобби в React</h2>
        <p className={styles.hint}>
          Раздел добавлен в новую навигацию. Онлайн-комнаты, чат и холст будут переноситься
          отдельным шагом, чтобы не смешивать Firebase-синхронизацию лобби с базовым shell.
        </p>
      </section>
    </div>
  );
}

