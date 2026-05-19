import React, { useState, useRef } from 'react';
import RentReceiptCanvas from '../canvas/RentReceiptCanvas';
import FullscreenModal from '../FullscreenModal';
import Watermark from '../Watermark';
import DownloadModal from '../DownloadModal';

const templateStyles = [
  { id: 'template1', name: 'Classic Receipt', description: 'Traditional format with border' },
  { id: 'template2', name: 'Formal Agreement', description: 'Agreement style layout' },
  { id: 'template3', name: 'Modern Compact', description: 'Contemporary design' }
];

export default function RentReceiptTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const canvasRef = useRef(null);
  const [showWatermark, setShowWatermark] = useState(true);

  const [formData, setFormData] = useState({
    receiptNumber: 'RR-2025-0742',
    receiptDate: new Date().toISOString().split('T')[0],
    periodFrom: '2025-01-01',
    periodTo: '2025-01-31',
    landlordName: 'Rohan Bhatia',
    landlordPAN: 'ABCPB1234D',
    tenantName: 'Neha Sharma',
    propertyAddress: 'A-302, Prestige Lakeside Habitat, Varthur Main Road, Bengaluru - 560087',
    rentAmount: 25000,
    paymentMethod: 'Bank Transfer'
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleDownload = () => {
    setIsDownloadOpen(true);
  };

  return (
    <div className="template-workspace">
      {/* Left Side - Form */}
      <div className="template-form-column compact-form">
        {/* Template Style Selector */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Choose Template Style</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {templateStyles.map(style => (
              <button
                key={style.id}
                onClick={() => setSelectedTemplate(style.id)}
                style={{
                  padding: '8px 12px',
                  background: selectedTemplate === style.id ? '#2563eb' : '#e5e7eb',
                  color: selectedTemplate === style.id ? '#fff' : '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: selectedTemplate === style.id ? '600' : '400'
                }}
              >
                {style.name}
              </button>
            ))}
          </div>
        </div>

        {/* Receipt Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Receipt Details</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Receipt Number</label>
              <input type="text" name="receiptNumber" value={formData.receiptNumber} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Receipt Date</label>
              <input type="date" name="receiptDate" value={formData.receiptDate} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Period From</label>
              <input type="date" name="periodFrom" value={formData.periodFrom} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Period To</label>
              <input type="date" name="periodTo" value={formData.periodTo} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Landlord Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Landlord Details</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Landlord Name</label>
              <input type="text" name="landlordName" value={formData.landlordName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Landlord PAN</label>
              <input type="text" name="landlordPAN" value={formData.landlordPAN} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Tenant Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Tenant Details</div>
          <div className="compact-form-grid">
            <div className="compact-form-field" style={{ gridColumn: 'span 2' }}>
              <label className="compact-form-label">Tenant Name</label>
              <input type="text" name="tenantName" value={formData.tenantName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field" style={{ gridColumn: 'span 2' }}>
              <label className="compact-form-label">Property Address</label>
              <textarea name="propertyAddress" value={formData.propertyAddress} onChange={handleInputChange} className="compact-form-input" rows="2" />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Payment Details</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Rent Amount (₹)</label>
              <input type="number" name="rentAmount" value={formData.rentAmount} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Payment Method</label>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className="compact-form-input">
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Cheque</option>
                <option>UPI</option>
              </select>
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
        
        <div style={{ position: 'relative' }}>
          <RentReceiptCanvas ref={canvasRef} data={formData} template={{ templateStyle: selectedTemplate }} />
          <Watermark show={showWatermark} />
        </div>
        
        </p>
      </div>

      {/* Fullscreen Modal */}
      <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <RentReceiptCanvas data={formData} template={{ templateStyle: selectedTemplate }} />
      </FullscreenModal>

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        canvasRef={canvasRef}
        defaultFilename={`rent-receipt-${formData.receiptNumber}`}
        billType="Rent Receipt"
      />
    </div>
  );
}

