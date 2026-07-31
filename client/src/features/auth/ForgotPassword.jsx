import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent if account exists');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    }
    setLoading(false);
  };

  return (
    <div className="hd-auth-page" style={{ justifyContent: 'center' }}>
      <div className="hd-auth-card" style={{ maxWidth: 440 }}>
        <div className="hd-auth-logo">
          <div className="hd-auth-logo-icon">H+</div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>HealthDesk</span>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <i className="bi bi-envelope-check-fill text-success" style={{ fontSize: '3rem' }}></i>
            <h3 className="mt-3">Check Your Email</h3>
            <p className="text-muted">If an account exists with <strong>{email}</strong>, we've sent a password reset link.</p>
            <Link to="/login" className="hd-btn hd-btn-primary mt-3">Back to Login</Link>
          </div>
        ) : (
          <>
            <h2 className="hd-auth-title">Forgot Password?</h2>
            <p className="hd-auth-subtitle">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit}>
              <div className="hd-form-group">
                <label className="hd-form-label" htmlFor="fp-email">Email Address</label>
                <input id="fp-email" type="email" className="hd-form-control" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="hd-btn hd-btn-primary hd-btn-block hd-btn-lg" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <p className="text-center mt-3 mb-0 small text-muted">
              Remember your password? <Link to="/login" className="fw-semibold">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
