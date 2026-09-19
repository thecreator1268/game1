import { useTranslation } from 'react-i18next';

// Replaces a blank white flash while a lazy dashboard chunk or a first
// Dexie read is still in flight. Plain CSS shimmer (see .skeleton in
// index.css) rather than Motion — this can render before the app has
// settled on anything, so it has to work with zero JS animation setup cost.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-card ${className}`.trim()} aria-hidden />;
}

// A stand-in for a whole dashboard page while its lazy chunk loads —
// several bars of varying width so it reads as "content is coming," not a
// single gray box.
export function DashboardSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <span className="sr-only" role="status">
        {t('common.loading')}
      </span>
      <div aria-hidden className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3 max-w-sm" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
