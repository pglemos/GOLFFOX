-- ============================================================================
-- v54_carrier_storage_setup.sql
-- Configuração do bucket 'carrier-documents' no Supabase Storage
-- ============================================================================

-- Nota: Este arquivo contém instruções SQL que devem ser executadas manualmente
-- no Supabase Dashboard ou via Supabase CLI, pois algumas configurações de Storage
-- não podem ser feitas via SQL puro.

-- ============================================================================
-- PASSO 1: Criar bucket via Supabase Dashboard
-- ============================================================================
-- 1. Acesse: https://app.supabase.com
-- 2. Selecione seu projeto
-- 3. Vá em: Storage → Buckets → New Bucket
-- 4. Nome: carrier-documents
-- 5. Public: false (não público)
-- 6. File size limit: 10 MB (ou conforme necessário)
-- 7. Allowed MIME types: image/jpeg, image/png, application/pdf

-- ============================================================================
-- PASSO 2: Criar políticas RLS para o bucket (executar no SQL Editor)
-- ============================================================================

-- Policy: Carriers podem fazer upload de arquivos em suas pastas
CREATE POLICY "Carriers can upload to their folders"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'carrier-documents'
  AND (
    -- Pasta de documentos de motoristas: driver-documents/{driver_id}/*
    (storage.foldername(name))[1] = 'driver-documents' 
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    -- Pasta de documentos de veículos: vehicle-documents/{vehicle_id}/*
    (storage.foldername(name))[1] = 'vehicle-documents'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id::text = (storage.foldername(name))[2]
      AND v.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    -- Pasta de exames médicos: medical-exams/{driver_id}/*
    (storage.foldername(name))[1] = 'medical-exams'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
);

-- Policy: Carriers podem ler seus próprios arquivos
CREATE POLICY "Carriers can read their files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'carrier-documents'
  AND (
    (storage.foldername(name))[1] = 'driver-documents' 
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'vehicle-documents'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id::text = (storage.foldername(name))[2]
      AND v.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'medical-exams'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
);

-- Policy: Carriers podem atualizar seus arquivos
CREATE POLICY "Carriers can update their files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'carrier-documents'
  AND (
    (storage.foldername(name))[1] = 'driver-documents' 
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'vehicle-documents'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id::text = (storage.foldername(name))[2]
      AND v.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'medical-exams'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
);

-- Policy: Carriers podem deletar seus arquivos
CREATE POLICY "Carriers can delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'carrier-documents'
  AND (
    (storage.foldername(name))[1] = 'driver-documents' 
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'vehicle-documents'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id::text = (storage.foldername(name))[2]
      AND v.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'medical-exams'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
);

-- Comentário para documentação
COMMENT ON POLICY "Carriers can upload to their folders" ON storage.objects IS 'Permite que carriers façam upload de documentos em suas próprias pastas';
COMMENT ON POLICY "Carriers can read their files" ON storage.objects IS 'Permite que carriers leiam seus próprios arquivos';
COMMENT ON POLICY "Carriers can update their files" ON storage.objects IS 'Permite que carriers atualizem seus próprios arquivos';
COMMENT ON POLICY "Carriers can delete their files" ON storage.objects IS 'Permite que carriers deletem seus próprios arquivos';

-- ============================================================================
-- NOTA: Após executar este SQL, ainda é necessário:
-- ============================================================================
-- 1. Criar o bucket 'carrier-documents' manualmente no Supabase Dashboard
-- 2. Configurar o bucket como privado
-- 3. As políticas acima garantem que apenas os arquivos da transportadora
--    do usuário autenticado sejam acessíveis

