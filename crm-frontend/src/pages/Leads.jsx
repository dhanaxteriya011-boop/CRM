import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Leads.css';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState({ title:'', source:'Website', status:'New', contact_id:'', assigned_to:'' });
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ search:'', status:'', source:'' });
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);

  const load = () => {
    api.get('/leads', { params: { ...filters, page } }).then(r => { 
      setLeads(r.data.data); 
      setMeta(r.data); 
    });
  };

  useEffect(() => { load(); }, [filters, page]);

  useEffect(() => {
    api.get('/contacts', { params: { page: 1 } }).then(r => setContacts(r.data.data));
    api.get('/users').then(r => setUsers(r.data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/leads', form);
    setShowForm(false);
    load();
  };

  const handleConvert = async (id) => {
    if (window.confirm('Convert this lead to a Deal?')) {
      await api.post(`/leads/${id}/convert`);
      load();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      await api.delete(`/leads/${id}`);
      load();
    }
  };

  const getStatusClass = (status) => `status-pill status-${status.toLowerCase()}`;

  return (
    <div className="leads-page">
      <div className="leads-header">
        <h2>Lead Pipeline</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add New Lead</button>
      </div>

      {/* Filter Section */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <input 
            className="filter-input" 
            placeholder="Search leads..." 
            value={filters.search} 
            onChange={e=>setFilters({...filters, search:e.target.value})} 
            style={{width: '100%'}}
          />
        </div>
        <select className="filter-input filter-select" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}>
          <option value="">All Statuses</option>
          <option>New</option><option>Contacted</option><option>Qualified</option><option>Converted</option>
        </select>
        <select className="filter-input filter-select" value={filters.source} onChange={e=>setFilters({...filters,source:e.target.value})}>
          <option value="">All Sources</option>
          <option>Website</option><option>Ads</option><option>Referral</option><option>Other</option>
        </select>
      </div>

      {/* Lead Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Lead</h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="full-width">
                <label className="label">Title</label>
                <input className="input-field" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
              </div>
              <div>
                <label className="label">Source</label>
                <select className="input-field" value={form.source} onChange={e=>setForm({...form,source:e.target.value})}>
                  <option>Website</option><option>Ads</option><option>Referral</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input-field" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  <option>New</option><option>Contacted</option><option>Qualified</option>
                </select>
              </div>
              <div className="full-width">
                <label className="label">Primary Contact</label>
                <select className="input-field" value={form.contact_id} onChange={e=>setForm({...form,contact_id:e.target.value})}>
                  <option value="">-- Select Contact --</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="full-width">
                <label className="label">Assign To Agent</label>
                <select className="input-field" value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})}>
                  <option value="">-- Select User --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="full-width" style={{marginTop: '1rem', display: 'flex', gap: '10px'}}>
                <button type="submit" className="btn-primary" style={{flex: 1}}>Create Lead</button>
                <button type="button" className="btn-icon" style={{flex: 1}} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="leads-table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Lead Title</th>
              <th>Contact</th>
              <th>Source</th>
              <th>Status</th>
              <th>Owner</th>
              <th style={{textAlign: 'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id}>
                <td><Link to={`/leads/${l.id}`} className="lead-link">{l.title}</Link></td>
                <td>{l.contact?.name || '---'}</td>
                <td><span style={{fontSize: '0.85rem'}}>{l.source}</span></td>
                <td><span className={getStatusClass(l.status)}>{l.status}</span></td>
                <td><span style={{fontSize: '0.85rem', color: '#64748b'}}>{l.assigned_to?.name || 'Unassigned'}</span></td>
                <td style={{textAlign: 'right'}}>
                  <div className="action-btns" style={{justifyContent: 'flex-end'}}>
                    {l.status !== 'Converted' && (
                      <button className="btn-icon btn-convert" onClick={() => handleConvert(l.id)}>Convert</button>
                    )}
                    <button className="btn-icon btn-delete" onClick={() => handleDelete(l.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Section */}
        <div className="pagination">
          <span style={{fontSize: '0.9rem', color: '#64748b'}}>
            Page <strong>{meta.current_page}</strong> of {meta.last_page}
          </span>
          <div style={{display: 'flex', gap: '5px'}}>
            <button 
              className="btn-icon" 
              disabled={meta.current_page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <button 
              className="btn-icon" 
              disabled={meta.current_page === meta.last_page} 
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}