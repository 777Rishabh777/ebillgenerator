const fs = require('fs');
const files = ['checkout.html', 'features.html', 'index.html', 'log_in.html', 'pricing.html', 'profile.html', 'sign_in.html', 'templates.html', 'termsofuse.html', 'privacypolicy.html', 'refundpolicy.html', 'about.html', 'admin.html'];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let text = fs.readFileSync(file, 'utf8');
    let orig = text;

    // Replace links more safely
    text = text.replace(/href=\"#\"([\s\S]*?)>Fuel Generator<\/a>/g, 'href=\"features.html\"$1>Fuel Generator</a>');
    text = text.replace(/href=\"#\"([\s\S]*?)>Rent Receipts<\/a>/g, 'href=\"features.html\"$1>Rent Receipts</a>');
    text = text.replace(/href=\"#\"([\s\S]*?)>LTA Templates<\/a>/g, 'href=\"features.html\"$1>LTA Templates</a>');
    text = text.replace(/href=\"#\"([\s\S]*?)>Custom GST<\/a>/g, 'href=\"features.html\"$1>Custom GST</a>');
    text = text.replace(/href=\"#\"([\s\S]*?)>About Us<\/a>/g, 'href=\"about.html\"$1>About Us</a>');

    // Let's also patch 'admin.html' for any niftel references if any
    text = text.replace(/niftel\.in/gi, 'billgen.pro');
    text = text.replace(/niftel\.com/gi, 'billgen.pro');
    text = text.replace(/niftelinfra/gi, 'billgenpro');
    text = text.replace(/niftel/gi, 'billgen');

    if (text !== orig) {
        fs.writeFileSync(file, text, 'utf8');
        console.log('Updated ' + file);
    }
}
console.log('Done script.');
