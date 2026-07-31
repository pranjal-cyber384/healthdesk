import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doctorAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function PatientHistoryView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('appointments');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await doctorAPI.getPatientHistory(id);
        setData(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <Spinner />;
  if (!data) return <div className="hd-card"><div className="hd-empty-state"><h5>Patient Not Found</h5></div></div>;

  const p = data.patient;
  const tabs = [
    { key: 'appointments', label: 'Appointments', count: data.appointments?.length },
    { key: 'prescriptions', label: 'Prescriptions', count: data.prescriptions?.length },
    { key: 'reports', label: 'Reports', count: data.reports?.length },
    { key: 'symptoms', label: 'Symptoms', count: data.symptoms?.length }
  ];

  return (
    <div>
      <div className="mb-3"><Link to="/doctor/patients" className="text-muted small"><i className="bi bi-arrow-left me-1"></i>Back to Patients</Link></div>

      {/* Patient Header */}
      <div className="hd-card mb-4">
        <div className="d-flex align-items-center gap-4 flex-wrap">
          {p?.profile_image_url ? <img src={p.profile_image_url} className="hd-avatar-xl" alt="" /> : <div className="hd-avatar-placeholder xl">{p?.first_name?.[0]}{p?.last_name?.[0]}</div>}
          <div className="flex-grow-1">
            <h3 className="mb-1">{p?.first_name} {p?.last_name}</h3>
            <div className="d-flex gap-3 flex-wrap text-muted small">
              {p?.email && <span><i className="bi bi-envelope me-1"></i>{p.email}</span>}
              {p?.phone && <span><i className="bi bi-telephone me-1"></i>{p.phone}</span>}
              {p?.gender && <span className="text-capitalize"><i className="bi bi-gender-ambiguous me-1"></i>{p.gender}</span>}
              {p?.blood_group && <span><i className="bi bi-droplet me-1"></i>{p.blood_group}</span>}
            </div>
            {(p?.allergies || p?.chronic_conditions) && (
              <div className="mt-2 d-flex gap-3 flex-wrap">
                {p.allergies && <span className="hd-badge hd-badge-rejected"><i className="bi bi-exclamation-triangle me-1"></i>Allergies: {p.allergies}</span>}
                {p.chronic_conditions && <span className="hd-badge hd-badge-pending"><i className="bi bi-heart-pulse me-1"></i>{p.chronic_conditions}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`hd-btn ${tab === t.key ? 'hd-btn-primary' : 'hd-btn-outline'}`}>
            {t.label} <span className="badge bg-white text-dark ms-1">{t.count || 0}</span>
          </button>
        ))}
      </div>

      <div className="hd-card">
        {tab === 'appointments' && (
          data.appointments?.length > 0 ? (
            <div className="table-responsive"><table className="hd-table"><thead><tr><th>Date</th><th>Doctor</th><th>Type</th><th>Status</th></tr></thead><tbody>
              {data.appointments.map(a => (<tr key={a.id}><td>{a.appointment_date ? new Date(a.appointment_date).toLocaleDateString() : 'TBD'}</td><td>Dr. {a.doctor_first_name} {a.doctor_last_name}</td><td className="text-capitalize">{a.consultation_type}</td><td><span className={`hd-badge hd-badge-${a.status}`}>{a.status}</span></td></tr>))}
            </tbody></table></div>
          ) : <div className="text-muted text-center py-4">No appointments</div>
        )}
        {tab === 'prescriptions' && (
          data.prescriptions?.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {data.prescriptions.map(pr => (<div key={pr.id} className="p-3 rounded-3" style={{ background: 'var(--hd-gray-50)' }}><div className="d-flex justify-content-between mb-1"><strong>Dr. {pr.doctor_first_name} {pr.doctor_last_name}</strong><small className="text-muted">{new Date(pr.created_at).toLocaleDateString()}</small></div><p className="mb-1 small"><strong>Diagnosis:</strong> {pr.diagnosis}</p><p className="mb-0 small"><strong>Medications:</strong> {pr.medications}</p></div>))}
            </div>
          ) : <div className="text-muted text-center py-4">No prescriptions</div>
        )}
        {tab === 'reports' && (
          data.reports?.length > 0 ? (
            <div className="table-responsive"><table className="hd-table"><thead><tr><th>Title</th><th>Type</th><th>Date</th><th></th></tr></thead><tbody>
              {data.reports.map(r => (<tr key={r.id}><td>{r.title}</td><td><span className="hd-badge hd-badge-accepted">{r.record_type}</span></td><td>{new Date(r.created_at).toLocaleDateString()}</td><td>{r.file_url && <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="hd-btn hd-btn-outline hd-btn-sm"><i className="bi bi-eye"></i></a>}</td></tr>))}
            </tbody></table></div>
          ) : <div className="text-muted text-center py-4">No reports</div>
        )}
        {tab === 'symptoms' && (
          data.symptoms?.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {data.symptoms.map(s => (<div key={s.id} className="p-3 rounded-3" style={{ background: 'var(--hd-gray-50)' }}><div className="d-flex justify-content-between mb-1"><span className={`hd-badge hd-badge-${s.severity === 'severe' ? 'rejected' : s.severity === 'moderate' ? 'pending' : 'accepted'}`}>{s.severity}</span><small className="text-muted">{new Date(s.recorded_at).toLocaleString()}</small></div><p className="mb-0 small">{s.description}</p></div>))}
            </div>
          ) : <div className="text-muted text-center py-4">No symptoms recorded</div>
        )}
      </div>
    </div>
  );
}
