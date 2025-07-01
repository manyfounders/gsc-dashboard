import { useState, useEffect } from 'react';
import { ApiKeySetup } from './components/ApiKeySetup';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { auth } from './lib/firebase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, Settings, Shield } from 'lucide-react';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем состояние авторизации при загрузке
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (user: any) => {
    setUser(user);
  };

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
  };

  const handleDisconnect = () => {
    setApiKey(null);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setApiKey(null);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-ping"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Загрузка GSC Dashboard</h3>
            <p className="text-sm text-gray-600">Подготовка интерфейса...</p>
          </div>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем экран авторизации
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Если пользователь авторизован, показываем основной интерфейс
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Современный Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Логотип и название */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  GSC Dashboard
                </h1>
                <p className="text-xs text-gray-500">Search Console Analytics</p>
              </div>
            </div>

            {/* Информация о пользователе */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Подключено
                </Badge>
                <Separator orientation="vertical" className="h-6" />
              </div>
              
              <div className="flex items-center space-x-3">
                <Avatar className="h-9 w-9 border-2 border-gray-200">
                  <AvatarImage src={user.photoURL} alt={user.displayName || user.email} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium">
                    {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Кнопки действий */}
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="text-gray-600 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Выйти</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!apiKey ? (
          <ApiKeySetup onApiKeySubmit={handleApiKeySubmit} />
        ) : (
          <Dashboard apiKey={apiKey} onDisconnect={handleDisconnect} />
        )}
      </main>
    </div>
  );
}

export default App;