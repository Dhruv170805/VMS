'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import SwipeableItem from '@/components/SwipeableItem';
import ProtectedRoute from '@/components/ProtectedRoute';
import { haptic, usePullToRefresh } from '@/utils/hooks';
import { API_BASE, fetchAuth, safeJson } from '@/utils/config';
import { useConfig } from '@/context/ConfigContext';
import { io } from 'socket.io-client';

function HostDashboardContent() {
  const { config: sysConfig } = useConfig();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [hostId, setHostId] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());
  const [activeTimeline, setActiveTimeline] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // SECURITY: Strictly use employeeId for meeting linkage
    const eId = localStorage.getItem('employeeId');
    if (!eId) {
      setError("No Staff Account linked. Access restricted.");
      setLoading(false);
      return;
    }
    setHostId(eId);
    setName(localStorage.getItem('name'));

    // Socket.io for real-time notifications
    const socket = io(API_BASE.replace('/api', ''), {
      transports: ['websocket']
    });

    socket.on('visitor:new', (data) => {
      if (data.host_id === eId || data.host_id?._id === eId) {
        haptic('heavy');
        fetchData();
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('New Visitor Request', { body: `${data.name} is waiting for you.` });
        }
      }
    });

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => socket.disconnect();
  }, []);

  const fetchTimeline = async (id) => {
    haptic('light');
    const res = await fetchAuth(`${API_BASE}/visitor/${id}/timeline`);
    if (res.ok) {
      setTimelineData(await safeJson(res));
      setActiveTimeline(id);
    }
  };

  // Real-time ticker for Meeting Timer
  useEffect(() => {
    const ticker = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(ticker);
  }, []);

  const fetchData = async () => {
    if (!hostId) return;
    try {
      const res = await fetchAuth(`${API_BASE}/visitor/host/${hostId}`);
      if (res.ok) {
        const data = await safeJson(res);
        if (data) setVisitors(data);
        setError(null);
      } else {
        throw new Error("Server error");
      }
    } catch (err) { 
      console.error(err); 
      setError("Unable to sync with front desk.");
    }
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
    // Optimistic Update
    setVisitors(prev => prev.filter(v => v._id !== id));
    
    const res = await fetchAuth(`${API_BASE}/visitor/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) haptic('success'); else {
      haptic('error');
      fetchData(); // Rollback on failure
    }
  };

  const updateStatus = async (id, status) => {
    haptic('light');
    // Optimistic Update for "Meeting Over"
    if (status === 'MEET_OVER') {
      setVisitors(prev => prev.map(v => v._id === id ? {...v, status} : v));
    }

    const res = await fetchAuth(`${API_BASE}/visitor/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) haptic('medium'); else {
      haptic('error');
      fetchData();
    }
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

  const EmptyState = ({ icon, title }) => (
    <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
      <p className="text-secondary" style={{ fontWeight: 600 }}>{title}</p>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <nav className="side-nav">
        <div className="nav-logo">{sysConfig.appName}</div>
        <div className="user-welcome">
          <span className="text-secondary" style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Host Duty</span>
          <h2>{name}</h2>
        </div>
        <div className="nav-group">
          <button className={tab === 'pending' ? 'active' : ''} onClick={() => { haptic('light'); setTab('pending'); }}>Inbox ({pending.length})</button>
          <button className={tab === 'active' ? 'active' : ''} onClick={() => { haptic('light'); setTab('active'); }}>Live Status</button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => { haptic('light'); setTab('history'); }}>Meeting History</button>
        </div>
        <button className="logout-btn-glass" onClick={handleLogout}>Sign Out</button>
      </nav>

      <main className="main-content">
        {error && <div className="apple-badge danger" style={{ width: '100%', padding: '1rem', borderRadius: '15px', justifyContent: 'center' }}>⚠️ {error}</div>}
        
        <GlassCard className="main-glass wide-glass">
          {tab === 'pending' && (
            <div className="host-view" style={{ width: '100%' }}>
              <h3 style={{ marginBottom: '2rem' }}>Visitor Requests</h3>
              {pending.length === 0 ? <EmptyState icon="📥" title="Your inbox is empty" /> : (
                <div className="apple-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                  {pending.map(v => (
                    <SwipeableItem 
                      key={v._id}
                      onSwipeRight={() => handleAction(v._id, 'APPROVED')}
                      onSwipeLeft={() => handleAction(v._id, 'REJECTED')}
                    >
                      <div className={`glass ${v.priority === 'VIP' ? 'vip-border' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', width: '100%', position: 'relative' }}>
                        {v.priority === 'VIP' && <span className="vip-badge">VIP</span>}
                        <img src={v.photo_base64} style={{ width: '70px', height: '70px', borderRadius: '20px', objectFit: 'cover', border: '3px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }} alt="" />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <strong style={{ fontSize: '1.2rem', fontWeight: 800 }}>{v.name}</strong>
                            <span className="text-secondary" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{new Date(v.visit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <span className="text-secondary" style={{ fontSize: '0.95rem', fontWeight: 600 }}>{v.company} • {v.purpose}</span>
                          <div style={{ marginTop: '5px' }}>
                            <button onClick={() => fetchTimeline(v._id)} style={{ background: 'transparent', border: 'none', color: 'var(--apple-blue)', fontSize: '0.75rem', fontWeight: 800, padding: 0, cursor: 'pointer' }}>VIEW HISTORY</button>
                            {v.approval_level !== 'EMPLOYEE' && (
                              <span style={{ marginLeft: '10px', fontSize: '0.65rem', fontWeight: 900, color: 'var(--apple-orange)', textTransform: 'uppercase' }}>Escalated to {v.approval_level}</span>
                            )}
                          </div>
                        </div>
                        <div className="item-actions" style={{ display: 'flex', gap: '1rem' }}>
                          <button className="apple-btn-success" onClick={() => handleAction(v._id, 'APPROVED')}>Allow</button>
                          <button className="apple-btn-danger" onClick={() => handleAction(v._id, 'REJECTED')}>Deny</button>
                        </div>
                      </div>
                    </SwipeableItem>
                  ))}
                  
                  {activeTimeline && (
                    <div className="timeline-overlay glass-card" style={{ marginTop: '1rem', padding: '1.5rem', border: '2px solid var(--apple-blue)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0 }}>Visitor Audit Trail</h4>
                        <button onClick={() => setActiveTimeline(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                      </div>
                      <div className="timeline-scroll" style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {timelineData.map((l, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '8px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
                            <strong>{l.event}</strong>
                            <span className="text-secondary">{new Date(l.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'active' && (
            <div className="host-view" style={{ width: '100%' }}>
              <h3 style={{ marginBottom: '2rem' }}>Live Status</h3>
              <div className="apple-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {active.length === 0 ? <EmptyState icon="👥" title="No visitors currently on site" /> : active.map(v => (
                  <div key={v._id} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2rem' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>{v.name}</strong>
                      <span className={`status-badge-glass ${v.status}`} style={{ display: 'inline-block' }}>{v.status}</span>
                      {v.status === 'MEET_IN' && v.visit_timestamps.meet_in_at && (
                        <div className="meeting-timer" style={{ marginLeft: '1rem' }}>
                          <span>⏱️</span> {Math.max(0, Math.floor((now - new Date(v.visit_timestamps.meet_in_at)) / 60000))}m {Math.floor((now - new Date(v.visit_timestamps.meet_in_at)) / 1000) % 60}s
                        </div>
                      )}
                    </div>
                    <div className="item-actions">
                      {v.status === 'GATE_IN' && <button className="apple-btn-primary" onClick={() => updateStatus(v._id, 'MEET_IN')}>Start Meeting</button>}
                      {v.status === 'MEET_IN' && <button className="apple-btn-primary" style={{ background: '#1d1d1f' }} onClick={() => updateStatus(v._id, 'MEET_OVER')}>End Meeting</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="host-view" style={{ width: '100%' }}>
              <h3 style={{ marginBottom: '2rem' }}>Meeting History</h3>
              <div className="apple-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.length === 0 ? <EmptyState icon="📜" title="No historical records" /> : history.map(v => (
                  <div key={v._id} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', opacity: 0.8 }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '1.1rem', fontWeight: 700 }}>{v.name}</strong>
                      <span className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{new Date(v.created_at).toLocaleDateString()} • {new Date(v.created_at).toLocaleTimeString()}</span>
                    </div>
                    <span className={`status-badge-glass ${v.status}`}>{v.status}</span>
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
