'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import { API_BASE } from '@/utils/config';

export default function LoginPage() {
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
      <GlassCard className="login-card main-glass">
        <div className="login-header">
          <div className="logo-small">VMS</div>
          <h2>Staff Sign In</h2>
        </div>
        <form onSubmit={handleLogin}>
          <div className="apple-input-group">
            <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="apple-btn-primary full-width">Sign In</button>
        </form>
        {error && <p className="error-text">{error}</p>}
        <Link href="/" className="back-link-glass">← Back to Reception</Link>
      </GlassCard>
    </div>
  );
}
