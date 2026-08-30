const express = require('express');
const Ticket = require('../models/Ticket');
const { auth, requireRole } = require('../middleware/authMiddleware');
const { triageTicket } = require('../services/aiService');

const router = express.Router();

// Generate the next sequential ticket number like TKT-1001
async function nextTicketNumber() {
  const last = await Ticket.findOne().sort({ createdAt: -1 }).collation({ locale: 'en' });
  let next = 1001;
  if (last && last.ticketNumber) {
    const m = last.ticketNumber.match(/TKT-(\d+)/);
    if (m) next = parseInt(m[1], 10) + 1;
  }
  return `TKT-${next}`;
}

function canAccessTicket(ticket, user) {
  if (user.role === 'agent') {
    return ticket.assignedAgent && ticket.assignedAgent.toString() === user._id.toString();
  }
  return ticket.customer && ticket.customer.toString() === user._id.toString();
}

// POST /api/tickets  (customer only) - creates ticket then runs AI triage
router.post('/', auth, requireRole('customer'), async (req, res, next) => {
  try {
    const { subject, description, category, priority } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ error: 'subject and description are required' });
    }

    const ticketNumber = await nextTicketNumber();
    const ticket = await Ticket.create({
      ticketNumber,
      customer: req.user._id,
      subject,
      description,
      category: category || 'Other',
      priority: priority || 'Low',
      status: 'New',
      aiStatus: 'pending',
      aiReviewed: false,
    });

    // Run AI triage after saving. On any failure, ticket still exists with aiStatus=failed.
    try {
      const ai = await triageTicket({ subject, description });
      ticket.aiCategory = ai.category;
      ticket.aiPriority = ai.priority;
      ticket.aiSummary = ai.summary;
      ticket.aiStatus = 'success';
      await ticket.save();
    } catch (e) {
      ticket.aiStatus = 'failed';
      await ticket.save();
    }

    res.status(201).json({ ticket });
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/my  (customer only) - list own tickets
router.get('/my', auth, requireRole('customer'), async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('assignedAgent', 'name email')
      .lean();
    res.json({ tickets });
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/agent  (agent only) - list tickets assigned to the agent
router.get('/agent', auth, requireRole('agent'), async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ assignedAgent: req.user._id })
      .sort({ createdAt: -1 })
      .populate('customer', 'name email')
      .lean();
    res.json({ tickets });
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/:id  - owner customer or assigned agent
router.get('/:id', auth, async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('assignedAgent', 'name email');
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({ error: 'You do not have access to this ticket' });
    }

    res.json({ ticket });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tickets/:id/claim  (agent only) - claim an unassigned ticket
router.patch('/:id/claim', auth, requireRole('agent'), async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (ticket.assignedAgent) {
      return res.status(400).json({ error: 'Ticket already assigned' });
    }

    ticket.assignedAgent = req.user._id;
    ticket.status = 'Assigned';
    await ticket.save();

    const updated = await Ticket.findById(ticket._id)
      .populate('customer', 'name email')
      .populate('assignedAgent', 'name email');

    req.io.to(`ticket:${ticket._id}`).emit('ticket_status_updated', {
      ticketId: ticket._id.toString(),
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
    });

    res.json({ ticket: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tickets/:id/triage  (assigned agent only) - review/edit AI suggestions
router.patch('/:id/triage', auth, requireRole('agent'), async (req, res, next) => {
  try {
    const { category, priority, summary } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (!ticket.assignedAgent || ticket.assignedAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the assigned agent can update this ticket' });
    }

    if (category !== undefined) {
      ticket.category = category;
      ticket.aiCategory = category;
    }
    if (priority !== undefined) {
      ticket.priority = priority;
      ticket.aiPriority = priority;
    }
    if (summary !== undefined) {
      ticket.aiSummary = summary;
    }
    ticket.aiReviewed = true;
    await ticket.save();

    res.json({ ticket });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tickets/:id/status  (assigned agent only)
router.patch('/:id/status', auth, requireRole('agent'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['New', 'Assigned', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (!ticket.assignedAgent || ticket.assignedAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the assigned agent can update this ticket' });
    }

    if (status === 'Resolved' && (!ticket.resolutionNote || !ticket.resolutionNote.trim())) {
      return res.status(400).json({ error: 'resolutionNote is required to resolve a ticket' });
    }

    const previousStatus = ticket.status;
    ticket.status = status;
    await ticket.save();

    if (previousStatus !== status) {
      req.io.to(`ticket:${ticket._id}`).emit('ticket_status_updated', {
        ticketId: ticket._id.toString(),
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
      });
    }

    res.json({ ticket });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tickets/:id/resolve  (assigned agent only) - sets status=Resolved + note
router.patch('/:id/resolve', auth, requireRole('agent'), async (req, res, next) => {
  try {
    const { resolutionNote } = req.body;
    if (!resolutionNote || !resolutionNote.trim()) {
      return res.status(400).json({ error: 'resolutionNote is required and cannot be empty' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (!ticket.assignedAgent || ticket.assignedAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the assigned agent can resolve this ticket' });
    }

    ticket.resolutionNote = resolutionNote.trim();
    ticket.status = 'Resolved';
    await ticket.save();

    req.io.to(`ticket:${ticket._id}`).emit('ticket_status_updated', {
      ticketId: ticket._id.toString(),
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
    });

    res.json({ ticket });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
