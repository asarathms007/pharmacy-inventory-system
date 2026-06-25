const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number },
  customerName: { type: String, default: 'Walk-in Customer' },
  customerPhone: { type: String },
  saleDate: { type: Date, default: Date.now },
  prescriptionRequired: { type: Boolean, default: false },
  notes: { type: String },
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

saleSchema.pre('save', function (next) {
  this.totalAmount = this.quantity * this.unitPrice;
  next();
});

module.exports = mongoose.model('Sale', saleSchema);
