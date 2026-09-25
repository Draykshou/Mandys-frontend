import { createRouter, createWebHistory } from 'vue-router'

import CatalogoView from '@/views/CatalogoView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'Inicio',
            component: CatalogoView
        },
        {
            path: '/login',
            name: 'Login',
            component: LoginView
        }
    ]
})

export default router