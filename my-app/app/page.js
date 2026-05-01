'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import DigitalPass from '@/components/DigitalPass';
import { haptic } from '@/utils/hooks';
import { API_BASE, safeJson } from '@/utils/config';
import { useConfig } from '@/context/ConfigContext';

export default function Home() {
  const { config } = useConfig();
  const [mode, setMode] = useState('visitor'); // 'visitor', 'staff'
  const [trackCode, setTrackCode] = useState('');
  const [visitorPass, setVisitorPass] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  // Login state for staff mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    haptic('light');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/visitor/track/${trackCode}`);
      const data = await safeJson(res);
      if (!res.ok) {
        haptic('error');
        throw new Error(data?.error || "Could not track visitor");
      }
      haptic('success');
      setVisitorPass({
        ...data.visitor,
        token: data.token,
        host_name: data.visitor.host_id?.name,
        host_dept: data.visitor.host_id?.department
      });
    } catch (err) { setError(err.message); }
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    haptic('light');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await safeJson(res);
      if (!res.ok) {
        haptic('error');
        throw new Error(data?.error || "Login failed");
      }
      haptic('success');
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('name', data.name);
      localStorage.setItem('userId', data.userId);
      if (data.employeeId) localStorage.setItem('employeeId', data.employeeId);
      router.push(data.role === 'ADMIN' ? '/admin' : data.role === 'GUARD' ? '/guard' : '/host');
    } catch (err) { 
      setError(err.message === 'Invalid email or password' 
        ? "Invalid credentials. Have you run the database setup?" 
        : `Connection Error: ${err.message}`
      ); 
    }
  };

  if (visitorPass) return <DigitalPass pass={visitorPass} onBack={() => { haptic('light'); setVisitorPass(null); }} />;

  const registerUrl = typeof window !== 'undefined' ? `${window.location.origin}/visitor` : '';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="home-layout">
      <GlassCard className="main-glass" style={{ maxWidth: '640px', padding: '4rem' }}>
        <motion.div 
          className="home-hero"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <h1 className="main-logo-text" style={{ fontSize: '4.5rem', marginBottom: '0.5rem' }}>{config.appName}</h1>
          <p className="text-secondary" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px', fontSize: '0.9rem' }}>{config.appSubtitle}</p>
        </motion.div>

        <div className="segmented-control-container" style={{ marginBottom: '4rem' }}>
          <div className="segmented-control" style={{ background: 'rgba(0,0,0,0.05)', padding: '6px', borderRadius: '20px', display: 'flex', gap: '4px' }}>
            <button className={mode === 'visitor' ? 'active' : ''} onClick={() => { haptic('light'); setMode('visitor'); }} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontWeight: 700, transition: 'all 0.3s', background: mode === 'visitor' ? 'white' : 'transparent', boxShadow: mode === 'visitor' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none' }}>RECEPTION</button>
            <button className={mode === 'staff' ? 'active' : ''} onClick={() => { haptic('light'); setMode('staff'); }} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontWeight: 700, transition: 'all 0.3s', background: mode === 'staff' ? 'white' : 'transparent', boxShadow: mode === 'staff' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none' }}>STAFF PORTAL</button>
          </div>
        </div>

        {mode === 'visitor' ? (
          <motion.div 
            className="visitor-view-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <motion.div className="welcome-section" variants={itemVariants} style={{ textAlign: 'center', width: '100%' }}>
              <div className="qr-box-glass" style={{ background: 'white', padding: '2rem', borderRadius: '40px', display: 'inline-block', marginBottom: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                <QRCodeCanvas value={registerUrl} size={160} level="H" includeMargin={false} bgColor="transparent" fgColor="#1d1d1f" />
              </div>
              <p className="text-secondary" style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Scan QR to register or</p>
              <Link href="/visitor" className="apple-btn-primary" style={{ width: '100%', padding: '1.2rem' }}>Register Manually</Link>
            </motion.div>
            
            <motion.div className="divider-glass" variants={itemVariants} style={{ margin: '2.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', opacity: 0.3 }}>
              <div style={{ height: '1px', flex: 1, background: 'black' }}></div>
              <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>EXISTING PASS</span>
              <div style={{ height: '1px', flex: 1, background: 'black' }}></div>
            </motion.div>

            <motion.div className="track-section" variants={itemVariants} style={{ width: '100%' }}>
              <form onSubmit={handleTrack} className="track-form-glass">
                <div className="apple-input-group-vertical" style={{ gap: '1rem' }}>
                  <input 
                    type="text" 
                    placeholder="ENTER VISITOR CODE (VMS-...)" 
                    value={trackCode} 
                    onChange={e => setTrackCode(e.target.value.toUpperCase())} 
                    required 
                    style={{ textAlign: 'center', fontSize: '1.1rem', padding: '1.2rem' }}
                  />
                  <button type="submit" className="apple-btn-secondary" style={{ width: '100%', padding: '1.2rem' }}>Track My Status</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            className="staff-login-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', textAlign: 'center' }}
          >
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Staff Access</h2>
            <p className="text-secondary" style={{ marginBottom: '2.5rem' }}>Please enter your credentials to proceed.</p>
            <form onSubmit={handleStaffLogin}>
              <div className="apple-input-group-vertical" style={{ gap: '1.2rem' }}>
                <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '1.2rem' }} />
                <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '1.2rem' }} />
              </div>
              <button type="submit" className="apple-btn-primary full-width" style={{ marginTop: '2rem', padding: '1.2rem' }}>Sign In to Portal</button>
            </form>
          </motion.div>
        )}
        {error && <p className="error-text" style={{ textAlign: 'center', marginTop: '2rem' }}>{error}</p>}
      </GlassCard>
    </div>
  );
}
