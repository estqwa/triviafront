// Типы WebSocket сообщений для викторины

// --- Сообщения от Клиента --- (Соответствуют бэкенду)

// Базовый интерфейс для всех исходящих сообщений
export interface WsClientMessageBase<T extends string, D> {
  type: T;
  data: D;
}

// Данные для готовности пользователя к викторине
export interface UserReadyData {
  quiz_id: number;
}

// Данные для отправки ответа
export interface UserAnswerData {
  question_id: number;
  selected_option: number; // Соответствует бэкенду
  timestamp: number;
}

// Данные для проверки соединения (пустые)
export type UserHeartbeatData = Record<string, never>;

// Типизированные сообщения от клиента
export type WsUserReadyMessage = WsClientMessageBase<'user:ready', UserReadyData>;
export type WsUserAnswerMessage = WsClientMessageBase<'user:answer', UserAnswerData>;
export type WsUserHeartbeatMessage = WsClientMessageBase<'user:heartbeat', UserHeartbeatData>;

// Объединенный тип для всех исходящих сообщений
export type WsClientMessage =
  | WsUserReadyMessage
  | WsUserAnswerMessage
  | WsUserHeartbeatMessage;

// --- Сообщения от Сервера --- (Приводим в соответствие с реальной отправкой бэкенда)

// --- Данные для сообщений от сервера --- 

// Анонс предстоящей викторины
export interface QuizAnnouncementData {
  title: string;
  description: string;
  minutes_to_start: number;
}

// Информация о комнате ожидания
export interface QuizWaitingRoomData {
  title: string;
  description: string;
  starts_in_seconds: number;
  player_count?: number; // Добавлено
}

// Обратный отсчет до старта
export interface QuizCountdownData {
  seconds_left: number;
}

// Начало викторины
export interface QuizStartData {
  quiz_id: number;
  question_count?: number; // Опционально
  player_count?: number;   // Добавлено
}

// Вариант ответа (используется в QuizQuestionData)
export interface OptionData {
  id: number; // Индекс или ID опции (0, 1, 2, ...)
  text: string;
}

// Новый вопрос
export interface QuizQuestionData {
  quiz_id: number;
  question_id: number;
  number: number;
  text: string;
  options: OptionData[];
  time_limit_sec: number;
  total_questions: number;
  player_count?: number;
}

// Обновление таймера вопроса
export interface QuizTimerData {
  question_id: number;
  remaining_seconds: number;
}

// Показ правильного ответа
export interface QuizAnswerRevealData {
  question_id: number;
  correct_option: number; // Индекс правильного ответа (0, 1, 2, ...)
}

// Результат ответа пользователя
export interface QuizAnswerResultData {
  question_id: number;
  is_correct: boolean;
  points_earned: number;
  time_taken_ms: number;
  time_limit_exceeded: boolean;
  is_eliminated: boolean;
  // Добавляем поля, отправляемые бэкендом (answer_processor.go)
  correct_option: number;
  your_answer: number;
  elimination_reason?: string; // Добавляем опциональное поле
  // Дополнительно можно присылать: total_score, rank, etc.
}

// Завершение викторины
export interface QuizFinishData {
  quiz_id: number;
  // Добавляем поля, отправляемые бэкендом (quiz_manager.go -> finishQuiz)
  winner_count: number;
  winners: number[]; // Список user_id победителей
  prize_per_winner: number;
  // Можно добавить сообщение, победителей и т.д.
}

// Уведомление о доступности результатов
export interface QuizResultsAvailableData {
  quiz_id: number;
}

// Выбывание игрока
export interface QuizEliminationData {
  reason: string;
  message?: string; // Старое поле, можно удалить?
  // Добавляем поля, отправляемые бэкендом (answer_processor.go, question_manager.go)
  quiz_id: number;
  user_id: number;
}

// Напоминание о выбывании (при попытке ответа)
export interface QuizEliminationReminderData {
  message: string;
}

// Подтверждение готовности пользователя (ответ от сервера?)
// Возможно, стоит добавить кол-во игроков?
export interface QuizUserReadyData {
  quiz_id: number;
  user_id: number;
  // player_count?: number;
}

// Heartbeat от сервера для поддержания соединения
export type ServerHeartbeatData = Record<string, never>;

// Ошибка от сервера
export interface ErrorData {
  message: string;
  code?: number;
  critical?: boolean; // Указывает, нужно ли разрывать соединение
}

// --- НОВОЕ: Данные для обновления счетчика игроков ---
export interface QuizPlayerCountUpdateData {
  quiz_id: number;
  player_count: number;
}

// --- Общий тип для сообщений от сервера --- 
export type WsServerMessage =
  | { type: 'quiz:announcement', data: QuizAnnouncementData }
  | { type: 'quiz:waiting_room', data: QuizWaitingRoomData }
  | { type: 'quiz:countdown', data: QuizCountdownData }
  | { type: 'quiz:start', data: QuizStartData }
  | { type: 'quiz:question', data: QuizQuestionData }
  | { type: 'quiz:timer', data: QuizTimerData }
  | { type: 'quiz:answer_reveal', data: QuizAnswerRevealData }
  | { type: 'quiz:answer_result', data: QuizAnswerResultData }
  | { type: 'quiz:finish', data: QuizFinishData }
  | { type: 'quiz:results_available', data: QuizResultsAvailableData }
  | { type: 'quiz:elimination', data: QuizEliminationData }
  | { type: 'quiz:elimination_reminder', data: QuizEliminationReminderData }
  | { type: 'quiz:user_ready', data: QuizUserReadyData } // Ответ от сервера на готовность?
  | { type: 'quiz:player_count_update', data: QuizPlayerCountUpdateData }
  | { type: 'server:heartbeat', data: ServerHeartbeatData }
  | { type: 'error', data: ErrorData };

// --- НЕИСПОЛЬЗУЕМЫЕ/НЕИЗВЕСТНЫЕ ТИПЫ --- 
// Закомментированы типы, которые ожидал старый фронтенд или отправка которых бэкендом не подтверждена
/*
export interface QuizCountdownData { // Отправка не найдена на бэкенде
  quiz_id: number;
  seconds_left: number;
}
export interface QuizWaitingRoomData { // Отправка не найдена на бэкенде
  quiz_id: number;
  title: string;
  description: string;
  scheduled_time: string;
  question_count: number;
  starts_in_seconds: number;
}
export interface LeaderboardEntryData { // Отправка leaderboard целиком не найдена
  user_id: number;
  username: string;
  score: number;
  position: number;
  correct_answers: number;
}
export interface QuizLeaderboardData { // Отправка leaderboard целиком не найдена
  leaderboard: LeaderboardEntryData[];
}
// Типы токенов оставлены на случай использования, но отправка не найдена
export interface TokenExpireSoonData {
  expires_in_seconds: number;
}
export interface TokenExpiredData {
  message: string;
}
*/
