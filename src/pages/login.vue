<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Mail,
  Key,
  Eye,
  ArrowRight,
} from 'lucide-vue-next'
import useAuth from '@/composables/useAuth'

const router = useRouter()
const { login: authenticate } = useAuth()

const email = ref('')
const password = ref('')
const remember = ref(false)
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (loading.value) return

  loading.value = true
  error.value = ''

  try {
    await authenticate({
      email: email.value,
      password: password.value,
    })

    await router.push('/catalogs/home')
  } catch (err) {
    console.error('Error al iniciar sesión:', err)

    error.value = 'Las credenciales son incorrectas o no fue posible iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f8f6f0] flex flex-col items-center justify-center p-4 font-sans text-[#1a1a1a]">
    
    <!-- Top Left Logo -->
    <div class="absolute top-6 left-6 flex items-center gap-3">
      <div class="w-16 h-16 flex items-center justify-center overflow-hidden">
      </div>
      <span class="text-3xl font-bold tracking-tight">Mandy's POS</span>
    </div>

    <!-- Main Card -->
    <div class="bg-white rounded-[20px] shadow-xl w-full max-w-xl p-10 lg:p-12 z-10 mt-10">
      
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-4 tracking-tight">Inicio de sesión</h1>
        <p class="text-stone-500 text-base leading-relaxed">
          Ingresa tus credenciales para acceder a la gestión de catálogo, inventario y ventas de sucursal.
        </p>
      </div>

      <div
        v-if="error"
        class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ error }}
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        
        <!-- Email -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-[#1a1a1a] uppercase tracking-wide flex">
            USUARIO / CORREO ELECTRÓNICO <span class="text-[#c04a33] ml-1">*</span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
              <Mail :size="20" stroke-width="1.5" />
            </div>
            <input v-model="email" type="text" placeholder="Ej. cmedina@mandys.mx o ID de empleado" class="block w-full pl-12 pr-4 py-3.5 text-base bg-white border border-[#e5e0d8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c04a33] focus:border-[#c04a33] transition-colors placeholder-stone-300 font-normal text-stone-700" required />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="text-xs font-bold text-[#1a1a1a] uppercase tracking-wide flex">
              CONTRASEÑA <span class="text-[#c04a33] ml-1">*</span>
            </label>
            <a href="#" class="text-sm font-semibold text-[#c04a33] hover:text-[#a83e29] transition-colors">¿Olvidaste tu contraseña?</a>
          </div>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
              <Key :size="20" stroke-width="1.5" />
            </div>
            <input v-model="password" type="password" placeholder="••••••••••••" class="block w-full pl-12 pr-12 py-3.5 text-base bg-white border border-[#e5e0d8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c04a33] focus:border-[#c04a33] transition-colors placeholder-stone-300 font-normal text-stone-700 tracking-widest" required />
            <button type="button" class="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600 transition-colors">
              <Eye :size="20" stroke-width="1.5" />
            </button>
          </div>
        </div>

        <!-- Remember Me -->
        <div class="pt-2">
          <label class="flex items-center gap-3 cursor-pointer group w-max">
            <div class="w-6 h-6 rounded flex items-center justify-center transition-colors border-2" :class="remember ? 'bg-[#c04a33] border-[#c04a33]' : 'bg-white border-[#e5e0d8] group-hover:border-[#c04a33]'">
              <svg v-if="remember" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <input type="checkbox" v-model="remember" class="hidden" />
            <span class="text-[15px] text-stone-600">Recordar sesión en esta terminal</span>
          </label>
        </div>

        <!-- Submit -->
        <div class="pt-4">
          <button type="submit" class="w-full bg-[#c04a33] hover:bg-[#a83e29] text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-lg">
            Ingresar al Sistema
            <ArrowRight :size="22" stroke-width="2.5" />
          </button>
        </div>
      </form>
    </div>

    <!-- Bottom Footer -->
    <div class="absolute bottom-8 w-full flex justify-center text-[13px] text-stone-500 tracking-wide">
      <div>© 2024 Mandy's POS & Operaciones Culinarias. Todos los derechos reservados.</div>
    </div>
  </div>
</template>