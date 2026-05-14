import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/widgets/layout/Layout';
import { HomePage } from '@/pages/home/HomePage';
import { NewsPage } from '@/pages/news/NewsPage';
import { DbPage } from '@/pages/db/DbPage';
import { CharacterEditorPage } from '@/pages/character-editor/CharacterEditorPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { BookPage } from '@/pages/book/BookPage';

export function App() {
  return (
    <HashRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="db" element={<DbPage />} />
          <Route path="character-editor" element={<CharacterEditorPage />} />
          <Route path=":bookKey/:chapterId" element={<BookPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
