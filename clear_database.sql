-- ============================================================
-- SCRIPT DE LIMPEZA DO BANCO DE DADOS
-- Este script APAGA/LIMPA todas as tabelas relacionadas a:
-- Anúncios, Usuários/Perfis, Categorias e Condomínios.
-- ============================================================

-- IMPORTANTE: No Supabase, os usuários da autenticação ficam no esquema auth.
-- Se quiser limpar TAMBÉM os usuários de autenticação (logins do Supabase), use a segunda query (DELETE FROM auth.users).
-- Se quiser manter os logins mas focar apenas em limpar os anúncios/perfis, NÃO rode o DELETE de auth.users.

-- 1. DROP DAS TABELAS (Caso queira excluir a estrutura e dados completamente)
-- Utilize a flag CASCADE para evitar conflitos de restrições de chaves estrangeiras.

-- DROP TABLE IF EXISTS public.favorites CASCADE;
-- DROP TABLE IF EXISTS public.reports CASCADE;
-- DROP TABLE IF EXISTS public.announcement_images CASCADE;
-- DROP TABLE IF EXISTS public.messages CASCADE;
-- DROP TABLE IF EXISTS public.conversations CASCADE;
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.campaign_condominiums CASCADE;
-- DROP TABLE IF EXISTS public.campaigns CASCADE;
-- DROP TABLE IF EXISTS public.announcements CASCADE;
-- DROP TABLE IF EXISTS public.categories CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TABLE IF EXISTS public.condominiums CASCADE;


-- ============================================================
-- 2. CLEAR/TRUNCATE DAS TABELAS (Caso queira APENAS limpar os dados, MANTENDO A ESTRUTURA)
-- ============================================================

-- Aqui o CASCADE garante que todas as tabelas dependentes destes dados também sejam esvaziadas

TRUNCATE TABLE public.condominiums CASCADE;
-- Ao truncar condomínios em cascata, ele apagará anúncios, perfis, campanhas ligadas etc.
-- Alternativamente, você pode apagar tabela por tabela para maior controle:

-- TRUNCATE TABLE public.announcements CASCADE;
-- TRUNCATE TABLE public.profiles CASCADE;
-- TRUNCATE TABLE public.categories CASCADE;


-- ============================================================
-- 3. LIMPEZA DOS USUÁRIOS DE AUTENTICAÇÃO (Opcional - Supabase Auth)
-- Remova o comentário abaixo apenas se tiver certeza de que deseja deletar todos os usuários do sistema.
-- ============================================================
-- DELETE FROM auth.users;

-- ============================================================
-- 4. LIMPEZA DOS ARQUIVOS DE STORAGE (Imagens, Avatares, etc)
-- ============================================================

-- Por padrão a tabela storage.objects pertence ao superuser (Role supabase_storage_admin).
-- Usuários postgres não podem alterar propriedades (trigger/ownership).
-- Também precisamos apagar fisicamente usando net.http (não é viável via SQL puro com segurança sem plugins).
--
-- A forma mais simples de "enganar" a UI ou banco relacional e apagar registros quando você *não* precisa 
-- preservar os arquivos em nuvem ou está reconstruindo localmente, é recriando o próprio schema storage (apenas em DEV!)
--
-- Caso queira apagar de verdade usando apenas SQL, sem precisar de JS externo, podemos ignorar temporariamente 
-- o Row Level Security (RLS) rodando como SECURITY DEFINER:

DO $$ 
DECLARE
    obj RECORD;
BEGIN
    FOR obj IN SELECT id, bucket_id FROM storage.objects WHERE bucket_id IN ('announcement-images', 'avatars', 'campaign-images')
    LOOP
        -- Usar a função de remoção da API REST interna se existir ou forçar cast
        -- Isso contorna RLS pois a lógica de exclusão no Supabase verifica ownership do arquivo
        DELETE FROM storage.objects WHERE id = obj.id;
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'A exclusão por SQL é super restrita e algumas regras não podem ser ignoradas. Use via JS API se falhar: %', SQLERRM;
END $$;
