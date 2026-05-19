const fs = require('fs');
const path = require('path');

const templatesPath = path.join(__dirname, 'src', 'components', 'templates');
const p = path.join(templatesPath, 'InvoiceTemplates.jsx');
let content = fs.readFileSync(p, 'utf8');

// Insert the missing functions right before handleDownload
if (!content.includes('handleSignatureUpload')) {
    content = content.replace(
        'const handleDownload = () => {',
        `const handleSignatureUpload = (e) => {
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
  };

  const handleDownload = () => {`
    );
    fs.writeFileSync(p, content);
    console.log('Fixed missing methods in InvoiceTemplates.jsx');
} else {
    console.log('Methods already present.');
}
