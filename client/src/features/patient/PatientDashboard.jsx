import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: res } = await patientAPI.getDashboard();
        setData(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  if (loading) return <Spinner />;

  const stats = [
    { icon: 'bi-calendar-check-fill', label: 'Upcoming', value: data?.upcomingAppointments?.length || 0, color: 'primary' },
    { icon: 'bi-prescription2', label: 'Prescriptions', value: data?.recentPrescriptions?.length || 0, color: 'purple' },
    { icon: 'bi-file-medical-fill', label: 'Reports', value: data?.recentReports?.length || 0, color: 'teal' },
    { icon: 'bi-bell-fill', label: 'Notifications', value: data?.unreadNotifications || 0, color: 'warning' }
  ];

  return (
    <div>
      <div className="hd-page-header">
        <div>
          <h1 className="hd-page-title">Dashboard</h1>
          <p className="hd-page-subtitle">Welcome back! Here's your health overview.</p>
        </div>
        <Link to="/patient/doctors" className="hd-btn hd-btn-primary">
          <i className="bi bi-search"></i> Find a Doctor
        </Link>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {stats.map((s, i) => (
          <div className="col-6 col-lg-3" key={i}>
            <div className="hd-stat-card">
              <div className={`hd-stat-icon ${s.color}`}><i className={`bi ${s.icon}`}></i></div>
              <div>
                <div className="hd-stat-value">{s.value}</div>
                <div className="hd-stat-label">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Upcoming Appointments */}
        <div className="col-lg-7">
          <div className="hd-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Upcoming Appointments</h4>
              <Link to="/patient/appointments" className="small">View All →</Link>
            </div>
            {data?.upcomingAppointments?.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {data.upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'var(--hd-gray-50)' }}>
                    <div className="hd-avatar-placeholder lg">
                      {apt.doctor_first_name?.[0]}{apt.doctor_last_name?.[0]}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold">Dr. {apt.doctor_first_name} {apt.doctor_last_name}</div>
                      <div className="small text-muted">{apt.specialization || 'General'}</div>
                    </div>
                    <div className="text-end">
                      <div className="small fw-semibold">{apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString() : 'TBD'}</div>
                      <div className="small text-muted">{apt.appointment_time || 'TBD'}</div>
                    </div>
                    <span className={`hd-badge hd-badge-${apt.status}`}>{apt.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="hd-empty-state">
                <i className="bi bi-calendar-x d-block"></i>
                <h5>No Upcoming Appointments</h5>
                <p className="small">Book an appointment with a doctor to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="col-lg-5">
          <div className="hd-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Recent Prescriptions</h4>
              <Link to="/patient/prescriptions" className="small">View All →</Link>
            </div>
            {data?.recentPrescriptions?.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {data.recentPrescriptions.map((p) => (
                  <div key={p.id} className="d-flex align-items-center gap-3 p-2 rounded" style={{ background: 'var(--hd-gray-50)' }}>
                    <div className="hd-stat-icon purple" style={{ width: 40, height: 40, fontSize: '1rem' }}>
                      <i className="bi bi-prescription2"></i>
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="fw-semibold small hd-truncate">Dr. {p.doctor_first_name} {p.doctor_last_name}</div>
                      <div className="text-muted small">{new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="hd-empty-state py-4">
                <i className="bi bi-prescription2 d-block" style={{ fontSize: '2rem' }}></i>
                <p className="small mt-2 mb-0">No prescriptions yet</p>
              </div>
            )}
          </div>

          {/* Payment Stats */}
          <div className="hd-card mt-4">
            <h4 className="mb-3">Payment Summary</h4>
            <div className="d-flex gap-3">
              <div className="flex-fill p-3 rounded-3 text-center" style={{ background: 'var(--hd-success-light)' }}>
                <div className="fw-bold fs-5 text-success">₹{data?.paymentStats?.totalSpent || 0}</div>
                <div className="small text-muted">Total Spent</div>
              </div>
              <div className="flex-fill p-3 rounded-3 text-center" style={{ background: 'var(--hd-primary-light)' }}>
                <div className="fw-bold fs-5 text-primary">{data?.paymentStats?.totalPayments || 0}</div>
                <div className="small text-muted">Payments Made</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
