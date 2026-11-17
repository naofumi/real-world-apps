import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./lib/auth.js";
import { LoginPage, RegisterPage } from "./features/auth/auth-pages.js";
import { SettingsPage } from "./features/auth/settings-page.js";
import { ArticlePage } from "./features/articles/article-page.js";
import { EditorPage } from "./features/articles/editor-page.js";
import { HomePage } from "./features/feed/home-page.js";
import { ProfilePage } from "./features/profiles/profile-page.js";
import { Layout } from "./features/shell/layout.js";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="tag/:tag" element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="settings"
          element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="editor"
          element={
            <RequireAuth>
              <EditorPage />
            </RequireAuth>
          }
        />
        <Route
          path="editor/:slug"
          element={
            <RequireAuth>
              <EditorPage />
            </RequireAuth>
          }
        />
        <Route path="article/:slug" element={<ArticlePage />} />
        <Route path="profile/:username" element={<ProfilePage />} />
        <Route path="profile/:username/favorites" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
