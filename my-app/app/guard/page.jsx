'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { haptic, usePullToRefresh } from '@/utils/hooks';
import { API_BASE, fetchAuth, safeJson } from '@/utils/config';
import { useConfig } from '@/context/ConfigContext';

function GuardPanelContent() {
  const { config: sysConfig } = useConfig();
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState(null);
  const [stats, setStats] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activeVisitor, setActiveVisitor] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setName(localStorage.getItem('name'));

    const socket = io(API_BASE.replace('/api', ''), {
      transports: ['websocket']
    });

    socket.on('gate:checkin', (data) => {
      fetchStats();
      haptic('light');
    });

    socket.on('gate:checkout', (data) => {
      fetchStats();
      haptic('light');
    });

    socket.on('gate:denied', (data) => {
      haptic('error');
    });

    return () => socket.disconnect();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetchAuth(`${API_BASE}/dashboard/stats`);
      if (res.ok) {
        setStats(await safeJson(res));
        setError(null);
      } else {
        throw new Error("Server response error");
      }
    } catch (err) { 
      console.error(err); 
      setError("Connection to security server lost.");
    }
  };

  const fetchTimeline = async (visitorId) => {
    const res = await fetchAuth(`${API_BASE}/visitor/${visitorId}/timeline`);
    if (res.ok) {
      setTimeline(await safeJson(res));
    }
  };

  usePullToRefresh(fetchStats);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleGate = async (action) => {
    haptic('light');
    const payload = input.startsWith('NG-') || input.includes('-') 
      ? { visitorCode: input, gateId: GATE_ID } 
      : { token: input, gateId: GATE_ID };
    
    const res = await fetchAuth(`${API_BASE}/gate/${action}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const d = await safeJson(res);
    
    if (res.ok) {
      haptic('success');
      setActiveVisitor(d.visitor);
      fetchTimeline(d.visitor._id);
    } else {
      haptic('error');
    }

    setMsg({ 
      text: d?.message || d?.error || "Unknown Error", 
      type: res.ok ? 'success' : 'error',
      reason: d?.reason
    });

    if (res.ok) {
      setInput('');
      fetchStats();
    }
  };

  const handleLogout = () => {
    haptic('medium');
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="dashboard-layout">
      <nav className="side-nav">
        <h1 className="nav-logo">{sysConfig.appName}</h1>
        <div className="user-welcome">
          <span className="text-secondary" style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Duty Guard</span>
          <h2>{name}</h2>
        </div>
        <div className="nav-group">
          <button className="active">Access Control</button>
        </div>
        <button className="logout-btn-glass" onClick={handleLogout}>Sign Out</button>
      </nav>

      <main className="main-content">
        {error && <div className="apple-badge danger" style={{ width: '100%', padding: '1rem', borderRadius: '15px', justifyContent: 'center' }}>⚠️ {error}</div>}
        
        {stats && (
          <div className="dash-stats-grid">
            <GlassCard className="mini-stat">
              <span className="text-secondary">Current In-Premise</span>
              <strong className="value">{stats.GATE_IN + stats.MEET_IN + stats.MEET_OVER}</strong>
            </GlassCard>
            <GlassCard className="mini-stat">
              <span className="text-secondary">Total Today</span>
              <strong className="value">{stats.TOTAL}</strong>
            </GlassCard>
            <GlassCard className="mini-stat">
              <span className="text-secondary">Checked Out</span>
              <strong className="value">{stats.GATE_OUT}</strong>
            </GlassCard>
          </div>
        )}

        <GlassCard className="main-glass">
          <h3>Gate Access Terminal</h3>
          <p className="text-secondary">Scan visitor QR or enter code manually</p>
          <div className="apple-input-group-vertical" style={{ marginTop: '2rem' }}>
            <input 
              type="text" 
              placeholder="NG-CODE or TOKEN..." 
              value={input} 
              onChange={e => setInput(e.target.value.toUpperCase())} 
              style={{ fontSize: '1.5rem', textAlign: 'center', padding: '1.5rem' }}
            />
            <div className="form-actions-glass">
              <button onClick={() => handleGate('checkin')} className="apple-btn-primary flex-1">MARK ENTRY</button>
              <button onClick={() => handleGate('checkout')} className="apple-btn-secondary flex-1">MARK EXIT</button>
            </div>
          </div>
          {msg && (
            <div className={`apple-alert-${msg.type}`} style={{ 
              marginTop: '1.5rem', 
              padding: '1.5rem', 
              borderRadius: '20px', 
              textAlign: 'center', 
              background: msg.type === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)', 
              color: msg.type === 'success' ? '#248a3d' : '#ff3b30',
              border: `1px solid ${msg.type === 'success' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 59, 48, 0.2)'}`
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{msg.type === 'success' ? 'SUCCESS' : 'ACCESS DENIED'}</div>
              <div style={{ marginTop: '0.5rem' }}>{msg.text}</div>
              {msg.reason && <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>Reason: {msg.reason}</div>}
            </div>
          )}
        </GlassCard>

        {activeVisitor && (
          <GlassCard className="main-glass" style={{ marginTop: '2rem' }}>
            <h3>Visitor Audit Timeline</h3>
            <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>History for {activeVisitor.name}</p>
            <div className="timeline-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {timeline.map((log, i) => (
                <div key={i} className="timeline-item" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(0,0,0,0.02)',
                  borderRadius: '15px'
                }}>
                  <div>
                    <strong style={{ display: 'block' }}>{log.event}</strong>
                    <small className="text-secondary">By {log.actor} {log.gate_id ? `@ ${log.gate_id}` : ''}</small>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </main>
    </div>
  );
}

export default function GuardPage() {
  return (
    <ProtectedRoute role="GUARD">
      <GuardPanelContent />
    </ProtectedRoute>
  );
}
