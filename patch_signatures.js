const fs = require('fs');
const path = require('path');

const templatesPath = path.join(__dirname, 'src', 'components', 'templates');
const canvasPath = path.join(__dirname, 'src', 'components', 'canvas');

function patchInvoiceTemplate() {
  let p = path.join(templatesPath, 'InvoiceTemplates.jsx');
  let content = fs.readFileSync(p, 'utf8');

  // Add signatureUrl to formData
  if (!content.includes("signatureUrl: null")) {
    content = content.replace("qrCodeUrl: null,", "qrCodeUrl: null,\n    signatureUrl: null,");
  }

  // Add handleSignatureUpload and handleRemoveSignature
  if (!content.includes('handleSignatureUpload')) {
    const handleQrCode = `  const handleRemoveQr = () => {
    setFormData(prev => ({ ...prev, qrCodeUrl: null }));
  };`;
    const sigHandlers = `

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, signatureUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
    setFormData(prev => ({ ...prev, signatureUrl: null }));
  };`;
    content = content.replace(handleQrCode, handleQrCode + sigHandlers);
  }

  // Add Signature Upload to the form
  if (!content.includes('Signature Image')) {
    const qrSection = `{/* QR Code Upload */}`;
    const sigSection = `
        {/* Signature Upload */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Signature Image</div>
          <div style={{ marginBottom: '5px' }}>
            {formData.signatureUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={formData.signatureUrl} alt="Signature" style={{ width: '80px', height: '40px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px' }} />
                <button onClick={handleRemoveSignature} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>Remove Sig</button>
              </div>
            ) : (
              <div>
                <input type="file" accept="image/*" onChange={handleSignatureUpload} style={{ display: 'block', fontSize: '12px' }} />
                <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0' }}>Upload authorized signature image</p>
              </div>
            )}
          </div>
        </div>
`;
    content = content.replace(qrSection, sigSection + '\n        ' + qrSection);
  }

  fs.writeFileSync(p, content);
}

function patchInvoiceCanvas() {
  let p = path.join(canvasPath, 'InvoiceCanvas.jsx');
  let content = fs.readFileSync(p, 'utf8');

  // Replace default signature placeholder in Myntra template
  if (content.includes('src="/assets/signature-placeholder.png"')) {
    content = content.replace(
      '<img src="/assets/signature-placeholder.png" alt="" style={{ height: \\\'100%\\\', display: \\\'none\\\' }} />',
      '{data.signatureUrl ? <img src={data.signatureUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : null}'
    );
  }
  fs.writeFileSync(p, content);
}

patchInvoiceTemplate();
patchInvoiceCanvas();
console.log('patched InvoiceTemplates successfully');
