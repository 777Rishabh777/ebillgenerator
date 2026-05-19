import React, { useState, useRef } from 'react';
import InternetBillCanvas from '../canvas/InternetBillCanvas';
import FullscreenModal from '../FullscreenModal';
import Watermark from '../Watermark';
import DownloadModal from '../DownloadModal';
import PreviewScaler from '../PreviewScaler';
import { buildExportFilename, firstValidationError, isValidPhone10 } from './templateUtils';

const templateStyles = [
  { id: 'template1', name: 'Modern Digital', desc: 'Orange modern style' },
  { id: 'template2', name: 'Classic Statement', desc: 'Blue formal style' }
];

export default function InternetBillTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [logoUpload, setLogoUpload] = useState(null);
  const canvasRef = useRef(null);
  const [showWatermark, setShowWatermark] = useState(true);

  const [formData, setFormData] = useState({
    billNumber: 'JF2025031844318',
    billDate: new Date().toISOString().split('T')[0],
    billPeriod: 'March 2025',
    dueDate: new Date(Date.now() + 10*24*60*60*1000).toISOString().split('T')[0],
    providerBrand: 'JioFiber',
    providerName: 'Jio Platforms Limited',
    logoUrl: null,
    customerName: 'Priya Sharma',
    customerEmail: 'priya.sharma@gmail.com',
    customerPhone: '9876543210',
    customerAddress: '402, Green Meadows Apt, HSR Layout, Bengaluru - 560102',
    accountNumber: 'JF88452100987',
    connectionType: 'Fiber',
    planName: 'JioFiber Premium',
    speed: '300 Mbps',
    dataLimit: 'Unlimited',
    monthlyCharges: 1499,
    taxes: 269.82,
    otherCharges: 0,
    discount: 0,
    totalAmount: 1768.82,
    paymentStatus: 'Pending',
    paymentMethod: 'Online',
    paymentTxnId: 'INTTXN92011',
    paymentRefId: 'INTRF12098',
    upiRef: 'UPI99887766',
    cardLast4: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      if (['monthlyCharges', 'taxes', 'otherCharges', 'discount'].includes(name)) {
        updated.totalAmount = (
          (updated.monthlyCharges || 0) + 
          (updated.taxes || 0) + 
          (updated.otherCharges || 0) -
          (updated.discount || 0)
        ).toFixed(2);
      }
      return updated;
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: null }));
  };

  const handleDownload = () => {
    const validationError = firstValidationError([
      { valid: !!formData.billDate, message: 'Bill date is required.' },
      { valid: !!formData.dueDate, message: 'Due date is required.' },
      { valid: formData.customerPhone?.trim() || true, message: 'Customer phone must be 10 digits.' }
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
                  border: selectedTemplate === t.id ? '2px solid #FF6600' : '1px solid #ddd',
                  borderRadius: '6px',
                  background: selectedTemplate === t.id ? '#FFF4EC' : '#fff',
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

        {/* Provider Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Internet Provider</div>
          
          {/* Logo Upload Section */}
          <div style={{ marginBottom: '15px' }}>
            <label className="compact-form-label" style={{ display: 'block', marginBottom: '8px' }}>Provider Logo</label>
            {formData.logoUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={formData.logoUrl} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '6px', padding: '5px' }} />
                <button 
                  onClick={handleRemoveLogo}
                  style={{ padding: '6px 12px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Remove Logo
                </button>
              </div>
            ) : (
              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                  style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}
                />
                <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0 0' }}>
                  Upload logo or leave empty to show text initials
                </p>
              </div>
            )}
          </div>

          <div className="compact-form-grid">
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Provider Brand</label>
              <input type="text" name="providerBrand" value={formData.providerBrand} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Provider Name</label>
              <input type="text" name="providerName" value={formData.providerName} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Customer Details</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Customer Name</label>
              <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Account Number</label>
              <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Email</label>
              <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Phone</label>
              <input type="text" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Service Address</label>
              <input type="text" name="customerAddress" value={formData.customerAddress} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Bill & Plan Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Bill & Plan Details</div>
          <div className="compact-form-grid cols-3">
            <div className="compact-form-field">
              <label className="compact-form-label">Bill Number</label>
              <input type="text" name="billNumber" value={formData.billNumber} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Bill Date</label>
              <input type="date" name="billDate" value={formData.billDate} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Due Date</label>
              <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Plan Name</label>
              <input type="text" name="planName" value={formData.planName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Speed</label>
              <input type="text" name="speed" value={formData.speed} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Data Limit</label>
              <input type="text" name="dataLimit" value={formData.dataLimit} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">Connection Type</label>
              <select name="connectionType" value={formData.connectionType} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option>Fiber</option>
                <option>DSL</option>
                <option>Cable</option>
                <option>Wireless</option>
              </select>
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Billing Period</label>
              <input type="text" name="billPeriod" value={formData.billPeriod} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Charges */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Charges</div>
          <div className="compact-form-grid cols-4">
            <div className="compact-form-field">
              <label className="compact-form-label">Monthly (?)</label>
              <input type="number" step="0.01" name="monthlyCharges" value={formData.monthlyCharges} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">GST (?)</label>
              <input type="number" step="0.01" name="taxes" value={formData.taxes} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Other (?)</label>
              <input type="number" step="0.01" name="otherCharges" value={formData.otherCharges} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Discount (?)</label>
              <input type="number" step="0.01" name="discount" value={formData.discount} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">Total Amount (?)</label>
              <input type="number" step="0.01" name="totalAmount" value={formData.totalAmount} onChange={handleInputChange} className="compact-form-input" style={{ fontWeight: '700', fontSize: '0.95rem' }} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Payment Status</label>
              <select name="paymentStatus" value={formData.paymentStatus} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option>Pending</option>
                <option>Paid</option>
                <option>Overdue</option>
              </select>
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Payment Method</label>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option>Online</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Net Banking</option>
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
          <InternetBillCanvas ref={canvasRef} data={formData} template={{ templateStyle: selectedTemplate }} />
          <Watermark show={showWatermark} />
        </div>
        </PreviewScaler>
        
        <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
          Watermark will be removed from actual pdf
        </p>
      </div>

      {/* Fullscreen Modal */}
      <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <InternetBillCanvas data={formData} template={{ templateStyle: selectedTemplate }} />
      </FullscreenModal>

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        canvasRef={canvasRef}
        defaultFilename={buildExportFilename('Internet Bill', formData.billNumber, formData.billDate)}
        billType="Internet Bill"
        billData={{
          invoiceId: formData.billNumber,
          vendorName: formData.providerName,
          vendorAddress: formData.providerAddress,
          customerName: formData.customerName,
          accountNumber: formData.accountNumber,
          planName: formData.planName,
          rate: formData.monthlyCharges,
          quantity: 1,
          total: formData.totalAmount,
          paymentMethod: formData.paymentMethod,
          paymentTxnId: formData.paymentTxnId,
          paymentRefNo: formData.paymentRefId,
          upiRef: formData.upiRef,
          cardLast4: formData.cardLast4,
          paymentStatus: formData.paymentStatus,
          date: formData.billDate,
          description: `${formData.planName} - ${formData.dataLimit}`,
          formDataCopy: { ...formData }
        }}
      />
    </div>
  );
}

