'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import DigitalPass from '@/components/DigitalPass';
import { haptic } from '@/utils/hooks';
import { API_BASE } from '@/utils/config';
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
      const data = await res.json();
      if (!res.ok) {
        haptic('error');
        throw new Error(data.error);
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
      const data = await res.json();
      if (!res.ok) {
        haptic('error');
        throw new Error(data.error);
      }
      haptic('success');
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('name', data.name);
      localStorage.setItem('userId', data.userId);
      if (data.employeeId) localStorage.setItem('employeeId', data.employeeId);
      router.push(data.role === 'ADMIN' ? '/admin' : data.role === 'GUARD' ? '/guard' : '/host');
    } catch (err) { setError(err.message); }
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
      <GlassCard className="home-card main-glass single-card-view">
        <motion.div 
          className="home-hero"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="main-logo-text">{config.appName}</h1>
          <p className="subtitle">{config.appSubtitle}</p>
        </motion.div>

        <div className="segmented-control-container">
          <div className="segmented-control">
            <button className={mode === 'visitor' ? 'active' : ''} onClick={() => { haptic('light'); setMode('visitor'); }}>Reception</button>
            <button className={mode === 'staff' ? 'active' : ''} onClick={() => { haptic('light'); setMode('staff'); }}>Staff Portal</button>
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
            <motion.div className="welcome-section" variants={itemVariants}>
              <h2>Reception</h2>
              <p className="text-secondary">Scan to Register</p>
              <div className="qr-box-glass">
                <QRCodeCanvas value={registerUrl} size={130} level="H" includeMargin={false} bgColor="transparent" fgColor="#1d1d1f" />
              </div>
              <Link href="/visitor" className="apple-btn-primary">Register Manually</Link>
            </motion.div>
            
            <motion.div className="divider-glass" variants={itemVariants}><span>OR</span></motion.div>

            <motion.div className="track-section" variants={itemVariants}>
              <h3>Track My Pass</h3>
              <form onSubmit={handleTrack} className="track-form-glass">
                <div className="apple-input-group-vertical">
                  <input 
                    type="text" 
                    placeholder="VMS-20240501-XXXX" 
                    value={trackCode} 
                    onChange={e => setTrackCode(e.target.value.toUpperCase())} 
                    required 
                  />
                </div>
                <button type="submit" className="apple-btn-secondary full-width">View Pass</button>
              </form>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            className="staff-login-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2>Staff Access</h2>
            <p className="text-secondary">Secure Portal Login</p>
            <form onSubmit={handleStaffLogin}>
              <div className="apple-input-group-vertical">
                <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button type="submit" className="apple-btn-primary full-width">Sign In</button>
            </form>
          </motion.div>
        )}
        {error && <p className="error-text">{error}</p>}
      </GlassCard>
    </div>
  );
}
