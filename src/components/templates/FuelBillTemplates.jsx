import React, { useState, useRef } from 'react';
import FuelBillCanvas from '../canvas/FuelBillCanvas';
import FullscreenModal from '../FullscreenModal';
import Watermark from '../Watermark';
import DownloadModal from '../DownloadModal';
import PreviewScaler from '../PreviewScaler';
import { buildExportFilename, firstValidationError, isValidPhone10 } from './templateUtils';

// 4 Template Styles
const templateStyles = [
  { id: 'template1', name: 'Template 1', description: 'Simple thermal receipt' },
  { id: 'template2', name: 'Template 2', description: 'Detailed with extra fields' },
  { id: 'template3', name: 'Template 3', description: 'Clean invoice style' },
  { id: 'template4', name: 'Template 4', description: 'Professional card receipt' }
];

// 6 Logo Options
const logoOptions = [
  { id: 'bpcl', name: 'Bharat Petroleum (BPCL)' },
  { id: 'indianoil', name: 'Indian Oil' },
  { id: 'hpcl', name: 'HP (HPCL)' },
  { id: 'essar', name: 'Essar' },
  { id: 'jiobp', name: 'Jio-bp' },
  { id: 'nayara', name: 'Nayara Energy' }
];

const stationDefaultsByLogo = {
  bpcl: {
    stationName: 'COCO BP VRINDAVAN',
    stationAddress: 'SEC 6 VRINDAVAN YOJNA'
  },
  jiobp: {
    stationName: 'JIO-BP FUEL POINT',
    stationAddress: 'SECTOR 6 VRINDAVAN YOJNA'
  },
  hpcl: {
    stationName: 'HP PETROL PUMP',
    stationAddress: 'VRINDAVAN YOJNA'
  },
  indianoil: {
    stationName: 'INDIANOIL RETAIL OUTLET',
    stationAddress: 'SECTOR 6 VRINDAVAN'
  },
  essar: {
    stationName: 'ESSAR FUEL STATION',
    stationAddress: 'VRINDAVAN YOJNA'
  },
  nayara: {
    stationName: 'NAYARA ENERGY STATION',
    stationAddress: 'SECTOR 6 VRINDAVAN'
  }
};

const paymentDetailDefaults = {
  cash: {
    paymentSubType: 'Cash',
    paymentInstrument: 'Cash',
    paymentTxnId: '',
    paymentRefNo: '',
    cardLast4: '',
    cardMask: '',
    cardScheme: '',
    authCode: '',
    rrn: '',
    aid: '',
    tsi: '',
    tvr: '',
    tc: '',
    appLabel: ''
  },
  upi: {
    paymentSubType: 'Online',
    paymentInstrument: 'UPI',
    paymentTxnId: 'UPI123456789',
    paymentRefNo: 'RRN000123456',
    cardLast4: '',
    cardMask: '',
    cardScheme: '',
    authCode: '',
    rrn: '',
    aid: '',
    tsi: '',
    tvr: '',
    tc: '',
    appLabel: 'UPI'
  },
  netbanking: {
    paymentSubType: 'Online',
    paymentInstrument: 'Net Banking',
    paymentTxnId: 'NBX123456',
    paymentRefNo: 'REF987654'
  },
  wallet: {
    paymentSubType: 'Online',
    paymentInstrument: 'Wallet',
    paymentTxnId: 'WLT908070',
    paymentRefNo: 'REF908070'
  },
  card: {
    paymentSubType: 'Card',
    paymentInstrument: 'Credit Card',
    paymentTxnId: '6032915111',
    paymentRefNo: 'APPR610203',
    cardLast4: '3012',
    cardMask: '************3012',
    cardScheme: 'MASTERCARD',
    authCode: '610203',
    rrn: '004900001719',
    aid: 'A0000000041010',
    tsi: 'B800',
    tvr: '0000048000',
    tc: 'C30978C8EB28125F',
    appLabel: 'MASTERCARD'
  },
  creditcard: {
    paymentSubType: 'Card',
    paymentInstrument: 'Credit Card',
    paymentTxnId: '6032915111',
    paymentRefNo: 'APPR610203',
    cardLast4: '3012',
    cardMask: '************3012',
    cardScheme: 'MASTERCARD',
    authCode: '610203',
    rrn: '004900001719',
    aid: 'A0000000041010',
    tsi: 'B800',
    tvr: '0000048000',
    tc: 'C30978C8EB28125F',
    appLabel: 'MASTERCARD'
  },
  debitcard: {
    paymentSubType: 'Card',
    paymentInstrument: 'Debit Card',
    paymentTxnId: '6892235011',
    paymentRefNo: 'APPR590401',
    cardLast4: '5544',
    cardMask: '************5544',
    cardScheme: 'RUPAY',
    authCode: '590401',
    rrn: '004900009541',
    aid: 'A0000005241010',
    tsi: 'B800',
    tvr: '0000048000',
    tc: 'C30978C8ABCD125F',
    appLabel: 'RUPAY'
  },
  emvcard: {
    paymentSubType: 'Card',
    paymentInstrument: 'EMV Card',
    paymentTxnId: 'EMV778899',
    paymentRefNo: 'TC030978CBE',
    cardLast4: '7742',
    cardMask: '************7742',
    cardScheme: 'VISA',
    authCode: '778899',
    rrn: '004900007742',
    aid: 'A0000000031010',
    tsi: 'B800',
    tvr: '0000048000',
    tc: 'C30978C8EMV77125F',
    appLabel: 'VISA'
  },
  fleetcard: {
    paymentSubType: 'Card',
    paymentInstrument: 'Fleet Card',
    paymentTxnId: 'FLT552211',
    paymentRefNo: 'FLEET9876',
    cardLast4: '2211',
    cardMask: '************2211',
    cardScheme: 'FLEET',
    authCode: '552211',
    rrn: '004900002211',
    aid: 'A0000003331010',
    tsi: 'B800',
    tvr: '0000048000',
    tc: 'C30978C8FLT2211',
    appLabel: 'FLEET'
  }
};

