import React from 'react';

// Import actual logo images
import indianoilLogo from '../images/Screenshot 2026-04-01 135010.png';
import bpclLogo from '../images/Screenshot 2026-04-01 135020.png';
import nayaraLogo from '../images/Screenshot 2026-04-01 135029.png';
import hpclLogo from '../images/Screenshot 2026-04-01 135036.png';
import essarLogo from '../images/Screenshot 2026-04-01 135044.png';
import jiobpLogo from '../images/Screenshot 2026-04-01 135056.png';

const logoImages = {
  bpcl: bpclLogo,
  indianoil: indianoilLogo,
  hpcl: hpclLogo,
  jiobp: jiobpLogo,
  nayara: nayaraLogo,
  essar: essarLogo
};

const getLogo = (logoType, height = '50px') => {
  const logoSrc = logoImages[logoType] || logoImages.bpcl;
  return <img src={logoSrc} alt={logoType} style={{ height, objectFit: 'contain' }} />;
};

const brandMeta = {
  bpcl: {
    welcome: 'WELCOME TO BPCL!',
    stationName: 'COCO BP VRINDAVAN',
    stationAddress: 'SEC 6 VRINDAVAN YOJNA'
  },
  jiobp: {
    welcome: 'WELCOME TO JIO-BP!',
    stationName: 'JIO-BP FUEL POINT',
    stationAddress: 'SECTOR 6 VRINDAVAN YOJNA'
  },
  hpcl: {
    welcome: 'WELCOME TO HPCL!',
    stationName: 'HP PETROL PUMP',
    stationAddress: 'VRINDAVAN YOJNA'
  },
  indianoil: {
    welcome: 'WELCOME TO INDIANOIL!',
    stationName: 'INDIANOIL RETAIL OUTLET',
    stationAddress: 'SECTOR 6 VRINDAVAN'
  },
  essar: {
    welcome: 'WELCOME TO ESSAR!',
    stationName: 'ESSAR FUEL STATION',
    stationAddress: 'VRINDAVAN YOJNA'
  },
  nayara: {
    welcome: 'WELCOME TO NAYARA!',
    stationName: 'NAYARA ENERGY STATION',
    stationAddress: 'SECTOR 6 VRINDAVAN'
  }
};

const getBrand = (logoType) => brandMeta[logoType] || brandMeta.bpcl;

const getPumpDetails = (data, logoType) => {
  const brand = getBrand(logoType);
  const stationName = data.stationName || brand.stationName;
  const stationAddress = data.stationAddress || brand.stationAddress;
  const welcome = brand.welcome;
  return { stationName, stationAddress, welcome };
};

const SideSerials = ({ serialNo }) => (
  <>
    {[15, 260, 520].map((top) => (
      <div
        key={`right-${top}`}
        style={{ position: 'absolute', right: '8px', top: `${top}px`, writingMode: 'vertical-rl', fontSize: '9px', color: '#999', letterSpacing: '1px' }}
      >
        {serialNo}
      </div>
    ))}
    {[15, 260, 520].map((top) => (
      <div
        key={`left-${top}`}
        style={{ position: 'absolute', left: '8px', top: `${top}px`, writingMode: 'vertical-rl', fontSize: '9px', color: '#999', letterSpacing: '1px' }}
      >
        pine labs
      </div>
    ))}
  </>
);

const StampFont = '"Courier New", "Lucida Console", Consolas, monospace';

const formatVolumeDisplay = (volume) => (volume === 'NaN' ? '--' : volume);
const isCardPayment = (data) =>
  (String(data.paymentSubType || '').toUpperCase() === 'CARD') ||
  String(data.paymentMode || '').toLowerCase().includes('card');

const maskedCardNumber = (data) => {
  const last4 = String(data.cardLast4 || '').replace(/\D/g, '').slice(-4);
  if (last4) return `************${last4}`;
  const digitsFromMask = String(data.cardMask || '').replace(/\D/g, '');
  if (!digitsFromMask) return '';
  return `************${digitsFromMask.slice(-4)}`;
};

