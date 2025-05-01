import { httpClient } from './http-client';

// Интерфейс пользователя, получаемого с сервера
export interface User {
  id: number;
  username: string;
  email: string;
  profile_picture: string | null;
  games_played: number;
  total_score: number;
  highest_score: number;
}

// Интерфейс для ответа аутентификации
export interface AuthResponse {
  user: User;
  accessToken: string; // Добавлено для информации (токен в cookie)
  tokenType: string;
  expiresIn: number;
  csrfToken: string; // Обновлено на camelCase
  userId: number;    // Обновлено на camelCase
}

// Интерфейс для запроса регистрации
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Интерфейс для запроса логина
export interface LoginRequest {
  email: string;
  password: string;
  device_id?: string;
}

// Интерфейс для информации о токене (старый, может быть не нужен)
export interface TokenInfo {
  user_id: number;
  username: string;
  email: string;
  is_admin: boolean;
  exp: number; // Время истечения токена
  csrf_token: string; // Старое поле
  access_token_expires: number;
  refresh_token_expires: number;
}

// Интерфейс для информации о сессии
export interface SessionInfo {
  id: number;
  device_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string; // Даты будут строками ISO
  expires_at: string;
}

// Интерфейс для ответа со списком сессий
export interface SessionsResponse {
  sessions: SessionInfo[];
  count: number;
}

// Интерфейс для ответа с WebSocket тикетом
export interface WsTicketResponse {
  success: boolean;
  data: {
    ticket: string;
  };
}

/**
 * Регистрирует нового пользователя
 *
 * @param data Данные для регистрации (username, email, password)
 * @returns Promise с данными пользователя и токенами
 * @throws ApiError в случае ошибки
 */
export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  return httpClient.post<AuthResponse, RegisterRequest>('/api/auth/register', data);
}

/**
 * Аутентифицирует пользователя
 *
 * @param email Email пользователя
 * @param password Пароль пользователя
 * @returns Promise с данными пользователя и CSRF хешем
 * @throws ApiError в случае ошибки
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return httpClient.post<AuthResponse, LoginRequest>('/api/auth/login', { email, password });
}

/**
 * Обновляет токены аутентификации
 * Используя HttpOnly refreshToken куки
 *
 * @param csrfToken CSRF-токен (хеш) для защиты от CSRF-атак
 * @returns Promise с новыми данными аутентификации (access токен и CSRF хеш)
 * @throws ApiError в случае ошибки
 */
export async function refreshTokens(csrfToken: string | null): Promise<Omit<AuthResponse, 'user'> | AuthResponse> {
  const headers: Record<string, string> = {};
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  } else {
    console.error("refreshTokens: CSRF Token не передан!");
    throw new Error("CSRF Token required for refresh");
  }
  const response = await httpClient.post<AuthResponse, undefined>('/api/auth/refresh', undefined, { headers });
  return response;
}

/**
 * Выход из системы (логаут)
 *
 * @param csrfToken CSRF-токен (хеш) для защиты
 * @returns Promise<void>
 * @throws ApiError в случае ошибки
 */
export async function logoutUser(csrfToken: string | null): Promise<void> {
  const headers: Record<string, string> = {};
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  } else {
    console.error("logoutUser: CSRF Token не передан!");
    throw new Error("CSRF Token required for logout");
  }
  await httpClient.post<void, undefined>('/api/auth/logout', undefined, { headers });
}

/**
 * Получает информацию о токене - ЭТОТ ЭНДПОИНТ, СКОРЕЕ ВСЕГО, УСТАРЕЛ
 *
 * @returns Promise с информацией о токене
 */
// export async function getTokenInfo(): Promise<TokenInfo> {
//   return request.get<TokenInfo>('/api/auth/token-info');
// }

/**
 * Получает текущего аутентифицированного пользователя
 *
 * @returns Promise с данными пользователя
 * @throws ApiError в случае ошибки
 */
export async function getCurrentUser(): Promise<User> {
  return httpClient.get<User>('/api/users/me');
}

/**
 * Проверяет, авторизован ли пользователь в настоящий момент
 *
 * @returns Promise<boolean> - true если пользователь авторизован
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch (_error) {
    console.error('Failed to check auth status:', _error);
    return false;
  }
}

/**
 * Получает специальный WebSocket тикет для подключения к WebSocket
 *
 * @param csrfToken CSRF-токен (хеш) для защиты
 * @returns Promise с WebSocket тикетом
 * @throws ApiError в случае ошибки
 */
export async function getWebSocketTicket(csrfToken: string | null): Promise<string> {
  const headers: Record<string, string> = {};
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  } else {
    console.error("getWebSocketTicket: CSRF Token не передан!");
    throw new Error("CSRF Token required for WebSocket ticket");
  }
  try {
    const response = await httpClient.post<WsTicketResponse, Record<string, never>>('/api/auth/ws-ticket', {}, { headers });
    return response.data.ticket;
  } catch (error) {
    console.error('Ошибка получения WebSocket тикета:', error);
    throw error;
  }
}

/**
 * Получает список активных сессий пользователя
 *
 * @returns Promise со списком сессий
 * @throws ApiError
 */
export async function getActiveSessions(): Promise<SessionsResponse> {
  return httpClient.get<SessionsResponse>('/api/auth/sessions');
}

// Добавить другие функции API при необходимости, передавая csrfToken для POST/PUT/DELETE/PATCH

/**
 * Пример обновления профиля с CSRF токеном
 */
interface UpdateProfileData {
  username?: string;
  profile_picture?: string;
}
export async function updateProfile(csrfToken: string | null, data: UpdateProfileData): Promise<void> {
  const headers: Record<string, string> = {};
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  } else {
    console.error("updateProfile: CSRF Token не передан!");
    throw new Error("CSRF Token required for profile update");
  }
  await httpClient.put<void, UpdateProfileData>('/api/users/me', data, { headers });
}

/**
 * Получает CSRF-токен (хеш) с бэкенда.
 * Вызывается после успешной аутентификации.
 *
 * @returns Promise с CSRF-токеном
 * @throws ApiError в случае ошибки
 */
export async function getCSRFToken(): Promise<string> {
  const response = await httpClient.get<{ csrf_token: string }>('/api/auth/csrf');
  if (!response || !response.csrf_token) {
    throw new Error('CSRF token not found in response from /api/auth/csrf');
  }
  return response.csrf_token;
} 