import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Spinner } from './components/ui/Spinner';

// Marketing
const HomePage = lazy(() => import('./pages/marketing/HomePage').then((m) => ({ default: m.HomePage })));
const AboutPage = lazy(() => import('./pages/marketing/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/marketing/ContactPage').then((m) => ({ default: m.ContactPage })));

// Auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })));
const ForgotPage = lazy(() => import('./pages/auth/ForgotPage').then((m) => ({ default: m.ForgotPage })));
const VerifyCodePage = lazy(() => import('./pages/auth/VerifyCodePage').then((m) => ({ default: m.VerifyCodePage })));
const SetNewPasswordPage = lazy(() => import('./pages/auth/SetNewPasswordPage').then((m) => ({ default: m.SetNewPasswordPage })));

// App
const DashboardPage = lazy(() => import('./pages/app/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const StartVerificationPage = lazy(() => import('./pages/app/StartVerificationPage').then((m) => ({ default: m.StartVerificationPage })));
const VerificationReportPage = lazy(() => import('./pages/app/VerificationReportPage').then((m) => ({ default: m.VerificationReportPage })));
const CertificatePage = lazy(() => import('./pages/app/CertificatePage').then((m) => ({ default: m.CertificatePage })));
const EscrowStatusPage = lazy(() => import('./pages/app/EscrowStatusPage').then((m) => ({ default: m.EscrowStatusPage })));
const MyVerificationsPage = lazy(() => import('./pages/app/MyVerificationsPage').then((m) => ({ default: m.MyVerificationsPage })));
const UploadChatPage = lazy(() => import('./pages/app/UploadChatPage').then((m) => ({ default: m.UploadChatPage })));
const NotificationPage = lazy(() => import('./pages/app/NotificationPage').then((m) => ({ default: m.NotificationPage })));
const ProfilePage = lazy(() => import('./pages/app/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/app/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AdminPage = lazy(() => import('./pages/app/AdminPage').then((m) => ({ default: m.AdminPage })));
const WalletPage = lazy(() => import('./pages/app/WalletPage').then((m) => ({ default: m.WalletPage })));
const MyPurchasesPage = lazy(() => import('./pages/app/MyPurchasesPage').then((m) => ({ default: m.MyPurchasesPage })));
const InitiatePurchasePage = lazy(() => import('./pages/app/InitiatePurchasePage').then((m) => ({ default: m.InitiatePurchasePage })));
const PurchaseSessionPage = lazy(() => import('./pages/app/PurchaseSessionPage').then((m) => ({ default: m.PurchaseSessionPage })));

const Loader: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <Spinner size={36} color="var(--lc-primary)" />
  </div>
);

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

const PublicRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  return isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Outlet />;
};

const AdminRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/app/dashboard" replace />;
  return <Outlet />;
};

const AppRoutes: React.FC = () => (
  <Suspense fallback={<Loader />}>
    <Routes>
      {/* Marketing */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Auth (public only) */}
      <Route element={<PublicRoute />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/auth/forgot" element={<ForgotPage />} />
        <Route path="/auth/forgot/verify" element={<VerifyCodePage />} />
        <Route path="/auth/forgot/set-new" element={<SetNewPasswordPage />} />
      </Route>

      {/* App (protected) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app/dashboard" element={<DashboardPage />} />
        <Route path="/app/verify/new" element={<StartVerificationPage />} />
        <Route path="/app/report" element={<VerificationReportPage />} />
        <Route path="/app/report/:id" element={<VerificationReportPage />} />
        <Route path="/app/certificate" element={<CertificatePage />} />
        <Route path="/app/escrow" element={<EscrowStatusPage />} />
        <Route path="/app/verifications" element={<MyVerificationsPage />} />
        <Route path="/app/upload" element={<UploadChatPage />} />
        <Route path="/app/notifications" element={<NotificationPage />} />
        <Route path="/app/profile" element={<ProfilePage />} />
        <Route path="/app/settings" element={<SettingsPage />} />
        <Route path="/app/wallet" element={<WalletPage />} />
        <Route path="/app/purchases" element={<MyPurchasesPage />} />
        <Route path="/app/purchases/new" element={<InitiatePurchasePage />} />
        <Route path="/app/purchases/:id" element={<PurchaseSessionPage />} />
      </Route>

      {/* Admin only */}
      <Route element={<AdminRoute />}>
        <Route path="/app/admin" element={<AdminPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
