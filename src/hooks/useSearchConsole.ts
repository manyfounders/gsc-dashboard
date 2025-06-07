import { useState, useCallback, useEffect } from 'react';
import { SearchConsoleApi, SearchConsoleApiError, SiteInfo, OverallAnalytics } from '../services/searchConsoleApi';

export interface WebsiteMetrics {
  siteUrl: string;
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  dailyData: Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  countryBreakdown: Array<{
    country: string;
    countryName: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export interface UseSearchConsoleReturn {
  isLoading: boolean;
  error: string | null;
  sites: SiteInfo[];
  websiteMetrics: WebsiteMetrics[];
  overallAnalytics: OverallAnalytics | null;
  selectedCountry: string | null;
  dateRange: { startDate: Date; endDate: Date };
  loadingSites: Set<string>;
  validateApiKey: (apiKey: string) => Promise<boolean>;
  loadSites: () => Promise<void>;
  loadWebsiteMetrics: (siteUrl: string, country?: string) => Promise<void>;
  loadOverallAnalytics: (customDateRange?: { startDate: Date; endDate: Date }) => Promise<void>;
  setSelectedCountry: (country: string | null) => void;
  setDateRange: (dateRange: { startDate: Date; endDate: Date }) => void;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

// Country code to name and flag mapping
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

export const getCountryName = (countryCode: string): string => {
  return countryData[countryCode.toLowerCase()]?.name || countryCode.toUpperCase();
};

export const getCountryFlag = (countryCode: string): string => {
  return countryData[countryCode.toLowerCase()]?.flag || '🏳️';
};

export const useSearchConsole = (apiKey?: string): UseSearchConsoleReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [websiteMetrics, setWebsiteMetrics] = useState<WebsiteMetrics[]>([]);
  const [overallAnalytics, setOverallAnalytics] = useState<OverallAnalytics | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [loadingSites] = useState<Set<string>>(new Set());
  const [api, setApi] = useState<SearchConsoleApi | null>(null);
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 28);
    return { startDate, endDate };
  });

  // Автоматически инициализируем API при получении токена
  useEffect(() => {
    if (apiKey && !api) {
      console.log('useSearchConsole: initializing API with token:', apiKey.substring(0, 10) + '...');
      const searchConsoleApi = new SearchConsoleApi({ accessToken: apiKey });
      setApi(searchConsoleApi);
    }
  }, [apiKey, api]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((err: unknown) => {
    console.error('Search Console API Error:', err);
    
    if (err instanceof SearchConsoleApiError) {
      setError(err.message);
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('An unexpected error occurred');
    }
  }, []);

  const validateApiKey = useCallback(async (token: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const searchConsoleApi = new SearchConsoleApi({ accessToken: token });
      const isValid = await searchConsoleApi.validateApiKey();
      
      if (isValid) {
        setApi(searchConsoleApi);
      }
      
      return isValid;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const calculateTrend = (dailyData: Array<{ clicks: number }>) => {
    if (dailyData.length < 2) return { trend: 'stable' as const, change: 0 };
    
    const recent = dailyData.slice(-7);
    const previous = dailyData.slice(-14, -7);
    
    if (recent.length === 0 || previous.length === 0) return { trend: 'stable' as const, change: 0 };
    
    const recentAvg = recent.reduce((sum, day) => sum + day.clicks, 0) / recent.length;
    const previousAvg = previous.reduce((sum, day) => sum + day.clicks, 0) / previous.length;
    
    if (previousAvg === 0) return { trend: 'stable' as const, change: 0 };
    
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    const trend: 'up' | 'down' | 'stable' = Math.abs(change) < 5 ? 'stable' : change > 0 ? 'up' : 'down';
    
    return { trend, change: Math.round(change * 10) / 10 };
  };

  const loadSites = useCallback(async () => {
    if (!api) {
      console.log('loadSites: api is null');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      console.log('loadSites: calling api.getSites()');
      const siteList = await api.getSites();
      
      let sitesToSet: any[] = [];
      if (Array.isArray(siteList)) {
        sitesToSet = siteList;
      } else if (siteList && Array.isArray((siteList as any).siteEntry)) {
        sitesToSet = (siteList as any).siteEntry;
      } else {
        sitesToSet = [];
      }
      
      setSites(sitesToSet);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [api, handleError]);

  const loadWebsiteMetrics = useCallback(async (siteUrl: string, country?: string) => {
    if (!api) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const metrics = await api.getSiteMetrics(siteUrl, 28, selectedCountry || undefined);
      const { trend, change } = calculateTrend(metrics.dailyData);
      
      const websiteMetric: WebsiteMetrics = {
        siteUrl,
        totalClicks: metrics.totalClicks,
        totalImpressions: metrics.totalImpressions,
        averageCtr: metrics.averageCtr,
        averagePosition: metrics.averagePosition,
        trend,
        change,
        dailyData: metrics.dailyData,
        topQueries: metrics.topQueries,
        deviceBreakdown: metrics.deviceBreakdown,
        countryBreakdown: metrics.countryBreakdown || [],
      };
      
      setWebsiteMetrics(prev => {
        const filtered = prev.filter(w => w.siteUrl !== siteUrl);
        return [...filtered, websiteMetric];
      });
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [api, handleError, selectedCountry]);

  const loadOverallAnalytics = useCallback(async (customDateRange?: { startDate: Date; endDate: Date }) => {
    if (!api || sites.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const analytics = await api.getOverallAnalytics(sites, selectedCountry || undefined);
      setOverallAnalytics(analytics);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [api, sites, selectedCountry, handleError]);

  const refreshData = useCallback(async () => {
    if (!api || sites.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const promises = sites.map(site => 
        api.getSiteMetrics(site.siteUrl, 28, selectedCountry || undefined).then(metrics => {
          const { trend, change } = calculateTrend(metrics.dailyData);
          return {
            siteUrl: site.siteUrl,
            totalClicks: metrics.totalClicks,
            totalImpressions: metrics.totalImpressions,
            averageCtr: metrics.averageCtr,
            averagePosition: metrics.averagePosition,
            trend,
            change,
            dailyData: metrics.dailyData,
            topQueries: metrics.topQueries,
            deviceBreakdown: metrics.deviceBreakdown,
            countryBreakdown: metrics.countryBreakdown || [],
          };
        })
      );
      
      const results = await Promise.allSettled(promises);
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<WebsiteMetrics> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
      
      setWebsiteMetrics(successfulResults);
      
      const analytics = await api.getOverallAnalytics(sites, selectedCountry || undefined);
      setOverallAnalytics(analytics);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [api, sites, selectedCountry, handleError]);

  return {
    isLoading,
    error,
    sites,
    websiteMetrics,
    overallAnalytics,
    selectedCountry,
    dateRange,
    loadingSites,
    validateApiKey,
    loadSites,
    loadWebsiteMetrics,
    loadOverallAnalytics,
    setSelectedCountry,
    setDateRange,
    refreshData,
    clearError,
  };
};