export default function StatCard({ title, value, type }) {
  return (
    <div className={`glass stat-card ${type}`}>
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  );
}
