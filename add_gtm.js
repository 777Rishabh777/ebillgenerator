const fs = require('fs');
const path = require('path');

const gtmHead = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5P5TZMG4');</script>
<!-- End Google Tag Manager -->`;

const gtmBody = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5P5TZMG4"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

const files = [
  'about.html',
  'admin.html',
  'checkout.html',
  'features.html',
  'google-callback.html',
  'index.html',
  'log_in.html',
  'pricing.html',
  'privacypolicy.html',
  'profile.html',
  'refundpolicy.html',
  'report.html',
  'sign_in.html',
  'templates.html',
  'termsofuse.html'
];

files.forEach(file => {
  const filePath = path.resolve(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Clean up any existing GTM blocks to avoid duplicates
  content = content.replace(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/g, '');
  content = content.replace(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/g, '');
  
  // Insert inside <head>
  content = content.replace('<head>', `<head>\n${gtmHead}`);
  
  // Insert after opening <body>
  content = content.replace(/<body([^>]*)>/, `<body$1>\n${gtmBody}`);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Added GTM to ${file}`);
});

console.log('Successfully completed GTM injection.');
