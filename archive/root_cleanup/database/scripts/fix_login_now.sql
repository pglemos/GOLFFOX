-- ========================================
-- SOLUÇÃO RÁPIDA PARA O PROBLEMA DE LOGIN
-- Execute este SQL no Supabase SQL Editor
-- ========================================

-- PASSO 1: Verificar usuários existentes
SELECT email, id FROM auth.users;

-- PASSO 2: Criar usuário admin (se não existir)
-- Execute apenas se golffox@admin.com não aparecer no resultado acima

DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Inserir usuário no auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'golffox@admin.com',
        crypt('senha123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Admin GolfFox"}'
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO user_id;

    -- Se o usuário já existia, pegar o ID
    IF user_id IS NULL THEN
        SELECT id INTO user_id FROM auth.users WHERE email = 'golffox@admin.com';
    END IF;

    -- Inserir na tabela public.users
    INSERT INTO public.users (
        id,
        email,
        name,
        role,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        'golffox@admin.com',
        'Admin GolfFox',
        'admin',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = NOW();

    RAISE NOTICE 'Usuário admin criado/atualizado com sucesso!';
END $$;

-- PASSO 3: Verificar se foi criado corretamente
SELECT 
    'auth.users' as tabela,
    email,
    id,
    email_confirmed_at IS NOT NULL as email_confirmado
FROM auth.users 
WHERE email = 'golffox@admin.com'

UNION ALL

SELECT 
    'public.users' as tabela,
    email,
    id,
    (role = 'admin')::text as email_confirmado
FROM public.users 
WHERE email = 'golffox@admin.com';

-- PASSO 4: Atualizar senha (se necessário)
UPDATE auth.users 
SET encrypted_password = crypt('senha123', gen_salt('bf'))
WHERE email = 'golffox@admin.com';

-- RESULTADO FINAL
SELECT 'USUÁRIO ADMIN PRONTO PARA LOGIN!' as status;