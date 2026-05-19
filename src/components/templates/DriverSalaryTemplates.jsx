import React, { useState, useRef } from 'react';
import DriverSalaryCanvas from '../canvas/DriverSalaryCanvas';
import FullscreenModal from '../FullscreenModal';
import Watermark from '../Watermark';
import DownloadModal from '../DownloadModal';
import PreviewScaler from '../PreviewScaler';

const templateStyles = [
  { id: 'template1', name: 'Professional', description: 'Formal certificate with signature lines and notes' },
  { id: 'template2', name: 'Two-Section', description: 'Acknowledgement copy with revenue stamp' },
  { id: 'template3', name: 'Certificate', description: 'Detailed certification with stamp' }
];

export default function DriverSalaryTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const canvasRef = useRef(null);
  const [showWatermark, setShowWatermark] = useState(true);
  const [formData, setFormData] = useState({
    salaryNumber: 'SAL-APR-25104',
    month: new Date().toISOString().slice(0, 7),
    paymentDate: new Date().toISOString().split('T')[0],
    driverName: 'Vikram Singh',
    licenseNumber: 'DL0420190045612',
    vehicleNumber: 'DL1LAA9214',
    workDays: 26,
    dailyWage: 850,
    totalWage: 22100,
    deductions: 2100,
    employeeName: 'Rajesh Kumar',
    companyName: 'ABC Logistics Pvt Ltd',
    remarks: '',
    paperSize: 'A4'
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const nextValue = type === 'number' ? Number(value || 0) : value;

    setFormData(prev => {
      const next = { ...prev, [name]: nextValue };
      if (name === 'workDays' || name === 'dailyWage') {
        next.totalWage = (Number(next.workDays) || 0) * (Number(next.dailyWage) || 0);
      }
      return next;
    });
  };

  const currentTemplate = { templateStyle: selectedTemplate };

  return (
    <div className="template-workspace">
      <div className="template-form-column">
        {/* Template Style Selector */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            <span className="text-green-500">??</span> Select Template Style
          </h3>
          <div className="grid gap-2">
            {templateStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedTemplate(style.id)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedTemplate === style.id
                    ? 'border-green-500 bg-green-50'
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
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Salary Info</h3>
          <div className="space-y-2">
            <input type="text" name="salaryNumber" value={formData.salaryNumber} onChange={handleInputChange} placeholder="Salary Slip #" className="billgen-input" />
            <input type="month" name="month" value={formData.month} onChange={handleInputChange} className="billgen-input" />
            <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleInputChange} className="billgen-input" />
            <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="Company Name" className="billgen-input" />
            <select name="paperSize" value={formData.paperSize} onChange={handleInputChange} className="billgen-input">
              <option value="A4">Paper: A4</option>
              <option value="Letter">Paper: Letter</option>
              <option value="Legal">Paper: Legal</option>
            </select>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Driver Details</h3>
          <div className="space-y-2">
            <input type="text" name="driverName" value={formData.driverName} onChange={handleInputChange} placeholder="Driver Name" className="billgen-input" />
            <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} placeholder="License Number" className="billgen-input" />
            <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange} placeholder="Vehicle Number" className="billgen-input" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Employer Details</h3>
          <div className="space-y-2">
            <input type="text" name="employeeName" value={formData.employeeName} onChange={handleInputChange} placeholder="Employer/Employee Name" className="billgen-input" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Calculations</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Work Days</label>
              <input type="number" name="workDays" value={formData.workDays} onChange={handleInputChange} className="billgen-input" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Daily Wage</label>
              <input type="number" name="dailyWage" value={formData.dailyWage} onChange={handleInputChange} className="billgen-input" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Total Wage</label>
              <input type="number" name="totalWage" value={formData.totalWage} onChange={handleInputChange} className="billgen-input" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Deductions</label>
              <input type="number" name="deductions" value={formData.deductions} onChange={handleInputChange} className="billgen-input" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} placeholder="Remarks (optional)" className="billgen-input" rows="3" />
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
          <DriverSalaryCanvas ref={canvasRef} data={formData} template={currentTemplate} />
          <Watermark show={showWatermark} />
        </div>
        </PreviewScaler>
        
        <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
          Watermark will be removed from actual pdf
        </p>
      </div>

      {/* Fullscreen Modal */}
      <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <DriverSalaryCanvas data={formData} template={currentTemplate} />
      </FullscreenModal>

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        canvasRef={canvasRef}
        defaultFilename={`driver-salary-${formData.salaryNumber}`}
        billType="Driver Salary Slip"
        billData={{
          invoiceId: formData.salaryNumber,
          vendorName: formData.companyName,
          customerName: formData.driverName,
          licenseNumber: formData.licenseNumber,
          vehicleNumber: formData.vehicleNumber,
          workDays: formData.workDays,
          dailyWage: formData.dailyWage,
          rate: formData.dailyWage,
          quantity: formData.workDays,
          total: formData.totalWage - formData.deductions,
          paymentMethod: 'Cash',
          date: formData.paymentDate,
          description: `Salary for ${formData.month} - ${formData.workDays} days`,
          formDataCopy: { ...formData }
        }}
      />
    </div>
  );
}

