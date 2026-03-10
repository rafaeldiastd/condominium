-- Adicionar novas colunas na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_link text,
  ADD COLUMN IF NOT EXISTS public_whatsapp text,
  ADD COLUMN IF NOT EXISTS public_address text,
  ADD COLUMN IF NOT EXISTS show_followers_count boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_direct_messages boolean DEFAULT true;

-- Criar função para notificar seguidores sobre novo anúncio
CREATE OR REPLACE FUNCTION public.notify_followers_on_announcement()
RETURNS TRIGGER AS $$
DECLARE
  follower RECORD;
  author_name TEXT;
BEGIN
  -- Obter o nome do autor
  SELECT full_name INTO author_name FROM public.profiles WHERE id = NEW.author_id;

  -- Percorre todos os seguidores do autor do anúncio recém-criado
  FOR follower IN 
    SELECT follower_id FROM public.follows WHERE followed_id = NEW.author_id
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      body,
      data
    ) VALUES (
      follower.follower_id,
      'new_announcement',
      'Novo anúncio publicado',
      author_name || ' publicou: ' || NEW.title,
      jsonb_build_object(
        'announcement_id', NEW.id,
        'author_id', NEW.author_id
      )
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para chamar a função após inserção em announcements
DROP TRIGGER IF EXISTS trigger_notify_followers_on_announcement ON public.announcements;
CREATE TRIGGER trigger_notify_followers_on_announcement
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_followers_on_announcement();
