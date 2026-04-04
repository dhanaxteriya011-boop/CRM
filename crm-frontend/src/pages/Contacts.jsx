import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Contacts.css'; // New Styles
import './Leads.css';    // Reuse shared modal & table styles

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [form, setForm] = useState({ name:'', email:'', phone:'', company:'', address:'', tag:'Cold lead' });
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  const load = () => {
    api.get('/contacts', { params: { search, tag, page } }).then(r => {
      setContacts(r.data.data);
      setMeta(r.data);
    });
  };

  useEffect(() => { load(); }, [search, tag, page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/contacts', form);
    setForm({ name:'', email:'', phone:'', company:'', address:'', tag:'Cold lead' });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      await api.delete(`/contacts/${id}`);
      load();
    }
  };

  const handleImport = async (e) => {
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    await api.post('/contacts/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    load();
  };

  const getTagClass = (tag) => `tag-badge tag-${tag.toLowerCase().replace(' ', '-')}`;

  return (
    <div className="contacts-container">
      <div className="contacts-header">
        <div>
          <h2>Contacts</h2>
          <p style={{color: '#64748b', fontSize: '0.9rem', marginTop: '4px'}}>Manage and segment your customer database</p>
        </div>
        
        <div className="toolbar">
          <a href="http://localhost:8000/api/contacts/export" className="btn-secondary">
            <span>📥</span> Export CSV
          </a>
          <label className="btn-secondary import-label">
            <span>📤</span> Import
            <input type="file" accept=".csv,.xlsx" hidden onChange={handleImport} />
          </label>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Add Contact
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-wrapper">
          <input 
            className="filter-input" 
            style={{width: '100%'}}
            placeholder="Search by name, email or company..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <select className="filter-input" value={tag} onChange={e => setTag(e.target.value)}>
          <option value="">All Tags</option>
          <option>Hot lead</option>
          <option>Warm lead</option>
          <option>Cold lead</option>
          <option>Customer</option>
        </select>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '600px'}}>
            <h3>Create New Contact</h3>
            <form onSubmit={handleSubmit} className="contacts-form-grid">
              <div className="full-col">
                <label className="form-label">Full Name *</label>
                <input className="input-field" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input className="input-field" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input className="input-field" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
              </div>
              <div>
                <label className="form-label">Company Name</label>
                <input className="input-field" value={form.company} onChange={e=>setForm({...form, company:e.target.value})} />
              </div>
              <div>
                <label className="form-label">Classification Tag</label>
                <select className="input-field" value={form.tag} onChange={e=>setForm({...form, tag:e.target.value})}>
                  <option>Hot lead</option><option>Warm lead</option><option>Cold lead</option><option>Customer</option>
                </select>
              </div>
              <div className="full-col">
                <label className="form-label">Office Address</label>
                <textarea className="input-field" rows="2" value={form.address} onChange={e=>setForm({...form, address:e.target.value})} />
              </div>
              <div className="full-col" style={{display: 'flex', gap: '12px', marginTop: '1rem'}}>
                <button type="submit" className="btn-primary" style={{flex: 1}}>Save Contact</button>
                <button type="button" className="btn-secondary" style={{flex: 1}} onClick={() => setShowForm(false)}>Cancel</button>
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
              <th>Contact Details</th>
              <th>Phone</th>
              <th>Status</th>
              <th style={{textAlign: 'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="contact-name-cell">
                    <Link to={`/contacts/${c.id}`} className="contact-name-link">{c.name}</Link>
                    <span className="contact-company">{c.email} • {c.company || 'Private'}</span>
                  </div>
                </td>
                <td><span style={{fontSize: '0.9rem'}}>{c.phone}</span></td>
                <td><span className={getTagClass(c.tag)}>{c.tag}</span></td>
                <td style={{textAlign: 'right'}}>
                  <div className="action-btns" style={{justifyContent: 'flex-end'}}>
                    <Link to={`/contacts/${c.id}`} className="btn-icon">View</Link>
                    <button onClick={() => handleDelete(c.id)} className="btn-icon btn-delete">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination">
          <span style={{fontSize: '0.85rem', color: '#64748b'}}>
            Showing page <strong>{meta.current_page}</strong> of {meta.last_page}
          </span>
          <div style={{display: 'flex', gap: '8px'}}>
            <button className="btn-icon" disabled={meta.current_page === 1} onClick={() => setPage(p=>p-1)}>Previous</button>
            <button className="btn-icon" disabled={meta.current_page === meta.last_page} onClick={() => setPage(p=>p+1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}