import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import CaregiverLayout from '@/app/CaregiverLayout';
import CaregiverLogin from '@/app/CaregiverLogin';
import GameRoute from '@/app/GameRoute';
import Onboarding from '@/app/Onboarding';
import PatientHome from '@/app/PatientHome';
import RoleSelect from '@/app/RoleSelect';
import { useApplyTheme } from '@/hooks/useApplyTheme';
import { startAutoSync } from '@/sync/queue';

// Recharts/jsPDF/dashboard code is caregiver-only and sizeable — lazy-loaded
// so a patient's session (the common case, on a low-RAM tablet) never
// downloads it.
const CaregiverHome = lazy(() => import('@/dashboard/CaregiverHome'));
const RemindersManager = lazy(() => import('@/dashboard/RemindersManager'));
const FamilyManager = lazy(() => import('@/dashboard/FamilyManager'));
const SettingsPanel = lazy(() => import('@/dashboard/SettingsPanel'));

// Admin panel is staff-only and rarely opened — also lazy-loaded.
const AdminLogin = lazy(() => import('@/app/AdminLogin'));
const AdminLayout = lazy(() => import('@/app/AdminLayout'));
const AdminOverview = lazy(() => import('@/admin/AdminOverview'));

function DashboardFallback() {
  const { t } = useTranslation();
  return <div className="py-20 text-center text-body">{t('common.loading')}</div>;
}

function AppShell() {
  useApplyTheme();

  useEffect(() => {
    const stop = startAutoSync();
    return stop;
  }, []);

  return (
    <Routes>
      <Route path="/" element={<RoleSelect />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route path="/patient" element={<PatientHome />} />
      <Route path="/patient/game/:gameId" element={<GameRoute />} />

      <Route path="/caregiver/login" element={<CaregiverLogin />} />
      <Route path="/caregiver" element={<CaregiverLayout />}>
        <Route
          index
          element={
            <Suspense fallback={<DashboardFallback />}>
              <CaregiverHome />
            </Suspense>
          }
        />
        <Route
          path="reminders"
          element={
            <Suspense fallback={<DashboardFallback />}>
              <RemindersManager />
            </Suspense>
          }
        />
        <Route
          path="family"
          element={
            <Suspense fallback={<DashboardFallback />}>
              <FamilyManager />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<DashboardFallback />}>
              <SettingsPanel />
            </Suspense>
          }
        />
      </Route>

      <Route
        path="/admin/login"
        element={
          <Suspense fallback={<DashboardFallback />}>
            <AdminLogin />
          </Suspense>
        }
      />
      <Route
        path="/admin"
        element={
          <Suspense fallback={<DashboardFallback />}>
            <AdminLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<DashboardFallback />}>
              <AdminOverview />
            </Suspense>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
