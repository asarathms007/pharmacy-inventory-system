const Medicine = require('../models/Medicine');
const Invoice = require('../models/Invoice');
const Purchase = require('../models/Purchase');
const Batch = require('../models/Batch');
const Supplier = require('../models/Supplier');

const getDashboardStats = async (req, res) => {
  try {
    const totalMedicines = await Medicine.countDocuments();
    const totalSuppliers = await Supplier.countDocuments();
    const allMedicines = await Medicine.find();
    const lowStockCount = allMedicines.filter(m => m.totalStock <= m.reorderLevel).length;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringCount = await Batch.countDocuments({ expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() }, quantity: { $gt: 0 } });

    const invoicesAgg = await Invoice.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);
    const purchasesAgg = await Purchase.aggregate([
      { $group: { _id: null, totalCost: { $sum: '$totalCost' }, count: { $sum: 1 } } }
    ]);

    // Simple profit estimation: Revenue - Cost (In a real system, profit per line item is more accurate)
    const totalRevenue = invoicesAgg[0]?.totalRevenue || 0;
    const totalCost = purchasesAgg[0]?.totalCost || 0;

    res.json({
      totalMedicines,
      totalSuppliers,
      lowStockCount,
      expiringCount,
      totalRevenue,
      totalProfit: totalRevenue - totalCost,
      totalSalesCount: invoicesAgg[0]?.count || 0,
      totalPurchasesAmount: totalCost,
      totalPurchasesCount: purchasesAgg[0]?.count || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSalesChart = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const data = await Invoice.aggregate([
      { $match: { saleDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$saleDate' } },
          revenue: { $sum: '$grandTotal' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTopMedicines = async (req, res) => {
  try {
    const data = await Invoice.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicine',
          totalQty: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'medicines',
          localField: '_id',
          foreignField: '_id',
          as: 'medicine',
        },
      },
      { $unwind: '$medicine' },
      {
        $project: {
          name: '$medicine.name',
          category: '$medicine.category',
          totalQty: 1,
          totalRevenue: 1,
        },
      },
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLowStockReport = async (req, res) => {
  try {
    const medicines = await Medicine.find({ $expr: { $lte: ['$totalStock', '$reorderLevel'] } });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExpiryReport = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const batches = await Batch.find({
      expiryDate: { $lte: futureDate },
      quantity: { $gt: 0 }
    }).populate('medicine', 'name category').sort({ expiryDate: 1 });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getForecasting = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const salesAgg = await Invoice.aggregate([
      { $match: { saleDate: { $gte: thirtyDaysAgo } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicine',
          totalSold30Days: { $sum: '$items.quantity' }
        }
      }
    ]);

    const salesMap = {};
    salesAgg.forEach(s => { salesMap[s._id.toString()] = s.totalSold30Days; });

    const medicines = await Medicine.find();
    const forecast = medicines.map(med => {
      const sold30 = salesMap[med._id.toString()] || 0;
      const avgDailySales = sold30 / 30;
      const daysUntilOOS = avgDailySales > 0 ? Math.floor(med.totalStock / avgDailySales) : 999;
      return {
        _id: med._id,
        name: med.name,
        totalStock: med.totalStock,
        avgDailySales: avgDailySales.toFixed(2),
        daysUntilOOS,
        status: daysUntilOOS <= 7 ? 'Critical' : daysUntilOOS <= 30 ? 'Warning' : 'Good'
      };
    }).sort((a, b) => a.daysUntilOOS - b.daysUntilOOS).slice(0, 50);

    res.json(forecast);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getSalesChart, getTopMedicines, getLowStockReport, getExpiryReport, getForecasting };
