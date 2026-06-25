const AuditLog = require('../models/AuditLog');

const logAction = async (userId, action, module, description) => {
  try {
    if (userId) {
      await AuditLog.create({ user: userId, action, module, description });
    }
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};

module.exports = { logAction };
