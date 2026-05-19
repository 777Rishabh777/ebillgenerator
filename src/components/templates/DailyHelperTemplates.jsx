import React, { useState, useRef } from 'react';
import DailyHelperCanvas from '../canvas/DailyHelperCanvas';
import FullscreenModal from '../FullscreenModal';
import Watermark from '../Watermark';
import DownloadModal from '../DownloadModal';
import PreviewScaler from '../PreviewScaler';

const templateStyles = [
  { id: 'template1', name: 'Professional', description: 'Formal certificate with signature lines' },
  { id: 'template2', name: 'Acknowledgement', description: 'Two-section format with revenue stamp' },
  { id: 'template3', name: 'Tax Compliance', description: 'Detailed format for income tax purposes' }
];

export default function DailyHelperTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const canvasRef = useRef(null);
  const [showWatermark, setShowWatermark] = useState(true);
  
  const [formData, setFormData] = useState({
    receiptNumber: 'DH-APR-2091',
    paymentDate: new Date().toISOString().split('T')[0],
    salaryMonth: new Date().toISOString().slice(0, 7),
    helperName: 'Savita Kumari',
    workingAs: 'Housekeeping',
    employeeName: 'Rahul Mehta',
    salaryAmount: 14500,
    employeeEmail: 'rahul.mehta@example.com'
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const currentTemplate = { templateStyle: selectedTemplate };

  return (
    <div className="template-workspace">
      <div className="template-form-column">
        {/* Template Style Selector */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            <span className="text-amber-500">📋</span> Select Template Style
          </h3>
          <div className="grid gap-2">
            {templateStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedTemplate(style.id)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedTemplate === style.id
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-sm">{style.name}</div>
                <div className="text-xs text-gray-500">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Receipt Info</h3>
          <div className="space-y-2">
            <input type="text" name="receiptNumber" value={formData.receiptNumber} onChange={handleInputChange} placeholder="Receipt Number" className="billgen-input" />
            <input type="month" name="salaryMonth" value={formData.salaryMonth} onChange={handleInputChange} className="billgen-input" />
            <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleInputChange} className="billgen-input" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Helper Details</h3>
          <div className="space-y-2">
            <input type="text" name="helperName" value={formData.helperName} onChange={handleInputChange} placeholder="Helper Name" className="billgen-input" />
            <input type="text" name="workingAs" value={formData.workingAs} onChange={handleInputChange} placeholder="Nature of Work (Cook, Maid, etc.)" className="billgen-input" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Employer Details</h3>
          <div className="space-y-2">
            <input type="text" name="employeeName" value={formData.employeeName} onChange={handleInputChange} placeholder="Employer Name" className="billgen-input" />
            <input type="email" name="employeeEmail" value={formData.employeeEmail} onChange={handleInputChange} placeholder="Email" className="billgen-input" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Salary Amount</h3>
          <input type="number" name="salaryAmount" value={formData.salaryAmount} onChange={handleInputChange} placeholder="Amount" className="billgen-input" />
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
            <DailyHelperCanvas ref={canvasRef} data={formData} template={currentTemplate} />
            <Watermark show={showWatermark} />
          </div>
        </PreviewScaler>
        
        <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
          Watermark will be removed from actual pdf
        </p>
      </div>

      {/* Fullscreen Modal */}
      <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <DailyHelperCanvas data={formData} template={currentTemplate} />
      </FullscreenModal>

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        canvasRef={canvasRef}
        defaultFilename={`daily-helper-${formData.receiptNumber}`}
        billType="Daily Helper Receipt"
        billData={{
          invoiceId: formData.receiptNumber,
          vendorName: formData.helperName,
          customerName: formData.employeeName,
          customerEmail: formData.employeeEmail,
          workingAs: formData.workingAs,
          rate: formData.salaryAmount,
          quantity: 1,
          total: formData.salaryAmount,
          paymentMethod: 'Cash',
          date: formData.paymentDate,
          description: `${formData.workingAs} Salary for ${formData.salaryMonth}`,
          formDataCopy: { ...formData }
        }}
      />
    </div>
  );
}

