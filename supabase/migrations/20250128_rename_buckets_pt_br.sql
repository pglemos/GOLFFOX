-- ============================================================================
-- Migration: Renomear Buckets do Supabase Storage para Português BR
-- GolfFox - Padronização de Nomenclatura PT-BR
-- Data: 2025-01-28
-- ============================================================================
-- 
-- Esta migration renomeia os buckets existentes para português, copiando
-- configurações e migrando dados. No Supabase, não é possível renomear
-- buckets diretamente, então criamos novos e migramos os dados.
--
-- Mapeamento de renomeação:
-- - vehicle-documents / veiculo-documents → documentos-veiculo
-- - driver-documents / motorista-documents → documentos-motorista
-- - carrier-documents / transportadora-documents → documentos-transportadora
-- - company-documents → documentos-empresa
-- - vehicle-photos / veiculo-photos → fotos-veiculo
-- - avatars → avatares
-- - costs → custos
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CRIAR NOVOS BUCKETS EM PORTUGUÊS (copiando configurações dos antigos)
-- ============================================================================

-- Bucket: documentos-veiculo (renomear de vehicle-documents ou veiculo-documents)
DO $$
DECLARE
    old_bucket_id TEXT;
    old_bucket_config RECORD;
BEGIN
    -- Verificar qual bucket antigo existe
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id IN ('vehicle-documents', 'veiculo-documents')
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        -- Copiar configurações do bucket antigo
        SELECT public, file_size_limit, allowed_mime_types
        INTO old_bucket_config
        FROM storage.buckets
        WHERE id = old_bucket_id;

        -- Criar novo bucket com configurações do antigo
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'documentos-veiculo',
            'documentos-veiculo',
            COALESCE(old_bucket_config.public, false),
            COALESCE(old_bucket_config.file_size_limit, 10485760),
            COALESCE(old_bucket_config.allowed_mime_types, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
        )
        ON CONFLICT (id) DO NOTHING;
    ELSE
        -- Criar bucket padrão se não existir bucket antigo
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'documentos-veiculo',
            'documentos-veiculo',
            false,
            10485760,
            ARRAY['application/pdf', 'image/jpeg', 'image/png']
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Bucket: documentos-motorista (renomear de driver-documents ou motorista-documents)
DO $$
DECLARE
    old_bucket_id TEXT;
    old_bucket_config RECORD;
BEGIN
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id IN ('driver-documents', 'motorista-documents')
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        SELECT public, file_size_limit, allowed_mime_types
        INTO old_bucket_config
        FROM storage.buckets
        WHERE id = old_bucket_id;

        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'documentos-motorista',
            'documentos-motorista',
            COALESCE(old_bucket_config.public, false),
            COALESCE(old_bucket_config.file_size_limit, 10485760),
            COALESCE(old_bucket_config.allowed_mime_types, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
        )
        ON CONFLICT (id) DO NOTHING;
    ELSE
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'documentos-motorista',
            'documentos-motorista',
            false,
            10485760,
            ARRAY['application/pdf', 'image/jpeg', 'image/png']
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Bucket: documentos-transportadora (renomear de carrier-documents ou transportadora-documents)
DO $$
DECLARE
    old_bucket_id TEXT;
    old_bucket_config RECORD;
BEGIN
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id IN ('carrier-documents', 'transportadora-documents')
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        SELECT public, file_size_limit, allowed_mime_types
        INTO old_bucket_config
        FROM storage.buckets
        WHERE id = old_bucket_id;

        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'documentos-transportadora',
            'documentos-transportadora',
            COALESCE(old_bucket_config.public, false),
            COALESCE(old_bucket_config.file_size_limit, 10485760),
            COALESCE(old_bucket_config.allowed_mime_types, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
        )
        ON CONFLICT (id) DO NOTHING;
    ELSE
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'documentos-transportadora',
            'documentos-transportadora',
            false,
            10485760,
            ARRAY['application/pdf', 'image/jpeg', 'image/png']
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Bucket: documentos-empresa (renomear de company-documents)
DO $$
DECLARE
    old_bucket_id TEXT;
    old_bucket_config RECORD;
