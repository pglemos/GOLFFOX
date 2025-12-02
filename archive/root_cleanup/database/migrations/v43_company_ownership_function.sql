-- Migration: v43_company_ownership_function
-- Função utilitária para verificar ownership de empresa nas policies RLS

create or replace function public.company_ownership(cid uuid)
returns boolean 
language sql 
stable 
as $$
  select exists(
    select 1 
    from public.gf_user_company_map
    where user_id = auth.uid() and company_id = cid
  );
$$;

-- Comentário explicativo
comment on function public.company_ownership(uuid) is 
  'Verifica se o usuário autenticado tem acesso à empresa especificada via gf_user_company_map';
