const fs = require('fs');
const files = ['about.html', 'privacypolicy.html', 'termsofuse.html', 'refundpolicy.html'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace dark classes in footer
  content = content.replace(/<footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-20 pb-8">/g, '<footer class="bg-white border-t border-slate-200 pt-20 pb-8">');
  
  content = content.replace(/text-slate-900 dark:text-white/g, 'text-slate-900');
  
  content = content.replace(/bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/g, 'bg-slate-50 border border-slate-200');
  
  content = content.replace(/border-t border-slate-100 dark:border-slate-900/g, 'border-t border-slate-100');
  
  fs.writeFileSync(file, content);
});
console.log('Done modifying footer classes.');
