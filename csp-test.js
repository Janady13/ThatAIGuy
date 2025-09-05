#!/usr/bin/env node

/**
 * CSP Compliance Test Script
 * 
 * This script scans the static files for common CSP violations.
 */

const fs = require('fs');
const path = require('path');

const violations = [];
const staticDir = path.join(__dirname, 'static');

function scanFile(filePath, content) {
  const relPath = path.relative(staticDir, filePath);
  
  // Check for eval usage
  if (content.includes('eval(')) {
    violations.push(`${relPath}: Found eval() usage`);
  }
  
  // Check for new Function usage
  if (content.includes('new Function')) {
    violations.push(`${relPath}: Found new Function() usage`);
  }
  
  // Check for string-based setTimeout/setInterval
  const stringTimeoutPattern = /setTimeout\s*\(\s*['"`]/;
  const stringIntervalPattern = /setInterval\s*\(\s*['"`]/;
  if (stringTimeoutPattern.test(content)) {
    violations.push(`${relPath}: Found string-based setTimeout`);
  }
  if (stringIntervalPattern.test(content)) {
    violations.push(`${relPath}: Found string-based setInterval`);
  }
  
  // Check for dynamic script creation (more specific)
  const scriptCreatePattern = /createElement\s*\(\s*['"`]script['"`]\s*\)/;
  if (scriptCreatePattern.test(content)) {
    violations.push(`${relPath}: Found dynamic script element creation`);
  }
  
  // Check for inline event handlers (more specific - exclude meta tag content)
  const inlineHandlerPattern = /\s+on\w+\s*=\s*['"`][^'"`]*['"`]/;
  if (inlineHandlerPattern.test(content) && !content.includes('<meta')) {
    violations.push(`${relPath}: Found inline event handlers (onclick, onload, etc.)`);
  }
  
  // Check for innerHTML with script content (more specific)
  const innerHtmlScriptPattern = /innerHTML\s*=\s*['"`][^'"`]*<script[^'"`]*['"`]/;
  if (innerHtmlScriptPattern.test(content)) {
    violations.push(`${relPath}: Found innerHTML with script content`);
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      const content = fs.readFileSync(filePath, 'utf8');
      scanFile(filePath, content);
    }
  }
}

console.log('🔍 Scanning for CSP violations...\n');

if (fs.existsSync(staticDir)) {
  scanDirectory(staticDir);
} else {
  console.error('Static directory not found!');
  process.exit(1);
}

if (violations.length === 0) {
  console.log('✅ No CSP violations found!');
  console.log('🎉 The codebase is CSP compliant.');
} else {
  console.log('❌ CSP violations found:');
  violations.forEach(violation => console.log(`  - ${violation}`));
  process.exit(1);
}