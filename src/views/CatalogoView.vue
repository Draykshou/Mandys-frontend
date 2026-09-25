<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import type { CatalogColumn, CatalogRow, SidebarItem } from '@/catalog'

/* -------------------------------------------------------
   1. Definición de cada catálogo: sus columnas y sus filas.
   Esto es lo ÚNICO que cambia entre Productos, Platillos, etc.
------------------------------------------------------- */
interface CatalogoDef {
  titulo: string
  subtitulo: string
  textoBoton: string
  categorias: string[]
  columns: CatalogColumn[]
  rows: CatalogRow[]
}

const productos: CatalogoDef = {
  titulo: 'Productos',
  subtitulo: 'Control y administración del inventario de productos de la sucursal.',
  textoBoton: 'Agregar Producto',
  categorias: ['Todas las categorías', 'Bebidas', 'Insumos', 'Lácteos'],
  columns: [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'insumo', label: 'Insumo', type: 'boolean' },
    { key: 'precio', label: 'Precio', type: 'text', emptyLabel: '(Sin valor)' },
    { key: 'unidad', label: 'Unidad de medida', type: 'text' },
  ],
  rows: [
    { id: 1001, descripcion: "Refresco Cola Mandy's 355ml", insumo: false, precio: '$35.00', unidad: 'Pieza (Pcs)' },
    { id: 1002, descripcion: 'Cerveza Artesanal Clara', insumo: false, precio: '$65.00', unidad: 'Botella (355ml)' },
    { id: 1003, descripcion: 'Tomate Saladette Fresco', insumo: true, precio: null, unidad: 'Kilogramo (Kg)' },
    { id: 1004, descripcion: 'Carne de Res Molida 80/20', insumo: true, precio: null, unidad: 'Kilogramo (Kg)' },
    { id: 1005, descripcion: 'Agua Mineral Embotellada', insumo: false, precio: '$28.00', unidad: 'Pieza (Pcs)' },
    { id: 1006, descripcion: 'Crema para Batir 35%', insumo: true, precio: null, unidad: 'Litro (L)' },
    { id: 1006, descripcion: 'Crema para Batir 55%', insumo: true, precio: null, unidad: 'Litro (L)' },
    { id: 1001, descripcion: "Refresco Cola Mandy's 355ml", insumo: false, precio: '$35.00', unidad: 'Pieza (Pcs)' },
    { id: 1002, descripcion: 'Cerveza Artesanal Clara', insumo: false, precio: '$65.00', unidad: 'Botella (355ml)' },
    { id: 1003, descripcion: 'Tomate Saladette Fresco', insumo: true, precio: null, unidad: 'Kilogramo (Kg)' },
    { id: 1004, descripcion: 'Carne de Res Molida 80/20', insumo: true, precio: null, unidad: 'Kilogramo (Kg)' },
    { id: 1005, descripcion: 'Agua Mineral Embotellada', insumo: false, precio: '$28.00', unidad: 'Pieza (Pcs)' },
    { id: 1006, descripcion: 'Crema para Batir 35%', insumo: true, precio: null, unidad: 'Litro (L)' },
    { id: 1006, descripcion: 'Crema para Batir 55%', insumo: true, precio: null, unidad: 'Litro (L)' },
  ],
}

const platillos: CatalogoDef = {
  titulo: 'Platillos',
  subtitulo: 'Administra el menú y las recetas de cada platillo.',
  textoBoton:'Agregar Platillo',
  categorias: ['Todas las categorías', 'Entradas', 'Fuertes', 'Postres'],
  columns: [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'precio', label: 'Precio', type: 'text' },
    { key: 'receta', label: 'Receta', type: 'button', buttonLabel: 'Ver receta', buttonVariant: 'outlined' },
  ],
  rows: [
    { id: 2001, nombre: 'Tacos de Carne Asada (orden)', precio: '$95.00' },
    { id: 2002, nombre: 'Alambre de Res', precio: '$120.00' },
    { id: 2003, nombre: 'Quesadilla de Flor de Calabaza', precio: '$78.00' },
  ],
}

