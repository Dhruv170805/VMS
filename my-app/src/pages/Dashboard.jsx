import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import GlassCard from '../components/GlassCard';
import { API_BASE, fetchAuth } from '../utils/config';

function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { fetchAuth(`${API_BASE}/dashboard/stats`).then(r => r.json()).then(setStats); }, []);
  if (!stats) return null;

  const data = [
    { name: 'Pending', value: stats.PENDING, color: '#f59e0b' },
    { name: 'Approved', value: stats.APPROVED, color: '#3b82f6' },
    { name: 'On Premises', value: stats.GATE_IN + stats.MEET_IN + stats.MEET_OVER, color: '#10b981' },
    { name: 'Completed', value: stats.GATE_OUT, color: '#64748b' }
  ];

  return (
    <div className="dashboard-view fade-in">
      <div className="dash-row">
        <GlassCard className="dash-chart-card main-glass">
          <h3>Visit Status Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {data.map(d => <div key={d.name} className="legend-item"><span style={{background: d.color}}></span>{d.name}: {d.value}</div>)}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="dash-chart-card main-glass">
          <h3>Activity Trend (Today)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="dash-stats-grid">
        <GlassCard className="mini-glass"><span>Rejected</span><strong>{stats.REJECTED}</strong></GlassCard>
        <GlassCard className="mini-glass"><span>Host Meetings</span><strong>{stats.MEET_IN}</strong></GlassCard>
        <GlassCard className="mini-glass highlight"><span>Total Traffic</span><strong>{stats.TOTAL}</strong></GlassCard>
      </div>
    </div>
  );
}

export default Dashboard;
