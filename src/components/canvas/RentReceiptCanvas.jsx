import React from 'react';
import stampImage from '../images/image.png';

const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (amt) => `₹${Number(amt || 0).toLocaleString('en-IN')}`;
const hasCustomDescription = (text) => String(text || '').trim().length > 0;
const wrapTextStyle = { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' };

const pageSizeStyle = (paperSize) => {
  const p = String(paperSize || 'A4').toLowerCase();
  if (p === 'letter') return { width: '816px', minHeight: '1056px' }; // 8.5 x 11 @96dpi
  if (p === 'legal') return { width: '816px', minHeight: '1344px' };  // 8.5 x 14 @96dpi
  return { width: '794px', minHeight: '1123px' }; // A4 @96dpi
};

// Template 1: Classic Rent Receipt with Stamp
const Template1 = ({ data }) => (
  <div data-paper-root="true" style={{ ...pageSizeStyle(data.paperSize), fontFamily: 'Arial, sans-serif', fontSize: '12px', lineHeight: '1.45', color: '#111827', background: '#fff', padding: '35px', border: '2px solid #333', boxSizing: 'border-box' }}>
    <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '15px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 5px 0', textDecoration: 'underline' }}>RENT RECEIPT</h1>
      <p style={{ margin: 0, fontSize: '11px' }}>House Rent Payment Acknowledgement</p>
    </div>

    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ marginBottom: '8px' }}><strong>Receipt No:</strong> {data.receiptNumber}</div>
        <div><strong>Date:</strong> {formatDate(data.receiptDate)}</div>
      </div>
      <img src={stampImage} alt="Revenue Stamp" style={{ width: '60px', height: '70px', border: '1px solid #999' }} />
    </div>

    <div style={{ lineHeight: '1.8', marginBottom: '20px' }}>
      <p style={{ margin: '0 0 10px 0' }}>
        Received with thanks from <strong style={{ textDecoration: 'underline' }}>{data.tenantName}</strong> a sum of <strong>{formatCurrency(data.rentAmount)}</strong> (Rupees <strong>{numberToWords(data.rentAmount)} Only</strong>) towards the rent of premises located at:
      </p>
      <p style={{ ...wrapTextStyle, margin: '10px 0', padding: '10px', background: '#f5f5f5', border: '1px dashed #999', fontStyle: 'italic' }}>
        {data.propertyAddress}
      </p>
      <p style={{ margin: '10px 0 0 0' }}>
        For the period from <strong>{formatDate(data.periodFrom)}</strong> to <strong>{formatDate(data.periodTo)}</strong>
      </p>
      {hasCustomDescription(data.customDescription) && (
        <p style={{ ...wrapTextStyle, margin: '10px 0 0 0' }}>
          <strong>Description:</strong> {data.customDescription}
        </p>
      )}
    </div>

    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <div style={{ marginBottom: '5px' }}><strong>Payment Method:</strong> {data.paymentMethod}</div>
        <div><strong>PAN:</strong> {data.landlordPAN}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ borderTop: '1px solid #333', width: '150px', paddingTop: '5px', marginTop: '40px' }}>
          <div style={{ fontWeight: '600' }}>{data.landlordName}</div>
          <div style={{ fontSize: '10px' }}>Landlord's Signature</div>
        </div>
      </div>
    </div>
  </div>
);

