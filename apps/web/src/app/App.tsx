import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Layout } from '@/widgets/layout/Layout';
import { HomePage } from '@/pages/home/HomePage';
import { NewsPage } from '@/pages/news/NewsPage';
import { DbPage } from '@/pages/db/DbPage';
import { CharacterEditorPage } from '@/pages/character-editor/CharacterEditorPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { BookPage } from '@/pages/book/BookPage';
import { OpsPage } from '@/pages/ops/OpsPage';
import { logTelemetry } from '@/shared/telemetry/clientTelemetry';

function TelemetryTracker() {
  const location = useLocation();
  const lastPathRef = useRef(location.pathname + location.search);
  const enteredAtRef = useRef(performance.now());

  useEffect(() => {
    const nextPath = location.pathname + location.search;
    const elapsedMs = Math.round(performance.now() - enteredAtRef.current);
    void logTelemetry({
      eventName: 'page_view',
      route: nextPath,
      payload: {
        fromRoute: lastPathRef.current,
        elapsedMs,
      },
    });
    lastPathRef.current = nextPath;
    enteredAtRef.current = performance.now();
  }, [location.pathname, location.search]);

  return null;
}

export function App() {
  return (
    <HashRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <TelemetryTracker />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="ops" element={<OpsPage />} />
          <Route path="db" element={<DbPage />} />
          <Route path="character-editor" element={<CharacterEditorPage />} />
          <Route path=":bookKey/:chapterId" element={<BookPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
