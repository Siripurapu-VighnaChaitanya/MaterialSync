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
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              background: '#FFFFFF',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08), 0 0 30px rgba(239, 68, 68, 0.06)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#DC2626',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#000000', marginBottom: '8px' }}>
              Component Render Paused
            </h3>
            <p style={{ color: '#000000', fontWeight: 700, fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
              An unexpected display issue occurred in this section. The application prevented a crash.
            </p>

            {this.state.error?.message && (
              <div
                style={{
                  background: '#FEF2F2',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  color: '#DC2626',
                  fontWeight: 700,
                  textAlign: 'left',
                  marginBottom: '24px',
                  overflowX: 'auto',
                  border: '1.5px solid rgba(239, 68, 68, 0.2)',
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
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 900,
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
                  background: '#F1F5F9',
                  border: '1.5px solid #CBD5E1',
                  color: '#000000',
                  fontWeight: 800,
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
