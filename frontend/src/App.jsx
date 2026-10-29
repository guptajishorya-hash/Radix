import React from 'react'
import Dashboard from './components/Dashboard.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: 24,
          fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: 36,
            maxWidth: 520,
            width: '100%',
            border: '1px solid #fed7aa',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28,
              background: '#fff7ed', color: '#df7a1a',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, fontSize: '28px',
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e2530', margin: '0 0 8px' }}>
              Interface Intercepted An Error
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 20 }}>
              <code style={{ color: '#dc2626', background: '#fef2f2', padding: '4px 10px', borderRadius: 6, fontSize: '0.82rem', display: 'inline-block' }}>
                {this.state.error?.message || 'Component render error'}
              </code>
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              style={{
                background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
                color: '#ffffff', border: 'none', borderRadius: 10,
                padding: '12px 28px', fontSize: '0.92rem', fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Refresh Application
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  )
}

export default App
