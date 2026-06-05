import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-red-200 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-600" />
            </div>
            <h1 className="text-lg font-bold text-navy-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-6">
              An unexpected error occurred. Please refresh the page or contact your system administrator.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 transition-colors"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-6 p-3 bg-red-50 rounded text-xs text-red-700 text-left overflow-auto max-h-40">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
