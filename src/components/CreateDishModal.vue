<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { createDish } from '@/service/DishesService'
import { getProducts } from '@/service/ProductsService'
import type { Product } from '@/types/ProductsDtos'
import { X, Plus, Trash2, BookOpen, AlertCircle, CheckCircle, Info, ChefHat, DollarSign, Loader2 } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const name = ref('')
const price = ref<number | null>(null)
const recipe = ref<Array<{ productId: string; quantity: number | null }>>([])
const availableProducts = ref<Product[]>([])
const loadingProducts = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const nameError = ref('')
const priceError = ref('')
const recipeErrors = ref<Record<number, { productId?: string; quantity?: string }>>({})

const loadProducts = async () => {
  try {
    loadingProducts.value = true
    const res = await getProducts()
    console.log('[CreateDishModal] getProducts raw response:', res)
    console.log('[CreateDishModal] items:', res.items)
    availableProducts.value = res.items || []
    console.log('[CreateDishModal] availableProducts length:', availableProducts.value.length)
  } catch (err) {
    console.error('[CreateDishModal] Error al cargar productos:', err)
  } finally {
    loadingProducts.value = false
  }
}

onMounted(loadProducts)

const isProductUsed = (productId: string, rowIndex: number) =>
  recipe.value.some((r, i) => i !== rowIndex && r.productId === productId)

const addIngredient = async () => {
  recipe.value.push({ productId: '', quantity: null })
  await nextTick()
  const container = document.querySelector('[data-recipe-list]')
  container?.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
}

const removeIngredient = (index: number) => {
  recipe.value.splice(index, 1)
  delete recipeErrors.value[index]
}

const validate = (): boolean => {
  let valid = true

  if (!name.value.trim()) {
    nameError.value = 'El nombre del platillo es obligatorio.'
    valid = false
  } else if (name.value.trim().length > 50) {
    nameError.value = 'Máximo 50 caracteres.'
    valid = false
  } else {
    nameError.value = ''
  }

  if (price.value === null || String(price.value) === '') {
    priceError.value = 'El precio de venta es obligatorio.'
    valid = false
  } else if (Number(price.value) < 0) {
    priceError.value = 'El precio no puede ser negativo.'
    valid = false
  } else {
    priceError.value = ''
  }

  recipeErrors.value = {}
  recipe.value.forEach((item, i) => {
    const rowErr: { productId?: string; quantity?: string } = {}
    if (!item.productId) { rowErr.productId = 'Selecciona un insumo.'; valid = false }
    if (!item.quantity || Number(item.quantity) <= 0) { rowErr.quantity = 'Cantidad > 0.'; valid = false }
    if (Object.keys(rowErr).length) recipeErrors.value[i] = rowErr
  })

  return valid
}

const handleSave = async () => {
  if (!validate()) return
  errorMsg.value = ''
  successMsg.value = ''
  saving.value = true

  const payload = {
    name: name.value.trim(),
    price: Number(price.value),
    recipe: recipe.value
      .filter(r => r.productId && Number(r.quantity) > 0)
      .map(r => ({ productId: Number(r.productId), quantity: Number(r.quantity) })),
  }

  try {
    await createDish(payload)
    successMsg.value = '¡Platillo guardado exitosamente!'
    setTimeout(() => { emit('saved'); emit('close') }, 1800)
  } catch (err: any) {
    const serverMsg = err?.response?.data?.message
    errorMsg.value = serverMsg ? `Error: ${serverMsg}` : 'Error al guardar el platillo. Intenta de nuevo.'
  } finally {
    saving.value = false
  }
}

