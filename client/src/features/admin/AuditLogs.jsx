import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data: res } = await adminAPI.getAuditLogs({ page, limit });
        setLogs(res.data);
        setTotal(res.meta?.total || 0);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  const getActionColor = (action) => {
    if (action?.includes('delete') || action?.includes('block') || action?.includes('suspend') || action?.includes('reject')) return 'danger';
    if (action?.includes('create') || action?.includes('approve') || action?.includes('verify')) return 'success';
    if (action?.includes('update') || action?.includes('edit')) return 'warning';
    return 'info';
  };

  return (
    <div>
      <div className="hd-page-header">
        <div><h1 className="hd-page-title">Audit Logs</h1><p className="hd-page-subtitle">View all admin actions and system events.</p></div>
      </div>

      {loading ? <Spinner /> : (
        <div className="hd-card">
          {logs.length > 0 ? (
            <div className="table-responsive">
              <table className="hd-table">
                <thead><tr><th>Timestamp</th><th>Action</th><th>User</th><th>Target</th><th>Details</th><th>IP</th></tr></thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td><div className="small">{new Date(log.created_at).toLocaleString()}</div></td>
                      <td><span className={`hd-badge hd-badge-${getActionColor(log.action) === 'danger' ? 'rejected' : getActionColor(log.action) === 'success' ? 'accepted' : 'pending'}`}>{log.action}</span></td>
                      <td><div className="small fw-semibold">{log.admin_name || 'System'}</div><small className="text-muted">{log.admin_email}</small></td>
                      <td className="small">{log.target_type}: {log.target_id}</td>
                      <td className="small hd-truncate" style={{ maxWidth: 200 }}>{log.details || '—'}</td>
                      <td className="small text-muted">{log.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="hd-empty-state"><i className="bi bi-journal-text d-block"></i><h5>No Audit Logs</h5><p className="small">Admin actions will be logged here.</p></div>
          )}
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
