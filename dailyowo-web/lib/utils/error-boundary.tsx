'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, FileText } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error reporting service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to error tracking service like Sentry
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <GlassContainer className="max-w-lg w-full p-8">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
              </div>

              <h1 className="text-2xl font-light text-primary mb-2">
                Oops! Something went wrong
              </h1>
              
              <p className="text-primary/60 mb-6">
                We're sorry for the inconvenience. The error has been logged and we'll look into it.
              </p>

              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-primary/60 hover:text-primary transition-colors">
                    Show error details
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-xs text-primary/60 overflow-auto max-h-64">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <GlassButton
                  onClick={this.handleReset}
                  className="flex-1"
                  goldBorder
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </GlassButton>
                
                <GlassButton
                  onClick={() => window.location.href = '/'}
                  variant="secondary"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </GlassButton>
              </div>

              {this.state.errorCount > 2 && (
                <p className="mt-4 text-sm text-yellow-600 dark:text-yellow-400">
                  This error keeps occurring. Please try refreshing the page or clearing your browser cache.
                </p>
              )}
            </div>
          </GlassContainer>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = () => setError(null);
  const captureError = (error: Error) => setError(error);

  return { resetError, captureError };
}

// Async error boundary wrapper
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  const { captureError } = useErrorHandler();

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      captureError(new Error(event.reason));
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [captureError]);

  return <>{children}</>;
} 