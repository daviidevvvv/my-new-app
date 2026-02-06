type ChartCardProps = {
  title: string;
  subtitle: string;
  labels: string[];
  values: number[];
  unit?: string;
};

export default function ChartCard({
  title,
  subtitle,
  labels,
  values,
  unit
}: ChartCardProps) {
  const maxValue = Math.max(1, ...values);
  return (
    <div className="card chart-card">
      <div className="chart-header">
        <div>
          <p className="card-label">{title}</p>
          <p className="card-helper">{subtitle}</p>
        </div>
        {unit ? <span className="chip">{unit}</span> : null}
      </div>
      <div className="chart-bars">
        {values.map((value, index) => {
          const height = `${Math.round((value / maxValue) * 100)}%`;
          return (
            <div className="chart-bar" key={`${labels[index]}-${value}`}>
              <div className="bar" style={{ height }} />
              <span>{labels[index]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
