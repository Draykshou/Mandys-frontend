import { createRouter, createWebHistory } from 'vue-router'

import CatalogoView from '@/views/CatalogoView.vue'
import ProductCatalogView from '@/views/ProductsCatalogView.vue'
import AppLayout from '@/components/Layouts/AppLayout.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'Inicio',
            component: CatalogoView
        },
        {
            path: '/app',
            component: AppLayout,
            children: [
                {
                    path: '/productos',
                    name: 'productos',
                    component: CatalogoView
                }
            ]
            
        }
    ]
})

export default router