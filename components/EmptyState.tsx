export default function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">◎</div>
      <div>
        <p className="empty-title">{title}</p>
        <p className="empty-description">{description}</p>
      </div>
    </div>
  );
}
