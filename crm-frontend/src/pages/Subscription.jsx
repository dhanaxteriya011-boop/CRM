import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Subscription() {
  const navigate = useNavigate();
  const [plans, setPlans]     = useState([]);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab]         = useState('subscribe');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    plan_id: '', amount_paid: '', payment_method: 'cash',
    payment_reference: '', months: 1, notes: '',
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get('/plans').then(r => setPlans(r.data));
    api.get('/subscription/current').then(r => setCurrent(r.data)).catch(() => {});
    api.get('/subscription/history').then(r => setHistory(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const selectPlan = (plan) => {
    setSelected(plan);
    setForm(f => ({ ...f, plan_id: plan.id, amount_paid: plan.price }));
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await api.post('/subscription', form);
      setMsg('✅ Subscription activated!');
      load();
      setTab('current');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription?')) return;
    await api.post('/subscription/cancel');
    load();
  };

  const totalPrice = selected ? (selected.price * form.months).toFixed(2) : 0;

  return (
    <div style={{ maxWidth: '700px', margin: '30px auto' }}>
      <h2>Subscription Management</h2>
      {msg && <p style={{ color: msg.startsWith('✅') ? 'green' : 'red', fontWeight: 'bold' }}>{msg}</p>}

      <button onClick={() => setTab('subscribe')} style={{ fontWeight: tab === 'subscribe' ? 'bold' : 'normal', marginRight: '8px' }}>Subscribe</button>
      <button onClick={() => setTab('current')}   style={{ fontWeight: tab === 'current'   ? 'bold' : 'normal', marginRight: '8px' }}>Current Plan</button>
      <button onClick={() => setTab('history')}   style={{ fontWeight: tab === 'history'   ? 'bold' : 'normal' }}>Payment History</button>

      {/* ── SUBSCRIBE TAB ── */}
      {tab === 'subscribe' && (
        <div>
          <h3>Choose a Plan</h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            {plans.map(plan => (
              <div key={plan.id} onClick={() => selectPlan(plan)} style={{
                border: selected?.id === plan.id ? '2px solid blue' : '1px solid #ccc',
                padding: '12px', cursor: 'pointer', minWidth: '180px',
                background: selected?.id === plan.id ? '#e8eaf6' : 'white',
              }}>
                <strong>{plan.name}</strong><br />
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{plan.price}</span>/month<br />
                <span>{plan.max_members === -1 ? 'Unlimited' : plan.max_members} members</span><br />
                <ul style={{ paddingLeft: '16px', fontSize: '13px', marginTop: '6px' }}>
                  {plan.features?.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>

          {selected && (
            <form onSubmit={handleSubscribe} style={{ border: '1px solid #ccc', padding: '12px' }}>
              <h4>Subscribe to {selected.name}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label>Duration (months)*
                  <input type="number" value={form.months} min={1} max={24}
                    onChange={e => setForm({ ...form, months: parseInt(e.target.value) })}
                    style={{ width: '100%' }} />
                </label>
                <label>Total Amount: ₹{totalPrice}
                  <input type="number" value={form.amount_paid}
                    onChange={e => setForm({ ...form, amount_paid: e.target.value })}
                    placeholder="Amount paid" style={{ width: '100%' }} required />
                </label>
                <label>Payment Method*
                  <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} style={{ width: '100%' }}>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label>Payment Reference / UTR
                  <input value={form.payment_reference} onChange={e => setForm({ ...form, payment_reference: e.target.value })}
                    placeholder="Optional" style={{ width: '100%' }} />
                </label>
              </div>
              <div style={{ marginTop: '8px' }}>
                <label>Notes<br />
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    rows={2} style={{ width: '100%' }} />
                </label>
              </div>
              <div style={{ marginTop: '10px', padding: '8px', background: '#f5f5f5', fontWeight: 'bold' }}>
                Summary: {selected.name} × {form.months} month(s) = ₹{totalPrice}
                | Up to {selected.max_members === -1 ? 'Unlimited' : selected.max_members} members
                | Expires: {new Date(Date.now() + form.months * 30 * 86400000).toLocaleDateString()}
              </div>
              <button type="submit" disabled={loading} style={{ marginTop: '10px', padding: '10px 24px' }}>
                {loading ? 'Processing...' : '💳 Activate Subscription'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── CURRENT PLAN TAB ── */}
      {tab === 'current' && (
        <div>
          <h3>Current Subscription</h3>
          {!current?.subscription ? (
            <p>No active subscription. <button onClick={() => setTab('subscribe')}>Subscribe Now</button></p>
          ) : (
            <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td><strong>Plan</strong></td><td>{current.subscription.plan?.name}</td></tr>
                <tr><td><strong>Status</strong></td><td style={{ color: current.subscription.status === 'active' ? 'green' : 'red' }}>{current.subscription.status?.toUpperCase()}</td></tr>
                <tr><td><strong>Started</strong></td><td>{current.subscription.started_at}</td></tr>
                <tr><td><strong>Expires</strong></td><td>{current.subscription.expires_at}</td></tr>
                <tr><td><strong>Days Left</strong></td><td style={{ color: current.days_left < 7 ? 'red' : 'green' }}>{current.days_left} days</td></tr>
                <tr><td><strong>Amount Paid</strong></td><td>₹{current.subscription.amount_paid}</td></tr>
                <tr><td><strong>Payment Method</strong></td><td>{current.subscription.payment_method}</td></tr>
                <tr><td><strong>Members Used</strong></td><td>{current.member_count} / {current.member_limit}</td></tr>
                <tr><td><strong>Members Left</strong></td><td>{current.members_left}</td></tr>
              </tbody>
            </table>
          )}
          {current?.subscription?.status === 'active' && (
            <div style={{ marginTop: '12px' }}>
              <button onClick={() => setTab('subscribe')}>🔄 Renew / Upgrade Plan</button>
              {' '}
              <button onClick={handleCancel} style={{ color: 'red' }}>Cancel Subscription</button>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div>
          <h3>Payment History</h3>
          <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f5f5f5' }}>
              <tr><th>Plan</th><th>Amount</th><th>Method</th><th>Reference</th><th>Started</th><th>Expires</th><th>Status</th></tr>
            </thead>
            <tbody>
              {history.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center' }}>No history</td></tr>}
              {history.map(s => (
                <tr key={s.id}>
                  <td>{s.plan?.name}</td>
                  <td>₹{s.amount_paid}</td>
                  <td>{s.payment_method}</td>
                  <td>{s.payment_reference || '—'}</td>
                  <td>{s.started_at}</td>
                  <td>{s.expires_at}</td>
                  <td>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => navigate('/')}>← Back to Dashboard</button>
      </div>
    </div>
  );
}