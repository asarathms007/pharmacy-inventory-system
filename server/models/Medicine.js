const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: { type: String },
  category: { type: String, required: true },
  manufacturer: { type: String },
  price: { type: Number, required: true, min: 0 },
  totalStock: { type: Number, required: true, default: 0 },
  reorderLevel: { type: Number, default: 10 },
  description: { type: String },
  unit: { type: String, default: 'pcs' },
}, { timestamps: true });

medicineSchema.virtual('isLowStock').get(function () {
  return this.totalStock <= this.reorderLevel;
});

module.exports = mongoose.model('Medicine', medicineSchema);
