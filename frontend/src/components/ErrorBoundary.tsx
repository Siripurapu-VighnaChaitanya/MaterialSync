import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '540px',
              width: '100%',
              padding: '32px',
              borderRadius: '20px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(15, 23, 42, 0.9)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.1)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#EF4444',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '8px' }}>
              Component Render Paused
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
              An unexpected display issue occurred in this section. The application prevented a crash.
            </p>

            {this.state.error?.message && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  color: '#F87171',
                  textAlign: 'left',
                  marginBottom: '24px',
                  overflowX: 'auto',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FACC15 0%, #22C55E 100%)',
                  border: 'none',
                  color: '#050810',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={16} /> Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#E2E8F0',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <Home size={16} /> Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
