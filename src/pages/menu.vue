<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChefHat, Search, ShoppingBag, Utensils, Plus, Minus, LogIn, LogOut } from 'lucide-vue-next'
import useAuth from '@/composables/useAuth'
import { getMenuCombos, getMenuDishes, getMenuProducts, type MenuProduct } from '@/service/MenuService'
import type { Combo } from '@/types/CombosDtos'
import type { Dish } from '@/types/DishesDtos'

definePage({
  meta: { public: true },
})

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  tag: string
  color: string
}

const combos = ref<MenuItem[]>([])
const dishes = ref<MenuItem[]>([])
const products = ref<MenuItem[]>([])
const loading = ref(true)
const loadError = ref('')
const colors = ['bg-primary-50', 'bg-tertiary-50', 'bg-secondary-50']

const toComboItem = (combo: Combo, index: number): MenuItem => ({
  id: `combo-${combo.id}`,
  name: combo.name,
  description: 'Una combinación preparada para disfrutar más por menos.',
  price: combo.price,
  tag: 'Combo',
  color: colors[index % colors.length],
})

const toDishItem = (dish: Dish, index: number): MenuItem => ({
  id: `dish-${dish.id}`,
  name: dish.name,
  description: 'Platillo preparado al momento con ingredientes frescos.',
  price: dish.price,
  tag: 'Platillo',
  color: colors[index % colors.length],
})

const toProductItem = (product: MenuProduct, index: number): MenuItem => ({
  id: `product-${product.id}`,
  name: product.name || product.description,
  description: product.description,
  price: product.salePrice,
  tag: 'Producto',
  color: colors[index % colors.length],
})

