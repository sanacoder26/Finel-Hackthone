const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Billing', 'Technical', 'Account', 'Order', 'Refund', 'Other'],
      default: 'Other',
    },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    status: {
      type: String,
      enum: ['New', 'Assigned', 'In Progress', 'Resolved'],
      default: 'New',
      index: true,
    },
    aiCategory: { type: String, enum: ['Billing', 'Technical', 'Account', 'Order', 'Refund', 'Other', null], default: null },
    aiPriority: { type: String, enum: ['Low', 'Medium', 'High', null], default: null },
    aiSummary: { type: String, default: null },
    aiStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    aiReviewed: { type: Boolean, default: false },
    resolutionNote: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
