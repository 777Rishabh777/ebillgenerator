import React, { useState, useRef, useCallback } from 'react';
import CabTravelCanvas from '../canvas/CabTravelCanvas';
import FullscreenModal from '../FullscreenModal';
import Watermark from '../Watermark';
import DownloadModal from '../DownloadModal';
import PreviewScaler from '../PreviewScaler';

const templateStyles = [
    { id: 'template1', name: 'Template 1', description: 'OLA-style ride receipt with map preview' },
    { id: 'template2', name: 'Template 2', description: 'Driver Tax Invoice with itemized fare table' },
    { id: 'template3', name: 'Travel Bill', description: 'Original Tax Invoice (OLA Corporate format)' }
];

const currencies = [
    { label: 'Indian Rupee - ₹', value: 'INR' },
    { label: 'US Dollar - $', value: 'USD' },
    { label: 'Euro - €', value: 'EUR' },
    { label: 'British Pound - £', value: 'GBP' }
];

const paymentMethods = ['Cash', 'UPI', 'Card', 'Net Banking', 'Wallet', 'Credit'];
const vehicleModels = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'XUV', 'Auto', 'Mini', 'Prime', 'Electric'];
const distanceUnits = ['km', 'miles', 'mt'];

function ImageUploadSection({ label, urlKey, fileKey, imageKey, formData, onUrlChange, onFileChange }) {
    const [tab, setTab] = useState('url'); // 'url' | 'file'
    const fileRef = useRef(null);

    return (
        <div className="compact-form-field full-width">
            <label className="compact-form-label">{label}</label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                {['url', 'file'].map(t => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        style={{
                            padding: '3px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '4px', border: '1px solid',
                            cursor: 'pointer',
                            background: tab === t ? '#3b82f6' : '#f8fafc',
                            color: tab === t ? '#fff' : '#555',
                            borderColor: tab === t ? '#3b82f6' : '#e5e7eb'
                        }}
                    >
                        {t === 'url' ? 'URL' : 'Upload from Device'}
                    </button>
                ))}
            </div>
            {tab === 'url' && (
                <input
                    type="url"
                    name={urlKey}
                    value={formData[urlKey] || ''}
                    onChange={onUrlChange}
                    placeholder="https://..."
                    className="compact-form-input"
                />
            )}
            {tab === 'file' && (
                <div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => onFileChange(e, imageKey)}
                    />
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        style={{ padding: '5px 12px', background: '#f1f5f9', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#555', width: '100%', textAlign: 'left' }}
                    >
                        {formData[imageKey] ? '✅ Image loaded — click to change' : '📁 Choose image file...'}
                    </button>
                </div>
            )}
            {(formData[urlKey] || formData[imageKey]) && (
                <div style={{ marginTop: '6px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e5e7eb', maxHeight: '80px' }}>
                    <img
                        src={formData[imageKey] || formData[urlKey]}
                        alt={label}
                        style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>
            )}
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>I am authorized to use this image for generating this bill.</div>
        </div>
    );
}