const catalogos: Record<string, CatalogoDef> = { productos, platillos }

/* -------------------------------------------------------
   2. Estado de navegación / catálogo activo
------------------------------------------------------- */
const sidebarItems: SidebarItem[] = [
  { key: 'productos', label: 'Productos', icon: 'box', count: 24 },
  { key: 'platillos', label: 'Platillos', icon: 'book', count: 12 },
  { key: 'combo', label: 'Combo', icon: 'bag' },
  { key: 'almacen', label: 'Almacén', icon: 'archive' },
]

const catalogoActivo = ref<'productos' | 'platillos'>('productos')

const catalogoActual = computed(() => catalogos[catalogoActivo.value] ?? productos)

function seleccionarCatalogo(key: string) {
  if (key in catalogos) {
    catalogoActivo.value = key as 'productos' | 'platillos'
    filtro.busqueda = ''
    filtro.categoria = catalogoActual.value.categorias[0]
    pagina.value = 1
  }
}

/* -------------------------------------------------------
   3. Estado de filtro y paginación (genérico, aplica a
   cualquier catálogo activo)
------------------------------------------------------- */
const filtro = reactive({
  busqueda: '',
  categoria: productos.categorias[0],
})

const pagina = ref(1)
const totalPaginas = 3 // vendría del backend según el catálogo activo

function limpiarFiltro() {
  filtro.busqueda = ''
  filtro.categoria = catalogoActual.value.categorias[0]
}

function buscar() {
  // Aquí se llamaría al backend con filtro.busqueda / filtro.categoria
  console.log('Buscando en', catalogoActivo.value, filtro)
}

/* -------------------------------------------------------
   4. Handlers de la tabla (editar / eliminar / acción / exportar)
------------------------------------------------------- */
function editarFila(row: CatalogRow) {
  console.log('Editar', catalogoActivo.value, row)
}

function eliminarFila(row: CatalogRow) {
  console.log('Eliminar', catalogoActivo.value, row)
}

function manejarAccion(payload: { columnKey: string; row: CatalogRow }) {
  // Ej. columnKey === 'receta' -> abrir modal con la receta del platillo
  console.log('Acción', payload.columnKey, payload.row)
}

function exportar() {
  console.log('Exportar Excel de', catalogoActivo.value)
}
</script>

<template>
  <div class="flex h-screen flex-col bg-neutral-100 text-secondary-800">
    <AppHeader />
    
    <div class="flex flex-1 overflow-hidden">
      <AppSidebar 
        :items="sidebarItems" 
        :active-key="catalogoActivo" 
        :usuario="{ nombre: 'Carlos Medina', rol: 'Gerente de operaciones' }"
        @seleccionar="seleccionarCatalogo" 
      />

      <div class="flex flex-1 flex-col overflow-hidden">
        <main class="flex-1 overflow-y-auto px-8 py-8">
          <CatalogHeader
            :titulo="catalogoActual.titulo"
            :subtitulo="catalogoActual.subtitulo"
            :texto-boton="catalogoActual.textoBoton"
            @agregar="() => console.log('Agregar en', catalogoActivo)"
          />

          <CatalogFilter
            v-model:busqueda="filtro.busqueda"
            v-model:categoria="filtro.categoria"
            :categorias="catalogoActual.categorias"
            @buscar="buscar"
            @limpiar="limpiarFiltro"
          />

          <CatalogTable
            :titulo="catalogoActual.titulo"
            :columns="catalogoActual.columns"
            :rows="catalogoActual.rows"
            :total-registros="catalogoActual.rows.length"
            :pagina="pagina"
            :total-paginas="totalPaginas"
            @editar="editarFila"
            @eliminar="eliminarFila"
            @accion="manejarAccion"
            @exportar="exportar"
            @cambiar-pagina="(p) => (pagina = p)"
          />
        </main>
      </div>
    </div>
  </div>
</template>
