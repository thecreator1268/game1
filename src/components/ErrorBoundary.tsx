import { Component, type ErrorInfo, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { stopSpeaking } from '@/lib/speech';

interface ErrorBoundaryProps extends WithTranslation {
  children: ReactNode;
  // When set, the fallback offers a narrower recovery action ("back to
  // games") instead of a full app reload — used around GameRoute, where a
  // crash in one game shouldn't cost the caregiver dashboard/session state.
  homePath?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// A dementia patient's device must never white-screen on a render error —
// this is the last line of defence. Errors are swallowed from the user's
// view but still logged for whoever is developing/debugging.
class ErrorBoundaryImpl extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    stopSpeaking();
    console.error('SmritiSetu crashed:', error, info.componentStack);
  }

  handleReturn = () => {
    this.setState({ hasError: false });
    window.location.href = this.props.homePath ?? `${import.meta.env.BASE_URL}`;
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { t } = this.props;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-4">
        <Card className="w-full max-w-sm text-center">
          <h1 className="text-heading font-bold">{t('errorBoundary.title')}</h1>
          <p className="mt-2 text-body text-text-muted">{t('errorBoundary.body')}</p>
          <Button className="mt-6 w-full" onClick={this.handleReturn}>
            {t('errorBoundary.action')}
          </Button>
        </Card>
      </div>
    );
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryImpl);
