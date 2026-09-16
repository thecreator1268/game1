import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { IconButton } from '@/components/IconButton';
import { OfflineBadge } from '@/components/OfflineBadge';
import { HomeIcon } from '@/components/icons';
import { useAuthStore } from '@/store/authStore';

export default function CaregiverLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!isAuthenticated) navigate('/caregiver/login', { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const navItems = [
    { to: '/caregiver', label: t('dashboard.title'), end: true },
    { to: '/caregiver/reminders', label: t('reminders.manageTitle'), end: false },
    { to: '/caregiver/family', label: t('familyManager.title'), end: false },
    { to: '/caregiver/settings', label: t('dashboard.settings'), end: false },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <IconButton label={t('common.home')} onClick={() => navigate('/')}>
            <HomeIcon />
          </IconButton>
          <span className="text-action font-bold text-primary">{t('common.appName')}</span>
        </div>
        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-body font-semibold ${
                  isActive ? 'bg-primary text-primary-text' : 'bg-surface-alt text-text'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
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
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
      <p className="px-4 pb-6 text-center text-sm text-text-muted sm:px-6">{t('common.clinicalNote')}</p>
    </div>
  );
}
