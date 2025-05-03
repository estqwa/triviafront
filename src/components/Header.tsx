"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn, User, Trophy } from "lucide-react";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <Trophy className="h-6 w-6 text-indigo-600 mr-2" />
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
              Trivia Quiz
            </span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link 
            href="/" 
            className="transition-colors hover:text-indigo-600"
          >
            Главная
          </Link>
          <Link 
            href="/quizzes" 
            className="transition-colors hover:text-indigo-600"
          >
            Викторины
          </Link>
          <Link 
            href="/leaderboard" 
            className="transition-colors hover:text-indigo-600"
          >
            Таблица лидеров
          </Link>
        </nav>
        
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{user?.username || "Профиль"}</span>
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Выйти</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>Войти</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                  Регистрация
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 