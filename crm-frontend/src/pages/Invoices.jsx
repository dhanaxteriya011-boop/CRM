import { useState, useEffect } from 'react';
import api from '../api/axios';
import './Invoices.css';
import './Leads.css'; // Reusing global modal and table styles

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ contact_id:'', amount:'', due_date:'', notes:'' });
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  // Helper for Currency
  const formatCurrency = (val) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const load = () => {
    api.get('/invoices', { params: { status: filterStatus } }).then(r => setInvoices(r.data.data));
  };

  useEffect(() => { 
    load(); 
    api.get('/contacts', { params: { page:1 } }).then(r => setContacts(r.data.data)); 
  }, [filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/invoices', form);
    setShowForm(false); 
    setForm({ contact_id:'', amount:'', due_date:'', notes:'' });
    load();
  };

  const updateStatus = async (id, status) => {
    if(window.confirm(`Mark this invoice as ${status}?`)) {
        await api.put(`/invoices/${id}`, { status });
        load();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this invoice record?')) { 
        await api.delete(`/invoices/${id}`); 
        load(); 
    }
  };

  const getStatusClass = (status) => `inv-status inv-${status.toLowerCase()}`;

  // Calculate quick stats for the header
  const totalOutstanding = invoices.filter(i => i.status === 'Unpaid').reduce((sum, i) => sum + parseFloat(i.amount), 0);
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + parseFloat(i.amount), 0);

  return (
    <div className="invoices-page">
      <div className="leads-header">
        <div>
          <h2>Billing & Invoices</h2>
          <p style={{color: '#64748b', fontSize: '0.9rem'}}>Manage client billing and track payment collection</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Create New Invoice</button>
      </div>

      {/* --- Financial Summary --- */}
      <div className="invoice-summary-bar">
        <div className="summary-card">
            <span className="summary-label">Outstanding Revenue</span>
            <span className="summary-value unpaid">{formatCurrency(totalOutstanding)}</span>
        </div>
        <div className="summary-card">
            <span className="summary-label">Collected (This Page)</span>
            <span className="summary-value paid">{formatCurrency(totalPaid)}</span>
        </div>
        <div className="summary-card">
            <span className="summary-label">Total Invoices</span>
            <span className="summary-value">{invoices.length}</span>
        </div>
      </div>

      {/* --- Filter Bar --- */}
      <div className="filter-bar">
        <span style={{fontSize: '0.85rem', fontWeight: 600, color: '#64748b'}}>Filter Status:</span>
        <select className="filter-input" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">All Invoices</option>
            <option>Unpaid</option>
            <option>Paid</option>
            <option>Cancelled</option>
        </select>
      </div>

      {/* --- Create Invoice Modal --- */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Generate Invoice</h3>
            <form onSubmit={handleSubmit} className="invoice-form-grid">
              <div className="full-span">
                <label className="label">Customer / Contact</label>
                <select className="input-field" value={form.contact_id} onChange={e=>setForm({...form,contact_id:e.target.value})} required>
                    <option value="">-- Select Contact --</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Total Amount (INR)</label>
                <input className="input-field" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required placeholder="0.00" />
              </div>
              <div>
                <label className="label">Payment Due Date</label>
                <input className="input-field" type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} required />
              </div>
              <div className="full-span">
                <label className="label">Internal Notes / Terms</label>
                <textarea className="input-field" rows="3" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="e.g. 50% Advance received..." />
              </div>
              <div className="full-span" style={{display: 'flex', gap: '10px', marginTop: '1rem'}}>
                <button type="submit" className="btn-primary" style={{flex: 1}}>Generate Invoice</button>
                <button type="button" className="btn-secondary" style={{flex: 1}} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Invoices Table --- */}
      <div className="leads-table-container">
        <table className="crm-table">
            <thead>
                <tr>
                    <th>Invoice ID</th>
                    <th>Billed To</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th style={{textAlign: 'right'}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {invoices.length === 0 && (
                    <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#94a3b8'}}>No invoices found for this criteria.</td></tr>
                )}
                {invoices.map(i => (
                    <tr key={i.id}>
                        <td className="invoice-num">#{i.invoice_number || i.id}</td>
                        <td>
                            <div style={{fontWeight: 600}}>{i.contact?.name}</div>
                            <div style={{fontSize: '0.75rem', color: '#64748b'}}>{i.contact?.email}</div>
                        </td>
                        <td className="amount-cell">{formatCurrency(i.amount)}</td>
                        <td><span className={getStatusClass(i.status)}>{i.status}</span></td>
                        <td><span style={{fontSize: '0.85rem'}}>{i.due_date}</span></td>
                        <td style={{textAlign: 'right'}}>
                            <div className="action-btns" style={{justifyContent: 'flex-end'}}>
                                {i.status === 'Unpaid' && (
                                    <button 
                                        className="btn-icon" 
                                        style={{color: '#10b981', borderColor: '#10b981'}} 
                                        onClick={() => updateStatus(i.id, 'Paid')}
                                    >
                                        Mark Paid
                                    </button>
                                )}
                                <button className="btn-icon btn-delete" onClick={() => handleDelete(i.id)}>Delete</button>
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