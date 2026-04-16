import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css'; // Ensure this is imported!

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
      if (user.roles?.some(r => r.name === 'Admin')) {
        const sub = user.adminSubscription;
        if (!sub || sub.status !== 'active') {
          navigate('/subscription');
          return;
        }
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="crm-logo-circle">C</div>
          <h2>Welcome Back</h2>
          <p>Enter your credentials to access your CRM</p>
        </div>

        <div className="login-card">
          {error && <div className="error-banner">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label-text">Username or Email</label>
              <input 
                className="input-box"
                type="text"
                value={form.login} 
                onChange={e => setForm({ ...form, login: e.target.value })}
                required 
                placeholder="e.g. admin@company.com" 
              />
            </div>

            <div className="form-group">
              <label className="label-text">Password</label>
              <input 
                className="input-box"
                type="password" 
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })}
                required 
                placeholder="••••••••"
              />
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/forgot-password" name="forgot-link" className="forgot-link">Forgot password?</Link>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="footer-text">
          <p>Don't have an account? <Link to="/admin/register" className="signup-link">Create Admin Account</Link></p>
          <div className="team-info">
            Team members: Check your email for login credentials provided by your manager.
          </div>
        </div>
      </div>
    </div>
  );
}