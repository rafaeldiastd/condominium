<template>
  <div class="login-wrapper">
    <!-- Card -->
    <div class="login-card">
      <!-- Logo -->
      <div class="login-header">
        <div class="logo-icon">
          <span>C</span>
        </div>
        <h1 class="login-title">Condomiinus</h1>
        <p class="login-subtitle">Seu condomínio conectado</p>
      </div>

      <!-- Error -->
      <div v-if="errorMessage" class="login-error">
        <span class="error-dot" />
        <p>{{ errorMessage }}</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handlePasswordLogin" class="login-form">
        <div class="field-group">
          <label for="email" class="field-label">E-mail</label>
          <div class="field-wrapper" :class="{ 'field-error': emailError, 'field-focused': emailFocused }">
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder="seu@email.com"
              class="field-input"
              @focus="emailFocused = true"
              @blur="emailFocused = false"
            />
          </div>
          <p v-if="emailError" class="field-error-msg">{{ emailError }}</p>
        </div>

        <div class="field-group">
          <label for="password" class="field-label">Senha</label>
          <div class="field-wrapper" :class="{ 'field-error': passwordError, 'field-focused': passFocused }">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              placeholder="••••••••"
              class="field-input"
              @focus="passFocused = true"
              @blur="passFocused = false"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="eye-btn"
              tabindex="-1"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <p v-if="passwordError" class="field-error-msg">{{ passwordError }}</p>
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          <span v-if="loading" class="submit-loading">
            <span class="dot-1" />
            <span class="dot-2" />
            <span class="dot-3" />
          </span>
          <span v-else>Entrar</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const emailFocused = ref(false)
const passFocused = ref(false)

const loading = computed(() => authStore.loading)

const emailError = computed(() => {
  if (!email.value) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) ? '' : 'Email inválido'
})

const passwordError = computed(() => {
  if (!password.value) return ''
  return password.value.length >= 6 ? '' : 'Mínimo 6 caracteres'
})

async function handlePasswordLogin() {
  errorMessage.value = ''
  if (emailError.value || passwordError.value) return

  try {
    await authStore.signIn(email.value, password.value)
    await redirectAfterLogin()
  } catch (err: unknown) {
    const error = err as Error
    if (error.message?.includes('Invalid login credentials')) {
      errorMessage.value = 'Email ou senha incorretos.'
    } else if (error.message?.includes('Email not confirmed')) {
      errorMessage.value = 'Email não confirmado. Verifique sua caixa de entrada.'
    } else {
      errorMessage.value = error.message || 'Erro ao fazer login. Tente novamente.'
    }
  }
}

async function redirectAfterLogin() {
  await authStore.fetchProfile()
  const redirect = route.query.redirect as string

  if (redirect && !redirect.startsWith('/login') && !redirect.startsWith('/confirm')) {
    await router.push(redirect)
    return
  }

  const profile = authStore.profile
  if (!profile) {
    errorMessage.value = 'Perfil não encontrado. Contate o administrador.'
    return
  }

  if (profile.role === 'super_admin') {
    await router.push('/admin')
  } else if (profile.condominium?.slug) {
    if (profile.role === 'syndic') {
      await router.push(`/${profile.condominium.slug}/sindico`)
    } else {
      await router.push(`/${profile.condominium.slug}`)
    }
  } else {
    errorMessage.value = 'Sua conta ainda não foi associada a um condomínio. Contate o síndico.'
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background:
    radial-gradient(ellipse 80% 60% at 50% -20%, rgba(59,130,246,.12) 0%, transparent 60%),
    var(--color-bg);
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-lg);
  padding: 2rem 1.75rem;
}

/* Header */
.login-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.logo-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--color-primary), #0ea5e9);
  box-shadow: 0 8px 20px rgba(59,130,246,.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.875rem;
  color: #fff;
  font-size: 1.5rem;
  font-weight: 800;
}

.login-title {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  margin-bottom: 2px;
}

.login-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* Error */
.login-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  margin-bottom: 1.25rem;
}

.login-error p {
  font-size: 0.8125rem;
  color: #dc2626;
  font-weight: 500;
}

.error-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-danger);
  flex-shrink: 0;
  margin-top: 4px;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.field-wrapper {
  position: relative;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-border);
  background: #fff;
  overflow: hidden;
  transition: border-color var(--transition), box-shadow var(--transition);
  display: flex;
  align-items: center;
}

.field-wrapper.field-focused {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-ring);
}

.field-wrapper.field-error {
  border-color: var(--color-danger);
}

.field-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  outline: none;
}

.field-input::placeholder {
  color: var(--color-text-muted);
}

.field-error-msg {
  font-size: 0.75rem;
  color: var(--color-danger);
  font-weight: 500;
}

.eye-btn {
  padding: 0 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

/* Submit */
.submit-btn {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, var(--color-primary), #0ea5e9);
  color: #fff;
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(59,130,246,.35);
  transition: transform var(--transition), box-shadow var(--transition);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(59,130,246,.4);
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Loading dots */
.submit-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.dot-1, .dot-2, .dot-3 {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,.8);
  animation: dotBounce 1.2s ease infinite;
}
.dot-2 { animation-delay: .2s; }
.dot-3 { animation-delay: .4s; }

@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(0.7); opacity: .5; }
  40%           { transform: scale(1);   opacity: 1; }
}
</style>
