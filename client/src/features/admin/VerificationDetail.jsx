import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verificationAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

export default function VerificationDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchRequest = async () => {
    try {
      const { data: res } = await verificationAPI.getRequest(id);
      setRequest(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchRequest(); }, [id]);

  const handleApprove = async () => {
    if (!window.confirm('Approve this doctor?')) return;
    setProcessing(true);
    try {
      await verificationAPI.approve(id, { adminNotes: 'Approved by admin' });
      toast.success('Doctor approved');
      fetchRequest();
    } catch (err) { toast.error('Failed to approve'); }
    setProcessing(false);
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      await verificationAPI.reject(id, { adminNotes: rejectionReason || 'Documents insufficient' });
      toast.success('Verification rejected');
      fetchRequest();
    } catch (err) { toast.error('Failed to reject'); }
    setProcessing(false);
  };


  if (loading) return <Spinner />;
  if (!request) return <div className="hd-card"><div className="hd-empty-state"><h5>Request Not Found</h5></div></div>;

  return (
    <div>
      <div className="mb-3"><Link to="/admin/verifications" className="text-muted small"><i className="bi bi-arrow-left me-1"></i>Back to Requests</Link></div>

      <div className="hd-page-header">
        <div><h1 className="hd-page-title">Verification Review</h1><p className="hd-page-subtitle">Review submitted documents for Dr. {request.first_name} {request.last_name}</p></div>
        {request.verification_status === 'pending' && (
          <div className="d-flex gap-2">
            <button className="hd-btn hd-btn-success" onClick={handleApprove} disabled={processing}><i className="bi bi-check-lg"></i> Approve</button>
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* Doctor Info */}
        <div className="col-lg-4">
          <div className="hd-card">
            <div className="text-center mb-3">

              {
                request.profile_image_url ? (
                  <img
                    src={request.profile_image_url}
                    alt="Doctor"
                    className="rounded-circle mx-auto d-block"
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <div className="hd-avatar-placeholder xl mx-auto">
                    {request.first_name?.[0]}
                    {request.last_name?.[0]}
                  </div>
                )
              }
              <h4 className="mt-2 mb-0">Dr. {request.first_name} {request.last_name}</h4>
              <p className="text-muted">{request.specialization || 'Not specified'}</p>
            </div>
            <div className="d-flex flex-column gap-2">
              <div className="d-flex justify-content-between"><span className="text-muted">Email</span><span className="small">{request.email}</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Phone</span><span>{request.phone || '—'}</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted">License</span><span>{request.license_number || '—'}</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Experience</span><span>{request.experience_years || 0} yrs</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Hospital</span><span>{request.hospital_name || '—'}</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Status</span><span className={`hd-badge hd-badge-${request.verification_status}`}>{request.verification_status}</span></div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="col-lg-8">
          <div className="hd-card mb-4">
            <h4 className="mb-3"><i className="bi bi-file-earmark-check text-primary me-2"></i>Submitted Documents</h4>
            {request.documents?.length > 0 ? (
              <div className="row g-3">
                {request.documents.map(doc => (
                  <div key={doc.id} className="col-md-6">
                    <div className="p-3 rounded-3 border">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="bi bi-file-earmark-pdf text-danger fs-4"></i>
                        <div className="flex-grow-1">
                          <div className="fw-semibold small hd-truncate">{doc.original_filename}</div>
                          <small className="text-muted text-capitalize">{doc.document_type?.replace('_', ' ')}</small>
                        </div>
                      </div>
                      {doc.document_url && (
                        <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="hd-btn hd-btn-outline hd-btn-sm hd-btn-block">
                          <i className="bi bi-eye"></i> View Document
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted text-center py-3">No documents submitted</div>
            )}
          </div>

          {/* Rejection Form */}
          {request.verification_status === 'pending' && (
            <div className="hd-card">
              <h4 className="mb-3 text-danger"><i className="bi bi-x-circle me-2"></i>Reject Verification</h4>
              <div className="hd-form-group">
                <label className="hd-form-label">Reason for Rejection</label>
                <textarea className="hd-form-control" rows="3" placeholder="Provide a reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}></textarea>
              </div>
              <button className="hd-btn hd-btn-danger" onClick={handleReject} disabled={processing}>{processing ? 'Processing...' : 'Reject Verification'}</button>
            </div>
          )}

          {request.rejection_reason && (
            <div className="hd-card mt-4" style={{ borderLeft: '4px solid var(--hd-danger)' }}>
              <h5 className="text-danger">Rejection Reason</h5>
              <p className="mb-0">{request.rejection_reason}</p>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
