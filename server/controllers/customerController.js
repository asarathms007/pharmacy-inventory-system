const Customer = require('../models/Customer');
const { logAction } = require('../utils/logger');

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort('-createdAt');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, mobile, email, address } = req.body;
    
    const existing = await Customer.findOne({ mobile });
    if (existing) return res.status(400).json({ message: 'Customer with this mobile already exists' });
    
    const customer = await Customer.create({ name, mobile, email, address });
    
    await logAction(req.user._id, 'Create', 'Customer', `Created customer ${name}`);
    
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    
    await logAction(req.user._id, 'Update', 'Customer', `Updated customer ${customer.name}`);
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
