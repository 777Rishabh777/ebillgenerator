import React from 'react';
import stampImage from '../images/image.png';

const formatDate = (dateStr) => {
  if (!dateStr) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatMonth = (monthStr) => {
  if (!monthStr) return '';
  const d = new Date(monthStr + '-01');
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
};

const pageSizeStyle = (paperSize) => {
  const p = String(paperSize || 'A4').toLowerCase();
  if (p === 'letter') return { width: '816px', minHeight: '1056px' }; // 8.5 x 11 @96dpi
  if (p === 'legal') return { width: '816px', minHeight: '1344px' };  // 8.5 x 14 @96dpi
  return { width: '794px', minHeight: '1123px' }; // A4 @96dpi
};

// Template 1: Professional with signature lines and important notes
const Template1 = ({ data }) => {
  const netSalary = (Number(data.totalWage) || 0) - (Number(data.deductions) || 0);
  return (
    <div data-paper-root="true" style={{ ...pageSizeStyle(data.paperSize), fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: '1.65', background: '#fff', padding: '36px', color: '#333', boxSizing: 'border-box' }}>
      <h1 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>
        DRIVER SALARY RECEIPT
      </h1>
      
      <div style={{ marginBottom: '15px' }}>
        <span style={{ fontWeight: '700' }}>Date:</span> {formatDate(data.paymentDate)}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '700' }}>Paid By:</span> {data.employeeName || ''}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '700' }}>Driver's Name:</span> {data.driverName || ''}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <span style={{ fontWeight: '700' }}>Vehicle Number:</span> {data.vehicleNumber || ''}
      </div>
      
      <p style={{ marginBottom: '20px', lineHeight: '1.8' }}>
        This is to certify that has paid a sum of <strong>₹{netSalary} ({numberToWords(netSalary)} Rupees Only)</strong> to driver as salary for the month of <strong>{formatMonth(data.month)}</strong>. Thank you for your hard work and service.
      </p>
      
      <div style={{ marginTop: '30px', marginBottom: '20px' }}>
        <div style={{ fontWeight: '700', marginBottom: '10px' }}>Employer Signature:</div>
        <div style={{ marginBottom: '15px' }}>
          <span>By: </span>
          <span style={{ display: 'inline-block', width: '200px', borderBottom: '1px solid #333' }}></span>
          <span> (Signature)</span>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <span>Name: </span>
          <span style={{ display: 'inline-block', width: '200px', borderBottom: '1px solid #333' }}></span>
        </div>
        <div>
          <span>Date: </span>
          <span style={{ textDecoration: 'underline' }}>{formatDate(data.paymentDate)}</span>
        </div>
      </div>
      
      <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
        <div style={{ fontWeight: '700', marginBottom: '10px' }}>Important Notes:</div>
        <ol style={{ fontSize: '11px', color: '#555', paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>This receipt is proof of salary payment and should be retained for your records.</li>
          <li>Any additional expenses or allowances are not included in this receipt unless explicitly stated.</li>
          <li>This receipt does not waive any rights of the employer or employee under the employment agreement or local laws.</li>
        </ol>
      </div>
    </div>
  );
};

