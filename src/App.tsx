import { useState } from 'react';
import { ApiKeySetup } from './components/ApiKeySetup';
import { Dashboard } from './components/Dashboard';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
  };

  const handleDisconnect = () => {
    setApiKey(null);
  };

  return (
    <div className="App">
      {!apiKey ? (
        <ApiKeySetup onApiKeySubmit={handleApiKeySubmit} />
      ) : (
        <Dashboard apiKey={apiKey} onDisconnect={handleDisconnect} />
      )}
    </div>
  );
}

export default App;