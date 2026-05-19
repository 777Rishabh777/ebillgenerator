import React from 'react';

const formatCurrency = (amt) => `₹${Number(amt || 0).toLocaleString('en-IN')}`;
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Template 1: Modern Blue Medical Invoice
const Template1 = ({ data }) => (
  <div style={{ width: '550px', fontFamily: 'Arial, sans-serif', fontSize: '11px', background: '#fff', padding: '25px' }}>
    {/* Header with Logo */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {data.logoUrl ? (
          <img src={data.logoUrl} alt="Hospital Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '4px' }} />
        ) : (
          <div style={{ width: '60px', height: '60px', background: '#4a90e2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', borderRadius: '4px' }}>
            {(data.hospitalName || 'H').substring(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>{data.hospitalName || 'Health Clinic'}</div>
          <div style={{ fontSize: '9px', color: '#666' }}>{data.hospitalAddress || 'Hospital Address'}</div>
          <div style={{ fontSize: '9px', color: '#666' }}>Ph: {data.hospitalPhone || '080-XXXX-XXXX'}</div>
        </div>
      </div>
      <div style={{ background: '#4a90e2', color: '#fff', padding: '10px 15px', borderRadius: '4px', textAlign: 'right' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '3px' }}>MEDICAL INVOICE</div>
        <div style={{ fontSize: '9px' }}>Date: {formatDate(data.billDate)}</div>
        <div style={{ fontSize: '9px' }}>Invoice #: {data.billNumber || '00000001'}</div>
      </div>
    </div>

    {/* Patient and Doctor Info */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
      <div style={{ background: '#f0f4f8', padding: '12px', borderRadius: '4px', border: '1px solid #d0dae5' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#4a90e2', marginBottom: '6px' }}>HEALTH CLINIC</div>
        <div style={{ fontSize: '10px', marginBottom: '2px' }}><strong>Doctor's Name:</strong> {data.doctorName || 'Dr. Name'}</div>
        <div style={{ fontSize: '9px', color: '#666' }}>Address: {data.hospitalAddress}</div>
        <div style={{ fontSize: '9px', color: '#666' }}>Email: {data.hospitalEmail || 'info@clinic.com'}</div>
        <div style={{ fontSize: '9px', color: '#666' }}>Phone: {data.hospitalPhone}</div>
      </div>
      <div style={{ background: '#f0f4f8', padding: '12px', borderRadius: '4px', border: '1px solid #d0dae5' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#4a90e2', marginBottom: '6px' }}>PATIENT</div>
        <div style={{ fontSize: '10px', marginBottom: '2px' }}><strong>Patient Name:</strong> {data.patientName}</div>
        <div style={{ fontSize: '9px', color: '#666' }}>Address: {data.patientAddress}</div>
        <div style={{ fontSize: '9px', color: '#666' }}>Age: {data.patientAge} | Gender: {data.patientGender}</div>
        <div style={{ fontSize: '9px', color: '#666' }}>Patient ID: {data.patientId || 'P-' + data.billNumber}</div>
      </div>
    </div>

    {/* Patient Details Table */}
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '10px' }}>
      <thead>
        <tr style={{ background: '#4a90e2', color: '#fff' }}>
          <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px' }}>PATIENT</th>
          <th style={{ padding: '8px', textAlign: 'center', fontSize: '10px' }}>DATE OF BIRTH</th>
          <th style={{ padding: '8px', textAlign: 'center', fontSize: '10px' }}>SEX</th>
          <th style={{ padding: '8px', textAlign: 'center', fontSize: '10px' }}>WEIGHT</th>
          <th style={{ padding: '8px', textAlign: 'center', fontSize: '10px' }}>HEIGHT</th>
          <th style={{ padding: '8px', textAlign: 'center', fontSize: '10px' }}>DATE</th>
        </tr>
      </thead>
      <tbody>
        <tr style={{ borderBottom: '1px solid #ddd' }}>
          <td style={{ padding: '6px' }}>{data.patientName}</td>
          <td style={{ padding: '6px', textAlign: 'center' }}>{data.dateOfBirth || '-'}</td>
          <td style={{ padding: '6px', textAlign: 'center' }}>{data.patientGender || 'M'}</td>
          <td style={{ padding: '6px', textAlign: 'center' }}>{data.weight || '-'}</td>
          <td style={{ padding: '6px', textAlign: 'center' }}>{data.height || '-'}</td>
          <td style={{ padding: '6px', textAlign: 'center' }}>{formatDate(data.billDate)}</td>
        </tr>
      </tbody>
    </table>

    {/* Services Table */}
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '10px' }}>
      <thead>
        <tr style={{ background: '#4a90e2', color: '#fff' }}>
          <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px' }}>DESCRIPTION</th>
          <th style={{ padding: '8px', textAlign: 'center', fontSize: '10px' }}>QTY.</th>
          <th style={{ padding: '8px', textAlign: 'right', fontSize: '10px' }}>UNIT PRICE</th>
          <th style={{ padding: '8px', textAlign: 'right', fontSize: '10px' }}>AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr style={{ borderBottom: '1px solid #ddd' }}>
          <td style={{ padding: '6px' }}>Consultation Fee</td>
          <td style={{ padding: '6px', textAlign: 'center' }}>1</td>
          <td style={{ padding: '6px', textAlign: 'right' }}>{formatCurrency(data.consultationFee)}</td>
          <td style={{ padding: '6px', textAlign: 'right' }}>{formatCurrency(data.consultationFee)}</td>
        </tr>
        {data.testCharges > 0 && (
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '6px' }}>Medical Tests</td>
            <td style={{ padding: '6px', textAlign: 'center' }}>1</td>
            <td style={{ padding: '6px', textAlign: 'right' }}>{formatCurrency(data.testCharges)}</td>
            <td style={{ padding: '6px', textAlign: 'right' }}>{formatCurrency(data.testCharges)}</td>
          </tr>
        )}
        {data.medicineCharges > 0 && (
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '6px' }}>Medicines</td>
            <td style={{ padding: '6px', textAlign: 'center' }}>1</td>
            <td style={{ padding: '6px', textAlign: 'right' }}>{formatCurrency(data.medicineCharges)}</td>
            <td style={{ padding: '6px', textAlign: 'right' }}>{formatCurrency(data.medicineCharges)}</td>
          </tr>
        )}
        <tr style={{ background: '#4a90e2', color: '#fff', fontWeight: '700' }}>
          <td colSpan="3" style={{ padding: '8px', textAlign: 'right' }}>SUBTOTAL</td>
          <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(data.totalAmount)}</td>
        </tr>
      </tbody>
    </table>

    {/* Comments and Total */}
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px' }}>
      <div style={{ background: '#f0f4f8', padding: '12px', borderRadius: '4px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#4a90e2', marginBottom: '6px' }}>COMMENTS</div>
        <div style={{ fontSize: '9px', lineHeight: '1.5' }}>
          {data.remarks || 'Due upon receipt.'}
          <div style={{ marginTop: '8px' }}>Make all checks payable to:<br /><strong>{data.hospitalName}</strong></div>
        </div>
      </div>
      <div>
        <div style={{ background: '#fff', border: '1px solid #ddd', padding: '8px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
            <span>SUBTOTAL</span>
            <span>{formatCurrency(data.totalAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', marginBottom: '4px' }}>
            <span>DISCOUNT</span>
            <span>₹0.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', marginBottom: '4px' }}>
            <span>TAX RATE</span>
            <span>0.00%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #ddd' }}>
            <span>TAX</span>
            <span>₹0.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}>
            <span>TOTAL</span>
            <span>{formatCurrency(data.totalAmount)}</span>
          </div>
        </div>
        <div style={{ background: '#4a90e2', color: '#fff', padding: '10px', textAlign: 'center', borderRadius: '4px' }}>
          <div style={{ fontSize: '8px', marginBottom: '3px' }}>BALANCE DUE (in INR)</div>
          <div style={{ fontSize: '16px', fontWeight: '700' }}>{formatCurrency(data.totalAmount)}</div>
        </div>
      </div>
    </div>

    <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '10px', fontWeight: '600' }}>Stay Healthy!</div>
  </div>
);

// Template 2: Green Patient Information Form
const Template2 = ({ data }) => (
  <div style={{ width: '550px', fontFamily: 'Arial, sans-serif', fontSize: '11px', background: '#fff', padding: '20px', border: '2px solid #4CAF50' }}>
    {/* Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #4CAF50' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {data.logoUrl ? (
          <img src={data.logoUrl} alt="Hospital Logo" style={{ width: '55px', height: '55px', objectFit: 'contain' }} />
        ) : (
          <div style={{ width: '55px', height: '55px', background: '#4CAF50', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700' }}>
            {(data.hospitalName || 'H').substring(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#2e7d32' }}>{data.hospitalName || 'Angelfield Hospital'}</div>
          <div style={{ fontSize: '9px', color: '#666' }}>{data.hospitalAddress}</div>
          <div style={{ fontSize: '9px', color: '#666' }}>Email: {data.hospitalEmail || 'appointments@hospital.com'}</div>
        </div>
      </div>
    </div>

    {/* Patient Information */}
    <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: '#2e7d32' }}>PATIENT INFORMATION</div>

    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '10px' }}>
      <tbody>
        <tr>
          <td style={{ background: '#c8e6c9', padding: '6px', fontWeight: '600', width: '25%', border: '1px solid #a5d6a7' }}>PATIENT'S NAME</td>
          <td style={{ padding: '6px', border: '1px solid #e0e0e0', width: '25%' }}>{data.patientName}</td>
          <td style={{ background: '#c8e6c9', padding: '6px', fontWeight: '600', width: '25%', border: '1px solid #a5d6a7' }}>PATIENT CODE</td>
          <td style={{ padding: '6px', border: '1px solid #e0e0e0', width: '25%' }}>{data.patientId || 'P-845542'}</td>
        </tr>
        <tr>
          <td style={{ background: '#c8e6c9', padding: '6px', fontWeight: '600', border: '1px solid #a5d6a7' }}>INSURANCE PROVIDER</td>
          <td style={{ padding: '6px', border: '1px solid #e0e0e0' }}>{data.insurance || 'None'}</td>
          <td style={{ background: '#c8e6c9', padding: '6px', fontWeight: '600', border: '1px solid #a5d6a7' }}>POLICY NUMBER</td>
          <td style={{ padding: '6px', border: '1px solid #e0e0e0' }}>{data.policyNumber || '-'}</td>
        </tr>
        <tr>
          <td style={{ background: '#c8e6c9', padding: '6px', fontWeight: '600', border: '1px solid #a5d6a7' }}>BIRTHDATE</td>
          <td style={{ padding: '6px', border: '1px solid #e0e0e0' }}>{data.dateOfBirth || formatDate(data.billDate)}</td>
          <td style={{ background: '#c8e6c9', padding: '6px', fontWeight: '600', border: '1px solid #a5d6a7' }}>AGE</td>
          <td style={{ padding: '6px', border: '1px solid #e0e0e0' }}>{data.patientAge}</td>
        </tr>
        <tr>
          <td style={{ background: '#c8e6c9', padding: '6px', fontWeight: '600', border: '1px solid #a5d6a7' }}>GENDER</td>
          <td style={{ padding: '6px', border: '1px solid #e0e0e0' }}>{data.patientGender}</td>
          <td style={{ background: '#c8e6c9', padding: '6px', fontWeight: '600', border: '1px solid #a5d6a7' }}>PRIMARY CARE PHYSICIAN</td>
          <td style={{ padding: '6px', border: '1px solid #e0e0e0' }}>{data.doctorName || 'Dr. Ashu Jain, MD'}</td>
        </tr>
      </tbody>
    </table>

    {/* Basic Health and Medical History */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
      <div>
        <div style={{ background: '#c8e6c9', padding: '6px', fontWeight: '600', fontSize: '10px', border: '1px solid #a5d6a7' }}>BASIC HEALTH INFORMATION</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0', fontWeight: '600' }}>Blood Type</td>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0' }}>{data.bloodType || 'A+'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0', fontWeight: '600' }}>Height</td>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0' }}>{data.height || '5\'11" (180 cm)'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0', fontWeight: '600' }}>Weight</td>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0' }}>{data.weight || '180 lbs (82 kg)'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0', fontWeight: '600' }}>Blood Pressure</td>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0' }}>{data.bp || '120/80 mmHg'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <div style={{ background: '#c8e6c9', padding: '6px', fontWeight: '600', fontSize: '10px', border: '1px solid #a5d6a7' }}>MEDICAL HISTORY</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0', fontWeight: '600' }}>Condition</td>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0' }}>{data.condition || 'None'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0', fontWeight: '600' }}>Treatment</td>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0' }}>{data.treatment || 'Routine checkup'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0', fontWeight: '600' }}>Previous Surgery</td>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0' }}>{data.surgery || 'None'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0', fontWeight: '600' }}>Family Medical History</td>
              <td style={{ padding: '4px', border: '1px solid #e0e0e0' }}>{data.familyHistory || 'None'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    {/* Emergency Contact */}
    <div style={{ background: '#c8e6c9', padding: '8px', marginBottom: '10px', border: '1px solid #a5d6a7' }}>
      <div style={{ fontWeight: '600', fontSize: '10px', marginBottom: '6px' }}>EMERGENCY CONTACT</div>
      <div style={{ fontSize: '9px' }}>
        <strong>Name:</strong> {data.emergencyContact || 'Annie Dean'} | 
        <strong> Relationship:</strong> {data.emergencyRelation || 'Spouse'} | 
        <strong> Phone:</strong> {data.emergencyPhone || '704-308-2511'}
      </div>
    </div>

    {/* Bill Amount */}
    <div style={{ background: '#f1f8e9', padding: '12px', border: '2px solid #4CAF50', borderRadius: '4px', textAlign: 'center' }}>
      <div style={{ fontSize: '10px', color: '#2e7d32', marginBottom: '4px' }}>TOTAL BILL AMOUNT</div>
      <div style={{ fontSize: '20px', fontWeight: '700', color: '#1b5e20' }}>{formatCurrency(data.totalAmount)}</div>
      <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>Invoice #{data.billNumber} | Date: {formatDate(data.billDate)}</div>
    </div>
  </div>
);

// Template 3: Medical Fact Sheet (Blue/Gray)
const Template3 = ({ data }) => (
  <div style={{ width: '550px', fontFamily: 'Arial, sans-serif', fontSize: '10px', background: '#fff', padding: '25px' }}>
    {/* Header */}
    <div style={{ textAlign: 'center', borderBottom: '3px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
      <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '5px' }}>MEDICAL FACT SHEET</div>
    </div>

    {/* Basic Info */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
      <div>
        <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>PATIENT INFORMATION</div>
        <div style={{ padding: '5px', border: '1px solid #e0e0e0' }}>{data.patientName}</div>
      </div>
      <div>
        <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>DATE OF BIRTH</div>
        <div style={{ padding: '5px', border: '1px solid #e0e0e0' }}>{data.dateOfBirth || 'January 8, 2022'}</div>
      </div>
      <div>
        <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>GENDER</div>
        <div style={{ padding: '5px', border: '1px solid #e0e0e0' }}>{data.patientGender}</div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
      <div>
        <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>ALLERGIES</div>
        <div style={{ padding: '5px', border: '1px solid #e0e0e0' }}>{data.allergies || 'Penicillin, Peanuts'}</div>
      </div>
      <div>
        <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>BLOOD TYPE</div>
        <div style={{ padding: '5px', border: '1px solid #e0e0e0' }}>{data.bloodType || 'B+'}</div>
      </div>
    </div>

    {/* Contact Info */}
    <div style={{ marginBottom: '12px' }}>
      <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>EMERGENCY CONTACT</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '8px', color: '#666', marginTop: '4px' }}>NAME</div>
          <div style={{ padding: '4px' }}>{data.emergencyContact || 'Jane Doe'}</div>
        </div>
        <div>
          <div style={{ fontSize: '8px', color: '#666', marginTop: '4px' }}>RELATIONSHIP</div>
          <div style={{ padding: '4px' }}>{data.emergencyRelation || 'Spouse'}</div>
        </div>
        <div>
          <div style={{ fontSize: '8px', color: '#666', marginTop: '4px' }}>PHONE</div>
          <div style={{ padding: '4px' }}>{data.emergencyPhone || '123-223-3938'}</div>
        </div>
      </div>
    </div>

    {/* Medical Conditions */}
    <div style={{ marginBottom: '12px' }}>
      <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>PAST MEDICAL CONDITIONS</div>
      <div style={{ padding: '8px', border: '1px solid #e0e0e0', minHeight: '40px', fontSize: '9px', lineHeight: '1.4' }}>
        {data.medicalConditions || 'None'}
      </div>
    </div>

    {/* Vital Signs */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
      <div>
        <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>BLOOD PRESSURE</div>
        <div style={{ padding: '5px', border: '1px solid #e0e0e0' }}>{data.bp || '120/80 mmHg'}</div>
      </div>
      <div>
        <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>HEART RATE</div>
        <div style={{ padding: '5px', border: '1px solid #e0e0e0' }}>{data.heartRate || '72 bpm'}</div>
      </div>
      <div>
        <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>RESPIRATORY RATE</div>
        <div style={{ padding: '5px', border: '1px solid #e0e0e0' }}>{data.respRate || '16 breaths/min'}</div>
      </div>
    </div>

    {/* Lab Results */}
    <div style={{ marginBottom: '12px' }}>
      <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>OTHER TEST RESULTS</div>
      <div style={{ padding: '8px', border: '1px solid #e0e0e0', fontSize: '9px' }}>
        {data.testResults || 'Blood Sugar: Normal | Cholesterol: Normal'}
      </div>
    </div>

    {/* Healthcare Provider */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
      <div>
        <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>HEALTHCARE PROVIDER</div>
        <div style={{ padding: '5px', border: '1px solid #e0e0e0' }}>{data.doctorName || 'Dr. Jane Smith'}</div>
      </div>
      <div>
        <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>SPECIALTY</div>
        <div style={{ padding: '5px', border: '1px solid #e0e0e0' }}>{data.specialty || 'Family Medicine'}</div>
      </div>
      <div>
        <div style={{ background: '#e0e0e0', padding: '5px', fontSize: '9px', fontWeight: '600' }}>PHONE</div>
        <div style={{ padding: '5px', border: '1px solid #e0e0e0' }}>{data.hospitalPhone || '(555) 124-5897'}</div>
      </div>
    </div>

    {/* Hospital Info with Logo */}
    <div style={{ background: '#f5f5f5', padding: '12px', borderTop: '2px solid #333', marginTop: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '600' }}>{data.hospitalName || 'Health Medical Center'}</div>
          <div style={{ fontSize: '9px', color: '#666' }}>Email: {data.hospitalEmail || 'drjanesmith@example.com'}</div>
          <div style={{ fontSize: '9px', color: '#666' }}>Bill #{data.billNumber} | Total: {formatCurrency(data.totalAmount)}</div>
        </div>
        {data.logoUrl && (
          <img src={data.logoUrl} alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
        )}
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
