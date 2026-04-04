import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Deals.css';
import './Leads.css'; // Reusing modal & table core styles

const STAGES = ['Prospecting', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [pipeline, setPipeline] = useState({});
  const [form, setForm] = useState({ title:'', contact_id:'', stage:'Prospecting', value:'', expected_close_date:'' });
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({ search:'', stage:'' });
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);

  const formatCurrency = (val) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const load = () => {
    api.get('/deals', { params: { ...filters, page } }).then(r => { setDeals(r.data.data); setMeta(r.data); });
    api.get('/deals/pipeline').then(r => setPipeline(r.data));
  };

  useEffect(() => { load(); }, [filters, page]);
  useEffect(() => { api.get('/contacts', { params: { page:1 } }).then(r => setContacts(r.data.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/deals', form);
    setShowForm(false); 
    load();
  };

  const getStageClass = (stage) => {
    if (stage === 'Closed Won') return 'stage-pill stage-won';
    if (stage === 'Closed Lost') return 'stage-pill stage-lost';
    return 'stage-pill stage-default';
  };

  return (
    <div className="deals-container">
      <div className="deals-header">
        <div>
          <h2>Sales Pipeline</h2>
          <p style={{color: '#64748b', fontSize: '0.9rem'}}>Track opportunities and revenue stages</p>
        </div>
        
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div className="view-switcher">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button 
              className={`view-btn ${viewMode === 'pipeline' ? 'active' : ''}`}
              onClick={() => setViewMode('pipeline')}
            >
              Kanban
            </button>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ New Deal</button>
        </div>
      </div>

      {/* New Deal Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Deal</h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="full-width">
                <label className="label">Deal Title</label>
                <input className="input-field" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required placeholder="e.g. 500 Licenses for Corp A" />
              </div>
              <div>
                <label className="label">Stage</label>
                <select className="input-field" value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})}>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Expected Value (₹)</label>
                <input className="input-field" type="number" value={form.value} onChange={e=>setForm({...form,value:e.target.value})} />
              </div>
              <div className="full-width">
                <label className="label">Primary Contact</label>
                <select className="input-field" value={form.contact_id} onChange={e=>setForm({...form,contact_id:e.target.value})}>
                  <option value="">-- Select Contact --</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="full-width">
                <label className="label">Expected Close Date</label>
                <input className="input-field" type="date" value={form.expected_close_date} onChange={e=>setForm({...form,expected_close_date:e.target.value})} />
              </div>
              <div className="full-width" style={{display:'flex', gap:'10px', marginTop:'1rem'}}>
                <button type="submit" className="btn-primary" style={{flex: 1}}>Save Deal</button>
                <button type="button" className="btn-secondary" style={{flex: 1}} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="leads-table-container">
          <div className="filter-bar" style={{border: 'none', borderBottom: '1px solid #e2e8f0', borderRadius: 0}}>
            <input className="filter-input" style={{flexGrow: 1}} placeholder="Search deals..." value={filters.search} onChange={e=>setFilters({...filters,search:e.target.value})} />
            <select className="filter-input" value={filters.stage} onChange={e=>setFilters({...filters,stage:e.target.value})}>
              <option value="">All Stages</option>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <table className="crm-table">
            <thead>
              <tr><th>Deal Title</th><th>Contact</th><th>Stage</th><th>Value</th><th>Expected Close</th></tr>
            </thead>
            <tbody>
              {deals.map(d => (
                <tr key={d.id}>
                  <td><Link to={`/deals/${d.id}`} className="lead-link">{d.title}</Link></td>
                  <td>{d.contact?.name || '---'}</td>
                  <td><span className={getStageClass(d.stage)}>{d.stage}</span></td>
                  <td><strong>{formatCurrency(d.value)}</strong></td>
                  <td>{d.expected_close_date || 'TBD'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
             <span>Page {meta.current_page} of {meta.last_page}</span>
             <div style={{display:'flex', gap:'5px'}}>
                <button className="btn-icon" disabled={meta.current_page===1} onClick={()=>setPage(p=>p-1)}>Prev</button>
                <button className="btn-icon" disabled={meta.current_page===meta.last_page} onClick={()=>setPage(p=>p+1)}>Next</button>
             </div>
          </div>
        </div>
      ) : (
        <div className="pipeline-board">
          {STAGES.map(stage => {
            const stageDeals = pipeline[stage] || [];
            const stageTotal = stageDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
            
            return (
              <div key={stage} className="pipeline-column">
                <div className="column-header">
                  <span className="column-title">{stage}</span>
                  <span className="column-count">{stageDeals.length}</span>
                </div>
                <div className="column-value">{formatCurrency(stageTotal)}</div>
                
                <div className="column-cards">
                  {stageDeals.map(d => (
                    <div key={d.id} className="deal-card" onClick={() => window.location.href=`/deals/${d.id}`}>
                      <Link to={`/deals/${d.id}`} className="deal-card-title">{d.title}</Link>
                      <div className="deal-card-contact">{d.contact?.name || 'No Contact'}</div>
                      <div className="deal-card-footer">
                        <span className="deal-card-value">{formatCurrency(d.value)}</span>
                        <span className="deal-card-date">{d.expected_close_date?.split('-')[1]}/{d.expected_close_date?.split('-')[0].slice(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}