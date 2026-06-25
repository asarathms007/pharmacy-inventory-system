import { useState, useEffect } from 'react';
import { getDashboardStats, getSalesChart, getTopMedicines, getForecasting } from '../services/api';
import StatCard from '../components/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { useSocket } from '../context/SocketContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topMedicines, setTopMedicines] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const loadData = async () => {
    try {
      const [statsRes, chartRes, topRes, forecastRes] = await Promise.all([
        getDashboardStats(),
        getSalesChart(),
        getTopMedicines(),
        getForecasting()
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data.map(d => ({
        date: d._id,
        revenue: d.revenue,
      })));
      setTopMedicines(topRes.data);
      setForecast(forecastRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('new_sale', () => { loadData(); });
    socket.on('new_purchase', () => { loadData(); });
    socket.on('inventory_update', () => { loadData(); });

    return () => {
      socket.off('new_sale');
      socket.off('new_purchase');
      socket.off('inventory_update');
    };
  }, [socket]);

  const fmt = (n) => {
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${(n || 0).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span>Loading Real-time Dashboard...</span>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">📊 Analytics Dashboard</h2>
          <p className="page-subtitle">Real-time pharmacy metrics and forecasting</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="💰" label="Total Revenue" value={fmt(stats?.totalRevenue)} accent="teal" trend={`${stats?.totalSalesCount || 0} invoices`} />
        <StatCard icon="📈" label="Total Profit" value={fmt(stats?.totalProfit)} accent="purple" trend="Estimated" />
        <StatCard icon="🛒" label="Total Purchases" value={fmt(stats?.totalPurchasesAmount)} accent="blue" trend={`${stats?.totalPurchasesCount || 0} orders`} />
        <StatCard icon="💊" label="Total Medicines" value={stats?.totalMedicines || 0} accent="indigo" />
        <StatCard icon="🏭" label="Total Suppliers" value={stats?.totalSuppliers || 0} accent="slate" />
        <StatCard icon="⚠️" label="Low Stock Items" value={stats?.lowStockCount || 0} accent="orange" trend={stats?.lowStockCount > 0 ? 'Needs action' : 'Healthy'} />
        <StatCard icon="📅" label="Expiring Soon" value={stats?.expiringCount || 0} accent="rose" trend="Within 30 days" />
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card mb-20">
          <div className="card-header">
            <h2 className="card-title">
              <div className="card-title-icon">📈</div> Monthly Revenue Trend
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00d4aa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--text-secondary)' }}
                formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#00d4aa" fill="url(#salesGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card mb-20">
          <div className="card-header">
            <h2 className="card-title">
              <div className="card-title-icon">🔥</div> Top Selling Medicines
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topMedicines} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                formatter={(v) => [v, 'Qty Sold']}
              />
              <Bar dataKey="totalQty" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title"><div className="card-title-icon">🔮</div> Inventory Forecasting & Out of Stock Predictions</h2>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Current Stock</th>
                <th>Avg. Daily Sales</th>
                <th>Days Until OOS</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((f) => (
                <tr key={f._id}>
                  <td className="td-primary">{f.name}</td>
                  <td>{f.totalStock}</td>
                  <td>{f.avgDailySales} / day</td>
                  <td className="td-primary">{f.daysUntilOOS === 999 ? '99+' : f.daysUntilOOS} Days</td>
                  <td>
                    <span className={`badge ${f.status === 'Critical' ? 'badge-rose' : f.status === 'Warning' ? 'badge-orange' : 'badge-teal'}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              {forecast.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No sales data to forecast yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
