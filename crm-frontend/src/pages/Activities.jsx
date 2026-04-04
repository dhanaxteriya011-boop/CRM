import { useState, useEffect } from 'react';
import api from '../api/axios';
import './Activities.css';
import './Leads.css'; // Reusing global modal and table styles

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [form, setForm] = useState({ type: 'call', title: '', description: '', due_at: '' });
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ type: '', completed: '' });

  const load = () => {
    api.get('/activities', { params: filters }).then(r => setActivities(r.data.data));
    api.get('/activities/upcoming').then(r => setUpcoming(r.data));
  };

  useEffect(() => { load(); }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/activities', form);
    setShowForm(false);
    setForm({ type: 'call', title: '', description: '', due_at: '' });
    load();
  };

  const toggleComplete = async (a) => {
    await api.put(`/activities/${a.id}`, { completed: !a.completed });
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove this activity from your schedule?')) {
      await api.delete(`/activities/${id}`);
      load();
    }
  };

  const formatDateTime = (str) => {
    if (!str) return 'N/A';
    return new Date(str).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  const getTypeIcon = (type) => {
    const icons = { call: '📞', meeting: '👥', email: '✉️', 'follow-up': '🔁' };
    return icons[type] || '📅';
  };

  return (
    <div className="activities-page">
      <div className="leads-header">
        <div>
          <h2>Activity Manager</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Stay on top of your meetings and follow-ups</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Schedule Activity</button>
      </div>

      {/* --- Upcoming Focus Grid --- */}
      {upcoming.length > 0 && (
        <div className="upcoming-section">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>🔥 Priority Next</h3>
          <div className="upcoming-grid">
            {upcoming.slice(0, 3).map(a => (
              <div key={a.id} className="upcoming-card">
                <div className="upcoming-info">
                  <h4>{a.title}</h4>
                  <div className="upcoming-date">{formatDateTime(a.due_at)}</div>
                </div>
                <span className={`type-badge type-${a.type}`}>{getTypeIcon(a.type)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Filters --- */}
      <div className="filter-bar">
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Filters:</span>
        <select className="filter-input" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="call">Calls</option>
          <option value="meeting">Meetings</option>
          <option value="follow-up">Follow-ups</option>
          <option value="email">Emails</option>
        </select>
        <select className="filter-input" value={filters.completed} onChange={e => setFilters({ ...filters, completed: e.target.value })}>
          <option value="">All Status</option>
          <option value="false">Pending Tasks</option>
          <option value="true">Completed</option>
        </select>
      </div>

      {/* --- Schedule Activity Modal --- */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Schedule New Activity</h3>
            <form onSubmit={handleSubmit} className="activity-form-grid">
              <div>
                <label className="label">Activity Type</label>
                <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="call">Call</option>
                  <option value="meeting">Meeting</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div>
                <label className="label">Due Date & Time</label>
                <input className="input-field" type="datetime-local" value={form.due_at} onChange={e => setForm({ ...form, due_at: e.target.value })} required />
              </div>
              <div className="full">
                <label className="label">Title</label>
                <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Follow up on proposal" />
              </div>
              <div className="full">
                <label className="label">Notes / Description</label>
                <textarea className="input-field" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mention key details to discuss..." />
              </div>
              <div className="full" style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Schedule</button>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Main Activity List --- */}
      <div className="leads-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Task Details</th>
              <th>Type</th>
              <th>Due Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(a => (
              <tr key={a.id} className={a.completed ? 'completed-row' : ''}>
                <td>
                  <input 
                    type="checkbox" 
                    className="status-check" 
                    checked={a.completed} 
                    onChange={() => toggleComplete(a)} 
                  />
                </td>
                <td>
                  <div className={a.completed ? 'text-completed' : ''} style={{ fontWeight: 600 }}>{a.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.description?.substring(0, 50)}...</div>
                </td>
                <td>
                  <span className={`type-badge type-${a.type}`}>
                    {getTypeIcon(a.type)} {a.type}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', color: a.completed ? '#94a3b8' : '#1e293b' }}>
                    {formatDateTime(a.due_at)}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn-icon btn-delete" onClick={() => handleDelete(a.id)}>Delete</button>
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