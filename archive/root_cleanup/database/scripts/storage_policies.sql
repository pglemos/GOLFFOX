-- Tornar bucket 'vehicle-photos' privado e aplicar políticas de acesso
-- Executar no Supabase (projeto GolfFox). Ajuste nomes se necessário.

-- 1) Certificar que o bucket existe
insert into storage.buckets (id, name, public)
select 'vehicle-photos', 'vehicle-photos', false
where not exists (select 1 from storage.buckets where id = 'vehicle-photos');

-- 2) Revogar permissões públicas
update storage.buckets set public = false where id = 'vehicle-photos';

-- 3) Políticas: somente admin pode escrever; leitura via URLs assinadas
drop policy if exists "vehicle-photos-public-read" on storage.objects;
drop policy if exists "vehicle-photos-admin-write" on storage.objects;

create policy "vehicle-photos-admin-write"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'vehicle-photos'
  and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

create policy "vehicle-photos-admin-update"
on storage.objects
for update to authenticated
using (
  bucket_id = 'vehicle-photos'
  and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
)
with check (
  bucket_id = 'vehicle-photos'
  and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

create policy "vehicle-photos-admin-delete"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'vehicle-photos'
  and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

-- Sem política de SELECT para leitura direta: usar URLs assinadas pelo backend
-- Ex.: supabase.storage.from('vehicle-photos').createSignedUrl(path, expiresInSeconds)


