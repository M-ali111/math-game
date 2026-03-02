import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRestart = () => {
    // Clear all localStorage to remove stale data
    localStorage.clear();
    // Reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-teal-50 to-white">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Something went wrong</h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            The app encountered an error. Click below to restart with a fresh state.
          </p>
          {this.state.error && (
            <details className="mb-6 text-sm text-gray-500 max-w-md">
              <summary className="cursor-pointer hover:text-gray-700">Error details</summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleRestart}
            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-2xl font-medium transition-colors"
          >
            Restart App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
