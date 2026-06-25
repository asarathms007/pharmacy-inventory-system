import { useState, useEffect } from 'react';
import { getInvoices, createInvoice, getMedicines, getCustomers } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useSocket } from '../context/SocketContext';

const Sales = () => {
  const [invoices, setInvoices] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // POS State
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedMed, setSelectedMed] = useState('');
  const [quantity, setQuantity] = useState('');
  const [discount, setDiscount] = useState(0);

  const socket = useSocket();

  const load = async () => {
    try {
      const [iRes, mRes, cRes] = await Promise.all([getInvoices(), getMedicines(), getCustomers()]);
      setInvoices(iRes.data);
      setMedicines(mRes.data);
      setCustomers(cRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_sale', () => load());
    socket.on('inventory_update', () => load());
    return () => {
      socket.off('new_sale');
      socket.off('inventory_update');
    };
  }, [socket]);

  const handleCustomerChange = (e) => {
    const cid = e.target.value;
    setSelectedCustomer(cid);
    if (cid) {
      const c = customers.find(x => x._id === cid);
      setCustomerName(c.name);
      setCustomerPhone(c.mobile);
    } else {
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  const addToCart = () => {
    if (!selectedMed || !quantity || quantity <= 0) return;
    const med = medicines.find(m => m._id === selectedMed);
    if (!med) return;

    if (med.totalStock < quantity) {
      alert(`Only ${med.totalStock} items available in stock.`);
      return;
    }

    const existing = cart.find(item => item.medicine === selectedMed);
    if (existing) {
      if (existing.quantity + parseInt(quantity) > med.totalStock) {
        alert('Cannot exceed available stock');
        return;
      }
      setCart(cart.map(i => i.medicine === selectedMed ? { ...i, quantity: i.quantity + parseInt(quantity) } : i));
    } else {
      setCart([...cart, { medicine: med._id, name: med.name, price: med.price, quantity: parseInt(quantity) }]);
    }
    
    setSelectedMed('');
    setQuantity('');
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(i => i.medicine !== id));
  };

  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = subTotal * 0.12; // 12% GST
  const grandTotal = subTotal + gst - discount;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty');
    setSaving(true);
    try {
      const payload = {
        customerId: selectedCustomer || null,
        customerName: customerName || 'Walk-in',
        customerPhone: customerPhone || '',
        items: cart.map(i => ({ medicine: i.medicine, quantity: i.quantity })),
        discount
      };
      const res = await createInvoice(payload);
      
      // Generate PDF
      generatePDF(res.data);
      
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setSelectedCustomer('');
      setDiscount(0);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = (invoice) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('PHARMACARE INVOICE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, 30);
    doc.text(`Date: ${new Date(invoice.saleDate).toLocaleDateString()}`, 14, 36);
    doc.text(`Customer: ${invoice.customerName}`, 14, 42);
    if (invoice.customerPhone) doc.text(`Phone: ${invoice.customerPhone}`, 14, 48);

    const tableCol = ["Item", "Batch", "Qty", "Unit Price", "Total"];
    const tableRows = [];

    invoice.items.forEach(item => {
      const itemData = [
        item.medicine?.name || 'Unknown',
        item.batch?.batchNumber || 'N/A',
        item.quantity,
        `₹${item.unitPrice.toFixed(2)}`,
        `₹${item.total.toFixed(2)}`
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      startY: 55,
      head: [tableCol],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 212, 170] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ₹${invoice.subTotal.toFixed(2)}`, 140, finalY);
    doc.text(`GST (12%): ₹${invoice.gst.toFixed(2)}`, 140, finalY + 6);
    doc.text(`Discount: -₹${invoice.discount.toFixed(2)}`, 140, finalY + 12);
    doc.setFontSize(12);
    doc.text(`Grand Total: ₹${invoice.grandTotal.toFixed(2)}`, 140, finalY + 20);

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
      
      {/* POS Screen (Left) */}
      <div className="card" style={{ minHeight: '80vh' }}>
        <h2 className="card-title mb-20"><div className="card-title-icon">🛒</div> Professional Billing POS</h2>
        
        {/* Customer Selection */}
        <div className="form-grid" style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <div className="form-group">
            <label className="form-label">Select Customer</label>
            <select className="form-control" value={selectedCustomer} onChange={handleCustomerChange}>
              <option value="">Walk-in Customer</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.mobile})</option>)}
            </select>
          </div>
          {!selectedCustomer && (
            <>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input className="form-control" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Phone</label>
                <input className="form-control" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+1..." />
              </div>
            </>
          )}
        </div>

        {/* Add Items */}
        <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr auto' }}>
          <div className="form-group">
            <label className="form-label">Medicine</label>
            <select className="form-control" value={selectedMed} onChange={e => setSelectedMed(e.target.value)}>
              <option value="">Search medicine...</option>
              {medicines.filter(m => m.totalStock > 0).map(m => (
                <option key={m._id} value={m._id}>{m.name} (Stock: {m.totalStock}) - ₹{m.price}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Qty</label>
            <input className="form-control" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="1" />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={addToCart} style={{ height: 42 }}>Add</button>
          </div>
        </div>

        {/* Cart Table */}
        <div className="table-wrapper" style={{ marginTop: 20, border: '1px solid var(--border)', borderRadius: 8 }}>
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.medicine}>
                  <td className="td-primary">{item.name}</td>
                  <td>₹{item.price.toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td className="fw-600 text-teal">₹{(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <button className="btn btn-icon btn-danger btn-sm" onClick={() => removeFromCart(item.medicine)}>✕</button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Cart is empty</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Summary (Right) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-focus)' }}>
          <h3 className="card-title mb-20" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 15 }}>Invoice Summary</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="text-muted">Subtotal</span>
            <span className="fw-600">₹{subTotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="text-muted">GST (12%)</span>
            <span className="fw-600 text-purple">₹{gst.toFixed(2)}</span>
          </div>
          
          <div className="form-group" style={{ marginTop: 15 }}>
            <label className="form-label" style={{ fontSize: 12 }}>Discount (₹)</label>
            <input className="form-control" type="number" min="0" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 15, borderTop: '1px solid var(--border)' }}>
            <span className="form-label" style={{ margin: 0, fontSize: 18 }}>Grand Total</span>
            <span className="fw-700 text-teal" style={{ fontSize: 24 }}>₹{grandTotal > 0 ? grandTotal.toFixed(2) : '0.00'}</span>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 20, height: 50, fontSize: 16 }}
            onClick={handleCheckout}
            disabled={saving || cart.length === 0}
          >
            {saving ? 'Processing...' : 'Complete Checkout & Print'}
          </button>
        </div>

        {/* Recent Invoices */}
        <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
          <h3 className="card-title mb-20">Recent Invoices</h3>
          {invoices.slice(0, 5).map(inv => (
            <div key={inv._id} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 10, background: 'var(--bg-primary)' }}>
              <div className="flex-between" style={{ marginBottom: 5 }}>
                <span className="badge badge-indigo">{inv.invoiceNumber}</span>
                <span className="text-teal fw-600">₹{inv.grandTotal.toFixed(2)}</span>
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>{inv.customerName} • {new Date(inv.saleDate).toLocaleDateString()}</div>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => generatePDF(inv)}
              >
                🖨️ Re-print
              </button>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};

export default Sales;
