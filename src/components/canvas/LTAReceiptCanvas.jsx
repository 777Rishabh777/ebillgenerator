import React from 'react';
import { getLogoStyle } from './logoTheme';

const LTAReceiptCanvas = React.forwardRef(({ data, template }, ref) => {
  const styleClass = `style-${(template.billingStyle || 'premium').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const logoToken = (template.logoMark || (template.brand || template.name || 'BG').slice(0, 2)).toUpperCase();
  const logoStyle = getLogoStyle(template.brand || template.name || template.id || logoToken);

  return (
    <div ref={ref} data-template={template.id} className={`bill-canvas ${styleClass} bg-white rounded-lg shadow-lg p-8 border border-gray-200 overflow-auto`} style={{ width: '595px', minHeight: '700px', boxSizing: 'border-box' }}>
      <div className="bill-brand-strip">
        <div className="bill-brand-meta">
          <span className="bill-logo-token" style={logoStyle}>{logoToken}</span>
          <div>
            <p className="bill-brand-name">{template.brand || data.companyName}</p>
            <p className="bill-style-name">{template.billingStyle || 'Premium Billing Style'}</p>
          </div>
        </div>
        <span className="bill-ad-chip">{template.adCopy || 'Corporate Travel Reimbursement'}</span>
      </div>

      <div className="pb-6 border-b-4 mb-6" style={{ borderColor: template.colors.primary }}>
        <div className="inline-block px-6 py-2 rounded-lg text-white font-bold text-xl mb-4" style={{ backgroundColor: template.colors.primary }}>
          LTA RECEIPT
        </div>
        <h1 className="text-3xl font-bold mt-4" style={{ color: template.colors.primary }}>{data.companyName}</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8 pb-8 border-b">
        <div>
          <p className="text-gray-600 text-xs uppercase font-semibold mb-2">Receipt #</p>
          <p className="text-lg font-bold">{data.receiptNumber}</p>
        </div>
        <div>
          <p className="text-gray-600 text-xs uppercase font-semibold mb-2">Date</p>
          <p className="text-lg font-bold">{data.date}</p>
        </div>
        <div>
          <p className="text-gray-600 text-xs uppercase font-semibold mb-2">Journey Date</p>
          <p className="text-lg font-bold">{data.journeyDate}</p>
        </div>
      </div>

      <div className="mb-8 p-4 rounded-lg" style={{ backgroundColor: template.colors.bg }}>
        <p className="text-sm uppercase font-semibold text-gray-700 mb-3" style={{ color: template.colors.primary }}>Employee Information</p>
        <div className="text-sm text-gray-800 space-y-1">
          <p><span className="font-semibold">Name:</span> {data.employeeName}</p>
          <p><span className="font-semibold">Email:</span> {data.employeeEmail}</p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-sm uppercase font-semibold text-gray-700 mb-3" style={{ color: template.colors.primary }}>Journey Details</p>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-800">
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">From</p>
            <p className="font-semibold text-lg">{data.source}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">To</p>
            <p className="font-semibold text-lg">{data.destination}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <table className="w-full">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3 text-gray-800">Transport Mode</td>
              <td className="text-right px-4 py-3 text-gray-800 font-semibold">{data.transportMode}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3 text-gray-800">Ticket Number</td>
              <td className="text-right px-4 py-3 text-gray-800 font-semibold">{data.ticketNumber}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3 text-gray-800">Purpose</td>
              <td className="text-right px-4 py-3 text-gray-800 font-semibold">{data.purpose}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="flex justify-between py-3 px-4 rounded-lg text-white font-bold text-lg" style={{ backgroundColor: template.colors.primary }}>
            <span>Total Amount:</span>
            <span>Rs {data.amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {data.remarks && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-2">REMARKS</p>
          <p className="text-gray-800 text-sm">{data.remarks}</p>
        </div>
      )}
    </div>
  );
});

LTAReceiptCanvas.displayName = 'LTAReceiptCanvas';

export default LTAReceiptCanvas;

