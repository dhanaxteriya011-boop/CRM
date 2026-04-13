import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Members() {
  const [members, setMembers]   = useState([]);
  const [quota, setQuota]       = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch]     = useState('');
  const [meta, setMeta]         = useState({});
  const [page, setPage]         = useState(1);
  const [msg, setMsg]           = useState('');
  const [form, setForm]         = useState({
    name: '', username: '', email: '', password: '', role: 'Sales',
  });
  const [resetPw, setResetPw]   = useState({ userId: null, password: '' });

  const load = () => {
    api.get('/members', { params: { search, page } }).then(r => {
      setMembers(r.data.data); setMeta(r.data);
    });
    api.get('/subscription/current').then(r => setQuota(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [search, page]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      if (editUser) {
        await api.put(`/members/${editUser.id}`, form);
        setMsg('✅ Member updated');
      } else {
        await api.post('/members', form);
        setMsg('✅ Member added');
      }
      setForm({ name: '', username: '', email: '', password: '', role: 'Sales' });
      setShowForm(false); setEditUser(null);
      load();
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) {
        setMsg('❌ ' + Object.values(errs).flat().join(' | '));
      } else {
        setMsg('❌ ' + (err.response?.data?.message || 'Failed'));
      }
    }
  };

  const startEdit = (m) => {
    setEditUser(m);
    setForm({ name: m.name, username: m.username, email: m.email || '', password: '', role: m.roles?.[0]?.name || 'Sales' });
    setShowForm(true);
  };

  const toggleActive = async (m) => {
    await api.put(`/members/${m.id}`, { is_active: !m.is_active });
    load();
  };

  const doResetPw = async (e) => {
    e.preventDefault();
    await api.post(`/members/${resetPw.userId}/reset-password`, { password: resetPw.password });
    setResetPw({ userId: null, password: '' });
    setMsg('✅ Password reset');
  };

  return (
    <div>
      <h2>👥 Team Members</h2>

      {/* Quota bar */}
      {quota?.subscription && (
        <div style={{ background: '#f5f5f5', padding: '10px', marginBottom: '12px', border: '1px solid #ddd' }}>
          <strong>Plan:</strong> {quota.subscription.plan?.name} |{' '}
          <strong>Members:</strong> {quota.member_count} / {quota.member_limit} |{' '}
          <strong>Slots left:</strong> {quota.members_left} |{' '}
          <strong>Expires:</strong> {quota.expires_at} ({quota.days_left} days left)
          {quota.days_left < 7 && <span style={{ color: 'red', marginLeft: '8px' }}>⚠️ Expiring soon! Renew now.</span>}
        </div>
      )}

      {msg && <p style={{ color: msg.startsWith('✅') ? 'green' : 'red', fontWeight: 'bold' }}>{msg}</p>}

      <div style={{ marginBottom: '10px' }}>
        <input placeholder="Search name or username..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ marginRight: '8px' }} />
        <button onClick={() => { setEditUser(null); setForm({ name:'', username:'', email:'', password:'', role:'Sales' }); setShowForm(!showForm); }}>
          {showForm && !editUser ? '✕ Cancel' : '＋ Add Member'}
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '12px', marginBottom: '12px' }}>
          <h3>{editUser ? `Edit: ${editUser.name}` : 'Add New Member'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label>Full Name*<br />
              <input value={form.name} onChange={e => set('name', e.target.value)} required style={{ width: '100%' }} />
            </label>
            <label>Username* (login ID)<br />
              <input value={form.username} onChange={e => set('username', e.target.value)} required
                placeholder="letters, numbers, underscores" style={{ width: '100%' }} />
            </label>
            <label>Password* {editUser && '(leave blank to keep current)'}
              <br /><input type="password" value={form.password}
                onChange={e => set('password', e.target.value)}
                required={!editUser} style={{ width: '100%' }} />
            </label>
            <label>Role*<br />
              <select value={form.role} onChange={e => set('role', e.target.value)} style={{ width: '100%' }}>
                <option value="Manager">Manager</option>
                <option value="Sales">Sales</option>
                <option value="Support">Support</option>
              </select>
            </label>
            <label>Email (optional)<br />
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={{ width: '100%' }} />
            </label>
          </div>
          <div style={{ marginTop: '10px' }}>
            <button type="submit">{editUser ? 'Update Member' : 'Add Member'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditUser(null); }} style={{ marginLeft: '8px' }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Reset Password inline form */}
      {resetPw.userId && (
        <form onSubmit={doResetPw} style={{ border: '1px solid orange', padding: '10px', marginBottom: '12px', background: '#fff8e1' }}>
          <strong>Reset Password for member #{resetPw.userId}</strong><br />
          <input type="password" value={resetPw.password} onChange={e => setResetPw({ ...resetPw, password: e.target.value })}
            placeholder="New password (min 6 chars)" required minLength={6} style={{ marginRight: '8px' }} />
          <button type="submit">Set Password</button>
          <button type="button" onClick={() => setResetPw({ userId: null, password: '' })} style={{ marginLeft: '8px' }}>Cancel</button>
        </form>
      )}

      {/* Members Table */}
      <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f5f5f5' }}>
          <tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {members.length === 0 && (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
              No members yet. Add your first team member above.
            </td></tr>
          )}
          {members.map(m => (
            <tr key={m.id} style={{ background: m.is_active ? 'white' : '#f5f5f5', color: m.is_active ? 'black' : '#999' }}>
              <td>{m.name}</td>
              <td><strong>{m.username}</strong></td>
              <td>{m.email || '—'}</td>
              <td>{m.roles?.[0]?.name}</td>
              <td>
                <span style={{ color: m.is_active ? 'green' : 'red', fontWeight: 'bold' }}>
                  {m.is_active ? '● Active' : '● Inactive'}
                </span>
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button onClick={() => startEdit(m)}>✏️ Edit</button>{' '}
                <button onClick={() => setResetPw({ userId: m.id, password: '' })}>🔑 Reset PW</button>{' '}
                <button onClick={() => toggleActive(m)} style={{ color: m.is_active ? 'red' : 'green' }}>
                  {m.is_active ? '🚫 Deactivate' : '✅ Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '10px' }}>
        Page {meta.current_page} of {meta.last_page || 1}{' '}
        {meta.current_page > 1 && <button onClick={() => setPage(p => p - 1)}>◀ Prev</button>}
        {' '}
        {meta.current_page < meta.last_page && <button onClick={() => setPage(p => p + 1)}>Next ▶</button>}
      </div>
    </div>
  );
}