const loadMenu = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const [comboItems, dishItems, productItems] = await Promise.all([
      getMenuCombos(),
      getMenuDishes(),
      getMenuProducts(),
    ])
    combos.value = comboItems.map(toComboItem)
    dishes.value = dishItems.map(toDishItem)
    products.value = productItems.map(toProductItem)
  } catch (error) {
    console.error('No se pudo cargar el menú:', error)
    loadError.value = 'No fue posible cargar el menú. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}

onMounted(loadMenu)

const search = ref('')
const selectedCategory = ref('Todos')
const cart = ref<Record<string, number>>({})
const router = useRouter()
const { state: authState, logout } = useAuth()

const filteredDishes = computed(() => {
  const term = search.value.toLowerCase().trim()
  return dishes.value.filter((dish) => {
    const matchesSearch = !term || `${dish.name} ${dish.description}`.toLowerCase().includes(term)
    const matchesCategory = selectedCategory.value === 'Todos' || dish.tag === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const totalItems = computed(() => Object.values(cart.value).reduce((total, quantity) => total + quantity, 0))
const totalPrice = computed(() => [...combos.value, ...dishes.value, ...products.value].reduce((total, item) => total + item.price * (cart.value[item.id] ?? 0), 0))

const addToCart = (id: string) => {
  cart.value[id] = (cart.value[id] ?? 0) + 1
}

const removeFromCart = (id: string) => {
  if (!cart.value[id]) return
  if (cart.value[id] === 1) {
    delete cart.value[id]
  } else {
    cart.value[id]--
  }
}

const signOut = async () => {
  await logout()
}

const goToLogin = () => {
  router.push('/login-cliente')
}

const placeOrder = () => {
  if (authState.value.status !== 'authenticated') {
    goToLogin()
    return
  }

  // El flujo de checkout se agregará aquí cuando esté disponible.
}
</script>

<template>
  <main class="min-h-screen bg-neutral-100 pb-28 text-secondary-800">
    <header class="sticky top-0 z-20 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:gap-4 sm:px-8 sm:py-4">
        <img src="@/assets/mandys_text.svg" alt="Mandy's" class="h-9 w-28 shrink-0 object-contain object-left" />
        <div class="hidden items-center gap-2 text-xs text-secondary-500 lg:flex">
          <span class="rounded-full bg-primary-50 px-3 py-1 font-semibold text-primary-700">Entrega a domicilio</span>
          <span>Tiempo estimado: 25-35 min</span>
        </div>
        <label class="relative order-3 min-w-0 basis-full sm:order-none sm:ml-auto sm:w-full sm:basis-auto sm:max-w-xs">
          <Search :size="17" class="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
          <input v-model="search" type="search" placeholder="Buscar en el menú" class="field-control field-control-ok h-10 pl-9 pr-3 text-xs" />
        </label>
        <div class="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
          <button v-if="authState.status !== 'authenticated'" type="button" class="flex items-center gap-2 rounded-xl bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700" @click="goToLogin">
            <LogIn :size="15" /> <span class="hidden sm:inline">Iniciar sesión</span><span class="sm:hidden">Acceder</span>
          </button>
          <template v-else>
            <span class="hidden text-xs font-semibold text-secondary-700 sm:inline">Bienvenido, {{ authState.user?.firstName }}</span>
            <button type="button" class="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-secondary-700 hover:border-primary-300" @click="signOut">
              <LogOut :size="15" /> <span class="hidden sm:inline">Salir</span>
            </button>
          </template>
        </div>
      </div>
      <nav class="menu-categories mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-8">
        <button v-for="category in ['Todos', 'Más pedido', 'Especialidad', 'Para compartir']" :key="category" type="button" class="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors" :class="selectedCategory === category ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-secondary-600 hover:bg-primary-50 hover:text-primary-700'" @click="selectedCategory = category">
          {{ category }}
        </button>
      </nav>
    </header>

    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <div v-if="loadError" class="mb-8 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        <span>{{ loadError }}</span>
        <button type="button" class="font-bold underline" @click="loadMenu">Reintentar</button>
      </div>
      <div v-if="loading" class="rounded-2xl border border-neutral-200 bg-neutral-50 p-10 text-center text-sm text-secondary-500">
        Cargando menú...
      </div>

      <template v-else>
      <section class="mb-10">
        <div class="mb-5 flex items-end justify-between gap-4">
          <div>
            <p class="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Elige tus favoritos</p>
            <h1 class="text-3xl font-bold tracking-tight text-secondary-900 sm:text-4xl">Combos</h1>
            <p class="mt-2 text-sm text-secondary-600">Paquetes preparados para disfrutar más por menos.</p>
          </div>
          <ShoppingBag :size="30" class="hidden text-primary-600 sm:block" />
        </div>
        <div v-if="combos.length" class="menu-carousel flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-3 touch-pan-x" role="region" aria-label="Carrusel de combos">
          <article v-for="combo in combos" :key="combo.id" class="w-[85%] shrink-0 snap-start overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:w-[45%] lg:w-[31%]">
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
        <div v-if="filteredDishes.length" class="menu-carousel flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-3 touch-pan-x" role="region" aria-label="Carrusel de platillos">
          <article v-for="dish in filteredDishes" :key="dish.id" class="w-[85%] shrink-0 snap-start overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm sm:w-[45%] lg:w-[23%]">
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
        <p v-else class="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-secondary-500">No encontramos platillos con esa búsqueda.</p>
      </section>

      <section v-if="products.length" class="mt-10">
        <div class="mb-5 flex items-end justify-between gap-4">
          <div>
            <p class="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Para complementar</p>
            <h2 class="text-3xl font-bold tracking-tight text-secondary-900">Productos</h2>
          </div>
          <ShoppingBag :size="30" class="hidden text-primary-600 sm:block" />
        </div>
        <div class="menu-carousel flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-3 touch-pan-x" role="region" aria-label="Carrusel de productos">
          <article v-for="product in products" :key="product.id" class="w-[85%] shrink-0 snap-start overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm sm:w-[45%] lg:w-[23%]">
            <div class="flex h-32 items-center justify-center" :class="product.color">
              <ShoppingBag :size="52" class="text-primary-600/70" />
            </div>
            <div class="p-4">
              <span class="text-[10px] font-bold uppercase tracking-wide text-primary-600">{{ product.tag }}</span>
              <h3 class="mt-2 font-bold text-secondary-900">{{ product.name }}</h3>
              <p class="mt-1 min-h-10 text-xs leading-relaxed text-secondary-600">{{ product.description }}</p>
              <div class="mt-4 flex items-center justify-between">
                <strong class="text-lg text-primary-700">${{ product.price }} <small class="text-[10px] font-medium">MXN</small></strong>
                <button type="button" class="rounded-xl bg-primary-600 p-2 text-white hover:bg-primary-700" :aria-label="`Agregar ${product.name}`" @click="addToCart(product.id)"><Plus :size="17" /></button>
              </div>
              <div v-if="cart[product.id]" class="mt-3 flex items-center justify-between rounded-lg bg-neutral-100 px-2 py-1 text-xs">
                <button type="button" aria-label="Quitar unidad" @click="removeFromCart(product.id)"><Minus :size="14" /></button>
                <span>{{ cart[product.id] }} en tu pedido</span>
                <button type="button" aria-label="Agregar unidad" @click="addToCart(product.id)"><Plus :size="14" /></button>
              </div>
            </div>
          </article>
        </div>
      </section>
      </template>
    </div>

    <aside v-if="totalItems" class="fixed bottom-5 left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-between gap-4 rounded-2xl bg-secondary-900 px-4 py-3 text-white shadow-2xl sm:px-6">
      <div class="flex items-center gap-3">
        <span class="rounded-xl bg-primary-600 p-2"><ShoppingBag :size="18" /></span>
        <div><p class="text-xs font-semibold">{{ totalItems }} {{ totalItems === 1 ? 'producto' : 'productos' }}</p><p class="text-[10px] text-neutral-300">Tu pedido Mandy's</p></div>
      </div>
      <strong class="text-sm">${{ totalPrice.toFixed(2) }} MXN</strong>
      <button type="button" class="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold hover:bg-primary-700" @click="placeOrder">
        {{ authState.status === 'authenticated' ? 'Ver pedido' : 'Iniciar sesión' }}
      </button>
    </aside>
  </main>
</template>

<style scoped>
.menu-categories,
.menu-carousel {
  scrollbar-width: none;
}

.menu-categories::-webkit-scrollbar,
.menu-carousel::-webkit-scrollbar {
  display: none;
}
</style>
