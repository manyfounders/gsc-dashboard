import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, CheckCircle, AlertCircle, Loader2, Shield, Lock, Zap, BarChart3 } from 'lucide-react';
import { useSearchConsole } from '../hooks/useSearchConsole';

interface ApiKeySetupProps {
  onApiKeySubmit: (accessToken: string) => void;
}

const CLIENT_ID = '465841292980-s44el5p1ftjugodt7aebqnlj6qs8qre0.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/webmasters.readonly';

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { error, clearError } = useSearchConsole();

  const handleGoogleLogin = () => {
    setIsLoading(true);
    clearError();
    
    try {
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        throw new Error('Google OAuth client not loaded.');
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.access_token) {
            onApiKeySubmit(response.access_token);
      }
          setIsLoading(false);
        },
      });
      
      client.requestAccessToken();
    } catch (err) {
      console.error('OAuth error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Заголовок */}
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
            <BarChart3 className="h-10 w-10 text-white" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Search Console Analytics
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Подключите свой Google Search Console для просмотра детальной аналитики веб-сайтов
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Основная карточка подключения */}
          <div className="md:col-span-2">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Key className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Настройка API доступа</CardTitle>
                    <CardDescription>
                      Войдите через Google аккаунт для получения данных Search Console
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-blue-200 bg-blue-50/50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Для начала работы:</strong>
                    <ol className="mt-2 ml-4 space-y-1 list-decimal text-sm">
                      <li>Убедитесь, что у вас есть доступ к Google Search Console</li>
                      <li>Нажмите кнопку ниже для входа через Google</li>
                      <li>Предоставьте необходимые разрешения при запросе</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert className="border-red-200 bg-red-50/50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Ошибка:</strong> {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleGoogleLogin}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg transition-all duration-200" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Подключение...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Войти через Google</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Боковая панель с преимуществами */}
          <div className="space-y-4">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Возможности
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Аналитика сайтов</p>
                      <p className="text-xs text-gray-500">Детальная статистика по всем вашим сайтам</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Сравнение данных</p>
                      <p className="text-xs text-gray-500">Сравнивайте показатели между сайтами</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Визуализация</p>
                      <p className="text-xs text-gray-500">Красивые графики и диаграммы</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Безопасность
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Lock className="h-4 w-4" />
                  <span>Данные защищены OAuth 2.0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Ваши данные безопасно передаются через систему OAuth Google
          </p>
        </div>
      </div>
    </div>
  );
};