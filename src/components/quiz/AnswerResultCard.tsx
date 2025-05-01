"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock } from "lucide-react"

// Интерфейс пропсов остается прежним
interface AnswerResultCardProps {
  isCorrect: boolean
  points: number
  time: number
}

export function AnswerResultCard({ isCorrect, points, time }: AnswerResultCardProps) {
  return (
    // Анимация из quizlive
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Card со светлыми стилями из quizlive */}
      <Card
        className={`border-2 ${ // Используем border-2 для акцента
          isCorrect ? "border-emerald-500 bg-emerald-500/10" : "border-destructive bg-destructive/10"
        } rounded-xl shadow-md`} // Используем rounded-xl и shadow-md
      >
        <CardContent className="p-4 flex items-center justify-between"> {/* p-4 как в quizlive */}
          <div className="flex items-center gap-3">
            {/* Иконка и фон с использованием цветов темы */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${ 
                isCorrect ? "bg-emerald-500/20" : "bg-destructive/20"
              }`}
            >
              {isCorrect ? <CheckCircle className="h-6 w-6 text-emerald-500" /> : <XCircle className="h-6 w-6 text-destructive" />}
            </div>
            {/* Текст результата */}
            <div>
              <h3 className="font-medium">{isCorrect ? "Правильно! 🎉" : "Неправильно! 😢"}</h3>
              {/* Используем text-emerald-600 для очков */}
              {isCorrect && <p className="text-sm text-emerald-600">+{points} очков</p>} 
            </div>
          </div>
          {/* Отображение времени: используем text-muted-foreground */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{time} сек</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 