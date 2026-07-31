import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const limit = 15;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = { page, limit };
        if (filter) params.status = filter;
        const { data: res } = await adminAPI.getAppointments(params);
        setAppointments(res.data);
        setTotal(res.meta?.total || 0);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, [page, filter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="hd-page-header">
        <div><h1 className="hd-page-title">All Appointments</h1><p className="hd-page-subtitle">Monitor all platform appointments.</p></div>
      </div>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'accepted', 'completed', 'rejected', 'cancelled'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }} className={`hd-btn hd-btn-sm ${filter === s ? 'hd-btn-primary' : 'hd-btn-outline'}`}>{s || 'All'}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="hd-card">
          {appointments.length > 0 ? (
            <div className="table-responsive">
              <table className="hd-table">
                <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Type</th><th>Fee</th><th>Status</th><th>Payment</th></tr></thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td className="fw-semibold">{a.patient_first_name} {a.patient_last_name}</td>
                      <td>Dr. {a.doctor_first_name} {a.doctor_last_name}</td>
                      <td>{a.appointment_date ? new Date(a.appointment_date).toLocaleDateString() : 'TBD'}</td>
                      <td className="text-capitalize">{a.consultation_type}</td>
                      <td>₹{a.consultation_fee || 0}</td>
                      <td><span className={`hd-badge hd-badge-${a.status}`}>{a.status}</span></td>
                      <td><span className={`hd-badge ${a.is_paid ? 'hd-badge-paid' : 'hd-badge-pending'}`}>{a.is_paid ? 'Paid' : 'Unpaid'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="hd-empty-state"><i className="bi bi-calendar d-block"></i><h5>No Appointments</h5></div>}
        </div>
      )}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-4">
          <button className="hd-btn hd-btn-outline hd-btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="d-flex align-items-center px-3 small text-muted">{page}/{totalPages}</span>
          <button className="hd-btn hd-btn-outline hd-btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
