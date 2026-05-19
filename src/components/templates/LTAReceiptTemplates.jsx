import React, { useState, useRef } from 'react';
import LTAReceiptCanvas from '../canvas/LTAReceiptCanvas';
import TemplateSelector from '../TemplateSelector';
import PreviewColumn from '../PreviewColumn';
import FullscreenModal from '../FullscreenModal';
import Watermark from '../Watermark';
import DownloadModal from '../DownloadModal';
import PreviewScaler from '../PreviewScaler';

const templates = [
  {
    id: 'travel',
    name: 'Travel',
    description: 'Travel desk reimbursement format with ticket summary',
    brand: 'MakeMyTrip Corporate',
    logoMark: 'MM',
    billingStyle: 'Official Statement',
    adCopy: 'Corporate LTA reimbursement copy',
    tagline: 'Submit original tickets with this receipt for claim processing.',
    colors: { primary: '#0891B2', secondary: '#0E7490', bg: '#CFFAFE' }
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Formal LTA docket aligned with enterprise policy',
    brand: 'Yatra for Business',
    logoMark: 'YB',
    billingStyle: 'Corporate Grid',
    adCopy: 'Policy compliant business travel copy',
    tagline: 'Finance approval subject to travel policy validation.',
    colors: { primary: '#1E40AF', secondary: '#1E3A8A', bg: '#DBEAFE' }
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Digital journey bill with concise settlement view',
    brand: 'EaseMyTrip Work',
    logoMark: 'EW',
    billingStyle: 'Modern Digital',
    adCopy: 'E-ticket reimbursement statement',
    tagline: 'Generated from synced itinerary and booking IDs.',
    colors: { primary: '#7C3AED', secondary: '#6D28D9', bg: '#F5F3FF' }
  },
  {
    id: 'official',
    name: 'Official',
    description: 'Policy-first format for HR and payroll audits',
    brand: 'xyz HR Travel Desk',
    logoMark: 'NH',
    billingStyle: 'Legal Format',
    adCopy: 'Audit-ready reimbursement copy',
    tagline: 'Retain this statement for annual tax documentation.',
    colors: { primary: '#0F172A', secondary: '#1E293B', bg: '#E2E8F0' }
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Minimal receipt for straightforward route claims',
    brand: 'IndiGo Corporate Connect',
    logoMark: 'IG',
    billingStyle: 'Digital Summary',
    adCopy: 'Compact journey settlement copy',
    tagline: 'Use ticket number as reference for support requests.',
    colors: { primary: '#2563EB', secondary: '#1D4ED8', bg: '#EFF6FF' }
  }
];

