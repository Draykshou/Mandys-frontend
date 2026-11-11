<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Key, Eye, EyeOff } from 'lucide-vue-next'
import useAuth from '@/composables/useAuth'

definePage({ meta: { public: true } })

const router = useRouter()
const { login: authenticate } = useAuth()
const email = ref('')
const password = ref('')
const remember = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (loading.value) return
  loading.value = true
  error.value = ''

  try {
    await authenticate({ email: email.value, password: password.value })
    await router.push('/menu')
  } catch (requestError) {
    console.error('Error al iniciar sesión del cliente:', requestError)
    error.value = 'Las credenciales son incorrectas o no fue posible iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-100 px-4 py-10 text-secondary-800">
    <div class="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary-100"></div>
    <div class="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-tertiary-100"></div>

    <section class="relative z-10 w-full max-w-md rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-7 shadow-xl shadow-secondary-800/10 sm:p-10">
      <div class="mb-8 text-center">
        <img src="@/assets/mandys.webp" alt="Logo de Mandy's" class="mx-auto mb-5 h-28 w-28 object-contain" />
        <h1 class="mb-2 text-3xl font-bold tracking-tight text-secondary-900">Bienvenido</h1>
        <p class="text-sm leading-relaxed text-secondary-600">Ingresa tus datos para acceder a Mandy's.</p>
      </div>

      <div v-if="error" class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {{ error }}
      </div>

      <form class="space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-2">
          <label for="client-email" class="text-sm font-semibold text-secondary-800">Usuario</label>
          <div class="relative">
            <Mail :size="19" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input id="client-email" v-model="email" type="text" autocomplete="username" placeholder="Correo electrónico o usuario" class="field-control field-control-ok h-12 pl-11 pr-4" required />
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between gap-3">
            <label for="client-password" class="text-sm font-semibold text-secondary-800">Contraseña</label>
            <a href="#" class="text-xs font-semibold text-primary-600 hover:text-primary-700">¿Olvidaste tu contraseña?</a>
          </div>
          <div class="relative">
            <Key :size="19" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input id="client-password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Ingresa tu contraseña" class="field-control field-control-ok h-12 pl-11 pr-12" required />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-secondary-400 hover:text-secondary-700" :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="showPassword = !showPassword">
              <EyeOff v-if="showPassword" :size="19" />
              <Eye v-else :size="19" />
            </button>
          </div>
        </div>

        <label class="flex cursor-pointer items-center gap-3 text-sm text-secondary-600">
          <input v-model="remember" type="checkbox" class="h-4 w-4 rounded border-neutral-300 accent-primary-600" />
          <span>Recordarme</span>
        </label>

        <button type="submit" :disabled="loading" class="w-full rounded-xl bg-primary-600 px-6 py-3.5 text-base font-bold text-white shadow-md shadow-primary-600/20 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
          {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
        </button>
      </form>

      <div class="mt-7 border-t border-neutral-200 pt-6 text-center">
        <span class="text-sm text-secondary-600">¿Eres nuevo cliente?</span>
        <RouterLink to="/registro" class="ml-1 text-sm font-bold text-primary-600 hover:text-primary-700">Crear cuenta</RouterLink>
      </div>
    </section>
  </main>
</template>
