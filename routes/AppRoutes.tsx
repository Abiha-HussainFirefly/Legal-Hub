import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AccountSettingsPage from '../pages/account/AccountSettingsPage';
import LoginPage from '../pages/auth/LoginPage';
import CasesPage from '../pages/cases/CasesPage';
import MyCasesDashboard from '../pages/cases/MyCasesDashboard';
import DiscussionsPage from '../pages/discussions/DiscussionsPage';
import NotificationsPanel from '../pages/notifications/NotificationsPanel';
import MyProfilePage from '../pages/profile/MyProfilePage';
import PublicProfilePage from '../pages/profile/PublicProfilePage';
import SavedWorkspacePage from '../pages/saved/SavedWorkspacePage';
import MyTopicsPage from '../pages/topics/MyTopicsPage';
import { PERMISSIONS } from '../utils/permissions';

const ROUTES = Object.freeze({
  LOGIN: '/login',
  REGISTER: '/register',
  DISCUSSIONS: '/discussions',
  CASES: '/cases',
  MY_CASES: '/my-cases',
  PROFILE: '/profile',
  PUBLIC_PROFILE: '/profile/:id',
  ACCOUNT: '/account',
  SAVED: '/saved',
  MY_TOPICS: '/my-topics',
  NOTIFICATIONS: '/notifications',
  UNAUTHORIZED: '/unauthorized',
});

const RegisterPage = () => (
  <div className="mx-auto max-w-md px-6 py-12">
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Register</h1>
      <p className="mt-2 text-sm text-slate-600">
        Lawyer registration flow can be mounted here.
      </p>
    </div>
  </div>
);

const UnauthorizedPage = () => (
  <div className="mx-auto max-w-md px-6 py-12">
    <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Unauthorized</h1>
      <p className="mt-2 text-sm text-slate-600">
        You do not have permission to access this lawyer workspace screen.
      </p>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.DISCUSSIONS} replace />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

        <Route
          path={ROUTES.DISCUSSIONS}
          element={(
            <ProtectedRoute permission={PERMISSIONS.DISCUSSIONS_VIEW}>
              <DiscussionsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path={ROUTES.CASES}
          element={(
            <ProtectedRoute permission={PERMISSIONS.CASES_VIEW}>
              <CasesPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path={ROUTES.MY_CASES}
          element={(
            <ProtectedRoute permission={PERMISSIONS.CASES_VIEW_OWN_DASHBOARD}>
              <MyCasesDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path={ROUTES.PROFILE}
          element={(
            <ProtectedRoute permission={PERMISSIONS.PROFILE_VIEW_SELF}>
              <MyProfilePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path={ROUTES.PUBLIC_PROFILE}
          element={(
            <ProtectedRoute permission={PERMISSIONS.PROFILE_PUBLIC_VIEW}>
              <PublicProfilePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path={ROUTES.ACCOUNT}
          element={(
            <ProtectedRoute permission={PERMISSIONS.ACCOUNT_VIEW_SELF}>
              <AccountSettingsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path={ROUTES.SAVED}
          element={(
            <ProtectedRoute permission={PERMISSIONS.SAVED_VIEW_SELF}>
              <SavedWorkspacePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path={ROUTES.MY_TOPICS}
          element={(
            <ProtectedRoute permission={PERMISSIONS.TOPICS_VIEW_SELF}>
              <MyTopicsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path={ROUTES.NOTIFICATIONS}
          element={(
            <ProtectedRoute permission={PERMISSIONS.NOTIFICATIONS_VIEW_SELF}>
              <NotificationsPanel />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
