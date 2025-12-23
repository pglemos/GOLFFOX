-- ============================================================================
-- Migration: Criar Políticas RLS para Buckets em Português BR
-- GolfFox - Padronização de Nomenclatura PT-BR
-- Data: 2025-01-28
-- ============================================================================
-- 
-- Esta migration cria as políticas RLS para os buckets em português.
-- Execute APÓS criar os buckets via API.
-- ============================================================================

BEGIN;

-- ============================================================================
-- REMOVER POLÍTICAS RLS DOS BUCKETS ANTIGOS
-- ============================================================================

-- Remover políticas dos buckets antigos usando DROP POLICY
DO $$
DECLARE
    policy_record RECORD;
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
        -- Buscar todas as políticas do bucket antigo
        FOR policy_record IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'storage' 
            AND tablename = 'objects'
            AND (policyname LIKE '%' || bucket_id || '%' OR policyname LIKE '%' || REPLACE(bucket_id, '-', ' ') || '%')
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
            RAISE NOTICE 'Removida política: %', policy_record.policyname;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- POLÍTICAS RLS PARA BUCKETS NOVOS
-- ============================================================================

-- Políticas para avatares (bucket público)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can upload avatares'
    ) THEN
        CREATE POLICY "Users can upload avatares"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'avatares');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can update avatares'
    ) THEN
        CREATE POLICY "Users can update avatares"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'avatares')
        WITH CHECK (bucket_id = 'avatares');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Anyone can read avatares'
    ) THEN
        CREATE POLICY "Anyone can read avatares"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'avatares');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can delete avatares'
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
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Transportadora can upload documents'
    ) THEN
        CREATE POLICY "Transportadora can upload documents"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'documentos-transportadora' AND
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND (role = 'gestor_transportadora' OR role = 'transportadora')
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Transportadora can read documents'
    ) THEN
        CREATE POLICY "Transportadora can read documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
            bucket_id = 'documentos-transportadora' AND
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND (role = 'gestor_transportadora' OR role = 'transportadora')
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Transportadora can delete documents'
    ) THEN
        CREATE POLICY "Transportadora can delete documents"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'documentos-transportadora' AND
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND (role = 'gestor_transportadora' OR role = 'transportadora')
            )
        );
    END IF;
END $$;

-- Políticas para documentos-motorista (bucket privado)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can upload driver documents'
    ) THEN
        CREATE POLICY "Users can upload driver documents"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'documentos-motorista');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can read driver documents'
    ) THEN
        CREATE POLICY "Users can read driver documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'documentos-motorista');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can delete driver documents'
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
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can upload vehicle documents'
    ) THEN
        CREATE POLICY "Users can upload vehicle documents"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'documentos-veiculo');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can read vehicle documents'
    ) THEN
        CREATE POLICY "Users can read vehicle documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'documentos-veiculo');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can delete vehicle documents'
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
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can upload company documents'
    ) THEN
        CREATE POLICY "Users can upload company documents"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'documentos-empresa');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can read company documents'
    ) THEN
        CREATE POLICY "Users can read company documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'documentos-empresa');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can delete company documents'
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
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can upload vehicle photos'
    ) THEN
        CREATE POLICY "Users can upload vehicle photos"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'fotos-veiculo');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Anyone can read vehicle photos'
    ) THEN
        CREATE POLICY "Anyone can read vehicle photos"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'fotos-veiculo');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can delete vehicle photos'
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
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can upload costs'
    ) THEN
        CREATE POLICY "Users can upload costs"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'custos');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can read costs'
    ) THEN
        CREATE POLICY "Users can read costs"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'custos');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname = 'Users can delete costs'
    ) THEN
        CREATE POLICY "Users can delete costs"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'custos');
    END IF;
END $$;

COMMIT;
