import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './Register.css'; // Import the new CSS

export default function Register() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    password_confirmation: '', 
    role: 'Sales' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/register', form);
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.errors 
        ? Object.values(err.response.data.errors).flat().join(', ')
        : err.response?.data?.message || 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <div className="crm-logo">C</div>
          <h2>NexGen CRM</h2>
          <p>Create your consultant account</p>
        </div>

        <div className="register-card">
          {error && (
            <div className="error-alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Full Name</label>
              <input 
                type="text"
                placeholder="John Doe"
                className="input-field"
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="label">Email Address</label>
              <input 
                type="email" 
                placeholder="name@company.com"
                className="input-field"
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
                required 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="input-field"
                  value={form.password} 
                  onChange={e => setForm({...form, password: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="label">Confirm</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="input-field"
                  value={form.password_confirmation} 
                  onChange={e => setForm({...form, password_confirmation: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Access Role</label>
              <select 
                className="input-field"
                value={form.role} 
                onChange={e => setForm({...form, role: e.target.value})}
              >
                <option value="Sales">Sales Representative</option>
                <option value="Manager">Account Manager</option>
                <option value="Admin">System Administrator</option>
                <option value="Support">Support Specialist</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="submit-btn"
            >
              {loading ? 'Processing...' : 'Create Account'}
            </button>
          </form>

          <div className="register-footer">
            Already have an account?{' '}
            <Link to="/login" className="login-link">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}