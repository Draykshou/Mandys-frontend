import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  adapter: "fetch",
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Single shared refresh so concurrent 401s only hit POST /refresh once.
let refreshPromise: Promise<void> | null = null;

function doRefresh(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api.post("/refresh", {}, {
      headers: { "Content-Type": "application/json" }
    }).then(() => undefined).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  // /login never has valid cookies by definition; /refresh retrying
  // itself would loop forever. /logout IS retried: its access_token
  // may be expired while the refresh_token is still valid.
  return url.includes("/login") || url.includes("/refresh");
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    if (!original || !error.response) {
      return Promise.reject(error);
    }

    if (status !== 401 || original._retry || isAuthEndpoint(original.url)) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      await doRefresh();
    } catch (refreshError) {
      // Refresh token expired/revoked: caller (e.g. loadUser) sees the
      // refresh failure and transitions to unauthenticated.
      return Promise.reject(refreshError);
    }

    return api(original);
  },
);