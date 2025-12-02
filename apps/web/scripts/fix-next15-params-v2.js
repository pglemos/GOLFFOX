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
    // We capture:
    // 1. Method name
    // 2. Request argument name
    // 3. The Type definition for params (everything inside { params: ... })

    // Pattern explanation:
    // export\s+async\s+function\s+ -> start of function
    // (GET|POST|PUT|DELETE|PATCH) -> Method (Group 1)
    // \s*\(\s* -> open paren
    // ([^,]+), -> Request arg (Group 2)
    // \s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s* -> start of params destructuring and typing
    // ([\s\S]+?) -> The Type (Group 3) - non-greedy match of anything
    // \s*\}\s*\)\s*\{ -> closing braces for params type, closing paren for args, open brace for function body

    const regex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*([^,]+),\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*([\s\S]+?)\s*\}\s*\)\s*\{/g;

    if (regex.test(content)) {
        content = content.replace(regex, (match, method, reqName, paramsType) => {
            // Clean up inputs
            reqName = reqName.trim();
            paramsType = paramsType.trim();

            return `export async function ${method}(
  ${reqName},
  context: { params: Promise<${paramsType}> }
) {
  const params = await context.params
`;
        });
    }

    if (content !== originalContent) {
        fs.writeFileSync(file, content);
        console.log(`Fixed: ${file}`);
        fixedCount++;
    }
});

console.log(`Total files fixed: ${fixedCount}`);
