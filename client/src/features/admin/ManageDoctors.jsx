import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 12;

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      const { data: res } = await adminAPI.getDoctors(params);
      setDoctors(res.data);
      setTotal(res.meta?.total || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchDoctors(); }, [page]);

  const handleSuspend = async (id, isSuspended) => {
    try {
      await adminAPI.suspendDoctor(id, !isSuspended);
      toast.success(`Doctor ${!isSuspended ? 'suspended' : 'reactivated'}`);
      fetchDoctors();
    } catch (err) { toast.error('Failed to update doctor'); }
  };

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchDoctors(); };
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="hd-page-header">
        <div><h1 className="hd-page-title">Manage Doctors</h1><p className="hd-page-subtitle">View and manage all registered doctors.</p></div>
      </div>

      <div className="hd-card mb-4">
        <form onSubmit={handleSearch} className="d-flex gap-2">
          <input type="text" className="hd-form-control" placeholder="Search doctors..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className="hd-btn hd-btn-primary">Search</button>
        </form>
      </div>

      {loading ? <Spinner /> : (
        <div className="hd-card">
          {doctors.length > 0 ? (
            <div className="table-responsive">
              <table className="hd-table">
                <thead><tr><th>Doctor</th><th>Specialization</th><th>Hospital</th><th>Fee</th><th>Verification</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {doctors.map(d => (
                    <tr key={d.id}>
                      <td><div className="d-flex align-items-center gap-2">
                        {
                          d.profile_image_url ? (
                            <img
                              src={d.profile_image_url}
                              alt={`${d.first_name} ${d.last_name}`}
                              className="rounded-circle"
                              style={{
                                width: 32,
                                height: 32,
                                objectFit: "cover"
                              }}
                            />
                          ) : (
                            <div
                              className="hd-avatar-placeholder"
                              style={{
                                width: 32,
                                height: 32,
                                fontSize: "0.7rem"
                              }}
                            >
                              {d.first_name?.[0]}
                              {d.last_name?.[0]}
                            </div>
                          )
                        }

                        <div><div className="fw-semibold">Dr. {d.first_name} {d.last_name}</div><small className="text-muted">{d.email}</small></div></div></td>
                      <td>{d.specialization || '—'}</td>
                      <td>{d.hospital_name || '—'}</td>
                      <td>₹{d.consultation_fee || 0}</td>
                      <td><span className={`hd-badge hd-badge-${d.verification_status === 'approved' ? 'approved' : d.verification_status === 'rejected' ? 'rejected' : 'pending'}`}>{d.verification_status || 'pending'}</span></td>
                      <td><span className={`hd-badge ${d.is_suspended ? 'hd-badge-suspended' : 'hd-badge-accepted'}`}>{d.is_suspended ? 'Suspended' : 'Active'}</span></td>
                      <td>
                        <button className={`hd-btn hd-btn-sm ${d.is_suspended ? 'hd-btn-success' : 'hd-btn-outline text-danger'}`} onClick={() => handleSuspend(d.id, d.is_suspended)}>
                          {d.is_suspended ? <><i className="bi bi-check-lg"></i> Activate</> : <><i className="bi bi-pause-circle"></i> Suspend</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="hd-empty-state"><i className="bi bi-person-badge d-block"></i><h5>No Doctors Found</h5></div>}
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
