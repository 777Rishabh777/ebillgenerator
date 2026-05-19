import React from 'react';

const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const sym = (currency) => {
    if (!currency || currency.toLowerCase().includes('rupee') || currency === 'INR') return '₹';
    if (currency.toLowerCase().includes('dollar') || currency === 'USD') return '$';
    if (currency.toLowerCase().includes('euro') || currency === 'EUR') return '€';
    if (currency.toLowerCase().includes('pound') || currency === 'GBP') return '£';
    return '₹';
};

/* ─────────────────────────── TEMPLATE 1: OLA Ride Receipt ─────────────────────────── */
const Template1 = ({ data }) => {
    const S = sym(data.currency);
    const taxAmt = ((Number(data.tripAmount) || 0) * (Number(data.tax) || 0)) / 100;
    const total = (Number(data.tripAmount) || 0) + taxAmt + (Number(data.convenienceFee) || 0) + (Number(data.airportPickupCharge) || 0);

    return (
        <div data-paper-root="true" style={{ width: '794px', minHeight: '1123px', fontFamily: 'Arial, sans-serif', background: '#fff', boxSizing: 'border-box', color: '#222' }}>
            {/* Header */}
            <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
                <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>{formatDate(data.date)}</div>
                {data.logoUrl ? (
                    <img src={data.logoUrl} alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
                ) : (
                    <div style={{ color: '#00b050', fontWeight: '900', fontSize: '20px', letterSpacing: '2px' }}>OLA</div>
                )}
            </div>

            {/* Ride summary bar */}
            <div style={{ background: '#111', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '11px', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {data.invoiceNo ? `CRN${data.invoiceNo}` : 'CRN30115700394'} &mdash; {data.txnNo || 'Engineer Vishal'}
                    </div>
                    <div style={{ color: '#ccc', fontSize: '12px' }}>Thanks for travelling with us. {data.txnNo || 'Engineer Vishal'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>Total Fare</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff' }}>{S}{total.toFixed(2)}</div>
                </div>
            </div>

            {/* Map + Bill Details side by side */}
            <div style={{ display: 'flex', gap: '0', minHeight: '260px' }}>
                {/* Map area */}
                <div style={{ flex: '0 0 300px', border: '1px solid #e5e7eb', overflow: 'hidden', position: 'relative', background: '#f1f5f9' }}>
                    {data.mapUrl ? (
                        <img src={data.mapUrl} alt="Route Map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', minHeight: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            <div style={{ fontSize: '11px', marginTop: '8px', color: '#aaa' }}>Route Map</div>
                            <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>Add map URL or image</div>
                        </div>
                    )}
                </div>

                {/* Bill Details */}
                <div style={{ flex: 1, padding: '20px 24px' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>Bill Details</div>
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '5px 0', color: '#555' }}>Ride Fee</td>
                                <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: '600' }}>{S}{(Number(data.tripAmount) || 0).toFixed(2)}</td>
                            </tr>
                            {Number(data.convenienceFee) > 0 && (
                                <tr>
                                    <td style={{ padding: '5px 0', color: '#555' }}>Convenience Fee</td>
                                    <td style={{ padding: '5px 0', textAlign: 'right' }}>{S}{Number(data.convenienceFee).toFixed(2)}</td>
                                </tr>
                            )}
                            {Number(data.airportPickupCharge) > 0 && (
                                <tr>
                                    <td style={{ padding: '5px 0', color: '#555' }}>Airport Pickup Charge</td>
                                    <td style={{ padding: '5px 0', textAlign: 'right' }}>{S}{Number(data.airportPickupCharge).toFixed(2)}</td>
                                </tr>
                            )}
                            {Number(data.tax) > 0 && (
                                <tr>
                                    <td style={{ padding: '5px 0', color: '#555' }}>Taxes &amp; Fees ({data.tax}%)</td>
                                    <td style={{ padding: '5px 0', textAlign: 'right' }}>{S}{taxAmt.toFixed(2)}</td>
                                </tr>
                            )}
                            <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '8px 0', fontWeight: '700', fontSize: '14px' }}>Total Bill</td>
                                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700', fontSize: '14px' }}>{S}{total.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colSpan="2" style={{ fontSize: '10px', color: '#94a3b8', paddingTop: '2px' }}>Includes {S}{taxAmt.toFixed(2)} Taxes</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ marginTop: '16px', fontSize: '10px', color: '#94a3b8', lineHeight: '1.6', borderTop: '1px dashed #e5e7eb', paddingTop: '10px' }}>
                        We've fulfilled our promise to take you to destination. For queries, Satisfied? Tap the flag to rate this ride.
                    </div>

                    {data.isLTA && (
                        <div style={{ marginTop: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px 10px', fontSize: '10px', color: '#1d4ed8' }}>
                            <strong>LTA Claim</strong> — This receipt is eligible for Leave Travel Assistance reimbursement. Retain original for HR/Finance submission.
                        </div>
                    )}
                </div>
            </div>

            {/* Driver Info */}
            <div style={{ padding: '16px 24px', background: '#fafafa', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {data.logoUrl2 ? (
                        <img src={data.logoUrl2} alt="Driver" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <svg width="24" height="24" fill="#94a3b8" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{data.driverName || 'Bal Krishna Tripathi'}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {data.vehicleModel || 'Prime Sedan'} · {data.vehicleNumber || 'White'} · {data.driverPhone || ''}
                    </div>
                    {data.regNo && <div style={{ fontSize: '10px', color: '#94a3b8' }}>Reg: {data.regNo}</div>}
                </div>
                {data.paymentMethod && (
                    <div style={{ fontWeight: '600', fontSize: '12px', color: '#1d4ed8', background: '#eff6ff', padding: '4px 10px', borderRadius: '20px' }}>
                        {data.paymentMethod}
                    </div>
                )}
            </div>

            {/* Trip Timeline */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ fontWeight: '700', fontSize: '12px', color: '#555', minWidth: '52px' }}>{data.pickUpTime || '--:--'} AM</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '3px' }}>
                        <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#22c55e', border: '2px solid #16a34a' }}></div>
                        <div style={{ width: '2px', flex: 1, background: '#e5e7eb', minHeight: '24px' }}></div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#222', lineHeight: '1.4' }}>{data.pickUpPoint || 'Pick Up Point'}</div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: '700', fontSize: '12px', color: '#555', minWidth: '52px' }}>{data.dropTime || '--:--'} AM</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '3px' }}>
                        <div style={{ width: '9px', height: '9px', borderRadius: '4px', background: '#ef4444', border: '2px solid #dc2626' }}></div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#222', lineHeight: '1.4' }}>{data.dropPoint || 'Drop Point'}</div>
                </div>
                {data.totalDistance && (
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8' }}>
                        Total Distance: {data.totalDistance} {data.distanceUnit || 'km'}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 24px', borderTop: '1px solid #e5e7eb', fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>
                {data.cabServiceAddress || 'Cab Service Address'} &nbsp;|&nbsp; {data.mobileNo || ''} &nbsp;|&nbsp; Invoice No: {data.invoiceNo || ''}
            </div>
        </div>
    );
};

/* ─────────────────────────── TEMPLATE 2: Driver Tax Invoice ─────────────────────────── */
const Template2 = ({ data }) => {
    const S = sym(data.currency);
    const rideFee = Number(data.tripAmount) || 0;
    const waitingFee = Number(data.convenienceFee) || 0;
    const tollFee = Number(data.airportPickupCharge) || 0;
    const taxRate = Number(data.tax) || 0;
    const taxAmt = ((rideFee + waitingFee + tollFee) * taxRate) / 100;
    const subtotal = rideFee + waitingFee + tollFee + taxAmt;
    const total = subtotal;

    return (
        <div data-paper-root="true" style={{ width: '794px', minHeight: '1123px', fontFamily: 'Arial, sans-serif', fontSize: '13px', background: '#fff', padding: '32px', boxSizing: 'border-box', color: '#222' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #222' }}>
                <div>
                    {data.logoUrl ? (
                        <img src={data.logoUrl} alt="Logo" style={{ height: '36px', objectFit: 'contain', marginBottom: '6px' }} />
                    ) : (
                        <div style={{ fontWeight: '900', fontSize: '22px', letterSpacing: '2px', color: '#000' }}>OLA</div>
                    )}
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{data.cabServiceAddress || 'Cab Service, India'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '15px', letterSpacing: '1px', marginBottom: '6px' }}>Original Tax Invoice</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>Invoice No: <strong>{data.invoiceNo || '--'}</strong></div>
                    <div style={{ fontSize: '11px', color: '#555' }}>Date: <strong>{formatDate(data.date)}</strong></div>
                    {data.gstNo && <div style={{ fontSize: '11px', color: '#555' }}>GST: <strong>{data.gstNo}</strong></div>}
                    {data.txnNo && <div style={{ fontSize: '11px', color: '#555' }}>TXN: <strong>{data.txnNo}</strong></div>}
                </div>
            </div>

            {/* Driver + Customer row */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
                <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '1px' }}>Driver Details</div>
                    <div style={{ fontWeight: '700' }}>{data.driverName || 'Driver Name'}</div>
                    <div style={{ color: '#555', fontSize: '11px', marginTop: '2px' }}>{data.vehicleModel || 'Sedan'}</div>
                    <div style={{ color: '#555', fontSize: '11px' }}>Vehicle: {data.vehicleNumber || '--'}</div>
                    {data.regNo && <div style={{ color: '#555', fontSize: '11px' }}>Reg. No: {data.regNo}</div>}
                    {data.driverPhone && <div style={{ color: '#555', fontSize: '11px' }}>Mobile: {data.driverPhone}</div>}
                </div>
                <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '1px' }}>Customer</div>
                    <div style={{ fontWeight: '700' }}>{data.customerName || 'Customer Name'}</div>
                    {data.mobileNo && <div style={{ color: '#555', fontSize: '11px' }}>Mobile: {data.mobileNo}</div>}
                    <div style={{ color: '#555', fontSize: '11px', marginTop: '4px' }}>
                        <span style={{ fontWeight: '600' }}>Pick Up:</span> {data.pickUpPoint || '--'} at {data.pickUpTime || '--'}
                    </div>
                    <div style={{ color: '#555', fontSize: '11px' }}>
                        <span style={{ fontWeight: '600' }}>Drop:</span> {data.dropPoint || '--'} at {data.dropTime || '--'}
                    </div>
                    {data.totalDistance && (
                        <div style={{ color: '#555', fontSize: '11px' }}>Distance: {data.totalDistance} {data.distanceUnit || 'km'}</div>
                    )}
                </div>
            </div>

            {/* Map image if provided */}
            {(data.mapUrl) && (
                <div style={{ marginBottom: '16px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    <img src={data.mapUrl} alt="Route Map" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover' }} />
                </div>
            )}

            {/* Invoice Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '13px' }}>
                <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', borderBottom: '2px solid #e5e7eb' }}>Description</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', borderBottom: '2px solid #e5e7eb' }}>Amount ({S})</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: '#555' }}>Ride Fee</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{S}{rideFee.toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: '#555' }}>Waiting Fee / Convenience Fee</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{S}{waitingFee.toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: '#555' }}>Toll / Airport Pickup Charge</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{S}{tollFee.toFixed(2)}</td>
                    </tr>
                    {taxRate > 0 && (
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', color: '#555' }}>GST / Tax ({taxRate}%)</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{S}{taxAmt.toFixed(2)}</td>
                        </tr>
                    )}
                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #e5e7eb' }}>
                        <td style={{ padding: '10px 12px', fontWeight: '700', fontSize: '14px' }}>Total</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', fontSize: '14px' }}>{S}{total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>
                Payment Method: <strong style={{ color: '#555' }}>{data.paymentMethod || '--'}</strong>
            </div>

            {data.isLTA && (
                <div style={{ margin: '12px 0', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px 14px', fontSize: '11px', color: '#1d4ed8' }}>
                    <strong>LTA Claim Certificate</strong> — This invoice is issued for Leave Travel Assistance claiming purposes. Journey: {data.pickUpPoint || '--'} → {data.dropPoint || '--'} on {formatDate(data.date)}.
                </div>
            )}

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', fontSize: '10px', color: '#94a3b8', lineHeight: '1.8' }}>
                This is a computer generated invoice. | {data.cabServiceAddress || ''} | GST: {data.gstNo || '--'}
            </div>
        </div>
    );
};

/* ─────────────────────────── TEMPLATE 3: Original Tax Invoice (OLA Corporate) ─────────────────────────── */
const Template3 = ({ data }) => {
    const S = sym(data.currency);
    const rideFee = Number(data.tripAmount) || 0;
    const convFee = Number(data.convenienceFee) || 0;
    const waitFee = Number(data.airportPickupCharge) || 0;
    const taxRate = Number(data.tax) || 0;
    const taxAmt = ((convFee + waitFee) * taxRate) / 100;
    const total = rideFee + convFee + waitFee + taxAmt;

    return (
        <div data-paper-root="true" style={{ width: '794px', minHeight: '1123px', fontFamily: 'Arial, sans-serif', fontSize: '12px', background: '#fff', padding: '28px 32px', boxSizing: 'border-box', color: '#222' }}>
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', paddingBottom: '12px', borderBottom: '1px solid #222' }}>
                {data.logoUrl ? (
                    <img src={data.logoUrl} alt="Logo" style={{ height: '30px', objectFit: 'contain' }} />
                ) : (
                    <div style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '2px' }}>OLA</div>
                )}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>Original Tax Invoice</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Date: {formatDate(data.date)} &nbsp;|&nbsp; Invoice No: {data.invoiceNo || '--'}</div>
                    {data.gstNo && <div style={{ fontSize: '10px', color: '#64748b' }}>GSTIN: {data.gstNo}</div>}
                    {data.txnNo && <div style={{ fontSize: '10px', color: '#64748b' }}>TXN NO: {data.txnNo}</div>}
                </div>
            </div>

            {/* Company address row */}
            <div style={{ display: 'flex', gap: '24px', marginTop: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', marginBottom: '2px' }}>{data.cabServiceAddress ? data.cabServiceAddress.split(',')[0] : 'ANI Technologies Pvt. Ltd.'}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.5' }}>{data.cabServiceAddress || 'C/O 27, Vibhuti Khand nagar, Lucknow'}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Revenue Category: <strong>Business Factory</strong> · Invoice</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Cab Ride No.: <strong>{data.regNo || data.invoiceNo || '--'}</strong></div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Mobile No: <strong>{data.mobileNo || data.driverPhone || '--'}</strong></div>
                </div>
            </div>

            {/* Supply Address */}
            <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px 12px', marginBottom: '14px', fontSize: '11px' }}>
                <strong>Supply Address:</strong> {data.pickUpPoint || 'Pickup Point'} → {data.dropPoint || 'Drop Point'}
                &nbsp; | &nbsp;<strong>Date:</strong> {formatDate(data.date)} &nbsp; <strong>Time:</strong> {data.pickUpTime || '--'} – {data.dropTime || '--'}
                {data.totalDistance && <>&nbsp; | &nbsp;<strong>Distance:</strong> {data.totalDistance} {data.distanceUnit || 'km'}</>}
            </div>

            {/* Map image if provided */}
            {data.mapUrl && (
                <div style={{ marginBottom: '14px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    <img src={data.mapUrl} alt="Route Map" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover' }} />
                </div>
            )}

            {/* Convenience Fee Table */}
            <div style={{ fontWeight: '700', fontSize: '12px', marginBottom: '6px' }}>
                {data.customerName ? `${data.customerName} —` : ''} Convenience Fee — {data.invoiceNo ? `CRN${data.invoiceNo}` : '--'}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12px' }}>
                <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ padding: '7px 10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Description</th>
                        <th style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb' }}>Convenience Fee (Ride)</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>{S}{rideFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb' }}>Convenience Fee (Waiting)</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>{S}{convFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb' }}>Airport Pickup / Additional Charge</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>{S}{waitFee.toFixed(2)}</td>
                    </tr>
                    {taxRate > 0 && (
                        <tr>
                            <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb', color: '#555' }}>GST @ {taxRate}%</td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>{S}{taxAmt.toFixed(2)}</td>
                        </tr>
                    )}
                    <tr style={{ background: '#f1f5f9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: '700', border: '1px solid #e5e7eb' }}>Total</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', border: '1px solid #e5e7eb' }}>{S}{total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            {data.isLTA && (
                <div style={{ marginBottom: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '9px 14px', fontSize: '11px', color: '#1d4ed8' }}>
                    <strong>LTA / Travel Claim Note</strong> — This is a valid original tax invoice and may be submitted for Leave Travel Assistance reimbursement. Route: {data.pickUpPoint || '--'} ➜ {data.dropPoint || '--'}.
                </div>
            )}

            <div style={{ fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #e5e7eb', paddingTop: '10px', lineHeight: '1.7' }}>
                This is a computer-generated invoice. No signature required. &nbsp;|&nbsp; {data.cabServiceAddress || ''} &nbsp;|&nbsp; GST: {data.gstNo || 'N/A'} &nbsp;|&nbsp; Payment: {data.paymentMethod || '--'}
            </div>
        </div>
    );
};

/* ─────────────────────────── Main Export ─────────────────────────── */
const CabTravelCanvas = React.forwardRef(({ data, template }, ref) => {
    const style = template?.templateStyle || 'template1';
    return (
        <div ref={ref}>
            {style === 'template1' && <Template1 data={data} />}
            {style === 'template2' && <Template2 data={data} />}
            {style === 'template3' && <Template3 data={data} />}
        </div>
    );
});

CabTravelCanvas.displayName = 'CabTravelCanvas';
export default CabTravelCanvas;
