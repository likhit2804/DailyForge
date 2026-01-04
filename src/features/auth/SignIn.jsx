import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const SignIn = ({ onTabChange }) => {
  const { login } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { 
      setError('Provide username and password'); 
      return; 
    }
    setIsLoading(true);
    try {
      await login(username, password);
      window.location.hash = 'dashboard';
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div className="card shadow-lg border-0" style={{
        width: '100%',
        maxWidth: '450px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        background: 'rgba(255, 255, 255, 0.95)',
        margin: 'auto' // Added to center the card
      }}>
        <div className="card-body p-5">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="mb-3">
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
              }}>
                <span style={{ fontSize: '24px', color: 'white' }}>🔐</span>
              </div>
            </div>
            <h2 className="fw-bold text-dark mb-2">Welcome Back</h2>
            <p className="text-muted">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-dark">Username</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <span style={{ color: '#667eea' }}>👤</span>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  style={{
                    borderLeft: 'none',
                    boxShadow: 'none',
                    borderColor: '#e1e5e9'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-dark">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <span style={{ color: '#667eea' }}>🔒</span>
                </span>
                <input
                  type="password"
                  className="form-control border-start-0 ps-0"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    borderLeft: 'none',
                    boxShadow: 'none',
                    borderColor: '#e1e5e9'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger py-2 mb-3" style={{
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                color: '#721c24'
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="d-flex gap-2 mb-3">
              <button
                className="btn flex-fill"
                type="submit"
                disabled={isLoading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing In...
                  </>
                ) : (
                  <>
                    <span className="me-2">🚀</span>
                    Sign In
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => { setEmail(''); setPassword(''); setError(''); }}
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: '2px solid #e1e5e9',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.borderColor = '#667eea'}
                onMouseOut={(e) => e.target.style.borderColor = '#e1e5e9'}
              >
                Clear
              </button>
            </div>
          </form>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-muted mb-2">Don't have an account?</p>
            <button
              className="btn btn-link p-0 fw-semibold"
              onClick={() => onTabChange('register')}
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.color = '#764ba2'}
              onMouseOut={(e) => e.target.style.color = '#667eea'}
            >
              Create Account <span>✨</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