const paymentTypeOptions = ['Cash', 'Online', 'Card'];
const paymentInstrumentOptionsByType = {
  Cash: ['Cash'],
  Online: ['UPI', 'Net Banking', 'Wallet', 'IMPS', 'NEFT', 'RTGS'],
  Card: ['Credit Card', 'Debit Card', 'EMV Card', 'Fleet Card', 'Mastercard', 'Visa', 'RuPay']
};

const billDescription = {
  title: 'Fuel Bill / Petrol Pump Receipt',
  text: 'Generate authentic fuel receipts for petrol, diesel, CNG or LPG purchases. Perfect for fleet management, expense claims, and business reimbursements.',
  features: [
    '4 unique template styles',
    '6 fuel company logos',
    'GST compliant',
    'Vehicle & odometer tracking',
    'Multiple payment modes'
  ]
};

export default function FuelBillTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [selectedLogo, setSelectedLogo] = useState('bpcl');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const canvasRef = useRef(null);
  const [showWatermark, setShowWatermark] = useState(true);
  
  const [formData, setFormData] = useState({
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    billTime: '',
    vehicleNumber: '',
    vehicleType: '',
    customerName: '',
    product: '',
    pricePerLiter: '',
    totalAmount: '',
    paymentMode: '',
    serialNo: 'A127016',
    bankPartner: 'HDFC BANK',
    stationName: '',
    stationAddress: '',
    // Extra fields for Template 2
    telNo: '',
    fccId: '',
    fipNo: '',
    nozzleNo: '',
    lstNo: '',
    vatNo: '',
    attendentId: '',
    // Extra fields for Template 3
    density: ''
    ,
    merchantName: 'TALWAR MOTORS',
    merchantCity: 'Lucknow',
    mid: '',
    tid: '',
    batchNo: '',
    invoiceNo: '',
    paymentSubType: '',
    paymentInstrument: '',
    paymentTxnId: '',
    paymentRefNo: '',
    cardLast4: '',
    cardMask: '',
    cardScheme: '',
    authCode: '',
    rrn: '',
    aid: '',
    tsi: '',
    tvr: '',
    tc: '',
    appLabel: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    if (name === 'cardMask') {
      const digits = String(value || '').replace(/\D/g, '').slice(0, 19);
      const last4 = digits.slice(-4);
      const masked = last4 ? `${'*'.repeat(Math.max(digits.length - 4, 8))}${last4}` : '';
      setFormData(prev => ({ ...prev, cardMask: masked, cardLast4: last4 }));
      return;
    }
    if (name === 'cardLast4') {
      const last4 = String(value || '').replace(/\D/g, '').slice(-4);
      setFormData(prev => ({ ...prev, cardLast4: last4, cardMask: last4 ? `************${last4}` : '' }));
      return;
    }
    const newValue = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleLogoChange = (value) => {
    setSelectedLogo(value);
    const defaults = stationDefaultsByLogo[value] || stationDefaultsByLogo.bpcl;
    setFormData(prev => ({
      ...prev,
      stationName: prev.stationName ? prev.stationName : defaults.stationName,
      stationAddress: prev.stationAddress ? prev.stationAddress : defaults.stationAddress
    }));
  };

  const handlePaymentModeChange = (value) => {
    const key = String(value || '').toLowerCase().replace(/\s+/g, '');
    const fallbackSubType = key.includes('card') ? 'Card' : (key === 'cash' ? 'Cash' : (key ? 'Online' : ''));
    const defaults = paymentDetailDefaults[key] || {
      paymentSubType: fallbackSubType,
      paymentInstrument: value || '',
      paymentTxnId: '',
      paymentRefNo: '',
      cardLast4: '',
      cardMask: '',
      cardScheme: '',
      authCode: '',
      rrn: '',
      aid: '',
      tsi: '',
      tvr: '',
      tc: '',
      appLabel: ''
    };
    setFormData(prev => ({
      ...prev,
      paymentMode: value,
      paymentSubType: defaults.paymentSubType,
      paymentInstrument: defaults.paymentInstrument,
      paymentTxnId: defaults.paymentTxnId,
      paymentRefNo: defaults.paymentRefNo,
      cardLast4: defaults.cardLast4,
      cardMask: defaults.cardMask,
      cardScheme: defaults.cardScheme,
      authCode: defaults.authCode,
      rrn: defaults.rrn,
      aid: defaults.aid,
      tsi: defaults.tsi,
      tvr: defaults.tvr,
      tc: defaults.tc,
      appLabel: defaults.appLabel
    }));
  };

  const handlePaymentSubTypeChange = (value) => {
    const currentInstrument = formData.paymentInstrument || '';
    const allowed = paymentInstrumentOptionsByType[value] || [];
    const nextInstrument = allowed.includes(currentInstrument) ? currentInstrument : (allowed[0] || '');
    setFormData(prev => ({
      ...prev,
      paymentSubType: value,
      paymentInstrument: nextInstrument
    }));
  };

  const handleDownload = () => {
    const validationError = firstValidationError([
      { valid: !!formData.billDate, message: 'Bill date is required.' },
      { valid: !!formData.billTime, message: 'Bill time is required.' },
      { valid: !formData.telNo || formData.telNo.trim(), message: 'Phone must be 10 digits.' }
    ]);

    if (validationError) {
      window.BillGenUI?.notify ? window.BillGenUI.notify(validationError, { type: 'warning', title: 'Missing Required Fields', duration: 4200 }) : window.alert(validationError);
      return;
    }
    setIsDownloadOpen(true);
  };

  const currentTemplate = { templateStyle: selectedTemplate, logoType: selectedLogo };

  return (
    <div className="template-workspace">
      {/* Left Side - Compact Form */}
      <div className="template-form-column compact-form">
        
        {/* Template Style Selector */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Select Template Style</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {templateStyles.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                style={{
                  padding: '10px 8px',
                  border: selectedTemplate === t.id ? '2px solid #6366f1' : '1px solid #ddd',
                  borderRadius: '6px',
                  background: selectedTemplate === t.id ? '#eef2ff' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '11px'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '2px' }}>{t.name}</div>
                <div style={{ color: '#666', fontSize: '10px' }}>{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Logo Selector */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Select Fuel Company Logo</div>
          <select 
            value={selectedLogo} 
            onChange={(e) => handleLogoChange(e.target.value)} 
            className="compact-form-input compact-form-select"
            style={{ width: '100%' }}
          >
            {logoOptions.map(logo => (
              <option key={logo.id} value={logo.id}>{logo.name}</option>
            ))}
          </select>
        </div>

        {/* Fuel Station Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Fuel Station</div>
          <div className="compact-form-grid">
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Fuel Station Name</label>
              <input type="text" name="stationName" value={formData.stationName} onChange={handleInputChange} placeholder={(stationDefaultsByLogo[selectedLogo] || stationDefaultsByLogo.bpcl).stationName} className="compact-form-input" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Fuel Station Address</label>
              <textarea name="stationAddress" value={formData.stationAddress} onChange={handleInputChange} placeholder={(stationDefaultsByLogo[selectedLogo] || stationDefaultsByLogo.bpcl).stationAddress} className="compact-form-input" rows="2" style={{ resize: 'none' }} />
            </div>
          </div>
        </div>

        {/* Receipt Number */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Receipt Details</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Receipt No.</label>
              <input type="text" name="billNumber" value={formData.billNumber} onChange={handleInputChange} placeholder="e.g. 12345" className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Serial No.</label>
              <input type="text" name="serialNo" value={formData.serialNo} onChange={handleInputChange} placeholder="e.g. A127016" className="compact-form-input" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">Bank Partner</label>
              <select name="bankPartner" value={formData.bankPartner} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option value="HDFC BANK">HDFC BANK</option>
                <option value="SBI">SBI</option>
                <option value="ICICI BANK">ICICI BANK</option>
                <option value="AXIS BANK">AXIS BANK</option>
                <option value="KOTAK BANK">KOTAK BANK</option>
                <option value="">None</option>
              </select>
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Nozzle No.</label>
              <input type="text" name="nozzleNo" value={formData.nozzleNo} onChange={handleInputChange} placeholder="e.g. 2" className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Fuel Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Fuel Details</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Fuel Type</label>
              <select name="product" value={formData.product} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option value="">Select Fuel</option>
                <option value="PETROL">PETROL</option>
                <option value="DIESEL">DIESEL</option>
                <option value="CNG">CNG</option>
                <option value="LPG">LPG</option>
                <option value="XP95 PETROL">XP95 PETROL</option>
                <option value="PREMIUM PETROL">PREMIUM PETROL</option>
                <option value="SPEED DIESEL">SPEED DIESEL</option>
              </select>
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Fuel Rate (?/L)</label>
              <input type="number" step="0.01" name="pricePerLiter" value={formData.pricePerLiter} onChange={handleInputChange} placeholder="e.g. 103.50" className="compact-form-input" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">Total Amount (?)</label>
              <input type="number" step="0.01" name="totalAmount" value={formData.totalAmount} onChange={handleInputChange} placeholder="e.g. 2000" className="compact-form-input" style={{ fontWeight: '700', fontSize: '1.1rem' }} />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Density (Kg/m3)</label>
              <input type="text" name="density" value={formData.density} onChange={handleInputChange} placeholder="Optional" className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Vehicle Details</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Vehicle Type</label>
              <select name="vehicleType" value={formData.vehicleType} onChange={handleInputChange} className="compact-form-input compact-form-select">
                <option value="">Select Type</option>
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Truck">Truck</option>
                <option value="Bus">Bus</option>
                <option value="Auto">Auto</option>
                <option value="Scooter">Scooter</option>
              </select>
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Vehicle No</label>
              <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange} placeholder="e.g. KA 01 XX 1234" className="compact-form-input" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Customer Name</label>
              <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} placeholder="Optional" className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Date, Time & Payment */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Date & Payment</div>
          <div className="compact-form-grid cols-3">
            <div className="compact-form-field">
              <label className="compact-form-label">Date</label>
              <input type="date" name="billDate" value={formData.billDate} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Time</label>
              <input type="time" name="billTime" value={formData.billTime} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Mode</label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={(e) => handlePaymentModeChange(e.target.value)}
                className="compact-form-input compact-form-select"
              >
                <option value="">Select</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Wallet">Wallet</option>
                <option value="Card">Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="EMV Card">EMV Card</option>
                <option value="Fleet Card">Fleet Card</option>
              </select>
            </div>
          </div>
        </div>

        {/* Extra Fields for Template 2 */}
        {selectedTemplate === 'template2' && (
          <div className="compact-form-section">
            <div className="compact-form-section-title">Additional Details (Template 2)</div>
            <div className="compact-form-grid">
              <div className="compact-form-field">
                <label className="compact-form-label">Tel. No.</label>
                <input type="text" name="telNo" value={formData.telNo} onChange={handleInputChange} placeholder="Tel No." className="compact-form-input" />
              </div>
              <div className="compact-form-field">
                <label className="compact-form-label">FCC ID</label>
                <input type="text" name="fccId" value={formData.fccId} onChange={handleInputChange} placeholder="FCC ID" className="compact-form-input" />
              </div>
            </div>
            <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
              <div className="compact-form-field">
                <label className="compact-form-label">FIP No.</label>
                <input type="text" name="fipNo" value={formData.fipNo} onChange={handleInputChange} placeholder="FIP No." className="compact-form-input" />
              </div>
              <div className="compact-form-field">
                <label className="compact-form-label">LST No.</label>
                <input type="text" name="lstNo" value={formData.lstNo} onChange={handleInputChange} placeholder="LST No." className="compact-form-input" />
              </div>
            </div>
            <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
              <div className="compact-form-field">
                <label className="compact-form-label">VAT No.</label>
                <input type="text" name="vatNo" value={formData.vatNo} onChange={handleInputChange} placeholder="VAT No." className="compact-form-input" />
              </div>
              <div className="compact-form-field">
                <label className="compact-form-label">Attendant ID</label>
                <input type="text" name="attendentId" value={formData.attendentId} onChange={handleInputChange} placeholder="Attendant ID" className="compact-form-input" />
              </div>
            </div>
          </div>
        )}

        <div className="compact-form-section">
          <div className="compact-form-section-title">Payment Gateway Details</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Payment Type</label>
              <select
                name="paymentSubType"
                value={formData.paymentSubType}
                onChange={(e) => handlePaymentSubTypeChange(e.target.value)}
                className="compact-form-input compact-form-select"
              >
                <option value="">Select Type</option>
                {paymentTypeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Payment Instrument</label>
              <select
                name="paymentInstrument"
                value={formData.paymentInstrument}
                onChange={handleInputChange}
                className="compact-form-input compact-form-select"
              >
                <option value="">Select Instrument</option>
                {(paymentInstrumentOptionsByType[formData.paymentSubType] || ['UPI', 'Credit Card', 'Debit Card', 'Cash']).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">Payment Txn ID</label>
              <input type="text" name="paymentTxnId" value={formData.paymentTxnId} onChange={handleInputChange} placeholder="Transaction Id" className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Payment Ref / Approval</label>
              <input type="text" name="paymentRefNo" value={formData.paymentRefNo} onChange={handleInputChange} placeholder="Reference / Approval Code" className="compact-form-input" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">Card Mask/No</label>
              <input type="password" name="cardMask" value={formData.cardMask} onChange={handleInputChange} placeholder="Enter card number" className="compact-form-input" autoComplete="off" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Card Last 4</label>
              <input type="text" name="cardLast4" value={formData.cardLast4} onChange={handleInputChange} placeholder="3012" className="compact-form-input" maxLength={4} inputMode="numeric" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">Card Scheme</label>
              <input type="text" name="cardScheme" value={formData.cardScheme} onChange={handleInputChange} placeholder="MASTERCARD / VISA / RUPAY" className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Auth Code</label>
              <input type="text" name="authCode" value={formData.authCode} onChange={handleInputChange} placeholder="610203" className="compact-form-input" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">RRN</label>
              <input type="text" name="rrn" value={formData.rrn} onChange={handleInputChange} placeholder="004900001719" className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">AID</label>
              <input type="text" name="aid" value={formData.aid} onChange={handleInputChange} placeholder="A0000000041010" className="compact-form-input" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">TSI</label>
              <input type="text" name="tsi" value={formData.tsi} onChange={handleInputChange} placeholder="B800" className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">TVR</label>
              <input type="text" name="tvr" value={formData.tvr} onChange={handleInputChange} placeholder="0000048000" className="compact-form-input" />
            </div>
          </div>
          <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
            <div className="compact-form-field">
              <label className="compact-form-label">TC</label>
              <input type="text" name="tc" value={formData.tc} onChange={handleInputChange} placeholder="C30978C8EB28125F" className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">App Label</label>
              <input type="text" name="appLabel" value={formData.appLabel} onChange={handleInputChange} placeholder="MASTERCARD" className="compact-form-input" />
            </div>
          </div>
        </div>

        {selectedTemplate === 'template3' && (
          <div className="compact-form-section">
            <div className="compact-form-section-title">Pine Labs Details (Template 3)</div>
            <div className="compact-form-grid">
              <div className="compact-form-field">
                <label className="compact-form-label">Merchant Name</label>
                <input type="text" name="merchantName" value={formData.merchantName} onChange={handleInputChange} placeholder="TALWAR MOTORS" className="compact-form-input" />
              </div>
              <div className="compact-form-field">
                <label className="compact-form-label">City</label>
                <input type="text" name="merchantCity" value={formData.merchantCity} onChange={handleInputChange} placeholder="Lucknow" className="compact-form-input" />
              </div>
            </div>
            <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
              <div className="compact-form-field">
                <label className="compact-form-label">MID</label>
                <input type="text" name="mid" value={formData.mid} onChange={handleInputChange} placeholder="39PLR0000694441" className="compact-form-input" />
              </div>
              <div className="compact-form-field">
                <label className="compact-form-label">TID</label>
                <input type="text" name="tid" value={formData.tid} onChange={handleInputChange} placeholder="PR998189" className="compact-form-input" />
              </div>
            </div>
            <div className="compact-form-grid" style={{ marginTop: '0.65rem' }}>
              <div className="compact-form-field">
                <label className="compact-form-label">Batch No</label>
                <input type="text" name="batchNo" value={formData.batchNo} onChange={handleInputChange} placeholder="000019" className="compact-form-input" />
              </div>
              <div className="compact-form-field">
                <label className="compact-form-label">Invoice No</label>
                <input type="text" name="invoiceNo" value={formData.invoiceNo} onChange={handleInputChange} placeholder="1000608" className="compact-form-input" />
              </div>
            </div>
          </div>
        )}

        {/* Bill Description */}
        <div className="bill-description-section">
          <h3 className="bill-description-title">{billDescription.title}</h3>
          <p className="bill-description-text">{billDescription.text}</p>
          <div className="bill-features-list">
            {billDescription.features.map((feature, i) => (
              <div key={i} className="bill-feature-item">
                <svg className="bill-feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Canvas Preview */}
      <div className="template-preview-column">
        <div className="preview-actions">
          <button className="preview-action-btn secondary" onClick={() => setIsFullscreen(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
            Fullscreen
          </button>
          <button className="preview-action-btn primary" onClick={handleDownload}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download
          </button>
        </div>
        
        <div className="download-status free">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Free: 2 downloads with watermark • Upgrade for unlimited
        </div>
        
        <PreviewScaler>
        <div style={{ position: 'relative' }}>
          <FuelBillCanvas ref={canvasRef} data={{ ...formData, logoType: selectedLogo }} template={currentTemplate} />
          <Watermark show={showWatermark} />
        </div>
        </PreviewScaler>
        
        <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
          Watermark will be removed from actual pdf
        </p>
      </div>

      {/* Fullscreen Modal */}
      <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <FuelBillCanvas data={{ ...formData, logoType: selectedLogo }} template={currentTemplate} />
      </FullscreenModal>

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        canvasRef={canvasRef}
        defaultFilename={buildExportFilename('Fuel Bill', formData.billNumber, formData.billDate)}
        billType="Fuel Bill"
        billData={{
          invoiceId: formData.billNumber,
          vendorName: formData.stationName,
          vendorAddress: formData.stationAddress,
          customerName: formData.customerName,
          vehicleNumber: formData.vehicleNumber,
          product: formData.product,
          rate: parseFloat(formData.pricePerLiter) || 0,
          quantity: parseFloat(formData.pricePerLiter) > 0 && parseFloat(formData.totalAmount) > 0 
            ? (parseFloat(formData.totalAmount) / parseFloat(formData.pricePerLiter)).toFixed(2) 
            : 1,
          total: parseFloat(formData.totalAmount) || 0,
          paymentMethod: formData.paymentMode,
          date: formData.billDate,
          description: `${formData.product} - ${formData.vehicleNumber}`,
          formDataCopy: { ...formData }
        }}
      />
    </div>
  );
}