const paymentLineItems = (data) => {
  const isCard = isCardPayment(data);
  const lines = [
    ['Pay Type', data.paymentSubType],
    ['Instrument', data.paymentInstrument],
    ['Txn ID', data.paymentTxnId],
    ['Ref / Approval', data.paymentRefNo]
  ];

  if (isCard) {
    const maskedCard = maskedCardNumber(data);
    lines.push(
      ['Card No', maskedCard],
      ['Last4', data.cardLast4],
      ['Card Scheme', data.cardScheme],
      ['Auth Code', data.authCode],
      ['RRN', data.rrn],
      ['AID', data.aid],
      ['TSI', data.tsi],
      ['TVR', data.tvr],
      ['TC', data.tc],
      ['App Label', data.appLabel]
    );
  }

  return lines.filter(([, value]) => value);
};

const renderPaymentLines = (data, options = {}) => {
  const { marginTop = '4px', bordered = false } = options;
  const lines = paymentLineItems(data);
  if (!lines.length) return null;
  return (
    <div style={{ marginTop, ...(bordered ? { borderTop: '1px dashed #999', paddingTop: '6px' } : {}) }}>
      {lines.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>{label}:</span>
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
};

const renderCenteredLogo = (logoType, height) => (
  <div style={{ textAlign: 'center', marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
    {getLogo(logoType, height)}
  </div>
);

const renderSerialText = (serialNo) => <SideSerials serialNo={serialNo} />;

const renderBankText = (data) => (
  <div style={{ position: 'absolute', right: '5px', top: '45%', transform: 'translateY(-50%) rotate(90deg)', fontSize: '8px', color: '#ccc', whiteSpace: 'nowrap', letterSpacing: '1px' }}>
    {data.bankPartner || 'HDFC BANK'}
  </div>
);

const renderHeader = (data, logoType) => {
  const { stationName, stationAddress, welcome } = getPumpDetails(data, logoType);
  return (
    <>
      <div style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '1px', marginBottom: '3px' }}>{welcome}</div>
      <div style={{ textAlign: 'center', fontSize: '18px', marginBottom: '2px' }}>{stationName}</div>
      <div style={{ textAlign: 'center', fontSize: '15px', marginBottom: '10px' }}>{stationAddress}</div>
    </>
  );
};

// Template 1: Simple Thermal Receipt
const Template1 = ({ data, logoType, formatDate, rate, amount, volume, serialNo }) => (
  <div style={{
    fontFamily: StampFont,
    fontSize: '12px',
    lineHeight: '1.5',
    width: '320px',
    minHeight: '700px',
    background: '#fff',
    padding: '20px 18px 24px 18px',
    border: '1px solid #ddd',
    color: '#000',
    position: 'relative', 
    fontWeight: '700',
    letterSpacing: '0.2px',
    boxSizing: 'border-box',
    overflow: 'hidden'
  }}>
    {(() => {
      const displayVolume = formatVolumeDisplay(volume);
      return (
        <>
    {renderSerialText(serialNo)}
    {renderBankText(data)}
    {renderCenteredLogo(logoType, '70px')}
    {renderHeader(data, logoType)}

    {/* Receipt metadata */}
    <div style={{ marginBottom: '12px', borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span>Date:</span>
        <span>{formatDate(data.billDate)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span>Time:</span>
        <span>{data.billTime || '00:00:00'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span>Nozzle No:</span>
        <span>{data.nozzleNo || '2'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Txn Id:</span>
        <span>{data.billNumber || ''}</span>
      </div>
    </div>

    <div style={{ borderBottom: '1px dashed #999', paddingBottom: '10px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span>Product:</span>
        <span>{data.product || ''}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span>PayMode:</span>
        <span>{(data.paymentMode || '').toUpperCase()}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span>Rate/Ltr.:</span>
        <span>{rate > 0 ? rate.toFixed(2) : '--'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span>Volume(Ltr.):</span>
        <span>{displayVolume}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Amount(Rs.):</span>
        <span>{amount > 0 ? amount.toFixed(2) : '--'}</span>
      </div>
      {renderPaymentLines(data, { marginTop: '6px' })}
    </div>
    
    <div style={{ marginBottom: '12px', borderBottom: '1px dashed #999', paddingBottom: '10px' }}>
      <div style={{ marginBottom: '4px' }}><span style={{ fontWeight: '700' }}>VehNo:</span> {data.vehicleNumber || ''}</div>
      <div style={{ marginBottom: '4px' }}><span style={{ fontWeight: '700' }}>Attendant:</span> {data.attendentId || ''}</div>
      <div><span style={{ fontWeight: '700' }}>Customer:</span> {data.customerName || ''}</div>
    </div>
    
    <div style={{ textAlign: 'center', fontSize: '16px', lineHeight: '1.4', marginTop: '12px' }}>
      <div>THANKS FOR VISIT AGAIN</div>
      <div>THANK YOU</div>
    </div>
        </>
      );
    })()}
  </div>
);

// Template 2: Detailed Thermal with Extra Fields
const Template2 = ({ data, logoType, formatDate, rate, amount, volume, serialNo }) => (
  <div style={{ 
    fontFamily: StampFont,
    fontSize: '12px',
    lineHeight: '1.4',
    width: '320px',
    minHeight: '650px',
    background: '#FAFAFA',
    padding: '20px 18px 24px 18px',
    border: '1px solid #ddd',
    color: '#000',
    position: 'relative', 
    fontWeight: '700',
    letterSpacing: '0.25px',
    textTransform: 'uppercase',
    boxSizing: 'border-box'
  }}>
    {(() => {
      const displayVolume = formatVolumeDisplay(volume);
      return (
        <>
    {renderSerialText(serialNo)}
    {renderBankText(data)}
    {renderCenteredLogo(logoType, '74px')}
    <div style={{ textTransform: 'none' }}>
      {renderHeader(data, logoType)}
    </div>
    
    {/* Receipt Info Section */}
    <div style={{ marginBottom: '12px', borderBottom: '1px dashed #aaa', paddingBottom: '10px' }}>
      <div style={{ marginBottom: '3px' }}><span style={{ fontWeight: '700' }}>TEL. NO.:</span> {data.telNo || ''}</div>
      <div style={{ marginBottom: '3px' }}><span style={{ fontWeight: '700' }}>RECEIPT NO.:</span> {data.billNumber || ''}</div>
      <div style={{ marginBottom: '3px' }}><span style={{ fontWeight: '700' }}>FCC ID:</span> {data.fccId || ''}</div>
      <div style={{ marginBottom: '3px' }}><span style={{ fontWeight: '700' }}>FIP NO.:</span> {data.fipNo || ''}</div>
      <div><span style={{ fontWeight: '700' }}>NOZZLE NO.:</span> {data.nozzleNo || ''}</div>
    </div>
    
    {/* Fuel Details */}
    <div style={{ marginBottom: '12px', borderBottom: '1px dashed #aaa', paddingBottom: '10px' }}>
      <div style={{ marginBottom: '3px' }}><span style={{ fontWeight: '700' }}>PRODUCT:</span> {data.product || ''}</div>
      <div style={{ marginBottom: '3px' }}><span style={{ fontWeight: '700' }}>RATE/LTR:</span> ₹ {rate > 0 ? rate.toFixed(2) : ''}</div>
      <div style={{ marginBottom: '3px' }}><span style={{ fontWeight: '700' }}>AMOUNT:</span> ₹ {amount > 0 ? amount.toFixed(2) : ''}</div>
      <div><span style={{ fontWeight: '700' }}>VOLUME(LTR.):</span> {displayVolume} LT</div>
    </div>
    
    {/* Vehicle Details */}
    <div style={{ marginBottom: '12px', borderBottom: '1px dashed #aaa', paddingBottom: '10px' }}>
      <div style={{ marginBottom: '3px' }}><span style={{ fontWeight: '700' }}>VEH TYPE:</span> {data.vehicleType || ''}</div>
      <div style={{ marginBottom: '3px' }}><span style={{ fontWeight: '700' }}>VEH NO:</span> {data.vehicleNumber || ''}</div>
      <div><span style={{ fontWeight: '700' }}>CUSTOMER NAME:</span> {data.customerName || ''}</div>
    </div>
    
    {/* Date/Time/Mode */}
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', paddingRight: '8px' }}>
        <span><span style={{ fontWeight: '700' }}>DATE:</span> {formatDate(data.billDate)}</span>
        <span><span style={{ fontWeight: '700' }}>TIME:</span> {data.billTime || '00:00:00'}</span>
      </div>
      <div style={{ marginBottom: '3px' }}><span style={{ fontWeight: '700' }}>MODE:</span> {data.paymentMode || ''}</div>
      {renderPaymentLines(data, { marginTop: '6px' })}
      <div style={{ marginBottom: '3px' }}><span style={{ fontWeight: '700' }}>LST NO.:</span> {data.lstNo || ''}</div>
      <div style={{ marginBottom: '3px' }}><span style={{ fontWeight: '700' }}>VAT NO.:</span> {data.vatNo || ''}</div>
      <div><span style={{ fontWeight: '700' }}>ATTENDENT ID:</span> {data.attendentId || 'NOT AVAILABLE'}</div>
    </div>
    
    {/* Footer */}
    <div style={{ textAlign: 'center', fontSize: '9px', borderTop: '1px dashed #999', paddingTop: '8px', lineHeight: '1.4' }}>
      <div style={{ fontWeight: '700' }}>THANKS FOR VISIT AGAIN</div>
      <div style={{ fontWeight: '700' }}>THANK YOU</div>
    </div>
        </>
      );
    })()}
  </div>
);

// Template 3: Pine Labs Style Slip
const Template3 = ({ data, logoType, formatDate, rate, amount, volume, serialNo }) => (
  <div style={{ 
    fontFamily: StampFont,
    fontSize: '11px',
    lineHeight: '1.35',
    width: '320px',
    minHeight: '620px',
    background: '#fff',
    padding: '18px 14px 20px',
    border: '1px solid #d1d5db',
    color: '#111',
    position: 'relative', 
    overflow: 'hidden',
    boxSizing: 'border-box'
  }}>
    {renderSerialText(serialNo)}
    <div style={{ textAlign: 'center', fontSize: '52px', fontWeight: '800', letterSpacing: '-1px', lineHeight: '1', marginBottom: '8px', textTransform: 'lowercase' }}>
      pine labs
    </div>

    <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '11px', fontWeight: '700' }}>
      <div>{data.merchantName || 'TALWAR MOTORS'}</div>
      <div>{data.merchantCity || 'Lucknow'}</div>
      <div style={{ marginTop: '2px' }}>{getPumpDetails(data, logoType).stationName}</div>
      <div>{getPumpDetails(data, logoType).stationAddress}</div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', marginBottom: '8px', fontSize: '10px' }}>
      <div>DATE : {data.billDate || ''}</div>
      <div>TIME : {data.billTime || '00:00:00'}</div>
      <div>MID : {data.mid || ''}</div>
      <div>TID : {data.tid || ''}</div>
      <div>BATCH NUM : {data.batchNo || ''}</div>
      <div>INV. NUM : {data.invoiceNo || ''}</div>
    </div>

    <div style={{ textAlign: 'center', margin: '8px 0 6px', fontWeight: '700', fontSize: '12px' }}>
      {data.paymentSubType || 'SALE'}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', marginBottom: '10px', fontSize: '10px' }}>
      <div>{maskedCardNumber(data) ? `CARD NO : ${maskedCardNumber(data)}` : ''}</div>
      <div>{data.cardLast4 ? `LAST4 : ${data.cardLast4}` : ''}</div>
      <div>TXN ID : {data.paymentTxnId || data.billNumber || ''}</div>
      <div>{isCardPayment(data) ? `CARD TYPE : ${data.paymentInstrument || data.cardScheme || ''}` : `MODE : ${data.paymentInstrument || data.paymentMode || ''}`}</div>
      <div>{data.cardScheme ? `SCHEME : ${data.cardScheme}` : ''}</div>
      <div>{data.authCode ? `APPR CODE : ${data.authCode}` : ''}</div>
      <div>PRODUCT : {data.product || ''}</div>
      <div>RATE/LTR : {rate > 0 ? rate.toFixed(2) : '--'}</div>
      <div>VOLUME : {formatVolumeDisplay(volume)} L</div>
      <div>AMOUNT : {amount > 0 ? amount.toFixed(2) : '--'}</div>
      <div>VEH NO : {data.vehicleNumber || ''}</div>
      <div>{data.paymentRefNo ? `REF : ${data.paymentRefNo}` : ''}</div>
      <div>{data.aid ? `AID : ${data.aid}` : ''}</div>
      <div>{data.rrn ? `RRN : ${data.rrn}` : ''}</div>
      <div>{data.tsi ? `TSI : ${data.tsi}` : ''}</div>
      <div>{data.tvr ? `TVR : ${data.tvr}` : ''}</div>
      <div>{data.tc ? `TC : ${data.tc}` : ''}</div>
      <div>{data.appLabel ? `APP : ${data.appLabel}` : ''}</div>
    </div>

    <div style={{ borderTop: '1px dashed #777', paddingTop: '10px', textAlign: 'center', fontSize: '10px', lineHeight: '1.35' }}>
      <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '2px' }}>BASE AMT. : RS {amount > 0 ? amount.toFixed(2) : '--'}</div>
      {isCardPayment(data) ? (
        <>
          <div>PIN VERIFIED OK</div>
          <div>SIGNATURE NOT REQUIRED</div>
        </>
      ) : (
        <div>PAYMENT RECEIVED</div>
      )}
      <div style={{ marginTop: '8px' }}>*** CUSTOMER COPY ***</div>
      <div style={{ marginTop: '4px' }}>THANK YOU</div>
    </div>
  </div>
);

// Template 4: Professional Card Receipt
const Template4 = ({ data, logoType, formatDate, rate, amount, volume, serialNo }) => (
  <div style={{ 
    fontFamily: 'Arial, sans-serif',
    fontSize: '11px',
    lineHeight: '1.4',
    width: '360px',
    minHeight: '520px',
    background: '#fff',
    padding: '0',
    border: '1px solid #ddd',
    color: '#333',
    position: 'relative', 
    overflow: 'hidden',
    boxSizing: 'border-box'
  }}>
    {/* Header */}
    <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee' }}>
      <div style={{ fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '15px' }}>Fuel Receipt</div>
      
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>{getLogo(logoType, '54px')}</div>
      <div style={{ textAlign: 'center', fontSize: '11px' }}>
        <div style={{ fontWeight: '700', marginBottom: '5px' }}>Receipt Details</div>
        <div>Receipt Number: {data.billNumber ? `RP-${data.billNumber}` : 'RP-'}</div>
        <div>Date: {formatDate(data.billDate)}</div>
        <div>Time: {data.billTime || '00:00:00'}</div>
      </div>
    </div>
    
    {/* Billed To & Fuel Station */}
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #eee' }}>
      <div>
        <div style={{ fontWeight: '700', marginBottom: '8px' }}>Billed To</div>
        <div style={{ color: '#666' }}>Customer Name: {data.customerName || ''}</div>
        <div style={{ color: '#666' }}>Vehicle Number: {data.vehicleNumber || ''}</div>
        <div style={{ color: '#666' }}>Vehicle Type: {data.vehicleType || ''}</div>
        {data.paymentTxnId ? <div style={{ color: '#666' }}>Txn ID: {data.paymentTxnId}</div> : null}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: '700', marginBottom: '8px' }}>Fuel Station Details</div>
        <div style={{ color: '#666' }}>Fuel Station Name: {getPumpDetails(data, logoType).stationName}</div>
        <div style={{ color: '#666' }}>Fuel Station Address: {getPumpDetails(data, logoType).stationAddress}</div>
        <div style={{ fontWeight: '700', marginTop: '8px' }}>Payment Method</div>
        <div style={{ color: '#666' }}>{data.paymentMode || ''}</div>
        {renderPaymentLines(data, { marginTop: '8px', bordered: true })}
      </div>
    </div>
    
    {/* Receipt Summary Table */}
    <div style={{ padding: '15px 20px' }}>
      <div style={{ background: '#f8f9fa', padding: '10px 15px', fontWeight: '700', marginBottom: '1px' }}>Receipt Summary</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            <th style={{ padding: '10px 15px', textAlign: 'left', fontWeight: '600' }}>Fuel Rate</th>
            <th style={{ padding: '10px 15px', textAlign: 'left', fontWeight: '600' }}>Quantity</th>
            <th style={{ padding: '10px 15px', textAlign: 'right', fontWeight: '600' }}>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>₹ {rate > 0 ? rate.toFixed(2) : ''}</td>
            <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{formatVolumeDisplay(volume)} lt.</td>
            <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', textAlign: 'right' }}>₹ {amount > 0 ? amount.toFixed(2) : ''}</td>
          </tr>
          <tr>
            <td colSpan="2" style={{ padding: '10px 15px', textAlign: 'right', fontWeight: '700' }}>Total:</td>
            <td style={{ padding: '10px 15px', textAlign: 'right', fontWeight: '700' }}>₹ {amount > 0 ? amount.toFixed(2) : ''}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    {/* Footer */}
    <div style={{ textAlign: 'center', padding: '15px 20px', borderTop: '1px solid #eee', background: '#fafafa' }}>
      <div style={{ fontWeight: '700', color: '#0066B3', marginBottom: '8px' }}>THANK YOU ! FOR FUELLING WITH US !</div>
      <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>FOR ANY QUERIES AND COMPLAINT VISIT OUR CUSTOMER CARE</div>
      <div style={{ fontSize: '10px', color: '#333', fontWeight: '600' }}>SAVE FUEL, SECURE THE FUTURE!</div>
      <div style={{ fontSize: '10px', color: '#666', marginTop: '8px' }}>TIME: {data.billTime || ''}</div>
    </div>
  </div>
);

const FuelBillCanvas = React.forwardRef(({ data, template }, ref) => {
  const logoType = data.logoType || template?.logoType || 'bpcl';
  const templateStyle = template?.templateStyle || 'template1';
  
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const rate = Number(data.pricePerLiter) || 0;
  const amount = Number(data.totalAmount) || 0;
  const volume = rate > 0 ? (amount / rate).toFixed(2) : 'NaN';
  const serialNo = data.serialNo || 'A127016';
  
  const commonProps = { data, logoType, formatDate, rate, amount, volume, serialNo };

  return (
    <div ref={ref}>
      {templateStyle === 'template1' && <Template1 {...commonProps} />}
      {templateStyle === 'template2' && <Template2 {...commonProps} />}
      {templateStyle === 'template3' && <Template3 {...commonProps} />}
      {templateStyle === 'template4' && <Template4 {...commonProps} />}
    </div>
  );
});

FuelBillCanvas.displayName = 'FuelBillCanvas';

export default FuelBillCanvas;
