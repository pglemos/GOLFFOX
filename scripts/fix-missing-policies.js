/**
 * Script para Corrigir Políticas RLS Faltantes
 * GolfFox - Padronização de Nomenclatura PT-BR
 * 
 * Cria apenas as políticas que estão faltando
 */

const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
const envPaths = [
    path.join(__dirname, '..', 'apps', 'web', '.env.local'),
    path.join(__dirname, '..', 'apps', 'web', '.env'),
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env')
];

let DATABASE_URL = '';

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('DATABASE_URL=') || line.startsWith('SUPABASE_DB_URL=')) {
                DATABASE_URL = line.split('=')[1]?.trim().replace(/^["']|["']$/g, '') || '';
            }
        }
    }
}

if (!DATABASE_URL) {
    DATABASE_URL = 'postgresql://postgres:Guigui1309%40@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';
}

// Políticas individuais para criar (se faltarem)
const POLICIES_SQL = `
-- Criar políticas faltantes individualmente
DO $$
BEGIN
    -- Avatares
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload avatares') THEN
        CREATE POLICY "Users can upload avatares" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatares');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update avatares') THEN
        CREATE POLICY "Users can update avatares" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatares') WITH CHECK (bucket_id = 'avatares');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can read avatares') THEN
        CREATE POLICY "Anyone can read avatares" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatares');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete avatares') THEN
        CREATE POLICY "Users can delete avatares" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatares');
    END IF;
    
    -- Documentos Transportadora
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Transportadora can upload documents') THEN
        CREATE POLICY "Transportadora can upload documents" ON storage.objects FOR INSERT TO authenticated 
        WITH CHECK (bucket_id = 'documentos-transportadora' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'transportadora'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Transportadora can read documents') THEN
        CREATE POLICY "Transportadora can read documents" ON storage.objects FOR SELECT TO authenticated 
        USING (bucket_id = 'documentos-transportadora' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'transportadora'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Transportadora can delete documents') THEN
        CREATE POLICY "Transportadora can delete documents" ON storage.objects FOR DELETE TO authenticated 
        USING (bucket_id = 'documentos-transportadora' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'transportadora'));
    END IF;
    
    -- Documentos Motorista
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload driver documents') THEN
        CREATE POLICY "Users can upload driver documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos-motorista');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read driver documents') THEN
        CREATE POLICY "Users can read driver documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documentos-motorista');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete driver documents') THEN
        CREATE POLICY "Users can delete driver documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documentos-motorista');
    END IF;
    
    -- Documentos Veículo
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload vehicle documents') THEN
        CREATE POLICY "Users can upload vehicle documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos-veiculo');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read vehicle documents') THEN
        CREATE POLICY "Users can read vehicle documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documentos-veiculo');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete vehicle documents') THEN
        CREATE POLICY "Users can delete vehicle documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documentos-veiculo');
    END IF;
    
    -- Documentos Empresa
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload company documents') THEN
        CREATE POLICY "Users can upload company documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos-empresa');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read company documents') THEN
        CREATE POLICY "Users can read company documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documentos-empresa');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete company documents') THEN
        CREATE POLICY "Users can delete company documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documentos-empresa');
    END IF;
    
    -- Fotos Veículo
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload vehicle photos') THEN
        CREATE POLICY "Users can upload vehicle photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos-veiculo');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can read vehicle photos') THEN
        CREATE POLICY "Anyone can read vehicle photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'fotos-veiculo');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete vehicle photos') THEN
        CREATE POLICY "Users can delete vehicle photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'fotos-veiculo');
    END IF;
    
    -- Custos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload costs') THEN
        CREATE POLICY "Users can upload costs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'custos');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read costs') THEN
        CREATE POLICY "Users can read costs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'custos');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete costs') THEN
        CREATE POLICY "Users can delete costs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'custos');
    END IF;
END $$;
`;

async function main() {
    console.log('🔧 Criando SQL para corrigir políticas faltantes\n');
    console.log('='.repeat(70));
    console.log('\n📄 SQL PARA EXECUTAR NO SUPABASE DASHBOARD:\n');
    console.log(POLICIES_SQL);
    console.log('\n' + '='.repeat(70));
    console.log('\n📋 INSTRUÇÕES:\n');
    console.log('1. Acesse: https://app.supabase.com');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá em: SQL Editor → New Query');
    console.log('4. Cole o SQL acima e execute\n');
    console.log('✅ Este SQL cria apenas as políticas que estão faltando\n');
}

main();

