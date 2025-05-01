"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"

// Интерфейс пропсов остается прежним
interface QuestionCardProps {
  question: {
    id: string
    text: string
    options: {
      id: string
      text: string
    }[]
    correctAnswer: string
  }
  selectedAnswer: string | null
  isAnswerCorrect: boolean | null
  onSelectAnswer: (answerId: string) => void
}

export function QuestionCard({ question, selectedAnswer, isAnswerCorrect, onSelectAnswer }: QuestionCardProps) {
  // Логика определения стилей кнопки из quizlive
  const getButtonStyles = (optionId: string) => {
    if (isAnswerCorrect !== null) {
      // Показ результатов
      if (optionId === question.correctAnswer) {
        return "border-green-500 bg-green-50 text-green-700" // Правильный
      } else if (optionId === selectedAnswer && optionId !== question.correctAnswer) {
        return "border-red-500 bg-red-50 text-red-700" // Выбранный неправильный
      } else {
        return "border-gray-200 bg-white/50 text-gray-500" // Невыбранный неправильный / остальные
      }
    } else {
      // Режим выбора
      return optionId === selectedAnswer
        ? "border-indigo-500 bg-indigo-50 text-indigo-700" // Выбранный
        : "border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50" // Невыбранный (с hover)
    }
  }

  // Логика определения иконки из quizlive
  const getButtonIcon = (optionId: string) => {
    if (isAnswerCorrect !== null) {
      if (optionId === question.correctAnswer) {
        return <CheckCircle className="h-5 w-5 text-green-500" />
      } else if (optionId === selectedAnswer && optionId !== question.correctAnswer) {
        return <XCircle className="h-5 w-5 text-red-500" />
      }
    }
    return null
  }

  return (
    // Используем Card со светлыми стилями из quizlive
    <Card className="border border-gray-200 shadow-xl rounded-2xl bg-white/80 backdrop-blur-xl">
      <CardHeader className="text-center">
        <h2 className="text-xl font-medium">{question.text}</h2>
      </CardHeader>
      <CardContent className="flex flex-col space-y-3">
        {question.options.map((option) => (
          // Кнопка ответа со стилями и анимацией из quizlive
          <motion.button
            key={option.id}
            onClick={() => {
              // Логика клика остается прежней
              if (isAnswerCorrect === null && !selectedAnswer) {
                onSelectAnswer(option.id)
              }
            }}
            disabled={isAnswerCorrect !== null || selectedAnswer !== null}
            // Применяем вычисленные стили и базовые классы
            className={`flex justify-between items-center p-4 rounded-xl border-2 transition-colors ${getButtonStyles(option.id)}`}
            whileHover={isAnswerCorrect === null && !selectedAnswer ? { scale: 1.02 } : {}}
            whileTap={isAnswerCorrect === null && !selectedAnswer ? { scale: 0.98 } : {}}
          >
            <span className="text-left">{option.text}</span>
            {/* Отображаем иконку */} 
            {getButtonIcon(option.id)}
          </motion.button>
        ))}
      </CardContent>
    </Card>
  )
} 