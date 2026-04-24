import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log for debugging — safe to keep in production
    console.error('[AgroLingo Error]', error.message, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Hard-reload to clear any broken state
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div style={{
        width: 390, height: 844,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-0)',
        gap: 24, padding: '0 32px',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Logo */}
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <img src="/images/logo1.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
        </div>

        {/* Message */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 22, fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.03em',
            marginBottom: 10, lineHeight: 1.1,
          }}>
            Something went wrong
          </h2>
          <p style={{
            fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
            marginBottom: 8,
          }}>
            AgroLingo ran into an unexpected error. Your data is safe.
          </p>
          {/* Show error in dev, hide in production */}
          {import.meta.env.DEV && this.state.error && (
            <p style={{
              fontFamily: 'monospace', fontSize: 11,
              color: '#F87171', background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 12px',
              textAlign: 'left', marginTop: 8,
              wordBreak: 'break-word',
            }}>
              {this.state.error.message}
            </p>
          )}
        </div>

        {/* Retry button */}
        <button
          onClick={this.handleReset}
          style={{
            padding: '14px 32px',
            background: 'var(--gold)', border: 'none',
            borderRadius: 999, cursor: 'pointer',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 15, fontWeight: 700,
            color: 'var(--text-inverse)', letterSpacing: '-0.01em',
            boxShadow: 'var(--shadow-gold)',
          }}
        >
          Restart App
        </button>
      </div>
    );
  }
}
