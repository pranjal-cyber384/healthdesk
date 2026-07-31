import React, { useState, useEffect } from 'react';
import { patientAPI, medicalRecordAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

export default function MedicalHistory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: res } = await patientAPI.getMedicalHistory();
        setData(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('files', f));
    formData.append('recordType', 'report');
    formData.append('title', files[0].name);
    setUploading(true);
    try {
      await medicalRecordAPI.upload(formData);
      toast.success('Records uploaded successfully');
      const { data: res } = await patientAPI.getMedicalHistory();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to upload');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await medicalRecordAPI.delete(id);
      setData({ ...data, reports: data.reports.filter(r => r.id !== id) });
      toast.success('Record deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <Spinner />;

  const tabs = [
    { key: 'reports', label: 'Reports', icon: 'bi-file-earmark-medical', count: data?.reports?.length || 0 },
    { key: 'prescriptions', label: 'Prescriptions', icon: 'bi-prescription2', count: data?.prescriptions?.length || 0 },
    { key: 'symptoms', label: 'Symptoms', icon: 'bi-clipboard2-pulse', count: data?.symptoms?.length || 0 },
    { key: 'appointments', label: 'Appointments', icon: 'bi-calendar-check', count: data?.appointments?.length || 0 }
  ];

  return (
    <div>
      <div className="hd-page-header">
        <div>
          <h1 className="hd-page-title">Medical History</h1>
          <p className="hd-page-subtitle">View all your medical records, prescriptions, and history.</p>
        </div>
        <label className="hd-btn hd-btn-primary" style={{ cursor: 'pointer' }}>
          <i className="bi bi-cloud-upload-fill"></i> Upload Record
          <input type="file" multiple className="d-none" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        </label>
      </div>

      {uploading && <div className="alert alert-info"><span className="spinner-border spinner-border-sm me-2"></span>Uploading records...</div>}

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`hd-btn ${activeTab === tab.key ? 'hd-btn-primary' : 'hd-btn-outline'}`}>
            <i className={`bi ${tab.icon}`}></i> {tab.label} <span className="badge bg-white text-dark ms-1">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="hd-card">
          {data?.reports?.length > 0 ? (
            <div className="table-responsive">
              <table className="hd-table">
                <thead><tr><th>Title</th><th>Type</th><th>Date</th><th>Size</th><th>Actions</th></tr></thead>
                <tbody>
                  {data.reports.map(r => (
                    <tr key={r.id}>
                      <td><div className="d-flex align-items-center gap-2"><i className="bi bi-file-earmark-medical-fill text-primary fs-5"></i><div><div className="fw-semibold">{r.title}</div><div className="small text-muted">{r.original_filename}</div></div></div></td>
                      <td><span className="hd-badge hd-badge-accepted">{r.record_type}</span></td>
                      <td>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>{r.file_size ? `${(r.file_size / 1024).toFixed(1)} KB` : '—'}</td>
                      <td>
                        <div className="d-flex gap-1">
                          {r.file_url && <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="hd-btn hd-btn-outline hd-btn-sm"><i className="bi bi-eye"></i></a>}
                          <button onClick={() => handleDelete(r.id)} className="hd-btn hd-btn-outline hd-btn-sm text-danger"><i className="bi bi-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="hd-empty-state"><i className="bi bi-file-earmark-x d-block"></i><h5>No Reports Yet</h5><p className="small">Upload your medical reports to keep them organized.</p></div>
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div className="hd-card">
          {data?.prescriptions?.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {data.prescriptions.map(p => (
                <div key={p.id} className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'var(--hd-gray-50)' }}>
                  <div className="hd-stat-icon purple" style={{ width: 48, height: 48 }}><i className="bi bi-prescription2"></i></div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold">Dr. {p.doctor_first_name} {p.doctor_last_name}</div>
                    <div className="small text-muted">{p.diagnosis?.substring(0, 80)}{p.diagnosis?.length > 80 ? '...' : ''}</div>
                  </div>
                  <div className="text-end">
                    <div className="small fw-semibold">{new Date(p.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="hd-empty-state"><i className="bi bi-prescription2 d-block"></i><h5>No Prescriptions</h5></div>
          )}
        </div>
      )}

      {/* Symptoms Tab */}
      {activeTab === 'symptoms' && (
        <div className="hd-card">
          {data?.symptoms?.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {data.symptoms.map(s => (
                <div key={s.id} className="p-3 rounded-3" style={{ background: 'var(--hd-gray-50)' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span className={`hd-badge hd-badge-${s.severity === 'severe' ? 'rejected' : s.severity === 'moderate' ? 'pending' : 'accepted'}`}>{s.severity}</span>
                    <small className="text-muted">{new Date(s.recorded_at).toLocaleString()}</small>
                  </div>
                  <p className="mb-1">{s.description}</p>
                  {s.ai_assessment && <div className="p-2 rounded bg-white border mt-2"><small className="text-muted d-block mb-1"><i className="bi bi-robot me-1"></i>AI Assessment:</small><p className="mb-0 small">{s.ai_assessment}</p></div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="hd-empty-state"><i className="bi bi-clipboard2-pulse d-block"></i><h5>No Symptoms Recorded</h5></div>
          )}
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="hd-card">
          {data?.appointments?.length > 0 ? (
            <div className="table-responsive">
              <table className="hd-table">
                <thead><tr><th>Doctor</th><th>Specialization</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {data.appointments.map(a => (
                    <tr key={a.id}>
                      <td className="fw-semibold">Dr. {a.doctor_first_name} {a.doctor_last_name}</td>
                      <td>{a.specialization || '—'}</td>
                      <td>{a.appointment_date ? new Date(a.appointment_date).toLocaleDateString() : 'TBD'}</td>
                      <td><span className={`hd-badge hd-badge-${a.status}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="hd-empty-state"><i className="bi bi-calendar-x d-block"></i><h5>No Appointments</h5></div>
          )}
        </div>
      )}
    </div>
  );
}