BEGIN
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id = 'company-documents'
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        SELECT public, file_size_limit, allowed_mime_types
        INTO old_bucket_config
        FROM storage.buckets
        WHERE id = old_bucket_id;

        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'documentos-empresa',
            'documentos-empresa',
            COALESCE(old_bucket_config.public, false),
            COALESCE(old_bucket_config.file_size_limit, 10485760),
            COALESCE(old_bucket_config.allowed_mime_types, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
        )
        ON CONFLICT (id) DO NOTHING;
    ELSE
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'documentos-empresa',
            'documentos-empresa',
            false,
            10485760,
            ARRAY['application/pdf', 'image/jpeg', 'image/png']
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Bucket: fotos-veiculo (renomear de vehicle-photos ou veiculo-photos)
DO $$
DECLARE
    old_bucket_id TEXT;
    old_bucket_config RECORD;
BEGIN
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id IN ('vehicle-photos', 'veiculo-photos')
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        SELECT public, file_size_limit, allowed_mime_types
        INTO old_bucket_config
        FROM storage.buckets
        WHERE id = old_bucket_id;

        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'fotos-veiculo',
            'fotos-veiculo',
            COALESCE(old_bucket_config.public, true),
            old_bucket_config.file_size_limit,
            old_bucket_config.allowed_mime_types
        )
        ON CONFLICT (id) DO NOTHING;
    ELSE
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'fotos-veiculo',
            'fotos-veiculo',
            true,
            NULL,
            NULL
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Bucket: avatares (renomear de avatars)
DO $$
DECLARE
    old_bucket_id TEXT;
    old_bucket_config RECORD;
BEGIN
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id = 'avatars'
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        SELECT public, file_size_limit, allowed_mime_types
        INTO old_bucket_config
        FROM storage.buckets
        WHERE id = old_bucket_id;

        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'avatares',
            'avatares',
            COALESCE(old_bucket_config.public, true),
            COALESCE(old_bucket_config.file_size_limit, 5242880),
            COALESCE(old_bucket_config.allowed_mime_types, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
        )
        ON CONFLICT (id) DO NOTHING;
    ELSE
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'avatares',
            'avatares',
            true,
            5242880,
            ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Bucket: custos (renomear de costs)
DO $$
DECLARE
    old_bucket_id TEXT;
    old_bucket_config RECORD;
BEGIN
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id = 'costs'
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        SELECT public, file_size_limit, allowed_mime_types
        INTO old_bucket_config
        FROM storage.buckets
        WHERE id = old_bucket_id;

        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'custos',
            'custos',
            COALESCE(old_bucket_config.public, false),
            COALESCE(old_bucket_config.file_size_limit, 10485760),
            COALESCE(old_bucket_config.allowed_mime_types, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
        )
        ON CONFLICT (id) DO NOTHING;
    ELSE
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'custos',
            'custos',
            false,
            10485760,
            ARRAY['application/pdf', 'image/jpeg', 'image/png']
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- 2. REMOVER POLÍTICAS RLS DOS BUCKETS ANTIGOS
-- ============================================================================

-- Remover políticas dos buckets antigos (serão recriadas para os novos buckets)
DO $$
DECLARE
    old_bucket_ids TEXT[] := ARRAY[
        'vehicle-documents', 'veiculo-documents',
        'driver-documents', 'motorista-documents',
        'carrier-documents', 'transportadora-documents',
        'company-documents',
        'vehicle-photos', 'veiculo-photos',
        'avatars',
        'costs'
    ];
    bucket_id TEXT;
BEGIN
    FOREACH bucket_id IN ARRAY old_bucket_ids
    LOOP
        -- Remover todas as políticas do bucket antigo
        DELETE FROM storage.policies
        WHERE bucket_id = bucket_id;
        
        IF FOUND THEN
            RAISE NOTICE 'Removidas políticas do bucket antigo: %', bucket_id;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- 3. POLÍTICAS RLS PARA BUCKETS NOVOS
-- ============================================================================

-- Políticas para avatares (bucket público)
DO $$
BEGIN
    -- INSERT: Usuários autenticados podem fazer upload
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatares' AND name = 'Users can upload avatares'
    ) THEN
        CREATE POLICY "Users can upload avatares"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'avatares');
    END IF;

    -- UPDATE: Usuários autenticados podem atualizar
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatares' AND name = 'Users can update avatares'
    ) THEN
        CREATE POLICY "Users can update avatares"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'avatares')
        WITH CHECK (bucket_id = 'avatares');
    END IF;

    -- SELECT: Qualquer um pode ler (bucket público)
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatares' AND name = 'Anyone can read avatares'
    ) THEN
        CREATE POLICY "Anyone can read avatares"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'avatares');
    END IF;

    -- DELETE: Usuários autenticados podem deletar
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'avatares' AND name = 'Users can delete avatares'
    ) THEN
        CREATE POLICY "Users can delete avatares"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'avatares');
    END IF;
END $$;

