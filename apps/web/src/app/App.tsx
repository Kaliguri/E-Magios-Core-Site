import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/widgets/layout/Layout';
import { HomePage } from '@/pages/home/HomePage';
import { NewsPage } from '@/pages/news/NewsPage';
import { DbPage } from '@/pages/db/DbPage';
import { CharacterEditorPage } from '@/pages/character-editor/CharacterEditorPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { LobbyPage } from '@/pages/lobby/LobbyPage';
import { BookPage } from '@/pages/book/BookPage';

export function App() {
  // #region agent log
  fetch('http://127.0.0.1:7505/ingest/6fe2bbd0-0b0b-4dd2-93c9-a900d2b0a38b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'787a5f'},body:JSON.stringify({sessionId:'787a5f',runId:'initial',hypothesisId:'H1',location:'src/app/App.tsx:9',message:'App render and current route',data:{hash:window.location.hash,pathname:window.location.pathname,baseUrl:import.meta.env.BASE_URL},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return (
    <HashRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="lobby" element={<LobbyPage />} />
          <Route path="db" element={<DbPage />} />
          <Route path="character-editor" element={<CharacterEditorPage />} />
          <Route path=":bookKey/:chapterId" element={<BookPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
