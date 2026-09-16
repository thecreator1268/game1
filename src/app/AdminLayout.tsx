import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate } from 'react-router-dom';
import { IconButton } from '@/components/IconButton';
import { OfflineBadge } from '@/components/OfflineBadge';
import { HomeIcon } from '@/components/icons';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export default function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const logout = useAdminAuthStore((s) => s.logout);

  useEffect(() => {
    if (!isAuthenticated) navigate('/admin/login', { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <IconButton label={t('common.home')} onClick={() => navigate('/')}>
            <HomeIcon />
          </IconButton>
          <span className="text-action font-bold text-primary">{t('adminAuth.panelTitle')}</span>
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
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
