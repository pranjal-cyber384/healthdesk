import React from 'react';

export default function Emergency() {
  const emergencyNumbers = [
    { name: 'National Emergency Number', number: '112', icon: 'bi-exclamation-triangle-fill', color: 'danger' },
    { name: 'Ambulance', number: '108', icon: 'bi-hospital', color: 'danger' },
    { name: 'Police', number: '100', icon: 'bi-shield-fill', color: 'primary' },
    { name: 'Fire Brigade', number: '101', icon: 'bi-fire', color: 'warning' },
    { name: 'Women Helpline', number: '1091', icon: 'bi-person-hearts', color: 'purple' },
    { name: 'Mental Health Helpline', number: '08046110007', icon: 'bi-heart-pulse', color: 'teal' },
    { name: 'Child Helpline', number: '1098', icon: 'bi-people-fill', color: 'info' },
    { name: 'Poison Control', number: '1800-11-6117', icon: 'bi-biohazard', color: 'success' }
  ];

  const firstAidTips = [
    { title: 'Heart Attack', icon: 'bi-heart-fill', tips: ['Call 108 immediately', 'Chew an aspirin if available', 'Loosen tight clothing', 'Begin CPR if person becomes unresponsive'] },
    { title: 'Choking', icon: 'bi-person-fill', tips: ['Stand behind the person', 'Perform abdominal thrusts (Heimlich)', 'Call for help if not resolved', 'For infants: back blows and chest thrusts'] },
    { title: 'Severe Bleeding', icon: 'bi-droplet-fill', tips: ['Apply firm pressure with clean cloth', 'Elevate the wounded area', 'Do not remove embedded objects', 'Keep the person warm and call ambulance'] },
    { title: 'Burns', icon: 'bi-fire', tips: ['Cool with running water for 10+ minutes', 'Do not apply ice or ointments', 'Cover with a clean, loose dressing', 'Seek medical attention for severe burns'] }
  ];

  return (
    <div>
      <div className="hd-page-header">
        <div>
          <h1 className="hd-page-title text-danger"><i className="bi bi-telephone-fill me-2"></i>Emergency</h1>
          <p className="hd-page-subtitle">Emergency contact numbers and first aid information.</p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="alert alert-danger d-flex align-items-center gap-3 mb-4" style={{ borderRadius: 'var(--hd-radius-lg)' }}>
        <i className="bi bi-exclamation-octagon-fill fs-3"></i>
        <div>
          <strong>In case of a medical emergency, call 112 immediately.</strong>
          <div className="small mt-1">Do not delay calling emergency services. The numbers listed below are for India.</div>
        </div>
      </div>

      {/* Emergency Numbers Grid */}
      <h3 className="mb-3"><i className="bi bi-telephone-outbound text-primary me-2"></i>Emergency Numbers</h3>
      <div className="row g-3 mb-5">
        {emergencyNumbers.map((em, i) => (
          <div className="col-6 col-md-4 col-lg-3" key={i}>
            <div className="hd-card hd-card-elevated text-center h-100">
              <div className={`hd-stat-icon ${em.color} mx-auto mb-2`} style={{ width: 56, height: 56, fontSize: '1.5rem' }}>
                <i className={`bi ${em.icon}`}></i>
              </div>
              <h5 className="mb-1">{em.name}</h5>
              <a href={`tel:${em.number}`} className="fs-4 fw-bold text-decoration-none" style={{ color: `var(--hd-${em.color === 'purple' ? 'medical-purple' : em.color === 'teal' ? 'medical-teal' : em.color})` }}>
                {em.number}
              </a>
              <div className="mt-2">
                <a href={`tel:${em.number}`} className="hd-btn hd-btn-primary hd-btn-sm hd-btn-block"><i className="bi bi-telephone-fill"></i> Call Now</a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* First Aid Tips */}
      <h3 className="mb-3"><i className="bi bi-bandaid text-success me-2"></i>Basic First Aid Guide</h3>
      <div className="row g-4">
        {firstAidTips.map((tip, i) => (
          <div className="col-md-6" key={i}>
            <div className="hd-card h-100">
              <h4 className="mb-3"><i className={`bi ${tip.icon} text-danger me-2`}></i>{tip.title}</h4>
              <ol className="mb-0" style={{ paddingLeft: '1.25rem' }}>
                {tip.tips.map((t, j) => <li key={j} className="mb-1">{t}</li>)}
              </ol>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
