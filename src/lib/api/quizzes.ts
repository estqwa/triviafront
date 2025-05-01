import { httpClient } from './http-client';

// Интерфейс для объекта викторины
export interface Quiz {
  id: number;
  name: string;
  description: string;
  scheduled_time: string;
  creator_id: number;
  created_at: string;
  updated_at: string;
  status: string;
  prize_pool?: number;
  player_count?: number;
  question_count?: number;
}

// Интерфейс для вопроса викторины
export interface Question {
  id: number;
  quiz_id: number;
  text: string;
  options: OptionData[];
  time_limit_sec: number;
  point_value: number;
  created_at: string;
  updated_at: string;
}

// Интерфейс для опции ответа (из WS)
export interface OptionData {
  id: number;
  text: string;
}

// Интерфейс для викторины с вопросами
export interface QuizWithQuestions extends Quiz {
  questions: Question[];
}

// Интерфейс для результата викторины одного пользователя
export interface QuizResult {
  id: number;
  user_id: number;
  quiz_id: number;
  username: string;
  profile_picture: string | null;
  score: number;
  rank: number;
  correct_answers: number;
  total_questions: number;
  is_eliminated: boolean;
  is_winner: boolean;
  prize_fund: number; // Сумма приза (может быть 0)
  completed_at: string;
}

// Интерфейс для параметров пагинации
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// ИЗМЕНЕНО: Интерфейс для пагинированного ответа с результатами
export interface PaginatedQuizResults {
  results: QuizResult[];
  total: number;
  page: number;
  per_page: number;
}

/**
 * Получает список доступных викторин
 * 
 * @param params параметры пагинации (опционально)
 * @returns Promise со списком викторин
 */
export async function getAvailableQuizzes(params?: PaginationParams): Promise<Quiz[]> {
  const queryParams: Record<string, string> = {};
  
  if (params?.page) {
    queryParams.page = params.page.toString();
  }
  
  if (params?.page_size) {
    queryParams.page_size = params.page_size.toString();
  }
  
  return httpClient.get<Quiz[]>('/api/quizzes', { query: queryParams });
}

/**
 * Получает информацию о конкретной викторине
 * 
 * @param quizId ID викторины
 * @returns Promise с информацией о викторине
 */
export async function getQuizById(quizId: number): Promise<Quiz> {
  return httpClient.get<Quiz>(`/api/quizzes/${quizId}`);
}

/**
 * Получает информацию о викторине с вопросами
 * 
 * @param quizId ID викторины
 * @returns Promise с информацией о викторине и ее вопросами
 */
export async function getQuizWithQuestions(quizId: number): Promise<QuizWithQuestions> {
  return httpClient.get<QuizWithQuestions>(`/api/quizzes/${quizId}/with-questions`);
}

/**
 * Получает активную викторину
 * 
 * @returns Promise с информацией об активной викторине
 */
export async function getActiveQuiz(): Promise<Quiz | null> {
  try {
    return await httpClient.get<Quiz>('/api/quizzes/active');
  } catch (_error) {
    console.error("Error fetching active quiz:", _error);
    return null;
  }
}

/**
 * Получает запланированные викторины
 * 
 * @returns Promise со списком запланированных викторин
 */
export async function getScheduledQuizzes(): Promise<Quiz[]> {
  return httpClient.get<Quiz[]>('/api/quizzes/scheduled');
}

/**
 * Получает результаты пользователя для конкретной викторины
 * 
 * @param quizId ID викторины
 * @returns Promise с результатами пользователя
 */
export async function getUserQuizResult(quizId: number): Promise<QuizResult | null> {
  try {
    return await httpClient.get<QuizResult>(`/api/quizzes/${quizId}/my-result`);
  } catch (_error) {
    console.error(`Error fetching result for quiz ${quizId}:`, _error);
    return null;
  }
}

/**
 * Получает пагинированные результаты викторины
 * 
 * @param quizId ID викторины
 * @param params Параметры пагинации (page, page_size)
 * @returns Promise с пагинированными результатами викторины
 */
export async function getQuizResults(quizId: number, params?: PaginationParams): Promise<PaginatedQuizResults> {
  const queryParams: Record<string, string> = {};
  
  if (params?.page) {
    queryParams.page = params.page.toString();
  }
  
  if (params?.page_size) {
    queryParams.page_size = params.page_size.toString();
  }

  return httpClient.get<PaginatedQuizResults>(`/api/quizzes/${quizId}/results`, { query: queryParams });
}

// --- УДАЛЕНЫ ФУНКЦИИ И ИНТЕРФЕЙСЫ ДЛЯ АДМИНИСТРИРОВАНИЯ --- 