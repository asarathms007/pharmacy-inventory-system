const Invoice = require('../models/Invoice');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Customer = require('../models/Customer');
const { logAction } = require('../utils/logger');

const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('customer', 'name mobile')
      .populate('items.medicine', 'name unit')
      .populate('items.batch', 'batchNumber')
      .sort({ saleDate: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { customerId, customerName, customerPhone, items, discount } = req.body;
    
    let subTotal = 0;
    const finalInvoiceItems = [];

    for (const item of items) {
      const med = await Medicine.findById(item.medicine);
      if (!med) throw new Error(`Medicine not found`);
      
      let requiredQty = item.quantity;
      
      const batches = await Batch.find({ medicine: item.medicine, quantity: { $gt: 0 } }).sort('expiryDate');
      
      let stockAvailable = batches.reduce((acc, b) => acc + b.quantity, 0);
      if (stockAvailable < requiredQty) {
        throw new Error(`Insufficient stock for ${med.name}. Available: ${stockAvailable}`);
      }

      for (const batch of batches) {
        if (requiredQty <= 0) break;

        let deductQty = 0;
        if (batch.quantity >= requiredQty) {
          deductQty = requiredQty;
          batch.quantity -= requiredQty;
          requiredQty = 0;
        } else {
          deductQty = batch.quantity;
          requiredQty -= batch.quantity;
          batch.quantity = 0;
        }

        await batch.save();
        
        const lineTotal = deductQty * batch.sellingPrice;
        subTotal += lineTotal;
        
        finalInvoiceItems.push({
          medicine: med._id,
          batch: batch._id,
          quantity: deductQty,
          unitPrice: batch.sellingPrice,
          total: lineTotal
        });
      }
      
      const updatedMed = await Medicine.findByIdAndUpdate(item.medicine, {
        $inc: { totalStock: -item.quantity }
      }, { new: true });

      if (req.io) {
        req.io.emit('inventory_update', { medicine: updatedMed, action: 'sale' });
        if (updatedMed.totalStock <= updatedMed.reorderLevel) {
          req.io.emit('low_stock_alert', updatedMed);
        }
      }
    }

    const gst = subTotal * 0.12; 
    const finalDiscount = discount || 0;
    const grandTotal = subTotal + gst - finalDiscount;
    
    const invoiceNumber = 'INV-' + Date.now();

    const invoice = await Invoice.create({
      invoiceNumber,
      customer: customerId || null,
      customerName,
      customerPhone,
      items: finalInvoiceItems,
      subTotal,
      gst,
      discount: finalDiscount,
      grandTotal,
      soldBy: req.user._id
    });

    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalPurchases: grandTotal }
      });
    }

    if (req.io) {
      req.io.emit('new_sale', invoice);
    }

    await logAction(req.user._id, 'Sale', 'Invoice', `Generated invoice ${invoiceNumber} for $${grandTotal}`);

    const populated = await Invoice.findById(invoice._id)
      .populate('customer', 'name mobile')
      .populate('items.medicine', 'name unit')
      .populate('items.batch', 'batchNumber');

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getInvoices, createInvoice };