-- Políticas para documentos-transportadora (bucket privado)
DO $$
BEGIN
    -- INSERT: Usuários com role transportadora podem fazer upload
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-transportadora' AND name = 'Transportadora can upload documents'
    ) THEN
        CREATE POLICY "Transportadora can upload documents"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'documentos-transportadora' AND
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = 'transportadora'
            )
        );
    END IF;

    -- SELECT: Usuários podem ler documentos da sua transportadora
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-transportadora' AND name = 'Transportadora can read documents'
    ) THEN
        CREATE POLICY "Transportadora can read documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
            bucket_id = 'documentos-transportadora' AND
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = 'transportadora'
            )
        );
    END IF;

    -- DELETE: Usuários com role transportadora podem deletar
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-transportadora' AND name = 'Transportadora can delete documents'
    ) THEN
        CREATE POLICY "Transportadora can delete documents"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'documentos-transportadora' AND
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = 'transportadora'
            )
        );
    END IF;
END $$;

-- Políticas para documentos-motorista (bucket privado)
DO $$
BEGIN
    -- INSERT: Usuários autenticados podem fazer upload
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-motorista' AND name = 'Users can upload driver documents'
    ) THEN
        CREATE POLICY "Users can upload driver documents"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'documentos-motorista');
    END IF;

    -- SELECT: Usuários podem ler documentos de motoristas
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-motorista' AND name = 'Users can read driver documents'
    ) THEN
        CREATE POLICY "Users can read driver documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'documentos-motorista');
    END IF;

    -- DELETE: Usuários autenticados podem deletar
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-motorista' AND name = 'Users can delete driver documents'
    ) THEN
        CREATE POLICY "Users can delete driver documents"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'documentos-motorista');
    END IF;
END $$;

-- Políticas para documentos-veiculo (bucket privado)
DO $$
BEGIN
    -- INSERT: Usuários autenticados podem fazer upload
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-veiculo' AND name = 'Users can upload vehicle documents'
    ) THEN
        CREATE POLICY "Users can upload vehicle documents"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'documentos-veiculo');
    END IF;

    -- SELECT: Usuários podem ler documentos de veículos
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-veiculo' AND name = 'Users can read vehicle documents'
    ) THEN
        CREATE POLICY "Users can read vehicle documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'documentos-veiculo');
    END IF;

    -- DELETE: Usuários autenticados podem deletar
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-veiculo' AND name = 'Users can delete vehicle documents'
    ) THEN
        CREATE POLICY "Users can delete vehicle documents"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'documentos-veiculo');
    END IF;
END $$;

-- Políticas para documentos-empresa (bucket privado)
DO $$
BEGIN
    -- INSERT: Usuários autenticados podem fazer upload
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-empresa' AND name = 'Users can upload company documents'
    ) THEN
        CREATE POLICY "Users can upload company documents"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'documentos-empresa');
    END IF;

    -- SELECT: Usuários podem ler documentos de empresas
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-empresa' AND name = 'Users can read company documents'
    ) THEN
        CREATE POLICY "Users can read company documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'documentos-empresa');
    END IF;

    -- DELETE: Usuários autenticados podem deletar
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-empresa' AND name = 'Users can delete company documents'
    ) THEN
        CREATE POLICY "Users can delete company documents"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'documentos-empresa');
    END IF;
END $$;

-- Políticas para fotos-veiculo (bucket público)
DO $$
BEGIN
    -- INSERT: Usuários autenticados podem fazer upload
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'fotos-veiculo' AND name = 'Users can upload vehicle photos'
    ) THEN
        CREATE POLICY "Users can upload vehicle photos"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'fotos-veiculo');
    END IF;

    -- SELECT: Qualquer um pode ler (bucket público)
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'fotos-veiculo' AND name = 'Anyone can read vehicle photos'
    ) THEN
        CREATE POLICY "Anyone can read vehicle photos"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'fotos-veiculo');
    END IF;

    -- DELETE: Usuários autenticados podem deletar
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'fotos-veiculo' AND name = 'Users can delete vehicle photos'
    ) THEN
        CREATE POLICY "Users can delete vehicle photos"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'fotos-veiculo');
    END IF;
END $$;

-- Políticas para custos (bucket privado)
DO $$
BEGIN
    -- INSERT: Usuários autenticados podem fazer upload
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'custos' AND name = 'Users can upload costs'
    ) THEN
        CREATE POLICY "Users can upload costs"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'custos');
    END IF;

    -- SELECT: Usuários podem ler documentos de custos
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'custos' AND name = 'Users can read costs'
    ) THEN
        CREATE POLICY "Users can read costs"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'custos');
    END IF;

    -- DELETE: Usuários autenticados podem deletar
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'custos' AND name = 'Users can delete costs'
    ) THEN
        CREATE POLICY "Users can delete costs"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'custos');
    END IF;
