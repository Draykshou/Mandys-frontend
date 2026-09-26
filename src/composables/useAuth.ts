import { api } from "@/lib/api-client";
import { readonly, ref, type Ref } from "vue";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "Admin" | "User";
}

type AuthState =
  | {
      status: "loading";
      user: null;
    }
  | {
      status: "unauthenticated";
      user: null;
    }
  | {
      status: "authenticated";
      user: AuthUser;
    };

const authState: Ref<AuthState> = ref({
  status: "loading",
  user: null,
});

// Dedupes concurrent calls from the router guard + components.
let loadPromise: Promise<void> | null = null;

const loadUser = async () => {
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        // 401s transparently try POST /refresh once via the api-client
        // interceptor before reaching here.
        const response = await api.get<AuthUser>("/users/me");
        authState.value = {
          user: response.data,
          status: "authenticated",
        };
      } catch {
        authState.value = {
          user: null,
          status: "unauthenticated",
        };
      } finally {
        loadPromise = null;
      }
    })();
  }
  return loadPromise;
};

export default function useAuth() {
  const login = async (payload: LoginCredentials) => {
    await api.post("/login", payload);

    await loadUser();

    if (authState.value.status !== "authenticated") {
      throw new Error("Login succeeded but loading the user profile failed.");
    }
  };

  const logout = async () => {
    // Only the server can delete the HttpOnly cookies. No body: the
    // refresh token comes from the cookie + XSRF double-submit header
    // that axios sends automatically.
    try {
      await api.post("/logout");
    } catch {
      // Server logout failed; local state is cleared anyway below.
      // (401 here goes through POST /refresh first via the interceptor,
      // so an expired access_token still logs out when possible.)
    } finally {
      authState.value = {
        user: null,
        status: "unauthenticated",
      };
    }
  };

  return {
    loadUser,
    state: readonly(authState),
    login,
    logout,
  };
}