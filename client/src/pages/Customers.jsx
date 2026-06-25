import { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer } from '../services/api';
import Modal from '../components/Modal';

const EMPTY_FORM = { name: '', mobile: '', email: '', address: '' };

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search)
  );

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setModalOpen(true); };
  const openEdit = (c) => {
    setEditing(c._id);
    setForm({ name: c.name || '', mobile: c.mobile || '', email: c.email || '', address: c.address || '' });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      editing ? await updateCustomer(editing, form) : await createCustomer(form);
      setModalOpen(false);
      load();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const fc = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">👥 Customers</h2>
          <p className="page-subtitle">{customers.length} registered customers</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input className="form-control search-input" placeholder="Search by name or mobile..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="badge badge-muted">{filtered.length} results</span>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div>
        : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-text">No customers found</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Total Purchases</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c._id}>
                    <td className="td-primary">{c.name}</td>
                    <td>{c.mobile}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.address || '—'}</td>
                    <td className="td-primary" style={{ color: 'var(--accent-teal)' }}>${(c.totalPurchases || 0).toFixed(2)}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(c)} title="Edit">✏️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">⚠ {error}</div>}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input className="form-control" required value={form.name} onChange={fc('name')} placeholder="Jane Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile *</label>
                <input className="form-control" required value={form.mobile} onChange={fc('mobile')} placeholder="+1 234 567 890" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={fc('email')} placeholder="jane@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-control" value={form.address} onChange={fc('address')} placeholder="123 Main St..." />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving...' : editing ? '✅ Update' : '✅ Add Customer'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Customers;
