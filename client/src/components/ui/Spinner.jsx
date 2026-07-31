/**
 * Spinner Component — Loading indicator
 */
import React from 'react';

export default function Spinner({ fullPage = false, size = 'md', text = 'Loading...' }) {
  if (fullPage) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100">
        <div className="hd-spinner" style={size === 'lg' ? { width: 56, height: 56 } : {}}></div>
        {text && <p className="mt-3 text-muted">{text}</p>}
      </div>
    );
  }

  return (
    <div className="hd-spinner-container">
      <div className="hd-spinner" style={size === 'sm' ? { width: 24, height: 24 } : {}}></div>
    </div>
  );
}
