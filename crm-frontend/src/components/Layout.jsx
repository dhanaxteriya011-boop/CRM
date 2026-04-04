import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import api from "../api/axios";
import './Layout.css';

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = async (q) => {
    setSearchQ(q);
    if (q.length >= 2) {
      try {
        const res = await api.get('/search', { params: { q } });
        setSearchResults(res.data);
      } catch (err) { console.error(err); }
    } else {
      setSearchResults([]);
    }
  };

  // Helper to highlight active link
  const isActive = (path) => location.pathname === path ? 'nav-item active' : 'nav-item';

  return (
    <div className="crm-layout">
      {/* --- Sidebar --- */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{background: '#2563eb', padding: '5px 10px', borderRadius: '8px'}}>C</div>
          <span>NexGen CRM</span>
        </div>

        <div className="nav-section">
          <div className="nav-label">Main</div>
          <Link to="/" className={isActive('/')}>
            <span className="nav-icon">📊</span> Dashboard
          </Link>
          <Link to="/notifications" className={isActive('/notifications')}>
            <span className="nav-icon">🔔</span> Notifications
          </Link>

          <div className="nav-label">Sales & Pipeline</div>
          <Link to="/leads" className={isActive('/leads')}>
            <span className="nav-icon">🎯</span> Leads
          </Link>
          <Link to="/contacts" className={isActive('/contacts')}>
            <span className="nav-icon">👥</span> Contacts
          </Link>
          <Link to="/deals" className={isActive('/deals')}>
            <span className="nav-icon">💰</span> Deals
          </Link>

          <div className="nav-label">Communications</div>
          <Link to="/activities" className={isActive('/activities')}>
            <span className="nav-icon">📅</span> Activities
          </Link>
          <Link to="/emails" className={isActive('/emails')}>
            <span className="nav-icon">✉️</span> Emails
          </Link>
          <Link to="/calls" className={isActive('/calls')}>
            <span className="nav-icon">📞</span> Calls
          </Link>

          <div className="nav-label">Finance</div>
          <Link to="/invoices" className={isActive('/invoices')}>
            <span className="nav-icon">📄</span> Invoices
          </Link>

          {hasRole('Admin') && (
            <>
              <div className="nav-label">Administration</div>
              <Link to="/users" className={isActive('/users')}>
                <span className="nav-icon">🛡️</span> User Management
              </Link>
              <Link to="/teams" className={isActive('/teams')}>
                <span className="nav-icon">🤝</span> Teams
              </Link>
            </>
          )}
        </div>

        <div style={{marginTop: 'auto', padding: '1rem'}}>
           <Link to="/settings" className={isActive('/settings')} style={{borderRadius: '8px'}}>
             <span className="nav-icon">⚙️</span> Settings
           </Link>
        </div>
      </aside>

      {/* --- Main Wrapper --- */}
      <main className="main-wrapper">
        <header className="top-header">
          {/* Global Search */}
          <div className="search-container">
            <span style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}}>🔍</span>
            <input
              className="search-input"
              placeholder="Search records, leads, or deals..."
              value={searchQ}
              onChange={(e) => handleSearch(e.target.value)}
            />

            {searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map((r) => (
                  <div
                    key={`${r.type}-${r.id}`}
                    className="search-result-item"
                    onClick={() => {
                      navigate(`/${r.type}s/${r.id}`);
                      setSearchResults([]);
                      setSearchQ('');
                    }}
                  >
                    <span>{r.name || r.title}</span>
                    <span className="result-type">{r.type.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile & Logout */}
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.roles?.[0]?.name || 'Staff'}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}