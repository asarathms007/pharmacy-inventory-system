import { useState, useEffect } from 'react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/api';
import Modal from '../components/Modal';

const EMPTY_FORM = { name: '', contactPerson: '', email: '', phone: '', address: '', city: '', notes: '' };

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await getSuppliers();
      setSuppliers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contactPerson || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setModalOpen(true); };
  const openEdit = (s) => {
    setEditing(s._id);
    setForm({ name: s.name || '', contactPerson: s.contactPerson || '', email: s.email || '', phone: s.phone || '', address: s.address || '', city: s.city || '', notes: s.notes || '' });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      editing ? await updateSupplier(editing, form) : await createSupplier(form);
      setModalOpen(false);
      load();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try { await deleteSupplier(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
  };

  const fc = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">🏭 Suppliers</h2>
          <p className="page-subtitle">{suppliers.length} registered suppliers</p>
        </div>
        <button className="btn btn-primary" id="add-supplier-btn" onClick={openAdd}>+ Add Supplier</button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input className="form-control search-input" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} id="supplier-search" />
        </div>
        <span className="badge badge-muted">{filtered.length} results</span>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div>
        : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏭</div>
            <div className="empty-text">No suppliers found</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id}>
                    <td className="td-primary">{s.name}</td>
                    <td>{s.contactPerson || '—'}</td>
                    <td>{s.phone}</td>
                    <td>{s.email || '—'}</td>
                    <td>{s.city || '—'}</td>
                    <td>
                      <span className={`badge ${s.isActive ? 'badge-teal' : 'badge-muted'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(s)} title="Edit" id={`edit-sup-${s._id}`}>✏️</button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(s._id)} title="Delete" id={`del-sup-${s._id}`}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">⚠ {error}</div>}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Supplier Name *</label>
                <input className="form-control" required value={form.name} onChange={fc('name')} placeholder="MedSupply Co." />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input className="form-control" value={form.contactPerson} onChange={fc('contactPerson')} placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-control" required value={form.phone} onChange={fc('phone')} placeholder="+91 98765 43210" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={fc('email')} placeholder="contact@supplier.com" />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-control" value={form.city} onChange={fc('city')} placeholder="Mumbai" />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-control" value={form.address} onChange={fc('address')} placeholder="123 Market St..." />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={2} value={form.notes} onChange={fc('notes')} placeholder="Additional notes..." style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving...' : editing ? '✅ Update' : '✅ Add Supplier'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Suppliers;
