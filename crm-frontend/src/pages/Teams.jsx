import { useState, useEffect } from 'react';
import api from '../api/axios';
import './Teams.css';
import './Leads.css'; // Reusing global modal & button styles

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name:'', manager_id:'', members:[] });
  const [showForm, setShowForm] = useState(false);

  const load = () => api.get('/teams').then(r => setTeams(r.data));
  
  useEffect(() => {
    load();
    api.get('/users').then(r => setUsers(r.data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/teams', form);
    setShowForm(false); 
    setForm({ name:'', manager_id:'', members:[] });
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to dissolve this team?')) { 
      await api.delete(`/teams/${id}`); 
      load(); 
    }
  };

  const toggleMember = (id) => {
    setForm(f => ({
      ...f,
      members: f.members.includes(id) ? f.members.filter(m => m !== id) : [...f.members, id]
    }));
  };

  return (
    <div className="teams-page">
      <div className="leads-header">
        <div>
          <h2>Team Structure</h2>
          <p style={{color: '#64748b', fontSize: '0.9rem'}}>Organize your consultants into collaborative squads</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Create New Team</button>
      </div>

      {/* --- Add/Edit Team Modal --- */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '500px'}}>
            <h3>Team Configuration</h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="full-width">
                <label className="label">Team Identity Name</label>
                <input 
                    className="input-field" 
                    placeholder="e.g. North Region Sales" 
                    value={form.name} 
                    onChange={e=>setForm({...form,name:e.target.value})} 
                    required 
                />
              </div>
              
              <div className="full-width">
                <label className="label">Assign Team Lead / Manager</label>
                <select className="input-field" value={form.manager_id} onChange={e=>setForm({...form,manager_id:e.target.value})}>
                    <option value="">-- No Manager Assigned --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div className="full-width">
                <label className="label">Select Team Members</label>
                <div className="member-selection-list">
                    {users.map(u => (
                        <label key={u.id} className="selection-item">
                            <input 
                                type="checkbox" 
                                checked={form.members.includes(u.id)} 
                                onChange={() => toggleMember(u.id)} 
                            />
                            <span>{u.name}</span>
                        </label>
                    ))}
                </div>
              </div>

              <div className="full-width" style={{display: 'flex', gap: '10px', marginTop: '1rem'}}>
                <button type="submit" className="btn-primary" style={{flex: 1}}>Save Team</button>
                <button type="button" className="btn-secondary" style={{flex: 1}} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Team Card Grid --- */}
      <div className="team-grid">
        {teams.length === 0 && (
            <p style={{color: '#94a3b8', textAlign: 'center', gridColumn: '1/-1', padding: '3rem'}}>
                No teams established. Create your first team to start organizing users.
            </p>
        )}
        {teams.map(t => (
          <div key={t.id} className="team-card">
            <div className="team-card-header">
                <span className="team-name">{t.name}</span>
                <span style={{fontSize: '1.2rem'}}>🛡️</span>
            </div>

            <div className="manager-info">
                <div>
                    <span className="manager-label">Team Lead</span>
                    <span className="manager-name">{t.manager?.name || 'Unassigned'}</span>
                </div>
            </div>

            <div className="member-roster">
                <span className="roster-label">Members ({t.members?.length || 0})</span>
                <div className="member-pills">
                    {t.members?.length > 0 ? t.members.map(m => (
                        <span key={m.id} className="member-pill">{m.name}</span>
                    )) : <span style={{fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic'}}>No members added</span>}
                </div>
            </div>

            <div className="team-card-footer">
                <button className="btn-icon btn-delete" onClick={() => handleDelete(t.id)}>Dissolve Team</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}