export default function PriorityBadge({ priority }) {
  const tone = {
    Low: 'priority-low',
    Medium: 'priority-medium',
    High: 'priority-high',
  };

  return <span className={`priority-badge ${tone[priority] || 'priority-default'}`}>{priority}</span>;
}
