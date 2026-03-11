-- Update notify_followers_on_announcement to include condominium slug
CREATE OR REPLACE FUNCTION public.notify_followers_on_announcement()
RETURNS TRIGGER AS $$
DECLARE
  follower RECORD;
  author_name TEXT;
  condo_slug TEXT;
BEGIN
  -- Obter o nome do autor e o slug do condomínio
  SELECT p.full_name, c.slug INTO author_name, condo_slug 
  FROM public.profiles p
  JOIN public.condominiums c ON c.id = p.condominium_id
  WHERE p.id = NEW.author_id;

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
        'author_id', NEW.author_id,
        'condominium_slug', condo_slug
      )
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify syndics when an announcement is reported
CREATE OR REPLACE FUNCTION public.notify_syndics_on_report()
RETURNS TRIGGER AS $$
DECLARE
  syndic RECORD;
  condo_id UUID;
  condo_slug TEXT;
  announcement_title TEXT;
BEGIN
  -- Get condominium info and announcement title
  SELECT a.condominium_id, c.slug, a.title 
  INTO condo_id, condo_slug, announcement_title
  FROM public.announcements a
  JOIN public.condominiums c ON c.id = a.condominium_id
  WHERE a.id = NEW.announcement_id;

  -- Find all syndics of this condominium
  FOR syndic IN 
    SELECT id FROM public.profiles 
    WHERE condominium_id = condo_id AND role = 'syndic'
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      body,
      data
    ) VALUES (
      syndic.id,
      'announcement_report',
      'Denúncia de anúncio',
      'O anúncio "' || announcement_title || '" foi denunciado.',
      jsonb_build_object(
        'report_id', NEW.id,
        'announcement_id', NEW.announcement_id,
        'condominium_slug', condo_slug
      )
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for reporting
DROP TRIGGER IF EXISTS trigger_notify_syndics_on_report ON public.reports;
CREATE TRIGGER trigger_notify_syndics_on_report
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_syndics_on_report();
