const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');

const getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('medicine', 'name unit')
      .sort({ saleDate: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('medicine', 'name unit');
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSale = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.body.medicine);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    if (medicine.stock < req.body.quantity) {
      return res.status(400).json({ message: `Insufficient stock. Available: ${medicine.stock}` });
    }
    const sale = await Sale.create({ ...req.body, soldBy: req.user._id });
    // Deduct stock
    await Medicine.findByIdAndUpdate(req.body.medicine, {
      $inc: { stock: -req.body.quantity },
    });
    const populated = await sale.populate('medicine', 'name unit');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    // Revert stock
    await Medicine.findByIdAndUpdate(sale.medicine, {
      $inc: { stock: sale.quantity },
    });
    await sale.deleteOne();
    res.json({ message: 'Sale deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSales, getSale, createSale, deleteSale };
