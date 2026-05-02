'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from "@/components/admin/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import GlassCard from '@/components/GlassCard';
import { haptic } from '@/utils/hooks';
import { useConfig } from '@/context/ConfigContext';

function AdminPortalContent() {
  const { config: sysConfig } = useConfig();
  const [tab, setTab] = useState('dashboard');
  const [name, setName] = useState('');
  const router = useRouter();

  useEffect(() => {
    setName(localStorage.getItem('name') || 'Administrator');
  }, []);

  const handleLogout = () => {
    haptic('medium');
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="dashboard-layout">
      <nav className="side-nav">
        <div className="nav-logo">{sysConfig.appName}</div>
        <div className="user-welcome">
          <span className="text-secondary" style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>System Admin</span>
          <h2>{name}</h2>
        </div>
        <div className="nav-group">
          <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => { haptic('light'); setTab('dashboard'); }}>Insights</button>
          <button className={tab === 'staff' ? 'active' : ''} onClick={() => { haptic('light'); setTab('staff'); }}>Staff Directory</button>
          <button className={tab === 'logs' ? 'active' : ''} onClick={() => { haptic('light'); setTab('logs'); }}>Audit Logs</button>
          <button className={tab === 'config' ? 'active' : ''} onClick={() => { haptic('light'); setTab('config'); }}>System Config</button>
        </div>
        <button className="logout-btn-glass" onClick={handleLogout}>Sign Out</button>
      </nav>

      <main className="main-content">
        {tab === 'dashboard' && <Dashboard />}
        
        {tab === 'staff' && (
          <GlassCard className="main-glass">
            <h3>Staff Management</h3>
            <p className="text-secondary">Manage employees and their access status.</p>
            <div style={{ marginTop: '2rem', textAlign: 'center', padding: '5rem' }}>
              <div style={{ fontSize: '3rem' }}>👥</div>
              <p>Staff directory management coming soon.</p>
            </div>
          </GlassCard>
        )}

        {tab === 'logs' && (
          <GlassCard className="main-glass">
            <h3>System Audit Logs</h3>
            <p className="text-secondary">Security event tracking and visitor history.</p>
            <div style={{ marginTop: '2rem', textAlign: 'center', padding: '5rem' }}>
              <div style={{ fontSize: '3rem' }}>📜</div>
              <p>Audit trail viewer coming soon.</p>
            </div>
          </GlassCard>
        )}

        {tab === 'config' && (
          <GlassCard className="main-glass">
            <h3>Global Configuration</h3>
            <p className="text-secondary">Update application names, themes, and security policies.</p>
            <div style={{ marginTop: '2rem', textAlign: 'center', padding: '5rem' }}>
              <div style={{ fontSize: '3rem' }}>⚙️</div>
              <p>System settings panel coming soon.</p>
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
      <AdminPortalContent />
    </ProtectedRoute>
  );
}
