const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps', 'web', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the malformed regex with a standard email regex
const oldRegex = /const EMAIL_REGEX =\r?\n\s+\/\^(?:\?:\[a-zA-Z0-9_'\^\\u0026\/\+\\-\])\+(?:\\\.(?:\[a-zA-Z0-9_'\^\\u0026\/\+\\-\])\+)\*@(?:(?:\[a-zA-Z0-9-\]\+\\\.)\+\[a-zA-Z\]\{2,\})\$\//;

const newRegex = `const EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/`;

content = content.replace(oldRegex, newRegex);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ EMAIL_REGEX fixed successfully!');
