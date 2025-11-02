-- Verificar se o usuário admin existe na tabela users
SELECT 
  'TABELA USERS' as fonte,
  id,
  email,
  role,
  name,
  created_at
FROM public.users 
WHERE email = 'golffox@admin.com';

-- Verificar se existe na tabela auth.users
SELECT 
  'TABELA AUTH.USERS' as fonte,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'golffox@admin.com';

-- Verificar todos os usuários na tabela users
SELECT 
  'TODOS OS USUARIOS' as fonte,
  email,
  role,
  name,
  id
FROM public.users 
ORDER BY created_at DESC;