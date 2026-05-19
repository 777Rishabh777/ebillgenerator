import React from 'react';

// Template 1: Modern Digital Bill
const Template1 = ({ data }) => {
  const monthlyCharges = parseFloat(data.monthlyCharges) || 0;
  const taxes = parseFloat(data.taxes) || 0;
  const otherCharges = parseFloat(data.otherCharges) || 0;
  const discount = parseFloat(data.discount) || 0;
  const totalAmount = parseFloat(data.totalAmount) || 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const colors = { primary: '#FF6600', secondary: '#FF8533', bg: '#FFF4EC' };
  const isCard = String(data.paymentMethod || '').toLowerCase().includes('card');
  const maskedCard = data.cardLast4 ? `************${String(data.cardLast4).replace(/\D/g, '').slice(-4)}` : '';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', width: '520px', minHeight: '480px', background: '#fff', padding: '28px', border: '2px solid #e2e8f0', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `3px solid ${colors.primary}`, paddingBottom: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {data.logoUrl ? (
            <img 
              src={data.logoUrl} 
              alt="Provider Logo" 
              style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '8px', padding: '5px' }} 
            />
          ) : (
            <div style={{ width: '50px', height: '50px', background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: '900' }}>
              {(data.providerBrand || 'JIO').slice(0, 3).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: colors.primary }}>{data.providerBrand || 'JioFiber'}</div>
            <div style={{ fontSize: '8px', color: '#64748b' }}>{data.providerName || 'Internet Service Provider'}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ background: colors.primary, color: '#fff', padding: '5px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>BROADBAND BILL</div>
          <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>Bill Period: {data.billPeriod || 'Monthly'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: colors.bg, padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
        <div><div style={{ fontSize: '8px', color: '#64748b', fontWeight: '600' }}>BILL NO</div><div style={{ fontWeight: '700', fontSize: '10px' }}>{data.billNumber}</div></div>
        <div><div style={{ fontSize: '8px', color: '#64748b', fontWeight: '600' }}>BILL DATE</div><div style={{ fontWeight: '600', fontSize: '10px' }}>{formatDate(data.billDate)}</div></div>
        <div><div style={{ fontSize: '8px', color: '#64748b', fontWeight: '600' }}>DUE DATE</div><div style={{ fontWeight: '700', fontSize: '10px', color: '#DC2626' }}>{formatDate(data.dueDate)}</div></div>
        <div><div style={{ fontSize: '8px', color: '#64748b', fontWeight: '600' }}>STATUS</div><div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: '700', background: data.paymentStatus === 'Paid' ? '#DCFCE7' : '#FEF3C7', color: data.paymentStatus === 'Paid' ? '#166534' : '#92400E' }}>{data.paymentStatus}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '9px', fontWeight: '700', color: colors.primary, marginBottom: '8px' }}>CUSTOMER DETAILS</div>
          <div style={{ fontWeight: '700', marginBottom: '4px' }}>{data.customerName}</div>
          <div style={{ fontSize: '9px', color: '#64748b' }}>{data.customerEmail}</div>
          <div style={{ fontSize: '9px', color: '#64748b' }}>{data.customerPhone}</div>
          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
            <span style={{ color: '#64748b' }}>Account #:</span><span style={{ fontWeight: '700' }}>{data.accountNumber}</span>
          </div>
        </div>
        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '9px', fontWeight: '700', color: colors.primary, marginBottom: '8px' }}>PLAN DETAILS</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}><span style={{ color: '#64748b' }}>Plan:</span><span style={{ fontWeight: '600' }}>{data.planName}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}><span style={{ color: '#64748b' }}>Speed:</span><span style={{ fontWeight: '700', color: colors.primary }}>{data.speed}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}><span style={{ color: '#64748b' }}>Data:</span><span style={{ fontWeight: '600' }}>{data.dataLimit || 'Unlimited'}</span></div>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: colors.primary, color: '#fff' }}><th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700' }}>Description</th><th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700' }}>Amount (₹)</th></tr></thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '7px 10px' }}>Monthly Service Charges</td><td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600' }}>₹{monthlyCharges.toFixed(2)}</td></tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '7px 10px' }}>GST (18%)</td><td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600' }}>₹{taxes.toFixed(2)}</td></tr>
            {otherCharges > 0 && <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '7px 10px' }}>Other Charges</td><td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600' }}>₹{otherCharges.toFixed(2)}</td></tr>}
            {discount > 0 && <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#DCFCE7' }}><td style={{ padding: '7px 10px', color: '#166534' }}>Discount</td><td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600', color: '#166534' }}>-₹{discount.toFixed(2)}</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <div style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, color: '#fff', padding: '10px 16px', borderRadius: '6px', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '600' }}>Total Amount:</span>
          <span style={{ fontSize: '18px', fontWeight: '900' }}>₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: '#64748b' }}>
        <div>
          <div>Pay by due date to avoid late fee.</div>
          {data.paymentTxnId ? <div>Txn: {data.paymentTxnId}</div> : null}
          {data.paymentRefId ? <div>Ref: {data.paymentRefId}</div> : null}
          {data.upiRef ? <div>UPI Ref: {data.upiRef}</div> : null}
          {isCard && maskedCard ? <div>Card: {maskedCard}</div> : null}
        </div>
        <div style={{ textAlign: 'right' }}><div>Customer Care: 1800-XXX-XXXX</div></div>
      </div>
    </div>
  );
};

