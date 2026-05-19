const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'templates');

const templateFiles = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

templateFiles.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Fix grid widths
    content = content.replace(/gridTemplateColumns: '1fr 50px 70px 70px 24px'/g, "gridTemplateColumns: '2fr 1fr 1fr 1fr auto'");
    content = content.replace(/gridTemplateColumns: '1fr 60px 60px 80px 30px'/g, "gridTemplateColumns: '2fr 1fr 1fr 1fr auto'");
    content = content.replace(/gridTemplateColumns: '1fr 50px 70px 24px'/g, "gridTemplateColumns: '2fr 1fr 1.5fr auto'");
    content = content.replace(/gridTemplateColumns: '1fr 60px 80px 30px'/g, "gridTemplateColumns: '2fr 1fr 1.5fr auto'");

    // Fix flex basis for InvoiceTemplates specifically
    content = content.replace(/flex: '0 0 56px'/g, "flex: '1 1 56px'");
    content = content.replace(/flex: '0 0 46px'/g, "flex: '1 1 46px'");
    content = content.replace(/flex: '0 0 64px'/g, "flex: '1 1 64px'");

    // Replace small inputs that might have padding issues
    content = content.replace(/padding: '4px 6px'/g, "padding: '6px 8px'");

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Fixed styles in:', file);
    }
});
