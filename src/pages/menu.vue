<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChefHat, Search, ShoppingBag, Utensils, Plus, Minus, LogOut } from 'lucide-vue-next'
import useAuth from '@/composables/useAuth'

definePage({
  meta: { roles: ['Cliente'] },
})

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  tag: string
  color: string
}

const combos: MenuItem[] = [
  { id: 1, name: "Combo Mandy's", description: 'Platillo principal, guarnición y bebida a elegir.', price: 189, tag: 'Favorito', color: 'bg-primary-100' },
  { id: 2, name: 'Paquete para compartir', description: 'Una selección de nuestros favoritos para disfrutar en compañía.', price: 349, tag: 'Para compartir', color: 'bg-tertiary-100' },
  { id: 3, name: 'Combo Antojo', description: 'La combinación perfecta para consentirte hoy.', price: 159, tag: 'Nuevo', color: 'bg-secondary-100' },
]

const dishes: MenuItem[] = [
  { id: 11, name: 'Tacos de la casa', description: 'Tortilla recién hecha, proteína sazonada y toppings frescos.', price: 135, tag: 'Más pedido', color: 'bg-primary-50' },
  { id: 12, name: 'Pasta cremosa', description: 'Pasta artesanal con salsa cremosa y parmesano.', price: 175, tag: 'Especialidad', color: 'bg-tertiary-50' },
  { id: 13, name: 'Hamburguesa Mandy’s', description: 'Carne al grill, queso, vegetales frescos y papas.', price: 165, tag: 'Clásico', color: 'bg-secondary-50' },
  { id: 14, name: 'Esquites de la casa', description: 'Elote tierno con aderezo, queso y un toque de limón.', price: 95, tag: 'Para compartir', color: 'bg-primary-50' },
]

const search = ref('')
const selectedCategory = ref('Todos')
const cart = ref<Record<number, number>>({})

