const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, enum: ['Create', 'Update', 'Delete', 'Login', 'Logout', 'Sale', 'Purchase'] },
  module: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
