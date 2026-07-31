import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function DoctorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await doctorAPI.getDashboard();
        setData(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <Spinner />;

  const stats = [
    { icon: 'bi-people-fill', label: 'Total Patients', value: data?.stats?.total_patients || 0, color: 'primary' },
    { icon: 'bi-calendar-check-fill', label: 'Total Appointments', value: data?.stats?.total_appointments || 0, color: 'teal' },
    { icon: 'bi-clock-fill', label: 'Pending Requests', value: data?.stats?.pending_appointments || 0, color: 'warning' },
    { icon: 'bi-cash-stack', label: 'Total Earnings', value: `₹${data?.stats?.total_earnings || 0}`, color: 'success' }
  ];

  return (
    <div>
      <div className="hd-page-header">
        <div>
          <h1 className="hd-page-title">Dashboard</h1>
          <p className="hd-page-subtitle">Welcome back, Doctor. Here's your practice overview.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {stats.map((s, i) => (
          <div className="col-6 col-lg-3" key={i}>
            <div className="hd-stat-card">
              <div className={`hd-stat-icon ${s.color}`}><i className={`bi ${s.icon}`}></i></div>
              <div><div className="hd-stat-value">{s.value}</div><div className="hd-stat-label">{s.label}</div></div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Today's Appointments */}
        <div className="col-lg-6">
          <div className="hd-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0"><i className="bi bi-calendar-day text-primary me-2"></i>Today's Patients</h4>
              <span className="hd-badge hd-badge-accepted">{data?.todayAppointments?.length || 0}</span>
            </div>
            {data?.todayAppointments?.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {data.todayAppointments.map(apt => (
                  <div key={apt.id} className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'var(--hd-gray-50)' }}>
                    <div className="hd-avatar-placeholder" style={{ width: 40, height: 40, fontSize: '0.8rem' }}>
                      {apt.patient_first_name?.[0]}{apt.patient_last_name?.[0]}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{apt.patient_first_name} {apt.patient_last_name}</div>
                      <small className="text-muted">{apt.appointment_time}</small>
                    </div>
                    <Link to={`/doctor/appointments/${apt.id}/consultation`} className="hd-btn hd-btn-primary hd-btn-sm">Consult</Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted py-4"><i className="bi bi-calendar-check d-block fs-3 mb-2"></i>No appointments today</div>
            )}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="col-lg-6">
          <div className="hd-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0"><i className="bi bi-inbox text-warning me-2"></i>Pending Requests</h4>
              <Link to="/doctor/appointments" className="small">View All →</Link>
            </div>
            {data?.pendingRequests?.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {data.pendingRequests.slice(0, 5).map(apt => (
                  <div key={apt.id} className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'var(--hd-warning-light)' }}>
                    <div className="hd-avatar-placeholder" style={{ width: 40, height: 40, fontSize: '0.8rem' }}>
                      {apt.patient_first_name?.[0]}{apt.patient_last_name?.[0]}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{apt.patient_first_name} {apt.patient_last_name}</div>
                      <small className="text-muted">Requested {new Date(apt.created_at).toLocaleDateString()}</small>
                    </div>
                    <span className="hd-badge hd-badge-pending">Pending</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted py-4"><i className="bi bi-inbox d-block fs-3 mb-2"></i>No pending requests</div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="col-lg-7">
          <div className="hd-card">
            <h4 className="mb-3"><i className="bi bi-calendar-week text-info me-2"></i>Upcoming Appointments</h4>
            {data?.upcomingAppointments?.length > 0 ? (
              <div className="table-responsive">
                <table className="hd-table">
                  <thead><tr><th>Patient</th><th>Date</th><th>Time</th><th></th></tr></thead>
                  <tbody>
                    {data.upcomingAppointments.map(apt => (
                      <tr key={apt.id}>
                        <td className="fw-semibold">{apt.patient_first_name} {apt.patient_last_name}</td>
                        <td>{new Date(apt.appointment_date).toLocaleDateString()}</td>
                        <td>{apt.appointment_time}</td>
                        <td><Link to={`/doctor/appointments/${apt.id}/consultation`} className="hd-btn hd-btn-outline hd-btn-sm">View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted text-center py-3">No upcoming appointments</div>
            )}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="col-lg-5">
          <div className="hd-card">
            <h4 className="mb-3"><i className="bi bi-person-check text-success me-2"></i>Recent Patients</h4>
            {data?.recentPatients?.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {data.recentPatients.map(p => (
                  <div key={p.id} className="d-flex align-items-center gap-3 p-2 rounded">
                    {p.profile_image_url ? <img src={p.profile_image_url} className="hd-avatar-sm" alt="" /> : <div className="hd-avatar-placeholder" style={{width:32,height:32,fontSize:'0.7rem'}}>{p.first_name?.[0]}{p.last_name?.[0]}</div>}
                    <div className="flex-grow-1"><div className="fw-semibold small">{p.first_name} {p.last_name}</div><small className="text-muted">Last visit: {p.last_visit ? new Date(p.last_visit).toLocaleDateString() : '—'}</small></div>
                    <Link to={`/doctor/patients/${p.id}/history`} className="hd-btn hd-btn-outline hd-btn-sm">History</Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted text-center py-3">No recent patients</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
