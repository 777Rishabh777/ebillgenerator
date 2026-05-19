import React from 'react';

const formatCurrency = (amt) => `₹${Number(amt || 0).toLocaleString('en-IN')}`;
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
    {data.paymentTxnId ? <div>Txn: {data.paymentTxnId}</div> : null}
    {data.paymentRefId ? <div>Ref: {data.paymentRefId}</div> : null}
    {data.upiRef ? <div>UPI Ref: {data.upiRef}</div> : null}
    {(data.paymentMode || '').toLowerCase().includes('card') && maskedCard(data) ? <div>Card: {maskedCard(data)}</div> : null}
  </>
);

// Template 1: Apollo Hospitals Style - Comprehensive Medical Bill
const Template1 = ({ data }) => (
  <div style={{ width: '595px', fontFamily: 'Arial, sans-serif', fontSize: '9px', background: '#fff', padding: '20px', border: '2px solid #e74c3c', minHeight: '700px', boxSizing: 'border-box' }}>
    {/* Header */}
    <div style={{ borderBottom: '3px solid #e74c3c', paddingBottom: '12px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: '70px', height: '70px', background: '#e74c3c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '700', borderRadius: '50%' }}>
              {(data.hospitalName || 'A').substring(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#e74c3c' }}>{data.hospitalName || 'APOLLO HOSPITALS'}</div>
            <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>{data.hospitalAddress || 'Bannerghatta Road, Bengaluru - 560076'}</div>
            <div style={{ fontSize: '8px', color: '#666' }}>Ph: {data.hospitalPhone || '080-2630-4050'} | Email: {data.hospitalEmail || 'info@apollo.com'}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#e74c3c' }}>MEDICAL INVOICE</div>
          <div style={{ fontSize: '8px', marginTop: '3px' }}>Bill No: {data.billNumber || 'APH/2025/7741'}</div>
          <div style={{ fontSize: '8px' }}>Date: {formatDate(data.billDate)}</div>
          <div style={{ fontSize: '8px' }}>GSTIN: {data.gstin || '29AAAAA0000A1Z5'}</div>
        </div>
      </div>
    </div>

    {/* Patient Information */}
    <div style={{ background: '#fff5f5', border: '1px solid #e74c3c', padding: '10px', marginBottom: '10px' }}>
      <div style={{ fontSize: '10px', fontWeight: '700', color: '#e74c3c', marginBottom: '6px', borderBottom: '1px solid #e74c3c', paddingBottom: '3px' }}>PATIENT DETAILS</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 15px' }}>
        <div><strong>Patient Name:</strong> {data.patientName || 'Kunal Sharma'}</div>
        <div><strong>Patient ID:</strong> {data.patientId || 'AP847521'}</div>
        <div><strong>Age/Gender:</strong> {data.patientAge || 34}Y / {data.patientGender || 'Male'}</div>
        <div><strong>Contact:</strong> {data.patientPhone || '9876543210'}</div>
        <div><strong>Admission:</strong> {formatDate(data.admissionDate || data.billDate)}</div>
        <div><strong>Discharge:</strong> {formatDate(data.dischargeDate || data.billDate)}</div>
        <div style={{ gridColumn: 'span 2' }}><strong>Address:</strong> {data.patientAddress || 'HSR Layout, Bengaluru'}</div>
        <div><strong>Blood Group:</strong> {data.bloodGroup || 'O+'}</div>
      </div>
    </div>

    {/* Doctor & Diagnosis */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
      <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', padding: '8px' }}>
        <div style={{ fontSize: '9px', fontWeight: '700', marginBottom: '4px' }}>CONSULTING DOCTOR</div>
        <div><strong>Name:</strong> {data.doctorName || 'Dr. R. Menon'}</div>
        <div><strong>Specialization:</strong> {data.doctorDept || 'General Medicine'}</div>
        <div><strong>Reg. No:</strong> {data.doctorReg || 'MCI-12345'}</div>
      </div>
      <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', padding: '8px' }}>
        <div style={{ fontSize: '9px', fontWeight: '700', marginBottom: '4px' }}>DIAGNOSIS & TREATMENT</div>
        <div><strong>Diagnosis:</strong> {data.diagnosis || 'Fever, Viral Infection'}</div>
        <div><strong>Visit Type:</strong> {data.visitType || 'OPD'}</div>
        <div><strong>Insurance:</strong> {data.insurance || 'None'}</div>
      </div>
    </div>

    {/* Itemized Bill */}
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '10px', fontWeight: '700', color: '#fff', background: '#e74c3c', padding: '5px 8px' }}>ITEMIZED BILL DETAILS</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
        <thead>
          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6' }}>SL</th>
            <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6' }}>DESCRIPTION</th>
            <th style={{ padding: '6px', textAlign: 'right', border: '1px solid #dee2e6' }}>QTY</th>
            <th style={{ padding: '6px', textAlign: 'right', border: '1px solid #dee2e6' }}>RATE</th>
            <th style={{ padding: '6px', textAlign: 'right', border: '1px solid #dee2e6' }}>AMOUNT (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #dee2e6' }}>
            <td style={{ padding: '5px', border: '1px solid #dee2e6' }}>1</td>
            <td style={{ padding: '5px', border: '1px solid #dee2e6' }}>Consultation Fee - {data.doctorDept || 'General Medicine'}</td>
            <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6' }}>1</td>
            <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6' }}>{formatCurrency(data.consultationFee || 900)}</td>
            <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: '600' }}>{formatCurrency(data.consultationFee || 900)}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #dee2e6' }}>
            <td style={{ padding: '5px', border: '1px solid #dee2e6' }}>2</td>
            <td style={{ padding: '5px', border: '1px solid #dee2e6' }}>Medicines & Pharmacy</td>
            <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6' }}>-</td>
            <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6' }}>-</td>
            <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: '600' }}>{formatCurrency(data.medicineCost || 1850)}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #dee2e6' }}>
            <td style={{ padding: '5px', border: '1px solid #dee2e6' }}>3</td>
            <td style={{ padding: '5px', border: '1px solid #dee2e6' }}>Lab Tests & Diagnostics</td>
            <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6' }}>-</td>
            <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6' }}>-</td>
            <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: '600' }}>{formatCurrency(data.testsCost || 2400)}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #dee2e6' }}>
            <td style={{ padding: '5px', border: '1px solid #dee2e6' }}>4</td>
            <td style={{ padding: '5px', border: '1px solid #dee2e6' }}>Treatment & Procedures</td>
            <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6' }}>-</td>
            <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6' }}>-</td>
            <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: '600' }}>{formatCurrency(data.treatmentCost || 1200)}</td>
          </tr>
          {(data.roomCharges || 0) > 0 && (
            <tr style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '5px', border: '1px solid #dee2e6' }}>5</td>
              <td style={{ padding: '5px', border: '1px solid #dee2e6' }}>Room Charges</td>
              <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6' }}>-</td>
              <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6' }}>-</td>
              <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: '600' }}>{formatCurrency(data.roomCharges)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Summary */}
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
      <div style={{ flex: 1, fontSize: '8px', background: '#f8f9fa', padding: '8px', border: '1px solid #dee2e6' }}>
        <div style={{ fontWeight: '700', marginBottom: '4px' }}>PAYMENT METHOD</div>
        <div>{data.paymentMode || 'Cash'}</div>
        {data.paymentTxnId ? <div style={{ marginTop: '4px' }}>Txn: {data.paymentTxnId}</div> : null}
        {data.paymentRefId ? <div>Ref: {data.paymentRefId}</div> : null}
        {data.upiRef ? <div>UPI Ref: {data.upiRef}</div> : null}
        {(data.paymentMode || '').toLowerCase().includes('card') && maskedCard(data) ? <div>Card: {maskedCard(data)}</div> : null}
        {data.remarks && (
          <>
            <div style={{ fontWeight: '700', marginTop: '6px', marginBottom: '2px' }}>REMARKS</div>
            <div style={{ fontSize: '7px', color: '#666' }}>{data.remarks}</div>
          </>
        )}
      </div>
      <div style={{ width: '200px', border: '2px solid #e74c3c' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderBottom: '1px solid #dee2e6', fontSize: '8px' }}>
          <span>Subtotal:</span>
          <span>{formatCurrency((data.totalAmount || 0) + (data.discount || 0))}</span>
        </div>
        {(data.discount || 0) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderBottom: '1px solid #dee2e6', fontSize: '8px', color: '#28a745' }}>
            <span>Discount:</span>
            <span>- {formatCurrency(data.discount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: '#e74c3c', color: '#fff', fontWeight: '700', fontSize: '11px' }}>
          <span>TOTAL AMOUNT:</span>
          <span>{formatCurrency(data.totalAmount || 6350)}</span>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #dee2e6', fontSize: '7px', color: '#666', textAlign: 'center' }}>
      <p style={{ margin: '0 0 3px 0' }}>This is a computer-generated invoice and does not require a signature.</p>
      <p style={{ margin: 0 }}>For queries, contact: {data.hospitalPhone || '080-2630-4050'} | {data.hospitalEmail || 'billing@apollo.com'}</p>
    </div>
  </div>
);

