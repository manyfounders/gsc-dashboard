import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Key className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Search Console Analytics</h1>
          <p className="text-gray-600">Connect your Google Search Console to view website analytics</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Setup API Access</CardTitle>
            <CardDescription>
              Sign in with your Google account to access Search Console data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>To get started:</strong>
                <ol className="mt-2 ml-4 space-y-1 list-decimal">
                  <li>Make sure you have access to Google Search Console</li>
                  <li>Click the button below to sign in with Google</li>
                  <li>Grant the necessary permissions when prompted</li>
                </ol>
              </AlertDescription>
            </Alert>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Error:</strong> {error}
                </AlertDescription>
              </Alert>
            )}

              <Button 
              onClick={handleGoogleLogin}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700" 
              disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                  Sign in with Google
                  </div>
                )}
              </Button>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          Your data is accessed securely through Google's OAuth system
        </div>
      </div>
    </div>
  );
};