import React, { useState, useEffect } from 'react';
import { prescriptionAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const limit = 10;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data: res } = await prescriptionAPI.list({ page, limit });
        setPrescriptions(res.data);
        setTotal(res.meta?.total || 0);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="hd-page-header">
        <div>
          <h1 className="hd-page-title">My Prescriptions</h1>
          <p className="hd-page-subtitle">View all prescriptions issued by your doctors.</p>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="row g-4">
          <div className={selected ? 'col-lg-5' : 'col-12'}>
            {prescriptions.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {prescriptions.map(p => (
                  <div key={p.id} className={`hd-card hd-card-elevated cursor-pointer ${selected?.id === p.id ? 'border-primary' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setSelected(p)}>
                    <div className="d-flex align-items-start gap-3">
                      <div className="hd-stat-icon purple" style={{ width: 48, height: 48 }}><i className="bi bi-prescription2"></i></div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between">
                          <h5 className="mb-1">Dr. {p.doctor_first_name} {p.doctor_last_name}</h5>
                          <small className="text-muted">{new Date(p.created_at).toLocaleDateString()}</small>
                        </div>
                        <p className="text-muted small mb-1">{p.specialization}</p>
                        <p className="mb-0 small">{p.diagnosis?.substring(0, 100)}{p.diagnosis?.length > 100 ? '...' : ''}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="hd-card"><div className="hd-empty-state"><i className="bi bi-prescription2 d-block"></i><h5>No Prescriptions</h5><p className="small">Prescriptions from your consultations will appear here.</p></div></div>
            )}

            {totalPages > 1 && (
              <div className="d-flex justify-content-center gap-2 mt-4">
                <button className="hd-btn hd-btn-outline hd-btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
                <span className="d-flex align-items-center px-3 small text-muted">{page}/{totalPages}</span>
                <button className="hd-btn hd-btn-outline hd-btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="col-lg-7 hd-slide-in">
              <div className="hd-card position-sticky" style={{ top: 'calc(var(--hd-navbar-height) + 1.5rem)' }}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h4 className="mb-0">Prescription Details</h4>
                  <button className="btn btn-link text-muted p-0" onClick={() => setSelected(null)}><i className="bi bi-x-lg"></i></button>
                </div>
                <div className="mb-3 p-3 rounded-3" style={{ background: 'var(--hd-gray-50)' }}>
                  <div className="d-flex justify-content-between">
                    <div><span className="fw-bold">Dr. {selected.doctor_first_name} {selected.doctor_last_name}</span><br /><small className="text-muted">{selected.specialization}</small></div>
                    <div className="text-end"><small className="text-muted">{new Date(selected.created_at).toLocaleDateString()}</small></div>
                  </div>
                </div>
                <div className="mb-3"><h6 className="text-muted mb-1">Diagnosis</h6><p>{selected.diagnosis || '—'}</p></div>
                <div className="mb-3"><h6 className="text-muted mb-1">Medications</h6><p style={{ whiteSpace: 'pre-line' }}>{selected.medications || '—'}</p></div>
                {selected.instructions && <div className="mb-3"><h6 className="text-muted mb-1">Instructions</h6><p>{selected.instructions}</p></div>}
                {selected.notes && <div className="mb-3"><h6 className="text-muted mb-1">Notes</h6><p>{selected.notes}</p></div>}
                {selected.prescription_file_url && (
                  <a href={selected.prescription_file_url} target="_blank" rel="noopener noreferrer" className="hd-btn hd-btn-primary"><i className="bi bi-download"></i> Download Prescription</a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
