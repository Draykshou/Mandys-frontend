import type { AuthUser } from '@/composables/useAuth'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    roles?: AuthUser['role'][]
  }
}