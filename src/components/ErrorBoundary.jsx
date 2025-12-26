import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import Icon from './AppIcon';
import Button from './ui/Button';

// ErrorBoundaryContent component that doesn't use hooks
// It receives translations directly to avoid hook usage issues
// Note: Cannot use MainSidebar or GlobalProfile here as they require Router and MultiUserProvider contexts
const ErrorBoundaryContent = ({ error }) => {
  const handleRetry = () => {
    window.location.reload();
  };

  // Show generic error UI
  return (
    <I18nextProvider i18n={i18n}>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full p-8 text-center">
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
    this.state = { 
      hasError: false, 
      error: null,
      isOffline: !navigator.onLine
    };
  }

  static getDerivedStateFromError(error) {
    // Don't catch network/internet errors - let InternetConnectionCheck handle those
    // Check if error is network-related
    const isNetworkError = error?.message?.includes('fetch') || 
                          error?.message?.includes('network') ||
                          error?.message?.includes('NetworkError') ||
                          error?.name === 'TypeError' && error?.message?.includes('Failed to fetch');
    
    // If it's a network error and we're offline, don't show error boundary
    // Let InternetConnectionCheck handle it instead
    if (isNetworkError && !navigator.onLine) {
      // Reset error state - let InternetConnectionCheck handle it
      return { hasError: false, error: null, isOffline: true };
    }
    
    return { hasError: true, error, isOffline: !navigator.onLine };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Check if it's a network error - if so, don't show error boundary
    const isNetworkError = error?.message?.includes('fetch') || 
                          error?.message?.includes('network') ||
                          error?.message?.includes('NetworkError') ||
                          error?.name === 'TypeError' && error?.message?.includes('Failed to fetch');
    
    // If network error and offline, reset error state to let InternetConnectionCheck handle it
    if (isNetworkError && !navigator.onLine) {
      this.setState({ hasError: false, error: null, isOffline: true });
      return;
    }
    
    // Optionally send error to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // You can add error tracking here (e.g., Sentry, LogRocket, etc.)
    }
  }

  componentDidMount() {
    // Listen for online/offline events to detect network issues
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    this.setState({ isOffline: false });
  };

  handleOffline = () => {
    this.setState({ isOffline: true });
    // If we have an error and go offline, reset error state to let InternetConnectionCheck handle it
    if (this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    // Disabled error boundary UI - just log errors and continue rendering
    // Errors are logged to console but UI is not shown to avoid disrupting user experience
    if (this.state.hasError && !this.state.isOffline) {
      // Log error but don't show UI - continue rendering children
      // This prevents the error boundary from blocking the UI
      return this.props.children;
    }

    // If it's just an internet issue, don't show error boundary - let InternetConnectionCheck handle it
    return this.props.children;
  }
}

export default ErrorBoundary; 