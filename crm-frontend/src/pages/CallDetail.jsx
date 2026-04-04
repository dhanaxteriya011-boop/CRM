import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function CallDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [call, setCall] = useState(null);
  const [history, setHistory] = useState({ assignments: [], logs: [] });
  const [users, setUsers] = useState([]);
  const [showComplete, setShowComplete] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [report, setReport] = useState({
    outcome: 'answered', notes: '', next_action: 'follow-up',
    create_followup: false, followup_at: '', followup_type: 'call'
  });
  const [reassignForm, setReassignForm] = useState({ user_id: '', reason: '' });
  const [escalateForm, setEscalateForm] = useState({ escalate_to: '', reason: '' });

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

  const handleAttend = async () => {
    await api.post(`/calls/${id}/attend`);
    load();
    alert('✅ Call marked as attended!');
  };

  const handleDecline = async () => {
    const reason = prompt('Reason for declining?') || 'declined';
    await api.post(`/calls/${id}/decline`, { reason });
    load();
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    await api.post(`/calls/${id}/complete`, report);
    setShowComplete(false);
    load();
    alert('✅ Call completed and report saved!');
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    await api.post(`/calls/${id}/reassign`, reassignForm);
    setShowReassign(false);
    load();
  };

  const handleEscalate = async (e) => {
    e.preventDefault();
    await api.post(`/calls/${id}/escalate`, escalateForm);
    setShowEscalate(false);
    load();
  };

  if (!call) return <p>Loading...</p>;

  const isMyCall = call.assigned_to === user?.id || call.attended_by === user?.id;
  const canAttend = call.assigned_to === user?.id && call.status === 'assigned';
  const canComplete = call.attended_by === user?.id && call.status === 'attended';
  const canManage = hasRole('Admin') || hasRole('Manager');

  return (
    <div>
      <button onClick={() => navigate('/calls')}>← Back to Calls</button>
      <h2>📞 {call.title}</h2>

      {/* Status Banner */}
      <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
        <strong>Status:</strong> <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{call.status?.toUpperCase()}</span>
        {call.priority === 2 && <span style={{ color: 'red', marginLeft: '10px' }}>🚨 URGENT</span>}
        {call.priority === 1 && <span style={{ color: 'orange', marginLeft: '10px' }}>⚠️ HIGH PRIORITY</span>}
      </div>

      {/* Call Info */}
      <table border="1" cellPadding="8" style={{ marginBottom: '15px' }}>
        <tbody>
          <tr><td><strong>Caller</strong></td><td>{call.caller_name} | {call.caller_phone}</td></tr>
          <tr><td><strong>Contact</strong></td><td>{call.contact?.name || '—'}</td></tr>
          <tr><td><strong>Team</strong></td><td>{call.team?.name || '—'}</td></tr>
          <tr><td><strong>Assigned To</strong></td><td>{call.assigned_to?.name || '—'}</td></tr>
          <tr><td><strong>Timeout At</strong></td><td>{call.timeout_at ? new Date(call.timeout_at).toLocaleString() : '—'}</td></tr>
          <tr><td><strong>Attended By</strong></td><td>{call.attended_by?.name || '—'}</td></tr>
          <tr><td><strong>Attended At</strong></td><td>{call.attended_at ? new Date(call.attended_at).toLocaleString() : '—'}</td></tr>
          <tr><td><strong>Completed At</strong></td><td>{call.completed_at ? new Date(call.completed_at).toLocaleString() : '—'}</td></tr>
          <tr><td><strong>Attempt #</strong></td><td>{call.current_attempt} / {call.max_attempts}</td></tr>
          {call.escalated_to && <tr><td><strong>Escalated To</strong></td><td>{call.escalated_to?.name} — {call.escalation_reason}</td></tr>}
          {call.notes && <tr><td><strong>Notes</strong></td><td>{call.notes}</td></tr>}
        </tbody>
      </table>

      {/* ─── SALES/SUPPORT ACTIONS ─── */}
      {canAttend && (
        <div style={{ background: '#e8f5e9', border: '2px solid green', padding: '10px', margin: '10px 0' }}>
          <strong>This call is assigned to you!</strong><br />
          Timeout: {call.timeout_at ? new Date(call.timeout_at).toLocaleString() : 'N/A'}
          <br /><br />
          <button onClick={handleAttend} style={{ background: 'green', color: 'white', padding: '8px 16px' }}>✅ Attend This Call</button>{' '}
          <button onClick={handleDecline} style={{ background: 'red', color: 'white', padding: '8px 16px' }}>❌ Decline (Reassign)</button>
        </div>
      )}

      {canComplete && (
        <div style={{ background: '#e3f2fd', border: '2px solid blue', padding: '10px', margin: '10px 0' }}>
          <strong>You attended this call. Please submit the completion report.</strong><br />
          <button onClick={() => setShowComplete(!showComplete)} style={{ background: 'blue', color: 'white', padding: '8px 16px' }}>
            📝 Complete Call & Submit Report
          </button>

          {showComplete && (
            <form onSubmit={handleComplete} style={{ marginTop: '10px' }}>
              <div><label>Outcome*:
                <select value={report.outcome} onChange={e => setReport({ ...report, outcome: e.target.value })} required>
                  <option value="answered">Answered</option>
                  <option value="voicemail">Left Voicemail</option>
                  <option value="callback">Callback Requested</option>
                  <option value="no-answer">No Answer</option>
                  <option value="wrong-number">Wrong Number</option>
                </select>
              </label></div>
              <div><label>Next Action:
                <select value={report.next_action} onChange={e => setReport({ ...report, next_action: e.target.value })}>
                  <option value="follow-up">Follow-up</option>
                  <option value="send-email">Send Email</option>
                  <option value="close">Close</option>
                  <option value="escalate">Escalate</option>
                </select>
              </label></div>
              <div><label>Notes:<br />
                <textarea rows={4} value={report.notes} onChange={e => setReport({ ...report, notes: e.target.value })} style={{ width: '400px' }} />
              </label></div>
              <div><label>
                <input type="checkbox" checked={report.create_followup} onChange={e => setReport({ ...report, create_followup: e.target.checked })} />
                {' '}Create follow-up task automatically
              </label></div>
              {report.create_followup && (
                <>
                  <div><label>Follow-up Date/Time: <input type="datetime-local" value={report.followup_at} onChange={e => setReport({ ...report, followup_at: e.target.value })} required /></label></div>
                  <div><label>Follow-up Type:
                    <select value={report.followup_type} onChange={e => setReport({ ...report, followup_type: e.target.value })}>
                      <option value="call">Call</option><option value="meeting">Meeting</option>
                      <option value="email">Email</option><option value="follow-up">Follow-up</option>
                    </select>
                  </label></div>
                </>
              )}
              <button type="submit" style={{ background: 'blue', color: 'white', padding: '8px 20px' }}>Submit Report & Complete</button>
              <button type="button" onClick={() => setShowComplete(false)}>Cancel</button>
            </form>
          )}
        </div>
      )}

      {/* ─── MANAGER/ADMIN ACTIONS ─── */}
      {canManage && ['assigned', 'pending', 'escalated', 'missed'].includes(call.status) && (
        <div style={{ background: '#fff3e0', border: '1px solid orange', padding: '10px', margin: '10px 0' }}>
          <strong>Manager Actions:</strong><br />
          <button onClick={() => setShowReassign(!showReassign)}>🔄 Reassign Call</button>{' '}
          {call.status !== 'escalated' && <button onClick={() => setShowEscalate(!showEscalate)}>⬆️ Escalate</button>}

          {showReassign && (
            <form onSubmit={handleReassign} style={{ marginTop: '10px' }}>
              <strong>Reassign to:</strong>
              <select value={reassignForm.user_id} onChange={e => setReassignForm({ ...reassignForm, user_id: e.target.value })} required>
                <option value="">-- Select User --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} [{u.roles?.[0]?.name}]</option>)}
              </select>
              <input placeholder="Reason (optional)" value={reassignForm.reason} onChange={e => setReassignForm({ ...reassignForm, reason: e.target.value })} />
              <button type="submit">Reassign</button>
              <button type="button" onClick={() => setShowReassign(false)}>Cancel</button>
            </form>
          )}

          {showEscalate && (
            <form onSubmit={handleEscalate} style={{ marginTop: '10px' }}>
              <strong>Escalate to:</strong>
              <select value={escalateForm.escalate_to} onChange={e => setEscalateForm({ ...escalateForm, escalate_to: e.target.value })} required>
                <option value="">-- Select Manager/Admin --</option>
                {users.filter(u => u.roles?.some(r => ['Manager', 'Admin'].includes(r.name))).map(u => (
                  <option key={u.id} value={u.id}>{u.name} [{u.roles?.[0]?.name}]</option>
                ))}
              </select>
              <input placeholder="Escalation reason*" value={escalateForm.reason} onChange={e => setEscalateForm({ ...escalateForm, reason: e.target.value })} required />
              <button type="submit">Escalate</button>
              <button type="button" onClick={() => setShowEscalate(false)}>Cancel</button>
            </form>
          )}
        </div>
      )}

      {/* ─── CALL HISTORY / AUDIT TRAIL ─── */}
      <h3>📋 Assignment History</h3>
      <table border="1" cellPadding="5" style={{ width: '100%' }}>
        <thead><tr><th>Attempt</th><th>Assigned To</th><th>Assigned At</th><th>Status</th><th>Response At</th><th>Miss Reason</th></tr></thead>
        <tbody>
          {history.assignments.map(a => (
            <tr key={a.id} style={{ background: a.status === 'attended' ? '#e8f5e9' : a.status === 'missed' ? '#ffebee' : 'white' }}>
              <td>#{a.attempt_number}</td>
              <td>{a.user?.name}</td>
              <td>{new Date(a.assigned_at).toLocaleString()}</td>
              <td><strong>{a.status}</strong></td>
              <td>{a.responded_at ? new Date(a.responded_at).toLocaleString() : '—'}</td>
              <td>{a.miss_reason || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ─── CALL LOGS ─── */}
      {history.logs.length > 0 && (
        <>
          <h3>📞 Call Completion Report</h3>
          {history.logs.map(log => (
            <div key={log.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
              <strong>Logged by:</strong> {log.user?.name}<br />
              <strong>Outcome:</strong> {log.outcome}<br />
              <strong>Duration:</strong> {log.duration_seconds ? `${Math.floor(log.duration_seconds / 60)}m ${log.duration_seconds % 60}s` : 'N/A'}<br />
              <strong>Next Action:</strong> {log.next_action}<br />
              <strong>Notes:</strong> {log.notes}<br />
              {log.create_followup && <><strong>Follow-up scheduled:</strong> {new Date(log.followup_at).toLocaleString()} ({log.followup_type})<br /></>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}