import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import CaregiverLayout from '@/app/CaregiverLayout';
import CaregiverLogin from '@/app/CaregiverLogin';
import GameRoute from '@/app/GameRoute';
import LevelSelect from '@/app/LevelSelect';
import Onboarding from '@/app/Onboarding';
import PatientHome from '@/app/PatientHome';
import RoleSelect from '@/app/RoleSelect';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { IconSprite } from '@/components/IconSprite';
import { RouteTransition } from '@/components/RouteTransition';
import { DashboardSkeleton } from '@/components/Skeleton';
import { useActivePatient } from '@/hooks/useActivePatient';
import { useApplyTheme } from '@/hooks/useApplyTheme';
import { useMascotGaze } from '@/hooks/useMascotGaze';
import { ADMIN_ENABLED } from '@/lib/featureFlags';
import { startReminderWatcher } from '@/reminders/notificationService';
import { startAutoSync } from '@/sync/queue';

// Coarser than the raw pathname on purpose: this key drives the *top-level*
// screen transition, which should fire for "entering caregiver mode" but
// NOT for every tab switch once inside it (CaregiverLayout/AdminLayout own
// their own nested RouteTransition around just their <Outlet/> for that).
function routeGroup(pathname: string): string {
  if (pathname === '/') return 'role-select';
  if (pathname.startsWith('/onboarding')) return 'onboarding';
  if (pathname.startsWith('/caregiver/login')) return 'caregiver-login';
  if (pathname.startsWith('/caregiver')) return 'caregiver';
  if (pathname.startsWith('/admin/login')) return 'admin-login';
  if (pathname.startsWith('/admin')) return 'admin';
  if (/^\/patient\/game\/[^/]+\/levels/.test(pathname)) return 'game-levels';
  if (pathname.startsWith('/patient/game/')) return 'game';
  if (pathname.startsWith('/patient')) return 'patient-home';
  if (pathname.startsWith('/showcase')) return 'showcase';
  return pathname;
}

// Recharts/jsPDF/dashboard code is caregiver-only and sizeable — lazy-loaded
// so a patient's session (the common case, on a low-RAM tablet) never
// downloads it.
const CaregiverHome = lazy(() => import('@/dashboard/CaregiverHome'));
const RemindersManager = lazy(() => import('@/dashboard/RemindersManager'));
const FamilyManager = lazy(() => import('@/dashboard/FamilyManager'));
const SettingsPanel = lazy(() => import('@/dashboard/SettingsPanel'));

// A read-only snapshot another family member opens on their own device/phone
// — see src/dashboard/sharedSnapshot.ts. Checked as a query param on the
// root path (never a separate route path) specifically so the link still
// works on a cold open from GitHub Pages, which has no server-side rewrite
// for deep sub-paths of a client-side-routed app.
const SharedSnapshotView = lazy(() => import('@/app/SharedSnapshotView'));

// Admin panel is staff-only and rarely opened — also lazy-loaded.
const AdminLogin = lazy(() => import('@/app/AdminLogin'));
const AdminLayout = lazy(() => import('@/app/AdminLayout'));
const AdminOverview = lazy(() => import('@/admin/AdminOverview'));

// Demo-recording aid only, never linked from any nav — see ShowcaseMode's
// own comment. Lazy-loaded since it pulls in Recharts via DomainBalanceChart.
const ShowcaseMode = lazy(() => import('@/app/ShowcaseMode'));

function DashboardFallback() {
  return <DashboardSkeleton />;
}

function AppShell() {
  useApplyTheme();
  useMascotGaze();
  const patient = useActivePatient();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    const stop = startAutoSync();
    return stop;
  }, []);

  useEffect(() => {
    if (!patient?.id || !patient.reminderAlertsEnabled) return undefined;
    return startReminderWatcher(patient.id);
  }, [patient?.id, patient?.reminderAlertsEnabled]);

  if (searchParams.has('view')) {
    return (
      <Suspense fallback={<DashboardFallback />}>
        <SharedSnapshotView />
      </Suspense>
    );
  }

  return (
    <RouteTransition routeKey={routeGroup(location.pathname)}>
      <Routes location={location}>
      <Route path="/" element={<RoleSelect />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route path="/patient" element={<PatientHome />} />
      <Route path="/patient/game/:gameId/levels" element={<LevelSelect />} />
      <Route
        path="/patient/game/:gameId"
        element={
          <ErrorBoundary homePath={`${import.meta.env.BASE_URL}patient`}>
            <GameRoute />
          </ErrorBoundary>
        }
      />

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

      {ADMIN_ENABLED && (
        <>
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
        </>
      )}

      <Route
        path="/showcase"
        element={
          <Suspense fallback={<DashboardFallback />}>
            <ShowcaseMode />
          </Suspense>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RouteTransition>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <IconSprite />
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
