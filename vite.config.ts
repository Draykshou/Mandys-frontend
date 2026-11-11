import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import VueRouter from "vue-router/vite";

// https://vite.dev/config/
export default defineConfig({
  // Ruta base configurable (p.ej. '/Mandys-frontend/' para GitHub Pages). Por defecto '/'.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [VueRouter(), vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: ['animejs']
  }
})
