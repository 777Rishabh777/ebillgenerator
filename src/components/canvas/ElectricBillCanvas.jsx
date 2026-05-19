import React from 'react';

const ElectricBillCanvas = React.forwardRef(({ data, template }, ref) => {
  const colors = template?.colors || { primary: '#1E40AF', secondary: '#1E3A8A', accent: '#FFA500', bg: '#F0F5FF' };
  const brandName = template?.brand || 'BESCOM';

  const unitsConsumed = Math.max(0, (parseFloat(data.currentReading) || 0) - (parseFloat(data.previousReading) || 0));
  const energyCharges = parseFloat(data.energyCharges) || 0;
  const fixedCharges = parseFloat(data.fixedCharges) || 0;
  const wheelingCharges = parseFloat(data.wheelingCharges) || 0;
  const electricityDuty = parseFloat(data.electricityDuty) || 0;
  const taxes = parseFloat(data.taxes) || 0;
  const arrears = parseFloat(data.arrears) || 0;
  const totalAmount = parseFloat(data.totalAmount) || 0;
  const isCard = String(data.paymentMode || '').toLowerCase().includes('card');
  const maskedCard = data.cardLast4 ? `************${String(data.cardLast4).replace(/\D/g, '').slice(-4)}` : '';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Utility Classic Layout
  if (template?.style === 'utility-classic') {
    const usageAmount = (data.usageKwh || 0) * (data.costPerKwh || 0);
    const totalDue = usageAmount + (data.previousCharges || 0);

    return (
      <div
        ref={ref}
        style={{
          fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
          fontSize: '12px',
          width: '595px',
          minHeight: '842px',
          background: '#fff',
          padding: '40px',
          color: '#334155',
          lineHeight: '1.5',
          position: 'relative',
          boxSizing: 'border-box',
          boxShadow: '0 0 20px rgba(0,0,0,0.05)'
        }}
      >
        {/* Top Border Bar */}
        <div style={{ height: '5px', background: '#1e3a8a', marginBottom: '30px' }}></div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <div style={{ textAlign: 'right' }}>
            <div className="editable-text" contentEditable suppressContentEditableWarning style={{ color: '#b45309', fontWeight: '800', fontSize: '20px', textTransform: 'uppercase' }}>{data.boardName}</div>
            <div className="editable-text" contentEditable suppressContentEditableWarning style={{ color: '#64748b', fontSize: '11px', whiteSpace: 'pre-line' }}>{data.boardAddress}</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="editable-text" contentEditable suppressContentEditableWarning style={{ fontSize: '36px', fontWeight: '500', letterSpacing: '2px', color: '#334155', margin: 0 }}>{data.billTitle || 'UTILITY BILL'}</h1>
        </div>

        {/* Account Info & Dates */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontWeight: '700', color: '#64748b', fontSize: '14px' }}>Account No.</div>
              <div className="editable-text" contentEditable suppressContentEditableWarning style={{ fontSize: '14px' }}>{data.billNumber}</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontWeight: '700', color: '#64748b', fontSize: '14px' }}>Account Name</div>
              <div className="editable-text" contentEditable suppressContentEditableWarning style={{ fontSize: '14px' }}>{data.consumerName}</div>
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#64748b', fontSize: '14px' }}>Address</div>
              <div className="editable-text" contentEditable suppressContentEditableWarning style={{ fontSize: '14px', maxWidth: '250px' }}>{data.consumerAddress}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontWeight: '700', color: '#64748b', fontSize: '14px' }}>Statement Date</div>
              <div className="editable-text" contentEditable suppressContentEditableWarning style={{ fontSize: '14px' }}>{formatDate(data.statementDate)}</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontWeight: '700', color: '#64748b', fontSize: '14px' }}>Period Statement From</div>
              <div className="editable-text" contentEditable suppressContentEditableWarning style={{ fontSize: '14px' }}>{formatDate(data.periodFrom)}</div>
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#64748b', fontSize: '14px' }}>Period Statement Until</div>
              <div className="editable-text" contentEditable suppressContentEditableWarning style={{ fontSize: '14px' }}>{formatDate(data.periodTo)}</div>
            </div>
          </div>
        </div>

        {/* Meter Information Table */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>Meter Information</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #334155' }}>
            <thead>
              <tr style={{ background: '#fef3c7' }}>
                <th style={{ border: '1px solid #334155', padding: '8px', fontWeight: '700', color: '#1e3a8a' }}>Date</th>
                <th style={{ border: '1px solid #334155', padding: '8px', fontWeight: '700', color: '#1e3a8a' }}>Usage (kWh)</th>
                <th style={{ border: '1px solid #334155', padding: '8px', fontWeight: '700', color: '#1e3a8a' }}>Cost (per kWh)</th>
                <th style={{ border: '1px solid #334155', padding: '8px', fontWeight: '700', color: '#1e3a8a' }}>Amount ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ textAlign: 'center', fontWeight: '700' }}>
                <td className="editable-text" contentEditable suppressContentEditableWarning style={{ border: '1px solid #334155', padding: '8px' }}>{formatDate(data.periodFrom)}</td>
                <td className="editable-text" contentEditable suppressContentEditableWarning style={{ border: '1px solid #334155', padding: '8px' }}>{data.usageKwh}</td>
                <td className="editable-text" contentEditable suppressContentEditableWarning style={{ border: '1px solid #334155', padding: '8px' }}>{data.costPerKwh}</td>
                <td style={{ border: '1px solid #334155', padding: '8px' }}>{usageAmount.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bill Summary Table */}
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>Bill Summary</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #334155' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #334155', padding: '8px', fontWeight: '700', color: '#1e3a8a', background: '#fef3c7' }}>Previous Charges ($)</td>
                  <td className="editable-text" contentEditable suppressContentEditableWarning style={{ border: '1px solid #334155', padding: '8px', textAlign: 'center', fontWeight: '700' }}>$ {data.previousCharges?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #334155', padding: '8px', fontWeight: '700', color: '#1e3a8a', background: '#fef3c7' }}>Current Charges ($)</td>
                  <td style={{ border: '1px solid #334155', padding: '8px', textAlign: 'center', fontWeight: '700' }}>$ {usageAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #334155', padding: '8px', fontWeight: '700', color: '#1e3a8a', background: '#fef3c7' }}>Total Amount ($)</td>
                  <td style={{ border: '1px solid #334155', padding: '8px', textAlign: 'center', fontWeight: '800' }}>$ {totalDue.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #334155', padding: '8px', fontWeight: '700', color: '#1e3a8a', background: '#fef3c7' }}>Due Date</td>
                  <td className="editable-text" contentEditable suppressContentEditableWarning style={{ border: '1px solid #334155', padding: '8px', textAlign: 'center', fontWeight: '700' }}>{formatDate(data.dueDate)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Reminders */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>Reminders</h3>
          <ol style={{ paddingLeft: '20px', margin: 0 }}>
            {data.reminders?.map((reminder, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>{reminder}</li>
            ))}
          </ol>
        </div>

        {/* Footer Bar */}
        <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px' }}>
          <div style={{ height: '5px', background: '#1e3a8a', marginBottom: '10px' }}></div>
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '14px' }}>{data.footerUrl}</div>
        </div>
      </div>
    );
  }

  // Default Layout
  return (
    <div
      ref={ref}
      data-template={template?.id}
      className="bill-canvas electric-bill-a4"
      style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        width: '595px',
        minHeight: '700px',
        background: '#fff',
        padding: '1.25rem',
        boxSizing: 'border-box',
        border: '2px solid #e2e8f0'
      }}
    >
      {/* Header with Logo & Brand */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: `3px solid ${colors.primary}`,
        paddingBottom: '12px',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '45px',
            height: '45px',
            background: colors.primary,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '20px'
          }}>⚡</div>
          <div>
            <div
              className="editable-text"
              contentEditable
              suppressContentEditableWarning
              style={{ fontSize: '18px', fontWeight: '800', color: colors.primary, letterSpacing: '-0.5px' }}
            >
              {brandName}
            </div>
            <div
              className="editable-text"
              contentEditable
              suppressContentEditableWarning
              style={{ fontSize: '9px', color: '#64748b' }}
            >
              {data.boardAddress || 'State Electricity Distribution Company'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            background: colors.primary,
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.5px'
          }}>
            ELECTRICITY BILL
          </div>
          <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
            Bill Period: {data.billingPeriod || 'Monthly'}
          </div>
        </div>
      </div>

      {/* Bill Meta Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        background: colors.bg,
        padding: '10px',
        borderRadius: '6px',
        marginBottom: '12px'
      }}>
        <div>
          <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Bill No</div>
          <div className="editable-text" contentEditable suppressContentEditableWarning style={{ fontWeight: '700', fontSize: '10px' }}>{data.billNumber}</div>
        </div>
        <div>
          <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Bill Date</div>
          <div style={{ fontWeight: '600', fontSize: '10px' }}>{formatDate(data.billDate)}</div>
        </div>
        <div>
          <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Due Date</div>
          <div style={{ fontWeight: '700', fontSize: '10px', color: '#DC2626' }}>{formatDate(data.dueDate)}</div>
        </div>
        <div>
          <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Meter No</div>
          <div className="editable-text" contentEditable suppressContentEditableWarning style={{ fontWeight: '600', fontSize: '10px' }}>{data.meterNumber}</div>
        </div>
      </div>

      {/* Consumer & Meter Details - Two Column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {/* Consumer Details */}
        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '9px', fontWeight: '700', color: colors.primary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Consumer Details
          </div>
          <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Name:</span>
              <span className="editable-text" contentEditable suppressContentEditableWarning style={{ fontWeight: '600' }}>{data.consumerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>CA No:</span>
              <span className="editable-text" contentEditable suppressContentEditableWarning style={{ fontWeight: '600' }}>{data.consumerNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Category:</span>
              <span style={{ fontWeight: '600' }}>{data.category}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Load:</span>
              <span style={{ fontWeight: '600' }}>{data.sanctionedLoad || '5 kW'}</span>
            </div>
          </div>
        </div>

        {/* Meter Reading */}
        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '9px', fontWeight: '700', color: colors.primary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Meter Reading
          </div>
          <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Previous:</span>
              <span className="editable-text" contentEditable suppressContentEditableWarning style={{ fontWeight: '600' }}>{data.previousReading}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Current:</span>
              <span className="editable-text" contentEditable suppressContentEditableWarning style={{ fontWeight: '600' }}>{data.currentReading}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: colors.bg, padding: '4px 6px', borderRadius: '4px', marginTop: '4px' }}>
              <span style={{ fontWeight: '700' }}>Units Consumed:</span>
              <span style={{ fontWeight: '800', color: colors.primary }}>{unitsConsumed} kWh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div style={{ fontSize: '9px', marginBottom: '12px', padding: '8px', background: '#fafafa', borderRadius: '4px' }}>
        <span style={{ color: '#64748b' }}>Service Address: </span>
        <span className="editable-text" contentEditable suppressContentEditableWarning style={{ fontWeight: '500' }}>{data.consumerAddress}</span>
      </div>

      {/* Charges Table */}
      <div style={{ marginBottom: '12px' }}>
        <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: colors.primary, color: '#fff' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700' }}>Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '7px 10px' }}>Energy Charges ({unitsConsumed} units)</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600' }}>₹{energyCharges.toFixed(2)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '7px 10px' }}>Fixed / Demand Charges</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600' }}>₹{fixedCharges.toFixed(2)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '7px 10px' }}>Wheeling & Transmission Charges</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600' }}>₹{wheelingCharges.toFixed(2)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '7px 10px' }}>Electricity Duty</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600' }}>₹{electricityDuty.toFixed(2)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '7px 10px' }}>Tax / Cess</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600' }}>₹{taxes.toFixed(2)}</td>
            </tr>
            {arrears > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#FEF2F2' }}>
                <td style={{ padding: '7px 10px', color: '#DC2626' }}>Arrears</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600', color: '#DC2626' }}>₹{arrears.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Total Payable */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '12px'
      }}>
        <div style={{
          background: colors.primary,
          color: '#fff',
          padding: '10px 16px',
          borderRadius: '6px',
          display: 'flex',
          gap: '20px',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '600' }}>Net Payable:</span>
          <span
            className="editable-text"
            contentEditable
            suppressContentEditableWarning
            style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.5px' }}
          >
            ₹{totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px dashed #cbd5e1',
        paddingTop: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '8px',
        color: '#64748b'
      }}>
        <div>
          <div>Please pay before due date to avoid disconnection & late fee.</div>
          {data.paymentMode ? <div>Mode: {data.paymentMode}</div> : null}
          {data.paymentTxnId ? <div>Txn: {data.paymentTxnId}</div> : null}
          {data.paymentRefId ? <div>Ref: {data.paymentRefId}</div> : null}
          {data.upiRef ? <div>UPI Ref: {data.upiRef}</div> : null}
          {isCard && maskedCard ? <div>Card: {maskedCard}</div> : null}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>Customer Care: 1912</div>
          <div>www.{brandName.toLowerCase()}.gov.in</div>
        </div>
      </div>
    </div>
  );
});

ElectricBillCanvas.displayName = 'ElectricBillCanvas';

export default ElectricBillCanvas;
