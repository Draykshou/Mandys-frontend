import { createApp } from "vue";
import "@/style.css";
import App from "@/App.vue";
import { createRouter, createWebHistory } from "vue-router";
import { routes } from "vue-router/auto-routes";
import useAuth from "./composables/useAuth";
import { setSessionExpiredHandler } from "./lib/api-client";

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const { state, loadUser } = useAuth();

  // El menú es público: no debe bloquearse por una sesión ausente
  // ni provocar una llamada innecesaria a /users/me.
  if (to.path === "/menu") {
    return true;
  }

  // Primera carga: esperar a saber si hay sesión
  if (state.value.status === "loading") await loadUser();

  const { status, user } = state.value;
  const isAuth = status === "authenticated";

  if (isAuth && user.role === "Cliente" && to.path.startsWith("/catalogs")) {
    return { path: "/menu", replace: true };
  }

  if (to.meta.public) {
    // Ya esta logueado
    return isAuth && to.path === "/login"
      ? { path: user.role === "Cliente" ? "/menu" : "/catalogs/home", replace: true }
      : true;
  }

  if (!isAuth) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  if (to.meta.roles && !to.meta.roles.includes(user.role)) {
    return { path: user.role === "Cliente" ? "/menu" : "/catalogs/home" };
  }

  return true;
});

setSessionExpiredHandler(() => {
  const { state, clearSession } = useAuth()
  const estabaAutenticado = state.value.status === 'authenticated'

  clearSession()

  if (estabaAutenticado) {
    router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath },
    })
  }
})


const app = createApp(App);
app.use(router);
app.mount("#app");