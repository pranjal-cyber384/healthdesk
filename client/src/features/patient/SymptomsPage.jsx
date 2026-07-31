import React, { useState, useEffect } from 'react';
import { symptomAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

export default function SymptomsPage() {
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessing, setAssessing] = useState(null);
  const [form, setForm] = useState({ description: '', severity: 'mild' });
  const [showForm, setShowForm] = useState(false);

  const fetchSymptoms = async () => {
    try {
      const { data: res } = await symptomAPI.list({ page: 1, limit: 50 });
      setSymptoms(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchSymptoms(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.description.trim().length < 10) { toast.error('Description must be at least 10 characters'); return; }
    setSubmitting(true);
    try {
      await symptomAPI.create(form);
      toast.success('Symptoms recorded!');
      setForm({ description: '', severity: 'mild' });
      setShowForm(false);
      fetchSymptoms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record symptoms');
    }
    setSubmitting(false);
  };

  const handleAssess = async (id) => {
    setAssessing(id);
    try {
      const { data: res } = await symptomAPI.assess(id);
      toast.success('AI assessment generated');
      fetchSymptoms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI assessment failed — service may not be configured');
    }
    setAssessing(null);
  };

  if (loading) return <Spinner />;

  const severityColors = { mild: 'success', moderate: 'warning', severe: 'danger' };

  return (
    <div>
      <div className="hd-page-header">
        <div>
          <h1 className="hd-page-title">Symptom Tracker</h1>
          <p className="hd-page-subtitle">Record your symptoms and get AI-powered preliminary assessments.</p>
        </div>
        <button className="hd-btn hd-btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-plus-lg'}`}></i> {showForm ? 'Cancel' : 'Record Symptoms'}
        </button>
      </div>

      {/* Recording Form */}
      {showForm && (
        <div className="hd-card mb-4 hd-fade-in">
          <h4 className="mb-3">Record New Symptoms</h4>
          <form onSubmit={handleSubmit}>
            <div className="hd-form-group">
              <label className="hd-form-label">Describe Your Symptoms</label>
              <textarea className="hd-form-control" rows="4" placeholder="Describe what you're feeling in detail... (at least 10 characters)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required minLength={10}></textarea>
            </div>
            <div className="hd-form-group">
              <label className="hd-form-label">Severity Level</label>
              <div className="d-flex gap-3">
                {['mild', 'moderate', 'severe'].map(s => (
                  <label key={s} className={`flex-fill p-3 rounded-3 border text-center text-capitalize ${form.severity === s ? `border-${severityColors[s]} bg-${severityColors[s]} bg-opacity-10` : ''}`} style={{ cursor: 'pointer' }}>
                    <input type="radio" name="severity" className="d-none" value={s} checked={form.severity === s} onChange={(e) => setForm({ ...form, severity: e.target.value })} />
                    <i className={`bi bi-${s === 'mild' ? 'emoji-smile' : s === 'moderate' ? 'emoji-neutral' : 'emoji-frown'} d-block fs-4 mb-1 text-${severityColors[s]}`}></i>
                    <div className="fw-semibold">{s}</div>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" className="hd-btn hd-btn-primary" disabled={submitting}>
              {submitting ? <><span className="spinner-border spinner-border-sm"></span> Saving...</> : <><i className="bi bi-check-lg"></i> Save Symptoms</>}
            </button>
          </form>
        </div>
      )}

      {/* Disclaimer */}
      <div className="alert alert-warning d-flex align-items-start gap-2 mb-4">
        <i className="bi bi-exclamation-triangle-fill mt-1"></i>
        <div>
          <strong>Disclaimer:</strong> AI assessments are for informational purposes only and do not replace professional medical advice. Always consult a qualified healthcare professional for diagnosis.
        </div>
      </div>

      {/* Symptom History */}
      {symptoms.length > 0 ? (
        <div className="d-flex flex-column gap-3">
          {symptoms.map(s => (
            <div key={s.id} className="hd-card">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className={`hd-badge hd-badge-${s.severity === 'severe' ? 'rejected' : s.severity === 'moderate' ? 'pending' : 'accepted'}`}>
                  <i className={`bi bi-${s.severity === 'mild' ? 'emoji-smile' : s.severity === 'moderate' ? 'emoji-neutral' : 'emoji-frown'}`}></i> {s.severity}
                </span>
                <small className="text-muted">{new Date(s.recorded_at || s.created_at).toLocaleString()}</small>
              </div>
              <p className="mb-2">{s.description}</p>

              {s.ai_assessment ? (
                <div className="p-3 rounded-3" style={{ background: 'var(--hd-medical-teal-light)' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-robot text-primary"></i>
                    <span className="fw-semibold small">AI Preliminary Assessment</span>
                  </div>
                  <p className="mb-0 small">{s.ai_assessment}</p>
                </div>
              ) : (
                <button className="hd-btn hd-btn-outline hd-btn-sm" onClick={() => handleAssess(s.id)} disabled={assessing === s.id}>
                  {assessing === s.id ? <><span className="spinner-border spinner-border-sm"></span> Analyzing...</> : <><i className="bi bi-robot"></i> Get AI Assessment</>}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="hd-card"><div className="hd-empty-state"><i className="bi bi-clipboard2-pulse d-block"></i><h5>No Symptoms Recorded</h5><p className="small">Start recording your symptoms to track your health.</p></div></div>
      )}
    </div>
  );
}
