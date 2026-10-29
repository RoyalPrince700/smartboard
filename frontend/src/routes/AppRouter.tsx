import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { BoardPage } from '../pages/BoardPage';
import { BoardListPage } from '../pages/BoardListPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { SocialPage } from '../pages/SocialPage';
import { SocialPostPage } from '../pages/SocialPostPage';
import { SplitWhiteboardPage } from '../pages/SplitWhiteboardPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminRoute } from '../components/auth/AdminRoute';
import { AdminLayout } from '../components/layout/AdminLayout';

function LegacySocialPostRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/admin/social/${id}` : '/admin/social'} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoardListPage />} />
        <Route path="/boards" element={<BoardListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/board/:id" element={<BoardPage />} />
        <Route path="/whiteboard" element={<SplitWhiteboardPage />} />

        <Route path="/social" element={<Navigate to="/admin/social" replace />} />
        <Route path="/social/:id" element={<LegacySocialPostRedirect />} />

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="social" element={<SocialPage />} />
            <Route path="social/:id" element={<SocialPostPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