// Template 2: Two-section acknowledgement with stamp
const Template2 = ({ data }) => {
  const netSalary = (Number(data.totalWage) || 0) - (Number(data.deductions) || 0);
  return (
    <div data-paper-root="true" style={{ ...pageSizeStyle(data.paperSize), fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: '1.65', background: '#fff', padding: '34px', color: '#333', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'right', marginBottom: '10px', fontSize: '11px', color: '#666' }}>
        Date: {formatDate(data.paymentDate)}
      </div>
      
      <h1 style={{ textAlign: 'center', fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
        Driver Salary Receipt
      </h1>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '600' }}>Vehicle Number:</span> {data.vehicleNumber || ''}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '600' }}>Salary of the Month:</span> {formatMonth(data.month)}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '600' }}>Amount Paid:</span> ₹ {netSalary}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '600' }}>Date:</span> {formatDate(data.paymentDate)}
      </div>
      
      <p style={{ marginBottom: '15px' }}>
        Received From Mr./Ms. ₹ {netSalary} to driver towards salary of the month of {formatMonth(data.month)}
      </p>
      
      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <div style={{ fontWeight: '600' }}>Employee Name:</div>
        <div>{data.employeeName || ''}</div>
      </div>
      
      <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px', marginTop: '20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '14px', fontWeight: '700', marginBottom: '15px' }}>
          Receipt Acknowledgement
        </h2>
        
        <div style={{ marginBottom: '10px' }}>
          <span style={{ fontWeight: '600' }}>Salary of the Month:</span> {formatMonth(data.month)}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <span style={{ fontWeight: '600' }}>Amount Paid:</span> ₹ {netSalary}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <span style={{ fontWeight: '600' }}>Date:</span> {formatDate(data.paymentDate)}
        </div>
        
        <p style={{ marginBottom: '15px' }}>
          Received From Mr./Ms. ₹ {netSalary} to driver towards salary of the month of {formatMonth(data.month)}
        </p>
        
        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          <div style={{ fontWeight: '600' }}>Driver Name:</div>
          <div>{data.driverName || ''}</div>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>Revenue Stamp</div>
          <img src={stampImage} alt="Revenue Stamp" style={{ width: '50px', height: '60px', objectFit: 'contain' }} />
        </div>
      </div>
    </div>
  );
};

// Template 3: Detailed certificate style with stamp
const Template3 = ({ data }) => {
  const netSalary = (Number(data.totalWage) || 0) - (Number(data.deductions) || 0);
  return (
    <div data-paper-root="true" style={{ ...pageSizeStyle(data.paperSize), fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: '1.75', background: '#fff', padding: '36px', color: '#333', boxSizing: 'border-box' }}>
      <h1 style={{ textAlign: 'center', fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
        Driver Salary Receipt
      </h1>
      
      <p style={{ marginBottom: '20px', textAlign: 'justify' }}>
        This is to certify that I have paid ₹ {netSalary} to driver, Mr. {data.driverName || ''} for the month of {formatMonth(data.month)} (Acknowledged receipt enclosed). I also declare that the driver is exclusively utilized for official purpose only. Please reimburse the above amount. I further declare that what is stated above is correct and true.
      </p>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '700' }}>Employee Name:</span> {data.employeeName || ''}
      </div>
      
      <div style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <span style={{ fontWeight: '700' }}>Date:</span> {formatDate(data.paymentDate)}
      </div>
      
      <h2 style={{ textAlign: 'center', fontSize: '14px', fontWeight: '700', marginBottom: '15px' }}>
        Receipt Acknowledgement
      </h2>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '700' }}>Date of Receipt:</span> {formatDate(data.paymentDate)}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '700' }}>For the Month of:</span> {formatMonth(data.month)}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '700' }}>Name of Driver:</span> {data.driverName || ''}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <span style={{ fontWeight: '700' }}>Vehicle No:</span> {data.vehicleNumber || ''}
      </div>
      
      <p style={{ marginBottom: '20px' }}>
        Received a sum of ₹ {netSalary} only for the month from Mr / Mrs {data.employeeName || ''}.
      </p>
      
      <div style={{ marginTop: '25px' }}>
        <div style={{ fontWeight: '700', marginBottom: '8px' }}>Revenue Stamp</div>
        <img src={stampImage} alt="Revenue Stamp" style={{ width: '50px', height: '60px', objectFit: 'contain' }} />
      </div>
    </div>
  );
};

const DriverSalaryCanvas = React.forwardRef(({ data, template }, ref) => {
  const templateStyle = template?.templateStyle || 'template1';
  
  return (
    <div ref={ref}>
      {templateStyle === 'template1' && <Template1 data={data} />}
      {templateStyle === 'template2' && <Template2 data={data} />}
      {templateStyle === 'template3' && <Template3 data={data} />}
    </div>
  );
});

DriverSalaryCanvas.displayName = 'DriverSalaryCanvas';

export default DriverSalaryCanvas;

