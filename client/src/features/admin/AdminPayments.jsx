import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const limit = 15;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = { page, limit };
        if (filter) params.status = filter;
        const { data: res } = await adminAPI.getPayments(params);
        setPayments(res.data);
        setTotal(res.meta?.total || 0);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, [page, filter]);

  const totalPages = Math.ceil(total / limit);
  const totalAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return (
    <div>
      <div className="hd-page-header">
        <div><h1 className="hd-page-title">All Payments</h1><p className="hd-page-subtitle">Monitor all platform payments and revenue.</p></div>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="hd-stat-card"><div className="hd-stat-icon success"><i className="bi bi-cash-stack"></i></div><div><div className="hd-stat-value">₹{totalAmount.toFixed(0)}</div><div className="hd-stat-label">Page Total</div></div></div>
        </div>
        <div className="col-md-4">
          <div className="hd-stat-card"><div className="hd-stat-icon primary"><i className="bi bi-receipt"></i></div><div><div className="hd-stat-value">{total}</div><div className="hd-stat-label">Total Transactions</div></div></div>
        </div>
        <div className="col-md-4">
          <div className="hd-stat-card"><div className="hd-stat-icon warning"><i className="bi bi-clock-history"></i></div><div><div className="hd-stat-value">{payments.filter(p => p.status === 'created').length}</div><div className="hd-stat-label">Pending on Page</div></div></div>
        </div>
      </div>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {['', 'paid', 'created', 'failed', 'refunded'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }} className={`hd-btn hd-btn-sm ${filter === s ? 'hd-btn-primary' : 'hd-btn-outline'}`}>{s || 'All'}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="hd-card">
          {payments.length > 0 ? (
            <div className="table-responsive">
              <table className="hd-table">
                <thead><tr><th>Date</th><th>Patient</th><th>Doctor</th><th>Amount</th><th>Status</th><th>Transaction ID</th></tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td>{p.patient_first_name} {p.patient_last_name}</td>
                      <td>Dr. {p.doctor_first_name} {p.doctor_last_name}</td>
                      <td className="fw-bold">₹{p.amount}</td>
                      <td><span className={`hd-badge ${p.status === 'paid' ? 'hd-badge-paid' : p.status === 'failed' ? 'hd-badge-rejected' : 'hd-badge-pending'}`}>{p.status}</span></td>
                      <td><span className="small text-muted">{p.razorpay_payment_id || '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="hd-empty-state"><i className="bi bi-cash d-block"></i><h5>No Payments</h5></div>}
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