export default function LTAReceiptTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState('travel');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const canvasRef = useRef(null);
  const [showWatermark, setShowWatermark] = useState(true);
  const [formData, setFormData] = useState({
    receiptNumber: 'LTA-2025-319',
    date: new Date().toISOString().split('T')[0],
    employeeName: 'Rahul Verma',
    employeeEmail: 'rahul.verma@xyz.in',
    companyName: 'xyz Technologies Pvt Ltd',
    source: 'Bengaluru',
    destination: 'Delhi',
    journeyDate: new Date().toISOString().split('T')[0],
    transportMode: 'Flight',
    ticketNumber: '6E-8421-9934',
    amount: 12840,
    purpose: 'Annual Leave Travel Assistance',
    remarks: 'Round trip airfare claim approved by reporting manager.',
    brandName: '',
    logoMark: '',
    billingStyle: '',
    adCopy: '',
    tagline: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  const mergedTemplate = currentTemplate ? {
    ...currentTemplate,
    brand: formData.brandName || currentTemplate.brand,
    logoMark: formData.logoMark || currentTemplate.logoMark,
    billingStyle: formData.billingStyle || currentTemplate.billingStyle,
    adCopy: formData.adCopy || currentTemplate.adCopy,
    tagline: formData.tagline || currentTemplate.tagline,
  } : currentTemplate;

  return (
    <div className="template-workspace">
      <div className="template-form-column">
        <TemplateSelector
          templates={templates}
          selectedTemplate={selectedTemplate}
          onSelect={setSelectedTemplate}
        />

        {/* Editable Branding */}
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            <span className="text-blue-500">?</span> Template Branding <span className="text-[9px] text-gray-400 normal-case">(edit to customize)</span>
          </h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" name="brandName" value={formData.brandName} onChange={handleInputChange} placeholder={currentTemplate?.brand || 'Brand Name'} className="billgen-input" />
              <input type="text" name="logoMark" value={formData.logoMark} onChange={handleInputChange} placeholder={currentTemplate?.logoMark || 'Logo Text'} className="billgen-input" />
            </div>
            <input type="text" name="adCopy" value={formData.adCopy} onChange={handleInputChange} placeholder={currentTemplate?.adCopy || 'Ad Copy / Subtitle'} className="billgen-input" />
            <input type="text" name="tagline" value={formData.tagline} onChange={handleInputChange} placeholder={currentTemplate?.tagline || 'Tagline / Footer Text'} className="billgen-input" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Receipt Info</h3>
          <div className="space-y-2">
            <input type="text" name="receiptNumber" value={formData.receiptNumber} onChange={handleInputChange} placeholder="Receipt Number" className="billgen-input" />
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="billgen-input" />
            <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="Company Name" className="billgen-input" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Employee Details</h3>
          <div className="space-y-2">
            <input type="text" name="employeeName" value={formData.employeeName} onChange={handleInputChange} placeholder="Employee Name" className="billgen-input" />
            <input type="email" name="employeeEmail" value={formData.employeeEmail} onChange={handleInputChange} placeholder="Email" className="billgen-input" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Journey Details</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" name="source" value={formData.source} onChange={handleInputChange} placeholder="From" className="billgen-input" />
              <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} placeholder="To" className="billgen-input" />
            </div>
            <input type="date" name="journeyDate" value={formData.journeyDate} onChange={handleInputChange} className="billgen-input" />
            <select name="transportMode" value={formData.transportMode} onChange={handleInputChange} className="billgen-input">
              <option>Flight</option>
              <option>Train</option>
              <option>Bus</option>
              <option>Car</option>
            </select>
            <input type="text" name="ticketNumber" value={formData.ticketNumber} onChange={handleInputChange} placeholder="Ticket Number" className="billgen-input" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Amount & Purpose</h3>
          <div className="space-y-2">
            <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="Travel Amount" className="billgen-input" />
            <input type="text" name="purpose" value={formData.purpose} onChange={handleInputChange} placeholder="Purpose of Travel" className="billgen-input" />
            <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} placeholder="Remarks" className="billgen-input" rows="2" />
          </div>
        </div>
      </div>

      <div className="template-preview-column">
        <div className="preview-actions">
          <button className="preview-action-btn secondary" onClick={() => setIsFullscreen(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
            Fullscreen
          </button>
          <button className="preview-action-btn primary" onClick={() => setIsDownloadOpen(true)}>
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
          <LTAReceiptCanvas ref={canvasRef} data={formData} template={mergedTemplate} />
          <Watermark show={showWatermark} />
        </div>
        </PreviewScaler>
        
        <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
          Watermark will be removed from actual pdf
        </p>
      </div>

      {/* Fullscreen Modal */}
      <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <LTAReceiptCanvas data={formData} template={mergedTemplate} />
      </FullscreenModal>

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        canvasRef={canvasRef}
        defaultFilename={`lta-receipt-${formData.receiptNumber}`}
        billType="LTA Receipt"
        billData={{
          invoiceId: formData.receiptNumber,
          vendorName: formData.companyName,
          customerName: formData.employeeName,
          customerEmail: formData.employeeEmail,
          source: formData.source,
          destination: formData.destination,
          transportMode: formData.transportMode,
          ticketNumber: formData.ticketNumber,
          rate: formData.amount,
          quantity: 1,
          total: formData.amount,
          paymentMethod: 'Reimbursement',
          date: formData.date,
          description: `${formData.source} to ${formData.destination} - ${formData.transportMode}`,
          formDataCopy: { ...formData }
        }}
      />
    </div>
  );
}

