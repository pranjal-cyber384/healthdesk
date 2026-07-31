import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password: form.password });
      setSuccess(true);
      toast.success('Password reset successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="hd-auth-page" style={{ justifyContent: 'center' }}>
        <div className="hd-auth-card text-center">
          <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
          <h3 className="mt-3">Invalid Reset Link</h3>
          <p className="text-muted">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="hd-btn hd-btn-primary mt-3">Request New Link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="hd-auth-page" style={{ justifyContent: 'center' }}>
      <div className="hd-auth-card" style={{ maxWidth: 440 }}>
        <div className="hd-auth-logo">
          <div className="hd-auth-logo-icon">H+</div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>HealthDesk</span>
        </div>
        {success ? (
          <div className="text-center py-4">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
            <h3 className="mt-3">Password Reset!</h3>
            <p className="text-muted">Your password has been reset successfully.</p>
            <Link to="/login" className="hd-btn hd-btn-primary mt-3">Sign In</Link>
          </div>
        ) : (
          <>
            <h2 className="hd-auth-title">Reset Password</h2>
            <p className="hd-auth-subtitle">Enter your new password below.</p>
            <form onSubmit={handleSubmit}>
              <div className="hd-form-group">
                <label className="hd-form-label" htmlFor="rp-pass">New Password</label>
                <input id="rp-pass" type="password" className="hd-form-control" placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required minLength={8} />
              </div>
              <div className="hd-form-group">
                <label className="hd-form-label" htmlFor="rp-confirm">Confirm New Password</label>
                <input id="rp-confirm" type="password" className="hd-form-control" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => setForm({...form, confirmPassword: e.target.value})} required />
              </div>
              <button type="submit" className="hd-btn hd-btn-primary hd-btn-block hd-btn-lg" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
