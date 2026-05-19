import React, { useState, useRef } from 'react';
import ElectricBillCanvas from '../canvas/ElectricBillCanvas';
import TemplateSelector from '../TemplateSelector';
import FullscreenModal from '../FullscreenModal';
import Watermark from '../Watermark';
import DownloadModal from '../DownloadModal';
import PreviewScaler from '../PreviewScaler';
import { buildExportFilename, firstValidationError } from './templateUtils';

const templates = [
  {
    id: 'bescom',
    name: 'Utility Classic',
    description: 'Generic modern utility bill - Corporate style',
    brand: 'ABC Energy',
    logoMark: 'ABC',
    format: 'a4',
    style: 'utility-classic',
    colors: { primary: '#1e3a8a', secondary: '#b45309', accent: '#fbbf24', bg: '#ffffff' }
  },
  {
    id: 'msedcl',
    name: 'MSEDCL',
    description: 'Maharashtra Electricity - Red classic',
    brand: 'MSEDCL',
    logoMark: '?',
    format: 'a4',
    style: 'classic-msedcl',
    colors: { primary: '#DC2626', secondary: '#991B1B', accent: '#000000', bg: '#FEF2F2' }
  },
  {
    id: 'tpddl',
    name: 'Tata Power Delhi',
    description: 'TPDDL smart meter - Modern cyan',
    brand: 'TPDDL',
    logoMark: '?',
    format: 'a4',
    style: 'modern-tpddl',
    colors: { primary: '#0891B2', secondary: '#0E7490', accent: '#F59E0B', bg: '#ECFEFF' }
  },
  {
    id: 'cesc',
    name: 'CESC Kolkata',
    description: 'CESC classic format - Purple theme',
    brand: 'CESC',
    logoMark: '?',
    format: 'a4',
    style: 'classic-cesc',
    colors: { primary: '#7C3AED', secondary: '#6D28D9', accent: '#FFA500', bg: '#FAF5FF' }
  },
  {
    id: 'tangedco',
    name: 'TANGEDCO',
    description: 'Tamil Nadu EB - Government format',
    brand: 'TANGEDCO',
    logoMark: '?',
    format: 'a4',
    style: 'government-tneb',
    colors: { primary: '#0F172A', secondary: '#1E293B', accent: '#F97316', bg: '#F8FAFC' }
  }
];

const billDescription = {
  title: 'Electricity Bill / EB Bill',
  text: 'Generate authentic electricity bills for major Indian distribution companies. Ideal for house rent agreements, expense reports, and utility verification.',
  features: [
    'All major state boards',
    'LT & HT consumer categories',
    'Meter reading details',
    'Tax & duty breakdown',
    'Due date tracking'
  ]
};

