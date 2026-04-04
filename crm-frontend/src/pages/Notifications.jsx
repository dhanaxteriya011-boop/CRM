import { useState, useEffect } from 'react';
import api from '../api/axios';
import './Notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/notifications');
      setNotifications(r.data.data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`);
    // Optimistic update to UI for better speed
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date() } : n));
  };

  const markAll = async () => {
    await api.post('/notifications/read-all');
    load();
  };

  // Helper to format the message from the JSON data
  const getMessage = (n) => {
    if (typeof n.data === 'string') return n.data;
    return n.data.message || n.data.title || "New update received";
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="notifications-wrapper">
      <div className="notifications-header">
        <h2>Notifications</h2>
        {notifications.length > 0 && (
          <button className="mark-all-btn" onClick={markAll}>
            Mark all as read
          </button>
        )}
      </div>

      {loading && <p style={{textAlign: 'center', color: '#64748b'}}>Refreshing alerts...</p>}

      {!loading && notifications.length === 0 ? (
        <div className="empty-notifications">
          <span className="empty-icon">🔔</span>
          <p>All caught up! No new notifications.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map(n => (
            <div 
              key={n.id} 
              className={`notification-item ${!n.read_at ? 'unread' : ''}`}
            >
              {!n.read_at ? <div className="unread-dot" /> : <div className="read-spacer" />}
              
              <div className="notification-content">
                <div className="notification-message">
                  {getMessage(n)}
                </div>
                <div className="notification-time">
                  {formatTime(n.created_at)}
                </div>
              </div>

              {!n.read_at && (
                <div className="item-actions">
                  <button 
                    className="mark-read-link" 
                    onClick={() => markRead(n.id)}
                  >
                    Mark as read
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}