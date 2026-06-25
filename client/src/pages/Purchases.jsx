import { useState, useEffect } from 'react';
import { getPurchases, createPurchase, deletePurchase, getMedicines, getSuppliers } from '../services/api';
import Modal from '../components/Modal';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ 
    medicine: '', supplier: '', quantity: '', unitCost: '', 
    sellingPrice: '', batchNumber: '', expiryDate: '', 
    invoiceNumber: '', purchaseDate: '', notes: '' 
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [pRes, mRes, sRes] = await Promise.all([getPurchases(), getMedicines(), getSuppliers()]);
      setPurchases(pRes.data);
      setMedicines(mRes.data);
      setSuppliers(sRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const fc = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const totalCost = form.quantity && form.unitCost
    ? (parseFloat(form.quantity) * parseFloat(form.unitCost)).toFixed(2)
    : '—';

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createPurchase(form);
      setModalOpen(false);
      setForm({ 
        medicine: '', supplier: '', quantity: '', unitCost: '', 
        sellingPrice: '', batchNumber: '', expiryDate: '', 
        invoiceNumber: '', purchaseDate: '', notes: '' 
      });
      load();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase? Note: This action might not revert batches perfectly in complex scenarios.')) return;
    try { await deletePurchase(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">🛒 Purchases</h2>
          <p className="page-subtitle">{purchases.length} purchase records</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setError(''); setModalOpen(true); }}>+ Record Purchase</button>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div>
        : purchases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <div className="empty-text">No purchases recorded yet</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Supplier</th>
                  <th>Batch</th>
                  <th>Qty</th>
                  <th>Cost</th>
                  <th>Total</th>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p._id}>
                    <td className="td-primary">{p.medicine?.name || '—'}</td>
                    <td>{p.supplier?.name || '—'}</td>
                    <td><span className="badge badge-indigo">{p.batchNumber}</span></td>
                    <td>{p.quantity} <span className="text-muted" style={{ fontSize: 12 }}>{p.medicine?.unit}</span></td>
                    <td>₹{(p.unitCost || 0).toFixed(2)}</td>
                    <td className="text-teal fw-600">₹{(p.totalCost || 0).toFixed(2)}</td>
                    <td>{p.invoiceNumber || '—'}</td>
                    <td>{new Date(p.purchaseDate).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(p._id)} title="Delete">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Purchase & Stock Batch" size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">⚠ {error}</div>}
            
            <h4 style={{ marginBottom: 15, color: 'var(--accent-teal)' }}>Purchase Details</h4>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Medicine *</label>
                <select className="form-control" required value={form.medicine} onChange={fc('medicine')}>
                  <option value="">Select medicine...</option>
                  {medicines.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Supplier *</label>
                <select className="form-control" required value={form.supplier} onChange={fc('supplier')}>
                  <option value="">Select supplier...</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input className="form-control" type="number" required min="1" value={form.quantity} onChange={fc('quantity')} placeholder="100" />
              </div>
              <div className="form-group">
                <label className="form-label">Unit Cost (₹) *</label>
                <input className="form-control" type="number" required min="0" step="0.01" value={form.unitCost} onChange={fc('unitCost')} placeholder="7.50" />
              </div>
              <div className="form-group">
                <label className="form-label">Invoice Number</label>
                <input className="form-control" value={form.invoiceNumber} onChange={fc('invoiceNumber')} placeholder="INV-2024-001" />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Date</label>
                <input className="form-control" type="date" value={form.purchaseDate} onChange={fc('purchaseDate')} />
              </div>
            </div>

            <hr style={{ margin: '20px 0', borderTop: '1px solid var(--border)' }} />
            <h4 style={{ marginBottom: 15, color: 'var(--accent-purple)' }}>Batch Details (Inventory)</h4>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Batch Number *</label>
                <input className="form-control" required value={form.batchNumber} onChange={fc('batchNumber')} placeholder="BT-1002" />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date *</label>
                <input className="form-control" type="date" required value={form.expiryDate} onChange={fc('expiryDate')} />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price (₹) *</label>
                <input className="form-control" type="number" required min="0" step="0.01" value={form.sellingPrice} onChange={fc('sellingPrice')} placeholder="10.00" />
              </div>
            </div>

            <div className="card mt-20" style={{ background: 'var(--accent-teal-dim)', border: '1px solid var(--accent-teal-glow)', marginTop: 20, padding: 15 }}>
              <div className="flex-between">
                <span className="form-label" style={{ margin: 0 }}>Calculated Total Cost</span>
                <span className="fw-700 text-teal" style={{ fontSize: 20 }}>₹{totalCost}</span>
              </div>
            </div>
            
            <div className="form-group mt-20" style={{ marginTop: 20 }}>
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={2} value={form.notes} onChange={fc('notes')} placeholder="Any notes..." style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving...' : '✅ Record Purchase & Create Batch'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Purchases;
