<script setup lang="ts">
import type { SidebarItem } from '@/catalog'

defineProps<{
  items: SidebarItem[]
  activeKey: string
}>()

const emit = defineEmits<{
  seleccionar: [key: string]
}>()

// Borra y cambialo por icocnos despues
const ICON_PATHS: Record<SidebarItem['icon'], string> = {
  box: 'M20.25 7.5l-8.25-4.5L3.75 7.5m16.5 0l-8.25 4.5m8.25-4.5v9l-8.25 4.5m0-9L3.75 7.5m8.25 4.5v9m-8.25-9v9l8.25 4.5',
  book: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
  bag: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
  archive:
    'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0v6a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-6m-19.5 0h19.5M6 9.75V6.108c0-1.135.845-2.098 1.976-2.192a48.424 48.424 0 011.048-.096A2.25 2.25 0 0111.25 6v3.75',
}
</script>

<template>
  <aside class="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50">
    <nav class="flex-1 space-y-1 px-3 py-4">
      <button
        v-for="item in items":key="item.key"
        type="button"
        class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-label"
        :class="item.key === activeKey ? 'border-l-4 border-primary-600 bg-primary-50 text-primary-700' : 'text-secondary-500 hover:bg-neutral-100'
        "@click="emit('seleccionar', item.key)"
      >
        <span class="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" :d="ICON_PATHS[item.icon]" />
          </svg>
          {{ item.label }}
        </span>
        <span
          v-if="item.count !== undefined"
          class="rounded-full px-2 py-0.5 text-xs font-semibold"
          :class="item.key === activeKey ? 'bg-primary-600 text-neutral-50' : 'bg-neutral-200 text-secondary-600'"
        >
          {{ item.count }}
        </span>
      </button>
    </nav>
  </aside>
</template>
