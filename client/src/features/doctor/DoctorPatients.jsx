import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      const { data: res } = await doctorAPI.getPatients(params);
      setPatients(res.data);
      setTotal(res.meta?.total || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchPatients(); }, [page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchPatients(); };
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="hd-page-header">
        <div><h1 className="hd-page-title">My Patients</h1><p className="hd-page-subtitle">View and manage all patients you have treated.</p></div>
      </div>

      <div className="hd-card mb-4">
        <form onSubmit={handleSearch} className="d-flex gap-3">
          <div className="flex-grow-1 position-relative">
            <i className="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-muted"></i>
            <input type="text" className="hd-form-control" style={{ paddingLeft: '2.5rem' }} placeholder="Search patients by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="hd-btn hd-btn-primary">Search</button>
        </form>
      </div>

      {loading ? <Spinner /> : (
        <>
          <p className="text-muted mb-3">{total} patient{total !== 1 ? 's' : ''} found</p>
          {patients.length > 0 ? (
            <div className="hd-card">
              <div className="table-responsive">
                <table className="hd-table">
                  <thead><tr><th>Patient</th><th>Gender</th><th>Blood Group</th><th>Total Visits</th><th>Last Visit</th><th></th></tr></thead>
                  <tbody>
                    {patients.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {p.profile_image_url ? <img src={p.profile_image_url} className="hd-avatar-sm" alt="" /> : <div className="hd-avatar-placeholder" style={{width:32,height:32,fontSize:'0.7rem'}}>{p.first_name?.[0]}{p.last_name?.[0]}</div>}
                            <div><div className="fw-semibold">{p.first_name} {p.last_name}</div><small className="text-muted">{p.email}</small></div>
                          </div>
                        </td>
                        <td className="text-capitalize">{p.gender || '—'}</td>
                        <td>{p.blood_group || '—'}</td>
                        <td><span className="fw-bold">{p.total_appointments || 0}</span></td>
                        <td>{p.last_visit ? new Date(p.last_visit).toLocaleDateString() : '—'}</td>
                        <td><Link to={`/doctor/patients/${p.id}/history`} className="hd-btn hd-btn-outline hd-btn-sm"><i className="bi bi-file-medical"></i> History</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="hd-card"><div className="hd-empty-state"><i className="bi bi-people d-block"></i><h5>No Patients Yet</h5><p className="small">Your patients will appear here once they book appointments.</p></div></div>
          )}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-4">
              <button className="hd-btn hd-btn-outline hd-btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span className="d-flex align-items-center px-3 small text-muted">{page}/{totalPages}</span>
              <button className="hd-btn hd-btn-outline hd-btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
