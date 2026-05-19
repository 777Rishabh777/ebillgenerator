import React from 'react';
import stampImage from '../images/image.png';

function formatMonthValue(monthValue) {
  if (!monthValue) return 'N/A';
  const [year, month] = monthValue.split('-');
  if (!year || !month) return monthValue;
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return monthValue;
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDateValue(dateValue) {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return '0.00';
  return numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

// Template 1: Professional Domestic Staff Receipt
const Template1 = ({ data }) => {
  const amount = Number(data.salaryAmount) || 0;
  return (
    <div style={{ fontFamily: 'Georgia, serif', fontSize: '12px', lineHeight: '1.6', width: '595px', minHeight: '450px', background: '#fff', padding: '35px', color: '#333', boxSizing: 'border-box' }}>
      <h1 style={{ textAlign: 'center', fontSize: '20px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        DOMESTIC STAFF SALARY RECEIPT
      </h1>
      
      <div style={{ marginBottom: '15px' }}>
        <span style={{ fontWeight: '700' }}>Date:</span> {formatDateValue(data.paymentDate)}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '700' }}>Employer:</span> {data.employeeName || ''}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '700' }}>Helper Name:</span> {data.helperName || ''}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <span style={{ fontWeight: '700' }}>Nature of Work:</span> {data.workingAs || 'Domestic Help'}
      </div>
      
      <p style={{ marginBottom: '20px', lineHeight: '1.8' }}>
        This is to certify that a sum of <strong>₹{amount} ({numberToWords(amount)} Rupees Only)</strong> has been paid to the above mentioned domestic staff towards salary for the month of <strong>{formatMonthValue(data.salaryMonth)}</strong>. Thank you for your dedicated service.
      </p>
      
      <div style={{ marginTop: '30px', marginBottom: '20px' }}>
        <div style={{ fontWeight: '700', marginBottom: '10px' }}>Employer Signature:</div>
        <div style={{ marginBottom: '15px' }}>
          <span>By: </span>
          <span style={{ display: 'inline-block', width: '200px', borderBottom: '1px solid #333' }}></span>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <span>Name: </span>
          <span style={{ fontWeight: '600' }}>{data.employeeName || ''}</span>
        </div>
        <div>
          <span>Date: </span>
          <span>{formatDateValue(data.paymentDate)}</span>
        </div>
      </div>
      
      <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
        <div style={{ fontWeight: '700', marginBottom: '10px' }}>Important Notes:</div>
        <ol style={{ fontSize: '11px', color: '#555', paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>This receipt is proof of salary payment for domestic staff services.</li>
          <li>Please retain for tax exemption and reimbursement purposes.</li>
          <li>Additional allowances if any are not included in this receipt.</li>
        </ol>
      </div>
    </div>
  );
};

// Template 2: Formal Receipt with Acknowledgement Section and Stamp
const Template2 = ({ data }) => {
  const amount = Number(data.salaryAmount) || 0;
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', lineHeight: '1.6', width: '595px', minHeight: '580px', background: '#fff', padding: '30px', color: '#333', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'right', marginBottom: '10px', fontSize: '11px', color: '#666' }}>
        Date: {formatDateValue(data.paymentDate)}
      </div>
      
      <h1 style={{ textAlign: 'center', fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
        Domestic Helper Salary Receipt
      </h1>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '600' }}>Helper Name:</span> {data.helperName || ''}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '600' }}>Working As:</span> {data.workingAs || 'Domestic Help'}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '600' }}>Salary Month:</span> {formatMonthValue(data.salaryMonth)}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontWeight: '600' }}>Amount Paid:</span> ₹ {amount}
      </div>
      
      <p style={{ marginBottom: '15px' }}>
        Received From Mr./Ms. {data.employeeName || ''} the sum of ₹ {amount} towards salary for the month of {formatMonthValue(data.salaryMonth)}.
      </p>
      
      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <div style={{ fontWeight: '600' }}>Employer:</div>
        <div>{data.employeeName || ''}</div>
      </div>
      
      <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px', marginTop: '20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '14px', fontWeight: '700', marginBottom: '15px' }}>
          ACKNOWLEDGEMENT
        </h2>
        
        <p style={{ marginBottom: '15px' }}>
          I, {data.helperName || ''}, working as {data.workingAs || 'Domestic Help'}, hereby acknowledge receipt of ₹ {amount} towards my salary for {formatMonthValue(data.salaryMonth)} from {data.employeeName || ''}.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '25px' }}>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>Revenue Stamp</div>
            <img src={stampImage} alt="Revenue Stamp" style={{ width: '50px', height: '60px', objectFit: 'contain' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '600' }}>Helper Signature:</div>
            <div style={{ marginTop: '25px', borderTop: '1px solid #333', paddingTop: '5px' }}>{data.helperName || ''}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Template 3: Tax Compliance Format with detailed breakdown
