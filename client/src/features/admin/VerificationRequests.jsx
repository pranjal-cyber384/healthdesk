import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { verificationAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function VerificationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const limit = 12;

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filter) params.status = filter;
      const { data: res } = await verificationAPI.listRequests(params);
      setRequests(res.data);
      setTotal(res.meta?.total || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [page, filter]);
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="hd-page-header">
        <div><h1 className="hd-page-title">Verification Requests</h1><p className="hd-page-subtitle">Review and approve doctor verification documents.</p></div>
      </div>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }} className={`hd-btn hd-btn-sm ${filter === s ? 'hd-btn-primary' : 'hd-btn-outline'}`}>{s || 'All'}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {requests.length > 0 ? (
            <div className="row g-4">
              {requests.map(req => (
                <div className="col-md-6 col-lg-4" key={req.profile_id}>
                  <div className="hd-card hd-card-elevated h-100">
                    <div className="d-flex align-items-center gap-3 mb-3">

                      {
                        req.profile_image_url ? (
                          <img
                            src={req.profile_image_url}
                            alt="Doctor"
                            className="rounded-circle"
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: "cover"
                            }}
                          />
                        ) : (
                          <div className="hd-avatar-placeholder lg">
                            {req.first_name?.[0]}
                            {req.last_name?.[0]}
                          </div>
                        )
                      }
                      <div>
                        <h5 className="mb-0">Dr. {req.first_name} {req.last_name}</h5>
                        <small className="text-muted">{req.specialization || 'Not specified'}</small>
                      </div>
                    </div>
                    <div className="d-flex flex-column gap-2 mb-3">
                      <div className="small"><i className="bi bi-envelope me-2"></i>{req.email}</div>
                      <div className="small"><i className="bi bi-file-earmark me-2"></i>{req.document_count || 0} documents</div>
                      <div className="small"><i className="bi bi-calendar me-2"></i>Submitted: {new Date(req.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`hd-badge hd-badge-${req.verification_status === 'approved' ? 'approved' : req.verification_status === 'rejected' ? 'rejected' : 'pending'}`}>{req.verification_status}</span>
                      <Link to={`/admin/verifications/${req.profile_id}`} className="hd-btn hd-btn-primary hd-btn-sm">Review</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="hd-card"><div className="hd-empty-state"><i className="bi bi-patch-check d-block"></i><h5>No Requests</h5></div></div>
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
