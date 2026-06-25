const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getSalesChart, getLowStockReport, getExpiryReport, getTopMedicines, getForecasting
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/dashboard', getDashboardStats);
router.get('/sales-chart', getSalesChart);
router.get('/low-stock', getLowStockReport);
router.get('/expiry', getExpiryReport);
router.get('/top-medicines', getTopMedicines);
router.get('/forecasting', getForecasting);

module.exports = router;
