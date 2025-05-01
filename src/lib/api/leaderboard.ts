import { httpClient } from './http-client';

// Интерфейс для DTO одного пользователя в лидерборде (дублирует user_dto.go)
export interface LeaderboardUserDTO {
  rank: number;
  user_id: number;
  username: string;
  profile_picture: string | null;
  wins_count: number;
  total_prize_won: number;
}

// Интерфейс для пагинированного ответа лидерборда (дублирует user_dto.go)
export interface PaginatedLeaderboardResponse {
  users: LeaderboardUserDTO[];
  total: number;
  page: number;
  per_page: number;
}

// Интерфейс для параметров пагинации
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

/**
 * Получает пагинированные данные глобального лидерборда
 * 
 * @param params Параметры пагинации (page, page_size)
 * @returns Promise с пагинированными данными лидерборда
 */
export async function getLeaderboard(params?: PaginationParams): Promise<PaginatedLeaderboardResponse> {
  const queryParams: Record<string, string> = {};
  
  if (params?.page) {
    queryParams.page = params.page.toString();
  }
  
  if (params?.page_size) {
    queryParams.page_size = params.page_size.toString();
  }

  // Вызываем эндпоинт /api/leaderboard (или /api/v1/leaderboard, если используется префикс v1)
  return httpClient.get<PaginatedLeaderboardResponse>('/api/leaderboard', { query: queryParams });
} 