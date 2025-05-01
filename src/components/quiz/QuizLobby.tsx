"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, HelpCircle, DollarSign, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Quiz } from "@/lib/api/quizzes"; // Импортируем тип Quiz из API

interface QuizLobbyProps {
  quiz: Quiz // Используем тип Quiz из API
  // Убираем onReady, так как пока не ясно, как он будет использоваться
  // onReady: () => void
  onReadyClick: () => void; // Добавляем колбэк для кнопки
}

export function QuizLobby({ quiz, onReadyClick }: QuizLobbyProps) {
  const [timeRemaining, setTimeRemaining] = useState("")
  const [progress, setProgress] = useState(0)
  const [isReady, setIsReady] = useState(false) // Оставляем локальное состояние готовности

  useEffect(() => {
    const calculateTimeRemaining = () => {
      // Используем scheduled_time из типа Quiz
      if (!quiz.scheduled_time) {
        setTimeRemaining("--:--")
        setProgress(0)
        return
      }
      const startTime = new Date(quiz.scheduled_time)
      const now = new Date()
      const diff = startTime.getTime() - now.getTime()
      // Добавляем 60 секунд (или другое значение) к общему времени для более плавного прогресса
      const totalDiff = startTime.getTime() - (now.getTime() - 60000)

      if (diff <= 0) {
        setTimeRemaining("00:00")
        setProgress(100)
        return
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)

      // Прогресс от 0 до 100 по мере приближения к startTime
      const progressValue = Math.max(0, 100 - (diff / totalDiff) * 100)
      setProgress(Math.min(progressValue, 100))
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [quiz.scheduled_time])

  const handleReady = () => {
    setIsReady(true)
    // Возможно, здесь будет отправка события на сервер
    // onReady()
    onReadyClick(); // Вызываем колбэк
  }

  // Mock chat messages (можно будет заменить на реальные)
  const chatMessages = [
    { id: 1, user: "Alex", message: "Всем привет! Готовы к игре?" },
    { id: 2, user: "Maria", message: "Да, жду с нетерпением!" },
    { id: 3, user: "Ivan", message: "Какая тема сегодня?" },
    { id: 4, user: "Elena", message: "Общие знания, написано же :)" },
    { id: 5, user: "Dmitry", message: "Кто-нибудь уже играл раньше?" },
    { id: 6, user: "Sofia", message: "Я играла, очень интересно!" },
    { id: 7, user: "Maxim", message: "Удачи всем!" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <Card className="h-full border border-gray-200 shadow-xl rounded-2xl bg-white/80 backdrop-blur-xl">
          <CardHeader>
            {/* Используем quiz.name */}
            <CardTitle>{quiz.name || `Викторина #${quiz.id}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             {/* Используем quiz.description */}
            <p className="text-gray-600">{quiz.description || "Описание отсутствует."}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Игра начнется через:</span>
                <span className="font-mono font-bold">{timeRemaining}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-3 rounded-xl bg-indigo-50">
                <DollarSign className="h-5 w-5 text-indigo-500 mb-1" />
                <p className="text-gray-500 text-xs">Приз</p>
                {/* Используем quiz.prize_pool */}
                <p className="font-bold">${quiz.prize_pool || 0}</p>
              </div>

              <div className="flex flex-col items-center p-3 rounded-xl bg-indigo-50">
                <Users className="h-5 w-5 text-indigo-500 mb-1" />
                <p className="text-gray-500 text-xs">Игроки</p>
                 {/* Используем quiz.player_count */}
                <p className="font-bold">{quiz.player_count || 0}</p>
              </div>

              <div className="flex flex-col items-center p-3 rounded-xl bg-indigo-50">
                <HelpCircle className="h-5 w-5 text-indigo-500 mb-1" />
                <p className="text-gray-500 text-xs">Вопросов</p>
                 {/* Используем quiz.question_count */}
                <p className="font-bold">{quiz.question_count || 0}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleReady}
              disabled={isReady} // Блокируем после нажатия
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              {isReady ? "Вы готовы!" : "Я готов!"}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="h-full border border-gray-200 shadow-xl rounded-2xl bg-white/80 backdrop-blur-xl flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Live Chat</CardTitle>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                 {/* Используем quiz.player_count */}
                <span>{quiz.player_count || 0} online</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow">
             {/* Устанавливаем высоту для ScrollArea */}
            <ScrollArea className="h-[350px] px-4"> 
              <div className="space-y-4 py-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      {msg.user.charAt(0)} 
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2 px-3 max-w-[85%] break-words">
                      <div className="font-medium text-xs text-gray-500">{msg.user}</div>
                      <div className="text-sm">{msg.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="pt-2 border-t border-gray-200 mt-auto">
            <div className="flex w-full gap-2">
              <Input placeholder="Сообщение..." disabled className="flex-1" />
              <Button size="sm" disabled>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}