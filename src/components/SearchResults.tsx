import React from 'react';
import { useSearchContext, SearchItem } from '@/context/SearchContext';
import { Badge } from '@/components/ui/badge';

const typeLabel: Record<SearchItem['type'], string> = {
  site: 'Site',
  query: 'Query',
  country: 'Country',
  device: 'Device',
  comment: 'Comment',
};

export const SearchResults: React.FC = () => {
  const { results, triggerAction } = useSearchContext();

  if (results.length === 0) return null;

  return (
    <div className="absolute mt-2 w-[32rem] bg-white border border-slate-200 rounded-lg shadow-lg z-40 overflow-hidden">
      <div className="max-h-96 overflow-auto divide-y divide-slate-100">
        {results.map((item) => (
          <button
            key={item.id}
            onClick={() => triggerAction(item)}
            className="w-full text-left px-3 py-2 hover:bg-slate-50 focus:bg-slate-50 flex items-start gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium text-slate-900 truncate">{item.title}</div>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">{typeLabel[item.type]}</Badge>
              </div>
              {item.subtitle && (
                <div className="text-xs text-slate-500 truncate">{item.subtitle}</div>
              )}
              {item.metrics && (
                <div className="mt-1 flex gap-3 text-[11px] text-slate-600">
                  {item.metrics.clicks !== undefined && <span>Clicks: {item.metrics.clicks.toLocaleString()}</span>}
                  {item.metrics.impressions !== undefined && <span>Impressions: {item.metrics.impressions.toLocaleString()}</span>}
                  {item.metrics.ctr !== undefined && <span>CTR: {(item.metrics.ctr * 100).toFixed(2)}%</span>}
                  {item.metrics.position !== undefined && <span>Pos: {item.metrics.position.toFixed(1)}</span>}
                  {item.metrics.commentsCount !== undefined && <span>Comments: {item.metrics.commentsCount}</span>}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};


