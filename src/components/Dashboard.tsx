import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Globe, RefreshCw, AlertCircle, Search, Smartphone, MapPin, CalendarDays, MessageSquare, ChevronUp, ChevronDown, ArrowLeft, Mouse, Eye, Target, Loader2, ArrowUp, ExternalLink, Filter } from 'lucide-react';
import { useMultiAccountSearchConsole, getCountryFlag, getCountryName } from '../hooks/useMultiAccountSearchConsole';
import { format } from 'date-fns';
import { SiteCardSkeleton, LoadingSpinner } from './Skeleton';
import { Comments } from './Comments';
import { IndexingApi } from './IndexingApi';
import { ApiTest } from './ApiTest';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { commentsService } from '../services/commentsService';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useSearchContext } from '@/context/SearchContext';

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
  onDisconnect: () => void;
  user: any;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  activeTab: 'dashboard' | 'indexing';
  setActiveTab: (tab: 'dashboard' | 'indexing') => void;
  connectedAccounts: Array<{
    email: string;
    apiKey: string;
    displayName: string;
    avatar?: string | undefined;
  }>;
  setConnectedAccounts: React.Dispatch<React.SetStateAction<Array<{
    email: string;
    apiKey: string;
    displayName: string;
    avatar?: string | undefined;
  }>>>;
  onRefreshData: () => void;
}

// type ConnectedAccount = {
//   email: string;
//   apiKey: string;
//   displayName: string;
//   avatar?: string;
// };

const GOOGLE_CLIENT_ID = '465841292980-s44el5p1ftjugodt7aebqnlj6qs8qre0.apps.googleusercontent.com';
const GOOGLE_OAUTH_BACKEND = 'https://us-central1-symmetric-flow-428315-r5.cloudfunctions.net/oauthExchange';

