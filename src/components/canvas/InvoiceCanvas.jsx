import React from 'react';

const InvoiceCanvas = React.forwardRef(({ data, template }, ref) => {
  const colors = template?.colors || { primary: '#000', bg: '#f3f3f3' };

  const isAmazon = template?.id === 'tech';
  const isFlipkart = template?.id === 'retail';
  const isMyntra = template?.id === 'services';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const itemsTotal = data.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const itemsTax = data.items.reduce((sum, item) => sum + (item.qty * item.rate * (item.tax / 100)), 0);
  const grandTotal = itemsTotal + itemsTax + (Number(data.shippingCharges) || 0) + (Number(data.packagingFee) || 0) - (Number(data.discount) || 0);

  const barcodeStyle = {
    height: '30px',
    width: '180px',
    background: 'repeating-linear-gradient(90deg, #000, #000 1px, #fff 1px, #fff 3px)',
    marginBottom: '3px'
  };

  const brandName = template?.id === 'custom' ? (data.customBrandName || template?.brand) : template?.brand;

  // ============== FLIPKART TAX INVOICE LAYOUT ==============
  if (isFlipkart) {
    const cgst = itemsTax / 2;
    const sgst = itemsTax / 2;
    const shippingCharges = Number(data.shippingCharges) || 0;
    const discountAmount = Number(data.discount) || 0;

    return (
      <div
        ref={ref}
        style={{
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: '10px',
          width: '595px',
          minHeight: '842px',
          background: '#fff',
          padding: '0',
          color: '#000',
          lineHeight: '1.35',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '14px 20px 10px', borderBottom: '1px solid #000' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.5px' }}>Tax Invoice</div>
        </div>

        {/* Seller Info Row */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #000', fontSize: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div>
                <strong>Sold By: {data.sellerName || brandName}</strong>
              </div>
              <div style={{ marginTop: '2px', fontSize: '9px', color: '#333', maxWidth: '350px' }}>
                Ship-From Address: {data.sellerAddress}
              </div>
            </div>
            {/* Logo at top right */}
            {data.logoUrl && (
              <img src={data.logoUrl} alt="Logo" style={{ height: '40px', maxWidth: '120px', objectFit: 'contain' }} />
            )}
          </div>
          <div style={{ marginTop: '4px' }}>
            <strong>GSTIN</strong> - {data.sellerGSTIN}
          </div>
        </div>

        {/* Order & Invoice Details + Bill To / Ship To */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #000' }}>
          {/* Left Column */}
          <div style={{ padding: '10px 20px', borderRight: '1px solid #000' }}>
            <div style={{ marginBottom: '8px' }}>
              <div><strong>Order ID:</strong></div>
              <div>{data.orderNumber}</div>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <div><strong>Order Date:</strong> {formatDate(data.invoiceDate)}</div>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <div><strong>Invoice Date:</strong> {formatDate(data.invoiceDate)}</div>
            </div>
            {data.sellerPAN && (
              <div><strong>PAN:</strong> {data.sellerPAN}</div>
            )}
          </div>
          {/* Right Column - Bill To / Ship To */}
          <div style={{ padding: '10px 20px' }}>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Bill To:</div>
              <div>{data.buyerName}</div>
              <div style={{ fontSize: '9px', color: '#333' }}>{data.buyerAddress}</div>
              <div style={{ fontSize: '9px' }}>Phone: {data.buyerPhone}</div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Ship To:</div>
              <div>{data.buyerName}</div>
              <div style={{ fontSize: '9px', color: '#333' }}>{data.shippingAddress || data.buyerAddress}</div>
              <div style={{ fontSize: '9px' }}>Phone: {data.buyerPhone}</div>
            </div>
            <div style={{
              marginTop: '8px', padding: '5px 8px', background: '#f0f7ff',
              border: '1px solid #bfdbfe', borderRadius: '3px', fontSize: '9px', color: '#1e40af'
            }}>
              <strong>Invoice Number#</strong> {data.invoiceNumber}
            </div>
          </div>
        </div>

        {/* Total Items */}
        <div style={{ padding: '6px 20px', borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: '10px' }}>
          Total Items: {data.items.length}
        </div>

        {/* Product Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000', background: '#f8f9fa' }}>
              <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #ddd', width: '30%' }}>Product</th>
              <th style={{ padding: '6px 4px', textAlign: 'left', borderRight: '1px solid #ddd', width: '20%' }}>Title</th>
              <th style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #ddd', width: '5%' }}>Qty</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #ddd', width: '10%' }}>Gross<br />Amount ₹</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #ddd', width: '8%' }}>Discounts<br />₹</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #ddd', width: '9%' }}>Taxable<br />Value ₹</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #ddd', width: '7%' }}>CGST<br />₹</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #ddd', width: '7%' }}>SGST<br />/UTGST ₹</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', width: '9%' }}>Total ₹</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => {
              const gross = item.qty * item.rate;
              const itemDiscount = data.items.length === 1 ? discountAmount : 0;
              const taxable = gross - itemDiscount;
              const itemCgst = (taxable * (item.tax / 100)) / 2;
              const itemSgst = (taxable * (item.tax / 100)) / 2;
              const lineTotal = taxable + itemCgst + itemSgst;
              return (
                <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px', verticalAlign: 'top', borderRight: '1px solid #eee' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '9px' }}>{item.description}</div>
                    <div style={{ fontSize: '8px', color: '#666', marginTop: '2px' }}>HSN/SAC: {item.hsn}</div>
                    <div style={{ fontSize: '7.5px', color: '#888', marginTop: '1px' }}>
                      CGST: {item.tax / 2}%<br />
                      SGST/UGST: {item.tax / 2}%
                    </div>
                  </td>
                  <td style={{ padding: '6px 4px', verticalAlign: 'top', fontSize: '8.5px', borderRight: '1px solid #eee' }}>{item.description}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #eee' }}>{item.qty}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>{gross.toFixed(2)}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>{itemDiscount > 0 ? `-${itemDiscount.toFixed(2)}` : '0.00'}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>{taxable.toFixed(2)}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>{itemCgst.toFixed(2)}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>{itemSgst.toFixed(2)}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>{lineTotal.toFixed(2)}</td>
                </tr>
              );
            })}
            {/* Shipping Row */}
            {shippingCharges > 0 && (
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td colSpan={2} style={{ padding: '6px 8px', fontWeight: 'bold', borderRight: '1px solid #eee' }}>Shipping And Handling Charges</td>
                <td style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #eee' }}>1</td>
                <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>{shippingCharges.toFixed(2)}</td>
                <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>0.00</td>
                <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>{shippingCharges.toFixed(2)}</td>
                <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>0.00</td>
                <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>0.00</td>
                <td style={{ padding: '6px 4px', textAlign: 'right' }}>{shippingCharges.toFixed(2)}</td>
              </tr>
            )}
            {/* Total Row */}
            <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold' }}>
              <td colSpan={2} style={{ padding: '8px', textAlign: 'right', borderRight: '1px solid #eee' }}>Total</td>
              <td style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #eee' }}>{data.items.reduce((s, i) => s + i.qty, 0)}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>{itemsTotal.toFixed(2)}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>{discountAmount > 0 ? `-${discountAmount.toFixed(2)}` : '0.00'}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>{(itemsTotal - discountAmount).toFixed(2)}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>{cgst.toFixed(2)}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #eee' }}>{sgst.toFixed(2)}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right' }}>{grandTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Grand Total */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          padding: '12px 20px', borderTop: '1px solid #000', borderBottom: '1px solid #000'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            Grand Total: &nbsp; <span style={{ fontSize: '16px' }}>₹ {grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Authorized Signatory + QR */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          padding: '15px 20px', borderBottom: '1px solid #ccc'
        }}>
          <div style={{ textAlign: 'right', flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{data.sellerName || brandName}</div>
            <div style={{ marginTop: '25px', borderTop: '1px solid #999', paddingTop: '5px', display: 'inline-block' }}>
              <span style={{ fontStyle: 'italic', fontSize: '9px', color: '#555' }}>Authorized Signatory</span>
            </div>
          </div>
          {data.qrCodeUrl && (
            <div style={{ marginLeft: '20px', textAlign: 'center' }}>
              <img src={data.qrCodeUrl} alt="QR Code" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
            </div>
          )}
        </div>

        {/* Returns Policy */}
        <div style={{ padding: '12px 20px', fontSize: '8.5px', color: '#555', flex: 1 }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Returns Policy:</div>
          <div>
            At Flipkart we try to deliver perfectly each and every time. But in the off-chance that you need to return the item,
            please do so with the original Brand box and all accessories, tags, and labels intact.
          </div>
          <div style={{ marginTop: '6px' }}>The goods sold are intended for end user consumption and not for re-sale.</div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 20px', borderTop: '1px solid #000', fontSize: '8px', color: '#555'
        }}>
          <div>
            Regd. Office: {data.sellerAddress}
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '9px' }}>E. & O.E.</div>
          <div>page 1 of 1</div>
        </div>
      </div>
    );
  }

  // ============== MYNTRA TAX INVOICE LAYOUT ==============
  if (isMyntra) {
    const cgst = itemsTax / 2;
    const sgst = itemsTax / 2;
    const shippingCharges = Number(data.shippingCharges) || 0;
    const discountAmount = Number(data.discount) || 0;

    return (
      <div
        ref={ref}
        style={{
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: '9px',
          width: '595px',
          minHeight: '842px',
          background: '#fff',
          padding: '25px 25px',
          color: '#000',
          lineHeight: '1.4',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header: Tax Invoice & Barcode */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Tax Invoice</div>
          <div style={{ textAlign: 'center', marginTop: '5px' }}>
            <div style={{
              height: '45px',
              width: '220px',
              background: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 10px)',
              marginBottom: '4px'
            }}></div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '4px' }}>8211620434</div>
          </div>
        </div>

        {/* Info Grid */}
        <table style={{ width: '100%', fontSize: '9px', marginBottom: '10px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', paddingBottom: '3px' }}><strong>Invoice Number:</strong> {data.invoiceNumber}</td>
              <td style={{ width: '50%', textAlign: 'right', paddingBottom: '3px' }}><strong>PacketID:</strong> {data.orderNumber}</td>
            </tr>
            <tr>
              <td style={{ paddingBottom: '3px' }}><strong>Order Number:</strong> {data.orderNumber}</td>
              <td style={{ textAlign: 'right', paddingBottom: '3px' }}><strong>Invoice Date:</strong> {formatDate(data.invoiceDate)}</td>
            </tr>
            <tr>
              <td style={{ paddingBottom: '3px' }}><strong>Nature of Transaction:</strong> Intra-State</td>
              <td style={{ textAlign: 'right', paddingBottom: '3px' }}><strong>Order Date:</strong> {formatDate(data.invoiceDate)}</td>
            </tr>
            <tr>
              <td style={{ paddingBottom: '8px', borderBottom: '1px solid #000' }}><strong>Place of Supply:</strong> Delhi</td>
              <td style={{ textAlign: 'right', paddingBottom: '8px', borderBottom: '1px solid #000' }}><strong>Nature of Supply:</strong> Goods</td>
            </tr>
          </tbody>
        </table>

        {/* Bill/Ship To */}
        <table style={{ width: '100%', fontSize: '9px', marginBottom: '10px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '10px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Bill to / Ship to:</div>
                <div>{data.buyerName},</div>
                <div>{data.buyerAddress}</div>
                <div>Phone: {data.buyerPhone}</div>
              </td>
              <td style={{ width: '50%', verticalAlign: 'middle', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>Customer Type: <span style={{ fontWeight: 'normal' }}>Unregistered</span></div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bill/Ship From */}
        <table style={{ width: '100%', fontSize: '9px', marginBottom: '15px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '10px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Bill From:</div>
                <div style={{ textTransform: 'uppercase' }}>{data.sellerName}</div>
                <div>{data.sellerAddress}</div>
                <div style={{ marginTop: '8px' }}><strong>GSTIN Number:</strong> {data.sellerGSTIN}</div>
              </td>
              <td style={{ width: '50%', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Ship From:</div>
                <div style={{ textTransform: 'uppercase' }}>{data.sellerName}</div>
                <div>{data.sellerAddress}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Inner Items Table */}
        <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', marginBottom: '10px' }}>
          <table style={{ width: '100%', fontSize: '9.5px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 2px', textAlign: 'left', borderBottom: '1px solid #000' }}>Qty</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', borderBottom: '1px solid #000' }}>Gross<br />Amount</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', borderBottom: '1px solid #000' }}>Discount</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', borderBottom: '1px solid #000' }}>Other<br />Charges</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', borderBottom: '1px solid #000' }}>Taxable<br />Amount</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', borderBottom: '1px solid #000' }}>CGST</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', borderBottom: '1px solid #000' }}>SGST/<br />UGST</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', borderBottom: '1px solid #000' }}>IGST</th>
                <th style={{ padding: '4px 2px', textAlign: 'center', borderBottom: '1px solid #000' }}>Cess</th>
                <th style={{ padding: '4px 2px', textAlign: 'right', borderBottom: '1px solid #000' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => {
                const gross = item.qty * item.rate;
                const itemDiscount = data.items.length === 1 ? discountAmount : 0;
                const taxable = gross - itemDiscount;
                const itemCgst = (taxable * (item.tax / 100)) / 2;
                const itemSgst = (taxable * (item.tax / 100)) / 2;
                const lineTotal = taxable + itemCgst + itemSgst;
                return (
                  <React.Fragment key={i}>
                    <tr>
                      <td colSpan={10} style={{ padding: '4px 2px', fontWeight: 'bold' }}>
                        {item.description}
                        <br />
                        <span style={{ fontWeight: 'normal' }}>HSN: {item.hsn}, {item.tax}% IGST, {item.tax / 2}% CGST, {item.tax / 2}% SGST/UGST</span>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: i === data.items.length - 1 ? 'none' : '1px solid #eee' }}>
                      <td style={{ padding: '4px 2px', textAlign: 'left' }}>{item.qty}</td>
                      <td style={{ padding: '4px 2px', textAlign: 'center' }}>Rs {gross.toFixed(2)}</td>
                      <td style={{ padding: '4px 2px', textAlign: 'center' }}>Rs {itemDiscount.toFixed(2)}</td>
                      <td style={{ padding: '4px 2px', textAlign: 'center' }}>Rs 0.00</td>
                      <td style={{ padding: '4px 2px', textAlign: 'center' }}>Rs {taxable.toFixed(2)}</td>
                      <td style={{ padding: '4px 2px', textAlign: 'center' }}>Rs {itemCgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 2px', textAlign: 'center' }}>Rs {itemSgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 2px', textAlign: 'center' }}></td>
                      <td style={{ padding: '4px 2px', textAlign: 'center' }}></td>
                      <td style={{ padding: '4px 2px', textAlign: 'right' }}>Rs {lineTotal.toFixed(2)}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
              {/* Total Row */}
              <tr style={{ borderTop: '1px solid #000', fontWeight: 'bold' }}>
                <td style={{ padding: '4px 2px', textAlign: 'left' }}>TOTAL</td>
                <td style={{ padding: '4px 2px', textAlign: 'center' }}>Rs {itemsTotal.toFixed(2)}</td>
                <td style={{ padding: '4px 2px', textAlign: 'center' }}>Rs {discountAmount.toFixed(2)}</td>
                <td style={{ padding: '4px 2px', textAlign: 'center' }}>Rs {(Number(data.shippingCharges) || 0).toFixed(2)}</td>
                <td style={{ padding: '4px 2px', textAlign: 'center' }}>Rs {(itemsTotal - discountAmount).toFixed(2)}</td>
                <td style={{ padding: '4px 2px', textAlign: 'center' }}>Rs {cgst.toFixed(2)}</td>
                <td style={{ padding: '4px 2px', textAlign: 'center' }}>Rs {sgst.toFixed(2)}</td>
                <td style={{ padding: '4px 2px', textAlign: 'center' }}></td>
                <td style={{ padding: '4px 2px', textAlign: 'center' }}></td>
                <td style={{ padding: '4px 2px', textAlign: 'right' }}>Rs {grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer info: Authorized Sig & QR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', marginTop: 'auto' }}>
          <div style={{ flex: 1, paddingRight: '20px' }}>
            <div style={{ textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '30px' }}>{data.sellerName}</div>
            <div style={{ width: '150px', height: '40px', marginBottom: '5px', position: 'relative' }}>
              <svg viewBox="0 0 100 40" style={{ width: '100%', height: '100%', stroke: '#000', strokeWidth: '1.5', fill: 'none' }}>
                <path d="M10,20 Q15,5 25,25 T40,15 T50,30 T60,5 T70,30 T80,10" />
                <path d="M15,35 L85,30" style={{ stroke: '#000', strokeWidth: '1' }} />
              </svg>
            </div>
            <div>Authorized Signatory</div>
          </div>
          <div>
            {data.qrCodeUrl ? (
              <img src={data.qrCodeUrl} alt="QR Code" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', background: 'repeating-linear-gradient(45deg, #000, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 6px, #fff 6px, #fff 8px)', filter: 'blur(0.5px)' }}></div>
            )}
          </div>
        </div>

        {/* DECLARATION */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>DECLARATION</div>
          <div style={{ borderBottom: '1px solid #000', paddingBottom: '8px' }}>
            The goods sold as part of this shipment are intended for end-user consumption and are not for retail sale
          </div>
        </div>

        {/* Bottom Text & Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '8px' }}>
          <div style={{ flex: 1, paddingRight: '10px' }}>
            <div style={{ marginBottom: '2px', paddingRight: '50px' }}>
              <strong>Reg Address: </strong> {data.sellerName}, {data.sellerAddress}
            </div>
            <div style={{ marginBottom: '15px' }}><strong>CIN: </strong> {data.sellerPAN ? `U51900MH2007PTC${data.sellerPAN}` : 'U51900MH2007PTC176711'}</div>
            <div>If you have any questions, feel free to call customer care at +91 80 6156 1999 or use Contact Us section in our App.</div>
            <div>or log on to www.myntra.com/contactus</div>
          </div>
          <div style={{ textAlign: 'center', width: '120px' }}>
            <div style={{ marginBottom: '4px' }}>Purchase made on</div>
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="Myntra" style={{ width: '50px', height: '40px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
            ) : (
              <div style={{ fontWeight: 'bold', fontSize: '24px', display: 'inline-block', padding: '0px 6px', background: '#ff3f6c', color: '#fff', borderRadius: '4px', fontStyle: 'italic', fontFamily: 'sans-serif' }}>
                M<span style={{ fontSize: '10px', marginLeft: '2px' }}>yntra</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============== DEFAULT / OTHER TEMPLATES ==============
  return (
    <div
      ref={ref}
      style={{
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: '11px',
        width: '595px',
        minHeight: '842px',
        background: '#fff',
        padding: '30px',
        color: '#000',
        lineHeight: '1.3',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
      }}
    >
      {/* BRANDING HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `2px solid ${isAmazon ? '#FF9900' : colors.primary}`, paddingBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* User uploaded logo takes priority, then template logoUrl, then text */}
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="Logo" style={{ height: '45px', maxWidth: '150px', objectFit: 'contain' }} />
          ) : template?.logoUrl ? (
            <img src={template.logoUrl} alt={template.brand} style={{ height: isMyntra ? '30px' : '40px', maxWidth: '150px' }} />
          ) : (
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{brandName}</div>
          )}
          {/* Show brand name next to logo if logo is uploaded */}
          {data.logoUrl && (
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{brandName}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          {(isAmazon || isMyntra) && (
            <div>
              <div style={barcodeStyle}></div>
              <div style={{ fontSize: '10px' }}>{data.invoiceNumber}</div>
            </div>
          )}
          {!isAmazon && !isMyntra && (
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: colors.primary }}>Tax Invoice</div>
          )}
        </div>
      </div>

      {/* Under-header subtitle for Amazon */}
      {isAmazon && (
        <div style={{ fontWeight: 'bold', marginBottom: '15px', marginTop: '-10px' }}>Tax Invoice</div>
      )}

      {/* SELLER & BUYER GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '25px' }}>
        <div>
          <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Sold By:</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{data.sellerName}</div>
          <div style={{ marginTop: '3px' }}>{data.sellerAddress}</div>
          <div style={{ marginTop: '8px' }}>
            <strong>GSTIN:</strong> {data.sellerGSTIN}
          </div>
          {data.sellerPAN && (
            <div style={{ marginTop: '3px' }}>
              <strong>PAN:</strong> {data.sellerPAN}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Shipping Address:</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{data.buyerName}</div>
          <div style={{ marginTop: '3px' }}>{data.buyerAddress}</div>
          <div style={{ marginTop: '8px' }}>
            <strong>Phone:</strong> {data.buyerPhone}
          </div>
        </div>
      </div>

      {/* ORDER INFO BAR */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        border: '1px solid #eee',
        padding: '12px',
        marginBottom: '20px',
        background: '#fcfcfc',
        borderRadius: '4px'
      }}>
        <div>
          <div style={{ fontSize: '9px', color: '#888' }}>Order No:</div>
          <div style={{ fontWeight: 'bold' }}>{data.orderNumber}</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#888' }}>Invoice Date:</div>
          <div style={{ fontWeight: 'bold' }}>{formatDate(data.invoiceDate)}</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#888' }}>Invoice No:</div>
          <div style={{ fontWeight: 'bold' }}>{data.invoiceNumber}</div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000', textAlign: 'left' }}>
            <th style={{ padding: '8px' }}>Description</th>
            <th style={{ padding: '8px', width: '60px' }}>Qty</th>
            <th style={{ padding: '8px', width: '90px' }}>Rate</th>
            <th style={{ padding: '8px', width: '60px' }}>Tax</th>
            <th style={{ padding: '8px', textAlign: 'right', width: '100px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px 8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{item.description}</div>
                <div style={{ fontSize: '9px', color: '#777', marginTop: '2px' }}>HSN Code: {item.hsn}</div>
              </td>
              <td style={{ padding: '8px' }}>{item.qty}</td>
              <td style={{ padding: '8px' }}>₹{Number(item.rate).toFixed(2)}</td>
              <td style={{ padding: '8px' }}>{item.tax}%</td>
              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>₹{(item.qty * item.rate * (1 + item.tax / 100)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SUMMARY */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
        <div style={{ width: '250px', background: '#fcfcfc', padding: '15px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
            <span style={{ color: '#888' }}>Subtotal:</span>
            <span>₹{itemsTotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
            <span style={{ color: '#888' }}>Tax (GST):</span>
            <span>₹{itemsTax.toFixed(2)}</span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 0',
            marginTop: '10px',
            borderTop: '2px solid #000',
            fontWeight: 'bold',
            fontSize: '15px'
          }}>
            <span>Amount Paid:</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: '9px', color: '#166534', textAlign: 'right', marginTop: '3px', textTransform: 'uppercase' }}>
            {data.paymentMode}
          </div>
        </div>
      </div>

      {/* QR CODE & SIGNATURE SECTION */}
      {data.qrCodeUrl && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <img src={data.qrCodeUrl} alt="QR Code" style={{ width: '65px', height: '65px', objectFit: 'contain' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '15px' }}>{data.sellerName}</div>
            <div style={{ borderTop: '1px solid #999', paddingTop: '4px' }}>
              <span style={{ fontStyle: 'italic', fontSize: '9px', color: '#555' }}>Authorized Signatory</span>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER & TERMS */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '15px', fontSize: '10px', color: '#64748b', textAlign: 'center' }}>
        <div style={{ fontWeight: 'bold', color: '#333' }}> Declaration:</div>
        <div>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>

        <div style={{ marginTop: '10px' }}> For returns & refunds, visit {isAmazon ? 'amazon.in/returns' : 'flipkart.com/helpcentre'}.</div>
      </div>
    </div>
  );
});

InvoiceCanvas.displayName = 'InvoiceCanvas';
export default InvoiceCanvas;
