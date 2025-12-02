const fs = require('fs');
const path = require('path');

const filesToFix = [
    'app/api/admin/vehicles/[vehicleId]/route.ts',
    'app/api/admin/users/[userId]/route.ts',
    'app/api/admin/trips/[tripId]/route.ts',
    'app/api/admin/transportadoras/[transportadoraId]/vehicles/route.ts',
    'app/api/admin/transportadoras/[transportadoraId]/drivers/route.ts',
    'app/api/admin/companies/[companyId]/route.ts',
    'app/api/admin/alerts/[alertId]/route.ts',
    'app/api/admin/assistance-requests/[requestId]/route.ts'
];

const baseDir = path.join(__dirname, '../');

filesToFix.forEach(relativePath => {
    const fullPath = path.join(baseDir, relativePath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');

        // Fix double Promise
        // Matches Promise<Promise<{ ... }>>
        // We want to replace it with Promise<{ ... }>
        content = content.replace(/Promise<Promise<(\{[\s\S]+?\})>>/g, 'Promise<$1>');

        // Also fix potential "await params" if params is already awaited from context
        // The previous script added "const params = await context.params"
        // If the code then does "await params", it's redundant but valid JS (awaiting a non-promise returns the value).
        // However, let's clean it up if we see "const { ... } = await params" -> "const { ... } = params"

        content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*await\s+params/g, 'const { $1 } = params');

        fs.writeFileSync(fullPath, content);
        console.log(`Fixed: ${relativePath}`);
    } else {
        console.log(`File not found: ${relativePath}`);
    }
});
