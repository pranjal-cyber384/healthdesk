import React, { useState, useEffect } from 'react';
import { doctorAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function DoctorProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [availSlot, setAvailSlot] = useState({ dayOfWeek: 'monday', startTime: '09:00', endTime: '17:00', maxPatients: 10 });

  const fetchProfile = async () => {
    try {
      const { data: res } = await doctorAPI.getById(user?.id);
      setProfile(res.data);
      setForm(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await doctorAPI.updateProfile({
        firstName: form.first_name, lastName: form.last_name, phone: form.phone,
        specialization: form.specialization, qualification: form.qualification,
        experienceYears: form.experience_years, hospitalName: form.hospital_name,
        hospitalAddress: form.hospital_address, clinicAddress: form.clinic_address,
        consultationFee: form.consultation_fee, biography: form.biography,
        licenseNumber: form.license_number, upiId: form.upi_id,
        isAvailable: form.is_available
      });
      updateUser({ first_name: form.first_name, last_name: form.last_name });
      toast.success('Profile updated');
      setEditing(false);
      fetchProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    setSaving(false);
  };

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    try {
      await doctorAPI.setAvailability(availSlot);
      toast.success('Availability slot added');
      fetchProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add slot'); }
  };

  const handleDeleteSlot = async (id) => {
    try {
      await doctorAPI.deleteAvailability(id);
      toast.success('Slot removed');
      fetchProfile();
    } catch (err) { toast.error('Failed to remove'); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profileImage', file);
    try {
      await doctorAPI.uploadProfileImage(formData);
      toast.success('Image updated');
      fetchProfile();
    } catch { toast.error('Failed to upload image'); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="hd-page-header">
        <div>
          <h1 className="hd-page-title">My Profile</h1>
          <p className="hd-page-subtitle">Manage your professional profile and availability.</p>
        </div>
        {!editing && <button className="hd-btn hd-btn-primary" onClick={() => setEditing(true)}><i className="bi bi-pencil-fill"></i> Edit</button>}
      </div>

      {/* Verification Status Banner */}
      {profile?.verification_status !== 'approved' && (
        <div className={`alert ${profile?.verification_status === 'pending' ? 'alert-warning' : 'alert-danger'} d-flex align-items-center gap-2 mb-4`}>
          <i className={`bi ${profile?.verification_status === 'pending' ? 'bi-clock' : 'bi-exclamation-triangle'}`}></i>
          <span>Your profile is <strong>{profile?.verification_status}</strong>. {profile?.verification_status === 'pending' ? 'Verification is in progress.' : 'Please submit verification documents.'}</span>
        </div>
      )}

      <div className="hd-card mb-4">
        <div className="d-flex align-items-center gap-4 flex-wrap">

          <div className="position-relative">

            <img
              src={profile?.profile_image_url || "/default-doctor.png"}
              alt="Doctor"
              className="hd-avatar-2xl"
            />

            {editing && (
              <label
                className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 34,
                  height: 34,
                  cursor: "pointer"
                }}
              >
                <i className="bi bi-camera-fill"></i>

                <input
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={handleImageUpload}
                />
              </label>
            )}

          </div>

          <div>
            <h3>
              {profile?.first_name} {profile?.last_name}
            </h3>

            <p className="text-muted">
              {profile?.email}
            </p>

            <p className="text-primary">
              {profile?.specialization}
            </p>
          </div>

        </div>
      </div>




      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Professional Info */}
          <div className="col-lg-6">
            <div className="hd-card h-100">
              <h4 className="mb-3"><i className="bi bi-person-badge text-primary me-2"></i>Professional Information</h4>
              <div className="row g-3">
                <div className="col-6"><label className="hd-form-label">First Name</label><input name="first_name" className="hd-form-control" value={form.first_name || ''} onChange={handleChange} disabled={!editing} /></div>
                <div className="col-6"><label className="hd-form-label">Last Name</label><input name="last_name" className="hd-form-control" value={form.last_name || ''} onChange={handleChange} disabled={!editing} /></div>
                <div className="col-6"><label className="hd-form-label">Specialization</label><input name="specialization" className="hd-form-control" value={form.specialization || ''} onChange={handleChange} disabled={!editing} /></div>
                <div className="col-6"><label className="hd-form-label">Qualification</label><input name="qualification" className="hd-form-control" value={form.qualification || ''} onChange={handleChange} disabled={!editing} /></div>
                <div className="col-6"><label className="hd-form-label">Experience (Years)</label><input name="experience_years" type="number" className="hd-form-control" value={form.experience_years || ''} onChange={handleChange} disabled={!editing} /></div>
                <div className="col-6"><label className="hd-form-label">License Number</label><input name="license_number" className="hd-form-control" value={form.license_number || ''} onChange={handleChange} disabled={!editing} /></div>
                <div className="col-6"><label className="hd-form-label">Consultation Fee (₹)</label><input name="consultation_fee" type="number" className="hd-form-control" value={form.consultation_fee || ''} onChange={handleChange} disabled={!editing} /></div>
                <div className="col-6"><label className="hd-form-label">Phone</label><input name="phone" className="hd-form-control" value={form.phone || ''} onChange={handleChange} disabled={!editing} /></div>
                <div className="col-12"><label className="hd-form-label">Biography</label><textarea name="biography" className="hd-form-control" rows="3" value={form.biography || ''} onChange={handleChange} disabled={!editing}></textarea></div>
              </div>
            </div>
          </div>

          {/* Hospital & Payment */}
          <div className="col-lg-6">
            <div className="hd-card mb-4">
              <h4 className="mb-3"><i className="bi bi-hospital text-success me-2"></i>Hospital & Clinic</h4>
              <div className="row g-3">
                <div className="col-12"><label className="hd-form-label">Hospital Name</label><input name="hospital_name" className="hd-form-control" value={form.hospital_name || ''} onChange={handleChange} disabled={!editing} /></div>
                <div className="col-12"><label className="hd-form-label">Hospital Address</label><textarea name="hospital_address" className="hd-form-control" rows="2" value={form.hospital_address || ''} onChange={handleChange} disabled={!editing}></textarea></div>
                <div className="col-12"><label className="hd-form-label">Clinic Address</label><textarea name="clinic_address" className="hd-form-control" rows="2" value={form.clinic_address || ''} onChange={handleChange} disabled={!editing}></textarea></div>
              </div>
            </div>
            <div className="hd-card">
              <h4 className="mb-3"><i className="bi bi-credit-card text-info me-2"></i>Payment (UPI)</h4>
              <div className="row g-3">
                <div className="col-12"><label className="hd-form-label">UPI ID</label><input name="upi_id" className="hd-form-control" value={form.upi_id || ''} onChange={handleChange} disabled={!editing} placeholder="your@upi" /></div>
              </div>
            </div>
          </div>
        </div>

        {editing && (
          <div className="d-flex gap-2 mt-4 justify-content-end">
            <button type="button" className="hd-btn hd-btn-outline" onClick={() => { setEditing(false); setForm(profile); }}>Cancel</button>
            <button type="submit" className="hd-btn hd-btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        )}
      </form>

      {/* Availability Section */}
      <div className="hd-card mt-4">
        <h4 className="mb-3"><i className="bi bi-clock text-primary me-2"></i>Availability Schedule</h4>
        <form onSubmit={handleAddAvailability} className="row g-3 align-items-end mb-4 p-3 rounded" style={{ background: 'var(--hd-gray-50)' }}>
          <div className="col-md-3"><label className="hd-form-label">Day</label><select className="hd-form-control" value={availSlot.dayOfWeek} onChange={(e) => setAvailSlot({ ...availSlot, dayOfWeek: e.target.value })}>{DAYS.map(d => <option key={d} value={d} className="text-capitalize">{d}</option>)}</select></div>
          <div className="col-md-2"><label className="hd-form-label">Start</label><input type="time" className="hd-form-control" value={availSlot.startTime} onChange={(e) => setAvailSlot({ ...availSlot, startTime: e.target.value })} /></div>
          <div className="col-md-2"><label className="hd-form-label">End</label><input type="time" className="hd-form-control" value={availSlot.endTime} onChange={(e) => setAvailSlot({ ...availSlot, endTime: e.target.value })} /></div>
          <div className="col-md-2"><label className="hd-form-label">Max Patients</label><input type="number" className="hd-form-control" min="1" max="100" value={availSlot.maxPatients} onChange={(e) => setAvailSlot({ ...availSlot, maxPatients: parseInt(e.target.value) })} /></div>
          <div className="col-md-3"><button type="submit" className="hd-btn hd-btn-primary hd-btn-block"><i className="bi bi-plus-lg"></i> Add Slot</button></div>
        </form>
        {profile?.availability?.length > 0 ? (
          <div className="table-responsive">
            <table className="hd-table">
              <thead><tr><th>Day</th><th>Start</th><th>End</th><th>Max Patients</th><th></th></tr></thead>
              <tbody>
                {profile.availability.map(slot => (
                  <tr key={slot.id}>
                    <td className="fw-semibold text-capitalize">{slot.day_of_week}</td>
                    <td>{slot.start_time}</td><td>{slot.end_time}</td><td>{slot.max_patients}</td>
                    <td><button className="hd-btn hd-btn-outline hd-btn-sm text-danger" onClick={() => handleDeleteSlot(slot.id)}><i className="bi bi-trash"></i></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-muted text-center py-3">No availability slots configured</div>
        )}
      </div>
    </div>
  );
}
