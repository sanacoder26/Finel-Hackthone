import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';

export default function CustomerDashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getMyTickets();
      setTickets(response.data.tickets || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  return (
    <div className="page-shell">
      <div className="page-header-row">
        <div>
          <h2>My tickets</h2>
        </div>
        <Link to="/customer/tickets/new" className="primary-button">New ticket</Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="panel loading-box">Loading your tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="panel empty-box">
          <p>No tickets yet. Create your first support request.</p>
        </div>
      ) : (
        <div className="panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket._id}>
                  <td>
                    <Link to={`/customer/tickets/${ticket._id}`}>{ticket.ticketNumber}</Link>
                  </td>
                  <td>{ticket.subject}</td>
                  <td>{ticket.category || ticket.aiCategory || 'Other'}</td>
                  <td><PriorityBadge priority={ticket.priority || 'Low'} /></td>
                  <td><StatusBadge status={ticket.status} /></td>
                  <td>{new Date(ticket.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
