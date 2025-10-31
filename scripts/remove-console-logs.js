#!/usr/bin/env node

/**
 * Script to remove all console.log statements from the project
 * while preserving console.error, console.warn, etc.
 * 
 * Usage:
 *   node scripts/remove-console-logs.js [--dry-run] [--path <directory>]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', '.next', '.git', 'dist', 'build', '.cache'];
const EXCLUDE_FILES = ['remove-console-logs.js']; // Don't process this script itself

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Recursively get all files with specified extensions
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    
    // Skip excluded directories
    if (EXCLUDE_DIRS.includes(file)) {
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      const ext = path.extname(filePath);
      const fileName = path.basename(filePath);
      
      // Only process files with specified extensions and not in exclude list
      if (EXTENSIONS.includes(ext) && !EXCLUDE_FILES.includes(fileName)) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

/**
 * Find the end position of console.log() call, handling strings and nested parentheses
 */
function findConsoleLogEnd(text, startPos) {
  let pos = startPos + 'console.log'.length;
  let parenCount = 0;
  let inString = false;
  let stringChar = null;
  let escapeNext = false;
  
  // Skip whitespace before opening paren
  while (pos < text.length && /\s/.test(text[pos])) {
    pos++;
  }
  
  if (pos >= text.length || text[pos] !== '(') {
    return -1;
  }
  
  parenCount = 1;
  pos++;
  
  while (pos < text.length && parenCount > 0) {
    const char = text[pos];
    const prevChar = pos > 0 ? text[pos - 1] : '';
    
    if (escapeNext) {
      escapeNext = false;
      pos++;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      pos++;
      continue;
    }
    
    if (!inString) {
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
      } else if (char === '(') {
        parenCount++;
      } else if (char === ')') {
        parenCount--;
        if (parenCount === 0) {
          return pos;
        }
      }
    } else {
      if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
    }
    
    pos++;
  }
  
  return parenCount === 0 ? pos - 1 : -1;
}

/**
 * Remove console.log statements while preserving console.error and others
 */
function removeConsoleLogs(content) {
  let result = content;
  let lastIndex = 0;
  let searchIndex = 0;
  let modified = false;
  
  // Find and remove all console.log instances
  while (true) {
    // Find next console.log (but not console.error, etc.)
    const consoleLogRegex = /console\.log\s*\(/g;
    consoleLogRegex.lastIndex = searchIndex;
    const match = consoleLogRegex.exec(content);
    
    if (!match) {
      break;
    }
    
    const startPos = match.index;
    
    // Safety check: Make sure we're not accidentally matching console.error, console.warn, etc.
    // Check the text around the match
    const contextBefore = content.substring(Math.max(0, startPos - 20), startPos);
    if (/console\.(error|warn|info|debug|trace)\s*\(/.test(contextBefore + content.substring(startPos, startPos + 50))) {
      searchIndex = startPos + match[0].length;
      continue;
    }
    
    // Check if it's actually console.log and not part of another word
    const beforeChar = startPos > 0 ? content[startPos - 1] : ' ';
    const afterMatch = startPos + match[0].length;
    
    // Skip if it's part of another identifier
    if (/[a-zA-Z0-9_]/.test(beforeChar)) {
      searchIndex = afterMatch;
      continue;
    }
    
    // Find the end of the console.log call
    const endPos = findConsoleLogEnd(content, startPos);
    
    if (endPos === -1) {
      // Couldn't find end, might be malformed - skip it
      searchIndex = afterMatch;
      continue;
    }
    
    // Find semicolon after closing paren (if any)
    let semicolonPos = endPos + 1;
    while (semicolonPos < content.length && /\s/.test(content[semicolonPos])) {
      semicolonPos++;
    }
    const hasSemicolon = content[semicolonPos] === ';';
    const finalEndPos = hasSemicolon ? semicolonPos + 1 : endPos + 1;
    
    // Get text before and after
    const before = content.substring(0, startPos);
    const after = content.substring(finalEndPos);
    
    // Remove the console.log statement
    result = before + after;
    modified = true;
    
    // Update content and search position for next iteration
    content = result;
    searchIndex = startPos;
  }
  
  // Clean up: remove excessive blank lines
  if (modified) {
    result = result.replace(/\n\s*\n\s*\n+/g, '\n\n');
    result = result.replace(/[ \t]+$/gm, ''); // Remove trailing whitespace
  }
  
  return result;
}

/**
 * Process a single file
 */
function processFile(filePath, dryRun = false) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file contains console.log (but not console.error)
    if (!/console\.log/.test(content)) {
      return { modified: false, removed: 0 };
    }
    
    const newContent = removeConsoleLogs(content);
    const removedCount = (content.match(/console\.log/g) || []).length;
    
    if (content !== newContent) {
      if (!dryRun) {
        fs.writeFileSync(filePath, newContent, 'utf8');
      }
      return { modified: true, removed: removedCount, path: filePath };
    }
    
    return { modified: false, removed: 0 };
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`, 'red');
    return { modified: false, error: error.message };
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const pathIndex = args.indexOf('--path') !== -1 ? args.indexOf('--path') : args.indexOf('-p');
  const targetPath = pathIndex !== -1 && args[pathIndex + 1] 
    ? path.resolve(args[pathIndex + 1])
    : process.cwd();
  
  log('🚀 Console.log Removal Script', 'cyan');
  log('━'.repeat(50), 'cyan');
  
  if (dryRun) {
    log('⚠️  DRY RUN MODE - No files will be modified', 'yellow');
  }
  
  log(`📁 Scanning: ${targetPath}`, 'blue');
  log(`📋 Extensions: ${EXTENSIONS.join(', ')}`, 'blue');
  log('');
  
  const files = getAllFiles(targetPath);
  log(`📄 Found ${files.length} files to process\n`, 'blue');
  
  const results = {
    processed: 0,
    modified: 0,
    removed: 0,
    errors: 0,
    details: []
  };
  
  for (const file of files) {
    results.processed++;
    const result = processFile(file, dryRun);
    
    if (result.modified) {
      results.modified++;
      results.removed += result.removed;
      results.details.push({
        file: path.relative(targetPath, result.path),
        removed: result.removed
      });
    }
    
    if (result.error) {
      results.errors++;
    }
  }
  
  // Print summary
  log('━'.repeat(50), 'cyan');
  log('📊 Summary:', 'cyan');
  log(`   Processed: ${results.processed} files`, 'blue');
  log(`   Modified: ${results.modified} files`, results.modified > 0 ? 'green' : 'blue');
  log(`   Removed: ${results.removed} console.log statements`, 'green');
  if (results.errors > 0) {
    log(`   Errors: ${results.errors}`, 'red');
  }
  
  if (results.details.length > 0) {
    log('\n📝 Modified Files:', 'cyan');
    results.details.forEach(({ file, removed }) => {
      log(`   ${file} (removed ${removed})`, 'yellow');
    });
  }
  
  log('');
  
  if (dryRun) {
    log('💡 Run without --dry-run to apply changes', 'yellow');
  } else {
    log('✅ Done! All console.log statements have been removed.', 'green');
    log('💡 console.error, console.warn, etc. have been preserved.', 'green');
  }
  
  log('');
}

// Run the script
main();

