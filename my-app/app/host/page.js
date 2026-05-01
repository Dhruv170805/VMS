'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import SwipeableItem from '@/components/SwipeableItem';
import ProtectedRoute from '@/components/ProtectedRoute';
import { haptic, usePullToRefresh } from '@/utils/hooks';
import { API_BASE, fetchAuth } from '@/utils/config';
import { useConfig } from '@/context/ConfigContext';

function HostDashboardContent() {
  const { config: sysConfig } = useConfig();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [hostId, setHostId] = useState(null);
  const [name, setName] = useState('');
  const router = useRouter();

  useEffect(() => {
    setHostId(localStorage.getItem('employeeId') || localStorage.getItem('userId'));
    setName(localStorage.getItem('name'));
  }, []);

  const fetchData = async () => {
    if (!hostId) return;
    try {
      const res = await fetchAuth(`${API_BASE}/visitor/host/${hostId}`);
      if (res.ok) {
        const data = await res.json();
        setVisitors(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  usePullToRefresh(fetchData);

  useEffect(() => {
    if (hostId) {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [hostId]);

  const handleAction = async (id, status) => {
    haptic('light');
    const res = await fetchAuth(`${API_BASE}/visitor/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) haptic('success'); else haptic('error');
    fetchData();
  };

  const updateStatus = async (id, status) => {
    haptic('light');
    const res = await fetchAuth(`${API_BASE}/visitor/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) haptic('medium'); else haptic('error');
    fetchData();
  };

  const handleLogout = () => {
    haptic('medium');
    localStorage.clear();
    router.push('/login');
  };

  if (loading && !hostId) return null;

  const pending = visitors.filter(v => v.status === 'PENDING');
  const active = visitors.filter(v => ['GATE_IN', 'MEET_IN', 'MEET_OVER', 'APPROVED'].includes(v.status));
  const history = visitors.filter(v => ['GATE_OUT', 'REJECTED'].includes(v.status));

  return (
    <div className="host-layout">
      <nav className="host-side-nav">
        <div className="nav-logo">{sysConfig.appName}</div>
        <div className="user-welcome" style={{ marginBottom: '2rem' }}>
          <span className="text-secondary" style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Welcome back,</span>
          <h2 style={{ margin: '0.2rem 0', fontSize: '1.8rem', fontWeight: 900 }}>{name}</h2>
        </div>
        <div className="nav-group">
          <button className={tab === 'pending' ? 'active' : ''} onClick={() => { haptic('light'); setTab('pending'); }}>Inbox ({pending.length})</button>
          <button className={tab === 'active' ? 'active' : ''} onClick={() => { haptic('light'); setTab('active'); }}>Live Status</button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => { haptic('light'); setTab('history'); }}>Meeting History</button>
        </div>
        <button className="logout-btn-glass" onClick={handleLogout}>Sign Out</button>
      </nav>

      <main className="host-main">
        <GlassCard className="main-glass">
          {tab === 'pending' && (
            <div className="host-view" style={{ width: '100%' }}>
              <h3>Visitor Requests</h3>
              {pending.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📥</div>
                  <p className="text-secondary" style={{ fontWeight: 600 }}>Your inbox is empty</p>
                </div>
              ) : (
                <div className="apple-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                  {pending.map(v => (
                    <SwipeableItem 
                      key={v._id}
                      onSwipeRight={() => handleAction(v._id, 'APPROVED')}
                      onSwipeLeft={() => handleAction(v._id, 'REJECTED')}
                    >
                      <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.2rem', width: '100%' }}>
                        <img src={v.photo_base64} style={{ width: '60px', height: '60px', borderRadius: '15px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <strong style={{ display: 'block', fontSize: '1.1rem' }}>{v.name}</strong>
                          <span className="text-secondary" style={{ fontSize: '0.9rem' }}>{v.company} • {v.purpose}</span>
                        </div>
                        <div className="item-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="apple-btn-sm" style={{ background: '#34c759', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 700 }} onClick={() => handleAction(v._id, 'APPROVED')}>Allow</button>
                          <button className="apple-btn-sm" style={{ background: '#ff3b30', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 700 }} onClick={() => handleAction(v._id, 'REJECTED')}>Deny</button>
                        </div>
                      </div>
                    </SwipeableItem>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'active' && (
            <div className="host-view" style={{ width: '100%' }}>
              <h3>Live Status</h3>
              <div className="apple-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {active.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                    <p className="text-secondary" style={{ fontWeight: 600 }}>No visitors currently on site</p>
                  </div>
                ) : active.map(v => (
                  <div key={v._id} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.2rem' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '1.1rem' }}>{v.name}</strong>
                      <span className={`status-badge-glass ${v.status}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>{v.status}</span>
                      {v.status === 'MEET_IN' && v.visit_timestamps.meet_in_at && (
                        <div className="meeting-timer">
                          <span>⏱️</span> {Math.max(0, Math.floor((new Date() - new Date(v.visit_timestamps.meet_in_at)) / 60000))} mins
                        </div>
                      )}
                    </div>
                    <div className="item-actions">
                      {v.status === 'GATE_IN' && <button className="apple-btn-primary" onClick={() => updateStatus(v._id, 'MEET_IN')}>Start Meeting</button>}
                      {v.status === 'MEET_IN' && <button className="apple-btn-primary" onClick={() => updateStatus(v._id, 'MEET_OVER')}>End Meeting</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="host-view" style={{ width: '100%' }}>
              <h3>History</h3>
              <div className="apple-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📜</div>
                    <p className="text-secondary" style={{ fontWeight: 600 }}>No historical records</p>
                  </div>
                ) : history.map(v => (
                  <div key={v._id} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.2rem', opacity: 0.7 }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block' }}>{v.name}</strong>
                      <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{new Date(v.created_at).toLocaleDateString()} • {new Date(v.created_at).toLocaleTimeString()}</span>
                    </div>
                    <span className="status-badge-glass">{v.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </main>
    </div>
  );
}

export default function HostPage() {
  return (
    <ProtectedRoute role="EMPLOYEE">
      <HostDashboardContent />
    </ProtectedRoute>
  );
}
