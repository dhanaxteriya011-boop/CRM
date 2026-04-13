import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.login, form.password);
      // Redirect admin to subscription page if no active subscription
      if (user.roles?.some(r => r.name === 'Admin')) {
        const sub = user.adminSubscription;
        if (!sub || sub.status !== 'active') {
          navigate('/subscription');
          return;
        }
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.login?.[0] || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '360px', margin: '80px auto' }}>
      <h2>CRM Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Username or Email<br />
            <input value={form.login} onChange={e => setForm({ ...form, login: e.target.value })}
              required placeholder="Enter your username or email" style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password<br />
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              required style={{ width: '100%' }} />
          </label>
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>Admin? <Link to="/admin/register">Create Admin Account</Link></p>
      <p style={{ color: '#888', fontSize: '13px' }}>Team members: use the username and password your admin gave you.</p>
    </div>
  );
}