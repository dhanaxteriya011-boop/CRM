import { useState, useEffect } from 'react';
import api from '../api/axios';
import './Emails.css';
import './Leads.css'; // Reusing global modal/button styles

export default function Emails() {
  const [templates, setTemplates] = useState([]);
  const [sent, setSent] = useState([]);
  const [templateForm, setTemplateForm] = useState({ name:'', subject:'', body:'' });
  const [sendForm, setSendForm] = useState({ to_email:'', subject:'', body:'' });
  const [tab, setTab] = useState('send');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    api.get('/email-templates').then(r => setTemplates(r.data.data));
    api.get('/emails/sent').then(r => setSent(r.data.data));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await api.post('/emails/send', sendForm);
      setSendForm({ to_email:'', subject:'', body:'' });
      loadData();
      alert('🚀 Email sent successfully!');
    } catch (err) {
      alert('Error sending email');
    }
  };

  const saveTemplate = async (e) => {
    e.preventDefault();
    await api.post('/email-templates', templateForm);
    setTemplateForm({ name:'', subject:'', body:'' });
    loadData();
  };

  const applyTemplate = (t) => {
    setSendForm({ ...sendForm, subject: t.subject, body: t.body });
    setTab('send');
  };

  const deleteTemplate = async (id) => {
    if (window.confirm('Delete this template?')) {
      await api.delete(`/email-templates/${id}`);
      loadData();
    }
  };

  return (
    <div className="email-container">
      <div className="leads-header">
        <div>
          <h2>Email Communication</h2>
          <p style={{color: '#64748b', fontSize: '0.9rem'}}>Compose emails, manage templates, and track delivery</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-header">
        <button className={`tab-btn ${tab === 'send' ? 'active' : ''}`} onClick={() => setTab('send')}>Compose</button>
        <button className={`tab-btn ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}>Templates</button>
        <button className={`tab-btn ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>Sent Tracking</button>
      </div>

      {/* 1. SEND EMAIL TAB */}
      {tab === 'send' && (
        <div className="compose-layout">
          <div className="email-form-card">
            <h3 style={{marginBottom: '1.5rem', fontSize: '1.1rem'}}>New Message</h3>
            <form onSubmit={handleSend}>
              <div className="form-group" style={{marginBottom: '1rem'}}>
                <label className="label">Recipient Address</label>
                <input className="input-field" type="email" placeholder="customer@example.com" value={sendForm.to_email} onChange={e=>setSendForm({...sendForm,to_email:e.target.value})} required />
              </div>
              <div className="form-group" style={{marginBottom: '1rem'}}>
                <label className="label">Subject Line</label>
                <input className="input-field" placeholder="Enter email subject" value={sendForm.subject} onChange={e=>setSendForm({...sendForm,subject:e.target.value})} required />
              </div>
              <div className="form-group" style={{marginBottom: '1.5rem'}}>
                <label className="label">Message Body</label>
                <textarea className="input-field email-textarea" rows={12} placeholder="Type your message here..." value={sendForm.body} onChange={e=>setSendForm({...sendForm,body:e.target.value})} required />
              </div>
              <button type="submit" className="btn-primary" style={{width: '200px', padding: '12px'}}>Send Message ✉️</button>
            </form>
          </div>

          <div className="template-sidebar">
            <h4>Quick Templates</h4>
            {templates.length === 0 && <p style={{fontSize: '0.8rem', color: '#94a3b8'}}>No templates saved yet.</p>}
            {templates.map(t => (
              <div key={t.id} className="template-item" onClick={() => applyTemplate(t)}>
                <span>{t.name}</span>
                <span className="apply-icon">→</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TEMPLATES TAB */}
      {tab === 'templates' && (
        <div className="compose-layout">
          <div className="email-form-card">
            <h3>Create Template</h3>
            <form onSubmit={saveTemplate}>
              <div style={{marginBottom: '1rem'}}>
                <label className="label">Template Name</label>
                <input className="input-field" value={templateForm.name} onChange={e=>setTemplateForm({...templateForm,name:e.target.value})} required />
              </div>
              <div style={{marginBottom: '1rem'}}>
                <label className="label">Default Subject</label>
                <input className="input-field" value={templateForm.subject} onChange={e=>setTemplateForm({...templateForm,subject:e.target.value})} required />
              </div>
              <div style={{marginBottom: '1rem'}}>
                <label className="label">Body Content</label>
                <textarea className="input-field" rows={6} value={templateForm.body} onChange={e=>setTemplateForm({...templateForm,body:e.target.value})} required />
              </div>
              <button type="submit" className="btn-primary">Save Template</button>
            </form>
          </div>

          <div className="leads-table-container" style={{background: 'white'}}>
            <table className="crm-table">
              <thead>
                <tr><th>Name</th><th style={{textAlign: 'right'}}>Actions</th></tr>
              </thead>
              <tbody>
                {templates.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.name}</strong></td>
                    <td style={{textAlign: 'right'}}>
                      <button className="btn-icon btn-delete" onClick={() => deleteTemplate(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SENT EMAILS TAB */}
      {tab === 'sent' && (
        <div className="leads-table-container">
          <table className="crm-table">
            <thead>
              <tr><th>Recipient</th><th>Subject</th><th>Opened</th><th>Date Sent</th></tr>
            </thead>
            <tbody>
              {sent.map(e => (
                <tr key={e.id}>
                  <td>{e.to_email}</td>
                  <td className="sent-subject">{e.subject}</td>
                  <td>
                    <span className={`open-badge ${e.opened ? 'badge-yes' : 'badge-no'}`}>
                      {e.opened ? 'OPENED' : 'SENT'}
                    </span>
                  </td>
                  <td style={{color: '#64748b', fontSize: '0.85rem'}}>
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sent.length === 0 && <p style={{padding: '2rem', textAlign: 'center', color: '#64748b'}}>No sent emails found.</p>}
        </div>
      )}
    </div>
  );
}