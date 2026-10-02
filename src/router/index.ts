import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '@/views/LoginView.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'Inicio',
            component: LoginView
        },
        {
            path: '/productos',
            name: 'productos',
            component: LoginView
        }
    ]
})

export default router
