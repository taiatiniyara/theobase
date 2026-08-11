import { Component, type ReactNode } from 'react';
import { captureError, reportError } from '../../lib/observability';

interface Props {
  children: ReactNode;
  churchId?: string;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, _info: React.ErrorInfo): void {
    const payload = captureError(error, { churchId: this.props.churchId });
    reportError(payload);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-bold text-neutral-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-neutral-500">{this.state.error}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
