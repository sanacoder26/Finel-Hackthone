import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { messageService } from '../../services/messageService';
import { ticketService } from '../../services/ticketService';
import socket from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';

export default function CustomerTicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socketRef = useRef(false);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const ticketResponse = await ticketService.getTicketById(id);
      const messagesResponse = await messageService.getMessages(id);
      setTicket(ticketResponse.data.ticket);
      setMessages(messagesResponse.data.messages || []);
      setError('');
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

    if (!socketRef.current) {
      socket.on('new_message', onNewMessage);
      socket.on('ticket_status_updated', onStatusUpdate);
      socketRef.current = true;
    }

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('ticket_status_updated', onStatusUpdate);
    };
  }, [id, user]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await messageService.sendMessage(id, { message: newMessage });
      setMessages((current) => [...current, response.data.message]);
      setNewMessage('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send message');
    }
  };

  if (loading) return <div className="page-shell"><div className="panel loading-box">Loading ticket...</div></div>;
  if (!ticket) return <div className="page-shell"><div className="panel error-box">{error || 'Ticket not found'}</div></div>;

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
          <h3>Ticket details</h3>
          <div className="detail-grid">
            <div><strong>Category:</strong> {ticket.aiCategory || ticket.category}</div>
            <div><strong>Priority:</strong> {ticket.aiPriority || ticket.priority}</div>
            <div><strong>Customer:</strong> {ticket.customer?.name}</div>
            <div><strong>Assigned to:</strong> {ticket.assignedAgent ? ticket.assignedAgent.name : 'Unassigned'}</div>
          </div>
          <p className="muted-text">{ticket.description}</p>
        </div>

        <div className="panel ai-card">
          <h3>AI triage</h3>
          <p><strong>Category:</strong> {ticket.aiCategory || ticket.category}</p>
          <p><strong>Priority:</strong> {ticket.aiPriority || ticket.priority}</p>
          <p><strong>Summary:</strong> {ticket.aiSummary || 'AI summary not available yet.'}</p>
        </div>
      </div>

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
            placeholder="Reply to support"
          />
          <button type="submit" className="primary-button">Send</button>
        </form>

        {error && <div className="error-box">{error}</div>}
      </div>
    </div>
  );
}
