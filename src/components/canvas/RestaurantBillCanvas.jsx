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

// Template 1: Thermal Receipt Style
const Template1 = ({ data }) => (
  <div style={{ width: '320px', minHeight: '560px', boxSizing: 'border-box', overflow: 'hidden', fontFamily: "'Courier New', monospace", fontSize: '11px', backgroundColor: '#fff', padding: '20px', border: '1px solid #ddd' }}>
    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
      <div style={{ fontSize: '16px', fontWeight: '700' }}>{data.restaurantName}</div>
      <div style={{ fontSize: '9px', color: '#666' }}>{data.restaurantAddress}</div>
      <div style={{ fontSize: '9px', color: '#666' }}>Ph: {data.restaurantPhone} | GSTIN: {data.restaurantGSTIN}</div>
    </div>
    <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }}></div>
    <div style={{ fontSize: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bill No: {data.billNumber}</span><span>Table: {data.tableNumber}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Date: {formatDate(data.billDate)}</span><span>Time: {data.billTime}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Guest: {data.guestName}</span><span>Server: {data.serverName}</span></div>
    </div>
    <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }}></div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 55px 55px', gap: '4px', fontWeight: '700', fontSize: '10px', marginBottom: '4px' }}><span>ITEM</span><span style={{ textAlign: 'center' }}>QTY</span><span style={{ textAlign: 'right' }}>RATE</span><span style={{ textAlign: 'right' }}>AMT</span></div>
    <div style={{ borderTop: '1px solid #333', marginBottom: '4px' }}></div>
    {data.items?.map((item, idx) => (
      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 30px 55px 55px', gap: '4px', fontSize: '10px', padding: '2px 0' }}><span>{item.name}</span><span style={{ textAlign: 'center' }}>{item.qty}</span><span style={{ textAlign: 'right' }}>{item.rate?.toFixed(2)}</span><span style={{ textAlign: 'right' }}>{item.amount?.toFixed(2)}</span></div>
    ))}
    <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }}></div>
    <div style={{ fontSize: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{formatCurrency(data.subtotal)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CGST @2.5%</span><span>{formatCurrency(data.cgst)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SGST @2.5%</span><span>{formatCurrency(data.sgst)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Service @5%</span><span>{formatCurrency(data.serviceCharge)}</span></div>
    </div>
    <div style={{ borderTop: '2px solid #333', margin: '8px 0' }}></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '14px' }}><span>GRAND TOTAL</span><span>{formatCurrency(data.totalAmount)}</span></div>
    <div style={{ borderTop: '2px solid #333', margin: '8px 0' }}></div>
    <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '8px' }}>
      <div style={{ display: 'inline-block', padding: '4px 12px', backgroundColor: '#d1fae5', borderRadius: '4px', fontWeight: '600', color: '#065f46' }}>PAID - {data.paymentMode}</div>
      {data.paymentTxnId ? <div style={{ marginTop: '6px' }}>Txn: {data.paymentTxnId}</div> : null}
      {data.paymentRefId ? <div>Ref: {data.paymentRefId}</div> : null}
      {data.upiRef ? <div>UPI Ref: {data.upiRef}</div> : null}
      {(data.paymentMode || '').toLowerCase().includes('card') && maskedCard(data) ? <div>Card: {maskedCard(data)}</div> : null}
    </div>
    <div style={{ textAlign: 'center', fontSize: '9px', color: '#666' }}>
      <div>Thank you for dining with us!</div>
      <div style={{ fontFamily: 'monospace', fontSize: '18px', letterSpacing: '2px', marginTop: '8px' }}>||||| |||| ||| |||| |||||</div>
    </div>
  </div>
);

