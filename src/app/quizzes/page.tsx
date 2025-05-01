"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import React from 'react';
import { useAuth } from '../../lib/auth/auth-context';
import { getAvailableQuizzes, Quiz } from '../../lib/api/quizzes';
import { ApiError } from '../../lib/api/http-client';
import { formatDate, DateFormat } from '../../lib/utils/dateUtils';
import { Clock, PlayCircle, CheckCircle, List, Users, HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const getStatusInfo = (status: string): { text: string, color: string, bgColor: string, icon: React.ElementType } => {
    switch (status) {
      case 'scheduled':
        return { text: 'Запланирована', color: 'text-blue-500', bgColor: 'bg-blue-50', icon: Clock };
      case 'in_progress':
        return { text: 'В процессе', color: 'text-green-500', bgColor: 'bg-green-50', icon: PlayCircle };
      case 'completed':
        return { text: 'Завершена', color: 'text-purple-500', bgColor: 'bg-purple-50', icon: CheckCircle };
      default:
        return { text: status, color: 'text-gray-500', bgColor: 'bg-gray-50', icon: HelpCircle };
    }
  };

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const data = await getAvailableQuizzes();
        
        const sortedData = data.sort((a, b) => 
          (b.created_at ? new Date(b.created_at).getTime() : 0) - 
          (a.created_at ? new Date(a.created_at).getTime() : 0)
        );
        
        const latestQuizzes = sortedData.slice(0, 6);
        
        setQuizzes(latestQuizzes);
        setError(null);
      } catch (err) {
        console.error('Ошибка загрузки викторин:', err);
        setError((err as ApiError).error || 'Не удалось загрузить список викторин');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold">Доступные викторины</h1>
        <p className="text-gray-500 mt-2">Присоединяйтесь к викторинам, отвечайте на вопросы и выигрывайте призы</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card className="border border-red-200 shadow-lg rounded-2xl bg-red-50/80 backdrop-blur-xl max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Ошибка загрузки</CardTitle>
          </CardHeader>
          <CardContent className="py-6 text-center text-red-600">
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : quizzes.length === 0 ? (
         <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white/80 backdrop-blur-xl max-w-2xl mx-auto">
           <CardHeader>
             <CardTitle className="text-center">Нет доступных викторин</CardTitle>
           </CardHeader>
           <CardContent className="py-8 text-center text-gray-500">
             <List size={48} className="mx-auto text-gray-400 mb-4"/>
             <p>Пока нет запланированных игр. Загляните позже!</p>
           </CardContent>
         </Card>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {quizzes.map(quiz => {
            const statusInfo = getStatusInfo(quiz.status);
            let buttonText = "Подробнее";
            let buttonHref = `/quiz/${quiz.id}/results`;
            let buttonDisabled = false;
            let buttonTitle = "";
            let buttonClasses = "bg-gradient-to-r";

            if (quiz.status === 'scheduled') {
              buttonText = "Присоединиться";
              buttonHref = `/quiz/${quiz.id}/live`;
              buttonClasses += " from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700";
              if(!isAuthenticated) {
                 buttonDisabled = true;
                 buttonTitle = "Войдите, чтобы присоединиться";
                 buttonClasses = "bg-gray-300 text-gray-500 cursor-not-allowed";
              }
            } else if (quiz.status === 'in_progress') {
              buttonText = "Войти в игру";
              buttonHref = `/quiz/${quiz.id}/live`;
              buttonClasses += " from-green-500 to-green-600 hover:from-green-600 hover:to-green-700";
              if(!isAuthenticated) {
                 buttonDisabled = true;
                 buttonTitle = "Войдите, чтобы присоединиться";
                 buttonClasses = "bg-gray-300 text-gray-500 cursor-not-allowed";
              }
            } else if (quiz.status === 'completed') {
               buttonText = "Результаты";
               buttonHref = `/results/${quiz.id}`;
               buttonClasses += " from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700";
            }
            
            return (
              <motion.div key={quiz.id} variants={item}>
                <Card className="h-full border border-gray-200 shadow-lg rounded-2xl bg-white/80 backdrop-blur-xl hover:shadow-xl transition-shadow flex flex-col">
                  <CardHeader>
                    <CardTitle className="line-clamp-2" title={quiz.name}>{quiz.name || `Викторина #${quiz.id}`}</CardTitle>
                    <div className="flex items-center mt-2">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color} text-sm font-medium`}
                      >
                        <statusInfo.icon className="h-4 w-4" />
                        {statusInfo.text}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {quiz.description && <p className="text-gray-600 mb-4 line-clamp-3">{quiz.description}</p>}
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{quiz.question_count || 'N/A'} вопросов</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{formatDate(quiz.scheduled_time, DateFormat.SHORT)}</span>
                      </div>
                      {quiz.player_count !== undefined && (
                        <div className="flex items-center gap-2 col-span-2">
                           <Users className="h-4 w-4 text-gray-400 flex-shrink-0"/>
                           <span>{quiz.player_count.toLocaleString()} игроков</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="mt-auto">
                    <Button
                      asChild
                      size="default"
                      disabled={buttonDisabled}
                      className={`w-full rounded-lg text-white ${buttonClasses}`}
                      title={buttonTitle}
                    >
                      <Link 
                        href={buttonHref}
                        onClick={(e) => buttonDisabled && e.preventDefault()}
                      >
                        {buttonText}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
} 