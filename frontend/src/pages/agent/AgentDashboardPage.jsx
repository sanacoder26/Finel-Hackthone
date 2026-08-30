import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { ticketService } from '../../services/ticketService';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';

export default function AgentDashboardPage() {
  const [stats, setStats] = useState({});
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [statsResponse, ticketsResponse] = await Promise.all([
          dashboardService.getAgentStats(),
          ticketService.getAgentTickets(),
        ]);
        setStats(statsResponse.data);
        setTickets(ticketsResponse.data.tickets || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const statusMatch = statusFilter === 'All' || ticket.status === statusFilter;
      const priorityMatch = priorityFilter === 'All' || ticket.priority === priorityFilter;
      const categoryMatch = categoryFilter === 'All' || ticket.category === categoryFilter;
      return statusMatch && priorityMatch && categoryMatch;
    });
  }, [tickets, statusFilter, priorityFilter, categoryFilter]);

  return (
    <div className="page-shell">
      <div className="stats-grid">
        <div className="stat-card"><span>Total</span><strong>{stats.totalTickets || 0}</strong></div>
        <div className="stat-card"><span>New</span><strong>{stats.newTickets || 0}</strong></div>
        <div className="stat-card"><span>Assigned</span><strong>{stats.assignedTickets || 0}</strong></div>
        <div className="stat-card"><span>In Progress</span><strong>{stats.inProgressTickets || 0}</strong></div>
        <div className="stat-card"><span>Resolved</span><strong>{stats.resolvedTickets || 0}</strong></div>
        <div className="stat-card"><span>High Priority</span><strong>{stats.highPriorityTickets || 0}</strong></div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="panel filters-panel">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="All">All statuses</option>
          <option value="New">New</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
          <option value="All">All priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="All">All categories</option>
          <option value="Billing">Billing</option>
          <option value="Technical">Technical</option>
          <option value="Account">Account</option>
          <option value="Order">Order</option>
          <option value="Refund">Refund</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {loading ? (
        <div className="panel loading-box">Loading tickets...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="panel empty-box">No matching tickets.</div>
      ) : (
        <div className="panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Customer</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket._id}>
                  <td><Link to={`/agent/tickets/${ticket._id}`}>{ticket.ticketNumber}</Link></td>
                  <td>{ticket.customer?.name || 'Unknown'}</td>
                  <td>{ticket.subject}</td>
                  <td>{ticket.category || 'Other'}</td>
                  <td><PriorityBadge priority={ticket.priority || 'Low'} /></td>
                  <td><StatusBadge status={ticket.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
