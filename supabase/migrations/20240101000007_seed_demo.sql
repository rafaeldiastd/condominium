-- ============================================================
-- CONDOMIINUS - Seed de Demonstração
-- Condomínio Residencial Jardins com síndico + 10 moradores + 12 anúncios
-- ============================================================

DO $$
DECLARE
  v_condo_id    uuid := 'a1b2c3d4-0001-0001-0001-000000000001';

  -- Síndico
  v_syndic_id   uuid := 'a1b2c3d4-0002-0002-0002-000000000001';

  -- Moradores
  v_r01 uuid := 'a1b2c3d4-0003-0003-0003-000000000001';
  v_r02 uuid := 'a1b2c3d4-0003-0003-0003-000000000002';
  v_r03 uuid := 'a1b2c3d4-0003-0003-0003-000000000003';
  v_r04 uuid := 'a1b2c3d4-0003-0003-0003-000000000004';
  v_r05 uuid := 'a1b2c3d4-0003-0003-0003-000000000005';
  v_r06 uuid := 'a1b2c3d4-0003-0003-0003-000000000006';
  v_r07 uuid := 'a1b2c3d4-0003-0003-0003-000000000007';
  v_r08 uuid := 'a1b2c3d4-0003-0003-0003-000000000008';
  v_r09 uuid := 'a1b2c3d4-0003-0003-0003-000000000009';
  v_r10 uuid := 'a1b2c3d4-0003-0003-0003-000000000010';

  -- Categorias (lookup por slug)
  cat_sale      uuid;
  cat_service   uuid;
  cat_donation  uuid;
  cat_req       uuid;
  cat_campaign  uuid;
  cat_event     uuid;

