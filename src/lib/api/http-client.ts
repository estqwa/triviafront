/**
 * Базовый HTTP клиент для работы с API
 * Настроен для отправки куки с каждым запросом
 */
// import { useAuth } from './auth/auth-context'; // УДАЛЕНО: Некорректный импорт

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'; // <-- Удаляем

// Типы HTTP методов
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Интерфейс для ошибок API
export interface ApiError {
  error: string;
  error_type?: string;
  status: number;
}

// Общие опции запроса
interface RequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

/**
 * Читает значение cookie по имени.
 * @param name Имя cookie
 * @returns Значение cookie или null, если не найдено
 */
// УДАЛЕНО: function getCookie(...) - не используется для CSRF

/**
 * Выполняет HTTP запрос к API
 * 
 * @param method HTTP метод
 * @param endpoint Эндпоинт API без базового URL
 * @param body Тело запроса (для POST, PUT, PATCH)
 * @param options Дополнительные опции запроса
 * @returns Promise с данными ответа
 * @throws ApiError в случае ошибки
 */
export async function request<T, B = unknown>(
  method: HttpMethod,
  endpoint: string, 
  body?: B,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = 'https://triviabackend-jp8r.onrender.com'; // Используем жестко заданный URL
  let url = `${baseUrl}${endpoint}`;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include', // Важно для отправки cookies
  };

  // Добавляем тело запроса, если оно есть и метод позволяет
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(body);
  }

  // Добавляем параметры запроса
  if (options.query) {
    const queryParams = new URLSearchParams(options.query).toString();
    if (queryParams) {
      url += `?${queryParams}`;
    }
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData: unknown; 
      try {
        errorData = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_jsonError) {
        errorData = { error: response.statusText, status: response.status };
      }
      
      // Проверка типа перед созданием ApiError
      if (typeof errorData === 'object' && errorData !== null && 'error' in errorData) {
          throw { ...(errorData as object), status: response.status } as ApiError;
      } else {
          throw { error: 'Unknown API error', status: response.status, originalData: errorData } as ApiError;
      }
    }

    // Обработка пустого ответа (например, для DELETE или статуса 204)
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return undefined as T; // Возвращаем undefined, приведенное к типу T
    }

    // Если ожидается JSON
    if (response.headers.get('Content-Type')?.includes('application/json')) {
      return await response.json() as T;
    }

    // Если ожидается текст (можно добавить другие типы по необходимости)
    return await response.text() as T;

  } catch (error) {
      console.error(`API request failed: ${method} ${url}`, error);
      // Перебрасываем ошибку, чтобы ее можно было поймать выше
      // Убедимся, что это объект ApiError или создаем его
      if (typeof error === 'object' && error !== null && 'status' in error) {
          throw error; // Уже похоже на ApiError
      } else {
          throw { 
              error: (error instanceof Error) ? error.message : 'Network or unknown error', 
              status: 0 // Статус 0 для сетевых ошибок
          } as ApiError;
      }
  }
}

// Вспомогательные методы для удобства
export const httpClient = {
  get: <T>(endpoint: string, options?: RequestOptions) => request<T>('GET', endpoint, undefined, options),
  post: <T, B>(endpoint: string, body: B, options?: RequestOptions) => request<T, B>('POST', endpoint, body, options),
  put: <T, B>(endpoint: string, body: B, options?: RequestOptions) => request<T, B>('PUT', endpoint, body, options),
  delete: <T>(endpoint: string, options?: RequestOptions) => request<T>('DELETE', endpoint, undefined, options),
  patch: <T, B>(endpoint: string, body: B, options?: RequestOptions) => request<T, B>('PATCH', endpoint, body, options),
}; 