import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function AdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', username: '', password: '', password_confirmation: '', company_name: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post('/admin/register', form);
      localStorage.setItem('token', res.data.token);
      navigate('/subscription');
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: [err.response?.data?.message] });
    } finally {
      setLoading(false);
    }
  };

  const err = (field) => errors[field]?.[0];

  return (
    <div style={{ maxWidth: '420px', margin: '60px auto' }}>
      <h2>Create Admin Account</h2>
      <p>Register as an admin to set up your team's CRM.</p>
      {err('general') && <p style={{ color: 'red' }}>{err('general')}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Full Name*<br />
            <input value={form.name} onChange={e => set('name', e.target.value)} required style={{ width: '100%' }} />
          </label>
          {err('name') && <small style={{ color: 'red' }}>{err('name')}</small>}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Company Name<br />
            <input value={form.company_name} onChange={e => set('company_name', e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Email*<br />
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required style={{ width: '100%' }} />
          </label>
          {err('email') && <small style={{ color: 'red' }}>{err('email')}</small>}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Username* (used to login)<br />
            <input value={form.username} onChange={e => set('username', e.target.value)} required style={{ width: '100%' }}
              placeholder="letters, numbers, underscores only" />
          </label>
          {err('username') && <small style={{ color: 'red' }}>{err('username')}</small>}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password*<br />
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required style={{ width: '100%' }} />
          </label>
          {err('password') && <small style={{ color: 'red' }}>{err('password')}</small>}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Confirm Password*<br />
            <input type="password" value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
          {loading ? 'Creating...' : 'Create Admin Account'}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}