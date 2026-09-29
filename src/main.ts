import { createApp } from "vue";
import "@/style.css";
import App from "@/App.vue";
import { createRouter, createWebHistory } from "vue-router";
import { routes, handleHotUpdate } from "vue-router/auto-routes";
import useAuth from "@/composables/useAuth";

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

if (import.meta.hot) {
  handleHotUpdate(router);
}

const app = createApp(App);
app.use(router);
app.mount("#app");