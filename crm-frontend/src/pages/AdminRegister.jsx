import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './Register.css'; // Importing the new CSS

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
    <div className="auth-page">
      <div className="register-container">
        <div className="auth-header">
          <div className="crm-logo-circle">C</div>
          <h2>Create Admin Account</h2>
          <p>Set up your organization's workspace in minutes.</p>
        </div>

        <div className="auth-card">
          {err('general') && <div className="error-banner">{err('general')}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="label-text">Full Name*</label>
                <input 
                  className={`input-box ${err('name') ? 'input-error' : ''}`}
                  value={form.name} 
                  onChange={e => set('name', e.target.value)} 
                  required 
                  placeholder="John Doe"
                />
                {err('name') && <span className="error-text">{err('name')}</span>}
              </div>

              <div className="form-group">
                <label className="label-text">Company Name</label>
                <input 
                  className="input-box"
                  value={form.company_name} 
                  onChange={e => set('company_name', e.target.value)} 
                  placeholder="Acme Corp"
                />
              </div>

              <div className="form-group">
                <label className="label-text">Email Address*</label>
                <input 
                  type="email" 
                  className={`input-box ${err('email') ? 'input-error' : ''}`}
                  value={form.email} 
                  onChange={e => set('email', e.target.value)} 
                  required 
                  placeholder="admin@company.com"
                />
                {err('email') && <span className="error-text">{err('email')}</span>}
              </div>

              <div className="form-group">
                <label className="label-text">Username*</label>
                <input 
                  className={`input-box ${err('username') ? 'input-error' : ''}`}
                  value={form.username} 
                  onChange={e => set('username', e.target.value)} 
                  required 
                  placeholder="j_doe88"
                />
                {err('username') && <span className="error-text">{err('username')}</span>}
              </div>

              <div className="form-group">
                <label className="label-text">Password*</label>
                <input 
                  type="password" 
                  className={`input-box ${err('password') ? 'input-error' : ''}`}
                  value={form.password} 
                  onChange={e => set('password', e.target.value)} 
                  required 
                  placeholder="••••••••"
                />
                {err('password') && <span className="error-text">{err('password')}</span>}
              </div>

              <div className="form-group">
                <label className="label-text">Confirm Password*</label>
                <input 
                  type="password" 
                  className="input-box"
                  value={form.password_confirmation} 
                  onChange={e => set('password_confirmation', e.target.value)} 
                  required 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating Workspace...' : 'Create Admin Account'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="login-link">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}