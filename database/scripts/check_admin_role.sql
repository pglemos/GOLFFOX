-- Verificar o papel do usuário admin
SELECT 
  'USUÁRIO ADMIN' as status,
  email,
  role,
  name,
  company_id,
  carrier_id,
  created_at
FROM public.users 
WHERE email = 'golffox@admin.com';

-- Verificar se existe na tabela auth.users
SELECT 
  'AUTH USERS' as status,
  email,
  id,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'golffox@admin.com';

-- Verificar todos os usuários e seus papéis
SELECT 
  'TODOS OS USUÁRIOS' as status,
  email,
  role,
  name
FROM public.users 
ORDER BY role, email;