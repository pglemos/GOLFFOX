
const fs = require('fs');
const path = require('path');
const { createClient } = require('../apps/web/node_modules/@supabase/supabase-js');

// Configuração rápida
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmoxzesvjcfmrebagcwo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Vou tentar pegar do arquivo se não tiver env

// Mas como é script isolado, vou copiar a lógica de env loading
const envPaths = [
    path.join(__dirname, '..', 'apps', 'web', '.env.local'),
    path.join(__dirname, '..', 'apps', 'web', '.env'),
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env')
];

let url = '';
let key = '';

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const lines = envContent.split('\n');
        for (const line of lines) {
            if (line.includes('SUPABASE_URL=')) url = line.split('=')[1]?.trim().replace(/^["']|["']$/g, '');
            if (line.includes('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1]?.trim().replace(/^["']|["']$/g, '');
        }
        if (url && key) break;
    }
}

const supabase = createClient(url, key);

async function inspectBucket(bucketName) {
    console.log(`Inspecionando: ${bucketName}`);
    const { data, error } = await supabase.storage.from(bucketName).list();
    if (error) {
        console.error(error);
        return;
    }
    console.log(JSON.stringify(data, null, 2));
}

inspectBucket('vehicle-documents');
