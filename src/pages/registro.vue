<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { ArrowLeft, Eye, EyeOff, UserPlus } from 'lucide-vue-next'
import { postCustomer } from '@/service/CustomersService'
import { mensajeDeError } from '@/utils/apiError'
import AppToast from '@/components/AppToast.vue'
import { useToast } from '@/composables/useToast'
import { useRouter } from 'vue-router'

definePage({ meta: { public: true } })

const router = useRouter()
const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()
const firstName = ref('')
const fatherLastName = ref('')
const motherLastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
let redirectTimer: ReturnType<typeof setTimeout> | undefined

const handleRegister = async () => {
  if (loading.value) return
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }
  loading.value = true
  try {
    await postCustomer({
      firstName: firstName.value,
      fatherLastName: fatherLastName.value,
      email: email.value,
      password: password.value,
      motherLastName: motherLastName.value || null,
    })
    mostrarToast('Tu cuenta fue creada. Redirigiendo al inicio de sesión...', 'exito')
    redirectTimer = setTimeout(() => {
      router.push('/login-cliente')
    }, toast.duracion)
    firstName.value = ''
    fatherLastName.value = ''
    motherLastName.value = ''
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
  } catch (requestError) {
    console.error('Error al crear la cuenta:', requestError)
    error.value = mensajeDeError(
      requestError,
      'No fue posible crear la cuenta. Verifica tus datos e inténtalo nuevamente.',
    )
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  clearTimeout(redirectTimer)
})
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-10 text-secondary-800">
    <section class="w-full max-w-md rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-7 shadow-xl shadow-secondary-800/10 sm:p-10">
      <RouterLink to="/login" class="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700">
        <ArrowLeft :size="17" /> Volver a iniciar sesión
      </RouterLink>
      <div class="mb-7 text-center">
        <img src="@/assets/mandys.webp" alt="Logo de Mandy's" class="mx-auto mb-4 h-24 w-24 object-contain" />
        <h1 class="text-2xl font-bold text-secondary-900">Crear cuenta</h1>
        <p class="mt-2 text-sm text-secondary-600">Regístrate como nuevo cliente de Mandy's.</p>
      </div>

      <div v-if="error" class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{{ error }}</div>
      <form class="space-y-4" @submit.prevent="handleRegister">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="space-y-2 text-sm font-semibold">Nombre<input v-model="firstName" class="field-control field-control-ok h-12 px-4" autocomplete="given-name" required /></label>
          <label class="space-y-2 text-sm font-semibold">Apellido paterno<input v-model="fatherLastName" class="field-control field-control-ok h-12 px-4" autocomplete="family-name" required /></label>
        </div>
        <label class="block space-y-2 text-sm font-semibold">Apellido materno (opcional)<input v-model="motherLastName" class="field-control field-control-ok h-12 px-4" autocomplete="additional-name" /></label>
        <label class="block space-y-2 text-sm font-semibold">Correo electrónico<input v-model="email" type="email" class="field-control field-control-ok h-12 px-4" autocomplete="email" required /></label>
        <label class="block space-y-2 text-sm font-semibold">Contraseña
          <span class="relative block"><input v-model="password" :type="showPassword ? 'text' : 'password'" class="field-control field-control-ok h-12 px-4 pr-12" autocomplete="new-password" minlength="8" required /><button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400" :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="showPassword = !showPassword"><EyeOff v-if="showPassword" :size="19" /><Eye v-else :size="19" /></button></span>
        </label>
        <label class="block space-y-2 text-sm font-semibold">Confirmar contraseña<input v-model="confirmPassword" type="password" class="field-control field-control-ok h-12 px-4" autocomplete="new-password" minlength="8" required /></label>
        <button type="submit" :disabled="loading" class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 font-bold text-white shadow-md shadow-primary-600/20 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
          <UserPlus :size="19" /> {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>
    </section>

    <AppToast
      :visible="toast.visible"
      :mensaje="toast.mensaje"
      :tipo="toast.tipo"
      :duracion="toast.duracion"
      @cerrar="cerrarToast"
    />
  </main>
</template>
