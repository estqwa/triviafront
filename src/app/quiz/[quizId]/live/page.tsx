"use client";

import { useParams /*, useRouter*/ } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from "next/link"; 
import { useAuth } from '../../../../lib/auth/auth-context';
import { ApiError } from '../../../../lib/api/http-client';
import { getQuizById, Quiz, /*getQuizResults,*/ QuizResult, getUserQuizResult } from '../../../../lib/api/quizzes'; 
// import { getWebSocketTicket } from '../../../../lib/api/auth';
// Убираем Fi иконки
import {
  WsServerMessage,
  QuizQuestionData,
  QuizAnswerResultData,
  // WsUserReadyMessage,
  // WsUserAnswerMessage,
  // WsUserHeartbeatMessage,
  QuizStartData,
  QuizEliminationData,
  ErrorData,
  QuizCountdownData,
  QuizWaitingRoomData,
  QuizAnnouncementData,
  QuizFinishData,
  QuizResultsAvailableData,
  QuizTimerData,
  QuizAnswerRevealData,
  QuizUserReadyData,
  QuizEliminationReminderData,
  // ServerHeartbeatData
  UserReadyData,
  UserAnswerData,
  UserHeartbeatData
} from '@/types/websocket';

// Shadcn UI & Framer Motion & Lucide
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, XCircle, Trophy } from "lucide-react"; // Добавляем Trophy
import { motion, AnimatePresence } from "framer-motion";

// Импортируем обновленные компоненты из /components/quiz/
import { QuizLobby } from '../../../../components/quiz/QuizLobby';
import { QuestionCard } from '../../../../components/quiz/QuestionCard';
import { AnswerResultCard } from '../../../../components/quiz/AnswerResultCard';
import UserResultCard from '../../../../components/quiz/UserResultCard';
// Убираем старые QuizTimer, QuizQuestionDisplay
// import QuizTimer from '../../../../components/quiz/QuizTimer';
// import QuizQuestionDisplay from '../../../../components/quiz/QuizQuestionDisplay';

// Определяем тип QuizState как в quizlive
type QuizState = 'waiting' | 'starting' | 'in_progress' | 'eliminated' | 'completed';

// --- Тип для данных клиентских сообщений ---
type ClientMessageData = UserReadyData | UserAnswerData | UserHeartbeatData | Record<string, never>;

