#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function removeComments(content) {
  const lines = content.split('\n');
  const cleanedLines = lines.map(line => {
    // Remove single line comments, but preserve import statements
    if (line.trim().startsWith('//') && !line.includes('import')) {
      return '';
    }
    
    // Remove inline comments but preserve // in strings
    let inString = false;
    let inQuotes = false;
    let result = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if ((char === '"' && !inQuotes) || (char === "'" && !inString)) {
        inString = !inString;
        inQuotes = !inQuotes;
        result += char;
      } else if (char === '/' && nextChar === '/' && !inString && !inQuotes) {
        break; // Stop processing this line
      } else {
        result += char;
      }
    }
    
    return result.trimEnd();
  });
  
  // Remove block comments
  let cleanedContent = cleanedLines.join('\n');
  
  // Remove /* */ style comments while preserving JSDoc
  cleanedContent = cleanedContent.replace(/\/\*(?!\*)([\s\S]*?)\*\//g, '');
  
  // Remove empty lines that result from comment removal (but keep intentional spacing)
  const finalLines = cleanedContent.split('\n');
  const result = [];
  let emptyLineCount = 0;
  
  for (const line of finalLines) {
    if (line.trim() === '') {
      emptyLineCount++;
      if (emptyLineCount <= 1) {
        result.push(line);
      }
    } else {
      emptyLineCount = 0;
      result.push(line);
    }
  }
  
  return result.join('\n');
}

function processFile(filePath) {
  if (!filePath.endsWith('.ts')) return;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanedContent = removeComments(content);
    
    if (content !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent);
      console.log(`Cleaned: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      processDirectory(fullPath);
    } else if (stat.isFile() && item.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

// Start processing from src directory
const srcPath = path.join(__dirname, '..', 'src');
if (fs.existsSync(srcPath)) {
  console.log('Removing comments from TypeScript files...');
  processDirectory(srcPath);
  console.log('Done!');
} else {
  console.error('src directory not found');
}