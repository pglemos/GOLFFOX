-- Verificar se o usuário golffox@admin.com existe e tem o role correto

-- 1. Verificar na tabela auth.users
SELECT 'auth.users' as tabela, id, email, created_at 
FROM auth.users 
WHERE email = 'golffox@admin.com';

-- 2. Verificar na tabela public.users
SELECT 'public.users' as tabela, id, email, role, company_id, carrier_id, created_at 
FROM public.users 
WHERE email = 'golffox@admin.com';

-- 3. Verificar se há correspondência entre as duas tabelas
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    pu.id as public_id,
    pu.email as public_email,
    pu.role,
    pu.company_id,
    pu.carrier_id
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'golffox@admin.com';

-- 4. Verificar se o trigger está funcionando (deve criar automaticamente na public.users)
SELECT 
    'Trigger funcionando?' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'golffox@admin.com') 
        THEN 'SIM - Usuário existe na public.users'
        ELSE 'NÃO - Usuário não foi criado automaticamente'
    END as resultado;