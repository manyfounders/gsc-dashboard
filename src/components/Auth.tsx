import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Loader2,
  CheckCircle,
  Shield
} from 'lucide-react';
import { 
  auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from '@/lib/firebase';

interface AuthProps {
  onAuthSuccess: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        onAuthSuccess(user);
      }
    });

    return () => unsubscribe();
  }, [onAuthSuccess]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccess('Успешная авторизация через Google!');
    } catch (err: any) {
      setError(err.message || 'Ошибка при авторизации через Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess('Успешная авторизация!');
    } catch (err: any) {
      setError(err.message || 'Ошибка при авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess('Аккаунт успешно создан!');
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании аккаунта');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSignIn = async () => {
    if (!phone) {
      setError('Пожалуйста, введите номер телефона');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      // Создаем reCAPTCHA
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': () => {
          // reCAPTCHA решена
        }
      });

      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setIsPhoneVerified(true);
      setSuccess('Код подтверждения отправлен на ваш телефон');
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке кода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('Пожалуйста, введите код подтверждения');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await confirmationResult.confirm(verificationCode);
      setSuccess('Телефон успешно подтвержден!');
    } catch (err: any) {
      setError('Неверный код подтверждения');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                GSC Dashboard
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Войдите в систему для доступа к аналитике
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Google Sign In */}
            <Button 
              onClick={handleGoogleSignIn} 
              disabled={isLoading}
              className="w-full h-12 bg-white text-gray-900 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all duration-200"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-3" />
              ) : (
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="font-medium">Войти через Google</span>
            </Button>

            <div className="relative">
              <Separator className="bg-gray-200" />
              <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-gray-500 font-medium">
                или
              </span>
            </div>

            {/* Tabs for Email/Phone */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="signin" 
                  onClick={clearMessages}
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-md transition-all duration-200"
                >
                  Вход
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  onClick={clearMessages}
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-md transition-all duration-200"
                >
                  Регистрация
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Пароль</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleEmailSignIn} 
                    disabled={isLoading}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg transition-all duration-200"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Войти
                  </Button>
                </div>

                <div className="relative">
                  <Separator className="bg-gray-200" />
                  <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-gray-500 font-medium">
                    или
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Номер телефона</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+7 (999) 123-45-67"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div id="recaptcha-container" className="flex justify-center"></div>

                  {!isPhoneVerified ? (
                    <Button 
                      onClick={handlePhoneSignIn} 
                      disabled={isLoading}
                      className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg transition-all duration-200"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Отправить код
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="code" className="text-sm font-medium text-gray-700">Код подтверждения</Label>
                        <Input
                          id="code"
                          type="text"
                          placeholder="123456"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          maxLength={6}
                          className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-center text-lg font-mono"
                        />
                      </div>
                      <Button 
                        onClick={handleVerifyCode} 
                        disabled={isLoading}
                        className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg transition-all duration-200"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Подтвердить
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">Пароль</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleEmailSignUp} 
                    disabled={isLoading}
                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg transition-all duration-200"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Создать аккаунт
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Error and Success Messages */}
            {error && (
              <Alert className="border-red-200 bg-red-50/50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50/50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 