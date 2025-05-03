"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, loginUser, registerUser, logoutUser, getCurrentUser, refreshTokens, RegisterRequest, getWebSocketTicket, updateProfile, getCSRFToken } from '../api/auth';
import { ApiError } from '../api/http-client';

// Интерфейс контекста аутентификации
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  csrfToken: string | null;
  fetchWsTicket: () => Promise<string | null>;
  updateUserProfile: (data: { username?: string; profile_picture?: string }) => Promise<void>;
}

// Создаем контекст
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер контекста
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Эффект для первоначальной проверки аутентификации
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
        try {
          const token = await getCSRFToken();
          setCsrfToken(token);
          console.log("[AuthContext] CSRF token fetched successfully:", token);
        } catch (_err) {
          console.error("[AuthContext] Failed to fetch CSRF token:", _err);
          setError('Не удалось получить токен безопасности сессии. Функциональность может быть ограничена.');
          setCsrfToken(null);
        }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_err) {
        setUser(null);
        setIsAuthenticated(false);
        setCsrfToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Функция для входа
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await loginUser(email, password);
      console.log("[AuthContext] Login successful, response received:", response);
      setUser(response.user);
      setIsAuthenticated(true);
      try {
        const token = await getCSRFToken();
        setCsrfToken(token);
        console.log("[AuthContext] CSRF token fetched successfully after login:", token);
      } catch (csrfError) {
        console.error("[AuthContext] Failed to fetch CSRF token after login:", csrfError);
        setError('Вход выполнен, но не удалось получить токен безопасности сессии.');
        setCsrfToken(null);
      }
    } catch (err) {
      console.error("[AuthContext] Login error:", err);
      setError((err as ApiError).error || 'Ошибка входа в систему');
      setUser(null);
      setIsAuthenticated(false);
      setCsrfToken(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Функция для регистрации
  const register = async (data: RegisterRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await registerUser(data);
      setUser(response.user);
      setIsAuthenticated(true);
      
      try {
        const token = await getCSRFToken();
        setCsrfToken(token);
        console.log("[AuthContext] CSRF token fetched successfully after registration:", token);
      } catch (csrfError) {
        console.error("[AuthContext] Failed to fetch CSRF token after registration:", csrfError);
        setError('Регистрация выполнена, но не удалось получить токен безопасности сессии.');
        setCsrfToken(null);
      }
    } catch (err) {
      setError((err as ApiError).error || 'Ошибка регистрации');
      setUser(null);
      setIsAuthenticated(false);
      setCsrfToken(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Функция для выхода
  const logout = async () => {
    console.log("[AuthContext] Logout initiated. Current csrfToken state:", csrfToken);
    try {
      setLoading(true);
      setError(null);
      await logoutUser(csrfToken);
      
      setUser(null);
      setIsAuthenticated(false);
      setCsrfToken(null);
    } catch (err) {
      console.error("[AuthContext] Logout API call error:", err);
      setUser(null);
      setIsAuthenticated(false);
      setCsrfToken(null);
      setError('Не удалось выйти из системы на сервере, но сессия завершена локально.');
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Функция для обновления токенов
  const refresh = async () => {
    if (!csrfToken) {
      setError('Сессия недействительна, CSRF токен отсутствует. Пожалуйста, войдите снова.');
      setUser(null);
      setIsAuthenticated(false);
      setCsrfToken(null);
      throw new Error('CSRF token is missing, cannot refresh session.');
    }
    try {
      setLoading(true);
      setError(null);
      const response = await refreshTokens(csrfToken);
      
      setCsrfToken(response.csrfToken);
      const userData = await getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      setError((err as ApiError).error || 'Ошибка обновления сессии. Пожалуйста, войдите снова.');
      setUser(null);
      setIsAuthenticated(false);
      setCsrfToken(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Функция для очистки ошибок
  const clearError = () => {
    setError(null);
  };

  // Пример функции, использующей csrfToken
  const fetchWsTicket = async (): Promise<string | null> => {
    if (!isAuthenticated || !csrfToken) {
      setError("Необходимо войти в систему для получения WS тикета.");
      return null;
    }
    try {
      setLoading(true);
      setError(null);
      const ticket = await getWebSocketTicket(csrfToken);
      return ticket;
    } catch (err) {
      setError((err as ApiError).error || 'Ошибка получения WS тикета');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Пример функции обновления профиля
  const updateUserProfile = async (data: { username?: string; profile_picture?: string }) => {
    if (!isAuthenticated || !csrfToken) {
      setError("Необходимо войти в систему для обновления профиля.");
      throw new Error('User not authenticated or CSRF token missing');
    }
    try {
      setLoading(true);
      setError(null);
      await updateProfile(csrfToken, data);
      if (user) {
        setUser({ ...user, ...data });
      }
    } catch (err) {
      setError((err as ApiError).error || 'Ошибка обновления профиля');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refresh,
    clearError,
    isAuthenticated,
    csrfToken,
    fetchWsTicket,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Хук для использования контекста аутентификации
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 