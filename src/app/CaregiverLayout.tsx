import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconButton } from '@/components/IconButton';
import { OfflineBadge } from '@/components/OfflineBadge';
import { HomeIcon } from '@/components/icons';
import { Icon, type IconName } from '@/components/IconSprite';
import { RouteTransition } from '@/components/RouteTransition';
import { CaregiverPatientSwitcher } from '@/dashboard/CaregiverPatientSwitcher';
import { useAuthStore } from '@/store/authStore';

export default function CaregiverLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!isAuthenticated) navigate('/caregiver/login', { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  // Nav labels are short, dedicated words (nav.*) — distinct from the
  // fuller page titles (dashboard.title, reminders.manageTitle, ...) used
  // as each screen's own <h1>, which are too long to sit under a 28px icon
  // in a 68px-tall nav button four-across on a phone. Each button's
  // aria-label/title keeps the fuller title for a clearer accessible name.
  const navItems: { to: string; label: string; fullLabel: string; end: boolean; icon: IconName }[] = [
    { to: '/caregiver', label: t('nav.home'), fullLabel: t('dashboard.title'), end: true, icon: 'home' },
    {
      to: '/caregiver/reminders',
      label: t('nav.reminders'),
      fullLabel: t('reminders.manageTitle'),
      end: false,
      icon: 'calendar',
    },
    {
      to: '/caregiver/family',
      label: t('nav.family'),
      fullLabel: t('familyManager.title'),
      end: false,
      icon: 'family',
    },
    {
      to: '/caregiver/settings',
      label: t('nav.settings'),
      fullLabel: t('dashboard.settings'),
      end: false,
      icon: 'settings',
    },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 print:hidden sm:px-6">
        <div className="flex items-center gap-3">
          <IconButton label={t('common.home')} onClick={() => navigate('/')}>
            <HomeIcon />
          </IconButton>
          <span className="font-heading text-action font-bold text-primary">{t('common.appName')}</span>
        </div>
        <div className="flex items-center gap-3">
          <OfflineBadge />
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="text-body font-semibold text-danger"
          >
            {t('caregiverAuth.logout')}
          </button>
        </div>
      </header>
      <CaregiverPatientSwitcher />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6">
        <RouteTransition routeKey={location.pathname} variant="dynamic">
          <Outlet />
        </RouteTransition>
      </main>
      <p className="px-4 pb-28 text-center text-sm text-text-muted sm:px-6">{t('common.clinicalNote')}</p>
      <nav className="nav-bar print:hidden">
        <div className="mx-auto flex w-full max-w-4xl gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={item.fullLabel}
              title={item.fullLabel}
              className={({ isActive }) => `nav-btn ${isActive ? 'nav-btn-on' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} size={28} />
                  <span className="text-[13px] font-semibold leading-none">{item.label}</span>
                  {isActive && <span className="nav-dot" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
