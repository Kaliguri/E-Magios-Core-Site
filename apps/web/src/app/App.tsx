import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/widgets/layout/Layout';
import { HomePage } from '@/pages/home/HomePage';
import { NewsPage } from '@/pages/news/NewsPage';
import { DbPage } from '@/pages/db/DbPage';
import { CharacterEditorPage } from '@/pages/character-editor/CharacterEditorPage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="db" element={<DbPage />} />
          <Route path="character-editor" element={<CharacterEditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
