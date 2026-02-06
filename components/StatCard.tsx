export default function StatCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="card stat-card">
      <p className="card-label">{label}</p>
      <p className="card-value">{value}</p>
      {helper ? <p className="card-helper">{helper}</p> : null}
    </div>
  );
}
