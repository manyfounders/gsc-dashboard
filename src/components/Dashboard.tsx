import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Mouse, Eye, Target, ArrowUp, Globe, RefreshCw, AlertCircle, Loader2, BarChart3, Search, Smartphone, Table, ArrowLeft, MapPin, Crown, CalendarDays, ChevronUp, ChevronDown, Plus, User, X } from 'lucide-react';
import { useMultiAccountSearchConsole, getCountryFlag, getCountryName } from '../hooks/useMultiAccountSearchConsole';
import { format } from 'date-fns';
import { SiteCardSkeleton } from './Skeleton';
import { QueryNetworkMap } from './QueryNetworkMap';


interface DashboardProps {
  apiKey: string;
  onDisconnect: () => void;
}

interface GoogleTokenResponse {
  access_token: string;
  error?: string;
  error_description?: string;
}

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  disabled?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ 
  startDate, 
  endDate, 
  onDateRangeChange, 
  disabled 
}) => {
  const [localStartDate, setLocalStartDate] = useState(format(startDate, 'yyyy-MM-dd'));
  const [localEndDate, setLocalEndDate] = useState(format(endDate, 'yyyy-MM-dd'));

  const handleApply = () => {
    const start = new Date(localStartDate);
    const end = new Date(localEndDate);
    
    if (start <= end) {
      onDateRangeChange(start, end);
    }
  };

  const presetRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 14 days', days: 14 },
    { label: 'Last 28 days', days: 28 },
    { label: 'Last 3 months', days: 90 },
  ];

  const handlePresetSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setLocalStartDate(format(start, 'yyyy-MM-dd'));
    setLocalEndDate(format(end, 'yyyy-MM-dd'));
    onDateRangeChange(start, end);
  };

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">Date Range:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="start-date" className="text-sm">From:</Label>
            <Input
              id="start-date"
              type="date"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              disabled={disabled}
              className="w-auto"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="end-date" className="text-sm">To:</Label>
            <Input
              id="end-date"
              type="date"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              disabled={disabled}
              className="w-auto"
            />
          </div>
          
          <Button onClick={handleApply} disabled={disabled} size="sm">
            Apply
          </Button>
          
          <div className="flex gap-2">
            {presetRanges.map((preset) => (
              <Button
                key={preset.days}
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect(preset.days)}
                disabled={disabled}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ apiKey, onDisconnect }) => {
  const [selectedWebsite, setSelectedWebsite] = useState<string>('');
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<{ query: string; siteUrl: string } | null>(null);
  const [querySortField, setQuerySortField] = useState<'site' | 'query' | 'clicks' | 'impressions' | 'ctr' | 'position'>('clicks');
  const [querySortDirection, setQuerySortDirection] = useState<'asc' | 'desc'>('desc');
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
    overallAnalytics,
    selectedCountry,
    dateRange,
    loadingSites,
    loadSites, 
    loadWebsiteMetrics, 
    loadOverallAnalytics,
    setSelectedCountry,
    setDateRange,
    refreshData,
    clearError 
  } = useMultiAccountSearchConsole(connectedAccounts);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  useEffect(() => {
    if (sites.length > 0 && (!selectedWebsite || selectedWebsite === '') && !compareMode) {
      loadOverallAnalytics();
    }
  }, [sites, selectedWebsite, compareMode, loadOverallAnalytics]);

  // Убираем автоматический выбор сайта, чтобы показывать общую аналитику
  // useEffect(() => {
  //   if (sites.length > 0 && !selectedWebsite && !compareMode) {
  //     const firstSite = sites[0];
  //     setSelectedWebsite(firstSite.siteUrl);
  //     loadWebsiteMetrics(firstSite.siteUrl, selectedCountry || undefined);
  //   }
  // }, [sites, selectedWebsite, compareMode, loadWebsiteMetrics, selectedCountry]);

  const handleWebsiteChange = async (siteUrl: string) => {
    setSelectedWebsite(siteUrl);
    const existingMetrics = websiteMetrics.find(w => w.siteUrl === siteUrl);
    if (!existingMetrics) {
      await loadWebsiteMetrics(siteUrl, selectedCountry || undefined);
    }
  };

  const handleBackToAllSites = () => {
    setSelectedWebsite('');
  };

  const handleWebsiteToggle = async (siteUrl: string) => {
    const newSelected = selectedWebsites.includes(siteUrl)
      ? selectedWebsites.filter(url => url !== siteUrl)
      : [...selectedWebsites, siteUrl];
    
    setSelectedWebsites(newSelected);
    
    if (!selectedWebsites.includes(siteUrl)) {
      const existingMetrics = websiteMetrics.find(w => w.siteUrl === siteUrl);
      if (!existingMetrics) {
        await loadWebsiteMetrics(siteUrl, selectedCountry || undefined);
      }
    }
  };

  const handleCountryChange = (country: string) => {
    const newCountry = country === 'all' ? null : country;
    setSelectedCountry(newCountry);
    
    // Reload data with new country filter
    if (selectedWebsite && !compareMode) {
      loadWebsiteMetrics(selectedWebsite, newCountry || undefined);
    } else if (compareMode) {
      selectedWebsites.forEach(siteUrl => {
        loadWebsiteMetrics(siteUrl, newCountry || undefined);
      });
    } else {
      loadOverallAnalytics();
    }
  };

  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate });
    
    // Reload data with new date range
    if (selectedWebsite && !compareMode) {
      loadWebsiteMetrics(selectedWebsite, selectedCountry || undefined, { startDate, endDate });
    } else if (compareMode) {
      selectedWebsites.forEach(siteUrl => {
        loadWebsiteMetrics(siteUrl, selectedCountry || undefined, { startDate, endDate });
      });
    } else {
      loadOverallAnalytics({ startDate, endDate });
    }
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    if (!compareMode) {
      // Entering compare mode - load metrics for selected sites
      setSelectedWebsites([selectedWebsite]);
    } else {
      // Exiting compare mode
      setSelectedWebsites([]);
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
    
    // Calculate performance score based on clicks and CTR
    const performanceScore = metrics.totalClicks * metrics.averageCtr;
    const maxScore = Math.max(...allMetrics.map(m => m.totalClicks * m.averageCtr));
    const minScore = Math.min(...allMetrics.map(m => m.totalClicks * m.averageCtr));
    
    // Normalize to 0-1 range
    const normalized = maxScore > minScore ? (performanceScore - minScore) / (maxScore - minScore) : 0.5;
    
    // Interpolate from red (0) to green (1)
    const red = Math.round(255 * (1 - normalized));
    const green = Math.round(255 * normalized);
    
    return `rgb(${red}, ${green}, 0)`;
  };

  const formatChartData = (dailyData: Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }>) => {
    return dailyData.map(day => ({
      date: format(new Date(day.date), 'MMM dd'),
      clicks: day.clicks,
      impressions: day.impressions,
      ctr: Math.round(day.ctr * 100) / 100,
      position: Math.round(day.position * 10) / 10,
    }));
  };

  const currentWebsiteMetrics = websiteMetrics.find(w => w.siteUrl === selectedWebsite);

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

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

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
      className={`cursor-pointer hover:bg-gray-50 transition-colors ${className || ''}`}
      onClick={() => handleQuerySort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {querySortField === field && (
          querySortDirection === 'asc' ? 
            <ChevronUp className="h-4 w-4 text-blue-600" /> : 
            <ChevronDown className="h-4 w-4 text-blue-600" />
        )}
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        {/* Logo and Title */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Search Console Analytics</h1>
              <p className="text-sm text-gray-600">
                {compareMode ? 'Advanced comparison mode' : 'Detailed performance insights'}
              </p>
              <p className="text-xs text-blue-600">
                {connectedAccounts.length} account{connectedAccounts.length !== 1 ? 's' : ''} connected
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Mode</h3>
            <div className="space-y-2">
              {compareMode ? (
                <Button 
                  onClick={toggleCompareMode} 
                  variant="outline"
                  className="w-full justify-start border-gray-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              ) : (
                <Button 
                  onClick={toggleCompareMode} 
                  variant="outline"
                  className="w-full justify-start border-gray-300"
                >
                  <Table className="h-4 w-4 mr-2" />
                  Compare Sites
                </Button>
              )}
            </div>
          </div>

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
                      className="h-6 w-6 p-0 hover:bg-red-100"
                    >
                      <X className="h-3 w-3 text-red-500" />
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
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="w-full p-6 space-y-8">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Country Filter */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Country Filter:</span>
                </div>
                <Select value={selectedCountry || 'all'} onValueChange={handleCountryChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="usa">United States</SelectItem>
                    <SelectItem value="gbr">United Kingdom</SelectItem>
                    <SelectItem value="deu">Germany</SelectItem>
                    <SelectItem value="fra">France</SelectItem>
                    <SelectItem value="esp">Spain</SelectItem>
                    <SelectItem value="ita">Italy</SelectItem>
                    <SelectItem value="can">Canada</SelectItem>
                    <SelectItem value="aus">Australia</SelectItem>
                    <SelectItem value="jpn">Japan</SelectItem>
                    <SelectItem value="bra">Brazil</SelectItem>
                  </SelectContent>
                </Select>
                {selectedCountry && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Filtered by {selectedCountry.toUpperCase()}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Date Range Filter */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onDateRangeChange={handleDateRangeChange}
                disabled={isLoading}
              />
            </CardContent>
          </Card>
        </div>

        {!compareMode ? (
          // Normal Dashboard Mode
          <>
            {/* Overall Analytics Summary - shown before site selection */}
            {overallAnalytics && (!selectedWebsite || selectedWebsite === '') && (
              <>
                {/* Overall Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 font-medium text-sm">Total Clicks</p>
                          <p className="text-3xl font-bold text-gray-900">{overallAnalytics.totalClicks.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Mouse className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Across all sites</p>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 font-medium text-sm">Total Impressions</p>
                          <p className="text-3xl font-bold text-gray-900">{overallAnalytics.totalImpressions.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Eye className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Across all sites</p>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 font-medium text-sm">Average CTR</p>
                          <p className="text-3xl font-bold text-gray-900">{(overallAnalytics.averageCtr * 100).toFixed(1)}%</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <Target className="h-8 w-8 text-yellow-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Across all sites</p>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 font-medium text-sm">Average Position</p>
                          <p className="text-3xl font-bold text-gray-900">{overallAnalytics.averagePosition.toFixed(1)}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <ArrowUp className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Across all sites</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Neural Query Network Map */}
                <QueryNetworkMap 
                  websiteMetrics={websiteMetrics} 
                  isLoading={isLoading || websiteMetrics.length === 0} 
                />

                {/* Top Performers Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Top Sites */}
                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                        <Crown className="h-5 w-5 text-yellow-600" />
                        Top Performing Sites
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Best sites by total clicks
                      </CardDescription>
          </CardHeader>
          <CardContent>
                      <div className="space-y-3">
                        {overallAnalytics.topSites.slice(0, 5).map((site, index) => (
                          <div key={site.siteUrl} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge className={index < 3 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"}>
                                #{index + 1}
                              </Badge>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{getSiteDisplayName(site.siteUrl)}</p>
                                <p className="text-xs text-gray-500">{(site.ctr * 100).toFixed(1)}% CTR</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">{site.clicks.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">clicks</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Queries */}
                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                        <Search className="h-5 w-5 text-blue-600" />
                        Top Performing Queries
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Best queries across all sites
                      </CardDescription>
          </CardHeader>
          <CardContent>
                      <div className="space-y-3">
                                                 {overallAnalytics.topQueries.slice(0, 5).map((query, index) => (
                           <div key={`${query.query}-${query.siteUrl}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                             <div className="flex items-center gap-3">
                               <Badge className={index < 3 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}>
                                 #{index + 1}
                               </Badge>
                               <div className="min-w-0 flex-1">
                                 <div className="flex items-center gap-2 mb-1">
                                   <p className="font-medium text-gray-900 text-sm truncate">{query.query}</p>
                                   {selectedCountry && (
                                     <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                       <MapPin className="h-3 w-3 mr-1" />
                                       {selectedCountry.toUpperCase()}
                                     </Badge>
                                   )}
                                 </div>
                                 <p className="text-xs text-gray-500">{getSiteDisplayName(query.siteUrl)}</p>
                               </div>
                             </div>
                             <div className="text-right">
                               <p className="font-bold text-gray-900">{query.clicks.toLocaleString()}</p>
                               <p className="text-xs text-gray-500">clicks</p>
                             </div>
                           </div>
                         ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Countries */}
                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-green-600" />
                        Top Countries
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Best performing locations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {overallAnalytics.topCountries.slice(0, 5).map((country, index) => (
                          <div key={country.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge className={index < 3 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                                #{index + 1}
                              </Badge>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{country.countryName}</p>
                                <p className="text-xs text-gray-500">Pos. {country.position.toFixed(1)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">{country.clicks.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">clicks</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Website Selector */}
            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 flex items-center gap-3">
                  <Globe className="h-6 w-6" />
                  Your Websites
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {selectedWebsite ? 'Site selected - view below or return to overview' : 'Select a website to view detailed analytics'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedWebsite && (
                  <div className="mb-4">
                    <Button 
                      onClick={handleBackToAllSites}
                      variant="outline" 
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to All Sites Overview
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sites.map((site) => {
                    const isSelected = selectedWebsite === site.siteUrl;
                    const metrics = websiteMetrics.find(w => w.siteUrl === site.siteUrl);
                    const isLoading = loadingSites.has(site.siteUrl);
                    
                    if (isLoading) {
                      return <SiteCardSkeleton key={site.siteUrl} />;
                    }
                    
                    return (
                      <div 
                        key={site.siteUrl} 
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 shadow-md' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => handleWebsiteChange(site.siteUrl)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: getPerformanceColor(site.siteUrl) }}
                              />
                              <h3 className="font-semibold text-gray-900 truncate">
                                {getSiteDisplayName(site.siteUrl)}
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">{site.permissionLevel}</p>
                            
                            {metrics ? (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white rounded p-2 border border-gray-200">
                                  <div className="text-gray-500">Clicks</div>
                                  <div className="font-bold text-gray-900">{metrics.totalClicks.toLocaleString()}</div>
                                </div>
                                <div className="bg-white rounded p-2 border border-gray-200">
                                  <div className="text-gray-500">CTR</div>
                                  <div className="font-bold text-gray-900">{(metrics.averageCtr * 100).toFixed(1)}%</div>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-gray-100 rounded p-2 border border-gray-200">
                                  <div className="text-gray-500">Clicks</div>
                                  <div className="font-bold text-gray-400">--</div>
                                </div>
                                <div className="bg-gray-100 rounded p-2 border border-gray-200">
                                  <div className="text-gray-500">CTR</div>
                                  <div className="font-bold text-gray-400">--</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analytics for Selected Site */}
            {currentWebsiteMetrics && (
              <>
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                          <p className="text-gray-600 font-medium text-sm">Total Clicks</p>
                          <p className="text-3xl font-bold text-gray-900">{currentWebsiteMetrics.totalClicks.toLocaleString()}</p>
                              </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                              <Mouse className="h-8 w-8 text-blue-600" />
                            </div>
                      </div>
                      <div className="flex items-center mt-3">
                              {currentWebsiteMetrics.trend === 'up' ? (
                                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                              ) : currentWebsiteMetrics.trend === 'down' ? (
                                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                              ) : null}
                              <span className={`text-sm font-medium ${
                                currentWebsiteMetrics.trend === 'up' ? 'text-green-600' : 
                          currentWebsiteMetrics.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {currentWebsiteMetrics.change > 0 ? '+' : ''}{currentWebsiteMetrics.change}%
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                          <p className="text-gray-600 font-medium text-sm">Total Impressions</p>
                          <p className="text-3xl font-bold text-gray-900">{currentWebsiteMetrics.totalImpressions.toLocaleString()}</p>
                              </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Eye className="h-8 w-8 text-green-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                          <p className="text-gray-600 font-medium text-sm">Average CTR</p>
                          <p className="text-3xl font-bold text-gray-900">{(currentWebsiteMetrics.averageCtr * 100).toFixed(1)}%</p>
                              </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <Target className="h-8 w-8 text-yellow-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                          <p className="text-gray-600 font-medium text-sm">Average Position</p>
                          <p className="text-3xl font-bold text-gray-900">{currentWebsiteMetrics.averagePosition.toFixed(1)}</p>
                              </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                              <ArrowUp className="h-8 w-8 text-purple-600" />
                        </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader>
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                        <BarChart3 className="h-5 w-5" />
                        Clicks & Impressions Trend
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Daily performance over the last 28 days
                      </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={formatChartData(currentWebsiteMetrics.dailyData)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              color: '#374151'
                            }} 
                          />
                          <Bar dataKey="clicks" fill="#3B82F6" name="Clicks" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="impressions" fill="#10B981" name="Impressions" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader>
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                        <TrendingUp className="h-5 w-5" />
                        CTR & Position Trend
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Click-through rate and average position
                      </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={formatChartData(currentWebsiteMetrics.dailyData)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              color: '#374151'
                            }} 
                          />
                          <Line type="monotone" dataKey="ctr" stroke="#F59E0B" strokeWidth={2} name="CTR %" />
                                <Line type="monotone" dataKey="position" stroke="#8B5CF6" strokeWidth={2} name="Avg Position" />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <Card className="lg:col-span-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader>
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                        <Search className="h-5 w-5" />
                        Top Performing Queries
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Your best search queries by clicks
                      </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                        {currentWebsiteMetrics.topQueries.slice(0, 8).map((query, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900 truncate">{query.query}</p>
                                {selectedCountry && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {selectedCountry.toUpperCase()}
                                  </Badge>
                                )}
                                    </div>
                              <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Mouse className="h-3 w-3" />
                                  {query.clicks}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {query.impressions.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {(query.ctr * 100).toFixed(1)}%
                                </span>
                                <span className="flex items-center gap-1">
                                  <ArrowUp className="h-3 w-3" />
                                  {query.position.toFixed(1)}
                                </span>
                                  </div>
                                  </div>
                            <Badge 
                              variant={index < 3 ? "default" : "secondary"}
                              className={index < 3 ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-gray-100 text-gray-700"}
                            >
                                    #{index + 1}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader>
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                        <MapPin className="h-5 w-5" />
                        Country Breakdown
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Traffic distribution by country
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {currentWebsiteMetrics.countryBreakdown.slice(0, 8).map((country, index) => (
                          <div key={country.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <Badge className={index < 3 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                                #{index + 1}
                              </Badge>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{country.countryName}</p>
                                <p className="text-xs text-gray-500">{(country.ctr * 100).toFixed(1)}% CTR • Pos. {country.position.toFixed(1)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">{country.clicks.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">{country.impressions.toLocaleString()} imp</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader>
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                        <Smartphone className="h-5 w-5" />
                        Device Breakdown
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Traffic distribution by device
                      </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <PieChart>
                                <Pie
                            data={currentWebsiteMetrics.deviceBreakdown.map((device, index) => ({
                              name: device.device.charAt(0).toUpperCase() + device.device.slice(1),
                              value: device.clicks,
                              fill: colors[index % colors.length]
                            }))}
                                  cx="50%"
                                  cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                                  dataKey="value"
                                >
                            {currentWebsiteMetrics.deviceBreakdown.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                  ))}
                                </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              color: '#374151'
                            }} 
                          />
                              </PieChart>
                            </ResponsiveContainer>
                      <div className="space-y-2 mt-4">
                        {currentWebsiteMetrics.deviceBreakdown.map((device, index) => (
                          <div key={device.device} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: colors[index % colors.length] }}
                              />
                              <span className="text-gray-700 capitalize">{device.device}</span>
                            </div>
                            <span className="font-medium text-gray-900">{device.clicks.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                          </CardContent>
                        </Card>
                      </div>
              </>
            )}
                    </>
                  ) : (
          // Compare Mode
          <>
            {/* Date Range Picker for Compare Mode */}
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateRangeChange={handleDateRangeChange}
              disabled={isLoading}
            />

            {/* Site Selection for Compare Mode */}
            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sites.map((site) => {
                    const isSelected = selectedWebsites.includes(site.siteUrl);
                    const metrics = websiteMetrics.find(w => w.siteUrl === site.siteUrl);
                    const isLoading = loadingSites.has(site.siteUrl);
                    
                    if (isLoading) {
                      return <SiteCardSkeleton key={site.siteUrl} />;
                    }
                    
                    return (
                      <div 
                        key={site.siteUrl} 
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-green-50 border-green-200 shadow-md' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => handleWebsiteToggle(site.siteUrl)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={isSelected}
                            className="mt-1 border-gray-400 data-[state=checked]:bg-green-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: getPerformanceColor(site.siteUrl) }}
                              />
                              <h3 className="font-semibold text-gray-900 truncate">
                                {getSiteDisplayName(site.siteUrl)}
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">{site.permissionLevel}</p>
                            
                            {metrics ? (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white rounded p-2 border border-gray-200">
                                  <div className="text-gray-500">Clicks</div>
                                  <div className="font-bold text-gray-900">{metrics.totalClicks.toLocaleString()}</div>
                                </div>
                                <div className="bg-white rounded p-2 border border-gray-200">
                                  <div className="text-gray-500">CTR</div>
                                  <div className="font-bold text-gray-900">{(metrics.averageCtr * 100).toFixed(1)}%</div>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-gray-100 rounded p-2 border border-gray-200">
                                  <div className="text-gray-500">Clicks</div>
                                  <div className="font-bold text-gray-400">--</div>
                                </div>
                                <div className="bg-gray-100 rounded p-2 border border-gray-200">
                                  <div className="text-gray-500">CTR</div>
                                  <div className="font-bold text-gray-400">--</div>
                      </div>
                    </div>
                  )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Comparison Tables */}
            {selectedWebsites.length > 0 && (
              <>
                {/* Overall Metrics Comparison */}
                <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                      <BarChart3 className="h-5 w-5" />
                      Overall Performance Comparison
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Compare key metrics across selected websites
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-gray-900">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Website</th>
                            <th className="text-right py-3 px-4 text-gray-700 font-semibold">Total Clicks</th>
                            <th className="text-right py-3 px-4 text-gray-700 font-semibold">Total Impressions</th>
                            <th className="text-right py-3 px-4 text-gray-700 font-semibold">Average CTR</th>
                            <th className="text-right py-3 px-4 text-gray-700 font-semibold">Average Position</th>
                            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Top Countries</th>
                            <th className="text-center py-3 px-4 text-gray-700 font-semibold">Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedWebsites.map((siteUrl) => {
                            const metrics = websiteMetrics.find(w => w.siteUrl === siteUrl);
                            if (!metrics) return null;
                            
                            return (
                              <tr key={siteUrl} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: getPerformanceColor(siteUrl) }}
                                    />
                                    <span className="font-medium">{getSiteDisplayName(siteUrl)}</span>
                                  </div>
                                </td>
                                <td className="text-right py-4 px-4 font-bold">
                                  {metrics.totalClicks.toLocaleString()}
                                </td>
                                <td className="text-right py-4 px-4 font-bold">
                                  {metrics.totalImpressions.toLocaleString()}
                                </td>
                                <td className="text-right py-4 px-4 font-bold">
                                  {(metrics.averageCtr * 100).toFixed(2)}%
                                </td>
                                <td className="text-right py-4 px-4 font-bold">
                                  {metrics.averagePosition.toFixed(1)}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {metrics.countryBreakdown.slice(0, 3).map((country, index) => (
                                      <Badge 
                                        key={country.country}
                                        variant="outline" 
                                        className={`text-xs ${
                                          index === 0 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          index === 1 ? 'bg-green-50 text-green-700 border-green-200' :
                                          'bg-purple-50 text-purple-700 border-purple-200'
                                        }`}
                                      >
                                        <span className="mr-1">{getCountryFlag(country.country)}</span>
                                        {getCountryName(country.country)}
                                      </Badge>
                                    ))}
                                    {metrics.countryBreakdown.length > 3 && (
                                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                                        +{metrics.countryBreakdown.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="text-center py-4 px-4">
                                  <div className="flex items-center justify-center gap-1">
                                    {metrics.trend === 'up' ? (
                                      <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : metrics.trend === 'down' ? (
                                      <TrendingDown className="h-4 w-4 text-red-600" />
                                    ) : null}
                                    <span className={`text-sm font-medium ${
                                      metrics.trend === 'up' ? 'text-green-600' : 
                                      metrics.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                                    }`}>
                                      {metrics.change > 0 ? '+' : ''}{metrics.change}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
          </CardContent>
        </Card>

                {/* Top Queries Comparison */}
                <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <SortableHeader field="site" className="text-left py-3 px-4 text-gray-700 font-semibold">
                              Site
                            </SortableHeader>
                            <SortableHeader field="query" className="text-left py-3 px-4 text-gray-700 font-semibold">
                              Query
                            </SortableHeader>
                            <SortableHeader field="clicks" className="text-right py-3 px-4 text-gray-700 font-semibold">
                              Clicks
                            </SortableHeader>
                            <SortableHeader field="impressions" className="text-right py-3 px-4 text-gray-700 font-semibold">
                              Impressions
                            </SortableHeader>
                            <SortableHeader field="ctr" className="text-right py-3 px-4 text-gray-700 font-semibold">
                              CTR
                            </SortableHeader>
                            <SortableHeader field="position" className="text-right py-3 px-4 text-gray-700 font-semibold">
                              Position
                            </SortableHeader>
                            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Countries</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSortedQueries().map((query, index) => (
                            <tr key={`${query.siteUrl}-${query.query}`} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: getPerformanceColor(query.siteUrl) }}
                                  />
                                  <span className="font-medium">{query.siteName}</span>
      </div>
                              </td>
                              <td 
                                className="py-3 px-4 font-medium max-w-xs cursor-pointer hover:bg-blue-50 rounded transition-colors"
                                onClick={() => setSelectedQuery({ query: query.query, siteUrl: query.siteUrl })}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-blue-600 hover:text-blue-800">{query.query}</span>
                                  {selectedCountry && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs shrink-0">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {selectedCountry.toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="text-right py-3 px-4 font-bold">
                                {query.clicks.toLocaleString()}
                              </td>
                              <td className="text-right py-3 px-4">
                                {query.impressions.toLocaleString()}
                              </td>
                              <td className="text-right py-3 px-4">
                                {(query.ctr * 100).toFixed(1)}%
                              </td>
                              <td className="text-right py-3 px-4">
                                {query.position.toFixed(1)}
                              </td>
                              <td className="py-3 px-4">
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
                                  {query.countries.length > 2 && (
                                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
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
                <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                      <Smartphone className="h-5 w-5" />
                      Device Performance Comparison
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Compare device performance across selected websites
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-gray-900">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Website</th>
                            <th className="text-right py-3 px-4 text-gray-700 font-semibold">Desktop Clicks</th>
                            <th className="text-right py-3 px-4 text-gray-700 font-semibold">Mobile Clicks</th>
                            <th className="text-right py-3 px-4 text-gray-700 font-semibold">Tablet Clicks</th>
                            <th className="text-right py-3 px-4 text-gray-700 font-semibold">Mobile %</th>
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
                            const mobilePercent = total > 0 ? (mobile / total * 100).toFixed(1) : '0';
                            
                            return (
                              <tr key={siteUrl} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: getPerformanceColor(siteUrl) }}
                                    />
                                    <span className="font-medium">{getSiteDisplayName(siteUrl)}</span>
                                  </div>
                                </td>
                                <td className="text-right py-4 px-4 font-bold">
                                  {desktop.toLocaleString()}
                                </td>
                                <td className="text-right py-4 px-4 font-bold">
                                  {mobile.toLocaleString()}
                                </td>
                                <td className="text-right py-4 px-4 font-bold">
                                  {tablet.toLocaleString()}
                                </td>
                                <td className="text-right py-4 px-4 font-bold">
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
                  Back to {compareMode ? 'Comparison' : 'Dashboard'}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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

                      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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

                      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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

                      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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
                      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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
    </div>
  );
};