const Medicine = require('../models/Medicine');
const { logAction } = require('../utils/logger');

const getMedicines = async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    let query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    if (lowStock === 'true') {
      const all = await Medicine.find(query).sort({ name: 1 });
      return res.json(all.filter(m => m.totalStock <= m.reorderLevel));
    }
    const medicines = await Medicine.find(query).sort({ name: 1 });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.create(req.body);
    
    if (req.io) req.io.emit('inventory_update', { medicine, action: 'create' });
    await logAction(req.user._id, 'Create', 'Medicine', `Added new medicine ${medicine.name}`);
    
    res.status(201).json(medicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    
    if (req.io) req.io.emit('inventory_update', { medicine, action: 'update' });
    await logAction(req.user._id, 'Update', 'Medicine', `Updated medicine ${medicine.name}`);
    
    res.json(medicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    
    if (req.io) req.io.emit('inventory_update', { medicine, action: 'delete' });
    await logAction(req.user._id, 'Delete', 'Medicine', `Deleted medicine ${medicine.name}`);
    
    res.json({ message: 'Medicine deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Medicine.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMedicines, getMedicine, createMedicine, updateMedicine, deleteMedicine, getCategories };
