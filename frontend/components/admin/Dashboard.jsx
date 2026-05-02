'use client';

import StatCard from "../ui/StatCard";
import { useVisitors } from "@/hooks/useVisitors";

export default function Dashboard() {
  const { stats } = useVisitors();

  return (
    <div className="stats-grid">
      <StatCard title="Approved" value={stats.approved} type="approved" />
      <StatCard title="Pending" value={stats.pending} type="pending" />
      <StatCard title="Gate In" value={stats.checkin} type="checkin" />
      <StatCard title="Rejected" value={stats.rejected} type="rejected" />
    </div>
  );
}
