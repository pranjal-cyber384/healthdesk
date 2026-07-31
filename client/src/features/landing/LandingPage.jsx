import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const features = [
    { icon: 'bi-file-medical-fill', color: 'var(--hd-primary)', bg: 'var(--hd-primary-light)', title: 'Medical Records', desc: 'Securely store and access all your medical reports, prescriptions, and health records anytime.' },
    { icon: 'bi-calendar-check-fill', color: 'var(--hd-success)', bg: 'var(--hd-success-light)', title: 'Book Appointments', desc: 'Find verified doctors and book appointments online or offline with ease.' },
    {
      icon: 'bi-prescription2', color: 'var(--hd-medical-purple)', bg: 'var(--hd-medical-purple-light)', title: 'Digital Prescriptions', desc: 'Receive and download prescriptions directly from your doctor\u0027s consultation.' },
    { icon: 'bi-shield-check', color: 'var(--hd-medical-teal)', bg: 'var(--hd-medical-teal-light)', title: 'Verified Doctors', desc: 'Every doctor on our platform is verified with proper credentials and certifications.' },
    { icon: 'bi-credit-card-fill', color: '#e67e22', bg: '#fef3e2', title: 'Secure Payments', desc: 'Pay consultation fees securely through Razorpay payment integration.' },
    { icon: 'bi-clipboard2-pulse-fill', color: 'var(--hd-danger)', bg: 'var(--hd-danger-light)', title: 'Symptom Analysis', desc: 'Record your symptoms and receive AI-powered preliminary health assessments.' }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hd-hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7 hd-hero-content">
              <div style={{ maxWidth: 600 }}>
                <span className="hd-badge mb-3" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
                  🏥 Digital Healthcare Platform
                </span>
                <h1 style={{ fontSize: '3.25rem', fontWeight: 900, lineHeight: 1.15, marginBottom: '1.5rem' }}>
                  Your Health, <br />Digitally <span style={{ color: '#a5d8ff' }}>Managed.</span>
                </h1>
                <p style={{ fontSize: '1.175rem', opacity: 0.9, lineHeight: 1.7, marginBottom: '2rem', maxWidth: 480 }}>
                  Maintain your complete medical history, connect with verified doctors,
                  book appointments, and manage your healthcare — all from one platform.
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  <Link to="/register" className="hd-btn hd-btn-lg" style={{ background: 'white', color: 'var(--hd-primary)', fontWeight: 700 }}>
                    Get Started Free <i className="bi bi-arrow-right"></i>
                  </Link>
                  <Link to="/login" className="hd-btn hd-btn-lg hd-glass" style={{ color: 'white', border: '1.5px solid rgba(255,255,255,0.3)' }}>
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-lg-5 d-none d-lg-flex justify-content-center">
              <div className="hd-glass p-4 rounded-4" style={{ maxWidth: 340 }}>
                <div className="text-center mb-3">
                  <i className="bi bi-heart-pulse-fill" style={{ fontSize: '4rem' }}></i>
                  <h3 className="mt-2">HealthDesk</h3>
                </div>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-2 p-2 rounded-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <i className="bi bi-check-circle-fill text-success"></i> Upload Medical Reports
                  </div>
                  <div className="d-flex align-items-center gap-2 p-2 rounded-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <i className="bi bi-check-circle-fill text-success"></i> Find & Book Doctors
                  </div>
                  <div className="d-flex align-items-center gap-2 p-2 rounded-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <i className="bi bi-check-circle-fill text-success"></i> Online Prescriptions
                  </div>
                  <div className="d-flex align-items-center gap-2 p-2 rounded-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <i className="bi bi-check-circle-fill text-success"></i> Secure Payments
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '5rem 0', background: 'var(--hd-bg-body)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800 }}>
              Everything You Need for <span className="hd-text-gradient">Better Healthcare</span>
            </h2>
            <p className="text-muted mt-2" style={{ maxWidth: 600, margin: '0.5rem auto 0' }}>
              HealthDesk brings together patients, doctors, and healthcare management in one seamless platform.
            </p>
          </div>
          <div className="row g-4">
            {features.map((f, i) => (
              <div className="col-md-6 col-lg-4" key={i}>
                <div className="hd-feature-card">
                  <div className="hd-feature-icon" style={{ background: f.bg, color: f.color }}>
                    <i className={`bi ${f.icon}`}></i>
                  </div>
                  <h4 className="mt-3 mb-2">{f.title}</h4>
                  <p className="text-muted mb-0">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '4rem 0', background: 'linear-gradient(135deg, var(--hd-primary-dark), var(--hd-primary))', color: 'white' }}>
        <div className="container text-center">
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Ready to Take Control of Your Health?</h2>
          <p style={{ opacity: 0.9, maxWidth: 500, margin: '0 auto 2rem', fontSize: '1.0625rem' }}>
            Join thousands of patients and doctors who trust HealthDesk for their healthcare needs.
          </p>
          <Link to="/register" className="hd-btn hd-btn-lg" style={{ background: 'white', color: 'var(--hd-primary)', fontWeight: 700, padding: '0.875rem 2.5rem' }}>
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem 0', background: 'var(--hd-gray-900)', color: 'var(--hd-gray-500)' }}>
        <div className="container text-center">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <div className="hd-sidebar-brand-icon" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>H+</div>
            <span className="text-white fw-bold">HealthDesk</span>
          </div>
          <p className="mb-0 small">© {new Date().getFullYear()} HealthDesk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