export default function LiveQuizPage() {
  // const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;
  const { isAuthenticated, user, csrfToken, fetchWsTicket } = useAuth();
  
  // Состояния остаются в основном без изменений
  // const [wsConnected, setWsConnected] = useState(false);
  // const [wsMessages, setWsMessages] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsTicket, setWsTicket] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState>('waiting'); // Используем новый тип
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestionData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [answerSelected, setAnswerSelected] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);
  const [answerResult, setAnswerResult] = useState<QuizAnswerResultData | null>(null);
  const [isEliminated, setIsEliminated] = useState<boolean>(false);
  const [revealedCorrectOption, setRevealedCorrectOption] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(0);
  // const [quizAnnouncement, setQuizAnnouncement] = useState<QuizAnnouncementData | null>(null);
  // const [waitingRoomInfo, setWaitingRoomInfo] = useState<QuizWaitingRoomData | null>(null);
  const [showResultsButton, setShowResultsButton] = useState<boolean>(false);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [isReadySent, setIsReadySent] = useState(false);
  const [resultsData, setResultsData] = useState<QuizResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState<boolean>(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3); // Для состояния starting
  const [quizIdNum, setQuizIdNum] = useState<number>(0); // Добавляем состояние для числового ID

  const MAX_RECONNECT_ATTEMPTS = 5;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const questionTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref для таймера starting
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null); // <-- Ref для heartbeat интервала

  // --- Функции clear/start таймеров (Оборачиваем в useCallback) --- 
  const clearQuestionTimer = useCallback(() => {
    if (questionTimerIntervalRef.current) {
        clearInterval(questionTimerIntervalRef.current);
        questionTimerIntervalRef.current = null;
    }
  }, []); // <-- Пустой массив зависимостей

  const startQuestionTimer = useCallback((initialSeconds: number) => {
      clearQuestionTimer(); // Используем мемоизированную версию
      setTimeRemaining(initialSeconds);
      if (initialSeconds > 0) {
          questionTimerIntervalRef.current = setInterval(() => {
              setTimeRemaining(prev => {
                  if (prev <= 1) {
                      clearQuestionTimer(); // Используем мемоизированную версию
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      } else {
        setTimeRemaining(0);
      }
  }, [clearQuestionTimer]); // <-- Добавляем clearQuestionTimer в зависимости

  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerIntervalRef.current) {
        clearInterval(countdownTimerIntervalRef.current);
        countdownTimerIntervalRef.current = null;
    }
  }, []); // <-- Пустой массив зависимостей

  const startCountdownTimer = useCallback((initialSeconds: number) => {
    clearCountdownTimer(); // Используем мемоизированную версию
    setCountdownSeconds(initialSeconds);
    if(initialSeconds > 0) {
        countdownTimerIntervalRef.current = setInterval(() => {
            setCountdownSeconds(prev => {
                if (prev <= 1) {
                    clearCountdownTimer(); // Используем мемоизированную версию
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
  }, [clearCountdownTimer]); // <-- Добавляем clearCountdownTimer в зависимости

  // --- useEffect hooks for loading quiz details, getting WS ticket, and managing WS connection ---
  useEffect(() => {
    const loadQuizDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const quizIdNum = parseInt(quizId, 10);
        if (isNaN(quizIdNum)) throw new Error('Invalid quiz ID');
        const quizData = await getQuizById(quizIdNum);
        setQuiz(quizData);
        setQuestionCount(quizData.question_count || 0);
        setQuizIdNum(quizIdNum); // Сохраняем числовой ID
      } catch (err) {
        console.error('Error loading quiz details:', err);
        setError((err as ApiError).error || 'Failed to load quiz details');
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) loadQuizDetails();
  }, [quizId, isAuthenticated]);
  useEffect(() => {
    const initiateWebSocketConnection = async () => {
      if (isAuthenticated && csrfToken) {
        try {
          const ticket = await fetchWsTicket();
          if (ticket) {
              setWsTicket(ticket);
              console.log('WebSocket ticket obtained.');
          } else {
              setError('Failed to get WebSocket ticket.');
          }
        } catch (err) {
          setError((err as Error).message || 'Failed to get WebSocket ticket.');
        }
      } else {
        console.log(`WS ticket prerequisites not met (isAuthenticated: ${isAuthenticated}, csrfToken: ${!!csrfToken})`);
      }
    };
    initiateWebSocketConnection();
  }, [isAuthenticated, csrfToken, fetchWsTicket]);

  // --- Функции отправки сообщений WS (ПЕРЕМЕЩЕНЫ ВЫШЕ useEffect) --- 
  const sendMessage = (type: string, data: ClientMessageData = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, data });
      console.log('Sending WS message:', message);
      wsRef.current.send(message);
      return true;
    } else {
      console.error('WebSocket not open, cannot send message');
      return false;
    }
  };
  
  const sendAnswer = (questionId: number, optionId: number) => {
    if (!answerSubmitted) {
      const timestamp = Date.now();
      if (sendMessage('user:answer', { 
            question_id: questionId,
            selected_option: optionId - 1, // Отправляем индекс 0
            timestamp 
          })) {
        setAnswerSubmitted(true);
        setAnswerSelected(optionId); // Сохраняем исходный ID (1-based)
      }
    }
  };

  // Оборачиваем sendHeartbeat в useCallback
  const sendHeartbeat = useCallback(() => {
      // Используем локальную функцию sendMessage внутри useCallback
      const localSendMessage = (type: string, data: ClientMessageData = {}) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              const message = JSON.stringify({ type, data });
              console.log('Sending WS Heartbeat:', message);
              wsRef.current.send(message);
              return true;
          } else {
              console.warn('WebSocket not open, cannot send heartbeat');
              return false;
          }
      };
      localSendMessage('user:heartbeat', {});
  }, []); // Зависимостей нет, так как sendMessage определена локально

  // --- Функция загрузки результатов (Оборачиваем в useCallback) --- 
  const loadResults = useCallback(async () => {
    if (!quizId || !user) return;
    setResultsLoading(true);
    setResultsError(null);
    try {
      const userResultData = await getUserQuizResult(parseInt(quizId, 10));
      setResultsData(userResultData ? [userResultData] : []); 
    } catch (err) {
      console.error('Error loading user result:', err);
      setResultsError('Failed to load your result.');
    } finally {
      setResultsLoading(false);
    }
  }, [quizId, user]);

  // --- Рендеринг UI --- 

  // Верхняя панель (стили из quizlive)
  const QuizTopBar = useCallback(() => (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 py-2 sticky top-0 z-40">
      <div className="container flex justify-between items-center">
        <div className="text-sm font-medium">
          Q{currentQuestionNumber}/{questionCount}
        </div>
        <div className="text-sm font-medium flex items-center gap-1">
          <Users className="h-4 w-4" />
          Игроки: {playerCount}
        </div>
      </div>
    </div>
  ), [currentQuestionNumber, questionCount, playerCount]); // Добавляем зависимости

  // Модифицированная функция, вызываемая из QuizLobby
  const handleReadyClick = useCallback(() => {
    if (!isReadySent && quizIdNum > 0) {
        if (sendMessage('user:ready', { quiz_id: quizIdNum })) {
            setIsReadySent(true);
            console.log('User Ready message sent.');
        } else {
          console.error('Failed to send user:ready message');
          setTemporaryError('Не удалось отправить сигнал готовности.');
        }
    } else if (quizIdNum <= 0) {
      console.error('Cannot send ready message: Quiz ID is not valid.');
      setTemporaryError('Ошибка: Некорректный ID викторины.');
    }
  }, [isReadySent, quizIdNum /* sendMessage не добавляем, т.к. он стабилен */]);

  // --- Обработчики сообщений WS --- 
  const handleAnnouncement = useCallback((data: QuizAnnouncementData) => {
      console.log('Handling announcement:', data); 
      setQuizState('waiting');
  }, []);
  const handleWaitingRoom = useCallback((data: QuizWaitingRoomData) => {
      console.log('Handling waiting room info:', data); 
      setPlayerCount(data.player_count || 0);
      setQuizState('waiting');
  }, []);
  const handleCountdown = useCallback((data: QuizCountdownData) => {
      setQuizState('starting');
      startCountdownTimer(data.seconds_left || 3); // Используем мемоизированную версию
  }, [startCountdownTimer]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleQuizStart = useCallback((_data: QuizStartData) => {
    console.log('Quiz Started!');
    clearCountdownTimer();
  }, [clearCountdownTimer]);
  const handleQuizQuestion = useCallback((data: QuizQuestionData) => {
    clearQuestionTimer();
    clearCountdownTimer();
    setQuizState('in_progress');
    setCurrentQuestion(data);
    setCurrentQuestionNumber(data.question_number || 0);
    setAnswerSelected(null);
    setAnswerSubmitted(false);
    setAnswerResult(null);
    setRevealedCorrectOption(null);
    startQuestionTimer(data.time_limit_sec || 10);
  }, [startQuestionTimer, clearQuestionTimer, clearCountdownTimer]);
  const handleTimerUpdate = useCallback((data: QuizTimerData) => {
      // Проверяем currentQuestion внутри, чтобы избежать зависимости
      setCurrentQuestion(prevQ => {
         if (prevQ?.question_id === data.question_id) {
            setTimeRemaining(data.remaining_seconds);
         }
         return prevQ;
      });
  }, []);
  const handleAnswerReveal = useCallback((data: QuizAnswerRevealData) => {
      clearQuestionTimer();
      setRevealedCorrectOption(data.correct_option !== null && data.correct_option !== undefined ? data.correct_option + 1 : null);
  }, [clearQuestionTimer]);
  const handleAnswerResult = useCallback((data: QuizAnswerResultData) => {
    setAnswerResult(data);
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleElimination = useCallback((_data: QuizEliminationData) => {
    clearQuestionTimer();
    setIsEliminated(true);
    setQuizState('eliminated'); 
  }, [clearQuestionTimer]);
  const handleEliminationReminder = useCallback((data: QuizEliminationReminderData) => {
      console.log(`Elimination reminder: ${data.message}`);
  }, []);
  const handleUserReady = useCallback((data: QuizUserReadyData) => {
      console.log(`User ${data.user_id} is ready for quiz ${data.quiz_id}`);
  }, []);
  const handleError = useCallback((data: ErrorData) => {
    console.error('WebSocket Server Error:', data.message);
    setTemporaryError(`Server error: ${data.message}`);
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleQuizFinish = useCallback((_data: QuizFinishData) => {
    clearQuestionTimer();
    setCurrentQuestion(null); 
    setQuizState('completed');
    console.log('Quiz finished!');
    loadResults(); 
  }, [loadResults, clearQuestionTimer]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleResultsAvailable = useCallback((_data: QuizResultsAvailableData) => {
      console.log('Results are available!');
      setShowResultsButton(true); 
      if(quizState !== 'completed') loadResults();
  }, [loadResults, quizState]);

  // --- Основной обработчик сообщений (Оборачиваем в useCallback) --- 
  const handleWebSocketMessage = useCallback((message: WsServerMessage) => {
    console.log('[handleWebSocketMessage] Received:', message.type, message.data);
    // Обновляем playerCount универсально, если он есть в данных
    if ('player_count' in message.data && message.data.player_count !== undefined) {
      setPlayerCount(message.data.player_count);
    }
    switch (message.type) {
      case 'quiz:announcement': handleAnnouncement(message.data); break;
      case 'quiz:waiting_room': handleWaitingRoom(message.data); break;
      case 'quiz:countdown': handleCountdown(message.data); break;
      case 'quiz:start': handleQuizStart(message.data); break;
      case 'quiz:question': handleQuizQuestion(message.data); break;
      case 'quiz:timer': handleTimerUpdate(message.data); break;
      case 'quiz:answer_reveal': handleAnswerReveal(message.data); break;
      case 'quiz:answer_result': handleAnswerResult(message.data); break;
      case 'quiz:elimination': handleElimination(message.data); break;
      case 'quiz:elimination_reminder': handleEliminationReminder(message.data); break;
      case 'quiz:finish': handleQuizFinish(message.data); break;
      case 'quiz:results_available': handleResultsAvailable(message.data); break;
      case 'quiz:user_ready': handleUserReady(message.data); break;
      case 'server:heartbeat': break;
      case 'error': handleError(message.data); break;
      default: return;
    }
  }, [handleAnnouncement, handleWaitingRoom, handleCountdown, handleQuizStart, handleQuizQuestion, handleTimerUpdate, handleAnswerReveal, handleAnswerResult, handleElimination, handleEliminationReminder, handleQuizFinish, handleResultsAvailable, handleUserReady, handleError]);

  // --- useEffect для установки/закрытия WebSocket соединения (САМЫЙ ВАЖНЫЙ) --- 
  useEffect(() => {
    // Оборачиваем connectWebSocket в useCallback, чтобы ссылка была стабильной
    const connectWebSocket = () => {
      if (!wsTicket) {
        console.log('[connectWebSocket] No WS ticket available, skipping connection attempt.');
        return; // Не можем подключиться без тикета
      }

      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        console.log('[connectWebSocket] Closing existing WebSocket connection before reconnecting.');
        wsRef.current.onclose = null; // Убираем старый обработчик, чтобы он не сработал при ручном закрытии
        wsRef.current.close(1000, 'Client reconnecting'); // Закрываем с кодом 1000
      }

      const protocol = process.env.NODE_ENV === 'production' || window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = process.env.NEXT_PUBLIC_WS_HOST || 'triviabackend-jp8r.onrender.com'; // Используем переменную окружения или дефолт
      const wsUrl = `${protocol}//${wsHost}/ws?ticket=${wsTicket}`;
      console.log(`[connectWebSocket] Attempting to connect to: ${wsUrl}`);

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws; // Сохраняем ссылку на новый сокет

        ws.onopen = () => {
          console.log('[WebSocket OnOpen] Connection established successfully.');
          setReconnectAttempts(0); // Сбрасываем счетчик попыток при успешном соединении
          sendHeartbeat(); // Отправляем первый heartbeat
          // Устанавливаем интервал для heartbeat
          if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000); // 30 секунд
          console.log('[WebSocket OnOpen] Heartbeat interval started.');
        };

        ws.onmessage = (event) => {
          try {
            const message: WsServerMessage = JSON.parse(event.data as string);
            // Не логируем здесь каждое сообщение, чтобы не засорять консоль
            // console.log('[WebSocket OnMessage] Received data:', message);
            handleWebSocketMessage(message); // Передаем в мемоизированный обработчик
          } catch (error) {
            console.error('[WebSocket OnMessage] Failed to parse message:', event.data, error);
          }
        };

        ws.onerror = (event) => {
          // Более подробное логирование ошибки
          console.error('[WebSocket OnError] An error occurred:', event);
          // Пытаемся получить больше деталей, если возможно
          if (event instanceof ErrorEvent) {
              console.error(`[WebSocket OnError] Message: ${event.message}, Filename: ${event.filename}, Lineno: ${event.lineno}, Colno: ${event.colno}`);
          }
          // Не устанавливаем общую ошибку здесь, т.к. onclose обработает переподключение
          // setError('WebSocket connection error occurred.');
        };

        ws.onclose = (event: CloseEvent) => {
          // Подробное логирование закрытия
          console.log(`[WebSocket OnClose] Connection closed. Code: ${event.code}, Reason: '${event.reason}', Was Clean: ${event.wasClean}`);

          // Очищаем интервал heartbeat
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
            console.log('[WebSocket OnClose] Heartbeat interval cleared.');
          }
          // Очищаем таймеры вопросов и обратного отсчета
          clearQuestionTimer();
          clearCountdownTimer();

          // Логика переподключения
          // Код 1000: Нормальное закрытие (OK)
          // Код 1001: Уход со страницы (OK)
          // Код 1005: No Status Rcvd (часто при потере сети, нужно переподключаться)
          // Код 1006: Abnormal Closure (часто при разрыве сети/прокси, нужно переподключаться)
          // Другие коды: Возможно ошибки сервера или клиента
          if (event.code !== 1000 && event.code !== 1001 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.pow(2, reconnectAttempts) * 1000; // Экспоненциальная задержка
            console.warn(`[WebSocket OnClose] Abnormal closure (code ${event.code}). Attempting to reconnect in ${delay / 1000}s... (Attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
            
            setTimeout(() => {
              console.log(`[WebSocket Reconnect] Executing reconnect attempt ${reconnectAttempts + 1}...`);
              setReconnectAttempts(prev => prev + 1); // Увеличиваем счетчик
              // !!! ИСПРАВЛЕНИЕ: Не запрашиваем новый тикет! Вызываем connectWebSocket, 
              // который использует ТЕКУЩИЙ wsTicket из состояния. 
              // Если ТЕКУЩИЙ тикет невалиден, connectWebSocket не сможет подключиться,
              // и onclose снова сработает (возможно, с другим кодом).
              connectWebSocket(); // Повторный вызов этой же функции
            }, delay);

          } else if (event.code === 1000 || event.code === 1001) {
            console.log('[WebSocket OnClose] Connection closed normally or due to navigation. No automatic reconnect needed.');
            setReconnectAttempts(0); // Сбрасываем счетчик при нормальном закрытии
          } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error(`[WebSocket OnClose] Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Stopping reconnection attempts.`);
            setError('Не удалось восстановить соединение с сервером после нескольких попыток.');
          } else {
            // Обработка других кодов закрытия, если нужно
             console.warn(`[WebSocket OnClose] Unhandled close code ${event.code}. Stopping reconnection attempts.`);
             setError(`Соединение закрыто с кодом ${event.code}.`);
          }
        };

      } catch (error) {
          console.error('[connectWebSocket] Failed to create WebSocket object:', error);
          setError('Не удалось инициализировать WebSocket.');
      }
    };

    // --- Вызов connectWebSocket при изменении тикета --- 
    if (wsTicket) {
        console.log('[useEffect wsTicket] wsTicket changed, calling connectWebSocket...');
        connectWebSocket();
    }

    // --- Функция очистки при размонтировании компонента --- 
    return () => {
      console.log('[useEffect Cleanup] Component unmounting or wsTicket changed. Cleaning up...');
      clearQuestionTimer();
      clearCountdownTimer();
      if (heartbeatIntervalRef.current) {
         clearInterval(heartbeatIntervalRef.current);
         heartbeatIntervalRef.current = null;
         console.log('[useEffect Cleanup] Heartbeat interval cleared.');
      }
      if (wsRef.current) {
        console.log('[useEffect Cleanup] Closing WebSocket connection with code 1000.');
        // Убираем обработчик onclose перед закрытием, чтобы избежать логики переподключения при размонтировании
        wsRef.current.onclose = null;
        wsRef.current.close(1000, 'Component unmounted'); 
        wsRef.current = null;
      }
    };
  // Зависимости: wsTicket (для подключения), 
  // fetchWsTicket (хотя он используется только в начальном получении тикета, но для полноты), 
  // handleWebSocketMessage, sendHeartbeat (для обработчиков), 
  // clearQuestionTimer, clearCountdownTimer (для onclose)
  // reconnectAttempts НЕ НУЖНО добавлять в зависимости основного useEffect, 
  // так как он изменяется внутри setTimeout и используется для контроля переподключений в onclose.
  // Добавление его сюда вызовет лишние запуски connectWebSocket.
  }, [wsTicket, /*fetchWsTicket,*/ handleWebSocketMessage, sendHeartbeat, clearQuestionTimer, clearCountdownTimer]);
  
  // --- Функция для временных ошибок --- 
  const setTemporaryError = (message: string, duration: number = 5000) => {
    setError(message);
    setTimeout(() => {
      setError(prev => (prev === message ? null : prev));
    }, duration);
  };

  // Основной рендер компонента
  return (
    // Основной flex контейнер из quizlive
    <div className="flex flex-col min-h-0 flex-1">
      {/* Показываем TopBar только во время игры */} 
      {quizState === 'in_progress' && !isEliminated && <QuizTopBar />} 
      
      {/* Центрированная область контента из quizlive */} 
      <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
        {/* Анимация смены состояний */} 
        <AnimatePresence mode="wait">
          
          {/* Состояние Ожидания (Лобби) */} 
          {quizState === 'waiting' && quiz && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-4xl" // Шире для лобби
            >
              {/* Используем обновленный компонент QuizLobby */}
              <QuizLobby 
                quiz={quiz} 
                onReadyClick={handleReadyClick} // Передаем обработчик клика
              />
            </motion.div>
          )}
          {/* Загрузка и ошибка для состояния waiting */} 
          {quizState === 'waiting' && loading && (
            <div className="flex justify-center items-center h-64">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
          {quizState === 'waiting' && error && !loading && (
              <div className="border border-red-200 shadow-lg rounded-2xl bg-red-50/80 p-6 text-center max-w-md">
                  <h3 className="font-bold mb-2 text-red-600">Ошибка</h3>
                  <p className="text-red-600">{error}</p>
                  <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">Перезагрузить</Button>
              </div>
          )}

          {/* Состояние Старта (Обратный отсчет) */} 
          {quizState === 'starting' && (
            <motion.div
              key="starting"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="text-center"
            >
              {/* Карточка отсчета из quizlive */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-4">Игра начинается!</h2>
                <div className="text-6xl font-bold text-indigo-600 font-mono">{countdownSeconds}...</div>
              </div>
            </motion.div>
          )}

          {/* Состояние Игры (Вопрос) */} 
          {quizState === 'in_progress' && currentQuestion && !isEliminated && (
            <motion.div
              key={`question-${currentQuestion.question_id}`} // Используем question_id
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl" // Ограничиваем ширину
            >
              {/* Таймер вопроса (стили из quizlive) */} 
              <div className="mb-6 text-center">
                <p className="text-sm text-gray-500 mb-1">Time remaining</p>
                <Progress value={(timeRemaining / (currentQuestion.time_limit_sec || 10)) * 100} className="h-2 mb-1 quiz-timer-progress" /> 
                <p className="text-sm font-mono font-bold">{timeRemaining}s</p>
              </div>
              
              {/* Используем обновленный QuestionCard */}
              <QuestionCard
                question={{
                  id: currentQuestion.question_id.toString(), // Используем question_id
                  text: currentQuestion.text,
                  options: currentQuestion.options.map(opt => ({ id: opt.id.toString(), text: opt.text })), 
                  correctAnswer: revealedCorrectOption !== null ? revealedCorrectOption.toString() : '' 
                }}
                selectedAnswer={answerSelected?.toString() || null}
                isAnswerCorrect={answerResult ? answerResult.is_correct : (revealedCorrectOption !== null && answerSelected === revealedCorrectOption ? true : (revealedCorrectOption !== null ? false : null))}
                onSelectAnswer={(answerId) => sendAnswer(currentQuestion.question_id, parseInt(answerId))} 
              />
              
              {/* Используем обновленный AnswerResultCard */} 
              {/* Показываем, когда есть результат ИЛИ когда показан правильный ответ */}
              {(answerResult || revealedCorrectOption !== null) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                  <AnswerResultCard
                    isCorrect={answerResult ? answerResult.is_correct : (revealedCorrectOption !== null && answerSelected === revealedCorrectOption ? true : false)}
                    points={answerResult?.points_earned || 0}
                    time={answerResult?.time_taken_ms ? parseFloat((answerResult.time_taken_ms / 1000).toFixed(1)) : (timeRemaining === 0 ? currentQuestion.time_limit_sec : 0)} 
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Состояние Выбывания */} 
          {quizState === 'eliminated' && (
            <motion.div
              key="eliminated"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              {/* Карточка выбывания из quizlive */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl p-8 flex flex-col items-center max-w-md">
                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold">Вы выбыли</h2>
                <p className="text-gray-500 mt-2 mb-6">К сожалению, вы дали неправильный ответ или время истекло.</p>
                {/* Кнопки навигации из quizlive */} 
                <div className="flex justify-center gap-4 mt-6">
                  <Link href="/leaderboard">
                    <Button variant="outline" className="gap-2">
                      <Trophy className="h-4 w-4" />
                      Лидерборд
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline">На главную</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Состояние Завершено (Показ результата) */} 
          {quizState === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl"
            >
              {/* Загрузка/ошибка результатов */} 
              {resultsLoading && (
                 <div className="flex justify-center items-center h-64">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                 </div>
              )}
              {resultsError && (
                  <div className="border border-red-200 shadow-lg rounded-2xl bg-red-50/80 p-6 text-center">
                      <h3 className="font-bold mb-2 text-red-600">Ошибка</h3>
                      <p className="text-red-600">{resultsError}</p>
                      <Button variant="outline" onClick={loadResults} className="mt-4">Попробовать снова</Button>
                  </div>
              )}
              {/* Карточка результата пользователя */}
              {!resultsLoading && !resultsError && resultsData.length > 0 && user && (
                <UserResultCard 
                  userResult={resultsData[0]} 
                  quizInfo={quiz} 
                  winnersCount={resultsData.filter(r => r.is_winner).length} 
                />
              )}
               {/* Сообщение, если нет результатов */}
               {!resultsLoading && !resultsError && resultsData.length === 0 && (
                    <div className="border border-gray-200 shadow-lg rounded-2xl bg-white/80 p-8 text-center">
                        <p className="text-gray-500">Результаты еще не опубликованы или не удалось загрузить ваш результат.</p>
                    </div>
               )}

              {/* Кнопки навигации (стили из quizlive) */} 
              <div className="flex justify-center gap-4 mt-6">
                {showResultsButton && (
                    <Link href={`/results/${quizId}`}>
                        <Button variant="outline">Полные результаты</Button>
                    </Link>
                )}
                <Link href="/leaderboard">
                  <Button variant="outline" className="gap-2">
                    <Trophy className="h-4 w-4" />
                    Лидерборд
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">На главную</Button>
                </Link>
              </div>
            </motion.div>
          )}
          
        </AnimatePresence>
      </div>
    </div>
  );
} 