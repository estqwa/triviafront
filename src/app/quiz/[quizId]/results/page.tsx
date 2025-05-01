"use client";

import { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter, useParams } from 'next/navigation';
import { getQuizResults, getUserQuizResult, getQuizById, QuizResult, Quiz } from '@/lib/api/quizzes'; // Убедимся, что импорты верные
import { ApiError } from '@/lib/api/http-client';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Users } from "lucide-react"; // Убираем лишние иконки
import UserResultCard from '@/components/quiz/UserResultCard'; // Импортируем новый компонент
import { motion } from "framer-motion"; // Добавляем анимацию

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const { user } = useAuth();

  // Состояния для загрузки данных
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserResult, setCurrentUserResult] = useState<QuizResult | null>(null);
  const [quizInfo, setQuizInfo] = useState<Quiz | null>(null); // Оставляем для передачи в UserResultCard
  const [winnersCount, setWinnersCount] = useState<number>(0); // Оставляем для передачи

  // Загрузка данных при монтировании
  useEffect(() => {
    const loadData = async () => {
      if (!quizId || !user) {
        setLoading(false); // Добавляем setLoading(false) если нет данных
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const quizIdNum = parseInt(quizId, 10);
        if (isNaN(quizIdNum)) {
          throw new Error("Некорректный ID викторины");
        }

        // Загружаем результат текущего пользователя
        const userResultData = await getUserQuizResult(quizIdNum);
        setCurrentUserResult(userResultData);

        // Загружаем информацию о викторине (опционально, если нужно в UserResultCard)
        const quizData = await getQuizById(quizIdNum);
        setQuizInfo(quizData);

        // Загружаем все результаты, чтобы посчитать победителей
        const allResultsData = await getQuizResults(quizIdNum, { page_size: 1000 }); // Загружаем все (или достаточно много)
        // const totalWinners = allResultsData.winners_count ?? 0; // Убираем использование winners_count
        setWinnersCount(allResultsData.results.filter(r => r.is_winner).length); // Считаем вручную

      } catch (err) {
        console.error("Ошибка загрузки результатов:", err);
        setError((err as ApiError).error || 'Не удалось загрузить результаты');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [quizId, user]);

  return (
    // Основной контейнер из quizlive
    <div className="container py-12 relative">
      {/* Кнопка Назад из quizlive */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8"> {/* Позиционирование из quizlive/login */}
        <Button variant="ghost" size="sm" onClick={() => router.back()}> 
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Анимация заголовка */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold">Результаты Игры</h1>
        <p className="text-gray-500 mt-2">Викторина #{quizId}</p>
      </motion.div>

      {/* Состояния загрузки/ошибки */}
      {loading && (
         <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
         </div>
      )}
      {error && (
         // Используем Card для ошибки
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
           <div className="border border-red-200 shadow-lg rounded-2xl bg-red-50/80 backdrop-blur-xl p-6 text-center">
             <h3 className="font-bold mb-2 text-red-600">Ошибка!</h3>
             <p className="text-red-600">{error}</p>
           </div>
         </motion.div>
      )}
      
      {/* Основной контент с результатами */} 
      {!loading && !error && currentUserResult && (
          // Анимация основной части
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl mx-auto" // Ограничиваем ширину как в quizlive
          >
            {/* Компонент UserResultCard (стили внутри него должны быть уже обновлены) */}
            <UserResultCard 
              userResult={currentUserResult} 
              quizInfo={quizInfo} 
              winnersCount={winnersCount}
            />
            {/* Кнопки навигации из quizlive */}
            <div className="flex justify-center gap-4 mt-6">
              <Link href="/leaderboard">
                <Button variant="outline" className="gap-2"> {/* gap-2 для иконки */}
                  <Trophy className="h-4 w-4" />
                  Лидерборд
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  На главную
                </Button>
              </Link>
            </div>
          </motion.div>
      )}
      
      {/* Сообщение, если результат не найден - стилизуем */}
      {!loading && !error && !currentUserResult && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
           <div className="border border-gray-200 shadow-lg rounded-2xl bg-white/80 backdrop-blur-xl p-8 text-center">
             <p className="mb-6 text-gray-500">Не удалось загрузить ваши результаты для этой викторины.</p>
             <Link href="/">
               <Button variant="outline">
                  На главную
               </Button>
             </Link>
           </div>
         </motion.div>
      )}
    </div>
  );
} 