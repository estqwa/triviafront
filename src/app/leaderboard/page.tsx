"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context'; // Для выделения текущего пользователя
import { getLeaderboard, PaginatedLeaderboardResponse, LeaderboardUserDTO } from '@/lib/api/leaderboard';
import { ApiError } from '@/lib/api/http-client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, ArrowLeft } from 'lucide-react'; // Иконки
import { motion } from 'framer-motion';

export default function LeaderboardPage() {
  const { user, isAuthenticated } = useAuth(); // Получаем текущего пользователя
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const pageSize = 15; // Количество пользователей на странице

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const data: PaginatedLeaderboardResponse = await getLeaderboard({ page: currentPage, page_size: pageSize });
        setLeaderboardData(data.users);
        setTotalUsers(data.total);
        setTotalPages(Math.ceil(data.total / pageSize));

      } catch (err) {
        console.error('Ошибка загрузки лидерборда:', err);
        setError((err as ApiError).error || 'Не удалось загрузить лидерборд');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentPage]);

  // Функции пагинации
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getMedal = (rank: number): string | null => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const formatPrize = (amount: number): string => {
    // Можно добавить форматирование валюты, если нужно
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="container py-12 relative"> 
      {/* Кнопка Назад */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-2"/>
        <h1 className="text-3xl font-bold">Лидерборд</h1>
        <p className="text-gray-500 mt-2">Рейтинг игроков по победам и призовым</p>
      </motion.div>

      {/* Состояния загрузки/ошибки */} 
      {loading && (
         <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
         </div>
      )}
      {error && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
           <Card className="border border-red-200 shadow-lg rounded-2xl bg-red-50/80 backdrop-blur-xl">
             <CardHeader><CardTitle className="text-center text-red-600">Ошибка!</CardTitle></CardHeader>
             <CardContent className="py-6 text-center text-red-600">
               <p>{error}</p>
             </CardContent>
           </Card>
         </motion.div>
      )}

      {/* Основной контент с таблицей */} 
      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-[80px] text-center">Ранг</TableHead>
                    <TableHead>Игрок</TableHead>
                    <TableHead className="text-right">Побед</TableHead>
                    <TableHead className="text-right">Призовые</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((player) => {
                    const medal = getMedal(player.rank);
                    const isCurrentUser = isAuthenticated && user?.id === player.user_id;
                    return (
                      <TableRow 
                        key={player.user_id} 
                        className={`${isCurrentUser ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'}`}
                      >
                        <TableCell className="font-medium text-center">
                          {medal ? <span className="text-xl">{medal}</span> : player.rank}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={player.profile_picture || undefined} alt={player.username} />
                              <AvatarFallback>{player.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{player.username} {isCurrentUser ? "(Вы)" : ""}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{player.wins_count}</TableCell>
                        <TableCell className="text-right font-mono">{formatPrize(player.total_prize_won)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>

            {/* Пагинация */} 
            {totalPages > 1 && (
              <CardFooter className="flex justify-between items-center py-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  Показано {leaderboardData.length} из {totalUsers} игроков
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePreviousPage} 
                    disabled={currentPage === 1}
                  >
                    Назад
                  </Button>
                  <span className="text-sm px-3 py-1.5">
                    Стр. {currentPage} из {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextPage} 
                    disabled={currentPage === totalPages}
                  >
                    Вперед
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </motion.div>
      )}

    </div>
  );
} 