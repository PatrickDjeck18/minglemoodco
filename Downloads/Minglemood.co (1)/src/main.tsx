import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/globals.css';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#FFF9FB'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#0A1929',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <span style={{ fontSize: '2rem', color: '#FFF5F7' }}>MM</span>
          </div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 500, 
            marginBottom: '1rem',
            color: '#0A1929'
          }}>
            MingleMood Social
          </h1>
          <div style={{
            maxWidth: '500px',
            padding: '1.5rem',
            backgroundColor: '#FFE5EF',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(10, 25, 41, 0.15)'
          }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#0A1929' }}>
              Application Error
            </strong>
            <p style={{ color: '#1E3A5F', fontSize: '0.875rem' }}>
              We encountered a problem loading the application. This might be due to a configuration issue.
            </p>
            {this.state.error && (
              <p style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.75rem', 
                color: '#8B2C4D',
                fontFamily: 'monospace',
                wordBreak: 'break-word'
              }}>
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0A1929',
              color: '#FFF5F7',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Reload Page
          </button>
          <p style={{ 
            marginTop: '1.5rem', 
            fontSize: '0.875rem', 
            color: '#1E3A5F' 
          }}>
            If the problem persists, please contact{' '}
            <a 
              href="mailto:hello@minglemood.co"
              style={{ color: '#0A1929', textDecoration: 'underline' }}
            >
              hello@minglemood.co
            </a>
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);