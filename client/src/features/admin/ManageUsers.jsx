import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const limit = 15;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data: res } = await adminAPI.getUsers(params);
      setUsers(res.data);
      setTotal(res.meta?.total || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const handleBlock = async (id, isBlocked) => {
    try {
      await adminAPI.blockUser(id, !isBlocked);
      toast.success(`User ${!isBlocked ? 'blocked' : 'unblocked'}`);
      fetchUsers();
    } catch (err) { toast.error('Failed to update user'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) { toast.error('Failed to delete user'); }
  };

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchUsers(); };
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="hd-page-header">
        <div><h1 className="hd-page-title">Manage Users</h1><p className="hd-page-subtitle">View, block, and manage all platform users.</p></div>
      </div>

      {/* Search & Filter */}
      <div className="hd-card mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <form onSubmit={handleSearch} className="d-flex gap-2">
              <input type="text" className="hd-form-control" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <button type="submit" className="hd-btn hd-btn-primary">Search</button>
            </form>
          </div>
          <div className="col-md-6">
            <div className="d-flex gap-2 justify-content-md-end">
              {['', 'patient', 'doctor', 'admin'].map(r => (
                <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }} className={`hd-btn hd-btn-sm ${roleFilter === r ? 'hd-btn-primary' : 'hd-btn-outline'}`}>{r || 'All Roles'}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="hd-card">
          <p className="text-muted mb-3">{total} user{total !== 1 ? 's' : ''} found</p>
          {users.length > 0 ? (
            <div className="table-responsive">
              <table className="hd-table">
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {u.profile_image_url ? (
                            <img
                              src={u.profile_image_url}
                              alt={u.first_name}
                              className="rounded-circle"
                              style={{
                                width: 32,
                                height: 32,
                                objectFit: "cover"
                              }}
                            />
                          ) : (
                            <div
                              className="hd-avatar-placeholder"
                              style={{ width: 32, height: 32, fontSize: "0.7rem" }}
                            >
                              {u.first_name?.[0]}
                              {u.last_name?.[0]}
                            </div>
                          )}

                          <span className="fw-semibold">
                            {u.first_name} {u.last_name}
                          </span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td><span className={`hd-badge ${u.role === 'doctor' ? 'hd-badge-accepted' : u.role === 'admin' ? 'hd-badge-completed' : 'hd-badge-pending'}`}>{u.role}</span></td>
                      <td><span className={`hd-badge ${u.is_blocked ? 'hd-badge-rejected' : 'hd-badge-accepted'}`}>{u.is_blocked ? 'Blocked' : 'Active'}</span></td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className={`hd-btn hd-btn-sm ${u.is_blocked ? 'hd-btn-success' : 'hd-btn-outline'}`} onClick={() => handleBlock(u.id, u.is_blocked)} title={u.is_blocked ? 'Unblock' : 'Block'}>
                            <i className={`bi ${u.is_blocked ? 'bi-check-lg' : 'bi-ban'}`}></i>
                          </button>
                          <button className="hd-btn hd-btn-sm hd-btn-outline text-danger" onClick={() => handleDelete(u.id)} title="Delete"><i className="bi bi-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="hd-empty-state"><i className="bi bi-people d-block"></i><h5>No Users Found</h5></div>
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
