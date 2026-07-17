/**
 * @file ErrorBoundary component for Stadium AI.
 * Catches rendering errors and displays a fallback UI.
 */

import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReset() {
    this.setState({ hasError: false, errorMessage: '' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" aria-live="assertive" className="flex h-full items-center justify-center p-8 bg-red-50">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold text-red-700 mb-4">Something went wrong.</h2>
            <p className="text-red-600 mb-6">A module failed to load. Please try refreshing or navigating back.</p>
            {import.meta.env.DEV && this.state.errorMessage && (
              <pre className="text-xs text-left text-red-500 bg-red-100 rounded-lg p-4 mb-6 overflow-auto max-h-40">
                {this.state.errorMessage}
              </pre>
            )}
            <div className="flex gap-4 justify-center">
              <button onClick={this.handleReset} className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
                Try Again
              </button>
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
