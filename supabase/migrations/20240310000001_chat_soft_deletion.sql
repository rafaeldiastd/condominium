-- Adicionar campos de soft delete na tabela conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS deleted_by_a boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by_b boolean DEFAULT false;

-- Função para checar e deletar uma conversa se ambos os participantes a excluírem
CREATE OR REPLACE FUNCTION public.handle_conversation_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Se ambos marcaram como deletada, apaga a linha (cascateando mensagens)
  IF NEW.deleted_by_a = true AND NEW.deleted_by_b = true THEN
    -- A exclusão acontecerá *após* a trigger concluir a atualização
    -- Portanto usamos o utilitário pgtq ou agendamento? Não, podemos apenas fazer delete aqui
    -- Mas como é um AFTER UPDATE formará loop se não fizermos certinho
    -- O PG limpa recursões bem, mas é mais seguro fazer delete diretamente.
    DELETE FROM public.conversations WHERE id = NEW.id;
    RETURN NULL; -- Já que o registro foi apagado
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para chamar a função após o update
DROP TRIGGER IF EXISTS trigger_handle_conversation_deletion ON public.conversations;
CREATE TRIGGER trigger_handle_conversation_deletion
  AFTER UPDATE OF deleted_by_a, deleted_by_b ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_conversation_deletion();
