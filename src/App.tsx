import { useState, useEffect } from 'react';
import { ApiKeySetup } from './components/ApiKeySetup';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { auth } from './lib/firebase';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
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
    <div className="App">
      {/* Header с информацией о пользователе и кнопкой выхода */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user.email ? user.email[0].toUpperCase() : 'U'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user.displayName || user.email || 'Пользователь'}
            </p>
            <p className="text-xs text-gray-500">
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          Выйти
        </button>
      </div>

      {/* Основной контент */}
      {!apiKey ? (
        <ApiKeySetup onApiKeySubmit={handleApiKeySubmit} />
      ) : (
        <Dashboard apiKey={apiKey} onDisconnect={handleDisconnect} />
      )}
    </div>
  );
}

export default App;