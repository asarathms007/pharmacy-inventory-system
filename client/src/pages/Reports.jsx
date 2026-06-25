import { useState, useEffect } from 'react';
import {
  getLowStockReport, getExpiryReport, getTopMedicines, getSalesChart
} from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#00d4aa', '#7c3aed', '#f97316', '#f43f5e', '#3b82f6', '#84cc16', '#ec4899', '#14b8a6', '#8b5cf6', '#fb923c'];

const Reports = () => {
  const [tab, setTab] = useState('lowStock');
  const [lowStock, setLowStock] = useState([]);
  const [expiry, setExpiry] = useState([]);
  const [topMeds, setTopMeds] = useState([]);
  const [salesChart, setSalesChart] = useState([]);
  const [expiryDays, setExpiryDays] = useState(90);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [lRes, eRes, tRes, sRes] = await Promise.all([
          getLowStockReport(),
          getExpiryReport(expiryDays),
          getTopMedicines(),
          getSalesChart(),
        ]);
        setLowStock(lRes.data);
        setExpiry(eRes.data);
        setTopMeds(tRes.data);
        setSalesChart(sRes.data.map(d => ({ date: d._id.slice(5), sales: d.total, count: d.count })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [expiryDays]);

  const tabs = [
    { id: 'lowStock', label: '⚠️ Low Stock', count: lowStock.length },
    { id: 'expiry', label: '📅 Expiry', count: expiry.length },
    { id: 'topMeds', label: '🏆 Top Medicines', count: topMeds.length },
    { id: 'salesTrend', label: '📈 Sales Trend', count: salesChart.length },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">📊 Reports</h2>
          <p className="page-subtitle">Analytics, alerts, and insights</p>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
            id={`tab-${t.id}`}
          >
            {t.label}
            {t.count > 0 && <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.1)', padding: '1px 7px', borderRadius: 99, fontSize: 11 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
        <>
          {/* Low Stock */}
          {tab === 'lowStock' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><div className="card-title-icon">⚠️</div>Low Stock Medicines ({lowStock.length})</h3>
              </div>
              {lowStock.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <div className="empty-text">All stocks are healthy!</div>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Medicine</th><th>Category</th><th>Current Stock</th><th>Reorder Level</th><th>Deficit</th></tr>
                    </thead>
                    <tbody>
                      {lowStock.map(m => (
                        <tr key={m._id}>
                          <td className="td-primary">{m.name}</td>
                          <td><span className="badge badge-purple">{m.category}</span></td>
                          <td>
                            <span style={{ color: m.stock === 0 ? 'var(--accent-rose)' : 'var(--accent-orange)', fontWeight: 700 }}>
                              {m.stock} {m.unit}
                            </span>
                          </td>
                          <td>{m.reorderLevel} {m.unit}</td>
                          <td>
                            <span className="badge badge-rose">-{m.reorderLevel - m.stock} {m.unit}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Expiry Report */}
          {tab === 'expiry' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><div className="card-title-icon">📅</div>Expiry Report ({expiry.length})</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label className="form-label" style={{ margin: 0 }}>Within</label>
                  <select className="form-control" style={{ width: 110 }} value={expiryDays} onChange={e => setExpiryDays(e.target.value)} id="expiry-days-filter">
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                  </select>
                </div>
              </div>
              {expiry.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <div className="empty-text">No medicines expiring within {expiryDays} days</div>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Expiry Date</th><th>Days Left</th></tr>
                    </thead>
                    <tbody>
                      {expiry.map(m => {
                        const daysLeft = Math.ceil((new Date(m.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                        return (
                          <tr key={m._id}>
                            <td className="td-primary">{m.name}</td>
                            <td><span className="badge badge-purple">{m.category}</span></td>
                            <td>{m.stock} {m.unit}</td>
                            <td>{new Date(m.expiryDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${daysLeft <= 0 ? 'badge-rose' : daysLeft <= 30 ? 'badge-orange' : 'badge-teal'}`}>
                                {daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Top Medicines */}
          {tab === 'topMeds' && (
            <div className="dashboard-grid">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><div className="card-title-icon">🏆</div>Top Selling Medicines</h3>
                </div>
                {topMeds.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-text">No sales data yet</div></div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr><th>#</th><th>Medicine</th><th>Category</th><th>Units Sold</th><th>Revenue</th></tr>
                      </thead>
                      <tbody>
                        {topMeds.map((m, i) => (
                          <tr key={m._id}>
                            <td><span className="badge badge-teal">#{i + 1}</span></td>
                            <td className="td-primary">{m.name}</td>
                            <td><span className="badge badge-purple">{m.category}</span></td>
                            <td className="fw-600">{m.totalQty}</td>
                            <td className="text-teal fw-600">₹{m.totalRevenue?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><div className="card-title-icon">🥧</div>Sales Distribution</h3>
                </div>
                {topMeds.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-text">No data yet</div></div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={topMeds.slice(0, 6)} dataKey="totalQty" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name.slice(0, 10)} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {topMeds.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v) => [v, 'Units']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* Sales Trend */}
          {tab === 'salesTrend' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><div className="card-title-icon">📈</div>Sales Revenue — Last 7 Days</h3>
              </div>
              {salesChart.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📈</div><div className="empty-text">No sales data yet</div></div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={salesChart} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}
                      formatter={(v) => [`₹${v}`, 'Revenue']}
                    />
                    <Bar dataKey="sales" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d4aa" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Reports;