// Template 2: Modern Card Style
const Template2 = ({ data }) => (
  <div style={{ width: '380px', minHeight: '520px', fontFamily: 'Arial, sans-serif', fontSize: '11px', backgroundColor: '#fff', border: '2px solid #DC2626', borderRadius: '12px', overflow: 'hidden', boxSizing: 'border-box' }}>
    <div style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)', color: '#fff', padding: '15px', textAlign: 'center' }}>
      <div style={{ fontSize: '18px', fontWeight: '700' }}>{data.restaurantName}</div>
      <div style={{ fontSize: '10px', opacity: 0.9 }}>{data.restaurantAddress}</div>
    </div>
    <div style={{ padding: '15px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px', padding: '10px', background: '#FEF2F2', borderRadius: '8px' }}>
        <div><strong>Bill #:</strong> {data.billNumber}</div>
        <div><strong>Table:</strong> {data.tableNumber}</div>
        <div><strong>Date:</strong> {formatDate(data.billDate)}</div>
        <div><strong>Time:</strong> {data.billTime}</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
        <thead><tr style={{ borderBottom: '2px solid #DC2626' }}><th style={{ padding: '8px', textAlign: 'left' }}>Item</th><th style={{ padding: '8px', textAlign: 'center' }}>Qty</th><th style={{ padding: '8px', textAlign: 'right' }}>Rate</th><th style={{ padding: '8px', textAlign: 'right' }}>Amount</th></tr></thead>
        <tbody>
          {data.items?.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '8px' }}>{item.name}</td><td style={{ padding: '8px', textAlign: 'center' }}>{item.qty}</td><td style={{ padding: '8px', textAlign: 'right' }}>₹{item.rate?.toFixed(2)}</td><td style={{ padding: '8px', textAlign: 'right' }}>₹{item.amount?.toFixed(2)}</td></tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginLeft: 'auto', width: '180px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Subtotal:</span><span>{formatCurrency(data.subtotal)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Tax (5%):</span><span>{formatCurrency((data.cgst || 0) + (data.sgst || 0))}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Service:</span><span>{formatCurrency(data.serviceCharge)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#DC2626', color: '#fff', fontWeight: '700', borderRadius: '6px', marginTop: '8px' }}><span>Total:</span><span>{formatCurrency(data.totalAmount)}</span></div>
      </div>
      <div style={{ fontSize: '10px', marginTop: '10px', color: '#374151' }}>
        {data.paymentTxnId ? <div>Txn: {data.paymentTxnId}</div> : null}
        {data.paymentRefId ? <div>Ref: {data.paymentRefId}</div> : null}
        {data.upiRef ? <div>UPI Ref: {data.upiRef}</div> : null}
        {(data.paymentMode || '').toLowerCase().includes('card') && maskedCard(data) ? <div>Card: {maskedCard(data)}</div> : null}
      </div>
    </div>
    <div style={{ background: '#f9f9f9', padding: '10px', textAlign: 'center', fontSize: '10px', color: '#666' }}>Thank you for dining with us! 🍽️</div>
  </div>
);

// Template 3: Elegant Fine Dining
const Template3 = ({ data }) => (
  <div style={{ width: '320px', minHeight: '520px', boxSizing: 'border-box', overflow: 'hidden', fontFamily: 'Georgia, serif', fontSize: '11px', backgroundColor: '#FFFBF0', padding: '28px', border: '1px solid #D4AF37' }}>
    <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #D4AF37' }}>
      <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '3px' }}>{data.restaurantName?.toUpperCase()}</div>
      <div style={{ fontSize: '10px', color: '#666', marginTop: '5px', fontStyle: 'italic' }}>Fine Dining Experience</div>
      <div style={{ fontSize: '9px', color: '#888', marginTop: '3px' }}>{data.restaurantAddress}</div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '10px' }}>
      <div><strong>Invoice:</strong> {data.billNumber}</div>
      <div><strong>Date:</strong> {formatDate(data.billDate)}</div>
      <div><strong>Table:</strong> {data.tableNumber}</div>
    </div>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
      <thead><tr style={{ borderBottom: '1px solid #D4AF37' }}><th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Description</th><th style={{ padding: '10px', textAlign: 'center' }}>Qty</th><th style={{ padding: '10px', textAlign: 'right' }}>Price</th></tr></thead>
      <tbody>
        {data.items?.map((item, idx) => (
          <tr key={idx} style={{ borderBottom: '1px dotted #ddd' }}><td style={{ padding: '10px' }}>{item.name}</td><td style={{ padding: '10px', textAlign: 'center' }}>{item.qty}</td><td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(item.amount)}</td></tr>
        ))}
      </tbody>
    </table>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: '200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dotted #ddd' }}><span>Subtotal</span><span>{formatCurrency(data.subtotal)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dotted #ddd' }}><span>Tax & Service</span><span>{formatCurrency((data.cgst || 0) + (data.sgst || 0) + (data.serviceCharge || 0))}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: '700', fontSize: '14px', borderTop: '2px solid #D4AF37', marginTop: '5px' }}><span>Grand Total</span><span style={{ color: '#D4AF37' }}>{formatCurrency(data.totalAmount)}</span></div>
      </div>
    </div>
    <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
      {data.paymentTxnId ? <p style={{ margin: '0 0 4px 0' }}>Txn: {data.paymentTxnId}</p> : null}
      {data.paymentRefId ? <p style={{ margin: '0 0 4px 0' }}>Ref: {data.paymentRefId}</p> : null}
      {data.upiRef ? <p style={{ margin: '0 0 4px 0' }}>UPI Ref: {data.upiRef}</p> : null}
      {(data.paymentMode || '').toLowerCase().includes('card') && maskedCard(data) ? <p style={{ margin: '0 0 4px 0' }}>Card: {maskedCard(data)}</p> : null}
      <p>Thank you for choosing us. We look forward to serving you again.</p>
    </div>
  </div>
);

const RestaurantBillCanvas = React.forwardRef(({ data, template }, ref) => {
  const templateStyle = template?.templateStyle || 'template1';
  
  return (
    <div ref={ref}>
      {templateStyle === 'template1' && <Template1 data={data} />}
      {templateStyle === 'template2' && <Template2 data={data} />}
      {templateStyle === 'template3' && <Template3 data={data} />}
    </div>
  );
});

RestaurantBillCanvas.displayName = 'RestaurantBillCanvas';

export default RestaurantBillCanvas;
