import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function RoutingRules({ teams, users }) {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState({
    team_id: '', routing_type: 'round-robin', timeout_minutes: 5,
    max_attempts: 3, escalate_to_manager: true, active: true, user_order: []
  });

  const load = () => api.get('/routing-rules').then(r => setRules(r.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/routing-rules', form);
    load();
    alert('Routing rule saved!');
  };

  const toggleUser = (id) => {
    setForm(f => ({
      ...f,
      user_order: f.user_order.includes(id) ? f.user_order.filter(u => u !== id) : [...f.user_order, id]
    }));
  };

  return (
    <div>
      <h3>⚙️ Call Routing Rules (Admin)</h3>
      <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '15px' }}>
        <div><label>Team:
          <select value={form.team_id} onChange={e => setForm({ ...form, team_id: e.target.value })}>
            <option value="">Global (no team)</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label></div>
        <div><label>Routing Type:
          <select value={form.routing_type} onChange={e => setForm({ ...form, routing_type: e.target.value })}>
            <option value="round-robin">Round-robin (equal rotation)</option>
            <option value="priority">Priority order</option>
            <option value="first-available">First available</option>
          </select>
        </label></div>
        <div><label>Timeout (minutes): <input type="number" value={form.timeout_minutes} min={1} max={60} onChange={e => setForm({ ...form, timeout_minutes: parseInt(e.target.value) })} /></label></div>
        <div><label>Max Attempts before escalation: <input type="number" value={form.max_attempts} min={1} max={10} onChange={e => setForm({ ...form, max_attempts: parseInt(e.target.value) })} /></label></div>
        <div><label><input type="checkbox" checked={form.escalate_to_manager} onChange={e => setForm({ ...form, escalate_to_manager: e.target.checked })} /> Escalate to Manager after all attempts</label></div>
        <div><label><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label></div>

        {form.routing_type === 'priority' && (
          <div>
            <strong>Priority Order (check in order):</strong>
            {users.map(u => (
              <label key={u.id} style={{ display: 'block' }}>
                <input type="checkbox" checked={form.user_order.includes(u.id)} onChange={() => toggleUser(u.id)} />
                {' '}{u.name} [{u.roles?.[0]?.name}]
              </label>
            ))}
          </div>
        )}
        <button type="submit">Save Rule</button>
      </form>

      <h4>Current Rules</h4>
      {rules.map(r => (
        <div key={r.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <strong>Team:</strong> {r.team?.name || 'Global'} |{' '}
          <strong>Type:</strong> {r.routing_type} |{' '}
          <strong>Timeout:</strong> {r.timeout_minutes}min |{' '}
          <strong>Max Attempts:</strong> {r.max_attempts} |{' '}
          <strong>Escalate:</strong> {r.escalate_to_manager ? 'Yes' : 'No'} |{' '}
          <strong>Status:</strong> {r.active ? '✅ Active' : '❌ Inactive'}
        </div>
      ))}
    </div>
  );
}