import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type SearchEntityType = 'site' | 'query' | 'country' | 'device' | 'comment';

export interface SearchItemMetrics {
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
  commentsCount?: number;
}

export interface SearchItem {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  siteUrl?: string;
  extra?: Record<string, any>;
  metrics?: SearchItemMetrics;
}

interface SearchContextValue {
  query: string;
  setQuery: (q: string) => void;
  results: SearchItem[];
  setIndex: (items: SearchItem[]) => void;
  clear: () => void;
  triggerAction: (item: SearchItem) => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

function normalize(text: string | undefined | null): string {
  return (text || '').toLowerCase().trim();
}

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [query, setQuery] = useState<string>('');
  const [index, setIndexInternal] = useState<SearchItem[]>([]);

  const setIndex = useCallback((items: SearchItem[]) => {
    setIndexInternal(items);
  }, []);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];

    // Простой поиск по title/subtitle/URL
    const filtered = index.filter((item) => {
      const hay = [item.title, item.subtitle, item.siteUrl]
        .filter(Boolean)
        .map((s) => normalize(String(s)))
        .join(' | ');
      return hay.includes(q);
    });

    // Слегка приоритезируем: site > query > country > device > comment
    const typeWeight: Record<SearchEntityType, number> = {
      site: 5,
      query: 4,
      country: 3,
      device: 2,
      comment: 1,
    };

    return filtered
      .sort((a, b) => (typeWeight[b.type] - typeWeight[a.type]))
      .slice(0, 50);
  }, [index, query]);

  const clear = useCallback(() => setQuery(''), []);

  const triggerAction = useCallback((item: SearchItem) => {
    // Единая шина событий: Dashboard подпишется и откроет нужный UI
    const event = new CustomEvent('search:action', { detail: item });
    window.dispatchEvent(event);
    // По UX — после выбора очищаем запрос
    setQuery('');
  }, []);

  const value: SearchContextValue = {
    query,
    setQuery,
    results,
    setIndex,
    clear,
    triggerAction,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};

export function useSearchContext(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearchContext must be used within SearchProvider');
  return ctx;
}


