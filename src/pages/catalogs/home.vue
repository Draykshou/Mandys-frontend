<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import easterEgg from '@/assets/paco-porno.webp'
import easterEggSound from '@/assets/sans-voice.mp3'
import useAuth from '@/composables/useAuth'

definePage({
  meta: { roles: ["Administrador", "Gerente de Operaciones", "Encargado de Almacen Central", "Encargado de Almacen", "Cajero", "Jefe Cocina", "Gerente Sucursal"] },
});

const { state: auth} = useAuth()

const konamiCode = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
]

const currentSequence = ref<string[]>([])
const showEasterEgg = ref(false)
const audio = new Audio(easterEggSound)

audio.loop = true

const handleKeyDown = (event: KeyboardEvent) => {
  currentSequence.value.push(event.code)

  if (currentSequence.value.length > konamiCode.length) {
    currentSequence.value.shift()
  }

  if (currentSequence.value.join(',') === konamiCode.join(',')) {
    showEasterEgg.value = true
    currentSequence.value = []

    audio.currentTime = 0
    audio.volume = 0.5
    audio.play()
  }
}

const closeEasterEgg = () => {
  showEasterEgg.value = false
  audio.pause()
  audio.currentTime = 0
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  audio.pause()
})
</script>

<template>
  <AppHeader/>
  <div class="flex h-screen bg-neutral-100 text-secondary-800 pt-16">
    <AppSidebar/>

    <div class="overflow-hidden mx-auto">

      <main class="flex justify-center gap-8 overflow-y-auto p-8">
        <div
          v-if="showEasterEgg"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          @click="closeEasterEgg"
        >
          <div class="relative max-w-lg animate-bounce" @click.stop>
            <img
              :src="easterEgg"
              alt="Easter egg"
              class="w-full rounded-2xl shadow-2xl"
            />

            <button
              type="button"
              class="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xl text-white hover:bg-black"
              @click="closeEasterEgg"
            >
              ×
            </button>
          </div>
        </div>
        <div class="flex">
          <div class="flex flex-col items-center gap-4 p-8 bg-neutral-50 border border-neutral-200 rounded-2xl">
            <h1 class="text-4xl font-bold">Bienvenido {{ auth.user?.firstName }} {{ auth.user?.lastName }}</h1>
            <h2 class="text-xl font-semibold">Navegue en la barra lateral para acceder a las opciones de Mandy's POS</h2>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>



