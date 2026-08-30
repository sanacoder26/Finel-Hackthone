import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ subject: '', description: '', category: 'Other' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdTicket, setCreatedTicket] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await ticketService.createTicket(form);
      setCreatedTicket(response.data.ticket);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header-row">
        <h2>New ticket</h2>
      </div>

      <div className="two-column-layout">
        <form className="panel stack-form" onSubmit={handleSubmit}>
          <label>
            <span>Subject</span>
            <input
              type="text"
              value={form.subject}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
              required
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              rows="6"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              required
            />
          </label>

          <label>
            <span>Category (optional)</span>
            <select
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              <option value="Other">Other</option>
              <option value="Billing">Billing</option>
              <option value="Technical">Technical</option>
              <option value="Account">Account</option>
              <option value="Order">Order</option>
              <option value="Refund">Refund</option>
            </select>
          </label>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Creating ticket...' : 'Create ticket'}
          </button>
        </form>

        {createdTicket && (
          <div className="panel ai-card">
            <h3>Ticket created</h3>
            <p><strong>Ticket number:</strong> {createdTicket.ticketNumber}</p>
            <p><strong>AI status:</strong> {createdTicket.aiStatus}</p>
            <p><strong>Category:</strong> {createdTicket.aiCategory || createdTicket.category}</p>
            <p><strong>Priority:</strong> {createdTicket.aiPriority || createdTicket.priority}</p>
            <p><strong>Summary:</strong> {createdTicket.aiSummary || 'No summary yet.'}</p>
            <button className="secondary-button" onClick={() => navigate(`/customer/tickets/${createdTicket._id}`)}>
              Open ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
