'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import SwipeableItem from '@/components/SwipeableItem';
import ProtectedRoute from '@/components/ProtectedRoute';
import { haptic, usePullToRefresh } from '@/utils/hooks';
import { API_BASE, fetchAuth } from '@/utils/config';

function HostDashboardContent() {
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
      const data = await res.json();
      setVisitors(data);
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
      <header className="host-header-glass">
        <div className="user-welcome">
          <span>Welcome,</span>
          <h2>{name}</h2>
        </div>
        <button className="logout-btn-glass" onClick={handleLogout}>Sign Out</button>
      </header>

      <div className="host-content">
        <div className="host-tabs-glass">
          <button className={tab === 'pending' ? 'active' : ''} onClick={() => { haptic('light'); setTab('pending'); }}>Inbox ({pending.length})</button>
          <button className={tab === 'active' ? 'active' : ''} onClick={() => { haptic('light'); setTab('active'); }}>Active Meetings</button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => { haptic('light'); setTab('history'); }}>Past Visits</button>
        </div>

        <GlassCard className="main-glass">
          {tab === 'pending' && (
            <div className="host-view">
              <h3>Visitor Requests</h3>
              {pending.length === 0 ? <p className="empty-text">No pending requests.</p> : (
                <div className="apple-list">
                  {pending.map(v => (
                    <SwipeableItem 
                      key={v._id}
                      onSwipeRight={() => handleAction(v._id, 'APPROVED')}
                      onSwipeLeft={() => handleAction(v._id, 'REJECTED')}
                    >
                      <div className="apple-list-item">
                        <img src={v.photo_base64} className="list-avatar" />
                        <div className="item-info"><strong>{v.name}</strong><small>{v.company} • {v.purpose}</small></div>
                        <div className="item-actions">
                          <button className="apple-btn-sm success" onClick={() => handleAction(v._id, 'APPROVED')}>Allow</button>
                          <button className="apple-btn-sm danger" onClick={() => handleAction(v._id, 'REJECTED')}>Deny</button>
                        </div>
                      </div>
                    </SwipeableItem>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'active' && (
            <div className="host-view">
              <h3>Live Status</h3>
              <div className="apple-list">
                {active.map(v => (
                  <div key={v._id} className="apple-list-item">
                    <div className="item-info"><strong>{v.name}</strong><span className={`apple-badge-status ${v.status}`}>{v.status}</span></div>
                    <div className="item-actions">
                      {v.status === 'GATE_IN' && <button className="apple-btn-sm primary" onClick={() => updateStatus(v._id, 'MEET_IN')}>Meeting Started</button>}
                      {v.status === 'MEET_IN' && <button className="apple-btn-sm primary" onClick={() => updateStatus(v._id, 'MEET_OVER')}>Meeting Over</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="host-view">
              <h3>History</h3>
              <div className="apple-list">
                {history.map(v => (
                  <div key={v._id} className="apple-list-item dimmed">
                    <div className="item-info"><strong>{v.name}</strong><small>{new Date(v.created_at).toLocaleDateString()}</small></div>
                    <span className={`apple-badge-status ${v.status}`}>{v.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
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
