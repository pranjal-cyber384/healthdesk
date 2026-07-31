import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { appointmentAPI, prescriptionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

export default function ConsultationPage() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prescForm, setPrescForm] = useState({ diagnosis: '', medications: '', instructions: '', notes: '' });
  const [showPrescForm, setShowPrescForm] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await appointmentAPI.getById(id);
        setAppointment(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await prescriptionAPI.create((() => {
        const fd = new FormData();
        fd.append('appointmentId', id);
        fd.append('patientId', appointment.patient_id);
        fd.append('diagnosis', prescForm.diagnosis);
        fd.append('medications', prescForm.medications);
        if (prescForm.instructions) fd.append('instructions', prescForm.instructions);
        if (prescForm.notes) fd.append('notes', prescForm.notes);
        return fd;
      })());
      toast.success('Prescription created');
      setShowPrescForm(false);
      // Refresh
      const { data: res } = await appointmentAPI.getById(id);
      setAppointment(res.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create prescription'); }
    setSaving(false);
  };

  const handleComplete = async () => {
    if (!window.confirm('Mark as completed?')) return;
    try {
      await appointmentAPI.complete(id);
      toast.success('Consultation completed');
      const { data: res } = await appointmentAPI.getById(id);
      setAppointment(res.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <Spinner />;
  if (!appointment) return <div className="hd-card"><div className="hd-empty-state"><h5>Appointment Not Found</h5></div></div>;

  const apt = appointment;

  return (
    <div>
      <div className="mb-3"><Link to="/doctor/appointments" className="text-muted small"><i className="bi bi-arrow-left me-1"></i>Back to Appointments</Link></div>

      <div className="hd-page-header">
        <div>
          <h1 className="hd-page-title">Consultation</h1>
          <p className="hd-page-subtitle">Appointment #{apt.id} • {apt.consultation_type === 'online' ? 'Online' : 'In-Person'}</p>
        </div>
        <div className="d-flex gap-2">
          {apt.status === 'accepted' && !apt.prescription && <button className="hd-btn hd-btn-primary" onClick={() => setShowPrescForm(true)}><i className="bi bi-prescription2"></i> Write Prescription</button>}
          {apt.status === 'accepted' && <button className="hd-btn hd-btn-success" onClick={handleComplete}><i className="bi bi-check-lg"></i> Complete</button>}
        </div>
      </div>

      <div className="row g-4">
        {/* Patient Info */}
        <div className="col-lg-4">
          <div className="hd-card">
            <h5 className="mb-3">Patient Information</h5>
            <div className="text-center mb-3">
              {apt.patient_image ? <img src={apt.patient_image} className="hd-avatar-xl" alt="" /> : <div className="hd-avatar-placeholder xl mx-auto">{apt.patient_first_name?.[0]}{apt.patient_last_name?.[0]}</div>}
              <h5 className="mt-2 mb-0">{apt.patient_first_name} {apt.patient_last_name}</h5>
            </div>
            <div className="d-flex flex-column gap-2">
              {apt.patient_email && <div className="small"><i className="bi bi-envelope me-2"></i>{apt.patient_email}</div>}
              {apt.patient_phone && <div className="small"><i className="bi bi-telephone me-2"></i>{apt.patient_phone}</div>}
            </div>
            <hr />
            <div className="d-flex flex-column gap-2">
              <div className="d-flex justify-content-between"><span className="text-muted">Status</span><span className={`hd-badge hd-badge-${apt.status}`}>{apt.status}</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Date</span><span>{apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString() : 'TBD'}</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Time</span><span>{apt.appointment_time || 'TBD'}</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Fee</span><span className="fw-bold text-success">₹{apt.consultation_fee || 0}</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Payment</span><span className={`hd-badge ${apt.is_paid ? 'hd-badge-paid' : 'hd-badge-pending'}`}>{apt.is_paid ? 'Paid' : 'Unpaid'}</span></div>
            </div>
            {apt.reason && (<><hr /><div className="small text-muted mb-1">Patient's Reason</div><p className="small mb-0">{apt.reason}</p></>)}
            <hr />
            <Link to={`/doctor/patients/${apt.patient_id}/history`} className="hd-btn hd-btn-outline hd-btn-block hd-btn-sm"><i className="bi bi-file-medical"></i> View Full History</Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-lg-8">
          {/* Existing Prescription */}
          {apt.prescription && (
            <div className="hd-card mb-4">
              <h4 className="mb-3"><i className="bi bi-prescription2 text-primary me-2"></i>Prescription</h4>
              <div className="row g-3">
                <div className="col-md-6"><div className="small text-muted">Diagnosis</div><p className="fw-semibold">{apt.prescription.diagnosis}</p></div>
                <div className="col-md-6"><div className="small text-muted">Medications</div><p style={{ whiteSpace: 'pre-line' }}>{apt.prescription.medications}</p></div>
                {apt.prescription.instructions && <div className="col-12"><div className="small text-muted">Instructions</div><p>{apt.prescription.instructions}</p></div>}
                {apt.prescription.notes && <div className="col-12"><div className="small text-muted">Notes</div><p>{apt.prescription.notes}</p></div>}
              </div>
            </div>
          )}

          {/* Prescription Form */}
          {showPrescForm && (
            <div className="hd-card mb-4 hd-fade-in">
              <h4 className="mb-3"><i className="bi bi-pencil-square text-primary me-2"></i>Write Prescription</h4>
              <form onSubmit={handleCreatePrescription}>
                <div className="hd-form-group"><label className="hd-form-label">Diagnosis *</label><textarea className="hd-form-control" rows="3" required value={prescForm.diagnosis} onChange={(e) => setPrescForm({...prescForm, diagnosis: e.target.value})} placeholder="Enter diagnosis..."></textarea></div>
                <div className="hd-form-group"><label className="hd-form-label">Medications *</label><textarea className="hd-form-control" rows="4" required value={prescForm.medications} onChange={(e) => setPrescForm({...prescForm, medications: e.target.value})} placeholder="List medications, dosage, and duration..."></textarea></div>
                <div className="hd-form-group"><label className="hd-form-label">Instructions</label><textarea className="hd-form-control" rows="2" value={prescForm.instructions} onChange={(e) => setPrescForm({...prescForm, instructions: e.target.value})} placeholder="Special instructions for the patient..."></textarea></div>
                <div className="hd-form-group"><label className="hd-form-label">Notes</label><textarea className="hd-form-control" rows="2" value={prescForm.notes} onChange={(e) => setPrescForm({...prescForm, notes: e.target.value})} placeholder="Additional notes..."></textarea></div>
                <div className="d-flex gap-2">
                  <button type="button" className="hd-btn hd-btn-outline" onClick={() => setShowPrescForm(false)}>Cancel</button>
                  <button type="submit" className="hd-btn hd-btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Prescription'}</button>
                </div>
              </form>
            </div>
          )}

          {/* Notes Section */}
          {!showPrescForm && !apt.prescription && apt.status === 'completed' && (
            <div className="hd-card"><div className="hd-empty-state"><i className="bi bi-prescription2 d-block"></i><h5>No Prescription Written</h5><p className="small">This consultation was completed without a prescription.</p></div></div>
          )}
        </div>
      </div>
    </div>
  );
}
