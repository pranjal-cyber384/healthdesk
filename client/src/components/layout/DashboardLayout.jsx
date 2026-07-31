/**
 * Dashboard Layout
 * 
 * Main layout wrapper with sidebar navigation and top bar.
 * Used for all authenticated pages (patient, doctor, admin).
 */

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NAV_CONFIG = {
  patient: {
    title: 'Patient',
    sections: [
      {
        label: 'Main',
        items: [
          { path: '/patient/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
          { path: '/patient/profile', icon: 'bi-person-fill', label: 'My Profile' },
          { path: '/patient/medical-history', icon: 'bi-file-medical-fill', label: 'Medical History' },
          { path: '/patient/symptoms', icon: 'bi-clipboard2-pulse-fill', label: 'Symptoms' }
        ]
      },
      {
        label: 'Healthcare',
        items: [
          { path: '/patient/doctors', icon: 'bi-hospital-fill', label: 'Find Doctors' },
          { path: '/patient/appointments', icon: 'bi-calendar-check-fill', label: 'Appointments' },
          { path: '/patient/prescriptions', icon: 'bi-prescription2', label: 'Prescriptions' },
          { path: '/patient/payments', icon: 'bi-credit-card-fill', label: 'Payments' }
        ]
      },
      {
        label: 'Other',
        items: [
          { path: '/patient/emergency', icon: 'bi-telephone-fill', label: 'Emergency' }
        ]
      }
    ]
  },
  doctor: {
    title: 'Doctor',
    sections: [
      {
        label: 'Main',
        items: [
          { path: '/doctor/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
          { path: '/doctor/profile', icon: 'bi-person-fill', label: 'My Profile' },
          { path: '/doctor/verification', icon: 'bi-patch-check-fill', label: 'Verification' }
        ]
      },
      {
        label: 'Practice',
        items: [
          { path: '/doctor/appointments', icon: 'bi-calendar-check-fill', label: 'Appointments' },
          { path: '/doctor/patients', icon: 'bi-people-fill', label: 'My Patients' }
        ]
      }
    ]
  },
  admin: {
    title: 'Admin',
    sections: [
      {
        label: 'Main',
        items: [
          { path: '/admin/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' }
        ]
      },
      {
        label: 'Management',
        items: [
          { path: '/admin/users', icon: 'bi-people-fill', label: 'Users' },
          { path: '/admin/doctors', icon: 'bi-person-badge-fill', label: 'Doctors' },
          { path: '/admin/verifications', icon: 'bi-patch-check-fill', label: 'Verifications' }
        ]
      },
      {
        label: 'Monitoring',
        items: [
          { path: '/admin/appointments', icon: 'bi-calendar3', label: 'Appointments' },
          { path: '/admin/payments', icon: 'bi-cash-stack', label: 'Payments' },
          { path: '/admin/audit-logs', icon: 'bi-journal-text', label: 'Audit Logs' }
        ]
      }
    ]
  }
};

export default function DashboardLayout({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const config = NAV_CONFIG[role] || NAV_CONFIG.patient;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = () => {
    const first = user?.first_name?.[0] || user?.firstName?.[0] || '';
    const last = user?.last_name?.[0] || user?.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <div className="d-flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1049 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`hd-sidebar ${sidebarOpen ? 'show' : ''}`}>
        <div className="hd-sidebar-brand">
          <div className="hd-sidebar-brand-icon">H+</div>
          <span className="hd-sidebar-brand-text">HealthDesk</span>
        </div>

        <nav className="hd-sidebar-nav">
          {config.sections.map((section, idx) => (
            <React.Fragment key={idx}>
              <div className="hd-sidebar-section">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `hd-sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </React.Fragment>
          ))}
        </nav>

        <div className="hd-sidebar-footer">
          <div className="d-flex align-items-center gap-2">
            {user?.profile_image_url || user?.profileImageUrl ? (
              <img src={user.profile_image_url || user.profileImageUrl} alt="Profile" className="hd-avatar-sm rounded-circle" style={{width:32,height:32,objectFit:'cover'}} />
            ) : (
              <div className="hd-avatar-placeholder" style={{width:32,height:32,fontSize:'0.75rem'}}>{getInitials()}</div>
            )}
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="text-white fw-semibold small hd-truncate">
                {user?.first_name || user?.firstName} {user?.last_name || user?.lastName}
              </div>
              <div className="text-muted small text-capitalize">{role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="hd-main flex-grow-1">
        {/* Top Bar */}
        <header className="hd-topbar">
          <div className="hd-topbar-left">
            <button
              className="btn btn-link text-dark d-lg-none p-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <i className="bi bi-list fs-4"></i>
            </button>
            <h1 className="hd-topbar-title d-none d-md-block">
              {config.title} Panel
            </h1>
          </div>
          <div className="hd-topbar-right">
            <span className="hd-badge hd-badge-accepted text-capitalize">{role}</span>
            <button
              onClick={handleLogout}
              className="hd-btn hd-btn-outline hd-btn-sm"
              title="Logout"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="hd-content hd-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
