import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Settings.css';
import './Leads.css'; // Reusing btn and input-field styles

export default function Settings() {
  const { user } = useAuth();
  const [pwForm, setPwForm] = useState({ current_password:'', password:'', password_confirmation:'' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    
    try {
      await api.put('/user/password', pwForm);
      setMsg({ text: '✅ Password updated successfully', type: 'success' });
      setPwForm({ current_password:'', password:'', password_confirmation:'' });
    } catch (err) {
      const errorMsg = err.response?.data?.errors 
        ? Object.values(err.response.data.errors).flat().join(', ')
        : 'Update failed. Please check your current password.';
      setMsg({ text: `❌ ${errorMsg}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  return (
    <div className="settings-page">
      <div className="leads-header">
        <div>
          <h2>Account Settings</h2>
          <p style={{color: '#64748b', fontSize: '0.9rem'}}>Manage your profile and security preferences</p>
        </div>
      </div>

      {/* --- PROFILE OVERVIEW --- */}
      <div className="settings-section">
        <div className="settings-section-title">
            <span>👤</span> Profile Information
        </div>
        <div className="profile-card">
            <div className="settings-avatar">{getInitials(user?.name)}</div>
            <div className="profile-details">
                <h3>{user?.name}</h3>
                <div className="profile-meta">
                    <span className="meta-email">{user?.email}</span>
                    <span className="role-badge role-sales" style={{fontSize: '0.7rem'}}>
                        {user?.roles?.[0]?.name || 'Member'}
                    </span>
                </div>
                <p style={{fontSize: '0.8rem', color: '#94a3b8', marginTop: '1rem'}}>
                    Joined as {user?.roles?.[0]?.name} • Full Access
                </p>
            </div>
        </div>
      </div>

      {/* --- SECURITY SECTION --- */}
      <div className="settings-section">
        <div className="settings-section-title">
            <span>🔒</span> Security & Password
        </div>
        <div className="security-card">
            {msg.text && (
                <div className={`settings-alert alert-${msg.type}`}>
                    {msg.text}
                </div>
            )}

            <form onSubmit={changePassword}>
                <div className="form-group" style={{marginBottom: '1.25rem'}}>
                    <label className="label">Current Password</label>
                    <input 
                        type="password" 
                        className="input-field"
                        placeholder="••••••••"
                        value={pwForm.current_password} 
                        onChange={e=>setPwForm({...pwForm,current_password:e.target.value})} 
                        required 
                    />
                </div>

                <div className="form-row" style={{marginBottom: '1.5rem'}}>
                    <div className="form-group">
                        <label className="label">New Password</label>
                        <input 
                            type="password" 
                            className="input-field"
                            placeholder="New password"
                            value={pwForm.password} 
                            onChange={e=>setPwForm({...pwForm,password:e.target.value})} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Confirm New Password</label>
                        <input 
                            type="password" 
                            className="input-field"
                            placeholder="Confirm password"
                            value={pwForm.password_confirmation} 
                            onChange={e=>setPwForm({...pwForm,password_confirmation:e.target.value})} 
                            required 
                        />
                    </div>
                </div>

                <div style={{borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem'}}>
                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{width: '240px'}}
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                    <p style={{fontSize: '0.8rem', color: '#64748b', marginTop: '10px'}}>
                        Ensure your new password is at least 8 characters long.
                    </p>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}