import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function Login() {
  const { login, clearError } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    const result = await login(form.email, form.password);
    if (!result.success) {
      toast.error(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="hd-auth-page">
      <div className="hd-auth-left">
        <div className="text-center" style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>
            Welcome to<br /><span style={{ color: '#a5d8ff' }}>HealthDesk</span>
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, lineHeight: 1.7 }}>
            Your complete digital healthcare platform. Manage medical records, 
            book appointments, and connect with doctors — all in one place.
          </p>
          <div className="d-flex justify-content-center gap-4 mt-4">
            <div className="text-center">
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>1000+</div>
              <div style={{ opacity: 0.8, fontSize: '0.875rem' }}>Doctors</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>50K+</div>
              <div style={{ opacity: 0.8, fontSize: '0.875rem' }}>Patients</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>100K+</div>
              <div style={{ opacity: 0.8, fontSize: '0.875rem' }}>Appointments</div>
            </div>
          </div>
        </div>
      </div>

      <div className="hd-auth-right">
        <div className="hd-auth-card">
          <div className="hd-auth-logo">
            <div className="hd-auth-logo-icon">H+</div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>HealthDesk</span>
          </div>

          <h2 className="hd-auth-title">Sign In</h2>
          <p className="hd-auth-subtitle">Welcome back! Please enter your credentials.</p>

          <button className="hd-btn-google" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div className="hd-divider">or</div>

          <form onSubmit={handleSubmit}>
            <div className="hd-form-group">
              <label className="hd-form-label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="hd-form-control"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div className="hd-form-group">
              <label className="hd-form-label" htmlFor="login-password">Password</label>
              <div className="position-relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="hd-form-control"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="remember" />
                <label className="form-check-label small" htmlFor="remember">Remember me</label>
              </div>
              <Link to="/forgot-password" className="small">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className="hd-btn hd-btn-primary hd-btn-block hd-btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm"></span>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-3 mb-0 small text-muted">
            Don't have an account? <Link to="/register" className="fw-semibold">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
