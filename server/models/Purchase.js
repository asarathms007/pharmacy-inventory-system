const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  batchNumber: { type: String, required: true },
  mfgDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  totalCost: { type: Number },
  invoiceNumber: { type: String },
  purchaseDate: { type: Date, default: Date.now },
  notes: { type: String },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

purchaseSchema.pre('save', function (next) {
  this.totalCost = this.quantity * this.unitCost;
  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);