// Template 2: Classic Statement Style
const Template2 = ({ data }) => {
  const monthlyCharges = parseFloat(data.monthlyCharges) || 0;
  const taxes = parseFloat(data.taxes) || 0;
  const totalAmount = parseFloat(data.totalAmount) || 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const isCard = String(data.paymentMethod || '').toLowerCase().includes('card');
  const maskedCard = data.cardLast4 ? `************${String(data.cardLast4).replace(/\D/g, '').slice(-4)}` : '';

  return (
    <div style={{ fontFamily: 'Georgia, serif', fontSize: '12px', width: '520px', minHeight: '480px', background: '#fff', padding: '28px', border: '2px solid #1976D2', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #1976D2', paddingBottom: '15px', marginBottom: '20px' }}>
        {data.logoUrl ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <img 
              src={data.logoUrl} 
              alt="Provider Logo" 
              style={{ width: '80px', height: '80px', objectFit: 'contain' }} 
            />
          </div>
        ) : (
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1976D2', margin: 0 }}>{data.providerBrand || 'BSNL'}</h1>
        )}
        <p style={{ fontSize: '10px', color: '#666', margin: '5px 0 0 0' }}>{data.providerName || 'Bharat Sanchar Nigam Limited'}</p>
        <p style={{ fontSize: '11px', margin: '5px 0 0 0' }}>BROADBAND INTERNET BILL</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div><div style={{ fontWeight: '700' }}>Bill No: {data.billNumber}</div><div>Bill Date: {formatDate(data.billDate)}</div></div>
        <div style={{ textAlign: 'right' }}><div style={{ fontWeight: '700', color: '#DC2626' }}>Due Date: {formatDate(data.dueDate)}</div></div>
      </div>

      <div style={{ background: '#f0f7ff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <div style={{ fontWeight: '700', marginBottom: '10px', color: '#1976D2' }}>Customer Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
          <div><strong>Name:</strong> {data.customerName}</div>
          <div><strong>Account:</strong> {data.accountNumber}</div>
          <div><strong>Address:</strong> {data.customerAddress}</div>
          <div><strong>Plan:</strong> {data.planName} ({data.speed})</div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead><tr style={{ background: '#1976D2', color: '#fff' }}><th style={{ padding: '10px', textAlign: 'left' }}>Particulars</th><th style={{ padding: '10px', textAlign: 'right' }}>Amount</th></tr></thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #ddd' }}><td style={{ padding: '8px' }}>Internet Charges</td><td style={{ padding: '8px', textAlign: 'right' }}>₹{monthlyCharges.toFixed(2)}</td></tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}><td style={{ padding: '8px' }}>GST @18%</td><td style={{ padding: '8px', textAlign: 'right' }}>₹{taxes.toFixed(2)}</td></tr>
          <tr style={{ background: '#1976D2', color: '#fff' }}><td style={{ padding: '10px', fontWeight: '700' }}>Total Payable</td><td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', fontSize: '14px' }}>₹{totalAmount.toFixed(2)}</td></tr>
        </tbody>
      </table>

      <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
        {data.paymentTxnId ? <p style={{ margin: '0 0 4px 0' }}>Txn: {data.paymentTxnId}</p> : null}
        {data.paymentRefId ? <p style={{ margin: '0 0 4px 0' }}>Ref: {data.paymentRefId}</p> : null}
        {data.upiRef ? <p style={{ margin: '0 0 4px 0' }}>UPI Ref: {data.upiRef}</p> : null}
        {isCard && maskedCard ? <p style={{ margin: '0 0 4px 0' }}>Card: {maskedCard}</p> : null}
        <p style={{ margin: 0 }}>For queries call: 1500 (Toll Free) | Online: www.bsnl.co.in</p>
      </div>
    </div>
  );
};

const InternetBillCanvas = React.forwardRef(({ data, template }, ref) => {
  const templateStyle = template?.templateStyle || 'template1';
  
  return (
    <div ref={ref}>
      {templateStyle === 'template1' && <Template1 data={data} />}
      {templateStyle === 'template2' && <Template2 data={data} />}
    </div>
  );
});

InternetBillCanvas.displayName = 'InternetBillCanvas';

export default InternetBillCanvas;
