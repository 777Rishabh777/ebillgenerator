#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Extracts inline script content (excluding external scripts with src attribute)
 */
function extractInlineScripts(htmlContent, filename) {
  const scripts = [];
  // Match script tags without src attribute
  const scriptRegex = /<script\b(?![^>]*\bsrc\s*=)([^>]*)>([\s\S]*?)<\/script>/gi;
  
  let match;
  let lineNumber = 1;
  
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const scriptContent = match[2].trim();
    // Count line numbers up to the match
    const beforeMatch = htmlContent.substring(0, match.index);
    lineNumber = beforeMatch.split('\n').length;
    
    if (scriptContent) {
      scripts.push({
        content: scriptContent,
        line: lineNumber,
        attrs: match[1]
      });
    }
  }
  
  return scripts;
}

/**
 * Validates JavaScript syntax using Function constructor
 */
function validateScript(scriptContent) {
  try {
    new Function(scriptContent);
    return { valid: true, error: null };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      name: error.name
    };
  }
}

/**
 * Main validation function
 */
function validateFiles() {
  const htmlFiles = ['admin.html', 'profile.html'];
  const allErrors = [];
  
  htmlFiles.forEach(filename => {
    const filepath = path.join(__dirname, filename);
    
    if (!fs.existsSync(filepath)) {
      console.warn(`⚠ File not found: ${filename}`);
      return;
    }
    
    const htmlContent = fs.readFileSync(filepath, 'utf8');
    const inlineScripts = extractInlineScripts(htmlContent, filename);
    
    console.log(`\n📄 ${filename}`);
    console.log(`   Found ${inlineScripts.length} inline script(s)`);
    
    inlineScripts.forEach((script, index) => {
      const validation = validateScript(script.content);
      
      if (!validation.valid) {
        allErrors.push({
          file: filename,
          scriptIndex: index + 1,
          line: script.line,
          error: validation.error,
          errorName: validation.name,
          preview: script.content.substring(0, 60).replace(/\n/g, ' ')
        });
        console.log(`   ❌ Script ${index + 1} (line ${script.line}): ${validation.error}`);
        console.log(`      Preview: ${script.content.substring(0, 60).replace(/\n/g, ' ')}...`);
      } else {
        console.log(`   ✓ Script ${index + 1} (line ${script.line}): Valid`);
      }
    });
  });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  if (allErrors.length === 0) {
    console.log('✓ All inline scripts valid');
  } else {
    console.log(`❌ Found ${allErrors.length} validation error(s):\n`);
    allErrors.forEach(err => {
      console.log(`  • ${err.file} (Script ${err.scriptIndex}, line ${err.line})`);
      console.log(`    Error: ${err.error}`);
      console.log(`    Preview: ${err.preview}...`);
    });
  }
  console.log('='.repeat(60));
  
  return allErrors.length === 0 ? 0 : 1;
}

// Run validation
process.exit(validateFiles());
