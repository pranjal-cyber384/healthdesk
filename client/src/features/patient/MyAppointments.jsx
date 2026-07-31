import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filter) params.status = filter;
      const { data: res } = await appointmentAPI.list(params);
      setAppointments(res.data);
      setTotal(res.meta?.total || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, [page, filter]);

  const totalPages = Math.ceil(total / limit);
  const statuses = ['', 'pending', 'accepted', 'completed', 'rejected', 'cancelled'];

  return (
    <div>
      <div className="hd-page-header">
        <div>
          <h1 className="hd-page-title">My Appointments</h1>
          <p className="hd-page-subtitle">Track and manage all your appointments.</p>
        </div>
        <Link to="/patient/doctors" className="hd-btn hd-btn-primary"><i className="bi bi-plus-lg"></i> New Appointment</Link>
      </div>

      {/* Filters */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }} className={`hd-btn hd-btn-sm ${filter === s ? 'hd-btn-primary' : 'hd-btn-outline'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="hd-card">
          {appointments.length > 0 ? (
            <div className="table-responsive">
              <table className="hd-table">
                <thead>
                  <tr><th>Doctor</th><th>Specialization</th><th>Date & Time</th><th>Type</th><th>Fee</th><th>Status</th><th>Payment</th><th></th></tr>
                </thead>
                <tbody>
                  {appointments.map(apt => (
                    <tr key={apt.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {apt.doctor_image ? <img src={apt.doctor_image} className="hd-avatar-sm" alt="" /> : <div className="hd-avatar-placeholder" style={{width:32,height:32,fontSize:'0.7rem'}}>{apt.doctor_first_name?.[0]}{apt.doctor_last_name?.[0]}</div>}
                          <span className="fw-semibold">Dr. {apt.doctor_first_name} {apt.doctor_last_name}</span>
                        </div>
                      </td>
                      <td>{apt.specialization || '—'}</td>
                      <td>
                        <div>{apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString() : 'TBD'}</div>
                        <small className="text-muted">{apt.appointment_time || 'TBD'}</small>
                      </td>
                      <td><span className="text-capitalize">{apt.consultation_type}</span></td>
                      <td>₹{apt.consultation_fee || 0}</td>
                      <td><span className={`hd-badge hd-badge-${apt.status}`}>{apt.status}</span></td>
                      <td><span className={`hd-badge ${apt.is_paid ? 'hd-badge-paid' : 'hd-badge-pending'}`}>{apt.is_paid ? 'Paid' : 'Unpaid'}</span></td>
                      <td><Link to={`/patient/appointments/${apt.id}`} className="hd-btn hd-btn-outline hd-btn-sm">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="hd-empty-state"><i className="bi bi-calendar-x d-block"></i><h5>No Appointments</h5><p className="small">Book an appointment with a doctor to get started.</p></div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-4">
          <button className="hd-btn hd-btn-outline hd-btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
          <span className="d-flex align-items-center px-3 small text-muted">Page {page} of {totalPages}</span>
          <button className="hd-btn hd-btn-outline hd-btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
