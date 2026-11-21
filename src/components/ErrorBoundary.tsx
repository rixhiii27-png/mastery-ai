import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('MASTERY AI ErrorBoundary caught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      let friendlyDetail = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed?.operationType && parsed?.path) {
          friendlyDetail = `Database ${parsed.operationType} access on "${parsed.path}" was rejected: ${parsed.error}`;
        }
      } catch {
        // Keep original message
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#FEFAE0] dark:bg-[#283618] text-[#1C2412] dark:text-[#FEFAE0]">
          <div className="max-w-lg w-full rounded-[18px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#DDA15E]/25 dark:bg-[#606C38] flex items-center justify-center text-[#BC6C25] dark:text-[#DDA15E]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-[#283618] dark:text-[#FEFAE0]">
                Something interrupted your session
              </h1>
            </div>
            <p className="text-sm text-[#4A543B] dark:text-[#FEFAE0]/85 leading-relaxed mb-6 break-words">
              {friendlyDetail}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#606C38] hover:bg-[#283618] dark:bg-[#DDA15E] dark:hover:bg-[#BC6C25] text-[#FEFAE0] dark:text-[#283618] text-sm font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload MASTERY AI
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
