const express = require('express');
const router = express.Router();
const {
  getMedicines, getMedicine, createMedicine, updateMedicine, deleteMedicine, getCategories
} = require('../controllers/medicineController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/categories', getCategories);
router.route('/').get(getMedicines).post(createMedicine);
router.route('/:id').get(getMedicine).put(updateMedicine).delete(deleteMedicine);

module.exports = router;
