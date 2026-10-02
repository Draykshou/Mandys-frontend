<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  House,
  LogOut,
  ShoppingBasket,
  ShoppingCart,
  Store,
  Users,
  Warehouse,
} from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import useAuth from '@/composables/useAuth'
import LogoutConfirmToast from '@/components/LogoutConfirmToast.vue'

const route = useRoute()
const router = useRouter()
const { state: auth, logout } = useAuth()

const abierto = ref(true)

function alternar() {
  abierto.value = !abierto.value
}

const menuItems = computed(() => [
  {
    key: 'home',
    label: 'Inicio',
    icon: House,
    path: '/catalogs/home',
    roles: ['Administrador', 'Gerente de Operaciones', 'Gerente Sucursal', 'Encargado de Almacen Central', 'Encargado de Almacen'],
  },
  {
    key: 'products',
    label: 'Productos',
    icon: Archive,
    path: '/catalogs/products',
    roles: ['Administrador', 'Gerente de Operaciones', 'Encargado de Almacen Central'],
  },
  {
    key: 'dishes',
    label: 'Platillos',
    icon: ShoppingCart,
    path: '/catalogs/dishes',
    roles: ['Administrador', 'Gerente de Operaciones'],
  },
  {
    key: 'combos',
    label: 'Combos',
    icon: ShoppingBasket,
    path: '/catalogs/combos',
    roles: ['Administrador', 'Gerente de Operaciones'],
  },
  {
    key: 'storage',
    label: 'Almacén',
    icon: Warehouse,
    path: '/catalogs/storage',
    roles: ['Administrador', 'Encargado de Almacen Central', 'Encargado de Almacen'],
  },
  {
    key: 'branches',
    label: 'Sucursales',
    icon: Store,
    path: '/catalogs/branches',
    roles: ['Administrador', 'Gerente de Operaciones'],
  },
  {
    key: 'customers',
    label: 'Clientes',
    icon: Users,
    path: '/catalogs/customers',
    roles: ['Administrador', 'Gerente de Operaciones', 'Gerente Sucursal'],
  },
])

const visibleMenuItems = computed(() => {
  const role = rolUsuario.value

  return menuItems.value.filter(item => item.roles.includes(role))
})

/** Datos reales de la sesión (useAuth); sin valores mock. */
const nombreUsuario = computed(() => {
  const user = auth.value.user
  if (!user) return ''
  return `${user.firstName} ${user.lastName}`.trim()
})

const rolUsuario = computed(() => auth.value.user?.role ?? '')

const emailUsuario = computed(() => auth.value.user?.email ?? '')

const iniciales = computed(() => {
  const partes = nombreUsuario.value.split(' ').filter(Boolean)
  if (partes.length > 0) {
    return `${partes[0][0]}${partes[1]?.[0] ?? ''}`.toUpperCase()
  }
  return emailUsuario.value ? emailUsuario.value[0].toUpperCase() : ''
})

function seleccionar(path: string) {
  router.push(path)
}

/** Segundos antes de cerrar la sesión en automático (ver diseño). */
const LIMITE_SALIDA = 10
const confirmandoSalida = ref(false)
const segundosSalida = ref(LIMITE_SALIDA)
let intervaloSalida: ReturnType<typeof setInterval> | undefined

function limpiarTemporizadorSalida() {
  clearInterval(intervaloSalida)
  intervaloSalida = undefined
}

/** El botón de salir solo abre el toast; la sesión sigue activa. */
function pedirConfirmacionSalida() {
  confirmandoSalida.value = true
  segundosSalida.value = LIMITE_SALIDA
  limpiarTemporizadorSalida()
  intervaloSalida = setInterval(() => {
    segundosSalida.value -= 1
    if (segundosSalida.value <= 0) void confirmarSalida()
  }, 1000)
}

/** "Cerrar sesión": cierra de inmediato, sin esperar el conteo. */
async function confirmarSalida() {
  limpiarTemporizadorSalida()
  confirmandoSalida.value = false
  await logout()
  router.push('/login')
}

/** "Permanecer" o X: cancela el conteo y sigue operando. */
function permanecer() {
  limpiarTemporizadorSalida()
  confirmandoSalida.value = false
}

onBeforeUnmount(limpiarTemporizadorSalida)
</script>

<template>
  <aside
    class="relative flex h-full min-h-0 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 transition-all duration-300"
    :class="abierto ? 'w-60' : 'w-20 items-center'"
  >
    <!-- Flecha lateral para expandir o guardar el menú -->
    <button
      type="button"
      class="absolute -right-3 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-secondary-500 shadow-sm transition-colors hover:bg-neutral-100"
      :title="abierto ? 'Guardar menú' : 'Expandir menú'"
      :aria-label="abierto ? 'Guardar menú' : 'Expandir menú'"
      :aria-expanded="abierto"
      @click="alternar"
    >
      <component :is="abierto ? ChevronLeft : ChevronRight" :size="16" />
    </button>

    <!-- Módulos -->
    <p v-if="abierto" class="px-4 pb-2 pt-6 text-caption font-bold tracking-wider text-neutral-400">
      MÓDULOS DE SERVICIO
    </p>

    <nav
      class="flex min-h-0 w-full flex-1 flex-col gap-1 overflow-y-auto px-3 py-2"
      :class="abierto ? '' : 'pt-6'"
    >
      <button
        v-for="item in visibleMenuItems"
        :key="item.key"
        type="button"
        :title="item.label"
        class="flex items-center gap-3 rounded-xl py-2.5 text-left text-label transition-colors"
        :class="[
          route.path === item.path
            ? 'bg-primary-50 text-primary-700'
            : 'text-secondary-500 hover:bg-neutral-100',
          abierto ? 'w-full px-3' : 'mx-auto h-11 w-11 justify-center px-0',
        ]"
        @click="seleccionar(item.path)"
      >
        <component :is="item.icon" :size="20" class="shrink-0" />
        <span v-if="abierto" class="flex-1">{{ item.label }}</span>
      </button>
    </nav>

    <!-- Usuario -->
    <div class="w-full" :class="abierto ? 'p-3' : 'p-2'">
      <div
        class="flex rounded-xl"
        :class="abierto ? 'flex-row items-center gap-3 bg-neutral-100 p-3' : 'flex-col items-center gap-2 bg-neutral-100 p-2'"
      >
        <span
          class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-label font-bold text-primary-700"
        >
          {{ iniciales }}
          <span
            class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-neutral-50 bg-tertiary-500"
          />
        </span>
        <span v-if="abierto" class="min-w-0 flex-1 leading-tight">
          <span class="block truncate text-label font-bold text-secondary-800">
            {{ nombreUsuario || 'Cargando…' }}
          </span>
          <span v-if="rolUsuario" class="block truncate text-caption text-neutral-500">
            {{ rolUsuario }}
          </span>
          <span v-if="emailUsuario" class="block truncate text-caption text-neutral-400">
            {{ emailUsuario }}
          </span>
        </span>
        <button
          type="button"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-secondary-500 transition-colors hover:bg-neutral-200"
          @click="pedirConfirmacionSalida"
        >
          <LogOut :size="18" />
        </button>
      </div>
    </div>

    <LogoutConfirmToast
      :visible="confirmandoSalida"
      :segundos="segundosSalida"
      :total="LIMITE_SALIDA"
      :turno="rolUsuario || emailUsuario"
      @permanecer="permanecer"
      @cerrar="permanecer"
      @confirmar="confirmarSalida"
    />
  </aside>
</template>
