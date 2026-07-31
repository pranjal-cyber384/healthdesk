import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doctorAPI, appointmentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ consultationType: 'offline', preferredDate: '', preferredTime: '', reason: '' });

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await doctorAPI.getById(doctorId);
        setDoctor(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, [doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await appointmentAPI.create({
        doctorId: parseInt(doctorId),
        consultationType: form.consultationType,
        preferredDate: form.preferredDate || undefined,
        preferredTime: form.preferredTime || undefined,
        reason: form.reason || undefined
      });
      toast.success('Appointment request sent successfully!');
      navigate('/patient/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    }
    setSubmitting(false);
  };

  if (loading) return <Spinner />;
  if (!doctor) return <div className="hd-card"><div className="hd-empty-state"><h5>Doctor not found</h5><Link to="/patient/doctors" className="hd-btn hd-btn-primary mt-3">Back</Link></div></div>;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="mb-3"><Link to={`/patient/doctors/${doctorId}`} className="text-muted small"><i className="bi bi-arrow-left me-1"></i>Back to Doctor Profile</Link></div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="hd-card">
            <h3 className="mb-1">Book Appointment</h3>
            <p className="text-muted mb-4">Fill in the details below to request an appointment.</p>

            <form onSubmit={handleSubmit}>
              <div className="hd-form-group">
                <label className="hd-form-label">Consultation Type</label>
                <div className="d-flex gap-3">
                  <label className={`flex-fill p-3 rounded-3 border text-center ${form.consultationType === 'offline' ? 'border-primary bg-primary bg-opacity-10' : ''}`} style={{ cursor: 'pointer' }}>
                    <input type="radio" name="type" className="d-none" value="offline" checked={form.consultationType === 'offline'} onChange={(e) => setForm({ ...form, consultationType: e.target.value })} />
                    <i className="bi bi-hospital d-block fs-4 mb-1 text-primary"></i>
                    <div className="fw-semibold">In-Person</div>
                    <div className="small text-muted">Visit the clinic</div>
                  </label>
                  <label className={`flex-fill p-3 rounded-3 border text-center ${form.consultationType === 'online' ? 'border-primary bg-primary bg-opacity-10' : ''}`} style={{ cursor: 'pointer' }}>
                    <input type="radio" name="type" className="d-none" value="online" checked={form.consultationType === 'online'} onChange={(e) => setForm({ ...form, consultationType: e.target.value })} />
                    <i className="bi bi-camera-video d-block fs-4 mb-1 text-primary"></i>
                    <div className="fw-semibold">Online</div>
                    <div className="small text-muted">Video consultation</div>
                  </label>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="hd-form-group">
                    <label className="hd-form-label">Preferred Date (Optional)</label>
                    <input type="date" className="hd-form-control" min={today} value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} />
                    <small className="text-muted">Doctor will confirm the final date</small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="hd-form-group">
                    <label className="hd-form-label">Preferred Time (Optional)</label>
                    <input type="time" className="hd-form-control" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="hd-form-group">
                <label className="hd-form-label">Reason for Visit</label>
                <textarea className="hd-form-control" rows="4" placeholder="Describe your symptoms or reason for visiting..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}></textarea>
              </div>

              <button type="submit" className="hd-btn hd-btn-primary hd-btn-lg" disabled={submitting}>
                {submitting ? <><span className="spinner-border spinner-border-sm"></span> Sending Request...</> : <><i className="bi bi-calendar-check"></i> Request Appointment</>}
              </button>
            </form>
          </div>
        </div>

        {/* Doctor Summary Sidebar */}
        <div className="col-lg-4">
          <div className="hd-card">
            <div className="text-center mb-3">
              {doctor.profile_image_url ? (
                <img src={doctor.profile_image_url} alt="Doctor" className="hd-avatar-xl mx-auto" />
              ) : (
                <div className="hd-avatar-placeholder xl mx-auto">{doctor.first_name?.[0]}{doctor.last_name?.[0]}</div>
              )}
              <h5 className="mt-2 mb-0">Dr. {doctor.first_name} {doctor.last_name}</h5>
              <p className="text-muted small">{doctor.specialization}</p>
            </div>
            <div className="d-flex flex-column gap-2">
              {doctor.hospital_name && <div className="small"><i className="bi bi-hospital text-primary me-2"></i>{doctor.hospital_name}</div>}
              <div className="small"><i className="bi bi-briefcase text-muted me-2"></i>{doctor.experience_years || 0} years experience</div>
              <div className="small"><i className="bi bi-star-fill text-warning me-2"></i>Verified Doctor</div>
            </div>
            <hr />
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted">Consultation Fee</span>
              <span className="fs-5 fw-bold text-success">₹{doctor.consultation_fee || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
