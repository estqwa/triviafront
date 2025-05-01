"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { RegisterRequest } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const { login, register, error: authError, clearError, loading: authLoading } = useAuth();
  const router = useRouter();

  const isLoading = isSubmitting || authLoading;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setFormError(null);
    clearError();
    setEmail("");
    setPassword("");
    setUsername("");
    setConfirmPassword("");
  }

  const validateRegisterForm = (): boolean => {
    setFormError(null);
    clearError();
    if (!username || !email || !password || !confirmPassword) {
      setFormError("Пожалуйста, заполните все поля");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError("Пожалуйста, введите корректный email");
      return false;
    }
    if (password.length < 6) {
      setFormError("Пароль должен содержать минимум 6 символов");
      return false;
    }
    if (password !== confirmPassword) {
      setFormError("Пароли не совпадают");
      return false;
    }
    return true;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError("Пожалуйста, заполните email и пароль");
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    clearError();
    try {
      await login(email, password);
      router.push("/");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      setFormError('Ошибка входа. Пожалуйста, проверьте ваш email и пароль.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegisterForm()) {
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    clearError();
    try {
      const registerData: RegisterRequest = { username, email, password };
      await register(registerData);
      router.push("/");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      setFormError('Ошибка регистрации. Возможно, пользователь с таким email или именем уже существует.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-12 relative">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border border-gray-200 shadow-xl rounded-2xl bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {activeTab === "login" ? "Вход в аккаунт" : "Создание аккаунта"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login"
                ? "Войдите, чтобы участвовать в викторинах"
                : "Зарегистрируйтесь, чтобы начать играть"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Вход</TabsTrigger>
                <TabsTrigger value="register">Регистрация</TabsTrigger>
              </TabsList>

              {(formError || authError) && (
                <div className="p-3 mb-4 rounded-md bg-red-50 text-red-600 text-sm text-center">
                  {formError || authError}
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: activeTab === "login" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: activeTab === "login" ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value="login" className="mt-0">
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="your@email.com"
                            className="pl-10"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Пароль</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-gray-400"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                      >
                        {isLoading ? "Вход..." : "Войти"}
                      </Button>

                      <p className="text-center text-sm text-gray-500">
                        Нет аккаунта?{" "}
                        <button
                          type="button"
                          className="font-medium text-indigo-600 hover:underline"
                          onClick={() => handleTabChange("register")}
                          disabled={isLoading}
                        >
                          Зарегистрироваться
                        </button>
                      </p>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="mt-0">
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-username">Имя пользователя</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="register-username"
                            type="text"
                            placeholder="username"
                            className="pl-10"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="your@email.com"
                            className="pl-10"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-password">Пароль</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-gray-400"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Повторите пароль</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-gray-400"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                      >
                        {isLoading ? "Создание..." : "Создать аккаунт"}
                      </Button>

                      <p className="text-center text-sm text-gray-500">
                        Уже есть аккаунт?{" "}
                        <button
                          type="button"
                          className="font-medium text-indigo-600 hover:underline"
                          onClick={() => handleTabChange("login")}
                          disabled={isLoading}
                        >
                          Войти
                        </button>
                      </p>
                    </form>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 