BEGIN

  -- ─── Busca categorias ────────────────────────────────────────────────────────
  SELECT id INTO cat_sale     FROM public.categories WHERE slug = 'sale';
  SELECT id INTO cat_service  FROM public.categories WHERE slug = 'service';
  SELECT id INTO cat_donation FROM public.categories WHERE slug = 'donation';
  SELECT id INTO cat_req      FROM public.categories WHERE slug = 'donation_request';
  SELECT id INTO cat_campaign FROM public.categories WHERE slug = 'campaign';
  SELECT id INTO cat_event    FROM public.categories WHERE slug = 'event';

  -- ─── Condomínio ──────────────────────────────────────────────────────────────
  INSERT INTO public.condominiums (id, slug, name, address, city, state, is_active)
  VALUES (
    v_condo_id,
    'residencial-jardins',
    'Residencial Jardins',
    'Rua das Palmeiras, 420',
    'São Paulo',
    'SP',
    true
  )
  ON CONFLICT (id) DO NOTHING;

  -- ─── Usuários auth ───────────────────────────────────────────────────────────
  -- Senha padrão: Senha@123 (bcrypt)
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES
    -- Síndico
    (v_syndic_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'sindico.jardins@condomiinus.app',
     '$2a$10$PFBagGDRvFCEjfp8iBbO6.Xu1N3MU0mO6LiMtLMHOdT3lCW3WP5Cy',
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Carlos Mendes"}',
     false, '', '', '', ''),
    -- Moradores
    (v_r01, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'ana.souza@condomiinus.app',
     '$2a$10$PFBagGDRvFCEjfp8iBbO6.Xu1N3MU0mO6LiMtLMHOdT3lCW3WP5Cy',
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Ana Souza"}',
     false, '', '', '', ''),
    (v_r02, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'bruno.lima@condomiinus.app',
     '$2a$10$PFBagGDRvFCEjfp8iBbO6.Xu1N3MU0mO6LiMtLMHOdT3lCW3WP5Cy',
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Bruno Lima"}',
     false, '', '', '', ''),
    (v_r03, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'carla.dias@condomiinus.app',
     '$2a$10$PFBagGDRvFCEjfp8iBbO6.Xu1N3MU0mO6LiMtLMHOdT3lCW3WP5Cy',
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Carla Dias"}',
     false, '', '', '', ''),
    (v_r04, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'daniel.rocha@condomiinus.app',
     '$2a$10$PFBagGDRvFCEjfp8iBbO6.Xu1N3MU0mO6LiMtLMHOdT3lCW3WP5Cy',
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Daniel Rocha"}',
     false, '', '', '', ''),
    (v_r05, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'elisa.ferreira@condomiinus.app',
     '$2a$10$PFBagGDRvFCEjfp8iBbO6.Xu1N3MU0mO6LiMtLMHOdT3lCW3WP5Cy',
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Elisa Ferreira"}',
     false, '', '', '', ''),
    (v_r06, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'fabio.santos@condomiinus.app',
     '$2a$10$PFBagGDRvFCEjfp8iBbO6.Xu1N3MU0mO6LiMtLMHOdT3lCW3WP5Cy',
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Fábio Santos"}',
     false, '', '', '', ''),
    (v_r07, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'gabriela.costa@condomiinus.app',
     '$2a$10$PFBagGDRvFCEjfp8iBbO6.Xu1N3MU0mO6LiMtLMHOdT3lCW3WP5Cy',
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Gabriela Costa"}',
     false, '', '', '', ''),
    (v_r08, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'henrique.alves@condomiinus.app',
     '$2a$10$PFBagGDRvFCEjfp8iBbO6.Xu1N3MU0mO6LiMtLMHOdT3lCW3WP5Cy',
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Henrique Alves"}',
     false, '', '', '', ''),
    (v_r09, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'isabela.nunes@condomiinus.app',
     '$2a$10$PFBagGDRvFCEjfp8iBbO6.Xu1N3MU0mO6LiMtLMHOdT3lCW3WP5Cy',
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Isabela Nunes"}',
     false, '', '', '', ''),
    (v_r10, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'joao.mendonca@condomiinus.app',
     '$2a$10$PFBagGDRvFCEjfp8iBbO6.Xu1N3MU0mO6LiMtLMHOdT3lCW3WP5Cy',
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"João Mendonça"}',
     false, '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- ─── Perfis ──────────────────────────────────────────────────────────────────
  INSERT INTO public.profiles (id, condominium_id, role, full_name, unit, phone)
  VALUES
    (v_syndic_id, v_condo_id, 'syndic',   'Carlos Mendes',   'Apt 01', '(11) 91111-0001'),
    (v_r01,       v_condo_id, 'resident', 'Ana Souza',        'Apt 02', '(11) 91111-0002'),
    (v_r02,       v_condo_id, 'resident', 'Bruno Lima',       'Apt 03', '(11) 91111-0003'),
    (v_r03,       v_condo_id, 'resident', 'Carla Dias',       'Apt 04', '(11) 91111-0004'),
    (v_r04,       v_condo_id, 'resident', 'Daniel Rocha',     'Apt 05', '(11) 91111-0005'),
    (v_r05,       v_condo_id, 'resident', 'Elisa Ferreira',   'Apt 06', '(11) 91111-0006'),
    (v_r06,       v_condo_id, 'resident', 'Fábio Santos',     'Apt 07', '(11) 91111-0007'),
    (v_r07,       v_condo_id, 'resident', 'Gabriela Costa',   'Apt 08', '(11) 91111-0008'),
    (v_r08,       v_condo_id, 'resident', 'Henrique Alves',   'Apt 09', '(11) 91111-0009'),
    (v_r09,       v_condo_id, 'resident', 'Isabela Nunes',    'Apt 10', '(11) 91111-0010'),
    (v_r10,       v_condo_id, 'resident', 'João Mendonça',    'Apt 11', '(11) 91111-0011')
  ON CONFLICT (id) DO NOTHING;

  -- ─── Anúncios ────────────────────────────────────────────────────────────────
  -- 12 anúncios: tipos, status, preços e datas variados

  INSERT INTO public.announcements
    (condominium_id, author_id, category_id, type,
     title, description,
     price, price_negotiable, status, is_featured, views_count,
     event_date, event_location,
     created_at)
  VALUES

    -- ── VENDA: ativa com destaque, preço negociável ───────────────────────────
    (v_condo_id, v_r01, cat_sale, 'sale',
     'Sofá 3 lugares – suede cinza',
     'Sofá em tecido suede cinza claro, 3 lugares, comprado há 1 ano. Estado impecável, sem manchas visíveis. Motivo da venda: mudança de decoração. Retirada no próprio apartamento, combinar horário.',
     850.00, true, 'active', true, 134,
     NULL, NULL,
     now() - interval '5 days'),

    -- ── VENDA: já vendida (status sold) ──────────────────────────────────────
    (v_condo_id, v_r04, cat_sale, 'sale',
     'Bicicleta ergométrica Kikos – 8 níveis',
     'Bicicleta ergométrica usada por 6 meses, funcionando perfeitamente. 8 níveis de resistência, display digital com contador de calorias e tempo. Parei de usar. VENDIDA.',
     320.00, false, 'sold', false, 89,
     NULL, NULL,
     now() - interval '18 days'),

    -- ── VENDA: preço fixo alto, recente ──────────────────────────────────────
    (v_condo_id, v_r08, cat_sale, 'sale',
     'Ar-condicionado split 12.000 BTUs – Electrolux',
     'Split Electrolux 12.000 BTUs frio, 220v. 3 anos de uso, revisado e higienizado em dezembro. Acompanha controle remoto e suporte de instalação. Retirada no apartamento.',
     1200.00, false, 'active', false, 52,
     NULL, NULL,
     now() - interval '2 days'),

    -- ── SERVIÇO: com preço por hora, destaque ────────────────────────────────
    (v_condo_id, v_r06, cat_service, 'service',
     'Aulas particulares de ingles – online ou presencial',
     'Professor com certificacao Cambridge, 5 anos de experiencia. Atendo do basico ao avancado. Aulas individuais de 1h. Moradores do condominio tem 20% de desconto no plano mensal (8 aulas).',
     90.00, false, 'active', true, 97,
     NULL, NULL,
     now() - interval '12 days'),

    -- ── SERVIÇO: sem preco fixo (orcamento), recente ─────────────────────────
    (v_condo_id, v_r09, cat_service, 'service',
     'Manutencao de celulares e notebooks – no condominio',
     'Tecnico certificado, atendo aqui mesmo no condominio. Servicos: troca de tela, bateria, conector, limpeza interna, formatacao. Orcamento gratuito e sem compromisso. Me chame no 11-9-8888-0009.',
     NULL, false, 'active', false, 43,
     NULL, NULL,
     now() - interval '1 day'),

    -- ── DOACAO: itens variados, ativa ─────────────────────────────────────────
    (v_condo_id, v_r02, cat_donation, 'donation',
     'Colecao de livros didaticos – Ensino Medio 2021',
     'Doando colecao completa do Ensino Medio 2021 (Matematica, Fisica, Quimica, Biologia e Historia). Todos em otimo estado, sem grifos. Preferencia para estudantes do condominio. Retirar no Apt 03.',
     NULL, false, 'active', false, 38,
     NULL, NULL,
     now() - interval '10 days'),

    -- ── DOACAO: encerrada (closed) ────────────────────────────────────────────
    (v_condo_id, v_r07, cat_donation, 'donation',
     'Roupas infantis femininas – 2 a 5 anos',
     'Doei uma sacola de roupas infantis femininas. Ja foi retirada. Obrigada a todos que demonstraram interesse! Se precisar de algo assim novamente, posso ajudar.',
     NULL, false, 'closed', false, 71,
     NULL, NULL,
     now() - interval '25 days'),

    -- ── PEDIDO DE DOACAO: urgente, muitas visualizacoes ───────────────────────
    (v_condo_id, v_r05, cat_req, 'donation_request',
     'Preciso de berco ou mini-cama para bebe',
     'Minha filha nasceu ha 2 meses e estou passando por um momento dificil financeiramente. Se alguem tiver berco, mini-cama ou qualquer mobilia de bebe para doacao, ficaria muito grata. Qualquer coisa ajuda muito.',
     NULL, false, 'active', false, 187,
     NULL, NULL,
     now() - interval '4 days'),

    -- ── PEDIDO DE DOACAO: mais antigo, poucos views ───────────────────────────
    (v_condo_id, v_r10, cat_req, 'donation_request',
     'Cadeira de rodas ou andador para idosa',
     'Minha mae (83 anos) vira morar comigo no Apt 11 e precisa de cadeira de rodas ou andador. Se alguem tiver um em desuso, me chame. Qualquer ajuda e bem-vinda.',
     NULL, false, 'active', false, 29,
     NULL, NULL,
     now() - interval '14 days'),

    -- ── CAMPANHA: destaque, sindico, muitas views ─────────────────────────────
    (v_condo_id, v_syndic_id, cat_campaign, 'campaign',
     'Campanha do Agasalho – doe roupas e alimentos',
     'Estamos arrecadando roupas de inverno e alimentos nao-pereciveis para familias da regiao. Caixas de coleta na portaria e no salao. Prazo: ate dia 30/06. Cada doacao faz diferenca!',
     NULL, false, 'active', true, 312,
     NULL, NULL,
     now() - interval '20 days'),

    -- ── CAMPANHA: vaquinha com valor de contribuicao ──────────────────────────
    (v_condo_id, v_r03, cat_campaign, 'campaign',
     'Vaquinha: reforma da churrasqueira coletiva',
     'A churrasqueira do terraco esta precisando de reforma (reboco, grelha nova e cobertura). Orcamento: R$ 2.400. Contribuicao de R$ 200 por apto. Ja temos 9 apartamentos confirmados – faltam apenas 3! Fale com Carla (Apt 04).',
     200.00, false, 'active', false, 148,
     NULL, NULL,
     now() - interval '8 days'),

    -- ── EVENTO: com data e local, destaque ────────────────────────────────────
    (v_condo_id, v_syndic_id, cat_event, 'event',
     'Festa Junina do Condominio – entrada gratuita',
     'A tradicional Festa Junina do Residencial Jardins esta chegando! Forro ao vivo, barracas de comida tipica (canjica, pamonha, quentao), pescaria para as criancas e quadrilha. Traje tipico e bem-vindo mas nao obrigatorio. Entrada gratuita para todos os moradores.',
     NULL, false, 'active', true, 408,
     now() + interval '18 days', 'Area de lazer – Terraco (cobertura)',
     now() - interval '22 days'),

    -- ── EVENTO: pago, local especifico ────────────────────────────────────────
    (v_condo_id, v_r08, cat_event, 'event',
     'Torneio de Truco – sabado a noite',
     'Primeira edicao do Torneio de Truco do Residencial Jardins! Inscricoes em duplas (R$ 20 por dupla). Includes petiscos e refrigerante. Premio para os campeoes. Vagas limitadas a 10 duplas. Inscreva-se com Henrique (Apt 09).',
     20.00, false, 'active', false, 93,
     now() + interval '5 days', 'Salao de Festas – Bloco B',
     now() - interval '6 days')
  ;

END $$;