END $$;

-- ============================================================================
-- 4. MIGRAR OBJETOS (ARQUIVOS) DOS BUCKETS ANTIGOS PARA OS NOVOS
-- ============================================================================

-- Migrar objetos de vehicle-documents ou veiculo-documents para documentos-veiculo
DO $$
DECLARE
    old_bucket_id TEXT;
BEGIN
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id IN ('vehicle-documents', 'veiculo-documents')
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        UPDATE storage.objects
        SET bucket_id = 'documentos-veiculo'
        WHERE bucket_id = old_bucket_id;
        
        RAISE NOTICE 'Migrados objetos de % para documentos-veiculo', old_bucket_id;
    END IF;
END $$;

-- Migrar objetos de driver-documents ou motorista-documents para documentos-motorista
DO $$
DECLARE
    old_bucket_id TEXT;
BEGIN
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id IN ('driver-documents', 'motorista-documents')
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        UPDATE storage.objects
        SET bucket_id = 'documentos-motorista'
        WHERE bucket_id = old_bucket_id;
        
        RAISE NOTICE 'Migrados objetos de % para documentos-motorista', old_bucket_id;
    END IF;
END $$;

-- Migrar objetos de carrier-documents ou transportadora-documents para documentos-transportadora
DO $$
DECLARE
    old_bucket_id TEXT;
BEGIN
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id IN ('carrier-documents', 'transportadora-documents')
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        UPDATE storage.objects
        SET bucket_id = 'documentos-transportadora'
        WHERE bucket_id = old_bucket_id;
        
        RAISE NOTICE 'Migrados objetos de % para documentos-transportadora', old_bucket_id;
    END IF;
END $$;

-- Migrar objetos de company-documents para documentos-empresa
DO $$
DECLARE
    old_bucket_id TEXT;
BEGIN
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id = 'company-documents'
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        UPDATE storage.objects
        SET bucket_id = 'documentos-empresa'
        WHERE bucket_id = old_bucket_id;
        
        RAISE NOTICE 'Migrados objetos de % para documentos-empresa', old_bucket_id;
    END IF;
END $$;

-- Migrar objetos de vehicle-photos ou veiculo-photos para fotos-veiculo
DO $$
DECLARE
    old_bucket_id TEXT;
BEGIN
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id IN ('vehicle-photos', 'veiculo-photos')
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        UPDATE storage.objects
        SET bucket_id = 'fotos-veiculo'
        WHERE bucket_id = old_bucket_id;
        
        RAISE NOTICE 'Migrados objetos de % para fotos-veiculo', old_bucket_id;
    END IF;
END $$;

-- Migrar objetos de avatars para avatares
DO $$
DECLARE
    old_bucket_id TEXT;
BEGIN
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id = 'avatars'
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        UPDATE storage.objects
        SET bucket_id = 'avatares'
        WHERE bucket_id = old_bucket_id;
        
        RAISE NOTICE 'Migrados objetos de % para avatares', old_bucket_id;
    END IF;
END $$;

-- Migrar objetos de costs para custos
DO $$
DECLARE
    old_bucket_id TEXT;
BEGIN
    SELECT id INTO old_bucket_id
    FROM storage.buckets
    WHERE id = 'costs'
    LIMIT 1;

    IF old_bucket_id IS NOT NULL THEN
        UPDATE storage.objects
        SET bucket_id = 'custos'
        WHERE bucket_id = old_bucket_id;
        
        RAISE NOTICE 'Migrados objetos de % para custos', old_bucket_id;
    END IF;
END $$;

-- ============================================================================
-- 5. REMOVER BUCKETS ANTIGOS (após migração bem-sucedida)
-- ============================================================================
-- 
-- ATENÇÃO: Descomente estas linhas APENAS após verificar que todos os
-- arquivos foram migrados corretamente e que o sistema está funcionando.
--
-- DELETE FROM storage.buckets WHERE id IN (
--     'vehicle-documents',
--     'veiculo-documents',
--     'driver-documents',
--     'motorista-documents',
--     'carrier-documents',
--     'transportadora-documents',
--     'company-documents',
--     'vehicle-photos',
--     'veiculo-photos',
--     'avatars',
--     'costs'
-- );
-- ============================================================================

COMMIT;

