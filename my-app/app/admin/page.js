'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import SwipeableItem from '@/components/SwipeableItem';
import Dashboard from '@/components/Dashboard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { haptic, usePullToRefresh } from '@/utils/hooks';
import { API_BASE, fetchAuth } from '@/utils/config';
import { useConfig } from '@/context/ConfigContext';

function AdminPanelContent() {
  const { config: sysConfig, refreshConfig } = useConfig();
  const [pending, setPending] = useState([]);
  const [activeVisits, setActiveVisits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [file, setFile] = useState(null);
  const [settings, setSettings] = useState({});

  useEffect(() => { setSettings(sysConfig); }, [sysConfig]);

  const router = useRouter();

  const handleUpdateConfig = async () => {
    haptic('heavy');
    const res = await fetchAuth(`${API_BASE}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      haptic('success');
      refreshConfig();
    }
  };

  const fetchData = async () => {
    try {
      const [vRes, eRes, logRes, allTodayRes, blRes] = await Promise.all([
        fetchAuth(`${API_BASE}/visitor/pending`),
        fetch(`${API_BASE}/employees`),
        fetchAuth(`${API_BASE}/logs`),
        fetchAuth(`${API_BASE}/dashboard/stats/detailed`),
        fetchAuth(`${API_BASE}/blacklist`)
      ]);
      setPending(await vRes.json());
      setEmployees(await eRes.json());
      setLogs(await logRes.json());
      const allToday = await allTodayRes.json();
      setAllHistory(allToday);
      setBlacklist(await blRes.json());
      setActiveVisits(allToday.filter(v => ['GATE_IN', 'MEET_IN', 'MEET_OVER', 'APPROVED'].includes(v.status)));
    } catch (err) { console.error(err); }
  };

  usePullToRefresh(fetchData);

  useEffect(() => { 
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, status) => {
    haptic('light');
    const res = await fetchAuth(`${API_BASE}/visitor/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) haptic('success'); else haptic('error');
    fetchData();
  };

  const toggleEmployee = async (id) => {
    haptic('light');
    await fetchAuth(`${API_BASE}/employees/${id}/toggle`, { method: 'PATCH' });
    haptic('medium');
    fetchData();
  };

  const addToBlacklist = async (value, type) => {
    const reason = window.prompt("Reason for blacklisting?");
    if (reason === null) return;
    haptic('heavy');
    await fetchAuth(`${API_BASE}/blacklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, type, reason })
    });
    fetchData();
  };

  const handleLogout = () => {
    haptic('medium');
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="admin-layout">
      <nav className="admin-side-nav">
        <h1 className="nav-logo">{sysConfig.appName}</h1>
        <div className="nav-group">
          <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => { haptic('light'); setTab('dashboard'); }}>Dashboard</button>
          <button className={tab === 'pending' ? 'active' : ''} onClick={() => { haptic('light'); setTab('pending'); }}>Pending ({pending.length})</button>
          <button className={tab === 'active' ? 'active' : ''} onClick={() => { haptic('light'); setTab('active'); }}>Live Tracking</button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => { haptic('light'); setTab('history'); }}>History</button>
          <button className={tab === 'employees' ? 'active' : ''} onClick={() => { haptic('light'); setTab('employees'); }}>Staff</button>
          <button className={tab === 'blacklist' ? 'active' : ''} onClick={() => { haptic('light'); setTab('blacklist'); }}>Blacklist</button>
          <button className={tab === 'logs' ? 'active' : ''} onClick={() => { haptic('light'); setTab('logs'); }}>Audit Logs</button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => { haptic('light'); setTab('settings'); }}>Settings</button>
        </div>
        <button className="logout-btn-glass" onClick={handleLogout}>Sign Out</button>
      </nav>

      <main className="admin-main">
        {tab === 'dashboard' && <Dashboard />}

        {tab === 'settings' && (
          <GlassCard className="main-glass">
            <h3>Application Settings</h3>
            <div className="advanced-form-glass">
              <div className="form-section-glass">
                <h4>Branding</h4>
                <div className="apple-input-group-vertical">
                  <label>App Name</label>
                  <input type="text" value={settings.appName || ''} onChange={e => setSettings({...settings, appName: e.target.value})} />
                  <label>Subtitle</label>
                  <input type="text" value={settings.appSubtitle || ''} onChange={e => setSettings({...settings, appSubtitle: e.target.value})} />
                  <label>Company Name</label>
                  <input type="text" value={settings.companyName || ''} onChange={e => setSettings({...settings, companyName: e.target.value})} />
                </div>
              </div>
              <div className="form-section-glass">
                <h4>System Logic</h4>
                <div className="apple-input-group-vertical">
                  <label>Visitor Code Prefix</label>
                  <input type="text" value={settings.visitorCodePrefix || ''} onChange={e => setSettings({...settings, visitorCodePrefix: e.target.value})} />
                </div>
              </div>
              <button onClick={handleUpdateConfig} className="apple-btn-primary">Save System Changes</button>
            </div>
          </GlassCard>
        )}

        {tab === 'pending' && (
          <GlassCard className="main-glass">
            <h3 className="card-title">Access Requests</h3>
            <div className="table-container">
              <table className="apple-table">
                <thead><tr><th>Visitor</th><th>Photo</th><th>Host</th><th>Actions</th></tr></thead>
                <tbody>
                  {pending.map(v => (
                    <tr key={v._id}>
                      <td colSpan="4" style={{ padding: 0 }}>
                        <SwipeableItem 
                          onSwipeRight={() => updateStatus(v._id, 'APPROVED')}
                          onSwipeLeft={() => updateStatus(v._id, 'REJECTED')}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', width: '100%', padding: '1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: '24px' }}>
                            <div className="name-cell"><strong>{v.name}</strong><small>{v.company}</small></div>
                            <div><img src={v.photo_base64} className="table-thumb" /></div>
                            <div>{v.host_id?.name}</div>
                            <div className="action-btns">
                              <button className="apple-badge success" onClick={() => updateStatus(v._id, 'APPROVED')}>Approve</button>
                              <button className="apple-badge danger" onClick={() => updateStatus(v._id, 'REJECTED')}>Reject</button>
                              <button className="apple-badge secondary" onClick={() => addToBlacklist(v.email, 'EMAIL')}>Ban</button>
                            </div>
                          </div>
                        </SwipeableItem>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {tab === 'active' && (
          <GlassCard className="main-glass">
            <h3 className="card-title">Live Premises Tracking</h3>
            <div className="table-container">
              <table className="apple-table">
                <thead><tr><th>Visitor</th><th>Code</th><th>Status</th><th>Override</th></tr></thead>
                <tbody>
                  {activeVisits.map(v => (
                    <tr key={v._id}>
                      <td><strong>{v.name}</strong></td>
                      <td><code>{v.visitor_code}</code></td>
                      <td><span className={`apple-badge-status ${v.status}`}>{v.status}</span></td>
                      <td>
                        <select className="apple-select" value={v.status} onChange={(e) => updateStatus(v._id, e.target.value)}>
                          <option value="APPROVED">Approved</option>
                          <option value="GATE_IN">Gate In</option>
                          <option value="MEET_IN">Meet In</option>
                          <option value="MEET_OVER">Meet Over</option>
                          <option value="GATE_OUT">Gate Out</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {tab === 'history' && (
          <GlassCard className="main-glass">
            <h3 className="card-title">Global History</h3>
            <div className="table-container">
              <table className="apple-table">
                <thead><tr><th>Time</th><th>Visitor</th><th>Host</th><th>Status</th></tr></thead>
                <tbody>
                  {allHistory.map(v => (
                    <tr key={v._id}>
                      <td>{new Date(v.created_at).toLocaleTimeString()}</td>
                      <td><strong>{v.name}</strong><br/><small>{v.phone}</small></td>
                      <td>{v.host_id?.name}</td>
                      <td><span className={`apple-badge-status ${v.status}`}>{v.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {tab === 'employees' && (
          <div className="employees-view">
            <GlassCard className="main-glass margin-bottom">
              <h3>Upload Staff Directory</h3>
              <div className="upload-box-glass">
                <input type="file" onChange={e => setFile(e.target.files[0])} className="apple-file" />
                <button onClick={async () => {
                  const fd = new FormData(); fd.append('file', file);
                  await fetchAuth(`${API_BASE}/employees/upload`, { method: 'POST', body: fd });
                  fetchData();
                }} className="apple-btn-primary">Update Database</button>
              </div>
            </GlassCard>
            <GlassCard className="main-glass">
              <h3>Current Directory</h3>
              <table className="apple-table">
                <thead><tr><th>Name</th><th>Department</th><th>Visibility</th><th>Action</th></tr></thead>
                <tbody>
                  {employees.map(e => (
                    <tr key={e._id}>
                      <td><strong>{e.name}</strong></td>
                      <td>{e.department}</td>
                      <td><span className={`apple-badge ${e.isActive ? 'success' : 'secondary'}`}>{e.isActive ? 'Active' : 'Hidden'}</span></td>
                      <td><button className="apple-btn-sm" onClick={() => toggleEmployee(e._id)}>{e.isActive ? 'Hide' : 'Show'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>
        )}

        {tab === 'blacklist' && (
          <GlassCard className="main-glass">
            <h3>Banned Individuals</h3>
            <table className="apple-table">
              <thead><tr><th>Identifier</th><th>Type</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {blacklist.map(b => (
                  <tr key={b._id}>
                    <td>{b.value}</td>
                    <td>{b.type}</td>
                    <td>{b.reason}</td>
                    <td><button className="apple-badge danger" onClick={async () => { await fetchAuth(`${API_BASE}/blacklist/${b._id}`, { method: 'DELETE' }); fetchData(); }}>Unban</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}

        {tab === 'logs' && (
          <GlassCard className="main-glass">
            <h3>System Audit</h3>
            <table className="apple-table">
              <thead><tr><th>Time</th><th>Subject</th><th>Action</th><th>Actor</th></tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l._id}>
                    <td>{new Date(l.timestamp).toLocaleString()}</td>
                    <td>{l.visitor_id?.name || 'System'}</td>
                    <td>{l.event}</td>
                    <td>{l.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute role="ADMIN">
      <AdminPanelContent />
    </ProtectedRoute>
  );
}
