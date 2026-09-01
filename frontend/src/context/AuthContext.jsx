import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import apiClient from '../services/apiClient';
import * as authApi from '../services/authApi';

const AuthContext = createContext(null);
const TOKEN_KEY = 'vaultivo_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Keep the Axios instance's default header in sync with the current token.
  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      delete apiClient.defaults.headers.common.Authorization;
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  // On first load, if a token is already stored, validate it against /auth/me.
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A 401 from anywhere in the app (expired token mid-session) logs out cleanly.
  useEffect(() => {
    const id = apiClient.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401) {
          setToken(null);
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => apiClient.interceptors.response.eject(id);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setToken(data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    setToken(data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  const loginWithToken = useCallback(async (jwt) => {
    // Set the header directly here rather than relying on the useEffect
    // above — that effect runs after this async function has already moved
    // on to the me() call below, which would otherwise fire without auth.
    apiClient.defaults.headers.common.Authorization = `Bearer ${jwt}`;
    setToken(jwt);
    const profile = await authApi.me();
    setUser(profile);
  }, []);

  const logout = useCallback(() => {
    // Best-effort — this only records the LOGOUT activity server-side (JWTs
    // are stateless, nothing to actually invalidate). If it fails (offline,
    // token already expired), the user still logs out locally regardless.
    authApi.logout().catch(() => {});
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, loading, isAuthenticated: !!token, login, register, loginWithToken, logout, setUser }),
    [token, user, loading, login, register, loginWithToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
