import React, { useState } from 'react';
import { SearchConsoleApi } from '../services/searchConsoleApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ApiTestProps {
  userId?: string;
}

export const ApiTest: React.FC<ApiTestProps> = ({ userId }) => {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    if (!token) {
      setError('Введите токен');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing API with token:', token.substring(0, 20) + '...');
      const api = new SearchConsoleApi({ accessToken: token }, userId);
      
      // Тестируем получение сайтов
      console.log('Testing getSites...');
      const sites = await api.getSites();
      console.log('Sites result:', sites);
      
      if (sites.length === 0) {
        setResult({ message: 'Сайты не найдены или нет доступа', sites: [] });
        return;
      }

      // Тестируем получение метрик для первого сайта
      const firstSite = sites[0];
      console.log('Testing getSiteMetrics for:', firstSite.siteUrl);
      const metrics = await api.getSiteMetrics(firstSite.siteUrl, 7); // Последние 7 дней
      console.log('Metrics result:', metrics);

      setResult({
        sites: sites,
        metrics: metrics,
        siteUrl: firstSite.siteUrl
      });

    } catch (err: any) {
      console.error('API test error:', err);
      setError(err.message || 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const testDirectFetch = async () => {
    if (!token) {
      setError('Введите токен');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing direct fetch...');
      const response = await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Direct fetch response status:', response.status);
      console.log('Direct fetch response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Direct fetch error response:', errorText);
        setError(`HTTP ${response.status}: ${errorText}`);
        return;
      }
      
      const data = await response.json();
      console.log('Direct fetch success:', data);
      setResult({ message: 'Direct fetch successful', sites: data.siteEntry || [] });

    } catch (err: any) {
      console.error('Direct fetch error:', err);
      setError(`Direct fetch error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    if (!userId) {
      setError('User ID required for token refresh');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Refreshing token for user:', userId);
      const response = await fetch('https://us-central1-symmetric-flow-428315-r5.cloudfunctions.net/refreshToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      console.log('Refresh token response:', data);

      if (!data.ok || !data.user?.access_token) {
        setError(data.error || 'Failed to refresh token');
        return;
      }

      setToken(data.user.access_token);
      setResult({ 
        message: 'Token refreshed successfully', 
        newToken: data.user.access_token.substring(0, 20) + '...',
        user: data.user 
      });

    } catch (err: any) {
      console.error('Token refresh error:', err);
      setError(`Token refresh error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Тест Google Search Console API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="token">Access Token</Label>
            <Input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Введите access token"
              className="mt-1"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testApi} 
              disabled={loading || !token}
              className="flex-1"
            >
              {loading ? 'Тестирование...' : 'Тестировать API'}
            </Button>
            <Button 
              onClick={testDirectFetch} 
              disabled={loading || !token}
              variant="outline"
              className="flex-1"
            >
              {loading ? 'Тестирование...' : 'Прямой fetch'}
            </Button>
          </div>
          {userId && (
            <Button 
              onClick={refreshToken} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Обновление...' : 'Обновить токен'}
            </Button>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Ошибка:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">Результат:</p>
              <div className="mt-2 space-y-2">
                <p><strong>Найдено сайтов:</strong> {result.sites?.length || 0}</p>
                {result.sites?.map((site: any, index: number) => (
                  <div key={index} className="text-sm">
                    <p><strong>Сайт {index + 1}:</strong> {site.siteUrl}</p>
                    <p><strong>Уровень доступа:</strong> {site.permissionLevel}</p>
                  </div>
                ))}
                {result.metrics && (
                  <div className="mt-4 p-3 bg-white rounded border">
                    <p className="font-medium">Метрики для {result.siteUrl}:</p>
                    <p><strong>Клики:</strong> {result.metrics.totalClicks}</p>
                    <p><strong>Показы:</strong> {result.metrics.totalImpressions}</p>
                    <p><strong>CTR:</strong> {(result.metrics.averageCtr * 100).toFixed(2)}%</p>
                    <p><strong>Позиция:</strong> {result.metrics.averagePosition.toFixed(1)}</p>
                    <p><strong>Запросов:</strong> {result.metrics.topQueries?.length || 0}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 