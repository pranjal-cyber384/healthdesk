import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doctorAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

const dayOrder = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export default function DoctorDetail() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await doctorAPI.getById(id);
        setDoctor(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <Spinner />;
  if (!doctor) return <div className="hd-card"><div className="hd-empty-state"><i className="bi bi-person-x d-block"></i><h5>Doctor Not Found</h5><Link to="/patient/doctors" className="hd-btn hd-btn-primary mt-3">Back to Search</Link></div></div>;

  const getInitials = () => `${doctor.first_name?.[0] || ''}${doctor.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div>
      <div className="mb-3"><Link to="/patient/doctors" className="text-muted small"><i className="bi bi-arrow-left me-1"></i>Back to Doctors</Link></div>

      {/* Doctor Header */}
      <div className="hd-card mb-4">
        <div className="row align-items-center">
          <div className="col-md-8">
            <div className="d-flex align-items-center gap-4">
              {doctor.profile_image_url ? (
                <img src={doctor.profile_image_url} alt="Doctor" className="hd-avatar-2xl" />
              ) : (
                <div className="hd-avatar-placeholder xl">{getInitials()}</div>
              )}
              <div>
                <h2 className="mb-1">Dr. {doctor.first_name} {doctor.last_name}</h2>
                <p className="text-primary fw-semibold mb-1">{doctor.specialization || 'General Medicine'}</p>
                <p className="text-muted mb-1">{doctor.qualification}</p>
                <div className="d-flex gap-3 flex-wrap mt-2">
                  <span className="small"><i className="bi bi-briefcase text-muted me-1"></i>{doctor.experience_years || 0} yrs exp</span>
                  {doctor.hospital_name && <span className="small"><i className="bi bi-hospital text-primary me-1"></i>{doctor.hospital_name}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4 text-md-end mt-3 mt-md-0">
            <div className="mb-2">
              <span className={`hd-badge ${doctor.is_available ? 'hd-badge-accepted' : 'hd-badge-cancelled'}`}>
                {doctor.is_available ? '● Available' : '● Unavailable'}
              </span>
            </div>
            <div className="fs-4 fw-bold text-success mb-2">₹{doctor.consultation_fee || 0}</div>
            <Link to={`/patient/book-appointment/${doctor.id}`} className="hd-btn hd-btn-primary">
              <i className="bi bi-calendar-plus"></i> Book Appointment
            </Link>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* About */}
        <div className="col-lg-8">
          <div className="hd-card mb-4">
            <h4 className="mb-3"><i className="bi bi-person-vcard text-primary me-2"></i>About</h4>
            <p className="text-muted">{doctor.biography || 'No biography available.'}</p>
          </div>

          {/* Availability Schedule */}
          <div className="hd-card">
            <h4 className="mb-3"><i className="bi bi-clock text-primary me-2"></i>Availability Schedule</h4>
            {doctor.availability?.length > 0 ? (
              <div className="table-responsive">
                <table className="hd-table">
                  <thead><tr><th>Day</th><th>Start Time</th><th>End Time</th><th>Max Patients</th></tr></thead>
                  <tbody>
                    {doctor.availability.sort((a, b) => dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week)).map(slot => (
                      <tr key={slot.id}>
                        <td className="fw-semibold text-capitalize">{slot.day_of_week}</td>
                        <td>{slot.start_time}</td>
                        <td>{slot.end_time}</td>
                        <td>{slot.max_patients}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted">No availability schedule set.</div>
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="col-lg-4">
          <div className="hd-card mb-4">
            <h5 className="mb-3">Contact Information</h5>
            <div className="d-flex flex-column gap-2">
              {doctor.email && <div className="small"><i className="bi bi-envelope text-primary me-2"></i>{doctor.email}</div>}
              {doctor.phone && <div className="small"><i className="bi bi-telephone text-primary me-2"></i>{doctor.phone}</div>}
              {doctor.hospital_address && <div className="small"><i className="bi bi-geo-alt text-danger me-2"></i>{doctor.hospital_address}</div>}
              {doctor.clinic_address && <div className="small"><i className="bi bi-building text-muted me-2"></i>{doctor.clinic_address}</div>}
            </div>
          </div>

          {/* Payment Info */}
          {doctor.upi_id && (
            <div className="hd-card">
              <h5 className="mb-3">Payment Details</h5>
              <div className="small"><i className="bi bi-phone text-success me-2"></i>UPI: {doctor.upi_id}</div>
              {doctor.upi_qr_url && <img src={doctor.upi_qr_url} alt="UPI QR" className="mt-2 rounded" style={{ maxWidth: '100%', maxHeight: 200 }} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
