'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import { API_BASE } from '@/utils/config';
import { useConfig } from '@/context/ConfigContext';

export default function LoginPage() {
  const { config: sysConfig } = useConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('name', data.name);
      localStorage.setItem('userId', data.userId);
      if (data.employeeId) localStorage.setItem('employeeId', data.employeeId);
      
      if (data.role === 'ADMIN') router.push('/admin');
      else if (data.role === 'GUARD') router.push('/guard');
      else router.push('/host');
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="login-layout">
      <GlassCard className="main-glass" style={{ maxWidth: '440px' }}>
        <div className="login-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="main-logo-text">{sysConfig.appName}</h1>
          <p className="text-secondary" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginTop: '0.5rem' }}>Staff Portal</p>
        </div>
        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          <div className="apple-input-group-vertical">
            <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="apple-btn-primary full-width" style={{ marginTop: '1.5rem' }}>Secure Sign In</button>
        </form>
        {error && <p className="error-text" style={{ textAlign: 'center' }}>{error}</p>}
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <Link href="/" className="back-link-glass" style={{ color: 'var(--apple-blue)', fontWeight: 700, textDecoration: 'none' }}>← Back to Reception</Link>
        </div>
      </GlassCard>
    </div>
  );
}
