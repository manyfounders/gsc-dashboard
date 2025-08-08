import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Search, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface IndexingApiProps {
  user: any;
}

const SUBMIT_URL_ENDPOINT = 'https://us-central1-symmetric-flow-428315-r5.cloudfunctions.net/submitUrlForIndexing';
const CHECK_STATUS_ENDPOINT = 'https://us-central1-symmetric-flow-428315-r5.cloudfunctions.net/checkIndexingStatus';

export const IndexingApi: React.FC<IndexingApiProps> = ({ user }) => {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleSubmitUrl = async () => {
    if (!url.trim()) {
      setError('Введите URL');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSubmitResult(null);

    try {
      const response = await fetch(SUBMIT_URL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), userId: user.uid })
      });

      const data = await response.json();
      
      if (data.ok) {
        setSubmitResult(data);
      } else {
        setError(data.error || 'Ошибка отправки URL');
      }
    } catch (err: any) {
      setError('Ошибка сети: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!url.trim()) {
      setError('Введите URL');
      return;
    }

    setIsChecking(true);
    setError('');
    setCheckResult(null);

    try {
      const response = await fetch(CHECK_STATUS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), userId: user.uid })
      });

      const data = await response.json();
      
      if (data.ok) {
        setCheckResult(data.result);
      } else {
        setError(data.error || 'Ошибка проверки статуса');
      }
    } catch (err: any) {
      setError('Ошибка сети: ' + err.message);
    } finally {
      setIsChecking(false);
    }
  };

  const getIndexingStatus = (result: any) => {
    if (!result) return null;
    
    const indexStatus = result.indexStatusResult?.verdict;
    const mobileUsability = result.mobileUsabilityResult?.verdict;
    const richResults = result.richResultsResult?.verdict;
    
    return {
      indexStatus,
      mobileUsability,
      richResults,
      coverageState: result.indexStatusResult?.coverageState,
      robotsTxtState: result.indexStatusResult?.robotsTxtState,
      lastCrawlTime: result.indexStatusResult?.lastCrawlTime,
      pageFetchState: result.indexStatusResult?.pageFetchState
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAIL':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PARTIAL':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'Успешно';
      case 'FAIL':
        return 'Ошибка';
      case 'PARTIAL':
        return 'Частично';
      default:
        return 'Неизвестно';
    }
  };

  const status = getIndexingStatus(checkResult);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Google Indexing API
          </CardTitle>
          <CardDescription>
            Отправляйте URL для индексации и проверяйте статус индексации в Google
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL для индексации</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleSubmitUrl} 
              disabled={isSubmitting || !url.trim()}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Отправить в индекс
            </Button>
            
            <Button 
              onClick={handleCheckStatus} 
              disabled={isChecking || !url.trim()}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Проверить статус
            </Button>
          </div>

          {/* Результат отправки */}
          {submitResult && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>URL отправлен для индексации!</strong>
                <br />
                Notification Metadata: {submitResult.notificationMetadata?.latestUpdate?.notifyTime || 'N/A'}
              </AlertDescription>
            </Alert>
          )}

          {/* Результат проверки */}
          {status && (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Результат проверки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.indexStatus)}
                      <span className="font-medium">Индексация:</span>
                      <span className={status.indexStatus === 'PASS' ? 'text-green-600' : 'text-red-600'}>
                        {getStatusText(status.indexStatus)}
                      </span>
                    </div>
                    
                    {status.coverageState && (
                      <div className="text-sm text-gray-600">
                        Состояние покрытия: {status.coverageState}
                      </div>
                    )}
                    
                    {status.robotsTxtState && (
                      <div className="text-sm text-gray-600">
                        Robots.txt: {status.robotsTxtState}
                      </div>
                    )}
                    
                    {status.pageFetchState && (
                      <div className="text-sm text-gray-600">
                        Состояние загрузки: {status.pageFetchState}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.mobileUsability)}
                      <span className="font-medium">Мобильная версия:</span>
                      <span className={status.mobileUsability === 'PASS' ? 'text-green-600' : 'text-red-600'}>
                        {getStatusText(status.mobileUsability)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.richResults)}
                      <span className="font-medium">Rich Results:</span>
                      <span className={status.richResults === 'PASS' ? 'text-green-600' : 'text-red-600'}>
                        {getStatusText(status.richResults)}
                      </span>
                    </div>
                  </div>
                </div>

                {status.lastCrawlTime && (
                  <div className="text-sm text-gray-600">
                    Последнее сканирование: {new Date(status.lastCrawlTime).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 