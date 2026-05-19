import React from 'react';

const formatCurrency = (amt) => `₹${Number(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const maskedCard = (data) => {
  const last4 = String(data.cardLast4 || '').replace(/\D/g, '').slice(-4);
  return last4 ? `************${last4}` : '';
};

const paymentLines = (data) => (
  <>
    {data.paymentMode ? <div>Mode: {data.paymentMode}</div> : null}
    {data.paymentTxnId ? <div>Txn: {data.paymentTxnId}</div> : null}
    {data.paymentRefId ? <div>Ref: {data.paymentRefId}</div> : null}
    {data.upiRef ? <div>UPI Ref: {data.upiRef}</div> : null}
    {String(data.paymentMode || '').toLowerCase().includes('card') && maskedCard(data) ? <div>Card: {maskedCard(data)}</div> : null}
  </>
);

// Template 1: Professional Dark Header
const Template1 = ({ data }) => (
  <div style={{ width: '595px', minHeight: '500px', boxSizing: 'border-box', fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '11px', backgroundColor: '#fff', border: '1px solid #ddd' }}>
    <div style={{ backgroundColor: '#1F2937', color: '#fff', padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700' }}>{data.vendorName}</div>
          <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.9 }}>{data.vendorAddress}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '20px', fontWeight: '700' }}>BILL</div>
      </div>
      <div style={{ marginTop: '8px', fontSize: '9px', opacity: 0.85 }}>
        GSTIN: {data.vendorGSTIN} | Ph: {data.vendorPhone} | Email: {data.vendorEmail}
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 20px', backgroundColor: '#f9f9f9', fontSize: '10px' }}>
      <div><strong>Bill No:</strong> {data.billNumber}</div>
      <div><strong>Date:</strong> {formatDate(data.billDate)}</div>
      <div><strong>Terms:</strong> {data.paymentTerms}</div>
    </div>
    <div style={{ padding: '12px 20px' }}>
      <div style={{ fontWeight: '600', fontSize: '10px', color: '#1F2937', marginBottom: '6px' }}>BILL TO</div>
      <div style={{ padding: '8px 12px', backgroundColor: '#F3F4F6', borderRadius: '4px' }}>
        <div style={{ fontWeight: '600' }}>{data.recipientName}</div>
        <div style={{ fontSize: '10px', color: '#666' }}>{data.recipientAddress}</div>
        {data.recipientGSTIN && <div style={{ fontSize: '9px', color: '#666' }}>GSTIN: {data.recipientGSTIN}</div>}
      </div>
    </div>
    <div style={{ padding: '0 20px' }}>
      <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
        <thead><tr style={{ backgroundColor: '#F3F4F6' }}><th style={{ padding: '8px', textAlign: 'left' }}>Description</th><th style={{ padding: '8px', textAlign: 'center' }}>Qty</th><th style={{ padding: '8px', textAlign: 'right' }}>Rate</th><th style={{ padding: '8px', textAlign: 'right' }}>Amount</th></tr></thead>
        <tbody>
          {data.items?.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '8px' }}>{item.description}</td><td style={{ padding: '8px', textAlign: 'center' }}>{item.qty}</td><td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td><td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(item.amount)}</td></tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginLeft: 'auto', width: '200px', marginTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted #ddd' }}><span>Subtotal</span><span>{formatCurrency(data.subtotal)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted #ddd' }}><span>CGST</span><span>{formatCurrency(data.cgst)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted #ddd' }}><span>SGST</span><span>{formatCurrency(data.sgst)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#1F2937', color: '#fff', fontWeight: '700', borderRadius: '4px', marginTop: '4px' }}><span>TOTAL</span><span>{formatCurrency(data.totalAmount)}</span></div>
      </div>
    </div>
    <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ fontSize: '9px', color: '#666' }}>
        <div>Thank you for your business!</div>
        {paymentLines(data)}
      </div>
      <div style={{ borderTop: '1px solid #333', width: '120px', paddingTop: '6px', marginTop: '20px', fontSize: '10px', fontWeight: '600', textAlign: 'center' }}>Authorized Signatory</div>
    </div>
  </div>
);

// Template 2: Clean Blue Theme
const Template2 = ({ data }) => (
  <div style={{ width: '595px', minHeight: '500px', boxSizing: 'border-box', fontFamily: 'Georgia, serif', fontSize: '11px', backgroundColor: '#fff', border: '2px solid #1976D2' }}>
    <div style={{ textAlign: 'center', padding: '15px 20px', borderBottom: '2px solid #1976D2' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1976D2', margin: 0 }}>{data.vendorName}</h1>
      <p style={{ fontSize: '10px', color: '#666', margin: '5px 0' }}>{data.vendorAddress}</p>
      <p style={{ fontSize: '10px', margin: '3px 0' }}>Ph: {data.vendorPhone} | Email: {data.vendorEmail}</p>
    </div>
    <div style={{ padding: '10px 20px', background: '#f0f7ff', display: 'flex', justifyContent: 'space-between' }}>
      <div><strong>Bill #:</strong> {data.billNumber}</div>
      <div><strong>Date:</strong> {formatDate(data.billDate)}</div>
    </div>
    <div style={{ padding: '15px 20px' }}>
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontWeight: '700', color: '#1976D2', marginBottom: '5px' }}>Billed To:</div>
        <div>{data.recipientName}</div>
        <div style={{ fontSize: '10px', color: '#666' }}>{data.recipientAddress}</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
        <thead><tr style={{ background: '#1976D2', color: '#fff' }}><th style={{ padding: '10px', textAlign: 'left' }}>Description</th><th style={{ padding: '10px', textAlign: 'center' }}>Qty</th><th style={{ padding: '10px', textAlign: 'right' }}>Rate</th><th style={{ padding: '10px', textAlign: 'right' }}>Amount</th></tr></thead>
        <tbody>
          {data.items?.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}><td style={{ padding: '8px' }}>{item.description}</td><td style={{ padding: '8px', textAlign: 'center' }}>{item.qty}</td><td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td><td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(item.amount)}</td></tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginLeft: 'auto', width: '180px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}><span>Subtotal:</span><span>{formatCurrency(data.subtotal)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}><span>Tax:</span><span>{formatCurrency((data.cgst || 0) + (data.sgst || 0))}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1976D2', color: '#fff', fontWeight: '700', borderRadius: '4px' }}><span>Total:</span><span>{formatCurrency(data.totalAmount)}</span></div>
      </div>
    </div>
    <div style={{ padding: '10px 20px', borderTop: '1px solid #ddd', textAlign: 'center', fontSize: '10px', color: '#666' }}>
      <div>Thank you for your business!</div>
      {paymentLines(data)}
    </div>
  </div>
);

// Template 3: Minimal Green
const Template3 = ({ data }) => (
  <div style={{ width: '595px', minHeight: '500px', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif', fontSize: '11px', backgroundColor: '#fff', padding: '20px', border: '1px solid #16A34A' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #16A34A' }}>
      <div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#16A34A' }}>{data.vendorName}</div>
        <div style={{ fontSize: '9px', color: '#666' }}>{data.vendorAddress}</div>
      </div>
      <div style={{ background: '#16A34A', color: '#fff', padding: '8px 16px', borderRadius: '4px', fontWeight: '700' }}>INVOICE</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
      <div>
        <div style={{ fontWeight: '700', color: '#16A34A', marginBottom: '5px' }}>Bill To:</div>
        <div>{data.recipientName}</div>
        <div style={{ fontSize: '10px', color: '#666' }}>{data.recipientAddress}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div><strong>Invoice #:</strong> {data.billNumber}</div>
        <div><strong>Date:</strong> {formatDate(data.billDate)}</div>
      </div>
    </div>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
      <thead><tr style={{ borderBottom: '2px solid #16A34A' }}><th style={{ padding: '10px', textAlign: 'left', color: '#16A34A' }}>Item</th><th style={{ padding: '10px', textAlign: 'center', color: '#16A34A' }}>Qty</th><th style={{ padding: '10px', textAlign: 'right', color: '#16A34A' }}>Rate</th><th style={{ padding: '10px', textAlign: 'right', color: '#16A34A' }}>Total</th></tr></thead>
      <tbody>
        {data.items?.map((item, idx) => (
          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}>{item.description}</td><td style={{ padding: '10px', textAlign: 'center' }}>{item.qty}</td><td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td><td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(item.amount)}</td></tr>
        ))}
      </tbody>
    </table>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: '200px', background: '#f0fdf4', padding: '15px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Subtotal:</span><span>{formatCurrency(data.subtotal)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Tax:</span><span>{formatCurrency((data.cgst || 0) + (data.sgst || 0))}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '14px', color: '#16A34A', paddingTop: '8px', borderTop: '2px solid #16A34A' }}><span>Total:</span><span>{formatCurrency(data.totalAmount)}</span></div>
      </div>
    </div>
    <div style={{ marginTop: '12px', fontSize: '10px', color: '#4b5563' }}>
      {paymentLines(data)}
    </div>
  </div>
);

const GeneralBillCanvas = React.forwardRef(({ data, template }, ref) => {
  const templateStyle = template?.templateStyle || 'template1';
  
  return (
    <div ref={ref}>
      {templateStyle === 'template1' && <Template1 data={data} />}
      {templateStyle === 'template2' && <Template2 data={data} />}
      {templateStyle === 'template3' && <Template3 data={data} />}
    </div>
  );
});

GeneralBillCanvas.displayName = 'GeneralBillCanvas';

export default GeneralBillCanvas;
