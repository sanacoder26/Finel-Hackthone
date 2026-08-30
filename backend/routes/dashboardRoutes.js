const express = require('express');
const Ticket = require('../models/Ticket');
const { auth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/dashboard/agent  (agent only) - real MongoDB statistics for assigned tickets
router.get('/agent', auth, requireRole('agent'), async (req, res, next) => {
  try {
    const agentId = req.user._id;

    const [
      totalTickets,
      newTickets,
      assignedTickets,
      inProgressTickets,
      resolvedTickets,
      highPriorityTickets,
    ] = await Promise.all([
      Ticket.countDocuments({ assignedAgent: agentId }),
      Ticket.countDocuments({ assignedAgent: agentId, status: 'New' }),
      Ticket.countDocuments({ assignedAgent: agentId, status: 'Assigned' }),
      Ticket.countDocuments({ assignedAgent: agentId, status: 'In Progress' }),
      Ticket.countDocuments({ assignedAgent: agentId, status: 'Resolved' }),
      Ticket.countDocuments({ assignedAgent: agentId, priority: 'High' }),
    ]);

    res.json({
      totalTickets,
      newTickets,
      assignedTickets,
      inProgressTickets,
      resolvedTickets,
      highPriorityTickets,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
