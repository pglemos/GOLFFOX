const fs = require('fs');

const content = fs.readFileSync('apps/web/app/page.tsx', 'utf8');

// Split by any newline
const lines = content.split(/\r?\n/);

console.log(`Total lines: ${lines.length}`);
console.log('Line 14:', lines[14].substring(0, 100));
console.log('Line 15:', lines[15].substring(0, 100));
console.log('Line 16:', lines[16].substring(0, 100));

// Now replace line 16 (index 15)
if (lines[15] && lines[15].includes('^\u0026')) {
    lines[15] = '  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/';

    // Rejoin with original line endings
    const newContent = lines.join('\r\n');
    fs.writeFileSync('apps/web/app/page.tsx', newContent, 'utf8');
    console.log('✅ Successfully fixed EMAIL_REGEX!');
} else {
    console.log('❌ Line 16 does not contain the expected pattern');
    console.log('Full line 16:', JSON.stringify(lines[15]));
}
