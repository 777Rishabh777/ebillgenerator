import React, { useState, useRef } from 'react';
import GeneralBillCanvas from '../canvas/GeneralBillCanvas';
import FullscreenModal from '../FullscreenModal';
import Watermark from '../Watermark';
import DownloadModal from '../DownloadModal';
import PreviewScaler from '../PreviewScaler';
import { buildExportFilename, firstValidationError, isValidGSTIN, isValidPAN, isValidPhone10 } from './templateUtils';

const templateStyles = [
  { id: 'template1', name: 'Professional Dark', desc: 'Dark header corporate' },
  { id: 'template2', name: 'Clean Blue', desc: 'Classic blue theme' },
  { id: 'template3', name: 'Minimal Green', desc: 'Modern green accent' }
];

export default function GeneralBillTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const canvasRef = useRef(null);
  const [showWatermark, setShowWatermark] = useState(true);

  const [formData, setFormData] = useState({
    billNumber: 'GB-2025-041',
    billDate: new Date().toISOString().split('T')[0],
    vendorName: 'Aurum Facilities Pvt Ltd',
    vendorGSTIN: '29AABCA1234F1ZP',
    vendorAddress: 'Plot 42, Industrial Area, Gurugram, Haryana - 122001',
    vendorPhone: '0124-4567890',
    vendorEmail: 'billing@aurumfacilities.in',
    recipientName: 'Rajesh Enterprises',
    recipientGSTIN: '29AADCN1234G1ZQ',
    recipientAddress: 'Tower C, MG Road, Bengaluru, Karnataka - 560001',
    recipientPhone: '080-4567890',
    recipientEmail: 'accounts@rajeshenterprises.com',
    items: [
      { description: 'HVAC Maintenance - Q1', qty: 1, rate: 12500, amount: 12500 },
      { description: 'Filter Replacement', qty: 4, rate: 1500, amount: 6000 }
    ],
    subtotal: 18500,
    cgst: 1665,
    sgst: 1665,
    totalAmount: 21830,
    paymentTerms: 'Net 30',
    paymentMode: 'Bank Transfer',
    paymentTxnId: 'GEN9002111',
    paymentRefId: 'GENREF3312',
    upiRef: '',
    panNumber: 'AABCA1234F',
    cardLast4: '',
    bankName: 'HDFC Bank',
    accountNo: '50100XXXXXXX',
    ifsc: 'HDFC0001234',
    notes: 'Please quote invoice number for payment reference.'
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: field === 'description' ? value : parseFloat(value) || 0 };
      if (field === 'qty' || field === 'rate') {
        newItems[index].amount = newItems[index].qty * newItems[index].rate;
      }
      const subtotal = newItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const cgst = Math.round(subtotal * 0.09);
      const sgst = Math.round(subtotal * 0.09);
      return { ...prev, items: newItems, subtotal, cgst, sgst, totalAmount: subtotal + cgst + sgst };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', qty: 1, rate: 0, amount: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => {
        const newItems = prev.items.filter((_, i) => i !== index);
        const subtotal = newItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        const cgst = Math.round(subtotal * 0.09);
        const sgst = Math.round(subtotal * 0.09);
        return { ...prev, items: newItems, subtotal, cgst, sgst, totalAmount: subtotal + cgst + sgst };
      });
    }
  };

  const handleDownload = () => {
    const validationError = firstValidationError([
      { valid: !!formData.billDate, message: 'Bill date is required.' },
      { valid: isValidGSTIN(formData.vendorGSTIN), message: 'Vendor GSTIN is invalid.' },
      { valid: isValidGSTIN(formData.recipientGSTIN), message: 'Recipient GSTIN is invalid.' },
      { valid: isValidPAN(formData.panNumber), message: 'PAN format is invalid.' },
      { valid: formData.vendorPhone?.trim() || true, message: 'Vendor phone must be 10 digits.' },
      { valid: formData.recipientPhone?.trim() || true, message: 'Recipient phone must be 10 digits.' }
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
                  border: selectedTemplate === t.id ? '2px solid #1F2937' : '1px solid #ddd',
                  borderRadius: '6px',
                  background: selectedTemplate === t.id ? '#F3F4F6' : '#fff',
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

        {/* Bill Info */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Bill Details</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Bill Number</label>
              <input type="text" name="billNumber" value={formData.billNumber} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Bill Date</label>
              <input type="date" name="billDate" value={formData.billDate} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Vendor Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">From (Vendor)</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Vendor Name</label>
              <input type="text" name="vendorName" value={formData.vendorName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">GSTIN</label>
              <input type="text" name="vendorGSTIN" value={formData.vendorGSTIN} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Address</label>
              <input type="text" name="vendorAddress" value={formData.vendorAddress} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Phone</label>
              <input type="text" name="vendorPhone" value={formData.vendorPhone} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Email</label>
              <input type="email" name="vendorEmail" value={formData.vendorEmail} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Recipient Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Bill To</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Recipient Name</label>
              <input type="text" name="recipientName" value={formData.recipientName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">GSTIN</label>
              <input type="text" name="recipientGSTIN" value={formData.recipientGSTIN} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Address</label>
              <input type="text" name="recipientAddress" value={formData.recipientAddress} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="compact-form-section">
          <div className="compact-form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Line Items</span>
            <button type="button" onClick={addItem} style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add</button>
          </div>
          <div style={{ fontSize: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '4px', marginBottom: '4px', fontWeight: '600', color: '#666' }}>
              <span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span><span></span>
            </div>
            {formData.items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '4px', marginBottom: '4px' }}>
                <input type="text" value={item.description} onChange={(e) => handleItemChange(idx, 'description', e.target.value)} className="compact-form-input" style={{ fontSize: '10px', padding: '6px 8px' }} />
                <input type="number" value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} className="compact-form-input" style={{ fontSize: '10px', padding: '6px 8px' }} />
                <input type="number" value={item.rate} onChange={(e) => handleItemChange(idx, 'rate', e.target.value)} className="compact-form-input" style={{ fontSize: '10px', padding: '6px 8px' }} />
                <input type="number" value={item.amount} readOnly className="compact-form-input" style={{ fontSize: '10px', padding: '6px 8px', backgroundColor: '#f5f5f5' }} />
                <button type="button" onClick={() => removeItem(idx)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>?</button>
              </div>
            ))}
          </div>
          <div className="compact-form-grid cols-4" style={{ marginTop: '8px' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">Subtotal</label>
              <input type="number" value={formData.subtotal} readOnly className="compact-form-input" style={{ backgroundColor: '#f5f5f5' }} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">CGST (9%)</label>
              <input type="number" value={formData.cgst} readOnly className="compact-form-input" style={{ backgroundColor: '#f5f5f5' }} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">SGST (9%)</label>
              <input type="number" value={formData.sgst} readOnly className="compact-form-input" style={{ backgroundColor: '#f5f5f5' }} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Total (?)</label>
              <input type="number" value={formData.totalAmount} readOnly className="compact-form-input" style={{ fontWeight: '700', backgroundColor: '#f5f5f5' }} />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Payment & Notes</div>
          <div className="compact-form-grid cols-3">
            <div className="compact-form-field">
              <label className="compact-form-label">Payment Terms</label>
              <select name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option>Due on Receipt</option>
                <option>Net 15</option>
                <option>Net 30</option>
                <option>Net 45</option>
                <option>Net 60</option>
              </select>
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Bank Name</label>
              <input type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">PAN</label>
              <input type="text" name="panNumber" value={formData.panNumber} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Account No</label>
              <input type="text" name="accountNo" value={formData.accountNo} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option>Bank Transfer</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Cash</option>
              </select>
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
            <div className="compact-form-field" style={{ gridColumn: 'span 3' }}>
              <label className="compact-form-label">Notes</label>
              <input type="text" name="notes" value={formData.notes} onChange={handleInputChange} className="compact-form-input" />
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
          <GeneralBillCanvas ref={canvasRef} data={formData} template={{ templateStyle: selectedTemplate }} />
          <Watermark show={showWatermark} />
        </div>
        </PreviewScaler>
        
        <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
          Watermark will be removed from actual pdf
        </p>
      </div>

      {/* Fullscreen Modal */}
      <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <GeneralBillCanvas data={formData} template={{ templateStyle: selectedTemplate }} />
      </FullscreenModal>

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        canvasRef={canvasRef}
        defaultFilename={buildExportFilename('General Bill', formData.billNumber, formData.billDate)}
        billType="General Bill"
        billData={{
          invoiceId: formData.billNumber,
          vendorName: formData.vendorName,
          vendorAddress: formData.vendorAddress,
          vendorPhone: formData.vendorPhone,
          vendorGst: formData.vendorGSTIN,
          customerName: formData.recipientName,
          customerEmail: formData.recipientEmail,
          items: formData.items,
          rate: formData.subtotal,
          quantity: formData.items?.length || 1,
          total: formData.totalAmount,
          paymentMethod: formData.paymentMode,
          paymentTxnId: formData.paymentTxnId,
          paymentRefNo: formData.paymentRefId,
          upiRef: formData.upiRef,
          cardLast4: formData.cardLast4,
          date: formData.billDate,
          description: formData.items?.map(i => i.description).join(', ') || 'General Bill',
          formDataCopy: { ...formData }
        }}
      />
    </div>
  );
}

