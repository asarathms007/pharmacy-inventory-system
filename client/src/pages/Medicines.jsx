import { useState, useEffect } from 'react';
import { getMedicines, createMedicine, updateMedicine, deleteMedicine, getCategories } from '../services/api';
import Modal from '../components/Modal';

const EMPTY_FORM = {
  name: '', genericName: '', category: '', manufacturer: '',
  price: '', reorderLevel: '10', description: '', unit: 'pcs',
};

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [medRes, catRes] = await Promise.all([getMedicines(), getCategories()]);
      setMedicines(medRes.data);
      setCategories(catRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = medicines.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.genericName || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || m.category === filterCat;
    return matchSearch && matchCat;
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setModalOpen(true); };
  const openEdit = (m) => {
    setEditing(m._id);
    setForm({
      name: m.name || '', genericName: m.genericName || '', category: m.category || '',
      manufacturer: m.manufacturer || '', price: m.price || '',
      reorderLevel: m.reorderLevel || 10, description: m.description || '',
      unit: m.unit || 'pcs',
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateMedicine(editing, form);
      } else {
        await createMedicine(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine? This cannot be undone.')) return;
    try {
      await deleteMedicine(id);
      load();
    } catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
  };

  const stockBadge = (m) => {
    if (m.totalStock <= 0) return <span className="badge badge-rose">Out of Stock</span>;
    if (m.totalStock <= m.reorderLevel) return <span className="badge badge-orange">Low Stock</span>;
    return <span className="badge badge-teal">In Stock</span>;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">💊 Medicines</h2>
          <p className="page-subtitle">{medicines.length} medicines in inventory</p>
        </div>
        <button className="btn btn-primary" id="add-medicine-btn" onClick={openAdd}>+ Add Medicine</button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="form-control search-input"
            placeholder="Search medicines..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="medicine-search"
          />
        </div>
        <select className="form-control" style={{ maxWidth: 200 }} value={filterCat} onChange={e => setFilterCat(e.target.value)} id="category-filter">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="badge badge-muted">{filtered.length} results</span>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💊</div>
          <div className="empty-text">No medicines found</div>
          <div className="empty-sub">Add your first medicine to get started</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Total Stock</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m._id}>
                  <td>
                    <div className="td-primary">{m.name}</div>
                    {m.genericName && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{m.genericName}</div>}
                  </td>
                  <td><span className="badge badge-purple">{m.category}</span></td>
                  <td>
                    <span className="fw-600" style={{ color: m.totalStock <= m.reorderLevel ? 'var(--accent-orange)' : 'var(--text-primary)' }}>
                      {m.totalStock || 0}
                    </span>
                    <span className="text-muted" style={{ fontSize: 12 }}> {m.unit}</span>
                  </td>
                  <td className="text-teal fw-600">₹{(m.price || 0).toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {stockBadge(m)}
                    </div>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(m)} title="Edit" id={`edit-med-${m._id}`}>✏️</button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(m._id)} title="Delete" id={`del-med-${m._id}`}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Medicine' : 'Add Medicine'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">⚠ {error}</div>}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Medicine Name *</label>
                <input className="form-control" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Paracetamol 500mg" />
              </div>
              <div className="form-group">
                <label className="form-label">Generic Name</label>
                <input className="form-control" value={form.genericName} onChange={e => setForm({...form, genericName: e.target.value})} placeholder="Acetaminophen" />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <input className="form-control" required value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Analgesic" list="cat-list" />
                <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="form-group">
                <label className="form-label">Manufacturer</label>
                <input className="form-control" value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} placeholder="Sun Pharma" />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price (₹) *</label>
                <input className="form-control" type="number" required min="0" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="10.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Reorder Level</label>
                <input className="form-control" type="number" min="0" value={form.reorderLevel} onChange={e => setForm({...form, reorderLevel: e.target.value})} placeholder="10" />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-control" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                  <option>pcs</option><option>strips</option><option>bottle</option><option>box</option><option>vial</option><option>ml</option><option>mg</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Optional notes..." style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving...' : editing ? '✅ Update' : '✅ Add Medicine'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Medicines;
