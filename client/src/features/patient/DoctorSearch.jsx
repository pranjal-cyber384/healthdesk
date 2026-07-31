import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function DoctorSearch() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', specialization: '', available: '' });
  const limit = 12;

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filters.search) params.search = filters.search;
      if (filters.specialization) params.specialization = filters.specialization;
      if (filters.available) params.available = filters.available;
      const { data: res } = await doctorAPI.list(params);
      setDoctors(res.data);
      setTotal(res.meta?.total || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchDoctors(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDoctors();
  };

  const totalPages = Math.ceil(total / limit);

  const specializations = ['Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 'General Medicine', 'Gynecology', 'Ophthalmology', 'ENT'];

  return (
    <div>
      <div className="hd-page-header">
        <div>
          <h1 className="hd-page-title">Find Doctors</h1>
          <p className="hd-page-subtitle">Search and connect with verified healthcare professionals.</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="hd-card mb-4">
        <form onSubmit={handleSearch}>
          <div className="row g-3">
            <div className="col-md-5">
              <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-muted"></i>
                <input type="text" className="hd-form-control" style={{ paddingLeft: '2.5rem' }} placeholder="Search by name, specialization, hospital..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="hd-form-control" value={filters.specialization} onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}>
                <option value="">All Specializations</option>
                {specializations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select className="hd-form-control" value={filters.available} onChange={(e) => setFilters({ ...filters, available: e.target.value })}>
                <option value="">All</option>
                <option value="true">Available Now</option>
              </select>
            </div>
            <div className="col-md-2">
              <button type="submit" className="hd-btn hd-btn-primary hd-btn-block">Search</button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {loading ? <Spinner /> : (
        <>
          <p className="text-muted mb-3">{total} doctor{total !== 1 ? 's' : ''} found</p>
          {doctors.length > 0 ? (
            <div className="row g-4">
              {doctors.map(doc => (
                <div className="col-md-6 col-lg-4" key={doc.id}>
                  <div className="hd-card hd-card-elevated h-100">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      {doc.profile_image_url ? (
                        <img src={doc.profile_image_url} alt="Doctor" className="hd-avatar-lg" />
                      ) : (
                        <div className="hd-avatar-placeholder lg">{doc.first_name?.[0]}{doc.last_name?.[0]}</div>
                      )}
                      <div>
                        <h5 className="mb-0">Dr. {doc.first_name} {doc.last_name}</h5>
                        <span className="small text-muted">{doc.specialization || 'General'}</span>
                      </div>
                    </div>
                    <div className="d-flex flex-column gap-2 mb-3">
                      {doc.hospital_name && <div className="small"><i className="bi bi-hospital text-primary me-2"></i>{doc.hospital_name}</div>}
                      <div className="small"><i className="bi bi-briefcase text-muted me-2"></i>{doc.experience_years || 0} years experience</div>
                      <div className="small"><i className="bi bi-cash text-success me-2"></i>₹{doc.consultation_fee || 0} consultation fee</div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mt-auto">
                      <span className={`hd-badge ${doc.is_available ? 'hd-badge-accepted' : 'hd-badge-cancelled'}`}>
                        {doc.is_available ? 'Available' : 'Unavailable'}
                      </span>
                      <Link to={`/patient/doctors/${doc.id}`} className="hd-btn hd-btn-primary hd-btn-sm">View Profile</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="hd-card"><div className="hd-empty-state"><i className="bi bi-search d-block"></i><h5>No Doctors Found</h5><p className="small">Try adjusting your search filters.</p></div></div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-4">
              <button className="hd-btn hd-btn-outline hd-btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
              <span className="d-flex align-items-center px-3 small text-muted">Page {page} of {totalPages}</span>
              <button className="hd-btn hd-btn-outline hd-btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