// Template 2: Formal Agreement Style
const Template2 = ({ data }) => (
  <div data-paper-root="true" style={{ ...pageSizeStyle(data.paperSize), fontFamily: 'Georgia, serif', fontSize: '12px', lineHeight: '1.45', color: '#111827', background: '#fff', padding: '40px', border: '3px double #000', boxSizing: 'border-box' }}>
    <div style={{ textAlign: 'center', marginBottom: '25px' }}>
      <div style={{ fontSize: '14px', letterSpacing: '3px', marginBottom: '5px' }}>॥ RENT RECEIPT ॥</div>
      <div style={{ fontSize: '20px', fontWeight: '700', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '8px 0', margin: '10px 0' }}>
        ACKNOWLEDGEMENT OF PAYMENT
      </div>
    </div>

    <div style={{ position: 'relative', marginBottom: '25px' }}>
      <div style={{ position: 'absolute', right: 0, top: -10 }}>
        <img src={stampImage} alt="Revenue Stamp" style={{ width: '70px', height: '80px', border: '2px solid #000' }} />
      </div>
      <div style={{ paddingRight: '90px' }}>
        <p style={{ margin: '0 0 15px 0', lineHeight: '1.8' }}>
          This is to acknowledge that I, <strong>{data.landlordName}</strong>, owner of the property situated at <strong style={wrapTextStyle}>{data.propertyAddress}</strong>, have received a sum of <strong>{formatCurrency(data.rentAmount)}</strong> (Rupees <strong>{numberToWords(data.rentAmount)} Only</strong>) from <strong>{data.tenantName}</strong> as rent payment.
        </p>
        {hasCustomDescription(data.customDescription) && (
          <p style={{ ...wrapTextStyle, margin: '0 0 15px 0' }}>
            <strong>Description:</strong> {data.customDescription}
          </p>
        )}
      </div>
    </div>

    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
      <tbody>
        <tr style={{ borderBottom: '1px solid #ddd' }}>
          <td style={{ padding: '8px', fontWeight: '600', width: '40%' }}>Receipt Number:</td>
          <td style={{ padding: '8px' }}>{data.receiptNumber}</td>
        </tr>
        <tr style={{ borderBottom: '1px solid #ddd' }}>
          <td style={{ padding: '8px', fontWeight: '600' }}>Receipt Date:</td>
          <td style={{ padding: '8px' }}>{formatDate(data.receiptDate)}</td>
        </tr>
        <tr style={{ borderBottom: '1px solid #ddd' }}>
          <td style={{ padding: '8px', fontWeight: '600' }}>Period:</td>
          <td style={{ padding: '8px' }}>{formatDate(data.periodFrom)} to {formatDate(data.periodTo)}</td>
        </tr>
        <tr style={{ borderBottom: '1px solid #ddd' }}>
          <td style={{ padding: '8px', fontWeight: '600' }}>Payment Mode:</td>
          <td style={{ padding: '8px' }}>{data.paymentMethod}</td>
        </tr>
        <tr>
          <td style={{ padding: '8px', fontWeight: '600' }}>Landlord PAN:</td>
          <td style={{ padding: '8px' }}>{data.landlordPAN}</td>
        </tr>
      </tbody>
    </table>

    <div style={{ marginTop: '40px', textAlign: 'right' }}>
      <div style={{ display: 'inline-block' }}>
        <div style={{ borderTop: '2px solid #000', width: '180px', paddingTop: '8px', marginBottom: '3px', fontWeight: '700' }}>
          {data.landlordName}
        </div>
        <div style={{ fontSize: '10px', fontStyle: 'italic' }}>Landlord / Owner</div>
      </div>
    </div>
  </div>
);

// Template 3: Modern Compact Receipt
const Template3 = ({ data }) => (
  <div data-paper-root="true" style={{ ...pageSizeStyle(data.paperSize), fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '11px', lineHeight: '1.45', color: '#111827', background: '#fff', padding: '30px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
    <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: '#fff', padding: '15px 20px', marginBottom: '20px', borderRadius: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700' }}>RENT RECEIPT</div>
          <div style={{ fontSize: '10px', opacity: 0.9 }}>Official Payment Acknowledgement</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '4px' }}>
          <div style={{ fontSize: '9px', marginBottom: '2px' }}>Receipt #</div>
          <div style={{ fontSize: '13px', fontWeight: '700' }}>{data.receiptNumber}</div>
        </div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', marginBottom: '20px' }}>
      <div>
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>TENANT DETAILS</div>
          <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>{data.tenantName}</div>
          <div style={{ ...wrapTextStyle, fontSize: '10px', color: '#64748b' }}>{data.propertyAddress}</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>LANDLORD DETAILS</div>
          <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>{data.landlordName}</div>
          <div style={{ fontSize: '10px' }}><strong>PAN:</strong> {data.landlordPAN}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <img src={stampImage} alt="Revenue Stamp" style={{ width: '65px', height: '75px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
      </div>
    </div>

    <div style={{ background: '#fef3c7', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #fbbf24' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#92400e', marginBottom: '4px' }}>AMOUNT RECEIVED</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#92400e' }}>{formatCurrency(data.rentAmount)}</div>
          <div style={{ fontSize: '10px', color: '#92400e', fontStyle: 'italic', marginTop: '2px' }}>
            ({numberToWords(data.rentAmount)} Rupees Only)
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '9px', color: '#92400e', marginBottom: '2px' }}>PERIOD</div>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#92400e' }}>
            {formatDate(data.periodFrom)}
          </div>
          <div style={{ fontSize: '9px', color: '#92400e' }}>to</div>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#92400e' }}>
            {formatDate(data.periodTo)}
          </div>
        </div>
      </div>
    </div>

    {hasCustomDescription(data.customDescription) && (
      <div style={{ ...wrapTextStyle, background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #e2e8f0', fontSize: '10px' }}>
        <strong>Description:</strong> {data.customDescription}
      </div>
    )}

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
      <div>
        <div><strong>Date:</strong> {formatDate(data.receiptDate)}</div>
        <div><strong>Payment:</strong> {data.paymentMethod}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ borderTop: '1px solid #333', width: '120px', paddingTop: '5px', fontSize: '9px' }}>
          Landlord's Signature
        </div>
      </div>
    </div>
  </div>
);

const RentReceiptCanvas = React.forwardRef(({ data, template }, ref) => {
  const templateStyle = template?.templateStyle || 'template1';
  
  return (
    <div ref={ref}>
      {templateStyle === 'template1' && <Template1 data={data} />}
      {templateStyle === 'template2' && <Template2 data={data} />}
      {templateStyle === 'template3' && <Template3 data={data} />}
    </div>
  );
});

RentReceiptCanvas.displayName = 'RentReceiptCanvas';

export default RentReceiptCanvas;
