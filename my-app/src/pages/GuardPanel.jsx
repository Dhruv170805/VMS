import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { haptic, usePullToRefresh } from '../utils/hooks';
import { API_BASE, fetchAuth } from '../utils/config';

function GuardPanel() {
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const res = await fetchAuth(`${API_BASE}/dashboard/stats`);
      setStats(await res.json());
    } catch (err) { console.error(err); }
  };

  usePullToRefresh(fetchStats);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleGate = async (action) => {
    haptic('light');
    const payload = input.startsWith('VMS-') ? { visitorCode: input } : { token: input };
    const res = await fetchAuth(`${API_BASE}/gate/${action}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    if (res.ok) haptic('success'); else haptic('error');
    setMsg({ text: d.message || d.error, type: res.ok ? 'success' : 'error' });
    if (res.ok) {
      setInput('');
      fetchStats();
    }
  };

  return (
    <div className="guard-layout fade-in">
      <div className="guard-header-glass">
        <h1 className="logo-text">Security Console</h1>
        <button className="logout-btn-glass" onClick={() => { haptic('medium'); localStorage.clear(); navigate('/login'); }}>Sign Out</button>
      </div>
      {stats && (
        <div className="guard-stats-row">
          <GlassCard className="guard-stat in">
            <span className="label">Current In</span>
            <strong className="value">{stats.GATE_IN + stats.MEET_IN + stats.MEET_OVER}</strong>
          </GlassCard>
          <GlassCard className="guard-stat out">
            <span className="label">Total Out</span>
            <strong className="value">{stats.GATE_OUT}</strong>
          </GlassCard>
          <GlassCard className="guard-stat today">
            <span className="label">Total Visits</span>
            <strong className="value">{stats.TOTAL}</strong>
          </GlassCard>
        </div>
      )}

      <GlassCard className="gate-control-glass main-glass">
        <h3>Gate Access</h3>
        <p className="text-secondary">Scan visitor QR or enter code manually</p>
        <div className="guard-input-group">
          <input 
            type="text" 
            placeholder="AWAITING INPUT..." 
            value={input} 
            onChange={e => setInput(e.target.value.toUpperCase())} 
            className="big-gate-input"
          />
          <div className="gate-actions">
            <button onClick={() => handleGate('checkin')} className="apple-btn-success flex-1">ENTRY (IN)</button>
            <button onClick={() => handleGate('checkout')} className="apple-btn-danger flex-1">EXIT (OUT)</button>
          </div>
        </div>
        {msg && <div className={`apple-alert ${msg.type}`}>{msg.text}</div>}
      </GlassCard>
    </div>
  );
}

export default GuardPanel;
