import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function CallStats() {
  const [stats, setStats] = useState(null);
  const [dateRange, setDateRange] = useState({ date_from: '', date_to: '' });

  const load = () => api.get('/calls/stats', { params: dateRange }).then(r => setStats(r.data));
  useEffect(() => { load(); }, []);

  if (!stats) return <p>Loading stats...</p>;

  return (
    <div>
      <h3>Call Statistics</h3>
      <div>
        From: <input type="date" value={dateRange.date_from} onChange={e => setDateRange({ ...dateRange, date_from: e.target.value })} />
        To: <input type="date" value={dateRange.date_to} onChange={e => setDateRange({ ...dateRange, date_to: e.target.value })} />
        <button onClick={load}>Apply</button>
      </div>

      <table border="1" cellPadding="8" style={{ marginTop: '15px' }}>
        <tbody>
          <tr><td><strong>Total Calls</strong></td><td>{stats.total}</td></tr>
          <tr><td><strong>Completed</strong></td><td>{stats.completed}</td></tr>
          <tr><td><strong>Missed</strong></td><td style={{ color: 'red' }}>{stats.missed}</td></tr>
          <tr><td><strong>Escalated</strong></td><td style={{ color: 'orange' }}>{stats.escalated}</td></tr>
          <tr><td><strong>Missed Rate</strong></td><td>{stats.missed_rate}</td></tr>
          <tr><td><strong>Avg Call Duration</strong></td><td>{stats.avg_duration}</td></tr>
        </tbody>
      </table>

      <h4>By Status</h4>
      <table border="1" cellPadding="5">
        <thead><tr><th>Status</th><th>Count</th></tr></thead>
        <tbody>{stats.by_status.map(s => <tr key={s.status}><td>{s.status}</td><td>{s.count}</td></tr>)}</tbody>
      </table>

      <h4>Completed By Agent</h4>
      <table border="1" cellPadding="5">
        <thead><tr><th>Agent</th><th>Calls Completed</th></tr></thead>
        <tbody>{stats.by_user.map(u => <tr key={u.attended_by}><td>{u.attended_by?.name}</td><td>{u.count}</td></tr>)}</tbody>
      </table>
    </div>
  );
}