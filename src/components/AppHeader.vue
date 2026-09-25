<script setup lang="ts">
interface Usuario {
  nombre: string
  rol: string
}

defineProps<{
  usuario: Usuario
}>()

const emit = defineEmits<{
  notificaciones: []
  perfil: []
}>()
</script>

<template>
  <header
    class="flex items-center justify-between px-6 py-4 text-neutral-50"
    style="background: linear-gradient(90deg, var(--color-primary-700), var(--color-primary-600))"
  >
    <div class="flex items-center gap-3">
      <h1 class="text-title text-neutral-50">Mandy's</h1>
    </div>

    <div class="flex items-center gap-5">
      <button
        class="relative text-primary-100 hover:text-neutral-50"
        aria-label="Notificaciones"
        @click="emit('notificaciones')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      </button>

      <button class="flex items-center gap-3" @click="emit('perfil')">
        <div class="text-right leading-tight">
          <p class="text-label text-neutral-50">{{ usuario.nombre }}</p>
          <p class="text-caption text-primary-100">{{ usuario.rol }}</p>
        </div>
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-50/20">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
      </button>
    </div>
  </header>
</template>
