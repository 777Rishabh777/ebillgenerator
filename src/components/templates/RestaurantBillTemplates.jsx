import React, { useState, useRef } from 'react';
import RestaurantBillCanvas from '../canvas/RestaurantBillCanvas';
import FullscreenModal from '../FullscreenModal';
import Watermark from '../Watermark';
import DownloadModal from '../DownloadModal';
import PreviewScaler from '../PreviewScaler';
import { buildExportFilename, firstValidationError, isValidGSTIN, isValidPhone10, maskCardNumber, normalizeDigits } from './templateUtils';

const templateStyles = [
  { id: 'template1', name: 'Thermal Receipt', desc: 'Classic POS style' },
  { id: 'template2', name: 'Modern Card', desc: 'Red modern design' },
  { id: 'template3', name: 'Fine Dining', desc: 'Elegant gold theme' }
];

export default function RestaurantBillTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const canvasRef = useRef(null);
  const [showWatermark, setShowWatermark] = useState(true);

  const [formData, setFormData] = useState({
    billNumber: 'DIN-250611-87',
    billDate: new Date().toISOString().split('T')[0],
    billTime: '19:45',
    restaurantName: 'Barbeque Nation',
    restaurantAddress: '100 Feet Road, Indiranagar, Bengaluru - 560038',
    restaurantPhone: '080-4567-8901',
    restaurantGSTIN: '29AABCB1234D1ZA',
    tableNumber: '12',
    orderType: 'Dine In',
    guestName: 'Ananya Mehta',
    guestCount: 4,
    serverName: 'Rakesh',
    items: [
      { name: 'Veg Starter Platter', qty: 1, rate: 499, amount: 499 },
      { name: 'Paneer Tikka', qty: 1, rate: 349, amount: 349 },
      { name: 'Dal Makhani', qty: 1, rate: 299, amount: 299 },
      { name: 'Butter Naan', qty: 4, rate: 65, amount: 260 },
      { name: 'Fresh Lime Soda', qty: 4, rate: 99, amount: 396 }
    ],
    subtotal: 1803,
    cgst: 45.08,
    sgst: 45.08,
    serviceCharge: 90.15,
    discount: 0,
    roundOff: -0.31,
    totalAmount: 1983,
    paymentMode: 'Card',
    cardLast4: '4521',
    paymentTxnId: 'TXN4587123',
    paymentRefId: 'REF992211',
    upiRef: '',
    notes: 'Thank you for dining with us!'
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    if (name === 'cardLast4') {
      const last4 = normalizeDigits(value).slice(-4);
      setFormData(prev => ({ ...prev, cardLast4: last4 }));
      return;
    }
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      // Recalculate totals
      const itemTotal = updated.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      updated.subtotal = itemTotal;
      updated.cgst = (itemTotal * 0.025).toFixed(2);
      updated.sgst = (itemTotal * 0.025).toFixed(2);
      updated.serviceCharge = (itemTotal * 0.05).toFixed(2);
      const gross = itemTotal + parseFloat(updated.cgst) + parseFloat(updated.sgst) + parseFloat(updated.serviceCharge) - (updated.discount || 0);
      updated.roundOff = (Math.round(gross) - gross).toFixed(2);
      updated.totalAmount = Math.round(gross);
      return updated;
    });
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: field === 'name' ? value : parseFloat(value) || 0 };
      if (field === 'qty' || field === 'rate') {
        newItems[index].amount = newItems[index].qty * newItems[index].rate;
      }
      const itemTotal = newItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const cgst = (itemTotal * 0.025).toFixed(2);
      const sgst = (itemTotal * 0.025).toFixed(2);
      const serviceCharge = (itemTotal * 0.05).toFixed(2);
      const gross = itemTotal + parseFloat(cgst) + parseFloat(sgst) + parseFloat(serviceCharge) - (prev.discount || 0);
      return {
        ...prev,
        items: newItems,
        subtotal: itemTotal,
        cgst, sgst, serviceCharge,
        roundOff: (Math.round(gross) - gross).toFixed(2),
        totalAmount: Math.round(gross)
      };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', qty: 1, rate: 0, amount: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => {
        const newItems = prev.items.filter((_, i) => i !== index);
        const itemTotal = newItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        const cgst = (itemTotal * 0.025).toFixed(2);
        const sgst = (itemTotal * 0.025).toFixed(2);
        const serviceCharge = (itemTotal * 0.05).toFixed(2);
        const gross = itemTotal + parseFloat(cgst) + parseFloat(sgst) + parseFloat(serviceCharge) - (prev.discount || 0);
        return {
          ...prev,
          items: newItems,
          subtotal: itemTotal,
          cgst, sgst, serviceCharge,
          roundOff: (Math.round(gross) - gross).toFixed(2),
          totalAmount: Math.round(gross)
        };
      });
    }
  };

  const handleDownload = () => {
    const validationError = firstValidationError([
      { valid: !!formData.billDate, message: 'Bill date is required.' },
      { valid: !!formData.billTime, message: 'Bill time is required.' },
      { valid: isValidGSTIN(formData.restaurantGSTIN), message: 'Enter valid GSTIN.' },
      { valid: formData.restaurantPhone?.trim() || true, message: 'Restaurant phone must be 10 digits.' }
    ]);

    if (validationError) {
      window.BillGenUI?.notify ? window.BillGenUI.notify(validationError, { type: 'warning', title: 'Missing Required Fields', duration: 4200 }) : window.alert(validationError);
      return;
    }
    setIsDownloadOpen(true);
  };

  return (
    <div className="template-workspace">
      {/* Left Side - Compact Form */}
      <div className="template-form-column compact-form">
        {/* Template Style Selector */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Template Style</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {templateStyles.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                style={{
                  padding: '8px 16px',
                  border: selectedTemplate === t.id ? '2px solid #DC2626' : '1px solid #ddd',
                  borderRadius: '6px',
                  background: selectedTemplate === t.id ? '#FEF2F2' : '#fff',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <div style={{ fontWeight: '600' }}>{t.name}</div>
                <div style={{ fontSize: '10px', color: '#666' }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Restaurant Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Restaurant Details</div>
          <div className="compact-form-grid">
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Restaurant Name</label>
              <input type="text" name="restaurantName" value={formData.restaurantName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Address</label>
              <input type="text" name="restaurantAddress" value={formData.restaurantAddress} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Phone</label>
              <input type="text" name="restaurantPhone" value={formData.restaurantPhone} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">GSTIN</label>
              <input type="text" name="restaurantGSTIN" value={formData.restaurantGSTIN} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Order Details</div>
          <div className="compact-form-grid cols-3">
            <div className="compact-form-field">
              <label className="compact-form-label">Bill No</label>
              <input type="text" name="billNumber" value={formData.billNumber} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Date</label>
              <input type="date" name="billDate" value={formData.billDate} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Time</label>
              <input type="time" name="billTime" value={formData.billTime} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Table No</label>
              <input type="text" name="tableNumber" value={formData.tableNumber} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Order Type</label>
              <select name="orderType" value={formData.orderType} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option>Dine In</option>
                <option>Takeaway</option>
                <option>Delivery</option>
              </select>
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Guests</label>
              <input type="number" name="guestCount" value={formData.guestCount} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Guest Name</label>
              <input type="text" name="guestName" value={formData.guestName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field" style={{ gridColumn: 'span 2' }}>
              <label className="compact-form-label">Server</label>
              <input type="text" name="serverName" value={formData.serverName} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="compact-form-section">
          <div className="compact-form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Order Items</span>
            <button type="button" onClick={addItem} style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add</button>
          </div>
          <div style={{ fontSize: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '4px', marginBottom: '4px', fontWeight: '600', color: '#666' }}>
              <span>Item</span><span>Qty</span><span>Rate</span><span>Amount</span><span></span>
            </div>
            {formData.items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '4px', marginBottom: '4px' }}>
                <input type="text" value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)} className="compact-form-input" style={{ fontSize: '10px', padding: '6px 8px' }} />
                <input type="number" value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} className="compact-form-input" style={{ fontSize: '10px', padding: '6px 8px' }} />
                <input type="number" value={item.rate} onChange={(e) => handleItemChange(idx, 'rate', e.target.value)} className="compact-form-input" style={{ fontSize: '10px', padding: '6px 8px' }} />
                <input type="number" value={item.amount} readOnly className="compact-form-input" style={{ fontSize: '10px', padding: '6px 8px', backgroundColor: '#f5f5f5' }} />
                <button type="button" onClick={() => removeItem(idx)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Payment</div>
          <div className="compact-form-grid cols-3">
            <div className="compact-form-field">
              <label className="compact-form-label">Subtotal</label>
              <input type="number" name="subtotal" value={formData.subtotal} readOnly className="compact-form-input" style={{ backgroundColor: '#f5f5f5' }} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">CGST (2.5%)</label>
              <input type="number" name="cgst" value={formData.cgst} readOnly className="compact-form-input" style={{ backgroundColor: '#f5f5f5' }} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">SGST (2.5%)</label>
              <input type="number" name="sgst" value={formData.sgst} readOnly className="compact-form-input" style={{ backgroundColor: '#f5f5f5' }} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Service (5%)</label>
              <input type="number" name="serviceCharge" value={formData.serviceCharge} readOnly className="compact-form-input" style={{ backgroundColor: '#f5f5f5' }} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Discount</label>
              <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Total (₹)</label>
              <input type="number" name="totalAmount" value={formData.totalAmount} readOnly className="compact-form-input" style={{ fontWeight: '700', backgroundColor: '#f5f5f5' }} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option>Cash</option>
                <option>Card</option>
                <option>UPI</option>
                <option>Wallet</option>
              </select>
            </div>
            <div className="compact-form-field" style={{ gridColumn: 'span 2' }}>
              <label className="compact-form-label">Card Last 4 (if card)</label>
              <input type="text" name="cardLast4" value={formData.cardLast4} onChange={handleInputChange} className="compact-form-input" maxLength={4} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Txn ID</label>
              <input type="text" name="paymentTxnId" value={formData.paymentTxnId} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Ref ID</label>
              <input type="text" name="paymentRefId" value={formData.paymentRefId} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">UPI Ref</label>
              <input type="text" name="upiRef" value={formData.upiRef} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Canvas Preview */}
      <div className="template-preview-column">
        <div className="preview-actions">
          <button className="preview-action-btn secondary" onClick={() => setIsFullscreen(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
            Fullscreen
          </button>
          <button className="preview-action-btn primary" onClick={handleDownload}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download
          </button>
        </div>
        
        <div className="download-status free">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Free: 2 downloads with watermark • Upgrade for unlimited
        </div>
        
        <PreviewScaler>
          <div style={{ position: 'relative' }}>
            <RestaurantBillCanvas ref={canvasRef} data={formData} template={{ templateStyle: selectedTemplate }} />
            <Watermark show={showWatermark} />
          </div>
        </PreviewScaler>
        
        <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
          Watermark will be removed from actual pdf
        </p>
      </div>

      {/* Fullscreen Modal */}
      <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <RestaurantBillCanvas data={formData} template={{ templateStyle: selectedTemplate }} />
      </FullscreenModal>

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        canvasRef={canvasRef}
        defaultFilename={buildExportFilename('Restaurant Bill', formData.billNumber, formData.billDate)}
        billType="Restaurant Bill"
        billData={{
          invoiceId: formData.billNumber,
          vendorName: formData.restaurantName,
          vendorAddress: formData.restaurantAddress,
          vendorPhone: formData.restaurantPhone,
          vendorGst: formData.restaurantGSTIN,
          customerName: formData.customerName || 'Walk-in Customer',
          tableNo: formData.tableNumber,
          items: formData.items,
          rate: formData.subtotal,
          quantity: formData.items?.length || 1,
          total: formData.totalAmount,
          paymentMethod: formData.paymentMode,
          paymentTxnId: formData.paymentTxnId,
          paymentRefNo: formData.paymentRefId,
          upiRef: formData.upiRef,
          cardMask: maskCardNumber(formData.cardLast4),
          cardLast4: formData.cardLast4,
          date: formData.billDate,
          description: `Table ${formData.tableNumber} - ${formData.items?.length || 0} items`,
          formDataCopy: { ...formData }
        }}
      />
    </div>
  );
}