const filteredDishes = computed(() => {
  const term = search.value.toLowerCase().trim()
  return dishes.filter((dish) => {
    const matchesSearch = !term || `${dish.name} ${dish.description}`.toLowerCase().includes(term)
    const matchesCategory = selectedCategory.value === 'Todos' || dish.tag === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const totalItems = computed(() => Object.values(cart.value).reduce((total, quantity) => total + quantity, 0))
const totalPrice = computed(() => [...combos, ...dishes].reduce((total, item) => total + item.price * (cart.value[item.id] ?? 0), 0))

const addToCart = (id: number) => {
  cart.value[id] = (cart.value[id] ?? 0) + 1
}

const removeFromCart = (id: number) => {
  if (!cart.value[id]) return
  if (cart.value[id] === 1) {
    delete cart.value[id]
  } else {
    cart.value[id]--
  }
}

const { logout } = useAuth()
const signOut = async () => {
  await logout()
}
</script>

<template>
  <main class="min-h-screen bg-neutral-100 pb-28 text-secondary-800">
    <header class="sticky top-0 z-20 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-8">
        <img src="@/assets/mandys_text.svg" alt="Mandy's" class="h-9 w-28 object-contain object-left" />
        <div class="hidden items-center gap-2 text-xs text-secondary-500 md:flex">
          <span class="rounded-full bg-primary-50 px-3 py-1 font-semibold text-primary-700">Entrega a domicilio</span>
          <span>Tiempo estimado: 25-35 min</span>
        </div>
        <label class="relative ml-auto w-full max-w-xs">
          <Search :size="17" class="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
          <input v-model="search" type="search" placeholder="Buscar en el menú" class="field-control field-control-ok h-10 pl-9 pr-3 text-xs" />
        </label>
        <button type="button" class="hidden items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-secondary-700 hover:border-primary-300 sm:flex" @click="signOut">
          <LogOut :size="15" /> Salir
        </button>
      </div>
      <nav class="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-8">
        <button v-for="category in ['Todos', 'Más pedido', 'Especialidad', 'Para compartir']" :key="category" type="button" class="whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors" :class="selectedCategory === category ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-secondary-600 hover:bg-primary-50 hover:text-primary-700'" @click="selectedCategory = category">
          {{ category }}
        </button>
      </nav>
    </header>

    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <section class="mb-10">
        <div class="mb-5 flex items-end justify-between gap-4">
          <div>
            <p class="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Elige tus favoritos</p>
            <h1 class="text-3xl font-bold tracking-tight text-secondary-900 sm:text-4xl">Combos</h1>
            <p class="mt-2 text-sm text-secondary-600">Paquetes preparados para disfrutar más por menos.</p>
          </div>
          <ShoppingBag :size="30" class="hidden text-primary-600 sm:block" />
        </div>
        <div class="grid gap-5 md:grid-cols-3">
          <article v-for="combo in combos" :key="combo.id" class="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div class="flex h-36 items-center justify-center" :class="combo.color">
              <img src="@/assets/mandys_icon.png" :alt="combo.name" class="h-24 w-24 object-contain opacity-90" />
            </div>
            <div class="p-5">
              <span class="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-700">{{ combo.tag }}</span>
              <h2 class="mt-3 text-lg font-bold text-secondary-900">{{ combo.name }}</h2>
              <p class="mt-1 min-h-10 text-xs leading-relaxed text-secondary-600">{{ combo.description }}</p>
              <div class="mt-5 flex items-center justify-between">
                <strong class="text-xl text-primary-700">${{ combo.price }} <small class="text-xs font-medium">MXN</small></strong>
                <button type="button" class="rounded-xl bg-primary-600 p-2.5 text-white hover:bg-primary-700" :aria-label="`Agregar ${combo.name}`" @click="addToCart(combo.id)"><Plus :size="19" /></button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section>
        <div class="mb-5 flex items-end justify-between gap-4">
          <div>
            <p class="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Sabor hecho en casa</p>
            <h2 class="text-3xl font-bold tracking-tight text-secondary-900">Platillos</h2>
          </div>
          <Utensils :size="30" class="hidden text-primary-600 sm:block" />
        </div>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <article v-for="dish in filteredDishes" :key="dish.id" class="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm">
            <div class="flex h-32 items-center justify-center" :class="dish.color">
              <ChefHat :size="52" class="text-primary-600/70" />
            </div>
            <div class="p-4">
              <span class="text-[10px] font-bold uppercase tracking-wide text-primary-600">{{ dish.tag }}</span>
              <h3 class="mt-2 font-bold text-secondary-900">{{ dish.name }}</h3>
              <p class="mt-1 min-h-10 text-xs leading-relaxed text-secondary-600">{{ dish.description }}</p>
              <div class="mt-4 flex items-center justify-between">
                <strong class="text-lg text-primary-700">${{ dish.price }} <small class="text-[10px] font-medium">MXN</small></strong>
                <button type="button" class="rounded-xl bg-primary-600 p-2 text-white hover:bg-primary-700" :aria-label="`Agregar ${dish.name}`" @click="addToCart(dish.id)"><Plus :size="17" /></button>
              </div>
              <div v-if="cart[dish.id]" class="mt-3 flex items-center justify-between rounded-lg bg-neutral-100 px-2 py-1 text-xs">
                <button type="button" aria-label="Quitar unidad" @click="removeFromCart(dish.id)"><Minus :size="14" /></button>
                <span>{{ cart[dish.id] }} en tu pedido</span>
                <button type="button" aria-label="Agregar unidad" @click="addToCart(dish.id)"><Plus :size="14" /></button>
              </div>
            </div>
          </article>
        </div>
        <p v-if="filteredDishes.length === 0" class="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-secondary-500">No encontramos platillos con esa búsqueda.</p>
      </section>
    </div>

    <aside v-if="totalItems" class="fixed bottom-5 left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-between gap-4 rounded-2xl bg-secondary-900 px-4 py-3 text-white shadow-2xl sm:px-6">
      <div class="flex items-center gap-3">
        <span class="rounded-xl bg-primary-600 p-2"><ShoppingBag :size="18" /></span>
        <div><p class="text-xs font-semibold">{{ totalItems }} {{ totalItems === 1 ? 'producto' : 'productos' }}</p><p class="text-[10px] text-neutral-300">Tu pedido Mandy's</p></div>
      </div>
      <strong class="text-sm">${{ totalPrice.toFixed(2) }} MXN</strong>
      <button type="button" class="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold hover:bg-primary-700">Ver pedido</button>
    </aside>
  </main>
</template>
