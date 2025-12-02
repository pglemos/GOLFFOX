-- ========================================
-- Script para criar usuário admin no Supabase
-- Execute este SQL no Supabase SQL Editor
-- ========================================

-- 1. Verificar se o usuário já existe
SELECT 
    id, 
    email, 
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'golffox@admin.com';

-- 2. Se não existir, criar o usuário
-- IMPORTANTE: Execute este INSERT apenas se o SELECT acima não retornar nenhum resultado

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
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
    '{"name": "Admin GolfFox"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- 3. Obter o ID do usuário criado
SELECT 
    id, 
    email 
FROM auth.users 
WHERE email = 'golffox@admin.com';

-- 4. Criar entrada na tabela public.users
-- Substitua 'USER_ID_AQUI' pelo ID retornado no passo 3

-- Primeiro, verificar se já existe na tabela public.users
SELECT * FROM public.users WHERE email = 'golffox@admin.com';

-- Se não existir, criar (substitua USER_ID_AQUI pelo ID real)
INSERT INTO public.users (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'golffox@admin.com'),
    'golffox@admin.com',
    'Admin GolfFox',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. Verificar se tudo foi criado corretamente
SELECT 
    au.id,
    au.email as auth_email,
    au.email_confirmed_at,
    pu.email as public_email,
    pu.name,
    pu.role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'golffox@admin.com';

-- 6. Testar se a senha está funcionando (opcional)
-- Este comando não vai funcionar diretamente no SQL Editor,
-- mas você pode usar para referência:
-- SELECT crypt('senha123', encrypted_password) = encrypted_password as password_match
-- FROM auth.users WHERE email = 'golffox@admin.com';