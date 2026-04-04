import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

export default function DealDetail() {
  const { id } = useParams();
  const [deal, setDeal] = useState(null);
  const [note, setNote] = useState('');

  const load = () => api.get(`/deals/${id}`).then(r => setDeal(r.data));
  useEffect(() => { load(); }, [id]);

  const addNote = async (e) => {
    e.preventDefault();
    await api.post('/notes', { body: note, notable_id: id, notable_type: 'App\\Models\\Deal' });
    setNote(''); load();
  };

  if (!deal) return <p>Loading...</p>;

  return (
    <div>
      <h2>Deal: {deal.title}</h2>
      <p>Stage: {deal.stage} | Value: ₹{deal.value} | Close: {deal.expected_close_date}</p>
      <p>Contact: {deal.contact?.name} | Owner: {deal.owner?.name}</p>

      <h3>Notes</h3>
      <form onSubmit={addNote}>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add note..." rows={3} />
        <button type="submit">Add Note</button>
      </form>
      {deal.notes?.map(n => <div key={n.id} style={{border:'1px solid #eee',margin:'5px',padding:'5px'}}><strong>{n.user?.name}</strong>: {n.body}</div>)}

      <h3>Activities</h3>
      {deal.activities?.map(a => <div key={a.id}>[{a.type}] {a.title} - {a.due_at} - {a.completed?'Done':'Pending'}</div>)}

      <h3>Invoices</h3>
      {deal.invoices?.map(i => <div key={i.id}>{i.invoice_number} - ₹{i.amount} - {i.status}</div>)}
    </div>
  );
}