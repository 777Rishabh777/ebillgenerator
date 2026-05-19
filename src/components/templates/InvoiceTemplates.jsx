import React, { useState, useRef } from 'react';
import InvoiceCanvas from '../canvas/InvoiceCanvas';
import TemplateSelector from '../TemplateSelector';
import FullscreenModal from '../FullscreenModal';
import Watermark from '../Watermark';
import DownloadModal from '../DownloadModal';
import PreviewScaler from '../PreviewScaler';

const templates = [
  {
    id: 'tech',
    name: 'Amazon India',
    description: 'Amazon.in order invoice with GST',
    industry: 'E-commerce',
    brand: 'Amazon.in',
    logoMark: 'AZ',
    billingStyle: 'Corporate Grid',
    colors: { primary: '#F59E0B', secondary: '#D97706', bg: '#FEF3C7' }
  },
  {
    id: 'retail',
    name: 'Flipkart',
    description: 'Flipkart marketplace seller invoice',
    industry: 'E-commerce',
    brand: 'Flipkart Pvt Ltd',
    logoMark: 'FK',
    billingStyle: 'Receipt Counter',
    colors: { primary: '#2563EB', secondary: '#1D4ED8', bg: '#EFF6FF' }
  },
  {
    id: 'services',
    name: 'Myntra',
    description: 'Myntra fashion order invoice',
    industry: 'Fashion',
    brand: 'Myntra Designs',
    logoMark: 'MY',
    billingStyle: 'Modern Digital',
    colors: { primary: '#EC4899', secondary: '#DB2777', bg: '#FDF2F8' }
  },
  {
    id: 'enterprise',
    name: 'Nykaa',
    description: 'Nykaa beauty order invoice',
    industry: 'Beauty',
    brand: 'Nykaa E-Retail',
    logoMark: 'NK',
    billingStyle: 'Enterprise Contract',
    colors: { primary: '#E91E63', secondary: '#C2185B', bg: '#FCE4EC' }
  },
  {
    id: 'minimal',
    name: 'Meesho',
    description: 'Meesho seller supply invoice',
    industry: 'Social Commerce',
    brand: 'Meesho Supply',
    logoMark: 'ME',
    billingStyle: 'Digital Summary',
    colors: { primary: '#7C3AED', secondary: '#6D28D9', bg: '#F5F3FF' }
  },
  {
    id: 'custom',
    name: 'Custom Branding',
    description: 'Fully customizable brand name and colors',
    industry: 'Universal',
    brand: 'Your Company',
    logoMark: '?',
    billingStyle: 'Flexible',
    colors: { primary: '#334155', secondary: '#1e293b', bg: '#f1f5f9' }
  }
];

const billDescription = {
  title: 'E-Commerce / GST Invoice',
  text: 'Generate authentic e-commerce order invoices and GST tax invoices. Perfect for online shopping records, returns, warranty claims, and expense reports.',
  features: [
    'Major e-commerce platforms',
    'GST compliant format',
    'Multiple line items',
    'Order & delivery details',
    'Payment breakdown'
  ]
};

