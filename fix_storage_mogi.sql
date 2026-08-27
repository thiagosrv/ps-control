-- ============================================================
-- PS Control — Cria bucket de fotos: Mogi Guaçu - SP
-- Corrige "fotos não salvam" (bucket visit-photos inexistente)
-- Execute TODO de uma vez no SQL Editor do projeto wloetniezrnjcodaqcxq
-- ============================================================

-- 1. Cria o bucket público para as fotos de entrada/saída
insert into storage.buckets (id, name, public)
values ('visit-photos', 'visit-photos', true)
on conflict (id) do nothing;

-- 2. Permite que usuários autenticados (porteiro/admin) enviem fotos
create policy "auth_upload_visit_photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'visit-photos');

-- 3. Permite que usuários autenticados atualizem (upsert) fotos
create policy "auth_update_visit_photos"
on storage.objects for update
to authenticated
using (bucket_id = 'visit-photos');

-- 4. Leitura pública das fotos (necessário para exibir via URL pública)
create policy "public_read_visit_photos"
on storage.objects for select
to public
using (bucket_id = 'visit-photos');
