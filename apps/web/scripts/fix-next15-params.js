const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file === 'route.ts') {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

const apiDir = path.join(__dirname, '../app/api');
const files = getAllFiles(apiDir);

let fixedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Regex to match: export async function METHOD(req, { params }: { params: TYPE }) {
    // We need to be careful with newlines and whitespace
    const regex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*([^,]+),\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*([^}]+)\s*\}\s*\)\s*\{/g;

    if (regex.test(content)) {
        // Replace with: export async function METHOD(req, context: { params: Promise<TYPE> }) {
        // and add: const params = await context.params;

        content = content.replace(regex, (match, method, reqName, paramsType) => {
            // Clean up paramsType (remove newlines/extra spaces if needed)
            paramsType = paramsType.trim();

            return `export async function ${method}(
  ${reqName},
  context: { params: Promise<{ ${paramsType} }> }
) {
  const params = await context.params
`;
        });

        // Also handle the case where params might be destructured differently or formatted differently
        // But the above regex covers the standard pattern used in this codebase: { params }: { params: { ... } }
    }

    // Handle the case where params is NOT destructured in the signature but used as { params }
    // e.g. export async function GET(req, { params }: { params: { id: string } })
    // The regex above handles exactly that.

    if (content !== originalContent) {
        fs.writeFileSync(file, content);
        console.log(`Fixed: ${file}`);
        fixedCount++;
    }
});

console.log(`Total files fixed: ${fixedCount}`);
