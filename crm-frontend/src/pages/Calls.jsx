import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Calls.css';
import './Leads.css'; // Reusing global btn and table styles
import './Deals.css'; // Reusing view-switcher styles

const STATUS_COLOR = {
  pending: '#64748b', assigned: '#2563eb', attended: '#7c3aed',
  completed: '#16a34a', missed: '#dc2626', escalated: '#991b1b',
};

const PRIORITY_LABEL = { 0: 'Normal', 1: '⚠️ High', 2: '🚨 Urgent' };

export default function Calls() {
  const { user, hasRole } = useAuth();
  const [calls, setCalls] = useState([]);
  const [myCalls, setMyCalls] = useState([]);
  const [meta, setMeta] = useState({});
  const [tab, setTab] = useState('calls');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', search: '', priority: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    title: '', caller_name: '', caller_phone: '',
    contact_id: '', team_id: '', priority: 0,
    routing_type: 'round-robin', timeout_minutes: 5, max_attempts: 3, notes: '',
  });
  const pollRef = useRef(null);

  const load = () => {
    api.get('/calls', { params: { ...filters, page } }).then(r => {
      setCalls(r.data.data); setMeta(r.data);
    });
    api.get('/calls/my').then(r => setMyCalls(r.data));
  };

  useEffect(() => {
    load();
    api.get('/teams').then(r => setTeams(r.data));
    if (hasRole('Admin') || hasRole('Manager')) {
      api.get('/users').then(r => setUsers(r.data.data));
    }
    pollRef.current = setInterval(load, 20000);
    return () => clearInterval(pollRef.current);
  }, [filters, page]);

  const createCall = async (e) => {
    e.preventDefault();
    await api.post('/calls', form);
    setShowCreate(false);
    load();
  };

  const attendCall = async (id) => { await api.post(`/calls/${id}/attend`); load(); };
  const declineCall = async (id) => {
    const reason = prompt('Decline reason?') || 'declined';
    await api.post(`/calls/${id}/decline`, { reason });
    load();
  };

  const canManage = hasRole('Admin') || hasRole('Manager');

  return (
    <div className="calls-page">
      <div className="leads-header">
        <div>
          <h2>Communication Center</h2>
          <p style={{color: '#64748b', fontSize: '0.9rem'}}>Manage incoming calls and automated routing</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Close Form' : '+ New Call'}
        </button>
      </div>

      {/* --- LIVE ASSIGNMENT ALERT --- */}
      {myCalls.length > 0 && (
        <div className="my-calls-alert">
            <strong style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e'}}>
                <span style={{fontSize: '1.2rem'}}>🔔</span> Action Required: {myCalls.length} Active Assignments
            </strong>
            {myCalls.map(c => (
                <div key={c.id} className="alert-item">
                    <div>
                        <Link to={`/calls/${c.id}`} style={{fontWeight: 700, color: '#1e293b', textDecoration: 'none'}}>{c.title}</Link>
                        <div style={{fontSize: '0.8rem', color: '#64748b'}}>{c.caller_name} • {PRIORITY_LABEL[c.priority]}</div>
                    </div>
                    <div style={{display: 'flex', gap: '8px'}}>
                        {c.status === 'assigned' && (
                            <>
                                <button className="btn-icon" style={{background: '#16a34a', color: 'white', border: 'none'}} onClick={() => attendCall(c.id)}>Attend</button>
                                <button className="btn-icon" style={{color: '#dc2626'}} onClick={() => declineCall(c.id)}>Decline</button>
                            </>
                        )}
                        <Link to={`/calls/${c.id}`} className="btn-secondary" style={{padding: '4px 12px'}}>Details</Link>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* --- TAB NAVIGATION --- */}
      <div className="view-switcher" style={{marginBottom: '1.5rem'}}>
          <button className={`view-btn ${tab === 'calls' ? 'active' : ''}`} onClick={() => setTab('calls')}>Live Queue</button>
          {canManage && <button className={`view-btn ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>Analytics</button>}
          {hasRole('Admin') && <button className={`view-btn ${tab === 'routing' ? 'active' : ''}`} onClick={() => setTab('routing')}>Routing Rules</button>}
      </div>

      {tab === 'calls' && (
        <>
          <div className="filter-bar">
            <input className="filter-input" placeholder="Search caller..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
            <select className="filter-input" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Status</option>
              {['pending','assigned','attended','completed','missed','escalated'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="filter-input" value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All Priority</option>
              <option value="0">Normal</option><option value="1">High</option><option value="2">Urgent</option>
            </select>
            <button onClick={load} className="btn-secondary">🔄 Refresh</button>
          </div>

          {showCreate && (
            <div className="call-form-modal">
                <form onSubmit={createCall} className="form-grid">
                    <div className="full-width">
                        <label className="label">Call Title *</label>
                        <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div>
                        <label className="label">Caller Name</label>
                        <input className="input-field" value={form.caller_name} onChange={e => setForm({ ...form, caller_name: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Phone Number</label>
                        <input className="input-field" value={form.caller_phone} onChange={e => setForm({ ...form, caller_phone: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Priority Level</label>
                        <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) })}>
                            <option value={0}>Normal</option><option value={1}>High</option><option value={2}>Urgent</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Assign to Team</label>
                        <select className="input-field" value={form.team_id} onChange={e => setForm({ ...form, team_id: e.target.value })}>
                            <option value="">-- Manual Routing --</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="full-width">
                        <button type="submit" className="btn-primary" style={{width: '100%'}}>Initiate Routing Sequence 🚀</button>
                    </div>
                </form>
            </div>
          )}

          <div className="leads-table-container">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Call Subject</th>
                  <th>Caller Info</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Owner</th>
                  <th style={{textAlign: 'right'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {calls.map(c => (
                  <tr key={c.id} className={`priority-${c.priority}`}>
                    <td><Link to={`/calls/${c.id}`} style={{fontWeight: 600, color: '#2563eb', textDecoration: 'none'}}>{c.title}</Link></td>
                    <td><div style={{fontSize: '0.9rem'}}>{c.caller_name}</div><div style={{fontSize: '0.75rem', color: '#64748b'}}>{c.caller_phone}</div></td>
                    <td>
                        <span className="status-pill" style={{background: STATUS_COLOR[c.status], color: 'white'}}>
                            {c.status}
                        </span>
                    </td>
                    <td>{PRIORITY_LABEL[c.priority]}</td>
                    <td>{c.assigned_to?.name || '—'}</td>
                    <td style={{textAlign: 'right'}}>
                        <Link to={`/calls/${c.id}`} className="btn-icon">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
                <span>Page {meta.current_page} of {meta.last_page || 1}</span>
                <div style={{display: 'flex', gap: '5px'}}>
                    <button className="btn-icon" onClick={() => setPage(p => p - 1)} disabled={meta.current_page === 1}>Prev</button>
                    <button className="btn-icon" onClick={() => setPage(p => p + 1)} disabled={meta.current_page === meta.last_page}>Next</button>
                </div>
            </div>
          </div>
        </>
      )}

      {tab === 'stats' && <CallStats formatCurrency={formatCurrency} />}
      {tab === 'routing' && <RoutingRules teams={teams} users={users} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// REFINED STATS COMPONENT
// ─────────────────────────────────────────────────────────
function CallStats() {
    const [stats, setStats] = useState(null);
    useEffect(() => { api.get('/calls/stats').then(r => setStats(r.data)); }, []);

    if (!stats) return <p>Calculating analytics...</p>;

    return (
        <div className="stats-container">
            <div className="stats-summary-grid">
                <div className="kpi-card">
                    <span className="kpi-label">Total Calls</span>
                    <span className="kpi-value">{stats.total}</span>
                </div>
                <div className="kpi-card" style={{borderColor: '#10b981'}}>
                    <span className="kpi-label">Completed</span>
                    <span className="kpi-value" style={{color: '#10b981'}}>{stats.completed}</span>
                </div>
                <div className="kpi-card" style={{borderColor: '#ef4444'}}>
                    <span className="kpi-label">Missed</span>
                    <span className="kpi-value" style={{color: '#ef4444'}}>{stats.missed}</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Miss Rate</span>
                    <span className="kpi-value">{stats.missed_rate}</span>
                </div>
            </div>

            <div className="data-grid">
                <div className="card">
                    <div className="card-header">Performance by Agent</div>
                    <table className="crm-table">
                        <thead><tr><th>Agent Name</th><th>Success</th></tr></thead>
                        <tbody>
                            {stats.by_user.map(u => (
                                <tr key={u.attended_by}>
                                    <td>{u.attended_by?.name || 'Unknown Agent'}</td>
                                    <td><strong>{u.calls_completed}</strong> completed</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="card">
                    <div className="card-header">Volume by Status</div>
                    <table className="crm-table">
                        <thead><tr><th>Status</th><th>Count</th></tr></thead>
                        <tbody>
                            {stats.by_status.map(s => (
                                <tr key={s.status}><td>{s.status.toUpperCase()}</td><td>{s.count}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// REFINED ROUTING RULES COMPONENT
// ─────────────────────────────────────────────────────────
function RoutingRules({ teams, users }) {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState({
    team_id: '', routing_type: 'round-robin',
    timeout_minutes: 5, max_attempts: 3,
    escalate_to_manager: true, active: true, user_order: [],
  });

  const load = () => api.get('/routing-rules').then(r => setRules(r.data));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.post('/routing-rules', form);
    load();
    alert('Routing Logic Updated');
  };

  const toggleUser = (id) => {
    setForm(f => ({
      ...f,
      user_order: f.user_order.includes(id) ? f.user_order.filter(u => u !== id) : [...f.user_order, id],
    }));
  };

  return (
    <div className="routing-container">
      <h3>Automated Routing Rules</h3>
      <p style={{color: '#64748b', marginBottom: '2rem'}}>Define how the system distributes calls to agents when a team is selected.</p>

      <form onSubmit={save} className="form-grid" style={{marginBottom: '3rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px'}}>
        <div>
          <label className="label">Target Team</label>
          <select className="input-field" value={form.team_id} onChange={e => setForm({ ...form, team_id: e.target.value })}>
            <option value="">Global Rule (Default)</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Routing Strategy</label>
          <select className="input-field" value={form.routing_type} onChange={e => setForm({ ...form, routing_type: e.target.value })}>
            <option value="round-robin">Round-Robin (Rotation)</option>
            <option value="priority">Priority List (Hierarchy)</option>
            <option value="first-available">First Available (Workload)</option>
          </select>
        </div>
        <button type="submit" className="btn-primary" style={{marginTop: '25px'}}>Save Policy</button>
      </form>

      <div className="rules-list">
        <h4>Existing Team Policies</h4>
        {rules.map(r => (
            <div key={r.id} className={`rule-item-card ${r.active ? 'rule-active' : 'rule-inactive'}`}>
                <div>
                    <div style={{fontWeight: 700}}>{r.team?.name || 'Global System Rule'}</div>
                    <div style={{fontSize: '0.85rem', color: '#64748b'}}>Strategy: {r.routing_type} • Timeout: {r.timeout_minutes}m</div>
                </div>
                <div>
                    <span className="status-pill" style={{background: r.active ? '#16a34a' : '#94a3b8', color: 'white'}}>
                        {r.active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}