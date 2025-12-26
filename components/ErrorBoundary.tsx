import React from 'react';
import toast from 'react-hot-toast';

interface State {
  hasError: boolean;
  error?: Error | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log to console and show a toast for visibility
    // In production you might send this to an error tracking service
    // eslint-disable-next-line no-console
    console.error('Uncaught error in component tree', error, info);
    try {
      toast.error('An unexpected error occurred. Check console for details.');
    } catch (e) {
      // swallow
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoToLogin = () => {
    window.location.href = '/#/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#071515]">
          <div className="bg-white/5 border border-white/10 p-6 rounded shadow max-w-xl w-full">
            <h2 className="text-2xl text-white font-bold mb-2">Something went wrong</h2>
            <p className="text-white/70 mb-4">An unexpected error occurred. You can reload the page or go back to login.</p>
            <div className="flex gap-3">
              <button onClick={this.handleReload} className="bg-primary px-4 py-2 rounded font-bold text-[#112120]">Reload</button>
              <button onClick={this.handleGoToLogin} className="px-4 py-2 rounded border border-white/10 text-white">Go to Login</button>
            </div>
            <details className="mt-4 text-xs text-white/50">
              <summary>Technical details</summary>
              <pre className="whitespace-pre-wrap mt-2">{String(this.state.error)}</pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

export default ErrorBoundary;