export const Dashboard: React.FC<DashboardProps> = ({ onDisconnect, user, settingsOpen, setSettingsOpen, activeTab, setActiveTab: _setActiveTab, connectedAccounts, setConnectedAccounts, onRefreshData: _onRefreshData }) => {

  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<{ query: string; siteUrl: string } | null>(null);
  const [querySortField, setQuerySortField] = useState<'site' | 'query' | 'clicks' | 'impressions' | 'ctr' | 'position'>('clicks');
  const [querySortDirection, setQuerySortDirection] = useState<'asc' | 'desc'>('desc');
  // Удаляем неиспользуемые состояния
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [commentsSiteUrl, setCommentsSiteUrl] = useState<string>('');
  const [showAllSites, setShowAllSites] = useState(false);
  const [sitesDisplayed, setSitesDisplayed] = useState(false);
  const [siteFilter, setSiteFilter] = useState<'clicks' | 'impressions' | 'position' | 'geo'>('clicks');
  const [geoSortBy, setGeoSortBy] = useState<'clicks' | 'impressions'>('impressions');
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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
  } = useMultiAccountSearchConsole(connectedAccounts, user?.uid);

  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [analyticsDialogSite, setAnalyticsDialogSite] = useState<string | null>(null);
  const [analyticsDialogData, setAnalyticsDialogData] = useState<any>(null);
  const [analyticsDialogLoading, setAnalyticsDialogLoading] = useState(false);
  // Удаляем неиспользуемую переменную chartMetric
  const [chartPeriod, setChartPeriod] = useState<'7d' | '28d' | '3m' | '6m'>('28d');
  const [chartDateRange, setChartDateRange] = useState<{ startDate: Date; endDate: Date }>({
    startDate: (() => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 28);
      return start;
    })(),
    endDate: new Date()
  });
  const [selectedMetrics, setSelectedMetrics] = useState<Set<'clicks' | 'impressions' | 'ctr' | 'position'>>(new Set(['impressions']));
  
  // Состояния для временных фильтров
  const [tempDateRange, setTempDateRange] = useState(dateRange);
  const [tempSelectedCountry, setTempSelectedCountry] = useState(selectedCountry);
  const [commentsCount, setCommentsCount] = useState<Record<string, number>>({});
  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [tgTestMsg, setTgTestMsg] = useState('');
  const [tgLoading, setTgLoading] = useState(false);
  const [tgSaved, setTgSaved] = useState(false);
  const [tgError, setTgError] = useState('');
  // Новые состояния для уведомлений
  const [notifySites, setNotifySites] = useState<string[]>([]);
  const [notifyMetric, setNotifyMetric] = useState<'clicks'|'impressions'|'position'>('clicks');
  const [notifyPeriod, setNotifyPeriod] = useState<'hourly'|'daily'>('daily');
  const [notifySaved, setNotifySaved] = useState(false);
  const [notifyError, setNotifyError] = useState('');
  const [showApiTest, setShowApiTest] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [chartTooltip, setChartTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: any;
    metric: string;
  } | null>(null);

  // Получаем контекст поиска и отдаём индекс
  const { setIndex } = useSearchContext();

  useEffect(() => {
    // Загружаем сайты только если есть подключенные аккаунты
    if (connectedAccounts.length > 0) {
      console.log('useEffect: Загружаем сайты для аккаунтов:', connectedAccounts.map(acc => acc.email));
      loadSites();
    }
  }, [connectedAccounts, loadSites]);

  useEffect(() => {
    if (sites.length > 0) {
      loadOverallAnalytics();
    }
  }, [sites, loadOverallAnalytics]);

  // Собираем индекс для поиска при наличии данных
  useEffect(() => {
    try {
      const sitesIndex = (websiteMetrics || []).map(w => ({
        siteUrl: w.siteUrl,
        clicks: w.totalClicks || 0,
        impressions: w.totalImpressions || 0,
        ctr: w.totalImpressions ? (w.totalClicks / w.totalImpressions) : 0,
        position: w.averagePosition || 0,
      }));

      const queriesIndex = (websiteMetrics || []).flatMap(w => (w.topQueries || []).map((q: any) => ({
        query: q.query,
        clicks: q.clicks,
        impressions: q.impressions,
        ctr: q.ctr,
        position: q.position,
        siteUrl: w.siteUrl,
      })));

      const countriesIndex = (websiteMetrics || []).flatMap(w => (w.countryBreakdown || []).map((c: any) => ({
        country: c.country,
        countryName: getCountryName(c.country),
        clicks: c.clicks,
        impressions: c.impressions,
        ctr: c.ctr,
        position: c.position,
      })));

      const devicesIndex = (websiteMetrics || []).flatMap(w => (w.deviceBreakdown || []).map((d: any) => ({
        device: d.device,
        clicks: d.clicks,
        impressions: d.impressions,
        ctr: d.ctr,
        position: d.position,
        siteUrl: w.siteUrl,
      })));

      // Comments: агрегируем последние комментарии для индексации
      const commentsIndex: Array<{ id: string; siteUrl: string; siteName: string; content: string }> = [];
      // Пропускаем тяжелый запрос — index отрисуем из уже загруженных данных

      const items = [
        ...sitesIndex.map(s => ({
          id: `site:${s.siteUrl}`,
          type: 'site' as const,
          title: s.siteUrl,
          siteUrl: s.siteUrl,
          metrics: { clicks: s.clicks, impressions: s.impressions, ctr: s.ctr, position: s.position },
        })),
        ...queriesIndex.map((q, i) => ({
          id: `query:${q.siteUrl}:${q.query}:${i}`,
          type: 'query' as const,
          title: q.query,
          subtitle: q.siteUrl,
          siteUrl: q.siteUrl,
          metrics: { clicks: q.clicks, impressions: q.impressions, ctr: q.ctr, position: q.position },
        })),
        ...countriesIndex.map((c) => ({
          id: `country:${c.country}`,
          type: 'country' as const,
          title: getCountryName(c.country),
          subtitle: c.country.toUpperCase(),
          metrics: { clicks: c.clicks, impressions: c.impressions, ctr: c.ctr, position: c.position },
        })),
        ...devicesIndex.map((d, i) => ({
          id: `device:${d.device}:${i}`,
          type: 'device' as const,
          title: d.device,
          subtitle: d.siteUrl,
          siteUrl: d.siteUrl,
          metrics: { clicks: d.clicks, impressions: d.impressions, ctr: d.ctr, position: d.position },
        })),
        ...commentsIndex.map((c) => ({
          id: `comment:${c.id}`,
          type: 'comment' as const,
          title: c.content,
          subtitle: c.siteName,
          siteUrl: c.siteUrl,
        })),
      ];
      setIndex(items as any);
    } catch (e) {
      // no-op
    }
  }, [websiteMetrics, setIndex]);

  // Синхронизация временных фильтров с основными
  useEffect(() => {
    setTempDateRange(dateRange);
  }, [dateRange]);

  useEffect(() => {
    setTempSelectedCountry(selectedCountry);
  }, [selectedCountry]);

  // Функция для обновления количества комментариев
  const updateCommentsCount = async () => {
    const sitesList = getSortedSites();
    const counts: Record<string, number> = {};
    await Promise.all(sitesList.map(async (site) => {
      try {
        counts[site.siteUrl] = await commentsService.getCommentsCount(site.siteUrl);
      } catch (error) {
        console.error(`Ошибка получения количества комментариев для ${site.siteUrl}:`, error);
        counts[site.siteUrl] = 0;
      }
    }));
    setCommentsCount(counts);
  };

  // useEffect для commentsCount:
  useEffect(() => {
    updateCommentsCount();
  }, [sites, showAllSites]);

  // Обновляем количество комментариев при изменении комментариев
  useEffect(() => {
    const interval = setInterval(() => {
      updateCommentsCount();
    }, 10000); // Обновляем каждые 10 секунд

    return () => clearInterval(interval);
  }, [sites]);

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

  // Обработка действий из глобального поиска
  useEffect(() => {
    const onAction = (e: any) => {
      const item = e.detail;
      if (!item) return;
      if (item.type === 'site' && item.siteUrl) {
        // Скролл к сайту и подсветка/открытие аналитики
        setSelectedWebsites((prev) => Array.from(new Set([item.siteUrl, ...prev])));
      }
      if (item.type === 'query' && item.siteUrl && item.title) {
        setSelectedQuery({ query: item.title, siteUrl: item.siteUrl });
      }
      if (item.type === 'country') {
        setSelectedCountry(item.subtitle?.toLowerCase() || null);
      }
      if (item.type === 'device') {
        // В перспективе — можно фильтровать по девайсу
      }
      if (item.type === 'comment' && item.siteUrl) {
        setShowCommentsPanel(true);
        setCommentsSiteUrl(item.siteUrl);
      }
    };
    window.addEventListener('search:action', onAction);
    return () => window.removeEventListener('search:action', onAction);
  }, [setSelectedCountry]);



  const handleApplyFilters = async () => {
    try {
      setIsApplyingFilters(true);
    setDateRange(tempDateRange);
    setSelectedCountry(tempSelectedCountry);
    
    // Обновляем метрики всех сайтов с новыми фильтрами
    await refreshData();
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleResetFilters = () => {
    try {
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
    } catch (error) {
      console.error('Error resetting filters:', error);
    }
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

  // Переместить SortableHeader и handleOpenAnalyticsDialog выше их первого использования
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
    setAnalyticsDialogData(null); // Сбрасываем старые данные
    
    try {
      // Пробуем получить данные через все аккаунты
      let data = null;
      let topPages: Array<{
        page: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
      }> = [];
      let lastError: any = null;
      
      for (const account of connectedAccounts) {
        if (!account || !account.apiKey) {
          continue;
        }
        
        try {
          const api = new (await import('../services/searchConsoleApi')).SearchConsoleApi({ accessToken: account.apiKey });
          
          // Получаем метрики сайта за последние 28 дней
          data = await api.getSiteMetrics(siteUrl, 28);
          
          // Получаем топ страниц
          const pagesQuery = {
            startDate: (new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            endDate: (new Date()).toISOString().split('T')[0],
            dimensions: ['page'] as ('page')[],
            rowLimit: 20,
          };
          
          const pagesResp = await api.getSearchAnalytics(siteUrl, pagesQuery);
          topPages = (pagesResp.rows || []).map(row => ({
            page: row.keys?.[0] || '',
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          }));
          
          // Если данные получены успешно, прерываем цикл
          break;
          
        } catch (error) {
          console.error(`Ошибка получения данных через аккаунт ${account.email}:`, error);
          lastError = error;
          continue;
        }
      }
      
      if (!data) {
        throw new Error(`Не удалось получить данные для сайта ${siteUrl} ни через один из аккаунтов. Последняя ошибка: ${lastError?.message || 'Неизвестная ошибка'}`);
      }
      
      // Устанавливаем данные
      setAnalyticsDialogData({ 
        ...data, 
        topPages,
        totalClicks: data.totalClicks,
        totalImpressions: data.totalImpressions,
        averageCtr: data.averageCtr,
        averagePosition: data.averagePosition,
        countryBreakdown: data.countryBreakdown,
        deviceBreakdown: data.deviceBreakdown,
        topQueries: data.topQueries
      });
      
    } catch (error) {
      console.error('Ошибка загрузки аналитики сайта:', error);
      setAnalyticsDialogData(null);
      // Можно добавить toast с ошибкой
    } finally {
      setAnalyticsDialogLoading(false);
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
                // Обновляем connectedAccounts и загружаем сайты
                const newAccount = {
                  email: data.user.email,
                  apiKey: data.user.access_token,
                  displayName: data.user.displayName || data.user.email,
                  avatar: data.user.avatar
                };
                setConnectedAccounts((prev) => {
                  // Проверяем, что аккаунт еще не добавлен
                  const exists = prev.find(acc => acc.email === newAccount.email);
                  if (exists) {
                    console.log('Dashboard: Аккаунт уже существует:', newAccount.email);
                    return prev;
                  }
                  console.log('Dashboard: Добавлен новый аккаунт:', newAccount.email);
                  console.log('Dashboard: Всего аккаунтов после добавления:', prev.length + 1);
                  return [...prev, newAccount];
                });
                // Принудительно загружаем сайты для нового аккаунта
                setTimeout(() => loadSites(), 500);
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

  const handleQuerySort = (field: 'site' | 'query' | 'clicks' | 'impressions' | 'ctr' | 'position') => {
    if (querySortField === field) {
      setQuerySortDirection(querySortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setQuerySortField(field);
      setQuerySortDirection('desc');
    }
  };

  const getSortedQueries = () => {
    if (!selectedWebsites || selectedWebsites.length === 0) return [];
    
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
    if (!sites || sites.length === 0) return [];
    
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
          case 'geo':
            // Сортируем по выбранному метрику (клики или показы) в топовой стране
            const aTopCountry = a.metrics.countryBreakdown && a.metrics.countryBreakdown.length > 0 
              ? [...a.metrics.countryBreakdown].sort((x, y) => y[geoSortBy] - x[geoSortBy])[0]
              : null;
            const bTopCountry = b.metrics.countryBreakdown && b.metrics.countryBreakdown.length > 0 
              ? [...b.metrics.countryBreakdown].sort((x, y) => y[geoSortBy] - x[geoSortBy])[0]
              : null;
            
            aValue = aTopCountry ? aTopCountry[geoSortBy] : 0;
            bValue = bTopCountry ? bTopCountry[geoSortBy] : 0;
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

  // const handleRemoveAccount = (email: string) => {
  //   if (connectedAccounts.length > 1) {
  //     setConnectedAccounts((prev) => 
  //       prev.filter((acc) => acc.email !== email)
  //     );
  //   }
  // };

  useEffect(() => {
    if (user?.uid) {
      (async () => {
        const ref = doc(db, 'telegram_settings', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setTgToken(data.token || '');
          setTgChatId(data.chat_id || '');
        }
      })();
    }
  }, [user]);

  const handleSaveTgSettings = async () => {
    setTgLoading(true);
    setTgError('');
    try {
      await setDoc(doc(db, 'telegram_settings', user.uid), {
        token: tgToken,
        chat_id: tgChatId
      });
      setTgSaved(true);
      setTimeout(() => setTgSaved(false), 2000);
    } catch (e: any) {
      setTgError('Ошибка сохранения: ' + (e.message || e));
    }
    setTgLoading(false);
  };

  const handleSendTestMsg = async () => {
    setTgLoading(true);
    setTgError('');
    try {
      const resp = await fetch('https://us-central1-symmetric-flow-428315-r5.cloudfunctions.net/sendTelegramMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tgToken, chat_id: tgChatId, text: tgTestMsg || 'Тестовое уведомление' })
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.description || 'Ошибка отправки');
      setTgSaved(true);
      setTimeout(() => setTgSaved(false), 2000);
    } catch (e: any) {
      setTgError('Ошибка отправки: ' + (e.message || e));
    }
    setTgLoading(false);
  };

  // Загрузка настроек уведомлений при открытии настроек
  useEffect(() => {
    if (user?.uid && settingsOpen) {
      (async () => {
        const ref = doc(db, 'tg_notifications_settings', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setNotifySites(data.sites || []);
          setNotifyMetric(data.metric || 'clicks');
          setNotifyPeriod(data.period || 'daily');
        }
      })();
    }
  }, [user, settingsOpen]);

  const handleSaveNotifySettings = async () => {
    setNotifyError('');
    try {
      await setDoc(doc(db, 'tg_notifications_settings', user.uid), {
        userId: user.uid,
        sites: notifySites,
        metric: notifyMetric,
        period: notifyPeriod,
        lastNotifiedAt: null
      });
      setNotifySaved(true);
      setTimeout(() => setNotifySaved(false), 2000);
    } catch (e: any) {
      setNotifyError('Ошибка сохранения: ' + (e.message || e));
    }
  };

  // Добавляем функцию обновления данных в глобальную область для доступа из App.tsx
  useEffect(() => {
    (window as any).refreshDashboardData = refreshData;
    return () => {
      delete (window as any).refreshDashboardData;
    };
  }, [refreshData]);

  // Удаляем неиспользуемый useEffect

  // Сбрасываем sitesDisplayed при обновлении данных
  useEffect(() => {
    if (isLoading) {
      setSitesDisplayed(false);
    }
  }, [isLoading]);

  // Отслеживаем когда сайты действительно отображаются
  useEffect(() => {
    if (sites.length > 0 && !sitesDisplayed) {
      // Небольшая задержка чтобы сайты успели отрендериться
      const timer = setTimeout(() => {
        setSitesDisplayed(true);
      }, 500);
      return () => clearTimeout(timer);
    } else if (sites.length === 0) {
      setSitesDisplayed(false);
    }
  }, [sites.length, sitesDisplayed]);



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
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg transition-all duration-200 mb-2"
              disabled={isAddingAccount}
            >
              {isAddingAccount ? (
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
                  <span>Добавить аккаунт Google</span>
                </div>
        )}
            </Button>
          </CardContent>
        </Card>
      </div>
  );
  }

  // Анимация загрузки для дашборда
  if (isLoading && sites.length === 0) {
    return (
      <div className="w-full p-8 space-y-8 max-w-none">
        <div className="animate-pulse space-y-8">
          {/* Skeleton для фильтров */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-10 bg-slate-200 rounded w-full"></div>
              <div className="h-10 bg-slate-200 rounded w-full"></div>
            </div>
          </div>
          
          {/* Skeleton для карточек сайтов */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
          
          {/* Skeleton для метрик */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-8 space-y-8 max-w-none">
      {/* Диалог настроек */}
      {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative overflow-y-auto max-h-[90vh]">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setSettingsOpen(false)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M6 6l12 12M6 18L18 6"/></svg>
              </button>
              <h2 className="text-lg font-bold mb-4">Настройки Telegram уведомлений</h2>
              <div className="space-y-3">
                {/* Telegram token/chat_id/test */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Токен бота</label>
                  <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={tgToken} onChange={e => setTgToken(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Chat ID</label>
                  <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={tgChatId} onChange={e => setTgChatId(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Тестовое сообщение</label>
                  <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={tgTestMsg} onChange={e => setTgTestMsg(e.target.value)} placeholder="Текст для теста" />
                </div>
                {tgError && <div className="text-red-600 text-xs">{tgError}</div>}
                {tgSaved && <div className="text-green-600 text-xs">Сохранено/отправлено!</div>}
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveTgSettings} disabled={tgLoading} className="bg-blue-600 text-white rounded px-3 py-1 text-xs font-medium disabled:opacity-50">Сохранить</button>
                  <button onClick={handleSendTestMsg} disabled={tgLoading || !tgToken || !tgChatId} className="bg-green-600 text-white rounded px-3 py-1 text-xs font-medium disabled:opacity-50">Тест</button>
                </div>
                <hr className="my-3" />
                {/* UI для уведомлений */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Топ-5 сайтов для уведомлений</label>
                  <div className="flex flex-wrap gap-2">
                    {getSortedSites().slice(0, 10).map(site => (
                      <label key={site.siteUrl} className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifySites.includes(site.siteUrl)}
                          onChange={e => {
                            if (e.target.checked) setNotifySites(prev => [...prev, site.siteUrl]);
                            else setNotifySites(prev => prev.filter(s => s !== site.siteUrl));
                          }}
                        />
                        {getSiteDisplayName(site.siteUrl)}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Метрика для уведомлений</label>
                  <select className="w-full border rounded px-2 py-1 text-sm" value={notifyMetric} onChange={e => setNotifyMetric(e.target.value as any)}>
                    <option value="clicks">Клики</option>
                    <option value="impressions">Показы</option>
                    <option value="position">Позиция</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Периодичность</label>
                  <select className="w-full border rounded px-2 py-1 text-sm" value={notifyPeriod} onChange={e => setNotifyPeriod(e.target.value as any)}>
                    <option value="hourly">Раз в час</option>
                    <option value="daily">Раз в день</option>
                  </select>
                </div>
                {notifyError && <div className="text-red-600 text-xs">{notifyError}</div>}
                {notifySaved && <div className="text-green-600 text-xs">Настройки уведомлений сохранены!</div>}
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveNotifySettings} className="bg-blue-600 text-white rounded px-3 py-1 text-xs font-medium">Сохранить уведомления</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="w-full p-8 space-y-8 max-w-[1400px] mx-auto">
          {activeTab === 'dashboard' ? (
            <>
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
                      disabled={isLoading || isApplyingFilters}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading || isApplyingFilters ? (
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
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl text-gray-900 font-bold">
                        Compare Websites
                      </CardTitle>
                      <CardDescription className="text-gray-600 mt-1">
                        Select multiple websites to compare all metrics in detail
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full bg-gray-100 hover:bg-gray-200">
                        <Search className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-10 w-10 p-0 rounded-full bg-gray-100 hover:bg-gray-200"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="px-3 py-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700"
                        onClick={() => setShowApiTest(true)}
                      >
                        Тест API
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Фильтр и кнопка "Показать все" */}
                  {showFilters && (
                    <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Sort by:</span>
                          <Select value={siteFilter} onValueChange={(value: 'clicks' | 'impressions' | 'position' | 'geo') => setSiteFilter(value)}>
                            <SelectTrigger className="w-40 h-9 bg-white border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="clicks">Clicks</SelectItem>
                              <SelectItem value="impressions">Impressions</SelectItem>
                              <SelectItem value="position">Position</SelectItem>
                              <SelectItem value="geo">Top Geo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllSites(!showAllSites)}
                        className="text-gray-600 border-gray-200 hover:bg-gray-50 h-9"
                      >
                        {showAllSites ? 'Show less' : 'View all websites'}
                      </Button>
                    </div>
                  )}

                  {!showFilters && (
                    <div className="flex items-center justify-between mb-6">
                      <div></div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllSites(!showAllSites)}
                        className="text-gray-600 border-gray-200 hover:bg-gray-50 h-9"
                      >
                        {showAllSites ? 'Show less' : 'View all websites'}
                      </Button>
                    </div>
                  )}

                  <div className="space-y-0">
                    {(() => {
                      // Показываем LoadingSpinner пока сайты не отобразились
                      const shouldShowSpinner = !sitesDisplayed || sites.length === 0;
                      
                      return shouldShowSpinner ? (
                        // Показываем LoadingSpinner пока сайты не отобразились
                        <div className="py-8 flex flex-col items-center">
                          <LoadingSpinner 
                            size="lg" 
                            className="mb-6"
                          />
                          {isLoading && (
                            <div className="space-y-0 w-full">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="group relative">
                                  <SiteCardSkeleton />
                                  {/* Дополнительная анимация при наведении */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Table Header */}
                          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-t-lg border-b border-gray-200">
                            <div className="col-span-3">
                              <span className="text-sm font-medium text-gray-700">Website</span>
                            </div>
                            <div className="col-span-1 text-center">
                              <span className="text-sm font-medium text-gray-700">Clicks</span>
                            </div>
                            <div className="col-span-1 text-center">
                              <span className="text-sm font-medium text-gray-700">Impressions</span>
                            </div>
                            <div className="col-span-1 text-center">
                              <span className="text-sm font-medium text-gray-700">CTR</span>
                            </div>
                            <div className="col-span-1 text-center">
                              <span className="text-sm font-medium text-gray-700">Position</span>
                            </div>
                            <div className="col-span-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Top Geo</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium"
                                  onClick={() => {
                                    setSiteFilter('geo');
                                    setGeoSortBy(geoSortBy === 'impressions' ? 'clicks' : 'impressions');
                                  }}
                                  title={`Sort by ${geoSortBy === 'impressions' ? 'clicks' : 'impressions'} in top geo`}
                                >
                                  {geoSortBy === 'impressions' ? 'I' : 'C'}
                                </Button>
                              </div>
                            </div>
                            <div className="col-span-1 text-center">
                              <span className="text-sm font-medium text-gray-700">Comments</span>
                            </div>
                            <div className="col-span-1 text-center">
                              <span className="text-sm font-medium text-gray-700">Trend</span>
                            </div>
                          </div>

                          {/* Table Rows */}
                          <div className="divide-y divide-gray-100">
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
                                  className={`px-4 py-4 transition-all duration-200 cursor-pointer hover:bg-gray-50 ${
                                    isSelected 
                                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                                      : 'bg-white'
                                  }`}
                                >
                                  <div className="grid grid-cols-12 gap-4 items-center">
                                    {/* Website Column */}
                                    <div className="col-span-3">
                                      <div className="flex items-center gap-3">
                                        <Checkbox 
                                          checked={isSelected}
                                          className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleWebsiteToggle(site.siteUrl);
                                          }}
                                        />
                                        <div className="flex items-center gap-3">
                                          <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                            style={{ backgroundColor: getPerformanceColor(site.siteUrl) }}
                                          >
                                            {getSiteDisplayName(site.siteUrl).charAt(0).toUpperCase()}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div
                                              className="font-semibold text-gray-900 truncate cursor-pointer hover:underline"
                                              onClick={e => {
                                                e.stopPropagation();
                                                handleOpenAnalyticsDialog(site.siteUrl);
                                              }}
                                            >
                                              {getSiteDisplayName(site.siteUrl)}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                              {site.siteUrl}
                                            </div>
                                            {(site as any).addedDate && (
                                              <div className="text-xs text-gray-400 truncate">
                                                Добавлен: {new Date((site as any).addedDate).toLocaleDateString('ru-RU')}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Metrics Columns */}
                                    <div className="col-span-1 text-center">
                                      {metrics ? (
                                        <div>
                                          <div className="font-semibold text-gray-900">
                                            {metrics.totalClicks.toLocaleString()}
                                          </div>
                                          {(() => {
                                            const trendData = getTrendData(metrics.dailyData);
                                            return trendData.change > 0 ? (
                                              <div className="flex items-center justify-center gap-1 mt-1">
                                                {trendData.trend === 'up' ? (
                                                  <TrendingUp className="h-3 w-3 text-green-600" />
                                                ) : trendData.trend === 'down' ? (
                                                  <TrendingDown className="h-3 w-3 text-red-600" />
                                                ) : null}
                                                <span className={`text-xs font-medium ${
                                                  trendData.trend === 'up' ? 'text-green-600' : 
                                                  trendData.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                                                }`}>
                                                  {trendData.change}%
                                                </span>
                                              </div>
                                            ) : null;
                                          })()}
                                        </div>
                                      ) : (
                                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                      )}
                                    </div>
                                    
                                    <div className="col-span-1 text-center">
                                      {metrics ? (
                                        <div className="font-semibold text-gray-900">
                                          {metrics.totalImpressions.toLocaleString()}
                                        </div>
                                      ) : (
                                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                      )}
                                    </div>
                                    
                                    <div className="col-span-1 text-center">
                                      {metrics ? (
                                        <div className="font-semibold text-gray-900">
                                          {(metrics.averageCtr * 100).toFixed(1)}%
                                        </div>
                                      ) : (
                                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                      )}
                                    </div>
                                    
                                    <div className="col-span-1 text-center">
                                      {metrics ? (
                                        <div className="font-semibold text-gray-900">
                                          {metrics.averagePosition.toFixed(1)}
                                        </div>
                                      ) : (
                                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                      )}
                                    </div>

                                    {/* Top Geo Column */}
                                    <div className="col-span-2 text-center">
                                      {metrics && metrics.countryBreakdown && metrics.countryBreakdown.length > 0 ? (
                                        <div className="flex flex-col items-center gap-1">
                                          {(() => {
                                            // Сортируем страны по выбранному метрику
                                            const sortedCountries = [...metrics.countryBreakdown].sort((a, b) => b[geoSortBy] - a[geoSortBy]);
                                            const topCountry = sortedCountries[0];
                                            
                                            return (
                                              <>
                                                <Badge 
                                                  variant="outline" 
                                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                                >
                                                  <span className="mr-1">{getCountryFlag(topCountry.country)}</span>
                                                  {getCountryName(topCountry.country)}
                                                </Badge>
                                                <div className="text-xs text-gray-500">
                                                  {topCountry[geoSortBy].toLocaleString()} {geoSortBy}
                                                </div>
                                              </>
                                            );
                                          })()}
                                        </div>
                                      ) : (
                                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                      )}
                                    </div>

                                    {/* Comments Column */}
                                    <div className="col-span-1 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <Badge variant="secondary" className="text-xs">
                                          {typeof commentsCount[site.siteUrl] === 'number' ? commentsCount[site.siteUrl] : <span className="opacity-50">0</span>}
                                        </Badge>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 p-0"
                                          title="Комментарии"
                                          onClick={e => {
                                            e.stopPropagation();
                                            setCommentsSiteUrl(site.siteUrl);
                                            setShowCommentsPanel(true);
                                          }}
                                        >
                                          <MessageSquare className="h-4 w-4 text-gray-500" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Trend Chart Column */}
                                    <div className="col-span-1 text-center">
                                      {metrics && metrics.dailyData && metrics.dailyData.length > 0 ? (
                                        <div className="flex items-center justify-center">
                                          <div className="w-16 h-8 relative">
                                            <svg className="w-full h-full" viewBox="0 0 64 32">
                                              {/* Grid lines */}
                                              <line x1="0" y1="8" x2="64" y2="8" stroke="#f3f4f6" strokeWidth="1" />
                                              <line x1="0" y1="16" x2="64" y2="16" stroke="#f3f4f6" strokeWidth="1" />
                                              <line x1="0" y1="24" x2="64" y2="24" stroke="#f3f4f6" strokeWidth="1" />
                                              
                                              {/* Trend line */}
                                              <path
                                                d={(() => {
                                                  const data = metrics.dailyData;
                                                  const maxImpressions = Math.max(...data.map(d => d.impressions));
                                                  const minImpressions = Math.min(...data.map(d => d.impressions));
                                                  const range = maxImpressions - minImpressions || 1;
                                                  
                                                  const points = data.map((day, index) => {
                                                    const x = (index / (data.length - 1)) * 60 + 2;
                                                    const y = 30 - ((day.impressions - minImpressions) / range) * 24;
                                                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                                                  }).join(' ');
                                                  
                                                  return points;
                                                })()}
                                                stroke="#8b5cf6"
                                                strokeWidth="2"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Footer */}
                          {!showAllSites && getSortedSites().length > 5 && (
                            <div className="pt-4 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAllSites(true)}
                                className="text-gray-600 border-gray-200 hover:bg-gray-50"
                              >
                                View all {getSortedSites().length} websites
                              </Button>
                            </div>
                          )}
                        </>
                      );
                    })()}
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
                      <div className="overflow-x-auto max-w-full">
                        <table className="w-full text-gray-900 text-sm min-w-[800px]">
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
                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {query.countries.slice(0, 2).map((country, countryIndex) => (
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
                                    {query.countries.length > 2 && (
                                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                                        +{query.countries.length - 2}
                                      </Badge>
                                    )}
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
                      <div className="overflow-x-auto max-w-full">
                        <table className="w-full text-gray-900 min-w-[600px]">
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
            </>
          ) : (
            <IndexingApi user={user} />
          )}
        </div>
      

      {/* Query Analytics Overlay */}

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

      <Dialog open={analyticsDialogOpen} onOpenChange={open => { setAnalyticsDialogOpen(open); if (!open) setAnalyticsDialogSite(null); }}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] bg-white overflow-hidden">
          <DialogHeader>
            <DialogTitle>Аналитика сайта {analyticsDialogSite && getSiteDisplayName(analyticsDialogSite)}</DialogTitle>
            <DialogDescription>Подробная статистика за последние 28 дней</DialogDescription>
          </DialogHeader>
          {analyticsDialogLoading ? (
            <div className="py-8 text-center text-gray-500">Загрузка...</div>
          ) : analyticsDialogData ? (
            <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]" data-dialog-content>
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

              {/* Performance Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Date Range Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Date range:</span>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        {(['7d', '28d', '3m', '6m'] as const).map((period) => (
                          <button
                            key={period}
                            onClick={() => {
                              setChartPeriod(period);
                              const end = new Date();
                              const start = new Date();
                              if (period === '7d') start.setDate(end.getDate() - 7);
                              else if (period === '28d') start.setDate(end.getDate() - 28);
                              else if (period === '3m') start.setDate(end.getDate() - 90);
                              else if (period === '6m') start.setDate(end.getDate() - 180);
                              setChartDateRange({ startDate: start, endDate: end });
                            }}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              chartPeriod === period
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {period === '7d' ? '7 days' : 
                             period === '28d' ? '28 days' : 
                             period === '3m' ? '3 months' : '6 months'}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Custom Date Range */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Custom:</span>
                      <Input
                        type="date"
                        value={format(chartDateRange.startDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                          const start = new Date(e.target.value);
                          if (start <= chartDateRange.endDate) {
                            setChartDateRange({ ...chartDateRange, startDate: start });
                          }
                        }}
                        className="w-32 h-8 text-xs"
                      />
                      <span className="text-xs text-gray-500">to</span>
                      <Input
                        type="date"
                        value={format(chartDateRange.endDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                          const end = new Date(e.target.value);
                          if (chartDateRange.startDate <= end) {
                            setChartDateRange({ ...chartDateRange, endDate: end });
                          }
                        }}
                        className="w-32 h-8 text-xs"
                      />
                    </div>
                    
                    {/* Metrics Selection */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Metrics:</span>
                      <div className="flex gap-1">
                        {(['clicks', 'impressions', 'ctr', 'position'] as const).map((metric) => (
                          <button
                            key={metric}
                            onClick={() => {
                              const newSelected = new Set(selectedMetrics);
                              if (newSelected.has(metric)) {
                                if (newSelected.size > 1) {
                                  newSelected.delete(metric);
                                }
                              } else {
                                newSelected.add(metric);
                              }
                              setSelectedMetrics(newSelected);
                            }}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              selectedMetrics.has(metric)
                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            {metric.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-80 w-full relative">
                  {analyticsDialogData.dailyData && analyticsDialogData.dailyData.length > 0 ? (
                    <svg className="w-full h-full" viewBox="0 0 800 320">
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <line
                          key={i}
                          x1="0"
                          y1={i * 80}
                          x2="800"
                          y2={i * 80}
                          stroke="#f3f4f6"
                          strokeWidth="1"
                        />
                      ))}
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                        <line
                          key={i}
                          x1={i * 80}
                          y1="0"
                          x2={i * 80}
                          y2="320"
                          stroke="#f3f4f6"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Multiple chart lines */}
                      {Array.from(selectedMetrics).map((metric, metricIndex) => {
                        const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
                        const data = analyticsDialogData.dailyData.filter((day: any) => {
                          const dayDate = new Date(day.date);
                          return dayDate >= chartDateRange.startDate && dayDate <= chartDateRange.endDate;
                        });
                        
                        if (data.length === 0) return null;
                        
                        // Для позиции инвертируем значения (чем меньше позиция, тем лучше)
                        const getValueForChart = (day: any, metric: string) => {
                          if (metric === 'position') {
                            // Инвертируем позицию: 1 -> 100, 100 -> 1
                            return 100 - day[metric] + 1;
                          }
                          return day[metric];
                        };
                        
                        const maxValue = Math.max(...data.map((d: any) => getValueForChart(d, metric)));
                        const minValue = Math.min(...data.map((d: any) => getValueForChart(d, metric)));
                        const range = maxValue - minValue || 1;
                        
                        const points = data.map((day: any, index: number) => {
                          const x = (index / (data.length - 1)) * 760 + 20;
                          const y = 300 - ((getValueForChart(day, metric) - minValue) / range) * 280;
                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ');
                        
                        return (
                          <g key={metric}>
                            <path
                              d={points}
                              stroke={colors[metricIndex % colors.length]}
                              strokeWidth="2"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              opacity="0.8"
                            />
                                                          {data.map((day: any, index: number) => {
                                const x = (index / (data.length - 1)) * 760 + 20;
                                const y = 300 - ((getValueForChart(day, metric) - minValue) / range) * 280;
                                
                                return (
                                <g key={`${metric}-${index}`}>
                                  {/* Невидимая область для hover */}
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="8"
                                    fill="transparent"
                                    onMouseEnter={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const dialogRect = document.querySelector('[data-dialog-content]')?.getBoundingClientRect();
                                      if (dialogRect) {
                                        setChartTooltip({
                                          visible: true,
                                          x: rect.left - dialogRect.left + rect.width / 2,
                                          y: rect.top - dialogRect.top - 10,
                                          data: day,
                                          metric: metric
                                        });
                                      }
                                    }}
                                    onMouseLeave={() => setChartTooltip(null)}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  {/* Видимая точка */}
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="3"
                                    fill={colors[metricIndex % colors.length]}
                                    className="transition-all duration-200"
                                  />
                                </g>
                              );
                            })}
                          </g>
                        );
                      })}

                      {/* Y-axis labels */}
                      {(() => {
                        const data = analyticsDialogData.dailyData.filter((day: any) => {
                          const dayDate = new Date(day.date);
                          return dayDate >= chartDateRange.startDate && dayDate <= chartDateRange.endDate;
                        });
                        
                        if (data.length === 0) return null;
                        
                        // Функция для получения значения для отображения на оси Y
                        const getValueForYAxis = (day: any, metric: string) => {
                          if (metric === 'position') {
                            return 100 - day[metric] + 1;
                          }
                          return day[metric];
                        };
                        
                        const allValues = data.flatMap((day: any) => 
                          Array.from(selectedMetrics).map(metric => getValueForYAxis(day, metric))
                        );
                        const maxValue = Math.max(...allValues);
                        const minValue = Math.min(...allValues);
                        const range = maxValue - minValue || 1;
                        
                        return [0, 1, 2, 3, 4].map((i) => {
                          const chartValue = maxValue - (i * range / 4);
                          // Для позиции конвертируем обратно в реальную позицию
                          const displayValue = selectedMetrics.has('position') ? 
                            (100 - chartValue + 1).toFixed(1) : 
                            chartValue.toLocaleString();
                          const y = i * 80;
                          return (
                            <text
                              key={i}
                              x="10"
                              y={y + 15}
                              className="text-xs fill-gray-500"
                                                              textAnchor="start"
                              >
                                {displayValue}
                              </text>
                          );
                        });
                      })()}

                      {/* X-axis labels */}
                      {(() => {
                        const data = analyticsDialogData.dailyData.filter((day: any) => {
                          const dayDate = new Date(day.date);
                          return dayDate >= chartDateRange.startDate && dayDate <= chartDateRange.endDate;
                        });
                        
                        if (data.length === 0) return null;
                        
                        const step = Math.max(1, Math.floor(data.length / 8));
                        
                        return data.filter((_: any, index: number) => index % step === 0).map((day: any, index: number) => {
                          const x = (index * step / (data.length - 1)) * 760 + 20;
                          return (
                            <text
                              key={index}
                              x={x}
                              y="315"
                              className="text-xs fill-gray-500"
                              textAnchor="middle"
                            >
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </text>
                          );
                        });
                      })()}
                    </svg>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No chart data available
                    </div>
                  )}
                </div>
                
                {/* Chart Tooltip */}
                {chartTooltip && (
                  <div 
                    className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-200 ease-out"
                    style={{
                      left: chartTooltip.x,
                      top: chartTooltip.y,
                      opacity: chartTooltip.visible ? 1 : 0,
                      transform: `translate(-50%, -100%) scale(${chartTooltip.visible ? 1 : 0.95})`
                    }}
                  >
                    <div className="space-y-3 min-w-[280px]">
                      {/* Header */}
                      <div className="border-b border-gray-100 pb-2">
                        <div className="font-semibold text-gray-900 text-sm">
                          {new Date(chartTooltip.data.date).toLocaleDateString('ru-RU', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {chartTooltip.metric}
                        </div>
                      </div>
                      
                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4">
              <div>
                          <div className="text-xs text-gray-500">Клики</div>
                          <div className="font-semibold text-gray-900">
                            {chartTooltip.data.clicks?.toLocaleString() || '0'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Показы</div>
                          <div className="font-semibold text-gray-900">
                            {chartTooltip.data.impressions?.toLocaleString() || '0'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">CTR</div>
                          <div className="font-semibold text-gray-900">
                            {((chartTooltip.data.ctr || 0) * 100).toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Позиция</div>
                          <div className="font-semibold text-gray-900">
                            {(chartTooltip.data.position || 0).toFixed(1)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Top Countries */}
                      {chartTooltip.data.countryBreakdown && chartTooltip.data.countryBreakdown.length > 0 && (
                        <div className="border-t border-gray-100 pt-2">
                          <div className="text-xs text-gray-500 mb-2">Топ стран:</div>
                          <div className="space-y-1">
                            {chartTooltip.data.countryBreakdown.slice(0, 3).map((country: any, index: number) => (
                              <div key={country.country} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getCountryFlag(country.country)}</span>
                                  <span className="text-gray-700">{getCountryName(country.country)}</span>
                                </div>
                                <div className="text-gray-600">
                                  {country.clicks?.toLocaleString() || '0'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Top Queries */}
                      {chartTooltip.data.topQueries && chartTooltip.data.topQueries.length > 0 && (
                        <div className="border-t border-gray-100 pt-2">
                          <div className="text-xs text-gray-500 mb-2">Топ запросы:</div>
                          <div className="space-y-1">
                            {chartTooltip.data.topQueries.slice(0, 3).map((query: any, index: number) => (
                              <div key={query.query} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                                    {index + 1}
                                  </div>
                                  <span className="text-gray-700 max-w-[150px] truncate" title={query.query}>
                                    {query.query}
                                  </span>
                                </div>
                                <div className="text-gray-600">
                                  {query.clicks?.toLocaleString() || '0'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
                  </div>
                )}
              </div>
              {/* Страны */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Top Countries
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {analyticsDialogData.countryBreakdown?.length || 0} countries
                    </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {analyticsDialogData.countryBreakdown?.slice(0, 12).map((c: any, index: number) => (
                    <div key={c.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge className="text-lg">
                          {getCountryFlag(c.country)}
                        </Badge>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {getCountryName(c.country)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {c.country.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 text-sm">
                          {c.clicks.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {c.impressions.toLocaleString()} impressions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Запросы */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Search className="h-5 w-5 text-green-600" />
                    Top Queries
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {analyticsDialogData.topQueries?.length || 0} queries
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-gray-700 font-semibold">Query</th>
                        <th className="text-right py-3 px-4 text-gray-700 font-semibold">Clicks</th>
                        <th className="text-right py-3 px-4 text-gray-700 font-semibold">Impressions</th>
                        <th className="text-right py-3 px-4 text-gray-700 font-semibold">CTR</th>
                        <th className="text-right py-3 px-4 text-gray-700 font-semibold">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsDialogData.topQueries?.map((q: any, index: number) => (
                        <tr key={q.query} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold">
                                {index + 1}
                              </div>
                              <div className="font-medium text-gray-900 max-w-[300px] truncate" title={q.query}>
                                {q.query}
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-gray-900">
                            {q.clicks.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700">
                            {q.impressions.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700">
                            {(q.ctr * 100).toFixed(1)}%
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700">
                            {q.position.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Страницы */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-purple-600" />
                    Top Pages
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {analyticsDialogData.topPages?.length || 0} pages
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-gray-700 font-semibold">Page URL</th>
                        <th className="text-right py-3 px-4 text-gray-700 font-semibold">Clicks</th>
                        <th className="text-right py-3 px-4 text-gray-700 font-semibold">Impressions</th>
                        <th className="text-right py-3 px-4 text-gray-700 font-semibold">CTR</th>
                        <th className="text-right py-3 px-4 text-gray-700 font-semibold">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsDialogData.topPages?.map((p: any, index: number) => (
                        <tr key={p.page} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-xs font-bold">
                                {index + 1}
                              </div>
                              <div className="max-w-[400px]">
                                <a 
                                  href={p.page} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:text-blue-800 underline text-sm font-medium truncate block"
                                  title={p.page}
                                >
                                  {p.page.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </a>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new URL(p.page).hostname}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-gray-900">
                            {p.clicks.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700">
                            {p.impressions.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700">
                            {(p.ctr * 100).toFixed(1)}%
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700">
                            {p.position.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Устройства */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-orange-600" />
                    Device Performance
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {analyticsDialogData.deviceBreakdown?.length || 0} devices
                    </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analyticsDialogData.deviceBreakdown?.map((d: any) => {
                    const deviceIcons = {
                      desktop: '🖥️',
                      mobile: '📱',
                      tablet: '📱'
                    };
                    // const deviceColors = {
                    //   desktop: 'bg-blue-50 border-blue-200 text-blue-700',
                    //   mobile: 'bg-green-50 border-green-200 text-green-700',
                    //   tablet: 'bg-purple-50 border-purple-200 text-purple-700'
                    // };
                    
                    return (
                      <div key={d.device} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-2xl">
                            {deviceIcons[d.device as keyof typeof deviceIcons] || '📱'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 capitalize">
                              {d.device}
                            </div>
                            <div className="text-xs text-gray-500">
                              {((d.clicks / (analyticsDialogData.deviceBreakdown?.reduce((sum: number, dev: any) => sum + dev.clicks, 0) || 1)) * 100).toFixed(1)}% of traffic
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-gray-500 text-xs">Clicks</div>
                            <div className="font-semibold text-gray-900">{d.clicks.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs">Impressions</div>
                            <div className="font-semibold text-gray-900">{d.impressions.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs">CTR</div>
                            <div className="font-semibold text-gray-900">{(d.ctr * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs">Position</div>
                            <div className="font-semibold text-gray-900">{d.position.toFixed(1)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

      {/* Панель комментариев */}
      <Dialog open={showCommentsPanel} onOpenChange={(open) => {
        setShowCommentsPanel(open);
        if (!open) {
          // Обновляем количество комментариев после закрытия панели
          setTimeout(() => updateCommentsCount(), 1000);
        }
      }}>
        <DialogContent className="max-w-2xl w-full bg-white">
          <DialogHeader>
            <DialogTitle>Комментарии к сайту {getSiteDisplayName(commentsSiteUrl)}</DialogTitle>
            <DialogDescription>Все комментарии для выбранного сайта</DialogDescription>
          </DialogHeader>
          <Comments
            siteUrl={commentsSiteUrl}
            siteName={getSiteDisplayName(commentsSiteUrl)}
            className="mt-4"
          />
          <DialogClose asChild>
            <Button variant="outline" className="mt-6 w-full">Закрыть</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Диалог тестирования API */}
      <Dialog open={showApiTest} onOpenChange={setShowApiTest}>
        <DialogContent className="max-w-4xl w-full bg-white">
          <DialogHeader>
            <DialogTitle>Тестирование Google Search Console API</DialogTitle>
            <DialogDescription>Проверьте подключение к API и получение данных</DialogDescription>
          </DialogHeader>
          <ApiTest userId={user?.uid} />
          <DialogClose asChild>
            <Button variant="outline" className="mt-6 w-full">Закрыть</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
};