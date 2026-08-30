export default function StatusBadge({ status }) {
  const tone = {
    New: 'status-new',
    Assigned: 'status-assigned',
    'In Progress': 'status-progress',
    Resolved: 'status-resolved',
  };

  return <span className={`status-badge ${tone[status] || 'status-default'}`}>{status}</span>;
}
