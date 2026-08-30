import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { messageService } from '../../services/messageService';
import { ticketService } from '../../services/ticketService';
import socket from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';

const categories = ['Billing', 'Technical', 'Account', 'Order', 'Refund', 'Other'];
const priorities = ['Low', 'Medium', 'High'];
const statusOptions = ['New', 'Assigned', 'In Progress', 'Resolved'];

export default function AgentTicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSavingAIDetails, setIsSavingAIDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const mountedRef = useRef(false);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const ticketResponse = await ticketService.getTicketById(id);
      const messagesResponse = await messageService.getMessages(id);
      setTicket(ticketResponse.data.ticket);
      setMessages(messagesResponse.data.messages || []);
      setResolutionNote(ticketResponse.data.ticket.resolutionNote || '');
      setError('');
      setSuccess('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;

    socket.connect();
    socket.emit('join_ticket', id);

    const onNewMessage = (payload) => {
      if (payload.ticketId === id) {
        setMessages((current) => {
          const exists = current.some((item) => item._id === payload.message._id);
          if (exists) return current;
          return [...current, payload.message];
        });
      }
    };

    const onStatusUpdate = (payload) => {
      if (payload.ticketId === id) {
        setTicket((current) => (current ? { ...current, status: payload.status } : current));
      }
    };

    if (!mountedRef.current) {
      socket.on('new_message', onNewMessage);
      socket.on('ticket_status_updated', onStatusUpdate);
      mountedRef.current = true;
    }

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('ticket_status_updated', onStatusUpdate);
    };
  }, [id, user]);

  const updateAIDetails = async () => {
    if (!ticket) return;
    try {
      setIsSavingAIDetails(true);
      setError('');
      setSuccess('');
      const response = await ticketService.updateTriage(id, {
        category: ticket.aiCategory,
        priority: ticket.aiPriority,
        summary: ticket.aiSummary,
      });
      setTicket(response.data.ticket);
      setSuccess('AI review saved.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save AI review');
    } finally {
      setIsSavingAIDetails(false);
    }
  };

  const updateStatus = async (nextStatus) => {
    if (nextStatus === ticket?.status) return;
    try {
      setIsUpdatingStatus(true);
      setError('');
      setSuccess('');
      const response = await ticketService.updateStatus(id, nextStatus);
      setTicket(response.data.ticket);
      setSuccess(`Status updated to ${nextStatus}.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const resolveTicket = async () => {
    if (!resolutionNote.trim()) {
      setError('A resolution note is required before resolving the ticket.');
      return;
    }

    try {
      setIsResolving(true);
      setError('');
      setSuccess('');
      const response = await ticketService.resolveTicket(id, resolutionNote);
      setTicket(response.data.ticket);
      setSuccess('Ticket resolved successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resolve ticket');
    } finally {
      setIsResolving(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!newMessage.trim()) return;
    try {
      setError('');
      const response = await messageService.sendMessage(id, { message: newMessage });
      setMessages((current) => [...current, response.data.message]);
      setNewMessage('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send message');
    }
  };

  if (loading) return <div className="page-shell"><div className="panel loading-box">Loading ticket...</div></div>;
  if (!ticket) return <div className="page-shell"><div className="panel error-box">Ticket not found</div></div>;

  return (
    <div className="page-shell ticket-page">
      <div className="panel ticket-header-card">
        <div>
          <span className="eyebrow">Ticket {ticket.ticketNumber}</span>
          <h2>{ticket.subject}</h2>
        </div>
        <div className="ticket-meta-inline">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority || 'Low'} />
        </div>
      </div>

      <div className="two-column-layout">
        <div className="panel">
          <h3>Ticket information</h3>
          <div className="detail-grid">
            <div><strong>Customer:</strong> {ticket.customer?.name}</div>
            <div><strong>Assigned agent:</strong> {ticket.assignedAgent?.name || 'Not assigned'}</div>
            <div><strong>Category:</strong> {ticket.category || 'Other'}</div>
            <div><strong>Priority:</strong> {ticket.priority || 'Low'}</div>
            <div><strong>Status:</strong> {ticket.status}</div>
            <div><strong>AI reviewed:</strong> {ticket.aiReviewed ? 'Yes' : 'No'}</div>
          </div>
          <p className="muted-text">{ticket.description}</p>
        </div>

        <div className="panel ai-card">
          <h3>AI Triage Suggestion</h3>
          {ticket.aiStatus === 'failed' ? (
            <p>AI analysis unavailable. Please review manually.</p>
          ) : null}

          <label>
            <span>Category</span>
            <select
              value={ticket.aiCategory || ticket.category || 'Other'}
              onChange={(event) => setTicket({ ...ticket, aiCategory: event.target.value })}
            >
              {categories.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Priority</span>
            <select
              value={ticket.aiPriority || ticket.priority || 'Medium'}
              onChange={(event) => setTicket({ ...ticket, aiPriority: event.target.value })}
            >
              {priorities.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Summary</span>
            <textarea
              rows="4"
              value={ticket.aiSummary || ''}
              onChange={(event) => setTicket({ ...ticket, aiSummary: event.target.value })}
            />
          </label>

          <button className="primary-button" onClick={updateAIDetails} disabled={isSavingAIDetails}>
            {isSavingAIDetails ? 'Saving...' : 'Save AI Review'}
          </button>
        </div>
      </div>

      <div className="two-column-layout">
        <div className="panel conversation-panel">
          <h3>Conversation</h3>
          <div className="chat-box">
            {messages.length === 0 ? <p className="muted-text">No messages yet.</p> : messages.map((item) => (
              <div key={item._id} className={`chat-message ${item.sender?._id === user._id ? 'mine' : 'theirs'}`}>
                <strong>{item.sender?.name || 'System'}:</strong>
                <span>{item.message}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="message-form">
            <textarea
              rows="3"
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder="Write a reply"
            />
            <button type="submit" className="primary-button">Send reply</button>
          </form>
        </div>

        <div className="panel">
          <h3>Ticket status</h3>
          <div className="status-actions">
            {statusOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateStatus(option)}
                className={ticket.status === option ? 'status-chip active' : 'status-chip'}
                disabled={isUpdatingStatus}
              >
                {option}
              </button>
            ))}
          </div>

          <h3>Resolution</h3>
          <textarea
            rows="4"
            value={resolutionNote}
            onChange={(event) => setResolutionNote(event.target.value)}
            placeholder="Resolution note"
          />
          <button className="warning-button" onClick={resolveTicket} disabled={isResolving}>
            {isResolving ? 'Resolving...' : 'Resolve Ticket'}
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}
    </div>
  );
}
