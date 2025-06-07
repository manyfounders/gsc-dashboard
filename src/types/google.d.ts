interface GoogleTokenResponse {
  access_token: string;
  error?: string;
  error_description?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: any) => void;
            prompt?: string;
            select_account?: boolean;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

export {}; 