/**
 * useConfirm — composable para mostrar um diálogo de confirmação programaticamente.
 *
 * Uso:
 *   const { confirm } = useConfirm()
 *   const ok = await confirm({ title: 'Excluir?', description: '...' })
 *   if (ok) { ... }
 *
 * Requer que <ConfirmDialogProvider /> esteja montado dentro de App.vue.
 */
import { ref, inject, provide, type InjectionKey } from 'vue'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface ConfirmState extends ConfirmOptions {
  visible: boolean
  loading: boolean
  resolve: ((val: boolean) => void) | null
}

export const CONFIRM_KEY: InjectionKey<{
  state: ReturnType<typeof ref<ConfirmState>>
  open: (opts: ConfirmOptions) => Promise<boolean>
}> = Symbol('confirm')

/** Chamar em App.vue para prover o diálogo a toda a aplicação */
export function provideConfirm() {
  const state = ref<ConfirmState>({
    visible: false,
    loading: false,
    title: '',
    description: '',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    variant: 'danger',
    resolve: null,
  })

  function open(opts: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      Object.assign(state.value, {
        ...opts,
        visible: true,
        loading: false,
        resolve,
      })
    })
  }

  provide(CONFIRM_KEY, { state, open })
  return { state, open }
}

/** Chamar nos componentes que precisam confirmar ações */
export function useConfirm() {
  const ctx = inject(CONFIRM_KEY)

  async function confirm(opts: ConfirmOptions): Promise<boolean> {
    if (!ctx) {
      // fallback para ambientes sem o provider (testes, storybook, etc.)
      return window.confirm(`${opts.title}${opts.description ? '\n\n' + opts.description : ''}`)
    }
    return ctx.open(opts)
  }

  return { confirm }
}
