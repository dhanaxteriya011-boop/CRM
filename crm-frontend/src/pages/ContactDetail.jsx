import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = {
  pending: '#ff9800', assigned: '#2196f3', attended: '#9c27b0',
  completed: '#4caf50', missed: '#f44336', escalated: '#b71c1c',
};

export default function CallDetail() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { user, hasRole } = useAuth();
  const [call, setCall]     = useState(null);
  const [history, setHistory] = useState({ assignments: [], logs: [] });
  const [users, setUsers]   = useState([]);
  const [panel, setPanel]   = useState(null); // 'complete' | 'reassign' | 'escalate'
  const [report, setReport] = useState({ outcome: 'answered', notes: '', next_action: 'follow-up' });
  const [reassign, setReassign] = useState({ user_id: '', reason: '' });
  const [escalate, setEscalate] = useState({ escalate_to: '', reason: '' });

  const load = () => {
    api.get(`/calls/${id}`).then(r => setCall(r.data));
    api.get(`/calls/${id}/history`).then(r => setHistory(r.data));
  };

  useEffect(() => {
    load();
    if (hasRole('Admin') || hasRole('Manager')) {
      api.get('/users').then(r => setUsers(r.data.data));
    }
  }, [id]);

  const doAttend = async () => {
    await api.post(`/calls/${id}/attend`);
    load();
  };

  const doDecline = async () => {
    const reason = prompt('Decline reason?') || 'declined';
    await api.post(`/calls/${id}/decline`, { reason });
    load();
  };

  const doComplete = async (e) => {
    e.preventDefault();
    await api.post(`/calls/${id}/complete`, report);
    setPanel(null);
    load();
    alert('✅ Call completed and report saved!');
  };

  const doReassign = async (e) => {
    e.preventDefault();
    await api.post(`/calls/${id}/reassign`, reassign);
    setPanel(null);
    load();
  };

  const doEscalate = async (e) => {
    e.preventDefault();
    await api.post(`/calls/${id}/escalate`, escalate);
    setPanel(null);
    load();
  };

  if (!call) return <p>Loading...</p>;

  const isAssignedToMe = call.assigned_to === user?.id;
  const isAttendedByMe = call.attended_by === user?.id;
  const canAttend      = isAssignedToMe && call.status === 'assigned';
  const canComplete    = isAttendedByMe && call.status === 'attended';
  const canManage      = hasRole('Admin') || hasRole('Manager');
  const managerUsers   = users.filter(u => u.roles?.some(r => ['Manager', 'Admin'].includes(r.name)));

  return (
    <div>
      <button onClick={() => navigate('/calls')}>← Back</button>
      <h2>📞 {call.title}</h2>

      {/* Status Badge */}
      <div style={{ marginBottom: '12px' }}>
        <span style={{
          background: STATUS_COLOR[call.status] || '#999',
          color: 'white', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold'
        }}>
          {call.status?.toUpperCase()}
        </span>
        {' '}
        <span>Routing: <strong>{call.routing_type}</strong></span>
        {' | '}
        <span>Priority: <strong>{['Normal','High','Urgent'][call.priority] || 'Normal'}</strong></span>
        {' | '}
        <span>Attempt: <strong>{call.current_attempt} / {call.max_attempts}</strong></span>
      </div>

      {/* Call Details */}
      <table border="1" cellPadding="8" style={{ marginBottom: '15px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr><td style={{ background: '#f5f5f5' }}><strong>Caller</strong></td><td>{call.caller_name} | {call.caller_phone}</td></tr>
          <tr><td style={{ background: '#f5f5f5' }}><strong>Contact</strong></td><td>{call.contact?.name || '—'}</td></tr>
          <tr><td style={{ background: '#f5f5f5' }}><strong>Team</strong></td><td>{call.team?.name || '—'}</td></tr>
          <tr><td style={{ background: '#f5f5f5' }}><strong>Currently Assigned To</strong></td><td>{call.assigned_to?.name || '—'}</td></tr>
          <tr><td style={{ background: '#f5f5f5' }}><strong>Timeout At</strong></td><td>{call.timeout_at ? new Date(call.timeout_at).toLocaleString() : '—'}</td></tr>
          <tr><td style={{ background: '#f5f5f5' }}><strong>Attended By</strong></td><td>{call.attended_by?.name || '—'}</td></tr>
          <tr><td style={{ background: '#f5f5f5' }}><strong>Attended At</strong></td><td>{call.attended_at ? new Date(call.attended_at).toLocaleString() : '—'}</td></tr>
          <tr><td style={{ background: '#f5f5f5' }}><strong>Completed At</strong></td><td>{call.completed_at ? new Date(call.completed_at).toLocaleString() : '—'}</td></tr>
          {call.escalated_to && (
            <tr><td style={{ background: '#ffe0e0' }}><strong>Escalated To</strong></td>
              <td>{call.escalated_to?.name} — {call.escalation_reason}</td></tr>
          )}
          {call.notes && <tr><td style={{ background: '#f5f5f5' }}><strong>Notes</strong></td><td>{call.notes}</td></tr>}
        </tbody>
      </table>

      {/* ── SALES/SUPPORT: Attend / Decline ── */}
      {canAttend && (
        <div style={{ background: '#e8f5e9', border: '2px solid #4caf50', padding: '12px', marginBottom: '12px' }}>
          <strong>🔔 This call is assigned to you!</strong>
          <br />Timeout: {call.timeout_at ? new Date(call.timeout_at).toLocaleString() : 'N/A'}
          <br /><br />
          <button onClick={doAttend} style={{ background: '#4caf50', color: '#fff', padding: '8px 20px', marginRight: '8px', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
            ✅ Attend Call
          </button>
          <button onClick={doDecline} style={{ background: '#f44336', color: '#fff', padding: '8px 20px', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
            ❌ Decline (Reassign to Next)
          </button>
        </div>
      )}

      {/* ── SALES/SUPPORT: Complete Call ── */}
      {canComplete && (
        <div style={{ background: '#e3f2fd', border: '2px solid #2196f3', padding: '12px', marginBottom: '12px' }}>
          <strong>📝 You attended this call. Submit the completion report.</strong>
          <br /><br />
          <button onClick={() => setPanel(panel === 'complete' ? null : 'complete')}
            style={{ background: '#2196f3', color: '#fff', padding: '8px 20px', border: 'none', cursor: 'pointer' }}>
            {panel === 'complete' ? '▲ Hide Form' : '▼ Complete Call & Submit Report'}
          </button>

          {panel === 'complete' && (
            <form onSubmit={doComplete} style={{ marginTop: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label><strong>Outcome*:</strong><br />
                  <select value={report.outcome} onChange={e => setReport({ ...report, outcome: e.target.value })} required style={{ width: '300px' }}>
                    <option value="answered">✅ Answered</option>
                    <option value="voicemail">📱 Left Voicemail</option>
                    <option value="callback">🔁 Callback Requested</option>
                    <option value="no-answer">🔕 No Answer</option>
                    <option value="wrong-number">❌ Wrong Number</option>
                  </select>
                </label>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label><strong>Next Action:</strong><br />
                  <select value={report.next_action} onChange={e => setReport({ ...report, next_action: e.target.value })} style={{ width: '300px' }}>
                    <option value="follow-up">Follow-up</option>
                    <option value="send-email">Send Email</option>
                    <option value="close">Close / No action</option>
                    <option value="escalate">Escalate to Manager</option>
                  </select>
                </label>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label><strong>Call Notes:</strong><br />
                  <textarea rows={5} value={report.notes} onChange={e => setReport({ ...report, notes: e.target.value })}
                    placeholder="What was discussed? Any important details..." style={{ width: '450px' }} />
                </label>
              </div>
              <button type="submit" style={{ background: '#2196f3', color: '#fff', padding: '10px 24px', border: 'none', cursor: 'pointer' }}>
                💾 Submit Report & Mark Complete
              </button>
              <button type="button" onClick={() => setPanel(null)} style={{ marginLeft: '8px' }}>Cancel</button>
            </form>
          )}
        </div>
      )}

      {/* ── MANAGER/ADMIN: Reassign / Escalate ── */}
      {canManage && ['pending','assigned','escalated','missed'].includes(call.status) && (
        <div style={{ background: '#fff8e1', border: '1px solid #ff9800', padding: '12px', marginBottom: '12px' }}>
          <strong>🔧 Manager Actions:</strong>
          {' '}
          <button onClick={() => setPanel(panel === 'reassign' ? null : 'reassign')}>🔄 Reassign</button>
          {' '}
          {call.status !== 'escalated' && (
            <button onClick={() => setPanel(panel === 'escalate' ? null : 'escalate')}>⬆️ Escalate</button>
          )}

          {panel === 'reassign' && (
            <form onSubmit={doReassign} style={{ marginTop: '10px' }}>
              <label>Reassign to:
                <select value={reassign.user_id} onChange={e => setReassign({ ...reassign, user_id: e.target.value })} required style={{ marginLeft: '8px', width: '200px' }}>
                  <option value="">-- Select User --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} [{u.roles?.[0]?.name}]</option>
                  ))}
                </select>
              </label>
              {' '}
              <input placeholder="Reason (optional)" value={reassign.reason}
                onChange={e => setReassign({ ...reassign, reason: e.target.value })} />
              {' '}
              <button type="submit">Reassign</button>
              <button type="button" onClick={() => setPanel(null)} style={{ marginLeft: '4px' }}>Cancel</button>
            </form>
          )}

          {panel === 'escalate' && (
            <form onSubmit={doEscalate} style={{ marginTop: '10px' }}>
              <label>Escalate to:
                <select value={escalate.escalate_to} onChange={e => setEscalate({ ...escalate, escalate_to: e.target.value })} required style={{ marginLeft: '8px', width: '200px' }}>
                  <option value="">-- Select Manager/Admin --</option>
                  {managerUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} [{u.roles?.[0]?.name}]</option>
                  ))}
                </select>
              </label>
              {' '}
              <input placeholder="Escalation reason*" value={escalate.reason}
                onChange={e => setEscalate({ ...escalate, reason: e.target.value })} required style={{ width: '250px' }} />
              {' '}
              <button type="submit">Escalate</button>
              <button type="button" onClick={() => setPanel(null)} style={{ marginLeft: '4px' }}>Cancel</button>
            </form>
          )}
        </div>
      )}

      {/* ── ASSIGNMENT HISTORY TRAIL ── */}
      <h3>📋 Assignment Trail</h3>
      <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f5f5f5' }}>
          <tr><th>#</th><th>Assigned To</th><th>Assigned At</th><th>Timeout At</th><th>Result</th><th>Responded At</th><th>Miss Reason</th></tr>
        </thead>
        <tbody>
          {history.assignments.length === 0 && (
            <tr><td colSpan="7" style={{ textAlign: 'center' }}>No assignment history yet</td></tr>
          )}
          {history.assignments.map(a => (
            <tr key={a.id} style={{
              background: a.status === 'attended' ? '#e8f5e9' : a.status === 'missed' ? '#ffebee' : 'white'
            }}>
              <td>#{a.attempt_number}</td>
              <td><strong>{a.user?.name}</strong></td>
              <td>{new Date(a.assigned_at).toLocaleString()}</td>
              <td>{a.timeout_at ? new Date(a.timeout_at).toLocaleString() : '—'}</td>
              <td>
                <span style={{
                  background: a.status === 'attended' ? '#4caf50' : a.status === 'missed' ? '#f44336' : '#9e9e9e',
                  color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '12px'
                }}>
                  {a.status}
                </span>
              </td>
              <td>{a.responded_at ? new Date(a.responded_at).toLocaleString() : '—'}</td>
              <td>{a.miss_reason || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── COMPLETION REPORT ── */}
      {history.logs.length > 0 && (
        <>
          <h3>📞 Completion Report</h3>
          {history.logs.map(log => {
            const durSec = log.duration_seconds;
            const duration = durSec ? `${Math.floor(durSec / 60)}m ${durSec % 60}s` : 'N/A';
            return (
              <div key={log.id} style={{ border: '1px solid #ccc', padding: '12px', marginBottom: '8px' }}>
                <table border="0" cellPadding="5">
                  <tbody>
                    <tr><td><strong>Logged by</strong></td><td>{log.user?.name}</td></tr>
                    <tr><td><strong>Outcome</strong></td><td><strong>{log.outcome}</strong></td></tr>
                    <tr><td><strong>Duration</strong></td><td>{duration}</td></tr>
                    <tr><td><strong>Start</strong></td><td>{log.started_at ? new Date(log.started_at).toLocaleString() : '—'}</td></tr>
                    <tr><td><strong>End</strong></td><td>{log.ended_at ? new Date(log.ended_at).toLocaleString() : '—'}</td></tr>
                    <tr><td><strong>Next Action</strong></td><td>{log.next_action || '—'}</td></tr>
                    <tr><td><strong>Notes</strong></td><td>{log.notes || '—'}</td></tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}