const fs = require('fs');
const path = require('path');

const mcpPath = path.join(process.cwd(), 'mcp.json');
const supabaseUrl = 'https://mcp.supabase.com/mcp?project_ref=vmoxzesvjcfmrebagcwo&features=docs%2Caccount%2Cstorage%2Cbranching%2Cfunctions%2Cdevelopment%2Cdebugging%2Cdatabase';
const supabaseToken = 'sbp_485ebe3a5aadc22282e71207a5c561d54eb374bf';

try {
    let mcpConfig = {};
    if (fs.existsSync(mcpPath)) {
        const content = fs.readFileSync(mcpPath, 'utf8');
        try {
            mcpConfig = JSON.parse(content);
        } catch (e) {
            console.error('Error parsing mcp.json, starting fresh:', e.message);
            mcpConfig = { mcpServers: {} };
        }
    } else {
        mcpConfig = { mcpServers: {} };
    }

    if (!mcpConfig.mcpServers) {
        mcpConfig.mcpServers = {};
    }

    mcpConfig.mcpServers['supabase'] = {
        url: supabaseUrl,
        headers: {
            'Authorization': `Bearer ${supabaseToken}`
        }
    };

    fs.writeFileSync(mcpPath, JSON.stringify(mcpConfig, null, 2));
    console.log('✅ Supabase MCP configured successfully in mcp.json');
} catch (error) {
    console.error('❌ Failed to update mcp.json:', error);
    process.exit(1);
}
