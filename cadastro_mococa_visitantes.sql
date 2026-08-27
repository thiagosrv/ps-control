-- ============================================================
-- PS Control — Cadastro de visitantes/terceiros: Mococa - SP
-- Empresa: PREFAB CONSTRUCOES PREFBRICADAS LTDA
-- Execute TODO de uma vez no SQL Editor do projeto Supabase da obra de Mococa
-- Idempotente: se o CPF já existir, apenas atualiza os dados (não duplica)
-- ============================================================

insert into public.visitors (full_name, cpf, company, funcao)
values
  ('Agnaldo Batista dos Santos', '26440117874', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', 'Poceiro'),
  ('Antonio Pereira de Lacerda', '15679991829', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', 'Carpinteiro'),
  ('Bruno Henrique Custódio da Silva', '37541639818', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', 'ENGENHEIRO CIVIL'),
  ('Celso da Silva', '03536613411', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', 'Carpinteiro'),
  ('Jaime Ribeiro Novaes', '35222913520', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', 'Encarregado de obras'),
  ('DEIVID VASQUES DA SILVA', '23071476833', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', 'ENGENHEIRO CIVIL'),
  ('Expedito Pereira da Silva', '32726023487', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', 'Oficial de Obras'),
  ('FRANCISCO CLAUDIO CHAGAS', '21424520860', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', 'ENGENHEIRO CIVIL'),
  ('Flavio Pereira da Silva', '39856253870', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', 'Soldador'),
  ('Gevaldo da Conceição', '05050282470', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', 'ARMADOR'),
  ('Jeronimo Pereira de Barros', '71599347415', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', 'Oficial de blocos e tubulões'),
  ('José Antonio Pereira', '13179033827', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', 'Topografo auxiliar'),
  ('João Vitor dos Santos Pereira da Silva', '60869787861', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', 'Auxiliar de Obras'),
  ('LUIS BATISTA DE SOUZA', '26763549814', 'PREFAB CONSTRUCOES PREFBRICADAS LTDA', null)
on conflict (cpf) do update set
  full_name = excluded.full_name,
  company   = excluded.company,
  funcao    = excluded.funcao,
  updated_at = now();
