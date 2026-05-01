'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion, animate } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import { API_BASE, fetchAuth, safeJson } from '@/utils/config';

function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(value) {
        setDisplayValue(Math.floor(value));
      }
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => { 
    fetchAuth(`${API_BASE}/dashboard/stats`)
      .then(async r => {
        if (!r.ok) throw new Error('Failed to fetch stats');
        return await safeJson(r);
      })
      .then(setStats)
      .catch(err => {
        console.error(err);
        setError(true);
      });
  }, []);
  
  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: '#ff3b30', fontWeight: 'bold' }}>Failed to load dashboard statistics.</p>
    </div>
  );

  if (!stats) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: 40, height: 40, border: '4px solid rgba(0,0,0,0.1)', borderTopColor: '#0071e3', borderRadius: '50%', margin: '0 auto' }} />
    </div>
  );

  const data = [
    { name: 'Pending', value: stats.PENDING, color: '#f59e0b' },
    { name: 'On Site', value: stats.GATE_IN + stats.MEET_IN + stats.MEET_OVER, color: '#3b82f6' },
    { name: 'Departed', value: stats.GATE_OUT, color: '#10b981' },
    { name: 'Rejected', value: stats.REJECTED, color: '#ff3b30' }
  ];

  const container = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
      opacity: 1, scale: 1,
      transition: { staggerChildren: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="dashboard-view"
      variants={container}
      initial="hidden"
      animate="show"
      style={{ width: '100%' }}
    >
      <div className="dash-stats-grid">
        <motion.div variants={item}>
          <GlassCard className="mini-stat">
            <span className="text-secondary">Expected Today</span>
            <strong><AnimatedNumber value={stats.TOTAL} /></strong>
          </GlassCard>
        </motion.div>
        <motion.div variants={item}>
          <GlassCard className="mini-stat">
            <span style={{ color: '#10b981' }}>Currently In</span>
            <strong style={{ color: '#10b981' }}><AnimatedNumber value={stats.GATE_IN + stats.MEET_IN + stats.MEET_OVER} /></strong>
          </GlassCard>
        </motion.div>
        <motion.div variants={item}>
          <GlassCard className="mini-stat">
            <span style={{ color: '#f59e0b' }}>Pending Action</span>
            <strong style={{ color: '#f59e0b' }}><AnimatedNumber value={stats.PENDING} /></strong>
          </GlassCard>
        </motion.div>
      </div>

      <div className="dash-charts-grid">
        <motion.div variants={item}>
          <GlassCard className="main-glass" style={{ padding: '2.5rem' }}>
            <h3 style={{ marginBottom: '2rem' }}>Traffic Overview</h3>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={data} 
                    innerRadius={90} 
                    outerRadius={125} 
                    paddingAngle={10} 
                    dataKey="value" 
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 8px 15px ${entry.color}44)` }} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '24px', 
                      border: '1.5px solid rgba(255,255,255,0.7)', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
                      backdropFilter: 'blur(20px) saturate(200%)',
                      background: 'rgba(255,255,255,0.6)',
                      padding: '12px 20px',
                      fontWeight: 800
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem' }}>
              {data.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '4px', background: d.color }}></span>
                  {d.name}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <GlassCard className="main-glass" style={{ padding: '2.5rem' }}>
            <h3 style={{ marginBottom: '2rem' }}>Hourly Activity</h3>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trendData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)' }}
                  />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
