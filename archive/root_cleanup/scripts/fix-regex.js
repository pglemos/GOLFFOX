const fs = require('fs');

// Read file
let content = fs.readFileSync('apps/web/app/page.tsx', 'utf8');

// Find and replace the specific regex line
// Looking for the line that contains the malformed regex
const badPattern = /^const EMAIL_REGEX =\r?\n\s+\/\^[^$]+\$\/$/m;

// Check if it exists
if (content.match(badPattern)) {
    console.log('Found malformed EMAIL_REGEX');
} else {
    console.log('Pattern not found, trying simpler approach');
}

// Simple string replacement approach
const oldLine = "  /^(?:[a-zA-Z0-9_'^\\u0026/+\\-])+(?:\\.(?:[a-zA-Z0-9_'^\\u0026/+\\-])+)*@(?:(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,})$/";
const newLine = "  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/";

if (content.includes(oldLine)) {
    content = content.replace(oldLine, newLine);
    fs.writeFileSync('apps/web/app/page.tsx', content, 'utf8');
    console.log('✅ EMAIL_REGEX successfully replaced!');
} else {
    console.log('❌ Old pattern not found. Showing first 500 chars around line 16:');
    const lines = content.split('\n');
    console.log('Line 15:', JSON.stringify(lines[14]));
    console.log('Line 16:', JSON.stringify(lines[15]));
    console.log('Line 17:', JSON.stringify(lines[16]));
}