export default function ElectricBillTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState('bescom');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const canvasRef = useRef(null);
  const [showWatermark, setShowWatermark] = useState(true);

  const [formData, setFormData] = useState({
    billNumber: '12345678910',
    billDate: '2024-09-15',
    dueDate: '2024-09-29',
    billingPeriod: 'Sept 2024',
    boardName: 'ABC Energy',
    boardAddress: '123 ABC Street, ABC City, ST 12345\n(123) 456-7890',
    consumerName: 'Mary Jane Smith',
    consumerNumber: '12345678910',
    consumerAddress: '1300 GRANITE ST, LANSING KS 66043-6275',
    category: 'LT-2(a) Domestic',
    meterNumber: 'MTR-87541203',
    previousReading: '42180',
    currentReading: '42380',
    sanctionedLoad: '5 kW',
    energyCharges: 2000.00,
    fixedCharges: 85.00,
    wheelingCharges: 42.50,
    electricityDuty: 85.30,
    taxes: 144.11,
    arrears: 0,
    totalAmount: 2050.00,
    paymentMode: 'Online',
    paymentTxnId: 'EBTXN77291',
    paymentRefId: 'EBREF2108',
    upiRef: 'UPI889977',
    cardLast4: '',
    statementDate: '2024-09-15',
    periodFrom: '2024-09-01',
    periodTo: '2024-09-10',
    usageKwh: 200,
    costPerKwh: 10,
    previousCharges: 50.00,
    billTitle: 'UTILITY BILL',
    footerUrl: 'utilitybillform.com',
    reminders: [
      "Present your Statement of Account when paying your utility bill.",
      "Without this document, you must provide the account number, account name, and amount to be paid.",
      "Please check your online accounts after payment to ensure the payment is pushed through."
    ]
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;

    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      // Auto-calculate total
      if (['energyCharges', 'fixedCharges', 'wheelingCharges', 'electricityDuty', 'taxes', 'arrears'].includes(name)) {
        updated.totalAmount = (
          (updated.energyCharges || 0) +
          (updated.fixedCharges || 0) +
          (updated.wheelingCharges || 0) +
          (updated.electricityDuty || 0) +
          (updated.taxes || 0) +
          (updated.arrears || 0)
        ).toFixed(2);
      }
      return updated;
    });
  };

  const handleReminderChange = (index, value) => {
    const newReminders = [...formData.reminders];
    newReminders[index] = value;
    setFormData(prev => ({ ...prev, reminders: newReminders }));
  };

  const addReminder = () => {
    setFormData(prev => ({ ...prev, reminders: [...prev.reminders, ""] }));
  };

  const removeReminder = (index) => {
    setFormData(prev => ({ ...prev, reminders: prev.reminders.filter((_, i) => i !== index) }));
  };

  const handleDownload = () => {
    const validationError = firstValidationError([
      { valid: !!formData.billDate, message: 'Bill date is required.' },
      { valid: !!formData.dueDate, message: 'Due date is required.' }
    ]);
    if (validationError) {
      window.BillGenUI?.notify ? window.BillGenUI.notify(validationError, { type: 'warning', title: 'Missing Required Fields', duration: 4200 }) : window.alert(validationError);
      return;
    }
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

        {/* Custom Header & Labels */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Custom Header & Labels</div>
          <div className="compact-form-grid">
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Bill Title</label>
              <input type="text" name="billTitle" value={formData.billTitle} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Company Name</label>
              <input type="text" name="boardName" value={formData.boardName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Company Address</label>
              <textarea name="boardAddress" value={formData.boardAddress} onChange={handleInputChange} className="compact-form-input" rows="2" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Footer URL/Text</label>
              <input type="text" name="footerUrl" value={formData.footerUrl} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Utility Statement Dates */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Utility Statement Dates</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Statement Date</label>
              <input type="date" name="statementDate" value={formData.statementDate} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Period From</label>
              <input type="date" name="periodFrom" value={formData.periodFrom} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Period Until</label>
              <input type="date" name="periodTo" value={formData.periodTo} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Usage Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Usage Details</div>
          <div className="compact-form-grid cols-3">
            <div className="compact-form-field">
              <label className="compact-form-label">Usage (kWh)</label>
              <input type="number" name="usageKwh" value={formData.usageKwh} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Cost per kWh</label>
              <input type="number" step="0.01" name="costPerKwh" value={formData.costPerKwh} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Previous Charges ($)</label>
              <input type="number" step="0.01" name="previousCharges" value={formData.previousCharges} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Bill Reminders */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Bill Reminders</div>
          {formData.reminders.map((reminder, index) => (
            <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
              <input
                type="text"
                value={reminder}
                onChange={(e) => handleReminderChange(index, e.target.value)}
                className="compact-form-input"
                style={{ flex: 1 }}
              />
              <button onClick={() => removeReminder(index)} className="remove-btn" style={{ padding: '0 8px', color: '#ef4444' }}>✕</button>
            </div>
          ))}
          <button onClick={addReminder} className="add-item-btn" style={{ marginTop: '5px', fontSize: '0.75rem' }}>+ Add Reminder</button>
        </div>

        {/* Consumer Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Consumer Details</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Consumer Name</label>
              <input type="text" name="consumerName" value={formData.consumerName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">CA / Consumer No</label>
              <input type="text" name="consumerNumber" value={formData.consumerNumber} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Consumer Address</label>
              <input type="text" name="consumerAddress" value={formData.consumerAddress} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option>LT-2(a) Domestic</option>
                <option>LT-2(b) Non-Domestic</option>
                <option>LT-3 Commercial</option>
                <option>LT-4 Industrial</option>
                <option>HT-2 Commercial</option>
              </select>
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Sanctioned Load</label>
              <input type="text" name="sanctionedLoad" value={formData.sanctionedLoad} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Bill & Meter Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Bill & Meter Details</div>
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
              <label className="compact-form-label">Meter Number</label>
              <input type="text" name="meterNumber" value={formData.meterNumber} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Prev Reading</label>
              <input type="number" name="previousReading" value={formData.previousReading} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Curr Reading</label>
              <input type="number" name="currentReading" value={formData.currentReading} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Charges */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Charges Breakdown (Legacy)</div>
          <div className="compact-form-grid cols-3">
            <div className="compact-form-field">
              <label className="compact-form-label">Energy Charges</label>
              <input type="number" step="0.01" name="energyCharges" value={formData.energyCharges} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Fixed Charges</label>
              <input type="number" step="0.01" name="fixedCharges" value={formData.fixedCharges} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Wheeling Chrg</label>
              <input type="number" step="0.01" name="wheelingCharges" value={formData.wheelingCharges} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Elec. Duty</label>
              <input type="number" step="0.01" name="electricityDuty" value={formData.electricityDuty} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Tax/Cess</label>
              <input type="number" step="0.01" name="taxes" value={formData.taxes} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Arrears</label>
              <input type="number" step="0.01" name="arrears" value={formData.arrears} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">Total Amount (?)</label>
              <input type="number" step="0.01" name="totalAmount" value={formData.totalAmount} onChange={handleInputChange} className="compact-form-input" style={{ fontWeight: '700', fontSize: '0.95rem' }} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Billing Period</label>
              <input type="text" name="billingPeriod" value={formData.billingPeriod} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option>Online</option>
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
            <ElectricBillCanvas ref={canvasRef} data={formData} template={currentTemplate} />
            <Watermark show={showWatermark} />
          </div>
        </PreviewScaler>

        <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
          Watermark will be removed from actual pdf
        </p>
      </div>

      {/* Fullscreen Modal */}
      <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <ElectricBillCanvas data={formData} template={currentTemplate} />
      </FullscreenModal>

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        canvasRef={canvasRef}
        defaultFilename={buildExportFilename('Electric Bill', formData.billNumber, formData.billDate)}
        billType="Electric Bill"
        billData={{
          invoiceId: formData.billNumber,
          vendorName: formData.boardName,
          vendorAddress: formData.boardAddress,
          customerName: formData.consumerName,
          consumerNumber: formData.consumerNumber,
          meterNumber: formData.meterNumber,
          previousReading: formData.previousReading,
          currentReading: formData.currentReading,
          rate: formData.energyCharges,
          quantity: parseInt(formData.currentReading) - parseInt(formData.previousReading) || 1,
          total: formData.totalAmount,
          paymentMethod: formData.paymentMode,
          paymentTxnId: formData.paymentTxnId,
          paymentRefNo: formData.paymentRefId,
          upiRef: formData.upiRef,
          cardLast4: formData.cardLast4,
          date: formData.billDate,
          dueDate: formData.dueDate,
          description: `Units: ${parseInt(formData.currentReading) - parseInt(formData.previousReading) || 0} | Period: ${formData.billingPeriod}`,
          formDataCopy: { ...formData }
        }}
      />
    </div>
  );
}

