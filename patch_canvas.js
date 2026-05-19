const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'canvas', 'ElectricBillCanvas.jsx');
let c = fs.readFileSync(filePath, 'utf8');

const utilityClassicLayout = `
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
              <div className="editable-text" contentEditable suppressContentEditableWarning style={{ fontSize: '14px' }}>{data.statementDate}</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontWeight: '700', color: '#64748b', fontSize: '14px' }}>Period Statement From</div>
              <div className="editable-text" contentEditable suppressContentEditableWarning style={{ fontSize: '14px' }}>{data.periodFrom}</div>
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#64748b', fontSize: '14px' }}>Period Statement Until</div>
              <div className="editable-text" contentEditable suppressContentEditableWarning style={{ fontSize: '14px' }}>{data.periodTo}</div>
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
                <td className="editable-text" contentEditable suppressContentEditableWarning style={{ border: '1px solid #334155', padding: '8px' }}>{data.periodFrom}</td>
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
                  <td className="editable-text" contentEditable suppressContentEditableWarning style={{ border: '1px solid #334155', padding: '8px', textAlign: 'center', fontWeight: '700' }}>{data.dueDate}</td>
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
`;

// Insert the new style check right at the beginning of the component body
c = c.replace(/export default function ElectricBillCanvas\(\{ data, template \}, ref\) \{/, (match) => match + utilityClassicLayout);

fs.writeFileSync(filePath, c);
console.log('Added utility-classic layout to ElectricBillCanvas.jsx successfully');