const Template3 = ({ data }) => {
  const amount = Number(data.salaryAmount) || 0;
  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '12px', lineHeight: '1.8', width: '595px', minHeight: '550px', background: '#fff', padding: '35px', color: '#333', border: '2px solid #333', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 5px 0' }}>
          SALARY RECEIPT - DOMESTIC HELP
        </h1>
        <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
          (For Income Tax Exemption Purpose)
        </p>
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '8px 10px', fontWeight: '700', width: '40%', borderBottom: '1px solid #ddd' }}>Receipt No:</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #ddd' }}>{data.receiptNumber || 'DH-' + Date.now().toString().slice(-6)}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 10px', fontWeight: '700', borderBottom: '1px solid #ddd' }}>Date of Receipt:</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #ddd' }}>{formatDateValue(data.paymentDate)}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 10px', fontWeight: '700', borderBottom: '1px solid #ddd' }}>For the Month of:</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #ddd' }}>{formatMonthValue(data.salaryMonth)}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 10px', fontWeight: '700', borderBottom: '1px solid #ddd' }}>Name of Helper:</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #ddd' }}>{data.helperName || ''}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 10px', fontWeight: '700', borderBottom: '1px solid #ddd' }}>Nature of Work:</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #ddd' }}>{data.workingAs || 'Domestic Help'}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 10px', fontWeight: '700', borderBottom: '1px solid #ddd' }}>Amount Received:</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #ddd', fontWeight: '700' }}>₹ {amount}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 10px', fontWeight: '700', borderBottom: '1px solid #ddd' }}>Amount in Words:</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #ddd' }}>{numberToWords(amount)} Rupees Only</td>
          </tr>
        </tbody>
      </table>
      
      <p style={{ marginBottom: '20px', textAlign: 'justify' }}>
        Received with thanks from <strong>{data.employeeName || ''}</strong> the sum mentioned above as my monthly salary for domestic services rendered during {formatMonthValue(data.salaryMonth)}.
      </p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px' }}>
        <div>
          <div style={{ fontWeight: '700', marginBottom: '8px' }}>Revenue Stamp</div>
          <img src={stampImage} alt="Revenue Stamp" style={{ width: '55px', height: '65px', objectFit: 'contain' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '30px' }}></div>
          <div style={{ borderTop: '1px solid #333', paddingTop: '5px', width: '150px' }}>
            <div style={{ fontWeight: '600' }}>Helper Signature</div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '30px' }}></div>
          <div style={{ borderTop: '1px solid #333', paddingTop: '5px', width: '150px' }}>
            <div style={{ fontWeight: '600' }}>Employer Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DailyHelperCanvas = React.forwardRef(({ data, template }, ref) => {
  const templateStyle = template?.templateStyle || 'template1';
  
  return (
    <div ref={ref}>
      {templateStyle === 'template1' && <Template1 data={data} />}
      {templateStyle === 'template2' && <Template2 data={data} />}
      {templateStyle === 'template3' && <Template3 data={data} />}
    </div>
  );
});

DailyHelperCanvas.displayName = 'DailyHelperCanvas';

export default DailyHelperCanvas;
