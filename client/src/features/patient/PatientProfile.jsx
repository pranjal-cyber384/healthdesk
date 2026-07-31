import React, { useState, useEffect } from 'react';
import { patientAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

export default function PatientProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: res } = await patientAPI.getProfile();
        setProfile(res.data);
        setForm(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: res } = await patientAPI.updateProfile({
        firstName: form.first_name,
        lastName: form.last_name,
        phone: form.phone,
        dateOfBirth: form.date_of_birth,
        gender: form.gender,
        bloodGroup: form.blood_group,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        emergencyContactName: form.emergency_contact_name,
        emergencyContactPhone: form.emergency_contact_phone,
        allergies: form.allergies,
        chronicConditions: form.chronic_conditions
      });
      setProfile(res.data);
      updateUser({ first_name: form.first_name, last_name: form.last_name });
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      toast.error('Update all fields' || err.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profileImage', file);
    try {
      const { data: res } = await usersAPI.uploadProfileImage(formData);
      updateUser({ profile_image_url: res.data.profileImageUrl });
      toast.success('Profile image updated');
    } catch (err) {
      toast.error('Failed to upload image');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (loading) return <Spinner />;

  const getInitials = () => `${(profile?.first_name || '')[0] || ''}${(profile?.last_name || '')[0] || ''}`.toUpperCase();

  return (
    <div>
      <div className="hd-page-header">
        <div>
          <h1 className="hd-page-title">My Profile</h1>
          <p className="hd-page-subtitle">Manage your personal and medical information.</p>
        </div>
        {!editing && (
          <button className="hd-btn hd-btn-primary" onClick={() => setEditing(true)}>
            <i className="bi bi-pencil-fill"></i> Edit Profile
          </button>
        )}
      </div>

      {/* Profile Header */}
      <div className="hd-card mb-4">
        <div className="d-flex align-items-center gap-4 flex-wrap">
          <div className="position-relative">
            {(user?.profile_image_url || user?.profileImageUrl) ? (
              <img src={user.profile_image_url || user.profileImageUrl} alt="Profile" className="hd-avatar-2xl" />
            ) : (
              <div className="hd-avatar-placeholder xl">{getInitials()}</div>
            )}
            <label className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, cursor: 'pointer' }}>
              <i className="bi bi-camera-fill small"></i>
              <input type="file" accept="image/*" className="d-none" onChange={handleImageUpload} />
            </label>
          </div>
          <div>
            <h3 className="mb-1">{profile?.first_name} {profile?.last_name}</h3>
            <p className="text-muted mb-1">{profile?.email}</p>
            {profile?.phone && <p className="text-muted mb-0"><i className="bi bi-telephone me-1"></i>{profile.phone}</p>}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Personal Information */}
          <div className="col-lg-6">
            <div className="hd-card h-100">
              <h4 className="mb-3"><i className="bi bi-person-fill text-primary me-2"></i>Personal Information</h4>
              <div className="row g-3">
                <div className="col-6">
                  <div className="hd-form-group mb-0">
                    <label className="hd-form-label">First Name</label>
                    <input name="first_name" className="hd-form-control" value={form.first_name || ''} onChange={handleChange} disabled={!editing} required />
                  </div>
                </div>
                <div className="col-6">
                  <div className="hd-form-group mb-0">
                    <label className="hd-form-label">Last Name</label>
                    <input name="last_name" className="hd-form-control" value={form.last_name || ''} onChange={handleChange} disabled={!editing} required />
                  </div>
                </div>
                <div className="col-6">
                  <div className="hd-form-group mb-0">
                    <label className="hd-form-label">Date of Birth</label>
                    <input name="date_of_birth" type="date" className="hd-form-control" value={form.date_of_birth ? form.date_of_birth.split('T')[0] : ''} onChange={handleChange} disabled={!editing} />
                  </div>
                </div>
                <div className="col-6">
                  <div className="hd-form-group mb-0">
                    <label className="hd-form-label">Gender</label>
                    <select name="gender" className="hd-form-control" value={form.gender || ''} onChange={handleChange} disabled={!editing}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="col-6">
                  <div className="hd-form-group mb-0">
                    <label className="hd-form-label">Blood Group</label>
                    <select name="blood_group" className="hd-form-control" value={form.blood_group || ''} onChange={handleChange} disabled={!editing}>
                      <option value="">Select</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-6">
                  <div className="hd-form-group mb-0">
                    <label className="hd-form-label">Phone</label>
                    <input name="phone" className="hd-form-control" value={form.phone || ''} onChange={handleChange} disabled={!editing} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address & Emergency */}
          <div className="col-lg-6">
            <div className="hd-card h-100">
              <h4 className="mb-3"><i className="bi bi-geo-alt-fill text-danger me-2"></i>Address & Emergency</h4>
              <div className="row g-3">
                <div className="col-12">
                  <div className="hd-form-group mb-0">
                    <label className="hd-form-label">Address</label>
                    <textarea name="address" className="hd-form-control" rows="2" value={form.address || ''} onChange={handleChange} disabled={!editing}></textarea>
                  </div>
                </div>
                <div className="col-4">
                  <label className="hd-form-label">City</label>
                  <input name="city" className="hd-form-control" value={form.city || ''} onChange={handleChange} disabled={!editing} />
                </div>
                <div className="col-4">
                  <label className="hd-form-label">State</label>
                  <input name="state" className="hd-form-control" value={form.state || ''} onChange={handleChange} disabled={!editing} />
                </div>
                <div className="col-4">
                  <label className="hd-form-label">Pincode</label>
                  <input name="pincode" className="hd-form-control" value={form.pincode || ''} onChange={handleChange} disabled={!editing} />
                </div>
                <div className="col-6">
                  <label className="hd-form-label">Emergency Contact</label>
                  <input name="emergency_contact_name" className="hd-form-control" placeholder="Contact name" value={form.emergency_contact_name || ''} onChange={handleChange} disabled={!editing} />
                </div>
                <div className="col-6">
                  <label className="hd-form-label">Emergency Phone</label>
                  <input name="emergency_contact_phone" className="hd-form-control" placeholder="Phone number" value={form.emergency_contact_phone || ''} onChange={handleChange} disabled={!editing} />
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="col-12">
            <div className="hd-card">
              <h4 className="mb-3"><i className="bi bi-heart-pulse-fill text-danger me-2"></i>Medical Information</h4>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="hd-form-label">Known Allergies</label>
                  <textarea name="allergies" className="hd-form-control" rows="3" placeholder="List any known allergies..." value={form.allergies || ''} onChange={handleChange} disabled={!editing}></textarea>
                </div>
                <div className="col-md-6">
                  <label className="hd-form-label">Chronic Conditions</label>
                  <textarea name="chronic_conditions" className="hd-form-control" rows="3" placeholder="List any chronic conditions..." value={form.chronic_conditions || ''} onChange={handleChange} disabled={!editing}></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        {editing && (
          <div className="d-flex gap-2 mt-4 justify-content-end">
            <button type="button" className="hd-btn hd-btn-outline" onClick={() => { setEditing(false); setForm(profile); }}>Cancel</button>
            <button type="submit" className="hd-btn hd-btn-primary" disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm"></span> Saving...</> : <><i className="bi bi-check-lg"></i> Save Changes</>}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
