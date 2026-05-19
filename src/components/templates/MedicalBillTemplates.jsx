import React, { useState, useRef } from 'react';
import MedicalBillCanvas from '../canvas/MedicalBillCanvas';
import FullscreenModal from '../FullscreenModal';
import Watermark from '../Watermark';
import DownloadModal from '../DownloadModal';
import PreviewScaler from '../PreviewScaler';
import { buildExportFilename, firstValidationError, isValidPhone10 } from './templateUtils';

const templateStyles = [
  { id: 'template1', name: 'Modern Blue Invoice', desc: 'Professional hospital invoice format' },
  { id: 'template2', name: 'Green Patient Form', desc: 'Angelfield patient information' },
  { id: 'template3', name: 'Medical Fact Sheet', desc: 'Comprehensive medical fact sheet' }
];

const billDescription = {
  title: 'Medical Bill / Hospital Receipt',
  text: 'Generate authentic medical bills for hospital visits, OPD consultations, pharmacy purchases, and diagnostic tests. Perfect for insurance claims, tax deductions, and reimbursements.',
  features: [
    'Major hospital chains',
    'OPD & IPD billing',
    'Lab test receipts',
    'Pharmacy bills',
    'GST compliant'
  ]
};

export default function MedicalBillTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const canvasRef = useRef(null);
  const [showWatermark, setShowWatermark] = useState(true);

  const [formData, setFormData] = useState({
    billNumber: 'MED-2025-7741',
    billDate: new Date().toISOString().split('T')[0],
    hospitalName: 'Apollo Hospitals',
    hospitalAddress: 'Bannerghatta Road, Bengaluru - 560076',
    hospitalPhone: '080-2630-4050',
    patientName: 'Kunal Sharma',
    patientId: 'AP000847521',
    patientAge: 34,
    patientGender: 'Male',
    patientPhone: '9876543210',
    patientAddress: 'HSR Layout, Bengaluru',
    doctorName: 'Dr. R. Menon',
    doctorDept: 'General Medicine',
    visitType: 'OPD',
    consultationFee: 900,
    medicineCost: 1850,
    testsCost: 2400,
    treatmentCost: 1200,
    roomCharges: 0,
    otherCharges: 0,
    discount: 0,
    totalAmount: 6350,
    paymentMode: 'Cash',
    paymentTxnId: 'MEDTXN20911',
    paymentRefId: 'MEDREF8012',
    upiRef: '',
    cardLast4: '4521',
    remarks: 'Follow-up after 7 days with all reports.',
    logoUrl: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      if (['consultationFee', 'medicineCost', 'testsCost', 'treatmentCost', 'roomCharges', 'otherCharges', 'discount'].includes(name)) {
        updated.totalAmount = (
          (updated.consultationFee || 0) + 
          (updated.medicineCost || 0) + 
          (updated.testsCost || 0) +
          (updated.treatmentCost || 0) +
          (updated.roomCharges || 0) +
          (updated.otherCharges || 0) -
          (updated.discount || 0)
        ).toFixed(2);
      }
      return updated;
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, logoUrl: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleDownload = () => {
    const validationError = firstValidationError([
      { valid: !!formData.billDate, message: 'Bill date is required.' },
      { valid: formData.hospitalPhone?.trim() || true, message: 'Hospital phone must be 10 digits.' },
      { valid: formData.patientPhone?.trim() || true, message: 'Patient phone must be 10 digits.' }
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
        {/* Template Selector */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Choose Template</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {templateStyles.map(temp => (
              <button
                key={temp.id}
                onClick={() => setSelectedTemplate(temp.id)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: selectedTemplate === temp.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  background: selectedTemplate === temp.id ? '#eff6ff' : '#fff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: selectedTemplate === temp.id ? '600' : '400',
                  color: selectedTemplate === temp.id ? '#1e40af' : '#64748b',
                  transition: 'all 0.2s'
                }}
              >
                {temp.name}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Upload */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Hospital/Clinic Logo</div>
          {formData.logoUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={formData.logoUrl} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px' }} />
              <button onClick={handleRemoveLogo} style={{ padding: '0.4rem 0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                Remove Logo
              </button>
            </div>
          ) : (
            <div>
              <input type="file" id="logo-upload" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              <label htmlFor="logo-upload" style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '500' }}>
                Upload Logo
              </label>
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Upload hospital/clinic logo or leave blank for text initials
              </p>
            </div>
          )}
        </div>

        {/* Hospital Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Hospital / Clinic</div>
          <div className="compact-form-grid">
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Hospital Name</label>
              <input type="text" name="hospitalName" value={formData.hospitalName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Address</label>
              <input type="text" name="hospitalAddress" value={formData.hospitalAddress} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Phone</label>
              <input type="text" name="hospitalPhone" value={formData.hospitalPhone} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Bill Number</label>
              <input type="text" name="billNumber" value={formData.billNumber} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Patient Details</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Patient Name</label>
              <input type="text" name="patientName" value={formData.patientName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Patient ID</label>
              <input type="text" name="patientId" value={formData.patientId} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Age</label>
              <input type="number" name="patientAge" value={formData.patientAge} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Gender</label>
              <select name="patientGender" value={formData.patientGender} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Patient Address</label>
              <input type="text" name="patientAddress" value={formData.patientAddress} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Visit & Doctor */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Visit Details</div>
          <div className="compact-form-grid cols-3">
            <div className="compact-form-field">
              <label className="compact-form-label">Bill Date</label>
              <input type="date" name="billDate" value={formData.billDate} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Visit Type</label>
              <select name="visitType" value={formData.visitType} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option>OPD</option>
                <option>IPD</option>
                <option>Emergency</option>
                <option>Day Care</option>
              </select>
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option>Cash</option>
                <option>Card</option>
                <option>UPI</option>
                <option>Insurance</option>
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
            <div className="compact-form-field">
              <label className="compact-form-label">Card Last 4</label>
              <input type="text" name="cardLast4" value={formData.cardLast4} onChange={handleInputChange} className="compact-form-input" maxLength={4} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Doctor Name</label>
              <input type="text" name="doctorName" value={formData.doctorName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field" style={{ gridColumn: 'span 2' }}>
              <label className="compact-form-label">Department</label>
              <input type="text" name="doctorDept" value={formData.doctorDept} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Cost Breakdown</div>
          <div className="compact-form-grid cols-3">
            <div className="compact-form-field">
              <label className="compact-form-label">Consultation</label>
              <input type="number" step="0.01" name="consultationFee" value={formData.consultationFee} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Medicines</label>
              <input type="number" step="0.01" name="medicineCost" value={formData.medicineCost} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Tests/Diagnostics</label>
              <input type="number" step="0.01" name="testsCost" value={formData.testsCost} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Treatment</label>
              <input type="number" step="0.01" name="treatmentCost" value={formData.treatmentCost} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Room Charges</label>
              <input type="number" step="0.01" name="roomCharges" value={formData.roomCharges} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Discount</label>
              <input type="number" step="0.01" name="discount" value={formData.discount} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">Total Amount (?)</label>
              <input type="number" step="0.01" name="totalAmount" value={formData.totalAmount} onChange={handleInputChange} className="compact-form-input" style={{ fontWeight: '700', fontSize: '0.95rem' }} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Remarks</label>
              <input type="text" name="remarks" value={formData.remarks} onChange={handleInputChange} className="compact-form-input" />
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
          <MedicalBillCanvas ref={canvasRef} data={formData} template={{ templateStyle: selectedTemplate }} />
          <Watermark show={showWatermark} />
        </div>
        </PreviewScaler>
        
        <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
          Watermark will be removed from actual pdf
        </p>
      </div>

      {/* Fullscreen Modal */}
      <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <MedicalBillCanvas data={formData} template={{ templateStyle: selectedTemplate }} />
      </FullscreenModal>

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        canvasRef={canvasRef}
        defaultFilename={buildExportFilename('Medical Bill', formData.billNumber, formData.billDate)}
        billType="Medical Bill"
        billData={{
          invoiceId: formData.billNumber,
          vendorName: formData.hospitalName,
          vendorAddress: formData.hospitalAddress,
          customerName: formData.patientName,
          patientId: formData.patientId,
          doctorName: formData.doctorName,
          department: formData.doctorDept,
          visitType: formData.visitType,
          rate: formData.consultationFee,
          quantity: 1,
          total: formData.totalAmount,
          paymentMethod: formData.paymentMode,
          paymentTxnId: formData.paymentTxnId,
          paymentRefNo: formData.paymentRefId,
          upiRef: formData.upiRef,
          cardLast4: formData.cardLast4,
          date: formData.billDate,
          description: `${formData.visitType} - ${formData.doctorDept}`,
          formDataCopy: { ...formData }
        }}
      />
    </div>
  );
}

