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
  const router = useRouter();

  useEffect(() => {
    setName(localStorage.getItem('name'));
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

  usePullToRefresh(fetchStats);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleGate = async (action) => {
    haptic('light');
    const payload = input.startsWith('VMS-') || input.includes('-') ? { visitorCode: input } : { token: input };
    const res = await fetchAuth(`${API_BASE}/gate/${action}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const d = await safeJson(res);
    if (res.ok) haptic('success'); else haptic('error');
    setMsg({ text: d?.message || d?.error || "Unknown Error", type: res.ok ? 'success' : 'error' });
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
              placeholder="VMS-CODE or TOKEN..." 
              value={input} 
              onChange={e => setInput(e.target.value.toUpperCase())} 
              style={{ fontSize: '1.5rem', textAlign: 'center', padding: '1.5rem' }}
            />
            <div className="form-actions-glass">
              <button onClick={() => handleGate('checkin')} className="apple-btn-primary flex-1">MARK ENTRY</button>
              <button onClick={() => handleGate('checkout')} className="apple-btn-secondary flex-1">MARK EXIT</button>
            </div>
          </div>
          {msg && <div className={`apple-alert-${msg.type}`} style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', textAlign: 'center', background: msg.type === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)', color: msg.type === 'success' ? '#248a3d' : '#ff3b30' }}>{msg.text}</div>}
        </GlassCard>
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
