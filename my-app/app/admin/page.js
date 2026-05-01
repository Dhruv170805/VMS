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
      const vRes = await fetchAuth(`${API_BASE}/visitor/pending`);
      if (vRes.ok) setPending(await vRes.json());

      const eRes = await fetchAuth(`${API_BASE}/employees`);
      if (eRes.ok) setEmployees(await eRes.json());

      const logRes = await fetchAuth(`${API_BASE}/logs`);
      if (logRes.ok) setLogs(await logRes.json());

      const statsRes = await fetchAuth(`${API_BASE}/dashboard/stats/detailed`);
      if (statsRes.ok) {
        const allToday = await statsRes.json();
        setAllHistory(allToday);
        setActiveVisits(allToday.filter(v => ['GATE_IN', 'MEET_IN', 'MEET_OVER', 'APPROVED'].includes(v.status)));
      }

      const blRes = await fetchAuth(`${API_BASE}/blacklist`);
      if (blRes.ok) setBlacklist(await blRes.json());
    } catch (err) { 
      console.error("Admin Fetch Error:", err); 
    }
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
                  <label>Contact Email</label>
                  <input type="email" value={settings.contactEmail || ''} onChange={e => setSettings({...settings, contactEmail: e.target.value})} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <input type="checkbox" checked={settings.allowPublicRegistration ?? true} onChange={e => setSettings({...settings, allowPublicRegistration: e.target.checked})} style={{ width: 'auto' }} />
                    Allow Public Registration
                  </label>
                </div>
              </div>
              <button onClick={handleUpdateConfig} className="apple-btn-primary">Save System Changes</button>
            </div>
          </GlassCard>
        )}

        {tab === 'pending' && (
          <GlassCard className="main-glass">
            <h3 className="card-title">Access Requests</h3>
            <div className="apple-table-container">
              <table className="apple-table">
                <thead><tr><th>Visitor</th><th>Details</th><th>Host</th><th>Actions</th></tr></thead>
                <tbody>
                  {Array.isArray(pending) && pending.map(v => (
                    <tr key={v._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img src={v.photo_base64} className="list-avatar" />
                          <div><strong>{v.name}</strong><small className="text-secondary">{v.company}</small></div>
                        </div>
                      </td>
                      <td>{v.purpose}</td>
                      <td>{v.host_id?.name}</td>
                      <td>
                        <div className="action-btns" style={{ display: 'flex', gap: '8px' }}>
                          <button className="apple-btn-sm" style={{ background: '#34c759', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 700 }} onClick={() => updateStatus(v._id, 'APPROVED')}>Approve</button>
                          <button className="apple-btn-sm" style={{ background: '#ff3b30', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 700 }} onClick={() => updateStatus(v._id, 'REJECTED')}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!pending || pending.length === 0) && <p className="text-secondary" style={{ textAlign: 'center', padding: '3rem' }}>No pending requests.</p>}
            </div>
          </GlassCard>
        )}

        {tab === 'active' && (
          <GlassCard className="main-glass">
            <h3 className="card-title">Live Premises Tracking</h3>
            <div className="apple-table-container">
              <table className="apple-table">
                <thead><tr><th>Visitor</th><th>Code</th><th>Status</th><th>Override</th></tr></thead>
                <tbody>
                  {Array.isArray(activeVisits) && activeVisits.map(v => (
                    <tr key={v._id}>
                      <td><strong>{v.name}</strong></td>
                      <td><code>{v.visitor_code}</code></td>
                      <td><span className={`status-badge-glass ${v.status}`}>{v.status}</span></td>
                      <td>
                        <select 
                          className="apple-select" 
                          style={{ background: 'rgba(0,0,0,0.05)', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 600 }}
                          value={v.status} 
                          onChange={(e) => updateStatus(v._id, e.target.value)}
                        >
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
              {(!activeVisits || activeVisits.length === 0) && <p className="text-secondary" style={{ textAlign: 'center', padding: '3rem' }}>No visitors currently on site.</p>}
            </div>
          </GlassCard>
        )}

        {tab === 'history' && (
          <GlassCard className="main-glass">
            <h3 className="card-title">Global History</h3>
            <div className="apple-table-container">
              <table className="apple-table">
                <thead><tr><th>Time</th><th>Visitor</th><th>Host</th><th>Status</th></tr></thead>
                <tbody>
                  {Array.isArray(allHistory) && allHistory.map(v => (
                    <tr key={v._id}>
                      <td>{new Date(v.created_at).toLocaleTimeString()}</td>
                      <td>
                        <strong>{v.name}</strong>
                        <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{v.phone}</div>
                      </td>
                      <td>{v.host_id?.name}</td>
                      <td><span className={`status-badge-glass ${v.status}`}>{v.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!allHistory || allHistory.length === 0) && <p className="text-secondary" style={{ textAlign: 'center', padding: '3rem' }}>No historical records found.</p>}
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
              <div className="apple-table-container">
                <table className="apple-table">
                  <thead><tr><th>Name</th><th>Department</th><th>Visibility</th><th>Action</th></tr></thead>
                  <tbody>
                    {Array.isArray(employees) && employees.map(e => (
                      <tr key={e._id}>
                        <td><strong>{e.name}</strong></td>
                        <td>{e.department}</td>
                        <td><span className={`apple-badge ${e.isActive ? 'success' : 'secondary'}`}>{e.isActive ? 'Active' : 'Hidden'}</span></td>
                        <td><button className="apple-btn-sm" onClick={() => toggleEmployee(e._id)}>{e.isActive ? 'Hide' : 'Show'}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!employees || employees.length === 0) && <p className="text-secondary" style={{ textAlign: 'center', padding: '3rem' }}>No staff members found.</p>}
              </div>
            </GlassCard>
          </div>
        )}

        {tab === 'blacklist' && (
          <GlassCard className="main-glass">
            <h3>Banned Individuals</h3>
            <div className="apple-table-container">
              <table className="apple-table">
                <thead><tr><th>Identifier</th><th>Type</th><th>Reason</th><th>Status</th></tr></thead>
                <tbody>
                  {Array.isArray(blacklist) && blacklist.map(b => (
                    <tr key={b._id}>
                      <td>{b.value}</td>
                      <td>{b.type}</td>
                      <td>{b.reason}</td>
                      <td><button className="apple-badge danger" onClick={async () => { await fetchAuth(`${API_BASE}/blacklist/${b._id}`, { method: 'DELETE' }); fetchData(); }}>Unban</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!blacklist || blacklist.length === 0) && <p className="text-secondary" style={{ textAlign: 'center', padding: '3rem' }}>Blacklist is currently empty.</p>}
            </div>
          </GlassCard>
        )}

        {tab === 'logs' && (
          <GlassCard className="main-glass">
            <h3>System Audit</h3>
            <div className="apple-table-container">
              <table className="apple-table">
                <thead><tr><th>Time</th><th>Subject</th><th>Action</th><th>Actor</th></tr></thead>
                <tbody>
                  {Array.isArray(logs) && logs.map(l => (
                    <tr key={l._id}>
                      <td>{new Date(l.timestamp).toLocaleString()}</td>
                      <td>{l.visitor_id?.name || 'System'}</td>
                      <td>{l.event}</td>
                      <td>{l.actor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!logs || logs.length === 0) && <p className="text-secondary" style={{ textAlign: 'center', padding: '3rem' }}>No audit logs available.</p>}
            </div>
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
