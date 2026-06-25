const express = require('express');
const router = express.Router();
const {
  getSales, getSale, createSale, deleteSale
} = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getSales).post(createSale);
router.route('/:id').get(getSale).delete(deleteSale);

module.exports = router;