export default function InvoiceTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState('tech');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const canvasRef = useRef(null);
  const [showWatermark, setShowWatermark] = useState(true);

  const [formData, setFormData] = useState({
    invoiceNumber: 'INV-2025-118',
    orderNumber: 'OD4087654321098',
    invoiceDate: new Date().toISOString().split('T')[0],
    orderDate: new Date().toISOString().split('T')[0],
    sellerName: 'CloudTech Retail India',
    sellerAddress: 'Warehouse 12, Doddanekundi, Bengaluru - 560037',
    sellerGSTIN: '29AABCU9603R1ZM',
    sellerPAN: 'AABCU9603R',
    buyerName: 'Rahul Verma',
    buyerPhone: '9876543210',
    buyerAddress: '402, Green Meadows Apt, HSR Layout, Bengaluru - 560102',
    shippingAddress: '',
    items: [
      { description: 'Wireless Bluetooth Earbuds Pro', hsn: '8518', qty: 1, rate: 2499, tax: 18 }
    ],
    shippingCharges: 0,
    packagingFee: 49,
    discount: 500,
    paymentMode: 'Prepaid (UPI)',
    deliveryPartner: 'Delhivery',
    customBrandName: 'My Enterprise',
    logoUrl: null,
    qrCodeUrl: null,
    signatureUrl: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = ['description', 'hsn'].includes(field) ? value : parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', hsn: '', qty: 1, rate: 0, tax: 18 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    }
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

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, qrCodeUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveQr = () => {
    setFormData(prev => ({ ...prev, qrCodeUrl: null }));
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, signatureUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
    setFormData(prev => ({ ...prev, signatureUrl: null }));
  };

  const handleDownload = () => {
    setIsDownloadOpen(true);
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="template-workspace">
      {/* Left Side - Compact Form */}
      <div className="template-form-column compact-form">
        <TemplateSelector
          templates={templates}
          selectedTemplate={selectedTemplate}
          onSelect={setSelectedTemplate}
        />

        {/* Company Logo Upload */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Company Logo</div>
          <div style={{ marginBottom: '5px' }}>
            {formData.logoUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={formData.logoUrl} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px' }} />
                <button onClick={handleRemoveLogo} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>Remove Logo</button>
              </div>
            ) : (
              <div>
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'block', fontSize: '12px' }} />
                <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0' }}>Upload company logo (shown at top of invoice)</p>
              </div>
            )}
          </div>
        </div>

        {/* Seller Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Seller / Company</div>
          <div className="compact-form-grid">

            {/* --- CUSTOM BRANDING INPUT --- */}
            {selectedTemplate === 'custom' && (
              <div className="compact-form-field full-width" style={{
                background: '#f0f9ff',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #bae6fd',
                marginBottom: '10px'
              }}>
                <label className="compact-form-label" style={{ color: '#0369a1', fontWeight: 'bold' }}>
                  Organization Name (Custom)
                </label>
                <input
                  type="text"
                  name="customBrandName"
                  value={formData.customBrandName}
                  onChange={handleInputChange}
                  placeholder="e.g. xyz Solutions"
                  className="compact-form-input"
                />
              </div>
            )}

            <div className="compact-form-field full-width">
              <label className="compact-form-label">Seller Name</label>
              <input type="text" name="sellerName" value={formData.sellerName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Seller Address</label>
              <input type="text" name="sellerAddress" value={formData.sellerAddress} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">GSTIN</label>
              <input type="text" name="sellerGSTIN" value={formData.sellerGSTIN} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">PAN</label>
              <input type="text" name="sellerPAN" value={formData.sellerPAN} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Buyer / Customer</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Buyer Name</label>
              <input type="text" name="buyerName" value={formData.buyerName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Phone</label>
              <input type="text" name="buyerPhone" value={formData.buyerPhone} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Billing Address</label>
              <input type="text" name="buyerAddress" value={formData.buyerAddress} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Shipping Address (if different)</label>
              <input type="text" name="shippingAddress" value={formData.shippingAddress} onChange={handleInputChange} placeholder="Same as billing" className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Order & Invoice Details</div>
          <div className="compact-form-grid cols-3">
            <div className="compact-form-field">
              <label className="compact-form-label">Invoice No</label>
              <input type="text" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Order No</label>
              <input type="text" name="orderNumber" value={formData.orderNumber} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Invoice Date</label>
              <input type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option>Prepaid (UPI)</option>
                <option>Prepaid (Card)</option>
                <option>Prepaid (Net Banking)</option>
                <option>Cash on Delivery</option>
                <option>EMI</option>
              </select>
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Delivery Partner</label>
              <input type="text" name="deliveryPartner" value={formData.deliveryPartner} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Line Items</div>
          {formData.items.map((item, index) => (
            <div key={index} className="line-items-row" style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 120px', minWidth: 0 }}>
                <label className="compact-form-label">Description</label>
                <input type="text" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} className="compact-form-input" />
              </div>
              <div style={{ flex: '1 1 56px', minWidth: 0 }}>
                <label className="compact-form-label">HSN</label>
                <input type="text" value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} className="compact-form-input" />
              </div>
              <div style={{ flex: '1 1 46px', minWidth: 0 }}>
                <label className="compact-form-label">Qty</label>
                <input type="number" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} className="compact-form-input" />
              </div>
              <div style={{ flex: '1 1 64px', minWidth: 0 }}>
                <label className="compact-form-label">Rate</label>
                <input type="number" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} className="compact-form-input" />
              </div>
              <div style={{ flex: '1 1 46px', minWidth: 0 }}>
                <label className="compact-form-label">Tax%</label>
                <input type="number" value={item.tax} onChange={(e) => handleItemChange(index, 'tax', e.target.value)} className="compact-form-input" />
              </div>
              <button onClick={() => removeItem(index)} style={{ flexShrink: 0, padding: '0.45rem 0.55rem', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', alignSelf: 'flex-end' }}>×</button>
            </div>
          ))}
          <button onClick={addItem} style={{ marginTop: '0.5rem', padding: '0.45rem 0.75rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>+ Add Item</button>
        </div>

        {/* Other Charges */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Other Charges</div>
          <div className="compact-form-grid cols-3">
            <div className="compact-form-field">
              <label className="compact-form-label">Shipping (₹)</label>
              <input type="number" name="shippingCharges" value={formData.shippingCharges} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Packaging (₹)</label>
              <input type="number" name="packagingFee" value={formData.packagingFee} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Discount (₹)</label>
              <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        
        {/* Signature Upload */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Signature Image</div>
          <div style={{ marginBottom: '5px' }}>
            {formData.signatureUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={formData.signatureUrl} alt="Signature" style={{ width: '80px', height: '40px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px' }} />
                <button onClick={handleRemoveSignature} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>Remove Sig</button>
              </div>
            ) : (
              <div>
                <input type="file" accept="image/*" onChange={handleSignatureUpload} style={{ display: 'block', fontSize: '12px' }} />
                <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0' }}>Upload authorized signature image</p>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Upload */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">QR Code</div>
          <div style={{ marginBottom: '5px' }}>
            {formData.qrCodeUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={formData.qrCodeUrl} alt="QR Code" style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px' }} />
                <button onClick={handleRemoveQr} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>Remove QR</button>
              </div>
            ) : (
              <div>
                <input type="file" accept="image/*" onChange={handleQrUpload} style={{ display: 'block', fontSize: '12px' }} />
                <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0' }}>Upload QR code image (shown on invoice footer)</p>
              </div>
            )}
          </div>
        </div>

        {/* Bill Description */}
        <div className="bill-description-section">
          <h3 className="bill-description-title">{billDescription.title}</h3>
          <p className="bill-description-text">{billDescription.text}</p>
          <div className="bill-features-list">
            {billDescription.features.map((feature, i) => (
              <div key={i} className="bill-feature-item">
                <svg className="bill-feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </div>
            ))}
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
            <InvoiceCanvas ref={canvasRef} data={formData} template={currentTemplate} />
            <Watermark show={showWatermark} />
          </div>
        </PreviewScaler>

        <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
          Watermark will be removed from actual pdf
        </p>
      </div>

      {/* Fullscreen Modal */}
      <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <InvoiceCanvas data={formData} template={currentTemplate} />
      </FullscreenModal>

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        canvasRef={canvasRef}
        defaultFilename={`invoice-${formData.invoiceNumber}`}
        billType="Invoice"
        billData={{
          invoiceId: formData.invoiceNumber,
          orderNumber: formData.orderNumber,
          vendorName: formData.sellerName,
          vendorAddress: formData.sellerAddress,
          vendorGst: formData.sellerGSTIN,
          customerName: formData.buyerName,
          customerPhone: formData.buyerPhone,
          shippingAddress: formData.shippingAddress || formData.buyerAddress,
          items: formData.items,
          rate: formData.items?.reduce((sum, i) => sum + i.rate * i.qty, 0) || 0,
          quantity: formData.items?.reduce((sum, i) => sum + i.qty, 0) || 1,
          total: formData.items?.reduce((sum, i) => sum + i.rate * i.qty * (1 + i.tax / 100), 0) - formData.discount + formData.shippingCharges + formData.packagingFee || 0,
          paymentMethod: formData.paymentMode,
          date: formData.invoiceDate,
          description: formData.items?.map(i => i.description).join(', ') || 'Invoice',
          formDataCopy: { ...formData }
        }}
      />
    </div>
  );
}