// Template 2: Medanta/Max Style - Patient Discharge Summary
const Template2 = ({ data }) => (
  <div style={{ width: '595px', fontFamily: 'Arial, sans-serif', fontSize: '9px', background: '#fff', padding: '20px', border: '1px solid #0d47a1', minHeight: '700px', boxSizing: 'border-box' }}>
    {/* Header */}
    <div style={{ background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)', color: '#fff', padding: '15px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {data.logoUrl ? (
            <div style={{ background: '#fff', padding: '8px', borderRadius: '8px' }}>
              <img src={data.logoUrl} alt="Logo" style={{ width: '55px', height: '55px', objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{ width: '70px', height: '70px', background: '#fff', color: '#0d47a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', borderRadius: '50%' }}>
              {(data.hospitalName || 'M').substring(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '0.5px' }}>{data.hospitalName || 'MEDANTA HOSPITAL'}</div>
            <div style={{ fontSize: '8px', marginTop: '2px', opacity: 0.9 }}>{data.hospitalAddress || 'Sector 38, Gurgaon, Haryana - 122001'}</div>
            <div style={{ fontSize: '8px', opacity: 0.9 }}>Ph: {data.hospitalPhone || '0124-4141-414'} | Emergency: 1800-000-0000</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '3px', marginBottom: '4px' }}>PATIENT BILL</div>
          <div style={{ fontSize: '8px' }}>Bill No: {data.billNumber || 'MED/25/7741'}</div>
          <div style={{ fontSize: '8px' }}>Date: {formatDate(data.billDate)}</div>
        </div>
      </div>
    </div>

    {/* Patient Details Grid */}
    <div style={{ background: '#e3f2fd', border: '1px solid #0d47a1', padding: '10px', marginBottom: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 12px', fontSize: '8px' }}>
        <div><strong style={{ color: '#0d47a1' }}>Patient Name:</strong> {data.patientName || 'Kunal Sharma'}</div>
        <div><strong style={{ color: '#0d47a1' }}>UHID:</strong> {data.patientId || 'MED847521'}</div>
        <div><strong style={{ color: '#0d47a1' }}>Age/Sex:</strong> {data.patientAge || 34}Y / {data.patientGender || 'M'}</div>
        <div><strong style={{ color: '#0d47a1' }}>Contact:</strong> {data.patientPhone || '9876543210'}</div>
        <div><strong style={{ color: '#0d47a1' }}>Blood Group:</strong> {data.bloodGroup || 'O+'}</div>
        <div><strong style={{ color: '#0d47a1' }}>Nationality:</strong> {data.nationality || 'Indian'}</div>
        <div style={{ gridColumn: 'span 2' }}><strong style={{ color: '#0d47a1' }}>Address:</strong> {data.patientAddress || 'HSR Layout, Bengaluru'}</div>
        <div><strong style={{ color: '#0d47a1' }}>Insurance:</strong> {data.insurance || 'Self Pay'}</div>
      </div>
    </div>

    {/* Admission & Clinical Details */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
      <div style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '8px' }}>
        <div style={{ fontSize: '9px', fontWeight: '700', color: '#0d47a1', marginBottom: '5px', borderBottom: '1px solid #0d47a1', paddingBottom: '2px' }}>ADMISSION DETAILS</div>
        <div style={{ fontSize: '8px', marginBottom: '2px' }}><strong>Admission Date:</strong> {formatDate(data.admissionDate || data.billDate)}</div>
        <div style={{ fontSize: '8px', marginBottom: '2px' }}><strong>Discharge Date:</strong> {formatDate(data.dischargeDate || data.billDate)}</div>
        <div style={{ fontSize: '8px', marginBottom: '2px' }}><strong>Visit Type:</strong> {data.visitType || 'IPD'}</div>
        <div style={{ fontSize: '8px', marginBottom: '2px' }}><strong>Ward/Room:</strong> {data.roomType || 'General Ward'}</div>
      </div>
      <div style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '8px' }}>
        <div style={{ fontSize: '9px', fontWeight: '700', color: '#0d47a1', marginBottom: '5px', borderBottom: '1px solid #0d47a1', paddingBottom: '2px' }}>CLINICAL INFORMATION</div>
        <div style={{ fontSize: '8px', marginBottom: '2px' }}><strong>Consultant:</strong> {data.doctorName || 'Dr. R. Menon'}</div>
        <div style={{ fontSize: '8px', marginBottom: '2px' }}><strong>Department:</strong> {data.doctorDept || 'General Medicine'}</div>
        <div style={{ fontSize: '8px', marginBottom: '2px' }}><strong>Diagnosis:</strong> {data.diagnosis || 'Viral Fever'}</div>
        <div style={{ fontSize: '8px', marginBottom: '2px' }}><strong>Procedure:</strong> {data.procedure || 'N/A'}</div>
      </div>
    </div>

    {/* Detailed Billing Table */}
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '10px', fontWeight: '700', background: '#0d47a1', color: '#fff', padding: '5px 8px' }}>CHARGES BREAKDOWN</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
        <thead>
          <tr style={{ background: '#bbdefb' }}>
            <th style={{ padding: '5px', textAlign: 'left', border: '1px solid #90caf9' }}>PARTICULARS</th>
            <th style={{ padding: '5px', textAlign: 'center', border: '1px solid #90caf9' }}>QUANTITY</th>
            <th style={{ padding: '5px', textAlign: 'right', border: '1px solid #90caf9' }}>RATE</th>
            <th style={{ padding: '5px', textAlign: 'right', border: '1px solid #90caf9' }}>AMOUNT (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: '#f5f5f5' }}>
            <td colSpan="4" style={{ padding: '4px', fontWeight: '600', border: '1px solid #ddd' }}>CONSULTATION & DOCTOR FEES</td>
          </tr>
          <tr>
            <td style={{ padding: '4px', border: '1px solid #ddd' }}>Consultation Fee - {data.doctorDept || 'General Medicine'}</td>
            <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ddd' }}>1</td>
            <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(data.consultationFee || 900)}</td>
            <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd', fontWeight: '600' }}>{formatCurrency(data.consultationFee || 900)}</td>
          </tr>
          
          <tr style={{ background: '#f5f5f5' }}>
            <td colSpan="4" style={{ padding: '4px', fontWeight: '600', border: '1px solid #ddd' }}>DIAGNOSTIC & INVESTIGATION</td>
          </tr>
          <tr>
            <td style={{ padding: '4px', border: '1px solid #ddd' }}>Laboratory Tests & Pathology</td>
            <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ddd' }}>-</td>
            <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd' }}>-</td>
            <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd', fontWeight: '600' }}>{formatCurrency(data.testsCost || 2400)}</td>
          </tr>
          
          <tr style={{ background: '#f5f5f5' }}>
            <td colSpan="4" style={{ padding: '4px', fontWeight: '600', border: '1px solid #ddd' }}>PHARMACY & MEDICINES</td>
          </tr>
          <tr>
            <td style={{ padding: '4px', border: '1px solid #ddd' }}>Medicines & Consumables</td>
            <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ddd' }}>-</td>
            <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd' }}>-</td>
            <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd', fontWeight: '600' }}>{formatCurrency(data.medicineCost || 1850)}</td>
          </tr>
          
          <tr style={{ background: '#f5f5f5' }}>
            <td colSpan="4" style={{ padding: '4px', fontWeight: '600', border: '1px solid #ddd' }}>PROCEDURES & TREATMENT</td>
          </tr>
          <tr>
            <td style={{ padding: '4px', border: '1px solid #ddd' }}>Treatment & Procedures</td>
            <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ddd' }}>-</td>
            <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd' }}>-</td>
            <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd', fontWeight: '600' }}>{formatCurrency(data.treatmentCost || 1200)}</td>
          </tr>

          {(data.roomCharges || 0) > 0 && (
            <>
              <tr style={{ background: '#f5f5f5' }}>
                <td colSpan="4" style={{ padding: '4px', fontWeight: '600', border: '1px solid #ddd' }}>ROOM & ACCOMMODATION</td>
              </tr>
              <tr>
                <td style={{ padding: '4px', border: '1px solid #ddd' }}>Room Charges - {data.roomType || 'General Ward'}</td>
                <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ddd' }}>-</td>
                <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd' }}>-</td>
                <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd', fontWeight: '600' }}>{formatCurrency(data.roomCharges)}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>

    {/* Summary Section */}
    <div style={{ display: 'flex', gap: '10px' }}>
      <div style={{ flex: 1, background: '#f5f5f5', padding: '8px', border: '1px solid #ccc', fontSize: '8px' }}>
        <div style={{ fontWeight: '700', marginBottom: '3px' }}>PAYMENT INFORMATION</div>
        <div>Mode: {data.paymentMode || 'Cash'}</div>
        {paymentLines(data)}
        {data.remarks && (
          <>
            <div style={{ fontWeight: '700', marginTop: '5px', marginBottom: '2px' }}>CLINICAL NOTES</div>
            <div style={{ fontSize: '7px', color: '#666' }}>{data.remarks}</div>
          </>
        )}
      </div>
      <div style={{ width: '220px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
          <tbody>
            <tr style={{ background: '#f5f5f5' }}>
              <td style={{ padding: '5px', border: '1px solid #ddd' }}>Gross Amount</td>
              <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #ddd', fontWeight: '600' }}>{formatCurrency((data.totalAmount || 0) + (data.discount || 0))}</td>
            </tr>
            {(data.discount || 0) > 0 && (
              <tr>
                <td style={{ padding: '5px', border: '1px solid #ddd', color: '#28a745' }}>Discount</td>
                <td style={{ padding: '5px', textAlign: 'right', border: '1px solid #ddd', color: '#28a745', fontWeight: '600' }}>- {formatCurrency(data.discount)}</td>
              </tr>
            )}
            <tr style={{ background: '#0d47a1', color: '#fff' }}>
              <td style={{ padding: '7px', border: '1px solid #0d47a1', fontWeight: '700', fontSize: '10px' }}>NET PAYABLE</td>
              <td style={{ padding: '7px', textAlign: 'right', border: '1px solid #0d47a1', fontWeight: '700', fontSize: '11px' }}>{formatCurrency(data.totalAmount || 6350)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    {/* Footer */}
    <div style={{ marginTop: '10px', paddingTop: '6px', borderTop: '1px solid #ccc', fontSize: '7px', color: '#666' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: '0 0 2px 0' }}><strong>For queries:</strong> billing@medanta.com | {data.hospitalPhone || '0124-4141-414'}</p>
          <p style={{ margin: 0 }}>This is a computer-generated bill and does not require a signature.</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '6px', color: '#999' }}>
          <p style={{ margin: 0 }}>Generated: {new Date().toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  </div>
);

// Template 3: Fortis/Max Style - Comprehensive Medical Report
const Template3 = ({ data }) => (
  <div style={{ width: '595px', fontFamily: 'Arial, sans-serif', fontSize: '9px', background: '#fff', padding: '20px', border: '2px solid #00796b', minHeight: '700px', boxSizing: 'border-box' }}>
    {/* Header */}
    <div style={{ borderBottom: '4px solid #00796b', paddingBottom: '10px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="Logo" style={{ width: '65px', height: '65px', objectFit: 'contain', border: '2px solid #00796b', borderRadius: '8px', padding: '5px' }} />
          ) : (
            <div style={{ width: '65px', height: '65px', background: '#00796b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: '700', borderRadius: '8px' }}>
              {(data.hospitalName || 'F').substring(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#00796b' }}>{data.hospitalName || 'FORTIS HOSPITAL'}</div>
            <div style={{ fontSize: '8px', color: '#666', marginTop: '2px' }}>{data.hospitalAddress || 'Bannerghatta Road, Bengaluru - 560076'}</div>
            <div style={{ fontSize: '8px', color: '#666' }}>
              Contact: {data.hospitalPhone || '080-6621-4444'} | Email: {data.hospitalEmail || 'care@fortis.in'}
            </div>
            <div style={{ fontSize: '7px', color: '#666', marginTop: '1px' }}>NABL Accredited | ISO 9001:2015 Certified</div>
          </div>
        </div>
        <div style={{ background: '#00796b', color: '#fff', padding: '8px 12px', borderRadius: '4px', textAlign: 'center', minWidth: '120px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700' }}>INVOICE</div>
          <div style={{ fontSize: '8px', marginTop: '3px', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '3px' }}>
            <div>{data.billNumber || 'FOR/25/7741'}</div>
            <div style={{ marginTop: '1px' }}>{formatDate(data.billDate)}</div>
          </div>
        </div>
      </div>
    </div>

    {/* Patient Demographics */}
    <div style={{ background: '#e0f2f1', border: '2px solid #00796b', padding: '10px', marginBottom: '10px' }}>
      <div style={{ fontSize: '10px', fontWeight: '700', color: '#00796b', marginBottom: '6px' }}>PATIENT DEMOGRAPHICS & VISIT INFORMATION</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px 10px', fontSize: '8px' }}>
        <div><strong>Patient Name:</strong><br/>{data.patientName || 'Kunal Sharma'}</div>
        <div><strong>MRN/UHID:</strong><br/>{data.patientId || 'FOR847521'}</div>
        <div><strong>Age/Gender:</strong><br/>{data.patientAge || 34} Years / {data.patientGender || 'Male'}</div>
        <div><strong>Blood Group:</strong><br/>{data.bloodGroup || 'O Positive'}</div>
        <div><strong>Mobile:</strong><br/>{data.patientPhone || '+91-9876543210'}</div>
        <div><strong>Admission:</strong><br/>{formatDate(data.admissionDate || data.billDate)}</div>
        <div><strong>Discharge:</strong><br/>{formatDate(data.dischargeDate || data.billDate)}</div>
        <div><strong>Visit Type:</strong><br/>{data.visitType || 'OPD'}</div>
        <div style={{ gridColumn: 'span 2' }}><strong>Address:</strong><br/>{data.patientAddress || 'HSR Layout, Bengaluru'}</div>
        <div style={{ gridColumn: 'span 2' }}><strong>Insurance/TPA:</strong><br/>{data.insurance || 'Self Paying'}</div>
      </div>
    </div>

    {/* Clinical Summary */}
    <div style={{ background: '#fff', border: '1px solid #00796b', padding: '8px', marginBottom: '10px' }}>
      <div style={{ fontSize: '9px', fontWeight: '700', color: '#00796b', marginBottom: '5px' }}>CLINICAL SUMMARY</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '8px' }}>
        <div><strong>Treating Consultant:</strong> {data.doctorName || 'Dr. R. Menon, MD'}</div>
        <div><strong>Department:</strong> {data.doctorDept || 'General Medicine'}</div>
        <div><strong>Primary Diagnosis:</strong> {data.diagnosis || 'Acute Viral Fever with Weakness'}</div>
        <div><strong>Procedure/Surgery:</strong> {data.procedure || 'Conservative Management'}</div>
      </div>
    </div>

    {/* Billing Details */}
    <div style={{ marginBottom: '10px' }}>
      <div style={{ background: '#00796b', color: '#fff', padding: '5px 8px', fontSize: '10px', fontWeight: '700' }}>DETAILED BILLING STATEMENT</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', border: '1px solid #00796b' }}>
        <thead>
          <tr style={{ background: '#b2dfdb' }}>
            <th style={{ padding: '5px', textAlign: 'left', border: '1px solid #00796b', width: '8%' }}>S.No</th>
            <th style={{ padding: '5px', textAlign: 'left', border: '1px solid #00796b' }}>SERVICE DESCRIPTION</th>
            <th style={{ padding: '5px', textAlign: 'center', border: '1px solid #00796b', width: '12%' }}>QTY</th>
            <th style={{ padding: '5px', textAlign: 'right', border: '1px solid #00796b', width: '15%' }}>RATE (₹)</th>
            <th style={{ padding: '5px', textAlign: 'right', border: '1px solid #00796b', width: '18%' }}>AMOUNT (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: '#f5f5f5', fontWeight: '600' }}>
            <td colSpan="5" style={{ padding: '4px 5px', border: '1px solid #ddd' }}>CONSULTATION & PROFESSIONAL FEES</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 5px', border: '1px solid #ddd' }}>1</td>
            <td style={{ padding: '4px 5px', border: '1px solid #ddd' }}>Doctor Consultation - {data.doctorDept || 'General Medicine'}</td>
            <td style={{ padding: '4px 5px', textAlign: 'center', border: '1px solid #ddd' }}>1</td>
            <td style={{ padding: '4px 5px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(data.consultationFee || 900)}</td>
            <td style={{ padding: '4px 5px', textAlign: 'right', border: '1px solid #ddd', fontWeight: '600' }}>{formatCurrency(data.consultationFee || 900)}</td>
          </tr>
          
          <tr style={{ background: '#f5f5f5', fontWeight: '600' }}>
            <td colSpan="5" style={{ padding: '4px 5px', border: '1px solid #ddd' }}>INVESTIGATIONS & DIAGNOSTICS</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 5px', border: '1px solid #ddd' }}>2</td>
            <td style={{ padding: '4px 5px', border: '1px solid #ddd' }}>Laboratory & Pathology Tests</td>
            <td style={{ padding: '4px 5px', textAlign: 'center', border: '1px solid #ddd' }}>Multiple</td>
            <td style={{ padding: '4px 5px', textAlign: 'right', border: '1px solid #ddd' }}>-</td>
            <td style={{ padding: '4px 5px', textAlign: 'right', border: '1px solid #ddd', fontWeight: '600' }}>{formatCurrency(data.testsCost || 2400)}</td>
          </tr>
          
          <tr style={{ background: '#f5f5f5', fontWeight: '600' }}>
            <td colSpan="5" style={{ padding: '4px 5px', border: '1px solid #ddd' }}>PHARMACY & DRUGS</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 5px', border: '1px solid #ddd' }}>3</td>
            <td style={{ padding: '4px 5px', border: '1px solid #ddd' }}>Medicines, Injections & Consumables</td>
            <td style={{ padding: '4px 5px', textAlign: 'center', border: '1px solid #ddd' }}>-</td>
            <td style={{ padding: '4px 5px', textAlign: 'right', border: '1px solid #ddd' }}>-</td>
            <td style={{ padding: '4px 5px', textAlign: 'right', border: '1px solid #ddd', fontWeight: '600' }}>{formatCurrency(data.medicineCost || 1850)}</td>
          </tr>
          
          <tr style={{ background: '#f5f5f5', fontWeight: '600' }}>
            <td colSpan="5" style={{ padding: '4px 5px', border: '1px solid #ddd' }}>TREATMENT & PROCEDURES</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 5px', border: '1px solid #ddd' }}>4</td>
            <td style={{ padding: '4px 5px', border: '1px solid #ddd' }}>Medical Procedures & Therapeutic Services</td>
            <td style={{ padding: '4px 5px', textAlign: 'center', border: '1px solid #ddd' }}>-</td>
            <td style={{ padding: '4px 5px', textAlign: 'right', border: '1px solid #ddd' }}>-</td>
            <td style={{ padding: '4px 5px', textAlign: 'right', border: '1px solid #ddd', fontWeight: '600' }}>{formatCurrency(data.treatmentCost || 1200)}</td>
          </tr>

          {(data.roomCharges || 0) > 0 && (
            <>
              <tr style={{ background: '#f5f5f5', fontWeight: '600' }}>
                <td colSpan="5" style={{ padding: '4px 5px', border: '1px solid #ddd' }}>ROOM & BOARD CHARGES</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 5px', border: '1px solid #ddd' }}>5</td>
                <td style={{ padding: '4px 5px', border: '1px solid #ddd' }}>Accommodation - {data.roomType || 'General Ward'}</td>
                <td style={{ padding: '4px 5px', textAlign: 'center', border: '1px solid #ddd' }}>-</td>
                <td style={{ padding: '4px 5px', textAlign: 'right', border: '1px solid #ddd' }}>-</td>
                <td style={{ padding: '4px 5px', textAlign: 'right', border: '1px solid #ddd', fontWeight: '600' }}>{formatCurrency(data.roomCharges)}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>

    {/* Financial Summary */}
    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
      <div style={{ flex: 1, background: '#f5f5f5', border: '1px solid #ddd', padding: '8px', fontSize: '8px' }}>
        <div style={{ fontWeight: '700', marginBottom: '3px' }}>PAYMENT DETAILS</div>
        <div>Payment Mode: {data.paymentMode || 'Cash'}</div>
        {paymentLines(data)}
        <div style={{ marginTop: '4px' }}>Status: <span style={{ color: '#28a745', fontWeight: '600' }}>PAID</span></div>
        {data.remarks && (
          <>
            <div style={{ fontWeight: '700', marginTop: '5px', marginBottom: '2px' }}>DISCHARGE INSTRUCTIONS</div>
            <div style={{ fontSize: '7px', color: '#666' }}>{data.remarks}</div>
          </>
        )}
      </div>
      <div style={{ width: '230px', border: '2px solid #00796b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: '#f5f5f5', borderBottom: '1px solid #ddd', fontSize: '8px' }}>
          <span>Gross Total:</span>
          <span style={{ fontWeight: '600' }}>{formatCurrency((data.totalAmount || 0) + (data.discount || 0))}</span>
        </div>
        {(data.discount || 0) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: '#fff', borderBottom: '1px solid #ddd', fontSize: '8px', color: '#28a745' }}>
            <span>Discount Applied:</span>
            <span style={{ fontWeight: '600' }}>- {formatCurrency(data.discount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#00796b', color: '#fff', fontWeight: '700', fontSize: '12px' }}>
          <span>NET AMOUNT PAYABLE:</span>
          <span>{formatCurrency(data.totalAmount || 6350)}</span>
        </div>
        <div style={{ padding: '5px 8px', background: '#e0f2f1', fontSize: '7px', textAlign: 'center', color: '#00796b', fontWeight: '600' }}>
          Amount in words: {data.amountInWords || 'Six Thousand Three Hundred Fifty Only'}
        </div>
      </div>
    </div>

    {/* Footer */}
    <div style={{ borderTop: '2px solid #00796b', paddingTop: '6px', fontSize: '7px', color: '#666' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '0 0 2px 0' }}>For billing queries: accounts@fortis.in | {data.hospitalPhone || '080-6621-4444'}</p>
          <p style={{ margin: 0 }}>This is a system-generated invoice. No signature required.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '8px', fontWeight: '700', color: '#00796b' }}>Authorized Signatory</div>
          <div style={{ height: '20px' }}></div>
          <div style={{ borderTop: '1px solid #666', paddingTop: '2px' }}>Hospital Seal</div>
        </div>
      </div>
    </div>
  </div>
);

const MedicalBillCanvas = React.forwardRef(({ data, template }, ref) => {
  const templateStyle = template?.templateStyle || 'template1';
  
  return (
    <div ref={ref}>
      {templateStyle === 'template1' && <Template1 data={data} />}
      {templateStyle === 'template2' && <Template2 data={data} />}
      {templateStyle === 'template3' && <Template3 data={data} />}
    </div>
  );
});

MedicalBillCanvas.displayName = 'MedicalBillCanvas';

export default MedicalBillCanvas;
