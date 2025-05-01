'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, CheckSquare, Clock } from "lucide-react";
import { QuizResult, Quiz } from '@/lib/api/quizzes';

// --- Props --- 
interface UserResultCardProps {
  userResult: QuizResult | null;
  quizInfo?: Quiz | null; // Опционально: для prize_pool
  winnersCount?: number; // Опционально: для текста о разделении приза
}

export default function UserResultCard({
  userResult,
  quizInfo,
  winnersCount = 0 // Значение по умолчанию
}: UserResultCardProps) {

  if (!userResult) return null; // Если нет результата, ничего не рендерим

  const questionsAnswered = userResult.correct_answers;
  const totalQuestions = userResult.total_questions;
  const averageTime = "N/A"; // Пока нет данных в API
  const prizePool = quizInfo?.prize_pool || 1000; // Используем заглушку, если нет quizInfo

  return (
    <div className="relative">
      {/* Убираем неоновый эффект, он больше подходит темной теме */}
      {/* <div className={`absolute -inset-1 ${userResult.is_winner ? "bg-gradient-to-r from-amber-600/30 to-yellow-600/30" : "bg-gradient-to-r from-violet-600/30 to-indigo-600/30"} rounded-2xl blur-md opacity-70`}></div> */}
      
      {/* Используем светлый фон карточки */}
      <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 space-y-6 border border-gray-200 shadow-xl">
        <div className="flex justify-center">
          {/* Используем светлые градиенты и текст */}
          <div className={`w-24 h-24 rounded-full ${userResult.is_winner ? "bg-gradient-to-br from-yellow-300 to-amber-400 shadow-lg shadow-amber-200/50" : "bg-gradient-to-br from-indigo-300 to-violet-400 shadow-lg shadow-indigo-200/50"} flex items-center justify-center border-2 border-white`}>
            {userResult.is_winner ? 
              <Trophy className="h-12 w-12 text-white" /> : 
              <span className="text-3xl font-bold text-white">{userResult.rank || '-'}</span> 
            }
          </div>
        </div>

        <div className="space-y-2 text-center">
          {/* Используем темные цвета текста для заголовков */}
          {userResult.is_winner ? (
            <h2 className="text-3xl font-bold text-amber-600">Вы выиграли ${userResult.prize_fund}!</h2>
          ) : userResult.is_eliminated ? (
            <h2 className="text-3xl font-bold text-red-600">Вы выбыли</h2>
          ) : (
            <h2 className="text-3xl font-bold text-gray-800">Игра завершена</h2>
          )}
          {/* Используем серый текст для описания */}
          {userResult.is_winner && (
             <p className="text-gray-600">Разделено с {Math.max(0, winnersCount - 1)} другими победителями из общего фонда ${prizePool}</p>
          )}
           {!userResult.is_winner && (
              <p className="text-gray-600">Ваше место: {userResult.rank || 'N/A'}</p>
           )}
        </div>

        {/* Статистика: используем светлый фон и темный текст */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-700 flex items-center"><CheckSquare className="mr-2 h-4 w-4 text-gray-500"/> Вопросов отвечено</span>
            <span className="font-bold text-gray-800">{questionsAnswered}/{totalQuestions}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-700 flex items-center"><Clock className="mr-2 h-4 w-4 text-gray-500"/> Среднее время</span>
            <span className="font-bold text-gray-800">{averageTime}</span>
          </div>
        </div>

        {/* Кнопка "Забрать приз": используем градиент, но можно заменить на основной цвет темы */}
        {userResult.is_winner && userResult.prize_fund > 0 && (
            <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white border-0 shadow-lg shadow-amber-100/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-200/50 hover:-translate-y-0.5">
              Claim Your Prize
            </Button>
        )}
      </div>
    </div>
  );
} 