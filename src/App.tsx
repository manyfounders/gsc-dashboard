import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LogOut, Shield, Settings, Menu, Search, Bell, MessageSquare, Table, ExternalLink, User, Plus, RefreshCw, Globe, X } from 'lucide-react';
import './App.css';
import { SearchProvider, useSearchContext } from '@/context/SearchContext';
import { SearchResults } from '@/components/SearchResults';

function SearchBar() {
  const { query, setQuery } = useSearchContext();
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        type="text"
        placeholder="Search anything..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-4 py-2 w-80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400">⌘F</span>
      <SearchResults />
    </div>
  );
}

function AppInner() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'indexing'>('dashboard');
  const [connectedAccounts, setConnectedAccounts] = useState<Array<{
    email: string;
    apiKey: string;
    displayName: string;
    avatar?: string;
  }>>([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  const GOOGLE_CLIENT_ID = '465841292980-s44el5p1ftjugodt7aebqnlj6qs8qre0.apps.googleusercontent.com';
  const GOOGLE_OAUTH_BACKEND = 'https://us-central1-symmetric-flow-428315-r5.cloudfunctions.net/oauthExchange';

  useEffect(() => {
    // Проверяем состояние авторизации при загрузке
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      // Загружаем подключенные аккаунты из Firestore
      if (user) {
        try {
          console.log('App: loading accounts for user:', user.uid);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('App: user data from Firestore:', userData);
            if (userData.access_token) {
              const account = {
                email: userData.email,
                apiKey: userData.access_token,
                displayName: userData.displayName || userData.email,
                avatar: userData.avatar
              };
              console.log('App: setting connected account:', account.email);
              setConnectedAccounts([account]);
            } else {
              console.log('App: no access_token found in user data');
            }
          } else {
            console.log('App: user document does not exist');
          }
        } catch (error) {
          console.error('Ошибка загрузки аккаунтов:', error);
        }
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (user: any) => {
    setUser(user);
  };

  const handleDisconnect = () => {
    // Функция для отключения (пока не используется)
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  const handleRemoveAccount = async (email: string) => {
    if (connectedAccounts.length > 1) {
      setConnectedAccounts((prev: Array<{ email: string; apiKey: string; displayName: string; avatar?: string; }>) => 
        prev.filter((acc: { email: string; apiKey: string; displayName: string; avatar?: string; }) => acc.email !== email)
      );
      
      // Удаляем из Firestore
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            access_token: null,
            refresh_token: null
          });
        } catch (error) {
          console.error('Ошибка удаления аккаунта из Firestore:', error);
        }
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsAddingAccount(true);
      if (!window.google) {
        throw new Error('Google Identity Services not loaded');
      }
      // Новый OAuth flow для получения code
      const client = (window.google.accounts.oauth2 as any).initCodeClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/webmasters.readonly',
        access_type: 'offline',
        prompt: 'consent',
        callback: async (response: { code?: string }) => {
          try {
            if (response.code) {
              // Отправляем code на Cloud Function для обмена на токены
              const backendResp = await fetch(GOOGLE_OAUTH_BACKEND, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: response.code, userId: user.uid })
              });
              const data = await backendResp.json();
              if (data.ok && data.user) {
                // Обновляем connectedAccounts
                const newAccount = {
                  email: data.user.email,
                  apiKey: data.user.access_token,
                  displayName: data.user.displayName || data.user.email,
                  avatar: data.user.avatar
                };
                setConnectedAccounts((prev: Array<{ email: string; apiKey: string; displayName: string; avatar?: string; }>) => {
                  // Проверяем, что аккаунт еще не добавлен
                  const exists = prev.find(acc => acc.email === newAccount.email);
                  if (exists) {
                    console.log('App: Аккаунт уже существует:', newAccount.email);
                    return prev;
                  }
                  console.log('App: Добавлен новый аккаунт:', newAccount.email);
                  console.log('App: Всего аккаунтов после добавления:', prev.length + 1);
                  return [...prev, newAccount];
                });
              }
              setIsAddingAccount(false);
            }
          } catch (error) {
            console.error('Failed to exchange code:', error);
            setIsAddingAccount(false);
          }
        }
      });
      client.requestCode();
    } catch (error) {
      setIsAddingAccount(false);
    }
  };

  const handleRefreshData = () => {
    // Функция обновления данных будет передана в Dashboard через пропсы
    if ((window as any).refreshDashboardData) {
      (window as any).refreshDashboardData();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-600 border-t-blue-500 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-ping"></div>
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white">GSC Dashboard</h3>
            <p className="text-slate-400">Подготовка интерфейса...</p>
          </div>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем экран авторизации
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Если пользователь авторизован, показываем основной интерфейс в стиле PayFlow
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Dark Sidebar */}
      <div className={`bg-slate-900 text-white flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-80'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-xl font-bold text-white">GSC Dashboard</h1>
                  <p className="text-xs text-slate-400">Search Console Analytics</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        {!sidebarCollapsed && (
          <div className="flex-1 p-6 space-y-6">
            {/* Sections */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Sections</h3>
              <div className="space-y-1">
                <Button 
                  onClick={() => setActiveTab('dashboard')} 
                  variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Table className="h-4 w-4 mr-3" />
                  Dashboard
                </Button>
                <Button 
                  onClick={() => setActiveTab('indexing')} 
                  variant={activeTab === 'indexing' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                >
                  <ExternalLink className="h-4 w-4 mr-3" />
                  Indexing API
                </Button>
              </div>
            </div>

            {/* Connected Accounts */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Connected Accounts</h3>
              <div className="space-y-2">
                {connectedAccounts.map((account, index) => (
                  <div key={account.email} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {account.displayName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {account.email}
                        </p>
                      </div>
                    </div>
                    {connectedAccounts.length > 1 && index > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveAccount(account.email)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button 
                  onClick={handleGoogleLogin}
                  variant="outline" 
                  disabled={isAddingAccount}
                  className="w-full justify-start border-dashed border-slate-600 hover:border-blue-400 hover:bg-slate-800 text-slate-300"
                >
                  {isAddingAccount ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-3 animate-spin" />
                      Подключение...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-3" />
                      Add Google Account
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Actions</h3>
              <div className="space-y-2">
                <Button 
                  onClick={handleRefreshData}
                  variant="outline" 
                  className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <RefreshCw className="h-4 w-4 mr-3" />
                  Refresh Data
                </Button>
                <Button 
                  onClick={handleDisconnect} 
                  variant="outline" 
                  className="w-full justify-start border-red-600 text-red-400 hover:bg-red-900/20"
                >
                  <Globe className="h-4 w-4 mr-3" />
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-slate-700 rounded-xl">
              <AvatarImage src={user.photoURL} alt={user.displayName || user.email} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium">
                {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            )}
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SearchBar />
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5 text-slate-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </Button>
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-5 w-5 text-slate-600" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <Dashboard 
            onDisconnect={handleDisconnect} 
            user={user} 
            settingsOpen={settingsOpen} 
            setSettingsOpen={setSettingsOpen}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            connectedAccounts={connectedAccounts}
            setConnectedAccounts={setConnectedAccounts}
            onRefreshData={handleRefreshData}
          />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <SearchProvider>
      <AppInner />
    </SearchProvider>
  );
}

export default App;