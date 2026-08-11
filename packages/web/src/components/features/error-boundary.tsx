import { Component, type ReactNode } from 'react';
import { captureError, reportError } from '../../lib/observability';
import { Button } from '../ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    const payload = captureError(error, { severity: 'error' });
    reportError(payload).catch(() => {});
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
          <div className="max-w-md text-center space-y-6">
            <h1 className="text-xl font-bold text-neutral-900">Something went wrong</h1>
            <p className="text-neutral-500">
              An unexpected error occurred. Try reloading the page.
            </p>
            {this.state.error?.message && (
              <p className="rounded-md bg-error-light px-4 py-2 text-sm text-error-700">
                {this.state.error.message}
              </p>
            )}
            <Button onClick={this.handleReload}>Reload Page</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
