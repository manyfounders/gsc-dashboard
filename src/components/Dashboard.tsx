import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Globe, RefreshCw, AlertCircle, Search, Smartphone, Table, MapPin, CalendarDays, Plus, X, MessageSquare, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, User, ArrowLeft, Mouse, Eye, Target, Loader2, ArrowUp } from 'lucide-react';
import { useMultiAccountSearchConsole, getCountryFlag, getCountryName } from '../hooks/useMultiAccountSearchConsole';
import { format } from 'date-fns';
import { SiteCardSkeleton } from './Skeleton';
import { Comments } from './Comments';
import { CommentPreview } from './CommentPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

// Импортируем countryData из хука
const countryData: Record<string, { name: string; flag: string }> = {
  'usa': { name: 'United States', flag: '🇺🇸' },
  'gbr': { name: 'United Kingdom', flag: '🇬🇧' },
  'deu': { name: 'Germany', flag: '🇩🇪' },
  'fra': { name: 'France', flag: '🇫🇷' },
  'esp': { name: 'Spain', flag: '🇪🇸' },
  'ita': { name: 'Italy', flag: '🇮🇹' },
  'nld': { name: 'Netherlands', flag: '🇳🇱' },
  'can': { name: 'Canada', flag: '🇨🇦' },
  'aus': { name: 'Australia', flag: '🇦🇺' },
  'jpn': { name: 'Japan', flag: '🇯🇵' },
  'kor': { name: 'South Korea', flag: '🇰🇷' },
  'chn': { name: 'China', flag: '🇨🇳' },
  'ind': { name: 'India', flag: '🇮🇳' },
  'bra': { name: 'Brazil', flag: '🇧🇷' },
  'mex': { name: 'Mexico', flag: '🇲🇽' },
  'rus': { name: 'Russia', flag: '🇷🇺' },
  'tur': { name: 'Turkey', flag: '🇹🇷' },
  'pol': { name: 'Poland', flag: '🇵🇱' },
  'swe': { name: 'Sweden', flag: '🇸🇪' },
  'nor': { name: 'Norway', flag: '🇳🇴' },
  'dnk': { name: 'Denmark', flag: '🇩🇰' },
  'fin': { name: 'Finland', flag: '🇫🇮' },
  'che': { name: 'Switzerland', flag: '🇨🇭' },
  'aut': { name: 'Austria', flag: '🇦🇹' },
  'bel': { name: 'Belgium', flag: '🇧🇪' },
  'prt': { name: 'Portugal', flag: '🇵🇹' },
  'grc': { name: 'Greece', flag: '🇬🇷' },
  'cze': { name: 'Czech Republic', flag: '🇨🇿' },
  'hun': { name: 'Hungary', flag: '🇭🇺' },
  'rou': { name: 'Romania', flag: '🇷🇴' },
  'bgr': { name: 'Bulgaria', flag: '🇧🇬' },
  'hrv': { name: 'Croatia', flag: '🇭🇷' },
  'svk': { name: 'Slovakia', flag: '🇸🇰' },
  'svn': { name: 'Slovenia', flag: '🇸🇮' },
  'est': { name: 'Estonia', flag: '🇪🇪' },
  'lva': { name: 'Latvia', flag: '🇱🇻' },
  'ltu': { name: 'Lithuania', flag: '🇱🇹' },
  'irl': { name: 'Ireland', flag: '🇮🇪' },
  'isr': { name: 'Israel', flag: '🇮🇱' },
  'are': { name: 'UAE', flag: '🇦🇪' },
  'sau': { name: 'Saudi Arabia', flag: '🇸🇦' },
  'tha': { name: 'Thailand', flag: '🇹🇭' },
  'sgp': { name: 'Singapore', flag: '🇸🇬' },
  'mys': { name: 'Malaysia', flag: '🇲🇾' },
  'idn': { name: 'Indonesia', flag: '🇮🇩' },
  'phl': { name: 'Philippines', flag: '🇵🇭' },
  'vnm': { name: 'Vietnam', flag: '🇻🇳' },
  'nzl': { name: 'New Zealand', flag: '🇳🇿' },
  'zaf': { name: 'South Africa', flag: '🇿🇦' },
  'arg': { name: 'Argentina', flag: '🇦🇷' },
  'chl': { name: 'Chile', flag: '🇨🇱' },
  'col': { name: 'Colombia', flag: '🇨🇴' },
  'per': { name: 'Peru', flag: '🇵🇪' },
  'ukr': { name: 'Ukraine', flag: '🇺🇦' },
  'srb': { name: 'Serbia', flag: '🇷🇸' },
  'mkd': { name: 'North Macedonia', flag: '🇲🇰' },
  'alb': { name: 'Albania', flag: '🇦🇱' },
  'bih': { name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  'mne': { name: 'Montenegro', flag: '🇲🇪' },
  'lux': { name: 'Luxembourg', flag: '🇱🇺' },
  'mlt': { name: 'Malta', flag: '🇲🇹' },
  'cyp': { name: 'Cyprus', flag: '🇨🇾' },
  'isl': { name: 'Iceland', flag: '🇮🇸' },
};

interface DashboardProps {
  apiKey: string;
  onDisconnect: () => void;
}

interface GoogleTokenResponse {
  access_token: string;
  error?: string;
  error_description?: string;
}


export const Dashboard: React.FC<DashboardProps> = ({ apiKey, onDisconnect }) => {

  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<{ query: string; siteUrl: string } | null>(null);
  const [querySortField, setQuerySortField] = useState<'site' | 'query' | 'clicks' | 'impressions' | 'ctr' | 'position'>('clicks');
  const [querySortDirection, setQuerySortDirection] = useState<'asc' | 'desc'>('desc');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [commentsSiteUrl, setCommentsSiteUrl] = useState<string>('');
  const [showAllSites, setShowAllSites] = useState(false);
  const [siteFilter, setSiteFilter] = useState<'clicks' | 'impressions' | 'position'>('clicks');
  const [connectedAccounts, setConnectedAccounts] = useState<Array<{
    email: string;
    apiKey: string;
    displayName: string;
    avatar?: string;
  }>>([{ email: 'primary', apiKey, displayName: 'Primary Account' }]);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const {
    isLoading,
    error,
    sites,
    websiteMetrics,
    selectedCountry,
    dateRange,
    loadingSites,
    loadSites,
    loadWebsiteMetrics,
    loadOverallAnalytics,
    setSelectedCountry,
    setDateRange,
    refreshData
  } = useMultiAccountSearchConsole(connectedAccounts);

  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [analyticsDialogSite, setAnalyticsDialogSite] = useState<string | null>(null);
  const [analyticsDialogData, setAnalyticsDialogData] = useState<any>(null);
  const [analyticsDialogLoading, setAnalyticsDialogLoading] = useState(false);
  
  // Состояния для временных фильтров
  const [tempDateRange, setTempDateRange] = useState(dateRange);
  const [tempSelectedCountry, setTempSelectedCountry] = useState(selectedCountry);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  useEffect(() => {
    if (sites.length > 0) {
      loadOverallAnalytics();
    }
  }, [sites, loadOverallAnalytics]);

  // Синхронизация временных фильтров с основными
  useEffect(() => {
    setTempDateRange(dateRange);
  }, [dateRange]);

  useEffect(() => {
    setTempSelectedCountry(selectedCountry);
  }, [selectedCountry]);

  // Убираем автоматический выбор сайта, чтобы показывать общую аналитику
  // useEffect(() => {
  //   if (sites.length > 0 && !selectedWebsite && !compareMode) {
  //     const firstSite = sites[0];
  //     setSelectedWebsite(firstSite.siteUrl);
  //     loadWebsiteMetrics(firstSite.siteUrl, selectedCountry || undefined);
  //   }
  // }, [sites, selectedWebsite, compareMode, loadWebsiteMetrics, selectedCountry]);





  const handleWebsiteToggle = async (siteUrl: string) => {
    const newSelected = selectedWebsites.includes(siteUrl)
      ? selectedWebsites.filter(url => url !== siteUrl)
      : [...selectedWebsites, siteUrl];
    
    setSelectedWebsites(newSelected);
    
    if (!selectedWebsites.includes(siteUrl)) {
      const existingMetrics = websiteMetrics.find(w => w.siteUrl === siteUrl);
      if (!existingMetrics) {
        await loadWebsiteMetrics(siteUrl);
      }
    }
  };



  const handleApplyFilters = async () => {
    setDateRange(tempDateRange);
    setSelectedCountry(tempSelectedCountry);
    
    // Обновляем метрики всех сайтов с новыми фильтрами
    await refreshData();
  };

  const handleResetFilters = () => {
    const defaultDateRange = {
      startDate: (() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 28);
        return start;
      })(),
      endDate: new Date()
    };
    setTempDateRange(defaultDateRange);
    setTempSelectedCountry(null);
    setDateRange(defaultDateRange);
    setSelectedCountry(null);
    loadOverallAnalytics();
  };



  const getSiteDisplayName = (siteUrl: string) => {
    if (siteUrl.startsWith('sc-domain:')) {
      return siteUrl.replace('sc-domain:', '');
    }
    return siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  };

  // Function to calculate performance color from red to green
  const getPerformanceColor = (siteUrl: string) => {
    const metrics = websiteMetrics.find(w => w.siteUrl === siteUrl);
    if (!metrics) return '#9CA3AF'; // Gray for no data
    
    // Get all metrics for comparison
    const allMetrics = websiteMetrics.filter(m => m.totalClicks > 0 && m.totalImpressions > 0);
    if (allMetrics.length === 0) return '#9CA3AF';
    
    // Calculate performance score based on clicks, impressions and CTR
    const performanceScore = (metrics.totalClicks * metrics.averageCtr) + (metrics.totalImpressions * 0.1);
    const maxScore = Math.max(...allMetrics.map(m => (m.totalClicks * m.averageCtr) + (m.totalImpressions * 0.1)));
    const minScore = Math.min(...allMetrics.map(m => (m.totalClicks * m.averageCtr) + (m.totalImpressions * 0.1)));
    
    // Normalize to 0-1 range
    const normalized = maxScore > minScore ? (performanceScore - minScore) / (maxScore - minScore) : 0.5;
    
    // Use a more varied color palette
    const colors = [
      '#EF4444', // Red (worst)
      '#F97316', // Orange
      '#F59E0B', // Amber
      '#EAB308', // Yellow
      '#84CC16', // Lime
      '#22C55E', // Green
      '#10B981', // Emerald
      '#14B8A6', // Teal
      '#06B6D4', // Cyan
      '#3B82F6', // Blue (best)
    ];
    
    const colorIndex = Math.floor(normalized * (colors.length - 1));
    return colors[colorIndex];
  };



  if (isLoading && sites.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Loading Dashboard</h2>
            <p className="text-gray-600">Fetching your Search Console data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && sites.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-gray-200 shadow-lg">
          <CardContent className="pt-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            <div className="flex gap-3 mt-6">
              <Button onClick={refreshData} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={onDisconnect} variant="outline" className="flex-1">
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoading && sites.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-gray-200 shadow-lg">
          <CardContent className="pt-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Sites Found</h2>
            <p className="text-gray-600 mb-6">
              No verified sites found in your Search Console account.
            </p>
            <Button onClick={onDisconnect} variant="outline">
              Disconnect
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }



  const handleQuerySort = (field: 'site' | 'query' | 'clicks' | 'impressions' | 'ctr' | 'position') => {
    if (querySortField === field) {
      setQuerySortDirection(querySortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setQuerySortField(field);
      setQuerySortDirection('desc');
    }
  };

  const getSortedQueries = () => {
    const allQueries: Array<{
      query: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
      siteUrl: string;
      siteName: string;
      countries: Array<{ country: string; flag: string; name: string }>;
    }> = [];

    selectedWebsites.forEach(siteUrl => {
      const metrics = websiteMetrics.find(w => w.siteUrl === siteUrl);
      if (metrics) {
        metrics.topQueries.forEach(query => {
          allQueries.push({
            ...query,
            siteUrl,
            siteName: getSiteDisplayName(siteUrl),
            countries: metrics.countryBreakdown.slice(0, 2).map(country => ({
              country: country.country,
              flag: getCountryFlag(country.country),
              name: getCountryName(country.country)
            }))
          });
        });
      }
    });

    return allQueries.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (querySortField) {
        case 'site':
          aValue = a.siteName;
          bValue = b.siteName;
          break;
        case 'query':
          aValue = a.query;
          bValue = b.query;
          break;
        case 'clicks':
          aValue = a.clicks;
          bValue = b.clicks;
          break;
        case 'impressions':
          aValue = a.impressions;
          bValue = b.impressions;
          break;
        case 'ctr':
          aValue = a.ctr;
          bValue = b.ctr;
          break;
        case 'position':
          aValue = a.position;
          bValue = b.position;
          break;
        default:
          aValue = a.clicks;
          bValue = b.clicks;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return querySortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (aValue as number) - (bValue as number);
        return querySortDirection === 'asc' ? comparison : -comparison;
      }
    });
  };

  const getSortedSites = () => {
    return sites
      .map(site => {
        const metrics = websiteMetrics.find(w => w.siteUrl === site.siteUrl);
        return { site, metrics };
      })
      .filter(item => item.metrics) // Только сайты с загруженными метриками
      .sort((a, b) => {
        if (!a.metrics || !b.metrics) return 0;
        
        let aValue: number;
        let bValue: number;
        
        switch (siteFilter) {
          case 'clicks':
            aValue = a.metrics.totalClicks;
            bValue = b.metrics.totalClicks;
            break;
          case 'impressions':
            aValue = a.metrics.totalImpressions;
            bValue = b.metrics.totalImpressions;
            break;
          case 'position':
            // Для позиции инвертируем значения, так как меньшее значение = лучше
            aValue = -a.metrics.averagePosition;
            bValue = -b.metrics.averagePosition;
            break;
          default:
            aValue = a.metrics.totalClicks;
            bValue = b.metrics.totalClicks;
        }
        
        // Для всех параметров - сортировка по убыванию (лучшие показатели сверху)
        return bValue - aValue;
      })
      .map(item => item.site);
  };

  const getTrendData = (dailyData: Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }>) => {
    if (!dailyData || dailyData.length < 7) return { trend: 'neutral', change: 0 };
    
    // Берем последние 7 дней
    const last7Days = dailyData.slice(-7);
    const firstHalf = last7Days.slice(0, 3); // Первые 3 дня
    const secondHalf = last7Days.slice(-3); // Последние 3 дня
    
    // Считаем средние значения для кликов
    const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.clicks, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.clicks, 0) / secondHalf.length;
    
    if (firstHalfAvg === 0) return { trend: 'neutral', change: 0 };
    
    const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    if (changePercent > 5) return { trend: 'up', change: Math.round(changePercent) };
    if (changePercent < -5) return { trend: 'down', change: Math.round(Math.abs(changePercent)) };
    return { trend: 'neutral', change: 0 };
  };

  const handleAddAccount = () => {
    setShowAddAccountModal(true);
  };

  const handleRemoveAccount = (email: string) => {
    if (connectedAccounts.length > 1) {
      setConnectedAccounts(prev => prev.filter(acc => acc.email !== email));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsAddingAccount(true);
      
      // Проверяем что Google Identity Services загружен
      if (!window.google) {
        throw new Error('Google Identity Services not loaded');
      }

      // Настройка Google OAuth
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: '465841292980-s44el5p1ftjugodt7aebqnlj6qs8qre0.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/webmasters.readonly profile email',
        callback: async (response: GoogleTokenResponse) => {
          try {
            if (response.access_token) {
              // Получаем информацию о пользователе
              const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                  'Authorization': `Bearer ${response.access_token}`
                }
              });
              
              const userData = await userResponse.json();
              
              const newAccount = {
                email: userData.email,
                apiKey: response.access_token,
                displayName: userData.name || userData.email,
                avatar: userData.picture
              };
              
              setConnectedAccounts(prev => [...prev, newAccount]);
              setShowAddAccountModal(false);
              setIsAddingAccount(false);
            }
          } catch (error) {
            console.error('Failed to get user info:', error);
            setIsAddingAccount(false);
          }
        }
        // error_callback не поддерживается в текущих типах TypeScript
        // error_callback: (error: any) => {
        //   console.error('OAuth error:', error);
        //   setIsAddingAccount(false);
        // }
      });

      // Запускаем OAuth поток
      client.requestAccessToken();
      
    } catch (error) {
      console.error('Failed to initialize Google OAuth:', error);
      setIsAddingAccount(false);
    }
  };

  const SortableHeader: React.FC<{
    field: 'site' | 'query' | 'clicks' | 'impressions' | 'ctr' | 'position';
    children: React.ReactNode;
    className?: string;
  }> = ({ field, children, className }) => (
    <th 
      className={`cursor-pointer ${className || ''}`}
      onClick={() => handleQuerySort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {querySortField === field && (
          querySortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </th>
  );

  const handleOpenAnalyticsDialog = async (siteUrl: string) => {
    setAnalyticsDialogSite(siteUrl);
    setAnalyticsDialogOpen(true);
    setAnalyticsDialogLoading(true);
    try {
      // Можно использовать getSiteMetricsWithDates или getSiteMetrics
      const account = connectedAccounts[0];
      const api = new (await import('../services/searchConsoleApi')).SearchConsoleApi({ accessToken: account.apiKey });
      const data = await api.getSiteMetrics(siteUrl, 28);
      // Для страниц (pages)
      const pagesQuery = {
        startDate: (new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        endDate: (new Date()).toISOString().split('T')[0],
        dimensions: ['page'] as ('page')[],
        rowLimit: 20,
      };
      const pagesResp = await api.getSearchAnalytics(siteUrl, pagesQuery);
      const topPages = (pagesResp.rows || []).map(row => ({
        page: row.keys?.[0] || '',
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
      setAnalyticsDialogData({ ...data, topPages });
    } catch (e) {
      setAnalyticsDialogData(null);
    }
    setAnalyticsDialogLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className={`bg-white border-r border-gray-200 shadow-sm flex flex-col transition-all duration-300 ${
        isLeftPanelCollapsed ? 'w-16' : 'w-80'
      }`}>
        {/* Collapse/Expand Button */}
        <div className="p-2 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            className="w-full"
          >
            {isLeftPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {!isLeftPanelCollapsed && (
          <>
            {/* Navigation */}
            <div className="p-6 space-y-4">

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Connected Accounts</h3>
                <div className="space-y-2">
                  {connectedAccounts.map((account, index) => (
                    <div key={account.email} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {account.displayName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {account.email}
                          </p>
                        </div>
                      </div>
                      {connectedAccounts.length > 1 && index > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveAccount(account.email)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button 
                    onClick={handleAddAccount}
                    variant="outline" 
                    className="w-full justify-start border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Google Account
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Actions</h3>
                <div className="space-y-2">
                  <Button 
                    onClick={refreshData} 
                    variant="outline" 
                    disabled={isLoading} 
                    className="w-full justify-start border-gray-300"
                  >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
                  <Button 
                    onClick={onDisconnect} 
                    variant="outline" 
                    className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
            </div>

            {/* Footer */}
            <div className="mt-auto p-6 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <p>Google Search Console</p>
                <p>Analytics Dashboard</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="w-full p-8 space-y-8 max-w-none">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters Row */}
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-6 flex-wrap">
              {/* Country Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Country:</span>
                </div>
                <Select 
                  value={tempSelectedCountry || 'all'} 
                  onValueChange={(value) => setTempSelectedCountry(value === 'all' ? null : value)}
                >
                  <SelectTrigger className="text-xs border-gray-200 w-full sm:w-auto">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {Object.keys(countryData).map(country => (
                      <SelectItem key={country} value={country}>
                        <div className="flex items-center gap-2">
                          <span>{getCountryFlag(country)}</span>
                          <span>{getCountryName(country)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tempSelectedCountry && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    Filtered by {tempSelectedCountry.toUpperCase()}
                  </Badge>
                )}
              </div>

              {/* Date Range Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Date Range:</span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="start-date" className="text-sm whitespace-nowrap">From:</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={format(tempDateRange.startDate, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const start = new Date(e.target.value);
                        const end = tempDateRange.endDate;
                        if (start <= end) {
                          setTempDateRange({ startDate: start, endDate: end });
                        }
                      }}
                      disabled={isLoading}
                      className="w-full sm:w-auto border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="end-date" className="text-sm whitespace-nowrap">To:</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={format(tempDateRange.endDate, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const start = tempDateRange.startDate;
                        const end = new Date(e.target.value);
                        if (start <= end) {
                          setTempDateRange({ startDate: start, endDate: end });
                        }
                      }}
                      disabled={isLoading}
                      className="w-full sm:w-auto border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {/* Select для пресетов дат */}
                <Select
                  onValueChange={(value) => {
                    const end = new Date();
                    const start = new Date();
                    if (value === '7') start.setDate(end.getDate() - 7);
                    else if (value === '14') start.setDate(end.getDate() - 14);
                    else if (value === '28') start.setDate(end.getDate() - 28);
                    else if (value === '90') start.setDate(end.getDate() - 90);
                    setTempDateRange({ startDate: start, endDate: end });
                  }}
                  value={(() => {
                    const now = new Date();
                    const diff = Math.round((now.getTime() - tempDateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (diff === 7) return '7';
                    if (diff === 14) return '14';
                    if (diff === 28) return '28';
                    if (diff >= 85 && diff <= 92) return '90';
                    return '';
                  })()}
                >
                  <SelectTrigger className="w-44 text-xs border-gray-200">
                    <SelectValue placeholder="Быстрый выбор" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="14">Last 14 days</SelectItem>
                    <SelectItem value="28">Last 28 days</SelectItem>
                    <SelectItem value="90">Last 3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Кнопки Apply и Reset */}
            <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                disabled={isLoading}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Reset
              </Button>
              <Button
                onClick={handleApplyFilters}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply Filters'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Site Selection for Compare Mode */}
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 flex items-center gap-3">
              <Table className="h-6 w-6" />
              Compare Websites
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Compare Mode
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Select multiple websites to compare all metrics in detail
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Фильтр и кнопка "Показать все" */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Сортировка по:</span>
                  <Select value={siteFilter} onValueChange={(value: 'clicks' | 'impressions' | 'position') => setSiteFilter(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clicks">Кликам</SelectItem>
                      <SelectItem value="impressions">Показам</SelectItem>
                      <SelectItem value="position">Позиции</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllSites(!showAllSites)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                {showAllSites ? 'Скрыть' : 'Показать все'}
              </Button>
            </div>

            <div className="space-y-4">
              {getSortedSites().slice(0, showAllSites ? undefined : 5).map((site) => {
                const isSelected = selectedWebsites.includes(site.siteUrl);
                const metrics = websiteMetrics.find(w => w.siteUrl === site.siteUrl);
                const isLoading = loadingSites.has(site.siteUrl);
                
                if (isLoading) {
                  return <SiteCardSkeleton key={site.siteUrl} />;
                }
                
                return (
                  <div 
                    key={site.siteUrl} 
                    className={`p-3 sm:p-4 rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-50 ${
                      isSelected 
                        ? 'bg-blue-50' 
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <Checkbox 
                        checked={isSelected}
                        className="border-gray-400 data-[state=checked]:bg-green-600 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWebsiteToggle(site.siteUrl);
                        }}
                      />
                      
                      {/* Название сайта и уровень доступа */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: getPerformanceColor(site.siteUrl) }}
                          />
                          <span
                            role="button"
                            tabIndex={0}
                            className="font-semibold truncate text-blue-600 hover:text-violet-600 underline underline-offset-2 transition-colors duration-150 cursor-pointer"
                            onClick={e => { e.stopPropagation(); handleOpenAnalyticsDialog(site.siteUrl); }}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenAnalyticsDialog(site.siteUrl); } }}
                          >
                            {getSiteDisplayName(site.siteUrl)}
                          </span>
                          <button
                            type="button"
                            title="Комментарии к сайту"
                            className="ml-1 p-1 rounded hover:bg-gray-100 transition-colors"
                            onClick={e => { e.stopPropagation(); setCommentsSiteUrl(site.siteUrl); setShowCommentsPanel(true); setIsRightPanelCollapsed(false); }}
                          >
                            <MessageSquare className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">{site.permissionLevel}</p>
                      </div>
                      
                      {/* Метрики - горизонтальное расположение с фиксированной шириной */}
                      <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                        {metrics ? (
                          <>
                            <div className="text-center w-16 lg:w-20">
                              <div className="text-xs text-gray-500 mb-1">Clicks</div>
                              <div className="font-bold text-gray-900">{metrics.totalClicks.toLocaleString()}</div>
                              {/* Тенденция кликов */}
                              {(() => {
                                const trendData = getTrendData(metrics.dailyData);
                                return (
                                  <div className="flex items-center justify-center gap-1 mt-1">
                                    {trendData.trend === 'up' ? (
                                      <TrendingUp className="h-3 w-3 text-green-600" />
                                    ) : trendData.trend === 'down' ? (
                                      <TrendingDown className="h-3 w-3 text-red-600" />
                                    ) : null}
                                    {trendData.change > 0 && (
                                      <span className={`text-xs font-medium ${
                                        trendData.trend === 'up' ? 'text-green-600' : 
                                        trendData.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                                      }`}>
                                        {trendData.change}%
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="text-center w-20 lg:w-24">
                              <div className="text-xs text-gray-500 mb-1">Impressions</div>
                              <div className="font-bold text-gray-900">{metrics.totalImpressions.toLocaleString()}</div>
                            </div>
                            <div className="text-center w-14 lg:w-16">
                              <div className="text-xs text-gray-500 mb-1">CTR</div>
                              <div className="font-bold text-gray-900">{(metrics.averageCtr * 100).toFixed(1)}%</div>
                            </div>
                            <div className="text-center w-16 lg:w-20">
                              <div className="text-xs text-gray-500 mb-1">Position</div>
                              <div className="font-bold text-gray-900">{metrics.averagePosition.toFixed(1)}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-center w-16 lg:w-20">
                              <div className="text-xs text-gray-500 mb-1">Clicks</div>
                              <div className="font-bold text-gray-400">--</div>
                            </div>
                            <div className="text-center w-20 lg:w-24">
                              <div className="text-xs text-gray-500 mb-1">Impressions</div>
                              <div className="font-bold text-gray-400">--</div>
                            </div>
                            <div className="text-center w-14 lg:w-16">
                              <div className="text-xs text-gray-500 mb-1">CTR</div>
                              <div className="font-bold text-gray-400">--</div>
                            </div>
                            <div className="text-center w-16 lg:w-20">
                              <div className="text-xs text-gray-500 mb-1">Position</div>
                              <div className="font-bold text-gray-400">--</div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Комментарии с фиксированной шириной */}
                      <div className="w-48 flex-shrink-0">
                        <CommentPreview 
                          siteUrl={site.siteUrl} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Индикатор скрытых сайтов */}
              {!showAllSites && getSortedSites().length > 5 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center text-sm text-gray-600">
                    Показано 5 из {getSortedSites().length} сайтов. 
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setShowAllSites(true)}
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto ml-1"
                    >
                      Показать все
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comparison Tables */}
        {selectedWebsites.length > 0 && (
          <>
            {/* Top Queries Comparison */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                  <Search className="h-5 w-5" />
                  Top Queries Comparison
                </CardTitle>
                <CardDescription className="text-gray-600">
                  All top performing queries across selected websites (click headers to sort)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-gray-900 text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50">
                        <SortableHeader field="site" className="text-left py-4 px-6 text-gray-700 font-semibold">
                          Site
                        </SortableHeader>
                        <SortableHeader field="query" className="text-left py-4 px-6 text-gray-700 font-semibold">
                          Query
                        </SortableHeader>
                        <SortableHeader field="clicks" className="text-right py-4 px-6 text-gray-700 font-semibold">
                          Clicks
                        </SortableHeader>
                        <SortableHeader field="impressions" className="text-right py-4 px-6 text-gray-700 font-semibold">
                          Impressions
                        </SortableHeader>
                        <SortableHeader field="ctr" className="text-right py-4 px-6 text-gray-700 font-semibold">
                          CTR
                        </SortableHeader>
                        <SortableHeader field="position" className="text-right py-4 px-6 text-gray-700 font-semibold">
                          Position
                        </SortableHeader>
                        <th className="text-left py-4 px-6 text-gray-700 font-semibold">Countries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedQueries().map((query) => (
                        <tr key={`${query.query}-${query.siteUrl}`} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: getPerformanceColor(query.siteUrl) }}
                              />
                              <span className="font-medium">{query.siteName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{query.query}</p>
                            </div>
                          </td>
                          <td className="text-right py-4 px-6 font-bold">
                            {query.clicks.toLocaleString()}
                          </td>
                          <td className="text-right py-4 px-6">
                            {query.impressions.toLocaleString()}
                          </td>
                          <td className="text-right py-4 px-6">
                            {(query.ctr * 100).toFixed(2)}%
                          </td>
                          <td className="text-right py-4 px-6">
                            {query.position.toFixed(1)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1">
                              {query.countries.map((country, countryIndex) => (
                                <Badge 
                                  key={country.country}
                                  variant="outline" 
                                  className={`text-xs ${
                                    countryIndex === 0 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-green-50 text-green-700 border-green-200'
                                  }`}
                                >
                                  <span className="mr-1">{country.flag}</span>
                                  {country.name}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Device Breakdown Comparison */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                  <Smartphone className="h-5 w-5" />
                  Device Performance Comparison
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Traffic breakdown by device type across selected websites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-gray-900">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-6 text-gray-700 font-semibold">Website</th>
                        <th className="text-right py-4 px-6 text-gray-700 font-semibold">Desktop</th>
                        <th className="text-right py-4 px-6 text-gray-700 font-semibold">Mobile</th>
                        <th className="text-right py-4 px-6 text-gray-700 font-semibold">Tablet</th>
                        <th className="text-right py-4 px-6 text-gray-700 font-semibold">Mobile %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWebsites.map((siteUrl) => {
                        const metrics = websiteMetrics.find(w => w.siteUrl === siteUrl);
                        if (!metrics) return null;
                        
                        const desktop = metrics.deviceBreakdown.find(d => d.device === 'desktop')?.clicks || 0;
                        const mobile = metrics.deviceBreakdown.find(d => d.device === 'mobile')?.clicks || 0;
                        const tablet = metrics.deviceBreakdown.find(d => d.device === 'tablet')?.clicks || 0;
                        const total = desktop + mobile + tablet;
                        const mobilePercent = total > 0 ? Math.round((mobile / total) * 100) : 0;
                        
                        return (
                          <tr key={siteUrl} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: getPerformanceColor(siteUrl) }}
                                />
                                <span className="font-medium">{getSiteDisplayName(siteUrl)}</span>
                              </div>
                            </td>
                            <td className="text-right py-4 px-6 font-bold">
                              {desktop.toLocaleString()}
                            </td>
                            <td className="text-right py-4 px-6 font-bold">
                              {mobile.toLocaleString()}
                            </td>
                            <td className="text-right py-4 px-6 font-bold">
                              {tablet.toLocaleString()}
                            </td>
                            <td className="text-right py-4 px-6 font-bold">
                              {mobilePercent}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
                </div>
      </div>

      {/* Query Analytics Overlay */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Search className="h-6 w-6" />
                    Query Analytics: "{selectedQuery.query}"
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Detailed analytics for query on {getSiteDisplayName(selectedQuery.siteUrl)}
                  </p>
                </div>
                <Button 
                  onClick={() => setSelectedQuery(null)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Comparison
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {(() => {
                const metrics = websiteMetrics.find(w => w.siteUrl === selectedQuery.siteUrl);
                const queryData = metrics?.topQueries.find(q => q.query === selectedQuery.query);
                
                if (!queryData) {
                  return (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Query data not found or still loading.
                      </AlertDescription>
                    </Alert>
                  );
                }

                return (
                  <>
                    {/* Query Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-600 font-medium text-sm">Total Clicks</p>
                              <p className="text-3xl font-bold text-gray-900">{queryData.clicks.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <Mouse className="h-8 w-8 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-600 font-medium text-sm">Total Impressions</p>
                              <p className="text-3xl font-bold text-gray-900">{queryData.impressions.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                              <Eye className="h-8 w-8 text-green-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-600 font-medium text-sm">CTR</p>
                              <p className="text-3xl font-bold text-gray-900">{(queryData.ctr * 100).toFixed(1)}%</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                              <Target className="h-8 w-8 text-yellow-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-600 font-medium text-sm">Average Position</p>
                              <p className="text-3xl font-bold text-gray-900">{queryData.position.toFixed(1)}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                              <ArrowUp className="h-8 w-8 text-purple-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Country Performance for Query */}
                    {metrics?.countryBreakdown && metrics.countryBreakdown.length > 0 && (
                      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                            <Globe className="h-5 w-5" />
                            Geographic Performance
                          </CardTitle>
                          <CardDescription className="text-gray-600">
                            Performance breakdown by country for this query
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-gray-900">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Country</th>
                                  <th className="text-right py-3 px-4 text-gray-700 font-semibold">Clicks</th>
                                  <th className="text-right py-3 px-4 text-gray-700 font-semibold">Impressions</th>
                                  <th className="text-right py-3 px-4 text-gray-700 font-semibold">CTR</th>
                                  <th className="text-right py-3 px-4 text-gray-700 font-semibold">Position</th>
                                </tr>
                              </thead>
                              <tbody>
                                {metrics.countryBreakdown.map((country, index) => (
                                  <tr key={country.country} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-4 px-4">
                                      <div className="flex items-center gap-3">
                                        <Badge 
                                          variant="outline" 
                                          className={`${
                                            index === 0 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            index === 1 ? 'bg-green-50 text-green-700 border-green-200' :
                                            index === 2 ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                            'bg-gray-50 text-gray-700 border-gray-200'
                                          }`}
                                        >
                                          <span className="mr-1">{getCountryFlag(country.country)}</span>
                                          {getCountryName(country.country)}
                                        </Badge>
                                        <span className="font-medium">{country.countryName}</span>
                                      </div>
                                    </td>
                                    <td className="text-right py-4 px-4 font-bold">
                                      {country.clicks.toLocaleString()}
                                    </td>
                                    <td className="text-right py-4 px-4">
                                      {country.impressions.toLocaleString()}
                                    </td>
                                    <td className="text-right py-4 px-4">
                                      {(country.ctr * 100).toFixed(1)}%
                                    </td>
                                    <td className="text-right py-4 px-4">
                                      {country.position.toFixed(1)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Right Sidebar - Comments Panel */}
      {showCommentsPanel && (
        <div className={`bg-white border-l border-gray-200 shadow-sm flex flex-col transition-all duration-300 ${
          isRightPanelCollapsed ? 'w-16' : 'w-96'
        }`}>
          {/* Collapse/Expand Button */}
          <div className="p-2 border-b border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
              className="w-full"
            >
              {isRightPanelCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          {!isRightPanelCollapsed && (
            <div className="flex-1 overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Комментарии
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCommentsPanel(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {getSiteDisplayName(commentsSiteUrl)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Добавляйте комментарии и заметки для этого сайта
                  </p>
                </div>

                <Comments siteUrl={commentsSiteUrl} siteName={getSiteDisplayName(commentsSiteUrl)} />
              </div>
            </div>
          )}
        </div>
      )}
      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add Google Account</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddAccountModal(false)}
                  disabled={isAddingAccount}
                  className="h-8 w-8 p-0 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Connect Additional Google Account
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Sign in with another Google account to access Search Console data from multiple accounts in one dashboard.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleGoogleLogin}
                    disabled={isAddingAccount}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isAddingAccount ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => setShowAddAccountModal(false)}
                    disabled={isAddingAccount}
                    variant="outline"
                    className="w-full disabled:opacity-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={analyticsDialogOpen} onOpenChange={open => { setAnalyticsDialogOpen(open); if (!open) setAnalyticsDialogSite(null); }}>
        <DialogContent className="max-w-2xl w-full bg-white">
          <DialogHeader>
            <DialogTitle>Аналитика сайта {analyticsDialogSite && getSiteDisplayName(analyticsDialogSite)}</DialogTitle>
            <DialogDescription>Подробная статистика за последние 28 дней</DialogDescription>
          </DialogHeader>
          {analyticsDialogLoading ? (
            <div className="py-8 text-center text-gray-500">Загрузка...</div>
          ) : analyticsDialogData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Клики</div>
                  <div className="font-bold text-lg">{analyticsDialogData.totalClicks.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Показы</div>
                  <div className="font-bold text-lg">{analyticsDialogData.totalImpressions.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">CTR</div>
                  <div className="font-bold text-lg">{(analyticsDialogData.averageCtr * 100).toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Позиция</div>
                  <div className="font-bold text-lg">{analyticsDialogData.averagePosition.toFixed(1)}</div>
                </div>
              </div>
              {/* Страны */}
              <div>
                <div className="font-semibold mb-2">Топ страны</div>
                <div className="flex flex-wrap gap-2">
                  {analyticsDialogData.countryBreakdown?.slice(0, 10).map((c: any) => (
                    <Badge key={c.country} className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      {getCountryFlag(c.country)} {getCountryName(c.country)} — {c.clicks} кликов, {c.impressions} показов
                    </Badge>
                  ))}
                </div>
              </div>
              {/* Запросы */}
              <div>
                <div className="font-semibold mb-2">Топ запросы</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead><tr><th>Запрос</th><th>Клики</th><th>Показы</th><th>CTR</th><th>Позиция</th></tr></thead>
                    <tbody>
                      {analyticsDialogData.topQueries?.map((q: any) => (
                        <tr key={q.query}><td>{q.query}</td><td>{q.clicks}</td><td>{q.impressions}</td><td>{(q.ctr*100).toFixed(1)}%</td><td>{q.position.toFixed(1)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Страницы */}
              <div>
                <div className="font-semibold mb-2">Топ страницы</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead><tr><th>Страница</th><th>Клики</th><th>Показы</th><th>CTR</th><th>Позиция</th></tr></thead>
                    <tbody>
                      {analyticsDialogData.topPages?.map((p: any) => (
                        <tr key={p.page}><td className="max-w-[200px] truncate"><a href={p.page} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-violet-600 underline">{p.page}</a></td><td>{p.clicks}</td><td>{p.impressions}</td><td>{(p.ctr*100).toFixed(1)}%</td><td>{p.position.toFixed(1)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Устройства */}
              <div>
                <div className="font-semibold mb-2">Устройства</div>
                <div className="flex flex-wrap gap-2">
                  {analyticsDialogData.deviceBreakdown?.map((d: any) => (
                    <Badge key={d.device} className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                      {d.device}: {d.clicks} кликов, {d.impressions} показов, CTR {(d.ctr*100).toFixed(1)}%, поз. {d.position.toFixed(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">Нет данных</div>
          )}
          <DialogClose asChild>
            <Button variant="outline" className="mt-6 w-full">Закрыть</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
};