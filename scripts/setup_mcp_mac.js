#!/usr/bin/env node

/**
 * Script para configurar MCPs no Mac
 * Uso: node scripts/setup_mcp_mac.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const homeDir = os.homedir();
const projectPath = process.cwd();

// Detectar caminho do Node.js/npx
const { execSync } = require('child_process');
let nodeBinPath;
try {
    // Tentar obter o caminho real do node
    const nodePath = execSync('which node', { encoding: 'utf8' }).trim();
    nodeBinPath = path.dirname(nodePath);
} catch (e) {
    // Fallback para o caminho padrão do nvm
    nodeBinPath = path.join(homeDir, '.nvm', 'versions', 'node', 'v22.21.1', 'bin');
}
const currentPath = process.env.PATH || '';

// PATH que inclui Node.js para os MCPs (evitar duplicação)
const pathParts = currentPath.split(':').filter(p => p && !p.includes('.nvm'));
const mcpEnvPath = `${nodeBinPath}:${pathParts.join(':')}`;

const mcpConfig = {
    "mcpServers": {
        "Puppeteer": {
            "command": "npx",
            "args": [
                "-y",
                "@modelcontextprotocol/server-puppeteer"
            ],
            "env": {
                "PATH": mcpEnvPath
            }
        },
        "GitHub": {
            "command": "npx",
            "args": [
                "-y",
                "@modelcontextprotocol/server-github"
            ],
            "env": {
                "PATH": mcpEnvPath,
                "GITHUB_PERSONAL_ACCESS_TOKEN": "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"
            }
        },
        "Google Maps": {
            "command": "npx",
            "args": [
                "-y",
                "@modelcontextprotocol/server-google-maps"
            ],
            "env": {
                "PATH": mcpEnvPath,
                "GOOGLE_MAPS_API_KEY": "AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM"
            }
        },
        "Memory": {
            "command": "npx",
            "args": [
                "-y",
                "--package=@modelcontextprotocol/server-memory",
                "mcp-server-memory"
            ],
            "env": {
                "PATH": mcpEnvPath,
                "MEMORY_FILE_PATH": path.join(homeDir, ".cursor", "memory.json")
            }
        },
        "Playwright": {
            "command": "npx",
            "args": [
                "-y",
                "@playwright/mcp@latest"
            ],
            "env": {
                "PATH": mcpEnvPath
            }
        },
        "Sequential Thinking": {
            "command": "npx",
            "args": [
                "-y",
                "@modelcontextprotocol/server-sequential-thinking"
            ],
            "env": {
                "PATH": mcpEnvPath
            }
        },
        "shadcn-ui": {
            "command": "npx",
            "args": [
                "-y",
                "shadcn@latest",
                "mcp"
            ],
            "env": {
                "PATH": mcpEnvPath
            }
        },
        "context7": {
            "command": "npx",
            "args": [
                "-y",
                "@upstash/context7-mcp@latest"
            ],
            "env": {
                "PATH": mcpEnvPath,
                "DEFAULT_MINIMUM_TOKENS": "10000"
            }
        },
        "PostgreSQL": {
            "command": "npx",
            "args": [
                "-y",
                "@modelcontextprotocol/server-postgres",
                "postgresql://postgres:Guigui1309%40@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres"
            ],
            "env": {
                "PATH": mcpEnvPath
            }
        },
        "Chrome DevTools MCP": {
            "command": "npx",
            "args": [
                "-y",
                "chrome-devtools-mcp@latest"
            ],
            "env": {
                "PATH": mcpEnvPath
            }
        },
        "supabase": {
            "url": "https://mcp.supabase.com/mcp?project_ref=vmoxzesvjcfmrebagcwo&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching%2Cstorage",
            "headers": {
                "Authorization": "Bearer sbp_485ebe3a5aadc22282e71207a5c561d54eb374bf"
            }
        },
        "Vercel": {
            "command": "npx",
            "args": [
                "-y",
                "@robinson_ai_systems/vercel-mcp@latest"
            ],
            "env": {
                "PATH": mcpEnvPath,
                "VERCEL_TOKEN": "Ao7Xv6TB9X1af7cbDjL2Svt9"
            }
        },
        "Filesystem": {
            "command": "npx",
            "args": [
                "-y",
                "@modelcontextprotocol/server-filesystem",
                projectPath
            ],
            "env": {
                "PATH": mcpEnvPath
            }
        }
    }
};

// Criar diretório de memória se não existir
const memoryDir = path.join(homeDir, ".cursor");
if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
    console.log('✅ Created ~/.cursor directory');
}
const memoryFile = path.join(memoryDir, "memory.json");
if (!fs.existsSync(memoryFile)) {
    fs.writeFileSync(memoryFile, JSON.stringify({}, null, 2));
    console.log('✅ Created memory.json file');
}

// Criar mcp.json em ~/.cursor (configuração global do Cursor)
const mcpPath = path.join(memoryDir, 'mcp.json');
fs.writeFileSync(mcpPath, JSON.stringify(mcpConfig, null, 2));
console.log('✅ mcp.json created successfully at:', mcpPath);
console.log('\n📋 Next steps:');
console.log('1. Restart Cursor completely');
console.log('2. The MCP servers should be automatically detected from ~/.cursor/mcp.json');
console.log('3. Check Cursor settings (Cmd + ,) > MCP to verify');

