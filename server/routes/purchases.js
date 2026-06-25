const express = require('express');
const router = express.Router();
const {
  getPurchases, getPurchase, createPurchase, deletePurchase
} = require('../controllers/purchaseController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getPurchases).post(createPurchase);
router.route('/:id').get(getPurchase).delete(deletePurchase);

module.exports = router;
