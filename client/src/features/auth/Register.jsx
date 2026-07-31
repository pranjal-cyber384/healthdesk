import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function Register() {
  const { register, clearError } = useAuth();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'patient', phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await register({
      firstName: form.firstName, lastName: form.lastName, email: form.email,
      password: form.password, role: form.role, phone: form.phone || undefined
    });
    if (!result.success) {
      toast.error(result.message);
    } else {
      toast.success('Registration successful!');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="hd-auth-page">
      <div className="hd-auth-left">
        <div className="text-center" style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
            Join <span style={{ color: '#a5d8ff' }}>HealthDesk</span>
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, lineHeight: 1.7 }}>
            Create your account and take control of your health journey today.
          </p>
          <div className="mt-4 text-start" style={{ opacity: 0.9 }}>
            <div className="d-flex align-items-center gap-2 mb-2"><i className="bi bi-check-circle-fill"></i> Maintain your complete medical history</div>
            <div className="d-flex align-items-center gap-2 mb-2"><i className="bi bi-check-circle-fill"></i> Connect with verified doctors</div>
            <div className="d-flex align-items-center gap-2 mb-2"><i className="bi bi-check-circle-fill"></i> Book appointments online</div>
            <div className="d-flex align-items-center gap-2 mb-2"><i className="bi bi-check-circle-fill"></i> Securely store medical records</div>
          </div>
        </div>
      </div>

      <div className="hd-auth-right">
        <div className="hd-auth-card" style={{ maxWidth: 480 }}>
          <div className="hd-auth-logo">
            <div className="hd-auth-logo-icon">H+</div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>HealthDesk</span>
          </div>

          <h2 className="hd-auth-title">Create Account</h2>
          <p className="hd-auth-subtitle">Fill in your details to get started.</p>

          <form onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div className="hd-form-group">
              <label className="hd-form-label">I am a</label>
              <div className="d-flex gap-2">
                <button type="button" onClick={() => setForm({...form, role: 'patient'})}
                  className={`hd-btn flex-fill ${form.role === 'patient' ? 'hd-btn-primary' : 'hd-btn-outline'}`}>
                  <i className="bi bi-person-fill"></i> Patient
                </button>
                <button type="button" onClick={() => setForm({...form, role: 'doctor'})}
                  className={`hd-btn flex-fill ${form.role === 'doctor' ? 'hd-btn-primary' : 'hd-btn-outline'}`}>
                  <i className="bi bi-heart-pulse-fill"></i> Doctor
                </button>
              </div>
            </div>

            <div className="row">
              <div className="col-6">
                <div className="hd-form-group">
                  <label className="hd-form-label" htmlFor="reg-first">First Name</label>
                  <input id="reg-first" name="firstName" type="text" className="hd-form-control" placeholder="John" value={form.firstName} onChange={handleChange} required minLength={2} />
                </div>
              </div>
              <div className="col-6">
                <div className="hd-form-group">
                  <label className="hd-form-label" htmlFor="reg-last">Last Name</label>
                  <input id="reg-last" name="lastName" type="text" className="hd-form-control" placeholder="Doe" value={form.lastName} onChange={handleChange} required minLength={2} />
                </div>
              </div>
            </div>

            <div className="hd-form-group">
              <label className="hd-form-label" htmlFor="reg-email">Email Address</label>
              <input id="reg-email" name="email" type="email" className="hd-form-control" placeholder="name@example.com" value={form.email} onChange={handleChange} required />
            </div>

            <div className="hd-form-group">
              <label className="hd-form-label" htmlFor="reg-phone">Phone (Optional)</label>
              <input id="reg-phone" name="phone" type="tel" className="hd-form-control" placeholder="+91 9876543210" value={form.phone} onChange={handleChange} />
            </div>

            <div className="hd-form-group">
              <label className="hd-form-label" htmlFor="reg-pass">Password</label>
              <div className="position-relative">
                <input id="reg-pass" name="password" type={showPassword ? 'text' : 'password'} className="hd-form-control" placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special" value={form.password} onChange={handleChange} required minLength={8} style={{paddingRight:'2.5rem'}} />
                <button type="button" className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="hd-form-group">
              <label className="hd-form-label" htmlFor="reg-confirm">Confirm Password</label>
              <input id="reg-confirm" name="confirmPassword" type="password" className="hd-form-control" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} required />
            </div>

            <button type="submit" className="hd-btn hd-btn-primary hd-btn-block hd-btn-lg" disabled={loading}>
              {loading ? (<><span className="spinner-border spinner-border-sm"></span> Creating account...</>) : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-3 mb-0 small text-muted">
            Already have an account? <Link to="/login" className="fw-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
