import React, { useState, useEffect } from 'react';
import { verificationAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

const DOC_TYPES = ['medical_license', 'government_id', 'certificate', 'education', 'other'];

export default function VerificationPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [docTypes, setDocTypes] = useState([]);

  const fetchStatus = async () => {
    try {
      const { data: res } = await verificationAPI.getStatus();
      setStatus(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setDocTypes(selected.map(() => 'medical_license'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) { toast.error('Please select documents'); return; }
    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('documents', f));
    formData.append('documentTypes', JSON.stringify(docTypes));
    try {
      await verificationAPI.submit(formData);
      toast.success('Documents submitted for verification');
      setFiles([]);
      fetchStatus();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    setUploading(false);
  };

  if (loading) return <Spinner />;

  const statusConfig = {
    pending: { color: 'warning', icon: 'bi-clock-history', text: 'Verification Pending', desc: 'Your documents are being reviewed by our team.' },
    approved: { color: 'success', icon: 'bi-patch-check-fill', text: 'Verified', desc: 'Congratulations! Your account has been verified.' },
    rejected: { color: 'danger', icon: 'bi-x-circle', text: 'Verification Rejected', desc: 'Your verification was rejected. Please re-submit your documents.' },
    suspended: { color: 'danger', icon: 'bi-ban', text: 'Account Suspended', desc: 'Your account has been suspended. Contact support.' }
  };

  const config = statusConfig[status?.status] || statusConfig.pending;

  return (
    <div>
      <div className="hd-page-header">
        <div><h1 className="hd-page-title">Verification</h1><p className="hd-page-subtitle">Submit your documents to get verified on HealthDesk.</p></div>
      </div>

      {/* Status Banner */}
      <div className={`hd-card mb-4 border-${config.color}`} style={{ borderLeft: `4px solid var(--hd-${config.color})` }}>
        <div className="d-flex align-items-center gap-3">
          <div className={`hd-stat-icon ${config.color}`} style={{ width: 56, height: 56 }}><i className={`bi ${config.icon} fs-4`}></i></div>
          <div>
            <h4 className={`mb-1 text-${config.color}`}>{config.text}</h4>
            <p className="text-muted mb-0">{config.desc}</p>
            {status?.lastUpdated && <small className="text-muted">Last updated: {new Date(status.lastUpdated).toLocaleDateString()}</small>}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Upload Form */}
        {status?.status !== 'approved' && (
          <div className="col-lg-6">
            <div className="hd-card">
              <h4 className="mb-3"><i className="bi bi-cloud-upload text-primary me-2"></i>Upload Documents</h4>
              <form onSubmit={handleSubmit}>
                <div className="hd-form-group">
                  <label className="hd-form-label">Select Documents</label>
                  <input type="file" className="hd-form-control" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                  <small className="text-muted">Accepted: PDF, JPG, PNG (max 10MB each)</small>
                </div>
                {files.length > 0 && (
                  <div className="mb-3">
                    {files.map((f, i) => (
                      <div key={i} className="d-flex align-items-center gap-2 mb-2 p-2 rounded" style={{ background: 'var(--hd-gray-50)' }}>
                        <i className="bi bi-file-earmark text-primary"></i>
                        <span className="flex-grow-1 small hd-truncate">{f.name}</span>
                        <select className="hd-form-control" style={{ width: 160 }} value={docTypes[i]} onChange={(e) => { const newTypes = [...docTypes]; newTypes[i] = e.target.value; setDocTypes(newTypes); }}>
                          {DOC_TYPES.map(t => <option key={t} value={t} className="text-capitalize">{t.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
                <button type="submit" className="hd-btn hd-btn-primary" disabled={uploading || files.length === 0}>
                  {uploading ? <><span className="spinner-border spinner-border-sm"></span> Uploading...</> : <><i className="bi bi-send"></i> Submit for Review</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Submitted Documents */}
        <div className={status?.status !== 'approved' ? 'col-lg-6' : 'col-12'}>
          <div className="hd-card">
            <h4 className="mb-3"><i className="bi bi-folder2-open text-info me-2"></i>Submitted Documents</h4>
            {status?.documents?.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {status.documents.map(doc => (
                  <div key={doc.id} className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'var(--hd-gray-50)' }}>
                    <i className="bi bi-file-earmark-check text-primary fs-5"></i>
                    <div className="flex-grow-1">
                      <div className="fw-semibold small">{doc.original_filename}</div>
                      <div className="small text-muted text-capitalize">{doc.document_type.replace('_', ' ')}</div>
                    </div>
                    <span className={`hd-badge hd-badge-${doc.status === 'verified' ? 'approved' : doc.status === 'rejected' ? 'rejected' : 'pending'}`}>{doc.status}</span>
                    {doc.document_url && <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="hd-btn hd-btn-outline hd-btn-sm"><i className="bi bi-eye"></i></a>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted text-center py-4"><i className="bi bi-folder d-block fs-3 mb-2"></i>No documents submitted yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
