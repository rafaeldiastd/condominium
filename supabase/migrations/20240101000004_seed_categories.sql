-- ============================================================
-- CONDOMIINUS - Seed Categories
-- ============================================================

INSERT INTO public.categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Venda',           'sale',             'tag',        1),
  (gen_random_uuid(), 'Serviço',         'service',          'wrench',     2),
  (gen_random_uuid(), 'Doação',          'donation',         'gift',       3),
  (gen_random_uuid(), 'Pedido de Doação','donation_request', 'hand-heart', 4),
  (gen_random_uuid(), 'Campanha',        'campaign',         'megaphone',  5),
  (gen_random_uuid(), 'Evento',          'event',            'calendar',   6)
ON CONFLICT (slug) DO NOTHING;