export default function CabTravelTemplates() {
    const [selectedTemplate, setSelectedTemplate] = useState('template1');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [showWatermark] = useState(true);
    const [showGstNo, setShowGstNo] = useState(false);
    const [showTxnNo, setShowTxnNo] = useState(false);
    const [showRegNo, setShowRegNo] = useState(false);
    const canvasRef = useRef(null);

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const dateStr = now.toISOString().split('T')[0];
    const randomInvoice = String(Math.floor(100000 + Math.random() * 899999));

    const [formData, setFormData] = useState({
        // Customer
        customerName: '',
        mobileNo: '',
        // Driver
        driverName: '',
        driverPhone: '',
        vehicleNumber: '',
        vehicleModel: 'Sedan',
        regNo: '',
        gstNo: '',
        txnNo: '',
        // Invoice
        invoiceNo: randomInvoice,
        currency: 'INR',
        paymentMethod: 'Cash',
        // Trip
        date: dateStr,
        pickUpPoint: '',
        dropPoint: '',
        pickUpTime: timeStr,
        dropTime: timeStr,
        totalDistance: '',
        distanceUnit: 'km',
        // Fare
        tripAmount: 0,
        tax: 0,
        convenienceFee: 0,
        airportPickupCharge: 0,
        // Cab
        cabServiceAddress: '',
        // LTA
        isLTA: false,
        // Logo
        logoUrl: '',
        logoImageData: '',
        // Map
        mapUrl: '',
        mapImageData: ''
    });

    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value || 0) : value)
        }));
    }, []);

    const handleFileChange = useCallback((e, key) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setFormData(prev => ({ ...prev, [key]: ev.target.result }));
        };
        reader.readAsDataURL(file);
    }, []);

    // Merge image data into URL fields for the canvas
    const canvasData = {
        ...formData,
        logoUrl: formData.logoImageData || formData.logoUrl,
        mapUrl: formData.mapImageData || formData.mapUrl
    };

    const currentTemplate = { templateStyle: selectedTemplate };

    const total = (Number(formData.tripAmount) || 0)
        + ((Number(formData.tripAmount) || 0) * (Number(formData.tax) || 0) / 100)
        + (Number(formData.convenienceFee) || 0)
        + (Number(formData.airportPickupCharge) || 0);

    return (
        <div className="template-workspace">
            {/* ───── FORM COLUMN ───── */}
            <div className="template-form-column compact-form">

                {/* 1. Template Selector */}
                <div className="compact-form-section">
                    <div className="compact-form-section-title">🚕 Select Template</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {templateStyles.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setSelectedTemplate(s.id)}
                                style={{
                                    padding: '8px 10px', borderRadius: '6px', border: '1px solid', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                                    background: selectedTemplate === s.id ? '#f0fdf4' : '#fff',
                                    borderColor: selectedTemplate === s.id ? '#22c55e' : '#e5e7eb'
                                }}
                            >
                                <div style={{ fontWeight: '700', fontSize: '12px', color: selectedTemplate === s.id ? '#166534' : '#334155' }}>{s.name}</div>
                                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>{s.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Customer Info */}
                <div className="compact-form-section">
                    <div className="compact-form-section-title">Customer Info</div>
                    <div className="compact-form-grid">
                        <div className="compact-form-field">
                            <label className="compact-form-label">Customer Name</label>
                            <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} placeholder="Enter customer name" className="compact-form-input" />
                        </div>
                        <div className="compact-form-field">
                            <label className="compact-form-label">Mobile No</label>
                            <input type="text" name="mobileNo" value={formData.mobileNo} onChange={handleInputChange} placeholder="Mobile No" className="compact-form-input" />
                        </div>
                    </div>
                </div>

                {/* 3. Driver Info */}
                <div className="compact-form-section">
                    <div className="compact-form-section-title">Driver Info</div>
                    <div className="compact-form-grid">
                        <div className="compact-form-field">
                            <label className="compact-form-label">Driver Name</label>
                            <input type="text" name="driverName" value={formData.driverName} onChange={handleInputChange} placeholder="Enter the driver name" className="compact-form-input" />
                        </div>
                        <div className="compact-form-field">
                            <label className="compact-form-label">Driver Phone</label>
                            <input type="text" name="driverPhone" value={formData.driverPhone} onChange={handleInputChange} placeholder="Driver phone" className="compact-form-input" />
                        </div>
                        <div className="compact-form-field">
                            <label className="compact-form-label">Vehicle Number</label>
                            <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange} placeholder="Vehicle number" className="compact-form-input" />
                        </div>
                        <div className="compact-form-field">
                            <label className="compact-form-label">Vehicle Model</label>
                            <select name="vehicleModel" value={formData.vehicleModel} onChange={handleInputChange} className="compact-form-input compact-form-select">
                                {vehicleModels.map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Toggleable identifiers */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px', marginBottom: '4px' }}>
                        {[{ label: 'Reg. No', key: 'regNo', showKey: 'showRegNo', state: showRegNo, setter: setShowRegNo },
                        { label: 'GST No', key: 'gstNo', showKey: 'showGstNo', state: showGstNo, setter: setShowGstNo },
                        { label: 'TXN No', key: 'txnNo', showKey: 'showTxnNo', state: showTxnNo, setter: setShowTxnNo }]
                            .map(({ label, key, state, setter }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setter(s => !s)}
                                    style={{
                                        padding: '3px 9px', fontSize: '11px', fontWeight: '600', borderRadius: '4px', border: '1px solid',
                                        cursor: 'pointer',
                                        background: state ? '#eff6ff' : '#f8fafc',
                                        color: state ? '#1d4ed8' : '#94a3b8',
                                        borderColor: state ? '#93c5fd' : '#e5e7eb'
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                    </div>
                    {showRegNo && (
                        <input type="text" name="regNo" value={formData.regNo} onChange={handleInputChange} placeholder="Reg. No" className="compact-form-input" style={{ marginBottom: '4px' }} />
                    )}
                    {showGstNo && (
                        <input type="text" name="gstNo" value={formData.gstNo} onChange={handleInputChange} placeholder="GST No" className="compact-form-input" style={{ marginBottom: '4px' }} />
                    )}
                    {showTxnNo && (
                        <input type="text" name="txnNo" value={formData.txnNo} onChange={handleInputChange} placeholder="TXN No" className="compact-form-input" />
                    )}
                </div>

                {/* 4. Invoice Details */}
                <div className="compact-form-section">
                    <div className="compact-form-section-title">Invoice Details</div>
                    <div className="compact-form-grid">
                        <div className="compact-form-field">
                            <label className="compact-form-label">Invoice No</label>
                            <input type="text" name="invoiceNo" value={formData.invoiceNo} onChange={handleInputChange} className="compact-form-input" />
                        </div>
                        <div className="compact-form-field">
                            <label className="compact-form-label">Currency</label>
                            <select name="currency" value={formData.currency} onChange={handleInputChange} className="compact-form-input compact-form-select">
                                {currencies.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div className="compact-form-field full-width">
                            <label className="compact-form-label">Payment Method</label>
                            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className="compact-form-input compact-form-select">
                                <option value="">Select One</option>
                                {paymentMethods.map(p => <option key={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 5. Fare Breakup */}
                <div className="compact-form-section">
                    <div className="compact-form-section-title">Fare Breakup</div>
                    <div className="compact-form-grid">
                        <div className="compact-form-field">
                            <label className="compact-form-label">Trip Amount</label>
                            <input type="number" name="tripAmount" value={formData.tripAmount} onChange={handleInputChange} min="0" className="compact-form-input" />
                        </div>
                        <div className="compact-form-field">
                            <label className="compact-form-label">Tax %</label>
                            <input type="number" name="tax" value={formData.tax} onChange={handleInputChange} min="0" max="100" placeholder="Tax%" className="compact-form-input" />
                        </div>
                        <div className="compact-form-field">
                            <label className="compact-form-label">Convenience Fee</label>
                            <input type="number" name="convenienceFee" value={formData.convenienceFee} onChange={handleInputChange} min="0" className="compact-form-input" />
                        </div>
                        <div className="compact-form-field">
                            <label className="compact-form-label">Airport Pickup Charge</label>
                            <input type="number" name="airportPickupCharge" value={formData.airportPickupCharge} onChange={handleInputChange} min="0" className="compact-form-input" />
                        </div>
                    </div>
                    <div style={{ marginTop: '8px', padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#166534', fontWeight: '600' }}>Calculated Total</span>
                        <span style={{ color: '#166534', fontWeight: '800' }}>
                            {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹'}
                            {total.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* 6. Trip Details */}
                <div className="compact-form-section">
                    <div className="compact-form-section-title">Trip Details</div>
                    <div className="compact-form-grid">
                        <div className="compact-form-field">
                            <label className="compact-form-label">Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="compact-form-input" />
                        </div>
                        <div className="compact-form-field full-width">
                            <label className="compact-form-label">Pick Up Point</label>
                            <input type="text" name="pickUpPoint" value={formData.pickUpPoint} onChange={handleInputChange} placeholder="PickUp Point...." className="compact-form-input" />
                        </div>
                        <div className="compact-form-field full-width">
                            <label className="compact-form-label">Drop Point</label>
                            <input type="text" name="dropPoint" value={formData.dropPoint} onChange={handleInputChange} placeholder="Drop Point...." className="compact-form-input" />
                        </div>
                        <div className="compact-form-field">
                            <label className="compact-form-label">Pick Up Time</label>
                            <input type="time" name="pickUpTime" value={formData.pickUpTime} onChange={handleInputChange} className="compact-form-input" />
                        </div>
                        <div className="compact-form-field">
                            <label className="compact-form-label">Drop Time</label>
                            <input type="time" name="dropTime" value={formData.dropTime} onChange={handleInputChange} className="compact-form-input" />
                        </div>
                        <div className="compact-form-field">
                            <label className="compact-form-label">Total Distance</label>
                            <input type="text" name="totalDistance" value={formData.totalDistance} onChange={handleInputChange} placeholder="e.g. 12.5" className="compact-form-input" />
                        </div>
                        <div className="compact-form-field">
                            <label className="compact-form-label">Unit</label>
                            <select name="distanceUnit" value={formData.distanceUnit} onChange={handleInputChange} className="compact-form-input compact-form-select">
                                <option value="">Select One</option>
                                {distanceUnits.map(u => <option key={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 7. Cab Service Address */}
                <div className="compact-form-section">
                    <div className="compact-form-section-title">Cab Service Address</div>
                    <input
                        type="text"
                        name="cabServiceAddress"
                        value={formData.cabServiceAddress}
                        onChange={handleInputChange}
                        placeholder="Cab service address"
                        className="compact-form-input"
                        style={{ width: '100%' }}
                    />
                </div>

                {/* 8. LTA Option */}
                <div className="compact-form-section">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', background: formData.isLTA ? '#eff6ff' : '#f8fafc', border: `1px solid ${formData.isLTA ? '#93c5fd' : '#e5e7eb'}`, borderRadius: '8px', transition: 'all 0.2s' }}>
                        <input
                            type="checkbox"
                            name="isLTA"
                            checked={formData.isLTA}
                            onChange={handleInputChange}
                            style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                        />
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '12px', color: formData.isLTA ? '#1d4ed8' : '#334155' }}>Include LTA Claim Note ✈️</div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>Adds a Leave Travel Assistance reimbursement note to the bill</div>
                        </div>
                    </label>
                </div>

                {/* 9. Logo Upload */}
                <div className="compact-form-section">
                    <div className="compact-form-section-title">Cab / Company Logo</div>
                    <ImageUploadSection
                        label="Logo Image"
                        urlKey="logoUrl"
                        imageKey="logoImageData"
                        formData={formData}
                        onUrlChange={handleInputChange}
                        onFileChange={handleFileChange}
                    />
                </div>

                {/* 10. Map Upload */}
                <div className="compact-form-section">
                    <div className="compact-form-section-title">Route Map Image</div>
                    <ImageUploadSection
                        label="Map / Route Screenshot"
                        urlKey="mapUrl"
                        imageKey="mapImageData"
                        formData={formData}
                        onUrlChange={handleInputChange}
                        onFileChange={handleFileChange}
                    />
                </div>

                {/* 11. Download filename */}
                <div className="compact-form-section">
                    <div className="compact-form-section-title">Download File Name</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>This will be used as name of the generated PDF file</div>
                    <input
                        type="text"
                        name="downloadName"
                        value={formData.downloadName || 'Cab & Travel Bill Template'}
                        onChange={handleInputChange}
                        className="compact-form-input"
                    />
                </div>

            </div>

            {/* ───── PREVIEW COLUMN ───── */}
            <div className="template-preview-column">
                <div className="preview-actions">
                    <button className="preview-action-btn secondary" onClick={() => setIsFullscreen(true)}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                        </svg>
                        Fullscreen
                    </button>
                    <button className="preview-action-btn primary" onClick={() => setIsDownloadOpen(true)}>
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
                        <CabTravelCanvas ref={canvasRef} data={canvasData} template={currentTemplate} />
                        <Watermark show={showWatermark} />
                    </div>
                </PreviewScaler>

                <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
          Watermark will be removed from actual pdf
        </p>
            </div>

            {/* Fullscreen Modal */}
            <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
                <CabTravelCanvas data={canvasData} template={currentTemplate} />
            </FullscreenModal>

            {/* Download Modal */}
            <DownloadModal
                isOpen={isDownloadOpen}
                onClose={() => setIsDownloadOpen(false)}
                canvasRef={canvasRef}
                defaultFilename={formData.downloadName || `cab-travel-bill-${formData.invoiceNo}`}
                billType="Cab & Travel Bill"
                billData={{
                    invoiceId: formData.invoiceNo,
                    vendorName: formData.cabServiceAddress || 'Cab Service',
                    customerName: formData.customerName,
                    driverName: formData.driverName,
                    vehicleNumber: formData.vehicleNumber,
                    vehicleModel: formData.vehicleModel,
                    pickUpPoint: formData.pickUpPoint,
                    dropPoint: formData.dropPoint,
                    rate: formData.tripAmount,
                    quantity: 1,
                    total: total,
                    paymentMethod: formData.paymentMethod,
                    date: formData.date,
                    description: `${formData.pickUpPoint || 'Pickup'} → ${formData.dropPoint || 'Drop'} | ${formData.vehicleModel}`,
                    formDataCopy: { ...formData }
                }}
            />
        </div>
    );
}

