import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [note, setNote] = useState('');

  const load = () => api.get(`/leads/${id}`).then(r => setLead(r.data));
  useEffect(() => { load(); }, [id]);

  const addNote = async (e) => {
    e.preventDefault();
    await api.post('/notes', { body: note, notable_id: id, notable_type: 'App\\Models\\Lead' });
    setNote(''); load();
  };

  if (!lead) return <p>Loading...</p>;

  return (
    <div>
      <h2>Lead: {lead.title}</h2>
      <p>Source: {lead.source} | Status: {lead.status} | Assigned: {lead.assigned_to?.name}</p>
      <p>Contact: {lead.contact?.name}</p>
      <p>Deal: {lead.deal ? `${lead.deal.title} (${lead.deal.stage})` : 'None'}</p>

      <h3>Notes</h3>
      <form onSubmit={addNote}>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add note..." rows={3} />
        <button type="submit">Add Note</button>
      </form>
      {lead.notes?.map(n => <div key={n.id} style={{border:'1px solid #eee',margin:'5px',padding:'5px'}}><strong>{n.user?.name}</strong>: {n.body}</div>)}

      <h3>Activities</h3>
      {lead.activities?.map(a => <div key={a.id}>[{a.type}] {a.title} - {a.due_at} - {a.completed ? 'Done' : 'Pending'}</div>)}
    </div>
  );
}