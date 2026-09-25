import { createRouter, createWebHistory } from 'vue-router'

import CatalogoView from '@/views/CatalogoView.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'Inicio',
            component: CatalogoView
        }
    ]
})

export default router