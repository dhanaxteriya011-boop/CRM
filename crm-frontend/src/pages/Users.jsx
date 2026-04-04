import { useState, useEffect } from 'react';
import api from '../api/axios';
import './Users.css';
import './Leads.css'; // Reusing global modal and table styles

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Sales' });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    api.get('/users', { params: { search } }).then(r => setUsers(r.data.data));
  };

  useEffect(() => { load(); }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/users', form);
    setShowForm(false);
    setForm({ name: '', email: '', password: '', role: 'Sales' });
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Permanent Action: Are you sure you want to delete this user?')) {
      await api.delete(`/users/${id}`);
      load();
    }
  };

  const toggleActive = async (u) => {
    const newStatus = u.is_active === false; // If currently false, set to true
    await api.put(`/users/${u.id}`, { is_active: newStatus });
    load();
  };

  // Helper for Initials
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const getRoleClass = (role) => `role-badge role-${(role || 'Sales').toLowerCase()}`;

  return (
    <div className="users-page">
      <div className="leads-header">
        <div>
          <h2>User Management</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Control access, assign roles, and manage team accounts</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Invite New User</button>
      </div>

      {/* Filter / Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper" style={{ flexGrow: 1 }}>
          <input
            className="filter-input"
            style={{ width: '100%' }}
            placeholder="Search by name or email address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Add User Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New System User</h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="full-width">
                <label className="label">Full Name</label>
                <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Enter full name" />
              </div>
              <div className="full-width">
                <label className="label">Email Address</label>
                <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="work@company.com" />
              </div>
              <div>
                <label className="label">Temporary Password</label>
                <input className="input-field" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div>
                <label className="label">System Role</label>
                <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>Sales</option>
                  <option>Support</option>
                </select>
              </div>
              <div className="full-width" style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create Account</button>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Users Table */}
      <div className="leads-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>System Role</th>
              <th>Access Status</th>
              <th style={{ textAlign: 'right' }}>Management Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="user-info-cell">
                    <div className="user-avatar">{getInitials(u.name)}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={getRoleClass(u.roles?.[0]?.name)}>
                    {u.roles?.[0]?.name || 'No Role'}
                  </span>
                </td>
                <td>
                  <div className="status-indicator">
                    <div className={`dot ${u.is_active !== false ? 'dot-active' : 'dot-inactive'}`} />
                    <span>{u.is_active !== false ? 'Active Access' : 'Suspended'}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                    <button
                      className={`btn-toggle-active ${u.is_active !== false ? 'btn-deactivate' : 'btn-activate'}`}
                      onClick={() => toggleActive(u)}
                    >
                      {u.is_active !== false ? 'Suspend' : 'Reactivate'}
                    </button>
                    <button className="btn-icon btn-delete" onClick={() => handleDelete(u.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}