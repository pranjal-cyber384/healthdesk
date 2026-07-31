import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await adminAPI.getDashboard();
        setData(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <Spinner />;

  const stats = [
    { icon: 'bi-people-fill', label: 'Total Users', value: data?.stats?.totalUsers || 0, color: 'primary', link: '/admin/users' },
    { icon: 'bi-person-badge-fill', label: 'Doctors', value: data?.stats?.totalDoctors || 0, color: 'teal', link: '/admin/doctors' },
    { icon: 'bi-person-fill', label: 'Patients', value: data?.stats?.totalPatients || 0, color: 'info', link: '/admin/users' },
    { icon: 'bi-calendar-check-fill', label: 'Appointments', value: data?.stats?.totalAppointments || 0, color: 'purple', link: '/admin/appointments' },
    { icon: 'bi-cash-stack', label: 'Revenue', value: `₹${data?.stats?.totalRevenue || 0}`, color: 'success', link: '/admin/payments' },
    { icon: 'bi-patch-check-fill', label: 'Pending Verifications', value: data?.stats?.pendingVerifications || 0, color: 'warning', link: '/admin/verifications' }
  ];

  return (
    <div>
      <div className="hd-page-header">
        <div><h1 className="hd-page-title">Admin Dashboard</h1><p className="hd-page-subtitle">Platform overview and management center.</p></div>
      </div>

      {/* Stats Grid */}
      <div className="row g-3 mb-4">
        {stats.map((s, i) => (
          <div className="col-6 col-lg-4 col-xl-2" key={i}>
            <Link to={s.link} className="text-decoration-none">
              <div className="hd-stat-card h-100">
                <div className={`hd-stat-icon ${s.color}`}><i className={`bi ${s.icon}`}></i></div>
                <div><div className="hd-stat-value">{s.value}</div><div className="hd-stat-label">{s.label}</div></div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Recent Users */}
        <div className="col-lg-6">
          <div className="hd-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0"><i className="bi bi-people text-primary me-2"></i>Recent Users</h4>
              <Link to="/admin/users" className="small">View All →</Link>
            </div>
            {data?.recentUsers?.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {data.recentUsers.map(u => (
                  <div key={u.id} className="d-flex align-items-center gap-3 p-2 rounded-3" style={{ background: 'var(--hd-gray-50)' }}>
                    <div className="hd-avatar-placeholder" style={{ width: 36, height: 36, fontSize: '0.75rem' }}>{u.first_name?.[0]}{u.last_name?.[0]}</div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold small">{u.first_name} {u.last_name}</div>
                      <small className="text-muted">{u.email}</small>
                    </div>
                    <span className={`hd-badge ${u.role === 'doctor' ? 'hd-badge-accepted' : u.role === 'admin' ? 'hd-badge-completed' : 'hd-badge-pending'}`}>{u.role}</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-muted text-center py-3">No recent users</div>}
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="col-lg-6">
          <div className="hd-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0"><i className="bi bi-patch-question text-warning me-2"></i>Pending Verifications</h4>
              <Link to="/admin/verifications" className="small">View All →</Link>
            </div>
            {data?.pendingVerifications?.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {data.pendingVerifications.map(v => (
                  <div key={v.id} className="d-flex align-items-center gap-3 p-2 rounded-3" style={{ background: 'var(--hd-warning-light)' }}>
                    <i className="bi bi-person-badge text-warning fs-5"></i>
                    <div className="flex-grow-1"><div className="fw-semibold small">Dr. {v.first_name} {v.last_name}</div><small className="text-muted">{v.specialization}</small></div>
                    <Link to={`/admin/verifications/${v.id}`} className="hd-btn hd-btn-outline hd-btn-sm">Review</Link>
                  </div>
                ))}
              </div>
            ) : <div className="text-muted text-center py-3">No pending verifications</div>}
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="col-lg-6">
          <div className="hd-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0"><i className="bi bi-calendar3 text-info me-2"></i>Recent Appointments</h4>
              <Link to="/admin/appointments" className="small">View All →</Link>
            </div>
            {data?.recentAppointments?.length > 0 ? (
              <div className="table-responsive"><table className="hd-table"><thead><tr><th>Patient</th><th>Doctor</th><th>Status</th></tr></thead><tbody>
                {data.recentAppointments.map(a => (
                  <tr key={a.id}><td className="small">{a.patient_first_name} {a.patient_last_name}</td><td className="small">Dr. {a.doctor_first_name} {a.doctor_last_name}</td><td><span className={`hd-badge hd-badge-${a.status}`}>{a.status}</span></td></tr>
                ))}
              </tbody></table></div>
            ) : <div className="text-muted text-center py-3">No appointments</div>}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="col-lg-6">
          <div className="hd-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0"><i className="bi bi-cash text-success me-2"></i>Recent Payments</h4>
              <Link to="/admin/payments" className="small">View All →</Link>
            </div>
            {data?.recentPayments?.length > 0 ? (
              <div className="table-responsive"><table className="hd-table"><thead><tr><th>Patient</th><th>Amount</th><th>Status</th></tr></thead><tbody>
                {data.recentPayments.map(p => (
                  <tr key={p.id}><td className="small">{p.patient_first_name} {p.patient_last_name}</td><td className="fw-bold">₹{p.amount}</td><td><span className={`hd-badge ${p.status === 'paid' ? 'hd-badge-paid' : 'hd-badge-pending'}`}>{p.status}</span></td></tr>
                ))}
              </tbody></table></div>
            ) : <div className="text-muted text-center py-3">No payments</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
