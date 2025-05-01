"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Quiz, getScheduledQuizzes } from "@/lib/api/quizzes";
import { compareDates } from "@/lib/utils/dateUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  // const { user, isAuthenticated, loading } = useAuth();
  const { loading } = useAuth();
  const [scheduledQuizzes, setScheduledQuizzes] = useState<Quiz[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchScheduledQuizzes = async () => {
      try {
        setError(null);
        const quizzes = await getScheduledQuizzes();
        const sortedQuizzes = quizzes.sort((a, b) => 
          compareDates(a.scheduled_time, b.scheduled_time)
        );
        setScheduledQuizzes(sortedQuizzes);
      } catch (err) {
        setError("Не удалось загрузить запланированные викторины");
        console.error(err);
      }
    };

    fetchScheduledQuizzes();
  }, []);

  const upcomingQuiz = scheduledQuizzes.find(q => compareDates(q.scheduled_time, new Date()) > 0) || null;

  useEffect(() => {
    const clearTimer = () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };

    if (upcomingQuiz) {
      const updateTimer = () => {
        const now = new Date();
        const diff = new Date(upcomingQuiz.scheduled_time).getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining("00:00:00");
          clearTimer();
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeRemaining(
          `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      };

      clearTimer();
      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
    } else {
      clearTimer();
      setTimeRemaining("");
    }

    return () => clearTimer();
  }, [upcomingQuiz]);

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
    <main className="flex flex-col items-center justify-center flex-1 px-4 py-12">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 mb-4">
          Live Trivia. Real Prizes.
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Join thousands of players in live quiz competitions and win cash prizes by answering questions correctly and
          quickly.
        </p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="w-full max-w-md">
        {loading && (
          <motion.div variants={item}>
            <Card className="border border-gray-200 shadow-xl rounded-2xl bg-white/80 backdrop-blur-xl">
              <CardContent className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mr-3"></div>
                <p className="text-muted-foreground">Загрузка информации...</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {error && (
          <motion.div variants={item}>
            <Card className="border border-red-200 shadow-lg rounded-2xl bg-red-50/80 backdrop-blur-xl">
              <CardContent className="py-8 text-center text-red-600">
                {error}
              </CardContent>
            </Card>
          </motion.div>
        )}
        {!loading && !error && upcomingQuiz && (
          <motion.div variants={item}>
            <Card className="border border-gray-200 shadow-xl rounded-2xl bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Next Game</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-500 mb-1">Игра начнется через:</p>
                  <p className="text-3xl font-mono font-bold text-indigo-600">{timeRemaining || "00:00:00"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-3 rounded-xl bg-indigo-50">
                    <DollarSign className="h-6 w-6 text-indigo-500 mb-1" />
                    <p className="text-gray-500 text-sm">Призовой фонд</p>
                    <p className="font-bold text-lg">${upcomingQuiz.prize_pool || 0}</p>
                  </div>

                  <div className="flex flex-col items-center p-3 rounded-xl bg-indigo-50">
                    <Users className="h-6 w-6 text-indigo-500 mb-1" />
                    <p className="text-gray-500 text-sm">Игроков</p>
                    <p className="font-bold text-lg">{upcomingQuiz.player_count || 0}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/quiz/${upcomingQuiz.id}/live`} className="w-full">
                  <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
                    Присоединиться
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        )}
        {!loading && !error && !upcomingQuiz && (
          <motion.div variants={item}>
            <Card className="border border-gray-200 shadow-xl rounded-2xl bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-center">No Upcoming Games</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-6">Пока нет запланированных игр.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div variants={item} className="flex justify-center gap-6 mt-8">
          <Link href="/how-to-play"> 
            <Button variant="outline">How to play</Button>
          </Link>
          <Link href="/quizzes">
            <Button variant="outline">View past games</Button> 
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
