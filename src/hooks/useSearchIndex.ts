import { useEffect, useMemo } from 'react';
import { useSearchContext, SearchItem } from '@/context/SearchContext';

interface BuildIndexInput {
  sites: Array<{
    siteUrl: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  queries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    siteUrl: string;
  }>;
  countries: Array<{
    country: string;
    countryName: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  devices?: Array<{
    device: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    siteUrl?: string;
  }>;
  comments?: Array<{
    id: string;
    siteUrl: string;
    siteName: string;
    content: string;
  }>;
}

export function useSearchIndex(data: BuildIndexInput | null) {
  const { setIndex } = useSearchContext();

  const items = useMemo<SearchItem[]>(() => {
    if (!data) return [];

    const siteItems: SearchItem[] = data.sites.map((s) => ({
      id: `site:${s.siteUrl}`,
      type: 'site',
      title: s.siteUrl,
      siteUrl: s.siteUrl,
      metrics: {
        clicks: s.clicks,
        impressions: s.impressions,
        ctr: s.ctr,
        position: s.position,
      },
    }));

    const queryItems: SearchItem[] = data.queries.map((q, i) => ({
      id: `query:${q.siteUrl}:${q.query}:${i}`,
      type: 'query',
      title: q.query,
      subtitle: q.siteUrl,
      siteUrl: q.siteUrl,
      metrics: {
        clicks: q.clicks,
        impressions: q.impressions,
        ctr: q.ctr,
        position: q.position,
      },
    }));

    const countryItems: SearchItem[] = data.countries.map((c) => ({
      id: `country:${c.country}`,
      type: 'country',
      title: c.countryName,
      subtitle: c.country.toUpperCase(),
      metrics: {
        clicks: c.clicks,
        impressions: c.impressions,
        ctr: c.ctr,
        position: c.position,
      },
    }));

    const deviceItems: SearchItem[] = (data.devices || []).map((d, i) => ({
      id: `device:${d.device}:${i}`,
      type: 'device',
      title: d.device,
      subtitle: d.siteUrl,
      siteUrl: d.siteUrl,
      metrics: {
        clicks: d.clicks,
        impressions: d.impressions,
        ctr: d.ctr,
        position: d.position,
      },
    }));

    const commentItems: SearchItem[] = (data.comments || []).map((c) => ({
      id: `comment:${c.id}`,
      type: 'comment',
      title: c.content,
      subtitle: c.siteName,
      siteUrl: c.siteUrl,
    }));

    return [...siteItems, ...queryItems, ...countryItems, ...deviceItems, ...commentItems];
  }, [data]);

  useEffect(() => {
    setIndex(items);
  }, [items, setIndex]);
}


