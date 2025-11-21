-- ========================================
-- Migration v59: Fix Storage Policies para usar transportadora_id
-- ========================================
-- 
-- Esta migration atualiza todas as storage policies do bucket carrier-documents
-- para usar transportadora_id ao invés de carrier_id
--

-- ========================================
-- 1. Remover políticas antigas
-- ========================================
DROP POLICY IF EXISTS "Carriers can upload to their folders" ON storage.objects;
DROP POLICY IF EXISTS "Carriers can read their files" ON storage.objects;
DROP POLICY IF EXISTS "Carriers can update their files" ON storage.objects;
DROP POLICY IF EXISTS "Carriers can delete their files" ON storage.objects;
DROP POLICY IF EXISTS "Transportadoras can upload to their folders" ON storage.objects;
DROP POLICY IF EXISTS "Transportadoras can read their files" ON storage.objects;
DROP POLICY IF EXISTS "Transportadoras can update their files" ON storage.objects;
DROP POLICY IF EXISTS "Transportadoras can delete their files" ON storage.objects;

-- ========================================
-- 2. Criar novas políticas usando transportadora_id
-- ========================================

-- Policy: Transportadoras podem fazer upload de arquivos em suas pastas
CREATE POLICY "Transportadoras can upload to their folders"
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
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    -- Pasta de documentos de veículos: vehicle-documents/{vehicle_id}/*
    (storage.foldername(name))[1] = 'vehicle-documents'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id::text = (storage.foldername(name))[2]
      AND v.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    -- Pasta de exames médicos: medical-exams/{driver_id}/*
    (storage.foldername(name))[1] = 'medical-exams'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  )
);

-- Policy: Transportadoras podem ler seus próprios arquivos
CREATE POLICY "Transportadoras can read their files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'carrier-documents'
  AND (
    (storage.foldername(name))[1] = 'driver-documents' 
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'vehicle-documents'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id::text = (storage.foldername(name))[2]
      AND v.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'medical-exams'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  )
);

-- Policy: Transportadoras podem atualizar seus arquivos
CREATE POLICY "Transportadoras can update their files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'carrier-documents'
  AND (
    (storage.foldername(name))[1] = 'driver-documents' 
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'vehicle-documents'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id::text = (storage.foldername(name))[2]
      AND v.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'medical-exams'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  )
);

-- Policy: Transportadoras podem deletar seus arquivos
CREATE POLICY "Transportadoras can delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'carrier-documents'
  AND (
    (storage.foldername(name))[1] = 'driver-documents' 
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'vehicle-documents'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id::text = (storage.foldername(name))[2]
      AND v.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'medical-exams'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  )
);

-- Comentários para documentação
COMMENT ON POLICY "Transportadoras can upload to their folders" ON storage.objects IS 'Permite que transportadoras façam upload de documentos em suas próprias pastas';
COMMENT ON POLICY "Transportadoras can read their files" ON storage.objects IS 'Permite que transportadoras leiam seus próprios arquivos';
COMMENT ON POLICY "Transportadoras can update their files" ON storage.objects IS 'Permite que transportadoras atualizem seus próprios arquivos';
COMMENT ON POLICY "Transportadoras can delete their files" ON storage.objects IS 'Permite que transportadoras deletem seus próprios arquivos';

