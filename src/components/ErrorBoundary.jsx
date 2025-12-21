import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import Icon from './AppIcon';
import Button from './ui/Button';

// ErrorBoundaryContent component that doesn't use hooks
// It receives translations directly to avoid hook usage issues
const ErrorBoundaryContent = ({ error }) => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <I18nextProvider i18n={i18n}>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-6 text-center">
          <Icon name="AlertCircle" size={64} className="text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {i18n.t('common.errors.somethingWentWrong', 'Something went wrong')}
          </h2>
          <p className="text-muted-foreground mb-6">
            {i18n.t('common.errors.unexpectedError', 'We\'re sorry, but something unexpected happened. Please try refreshing the page.')}
          </p>
          <Button
            onClick={handleRetry}
            variant="default"
            className="w-full sm:w-auto"
          >
            {i18n.t('common.retry', 'Retry')}
          </Button>
        </div>
      </div>
    </I18nextProvider>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Optionally send error to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // You can add error tracking here (e.g., Sentry, LogRocket, etc.)
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorBoundaryContent error={this.state.error} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 