<script setup lang="ts">
import {
  House,
  ScanBarcode,
  Soup,
  ShoppingBasket,
  Package,
  Store,
  Users
} from 'lucide-vue-next'

import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const menuItems = [
  {
    key: 'home',
    label: 'Inicio',
    icon: House,
    path: '/catalogs/home',
  },
  {
    key: 'products',
    label: 'Productos',
    icon: ScanBarcode,
    path: '/catalogs/products',
  },
  {
    key: 'dishes',
    label: 'Platillos',
    icon: Soup,
    path: '/catalogs/dishes',
  },
  {
    key: 'combos',
    label: 'Combos',
    icon: ShoppingBasket,
    path: '/catalogs/combos',
  },
  {
    key: 'warehouse',
    label: 'Almacén',
    icon: Package,
    path: '/catalogs/warehouse',
  },
  {
    key: 'branches',
    label: 'Sucursales',
    icon: Store,
    path: '/catalogs/branches',
  },
  {
    key: 'customers',
    label: 'Clientes',
    icon: Users,
    path: '/catalogs/customers',
  },
]

function seleccionar(path: string) {
  router.push(path)
}
</script>

<template>
  <aside class="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50">
    <nav class="flex-1 space-y-1 px-3 py-4">
      <button
        v-for="item in menuItems"
        :key="item.key"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-label transition-colors"
        :class="
          route.path === item.path
            ? 'bg-primary-100 text-primary-700'
            : 'text-secondary-500 hover:bg-neutral-100'
        "
        @click="seleccionar(item.path)"
      >
        <component :is="item.icon" :size="20" />

        {{ item.label }}
      </button>
    </nav>
  </aside>
</template>