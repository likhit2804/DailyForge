import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const Register = ({ onTabChange }) => {
  const { register } = useAppContext();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#667eea');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username) { setError('Please provide a username'); return; }
    if (!email) { setError('Please provide an email'); return; }
    if (!password) { setError('Please provide a password'); return; }

    setIsLoading(true);
    try {
      await register({ username, email, password, name });
      window.location.hash = 'dashboard';
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      padding: '20px'
    }}>
      <div className="card shadow-lg border-0" style={{
        width: '100%',
        maxWidth: '480px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        background: 'rgba(255, 255, 255, 0.95)'
      }}>
        <div className="card-body p-5">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="mb-3">
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                boxShadow: '0 8px 25px rgba(245, 87, 108, 0.3)'
              }}>
                <span style={{ fontSize: '24px', color: 'white' }}>🎨</span>
              </div>
            </div>
            <h2 className="fw-bold text-dark mb-2">Join Us</h2>
            <p className="text-muted">Create your personalized account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-dark">Full Name</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <span style={{ color: '#f5576c' }}>👤</span>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    borderLeft: 'none',
                    boxShadow: 'none',
                    borderColor: '#e1e5e9'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#f5576c'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-dark">Username</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <span style={{ color: '#f5576c' }}>🔤</span>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    borderLeft: 'none',
                    boxShadow: 'none',
                    borderColor: '#e1e5e9'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#f5576c'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-dark">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <span style={{ color: '#f5576c' }}>📧</span>
                </span>
                <input
                  type="email"
                  className="form-control border-start-0 ps-0"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    borderLeft: 'none',
                    boxShadow: 'none',
                    borderColor: '#e1e5e9'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#f5576c'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-dark">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <span style={{ color: '#f5576c' }}>🔒</span>
                </span>
                <input
                  type="password"
                  className="form-control border-start-0 ps-0"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    borderLeft: 'none',
                    boxShadow: 'none',
                    borderColor: '#e1e5e9'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#f5576c'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold text-dark">Choose Your Theme Color</label>
              <div className="d-flex align-items-center gap-3">
                <div className="input-group flex-grow-1">
                  <span className="input-group-text bg-light border-end-0">
                    <span style={{
                      width: '20px',
                      height: '20px',
                      background: color,
                      display: 'inline-block',
                      borderRadius: '50%',
                      border: '2px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }} />
                  </span>
                  <input
                    type="color"
                    className="form-control border-start-0 ps-0"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{
                      borderLeft: 'none',
                      boxShadow: 'none',
                      borderColor: '#e1e5e9',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <small className="text-muted">Pick your favorite color</small>
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

            <button
              type="submit"
              className="btn w-100 mb-3"
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: 'none',
                color: 'white',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <span className="me-2">🎉</span>
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-muted mb-2">Already have an account?</p>
            <button
              className="btn btn-link p-0 fw-semibold"
              onClick={() => onTabChange('signin')}
              style={{
                color: '#f5576c',
                textDecoration: 'none',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.color = '#f093fb'}
              onMouseOut={(e) => e.target.style.color = '#f5576c'}
            >
              Sign In <span>🔑</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
