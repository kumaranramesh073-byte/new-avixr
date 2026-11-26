const fs = require('fs');

const contentPath = 'C:\\Users\\roshn\\.gemini\\antigravity\\brain\\e00f0c17-445b-45b5-9623-b109426157c8\\.system_generated\\steps\\22\\content.md';
const content = fs.readFileSync(contentPath, 'utf8');

const term = 'export function ShinyButton';
const idx = content.indexOf(term);
if (idx !== -1) {
  console.log('--- SHINY BUTTON FULL CODE ---');
  // We want to extract around 8000 characters from here.
  // And let's replace \n, \u003c (which is <), \u003e (which is >) and any escape sequences.
  const rawCode = content.substring(idx - 100, idx + 10000);
  
  // Unescape JSON-like escape sequences
  let cleanCode = rawCode
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\u0026/g, '&');
  
  console.log(cleanCode);
} else {
  console.log('Not found');
}
