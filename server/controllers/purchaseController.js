const Purchase = require('../models/Purchase');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const { logAction } = require('../utils/logger');

const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('medicine', 'name unit')
      .populate('supplier', 'name')
      .sort({ purchaseDate: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('medicine', 'name unit')
      .populate('supplier', 'name');
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPurchase = async (req, res) => {
  try {
    const { medicine, supplier, batchNumber, mfgDate, expiryDate, quantity, unitCost, sellingPrice, invoiceNumber, notes } = req.body;
    
    const purchase = await Purchase.create({
      medicine, supplier, batchNumber, mfgDate, expiryDate, quantity, unitCost, sellingPrice, invoiceNumber, notes, addedBy: req.user._id
    });

    let batch = await Batch.findOne({ batchNumber, medicine });
    if (batch) {
      batch.quantity += quantity;
      batch.purchasePrice = unitCost;
      batch.sellingPrice = sellingPrice;
      await batch.save();
    } else {
      batch = await Batch.create({
        batchNumber, medicine, mfgDate, expiryDate, purchasePrice: unitCost, sellingPrice, quantity
      });
    }

    const updatedMed = await Medicine.findByIdAndUpdate(medicine, {
      $inc: { totalStock: quantity },
    }, { new: true });

    if (req.io) {
      req.io.emit('inventory_update', { medicine: updatedMed, action: 'purchase' });
      req.io.emit('new_purchase', purchase);
    }

    await logAction(req.user._id, 'Purchase', 'Purchase', `Purchased ${quantity} of ${updatedMed.name} (Batch: ${batchNumber})`);

    const populated = await purchase.populate([
      { path: 'medicine', select: 'name unit' },
      { path: 'supplier', select: 'name' },
    ]);
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
    
    let batch = await Batch.findOne({ batchNumber: purchase.batchNumber, medicine: purchase.medicine });
    if (batch) {
      batch.quantity -= purchase.quantity;
      if (batch.quantity < 0) batch.quantity = 0;
      await batch.save();
    }

    const updatedMed = await Medicine.findByIdAndUpdate(purchase.medicine, {
      $inc: { totalStock: -purchase.quantity },
    }, { new: true });

    await purchase.deleteOne();

    if (req.io) {
      req.io.emit('inventory_update', { medicine: updatedMed, action: 'delete_purchase' });
    }

    await logAction(req.user._id, 'Delete', 'Purchase', `Deleted purchase ${purchase._id}`);

    res.json({ message: 'Purchase deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPurchases, getPurchase, createPurchase, deletePurchase };
