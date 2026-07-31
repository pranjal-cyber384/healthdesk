import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ background: 'var(--hd-bg-body)' }}>
      <div className="text-center" style={{ maxWidth: 480 }}>
        <div style={{ fontSize: '8rem', fontWeight: 900, lineHeight: 1, color: 'var(--hd-gray-300)' }}>404</div>
        <h2 className="mt-3 mb-2">Page Not Found</h2>
        <p className="text-muted mb-4">The page you're looking for doesn't exist or has been moved.</p>
        <div className="d-flex gap-3 justify-content-center">
          <Link to="/" className="hd-btn hd-btn-primary">
            <i className="bi bi-house-fill"></i> Go Home
          </Link>
          <button className="hd-btn hd-btn-outline" onClick={() => window.history.back()}>
            <i className="bi bi-arrow-left"></i> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
