const express = require('express');
const { getInvoices, createInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getInvoices);
router.post('/', protect, createInvoice);

module.exports = router;
