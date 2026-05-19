const fs = require('fs');
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const indexHtml = fs.readFileSync('index.html', 'utf8');
const match = indexHtml.match(/(<div class="max-w-6xl mx-auto px-6">[\s\S]*?<\/footer>)/i);
if (!match) {
  console.log('No footer piece found in index.html');
  process.exit(1);
}
const rawFooterHtml = match[1];

let properFooterHtml = rawFooterHtml;
if (!properFooterHtml.includes('<footer')) {
  properFooterHtml = '<footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">\n  ' + rawFooterHtml.replace('<\/footer>', '</footer>');
}
if (!properFooterHtml.endsWith('</footer>')) properFooterHtml += '</footer>';


let correctedIndex = indexHtml.replace(rawFooterHtml, properFooterHtml);
fs.writeFileSync('index.html', correctedIndex);

htmlFiles.forEach(file => {
  if (file === 'index.html') return;
  let content = fs.readFileSync(file, 'utf8');
  if (content.match(/<footer[^>]*>[\s\S]*?<\/footer>/i)) {
    content = content.replace(/<footer[^>]*>[\s\S]*?<\/footer>/i, properFooterHtml);
    fs.writeFileSync(file, content);
    console.log('Replaced footer in ' + file);
  } else if (file !== 'google-callback.html') {
    // If no footer exists but </body> does, insert it before </body>
    if (content.includes('</body>')) {
      content = content.replace('</body>', properFooterHtml + '\n</body>');
      fs.writeFileSync(file, content);
      console.log('Inserted footer in ' + file);
    }
  }
});
