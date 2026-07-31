import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionModal, setActionModal] = useState(null);
  const [actionForm, setActionForm] = useState({ appointmentDate: '', appointmentTime: '', rejectionReason: '' });
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

  const handleAccept = async (id) => {
    if (!actionForm.appointmentDate || !actionForm.appointmentTime) { toast.error('Please set date and time'); return; }
    try {
      await appointmentAPI.accept(id, { appointmentDate: actionForm.appointmentDate, appointmentTime: actionForm.appointmentTime });
      toast.success('Appointment accepted');
      setActionModal(null);
      fetchAppointments();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReject = async (id) => {
    try {
      await appointmentAPI.reject(id, { rejectionReason: actionForm.rejectionReason || 'Not available' });
      toast.success('Appointment rejected');
      setActionModal(null);
      fetchAppointments();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('Mark this appointment as completed?')) return;
    try {
      await appointmentAPI.complete(id);
      toast.success('Appointment completed');
      fetchAppointments();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const totalPages = Math.ceil(total / limit);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="hd-page-header">
        <div><h1 className="hd-page-title">Appointments</h1><p className="hd-page-subtitle">Manage appointment requests and consultations.</p></div>
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
                <thead><tr><th>Patient</th><th>Date & Time</th><th>Type</th><th>Fee</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {appointments.map(apt => (
                    <tr key={apt.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="hd-avatar-placeholder" style={{width:32,height:32,fontSize:'0.7rem'}}>{apt.patient_first_name?.[0]}{apt.patient_last_name?.[0]}</div>
                          <span className="fw-semibold">{apt.patient_first_name} {apt.patient_last_name}</span>
                        </div>
                      </td>
                      <td><div>{apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString() : 'TBD'}</div><small className="text-muted">{apt.appointment_time || 'TBD'}</small></td>
                      <td className="text-capitalize">{apt.consultation_type}</td>
                      <td>₹{apt.consultation_fee || 0}</td>
                      <td><span className={`hd-badge hd-badge-${apt.status}`}>{apt.status}</span></td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {apt.status === 'pending' && (
                            <>
                              <button className="hd-btn hd-btn-success hd-btn-sm" onClick={() => { setActionModal({ type: 'accept', id: apt.id }); setActionForm({ appointmentDate: '', appointmentTime: '', rejectionReason: '' }); }}>Accept</button>
                              <button className="hd-btn hd-btn-danger hd-btn-sm" onClick={() => { setActionModal({ type: 'reject', id: apt.id }); setActionForm({ ...actionForm, rejectionReason: '' }); }}>Reject</button>
                            </>
                          )}
                          {apt.status === 'accepted' && (
                            <>
                              <Link to={`/doctor/appointments/${apt.id}/consultation`} className="hd-btn hd-btn-primary hd-btn-sm">Consult</Link>
                              <button className="hd-btn hd-btn-outline hd-btn-sm" onClick={() => handleComplete(apt.id)}>Complete</button>
                            </>
                          )}
                          {apt.status === 'completed' && <Link to={`/doctor/appointments/${apt.id}/consultation`} className="hd-btn hd-btn-outline hd-btn-sm">View</Link>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="hd-empty-state"><i className="bi bi-calendar-x d-block"></i><h5>No Appointments</h5></div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-4">
          <button className="hd-btn hd-btn-outline hd-btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="d-flex align-items-center px-3 small text-muted">{page}/{totalPages}</span>
          <button className="hd-btn hd-btn-outline hd-btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 2000 }}>
          <div className="bg-white rounded-4 p-4" style={{ maxWidth: 440, width: '90%' }}>
            {actionModal.type === 'accept' ? (
              <>
                <h4 className="mb-3">Accept Appointment</h4>
                <div className="hd-form-group"><label className="hd-form-label">Appointment Date *</label><input type="date" className="hd-form-control" min={today} value={actionForm.appointmentDate} onChange={(e) => setActionForm({...actionForm, appointmentDate: e.target.value})} required /></div>
                <div className="hd-form-group"><label className="hd-form-label">Appointment Time *</label><input type="time" className="hd-form-control" value={actionForm.appointmentTime} onChange={(e) => setActionForm({...actionForm, appointmentTime: e.target.value})} required /></div>
                <div className="d-flex gap-2"><button className="hd-btn hd-btn-outline flex-fill" onClick={() => setActionModal(null)}>Cancel</button><button className="hd-btn hd-btn-success flex-fill" onClick={() => handleAccept(actionModal.id)}>Accept</button></div>
              </>
            ) : (
              <>
                <h4 className="mb-3">Reject Appointment</h4>
                <div className="hd-form-group"><label className="hd-form-label">Reason</label><textarea className="hd-form-control" rows="3" placeholder="Reason for rejection..." value={actionForm.rejectionReason} onChange={(e) => setActionForm({...actionForm, rejectionReason: e.target.value})}></textarea></div>
                <div className="d-flex gap-2"><button className="hd-btn hd-btn-outline flex-fill" onClick={() => setActionModal(null)}>Cancel</button><button className="hd-btn hd-btn-danger flex-fill" onClick={() => handleReject(actionModal.id)}>Reject</button></div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
