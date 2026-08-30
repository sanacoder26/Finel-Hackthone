const express = require('express');
const Message = require('../models/Message');
const Ticket = require('../models/Ticket');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

function canAccessTicket(ticket, user) {
  if (user.role === 'agent') {
    return ticket.assignedAgent && ticket.assignedAgent.toString() === user._id.toString();
  }
  return ticket.customer && ticket.customer.toString() === user._id.toString();
}

// GET /api/tickets/:id/messages
router.get('/', auth, async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({ error: 'You do not have access to this ticket' });
    }

    const messages = await Message.find({ ticket: ticket._id })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role')
      .lean();

    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

// POST /api/tickets/:id/messages
router.post('/', auth, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({ error: 'You do not have access to this ticket' });
    }

    const msg = await Message.create({
      ticket: ticket._id,
      sender: req.user._id,
      message: message.trim(),
    });

    await msg.populate('sender', 'name role');

    req.io.to(`ticket:${ticket._id}`).emit('new_message', {
      ticketId: ticket._id.toString(),
      message: {
        _id: msg._id,
        ticket: msg.ticket,
        sender: msg.sender,
        message: msg.message,
        createdAt: msg.createdAt,
      },
    });

    res.status(201).json({ message: msg });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
