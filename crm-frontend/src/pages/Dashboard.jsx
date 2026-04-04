import { useState, useEffect } from 'react';
import api from '../api/axios';
import './Dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { 
    api.get('/dashboard').then(r => setData(r.data)); 
  }, []);

  if (!data) return (
    <div className="loading-state">
      <p>Syncing CRM data...</p>
    </div>
  );

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(val);

  const conversionRate = ((data.lead_conversion.converted / data.lead_conversion.total) * 100).toFixed(1);

  return (
    <div className="dashboard-wrapper">
      <h2 className="dashboard-title">Executive Overview</h2>

      {/* 1. Main KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value revenue">{formatCurrency(data.stats.total_revenue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Won Deals</span>
          <span className="stat-value">{data.stats.won_deals}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">New Leads (Month)</span>
          <span className="stat-value">{data.stats.new_leads_this_month}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending Tasks</span>
          <span className="stat-value" style={{color: '#e11d48'}}>{data.stats.pending_activities}</span>
        </div>
      </div>

      <div className="data-grid">
        {/* 2. Lead Conversion Card */}
        <div className="card">
          <div className="card-header">
            <span>Lead Conversion</span>
            <span style={{color: '#2563eb'}}>{conversionRate}%</span>
          </div>
          <div className="conversion-container">
            <div className="progress-bg">
              <div className="progress-fill" style={{width: `${conversionRate}%`}}></div>
            </div>
            <p style={{fontSize: '0.85rem', color: '#64748b'}}>
              {data.lead_conversion.converted} out of {data.lead_conversion.total} leads converted to deals.
            </p>
          </div>
        </div>

        {/* 3. Deals by Stage */}
        <div className="card">
          <div className="card-header">Pipeline by Stage</div>
          <table className="crm-table">
            <thead>
              <tr><th>Stage</th><th>Count</th><th>Value</th></tr>
            </thead>
            <tbody>
              {data.deals_by_stage.map(s => (
                <tr key={s.stage}>
                  <td><strong>{s.stage}</strong></td>
                  <td>{s.count}</td>
                  <td>{formatCurrency(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Top Sales Reps */}
        <div className="card">
          <div className="card-header">Top Sales Performance</div>
          <table className="crm-table">
            <thead>
              <tr><th>Consultant</th><th>Closed</th><th>Revenue</th></tr>
            </thead>
            <tbody>
              {data.top_sales.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.won_deals_count} deals</td>
                  <td><strong>{formatCurrency(u.revenue || 0)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 5. Recent Activities */}
        <div className="card">
          <div className="card-header">Recent Activities</div>
          <table className="crm-table">
            <thead>
              <tr><th>Type</th><th>Task</th><th>Due</th></tr>
            </thead>
            <tbody>
              {data.recent_activities.map(a => (
                <tr key={a.id}>
                  <td>
                    <span className={`badge badge-${a.type.toLowerCase()}`}>
                      {a.type}
                    </span>
                  </td>
                  <td>
                    <div style={{fontWeight: 600}}>{a.title}</div>
                    <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>By {a.user?.name}</div>
                  </td>
                  <td>{new Date(a.due_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}