const handleCancel = () => { if (!saving.value) emit('close') }
const charsLeft = computed(() => 50 - name.value.length)
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
      @click.self="handleCancel"
    >

      <div class="dish-modal bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" style="max-height: 92vh;">


        <div class="flex items-start justify-between px-8 py-6 border-b border-neutral-100">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style="background: #fff0eb;">
              <ChefHat class="w-6 h-6" style="color: #c04a33;" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-neutral-900 tracking-tight">Nuevo Platillo</h2>
              <p class="text-sm text-neutral-500 mt-0.5">Registra los datos y la receta del platillo.</p>
            </div>
          </div>
          <button @click="handleCancel" :disabled="saving" class="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all" aria-label="Cerrar">
            <X :size="22" stroke-width="2" />
          </button>
        </div>

        <div class="px-8 py-6 overflow-y-auto flex-1">


          <Transition name="fade-slide">
            <div v-if="errorMsg" class="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle :size="18" class="text-red-500 mt-0.5 shrink-0" />
              <span>{{ errorMsg }}</span>
            </div>
          </Transition>
          <Transition name="fade-slide">
            <div v-if="successMsg" class="mb-5 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-start gap-3 text-sm">
              <CheckCircle :size="18" class="text-green-500 mt-0.5 shrink-0" />
              <span>{{ successMsg }}</span>
            </div>
          </Transition>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                Nombre del platillo <span class="text-red-500">*</span>
              </label>
              <input
                v-model="name"
                type="text"
                maxlength="50"
                placeholder="Ej. Tacos de Rib Eye con Tuétano"
                class="w-full px-4 py-3 border rounded-xl text-sm text-neutral-800 placeholder-neutral-300 font-medium transition-all focus:outline-none focus:ring-2"
                :class="nameError ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-neutral-200 bg-neutral-50 focus:ring-[#c04a33]/30 focus:border-[#c04a33]'"
              />
              <div class="flex justify-between items-center mt-1.5 min-h-[20px]">
                <span v-if="nameError" class="text-xs text-red-500 font-medium">{{ nameError }}</span>
                <span v-else class="text-xs text-neutral-400">{{ name.length }}/50 caracteres</span>
                <span v-if="!nameError" class="text-xs font-semibold tabular-nums" :class="charsLeft <= 10 ? 'text-orange-500' : 'text-neutral-300'">
                  {{ charsLeft }} restantes
                </span>
              </div>
            </div>


            <div>
              <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                Precio de venta (MXN) <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <DollarSign :size="16" class="text-neutral-400" />
                </div>
                <input
                  v-model="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="w-full pl-10 pr-4 py-3 border rounded-xl text-sm text-neutral-800 font-medium transition-all focus:outline-none focus:ring-2"
                  :class="priceError ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-neutral-200 bg-neutral-50 focus:ring-[#c04a33]/30 focus:border-[#c04a33]'"
                />
              </div>
              <p v-if="priceError" class="mt-1.5 text-xs text-red-500 font-medium">{{ priceError }}</p>
            </div>
          </div>


          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="text-xs font-bold text-neutral-600 uppercase tracking-wider">Receta / Insumos</label>
              <span class="text-xs text-neutral-400">Opcional</span>
            </div>

            <div class="border border-neutral-200 rounded-2xl overflow-hidden">

              <div v-if="recipe.length === 0" class="py-10 px-6 text-center bg-neutral-50">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style="background: #fff0eb;">
                  <BookOpen :size="22" style="color: #c04a33;" />
                </div>
                <p class="text-sm font-semibold text-neutral-700 mb-1">Sin ingredientes configurados</p>
                <p class="text-xs text-neutral-400 mb-5 leading-relaxed">Agrega insumos para deducir inventario automáticamente al timbrar.</p>
                <button type="button" @click="addIngredient" class="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-200 bg-white rounded-xl text-sm font-semibold text-neutral-700 hover:border-[#c04a33] hover:text-[#c04a33] transition-all shadow-sm">
                  <Plus :size="16" style="color: #c04a33;" /> Agregar ingrediente
                </button>
              </div>


              <div v-else>
                <div class="grid gap-3 px-4 py-3 bg-neutral-100 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase tracking-wider" style="grid-template-columns: 1fr 7rem 2.5rem;">
                  <span>Insumo / Producto</span>
                  <span class="text-center">Cantidad</span>
                  <span></span>
                </div>

                <div data-recipe-list class="divide-y divide-neutral-100 max-h-64 overflow-y-auto">
                  <TransitionGroup name="list">
                    <div v-for="(item, index) in recipe" :key="index" class="grid items-start gap-3 px-4 py-3" style="grid-template-columns: 1fr 7rem 2.5rem;">
                      <div>
                        <select
                          v-model="item.productId"
                          class="w-full px-3 py-2.5 border rounded-xl text-sm text-neutral-800 font-medium transition-all focus:outline-none focus:ring-2 cursor-pointer"
                          :class="recipeErrors[index]?.productId ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-neutral-200 bg-neutral-50 focus:ring-[#c04a33]/30 focus:border-[#c04a33]'"
                        >
                          <option value="" disabled>{{ loadingProducts ? 'Cargando...' : 'Seleccionar insumo...' }}</option>
                          <option v-for="prod in availableProducts" :key="prod.id" :value="prod.id" :disabled="isProductUsed(prod.id, index)">
                            {{ prod.description }}{{ isProductUsed(prod.id, index) ? ' (ya agregado)' : '' }}
                          </option>
                        </select>
                        <p v-if="recipeErrors[index]?.productId" class="mt-1 text-xs text-red-500">{{ recipeErrors[index].productId }}</p>
                      </div>

                      <div>
                        <input
                          v-model="item.quantity"
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0"
                          class="w-full px-3 py-2.5 border rounded-xl text-sm text-neutral-800 font-medium text-center transition-all focus:outline-none focus:ring-2"
                          :class="recipeErrors[index]?.quantity ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-neutral-200 bg-neutral-50 focus:ring-[#c04a33]/30 focus:border-[#c04a33]'"
                        />
                        <p v-if="recipeErrors[index]?.quantity" class="mt-1 text-xs text-red-500 text-center">{{ recipeErrors[index].quantity }}</p>
                      </div>

                      <button type="button" @click="removeIngredient(index)" class="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Quitar">
                        <Trash2 :size="17" />
                      </button>
                    </div>
                  </TransitionGroup>
                </div>

                <div class="px-4 py-3 border-t border-neutral-100 bg-neutral-50">
                  <button type="button" @click="addIngredient" class="text-sm font-semibold flex items-center gap-1.5 transition-colors" style="color: #c04a33;">
                    <Plus :size="16" stroke-width="2.5" /> Agregar otro ingrediente
                  </button>
                </div>
              </div>
            </div>
          </div>


          <div class="mt-5 p-4 rounded-xl flex items-start gap-3 text-xs text-neutral-500" style="background: #faf9f6; border: 1px solid #ede9e1;">
            <Info :size="16" class="shrink-0 mt-0.5" style="color: #c04a33;" />
            <p>Al guardar, el platillo estará disponible de inmediato en las terminales. La receta se usa para deducir inventario automáticamente.</p>
          </div>
        </div>


        <div class="flex items-center justify-between gap-3 px-8 py-5 border-t border-neutral-100 bg-neutral-50 rounded-b-3xl">
          <button type="button" @click="handleCancel" :disabled="saving" class="px-6 py-3 bg-white border border-neutral-200 text-neutral-700 font-semibold rounded-xl text-sm hover:bg-neutral-100 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" @click="handleSave" :disabled="saving || !!successMsg" class="px-8 py-3 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed" style="background: #c04a33;">
            <Loader2 v-if="saving" :size="18" class="animate-spin" />
            <CheckCircle v-else-if="successMsg" :size="18" />
            <ChefHat v-else :size="18" />
            <span>{{ saving ? 'Guardando...' : successMsg ? '¡Guardado!' : 'Guardar platillo' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dish-modal {
  animation: modalIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.93) translateY(16px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-8px); }
.list-enter-active, .list-leave-active { transition: all 0.25s ease; }
.list-enter-from { opacity: 0; transform: translateX(-12px); }
.list-leave-to { opacity: 0; transform: translateX(12px); }
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; }
input[type='number'] { -moz-appearance: textfield; }
</style>
