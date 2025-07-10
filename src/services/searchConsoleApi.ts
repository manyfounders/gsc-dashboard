export interface SearchConsoleCredentials {
  accessToken: string;
}

export interface SiteInfo {
  siteUrl: string;
  permissionLevel: 'siteFullUser' | 'siteOwner' | 'siteRestrictedUser' | 'siteUnverifiedUser';
}

export interface SearchAnalyticsQuery {
  startDate: string;
  endDate: string;
  dimensions?: ('country' | 'device' | 'page' | 'query' | 'searchAppearance' | 'date')[];
  dimensionFilterGroups?: DimensionFilterGroup[];
  aggregationType?: 'auto' | 'byProperty' | 'byPage';
  rowLimit?: number;
  startRow?: number;
}

export interface DimensionFilterGroup {
  groupType: 'and';
  filters: DimensionFilter[];
}

export interface DimensionFilter {
  dimension: 'country' | 'device' | 'page' | 'query' | 'searchAppearance';
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'includingRegex' | 'excludingRegex';
  expression: string;
}

export interface SearchAnalyticsRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[];
  responseAggregationType?: string;
}

export interface OverallAnalytics {
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  topSites: Array<{
    siteUrl: string;
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
    siteUrl: string;
  }>;
  topCountries: Array<{
    country: string;
    countryName: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

// Country code to name mapping
const countryNames: Record<string, string> = {
  'usa': 'United States',
  'gbr': 'United Kingdom',
  'deu': 'Germany',
  'fra': 'France',
  'esp': 'Spain',
  'ita': 'Italy',
  'nld': 'Netherlands',
  'can': 'Canada',
  'aus': 'Australia',
  'jpn': 'Japan',
  'kor': 'South Korea',
  'chn': 'China',
  'ind': 'India',
  'bra': 'Brazil',
  'mex': 'Mexico',
  'rus': 'Russia',
  'tur': 'Turkey',
  'pol': 'Poland',
  'swe': 'Sweden',
  'nor': 'Norway',
  'dnk': 'Denmark',
  'fin': 'Finland',
  'che': 'Switzerland',
  'aut': 'Austria',
  'bel': 'Belgium',
  'prt': 'Portugal',
  'grc': 'Greece',
  'cze': 'Czech Republic',
  'hun': 'Hungary',
  'rou': 'Romania',
  'bgr': 'Bulgaria',
  'hrv': 'Croatia',
  'svk': 'Slovakia',
  'svn': 'Slovenia',
  'est': 'Estonia',
  'lva': 'Latvia',
  'ltu': 'Lithuania',
  'irl': 'Ireland',
  'isr': 'Israel',
  'are': 'UAE',
  'sau': 'Saudi Arabia',
  'tha': 'Thailand',
  'sgp': 'Singapore',
  'mys': 'Malaysia',
  'idn': 'Indonesia',
  'phl': 'Philippines',
  'vnm': 'Vietnam',
  'nzl': 'New Zealand',
  'zaf': 'South Africa',
  'arg': 'Argentina',
  'chl': 'Chile',
  'col': 'Colombia',
  'per': 'Peru',
  'ukr': 'Ukraine',
  'srb': 'Serbia',
  'mkd': 'North Macedonia',
  'alb': 'Albania',
  'bih': 'Bosnia and Herzegovina',
  'mne': 'Montenegro',
  'lux': 'Luxembourg',
  'mlt': 'Malta',
  'cyp': 'Cyprus',
  'isl': 'Iceland',
};

const getCountryName = (countryCode: string): string => {
  return countryNames[countryCode.toLowerCase()] || countryCode.toUpperCase();
};

export class SearchConsoleApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'SearchConsoleApiError';
  }
}

export class SearchConsoleApi {
  private accessToken: string;
  private baseUrl = 'https://searchconsole.googleapis.com/webmasters/v3';

  constructor(credentials: SearchConsoleCredentials) {
    this.accessToken = credentials.accessToken;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('Making request to:', url);
    console.log('Request options:', JSON.stringify(options, null, 2));
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        ...options.headers,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Error response:', errorData);
      
      if (response.status === 401) {
        throw new SearchConsoleApiError(
          'Invalid access token. Please check your Google OAuth credentials.',
          401,
          'INVALID_ACCESS_TOKEN'
        );
      }
      
      if (response.status === 403) {
        throw new SearchConsoleApiError(
          'Access denied. Make sure the Search Console API is enabled and you have proper permissions.',
          403,
          'ACCESS_DENIED'
        );
      }

      if (response.status === 404) {
        throw new SearchConsoleApiError(
          'Site not found or not verified in Search Console.',
          404,
          'SITE_NOT_FOUND'
        );
      }

      throw new SearchConsoleApiError(
        errorData.error?.message || `API request failed with status ${response.status}`,
        response.status,
        errorData.error?.code
      );
    }

    return response.json();
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.getSites();
      return true;
    } catch (error) {
      if (error instanceof SearchConsoleApiError) {
        throw error;
      }
      throw new SearchConsoleApiError('Failed to validate API key');
    }
  }

  async getSites(): Promise<SiteInfo[]> {
    const response = await this.makeRequest<{ siteEntry?: SiteInfo[] }>('/sites');
    return response.siteEntry || [];
  }

  async getSearchAnalytics(
    siteUrl: string,
    query: SearchAnalyticsQuery
  ): Promise<SearchAnalyticsResponse> {
    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const endpoint = `/sites/${encodedSiteUrl}/searchAnalytics/query`;
    
    return this.makeRequest<SearchAnalyticsResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }

  async getSiteMetrics(siteUrl: string, days: number = 28, country?: string): Promise<{
    totalClicks: number;
    totalImpressions: number;
    averageCtr: number;
    averagePosition: number;
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
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Prepare dimension filters for country if specified
    const dimensionFilterGroups: DimensionFilterGroup[] = country ? [{
      groupType: 'and',
      filters: [{
        dimension: 'country',
        operator: 'equals',
        expression: country
      }]
    }] : [];

    // Get overall metrics
    const overallQuery: SearchAnalyticsQuery = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      rowLimit: 1,
      dimensionFilterGroups: dimensionFilterGroups.length > 0 ? dimensionFilterGroups : undefined,
    };

    const overallResponse = await this.getSearchAnalytics(siteUrl, overallQuery);
    const overallMetrics = overallResponse.rows?.[0] || {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
    };

    // Get daily data
    const dailyQuery: SearchAnalyticsQuery = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ['date'],
      rowLimit: days,
      dimensionFilterGroups: dimensionFilterGroups.length > 0 ? dimensionFilterGroups : undefined,
    };

    const dailyResponse = await this.getSearchAnalytics(siteUrl, dailyQuery);
    const dailyData = (dailyResponse.rows || []).map(row => ({
      date: row.keys?.[0] || '',
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));

    // Get top queries
    const queriesQuery: SearchAnalyticsQuery = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ['query'],
      rowLimit: 20,
      dimensionFilterGroups: dimensionFilterGroups.length > 0 ? dimensionFilterGroups : undefined,
    };

    const queriesResponse = await this.getSearchAnalytics(siteUrl, queriesQuery);
    const topQueries = (queriesResponse.rows || []).map(row => ({
      query: row.keys?.[0] || '',
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));

    // Get device breakdown
    const deviceQuery: SearchAnalyticsQuery = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ['device'],
      rowLimit: 10,
      dimensionFilterGroups: dimensionFilterGroups.length > 0 ? dimensionFilterGroups : undefined,
    };

    const deviceResponse = await this.getSearchAnalytics(siteUrl, deviceQuery);
    const deviceBreakdown = (deviceResponse.rows || []).map(row => ({
      device: row.keys?.[0] || '',
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));

    // Get country breakdown (only if no country filter is applied)
    let countryBreakdown: Array<{
      country: string;
      countryName: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }> = [];

    if (!country) {
      const countryQuery: SearchAnalyticsQuery = {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ['country'],
        rowLimit: 20,
      };

      const countryResponse = await this.getSearchAnalytics(siteUrl, countryQuery);
      countryBreakdown = (countryResponse.rows || []).map(row => ({
        country: row.keys?.[0] || '',
        countryName: getCountryName(row.keys?.[0] || ''),
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
    }

    return {
      totalClicks: overallMetrics.clicks,
      totalImpressions: overallMetrics.impressions,
      averageCtr: overallMetrics.ctr,
      averagePosition: overallMetrics.position,
      dailyData,
      topQueries,
      deviceBreakdown,
      countryBreakdown,
    };
  }

  async getSiteMetricsWithDates(siteUrl: string, startDate: Date, endDate: Date, country?: string): Promise<{
    totalClicks: number;
    totalImpressions: number;
    averageCtr: number;
    averagePosition: number;
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
  }> {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Prepare dimension filters for country if specified
    const dimensionFilterGroups: DimensionFilterGroup[] = country ? [{
      groupType: 'and',
      filters: [{
        dimension: 'country',
        operator: 'equals',
        expression: country
      }]
    }] : [];

    // Get overall metrics
    const overallQuery: SearchAnalyticsQuery = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      rowLimit: 1,
      dimensionFilterGroups: dimensionFilterGroups.length > 0 ? dimensionFilterGroups : undefined,
    };

    const overallResponse = await this.getSearchAnalytics(siteUrl, overallQuery);
    const overallMetrics = overallResponse.rows?.[0] || {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
    };

    console.log(`getSiteMetricsWithDates for ${siteUrl}:`, {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      country,
      overallMetrics,
      totalRows: overallResponse.rows?.length || 0
    });

    // Get daily data
    const dailyQuery: SearchAnalyticsQuery = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ['date'],
      rowLimit: 1000, // Увеличиваем лимит для больших диапазонов дат
      dimensionFilterGroups: dimensionFilterGroups.length > 0 ? dimensionFilterGroups : undefined,
    };

    const dailyResponse = await this.getSearchAnalytics(siteUrl, dailyQuery);
    const dailyData = (dailyResponse.rows || [])
      .map(row => ({
        date: row.keys?.[0] || '',
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Сортируем по дате

    // Get top queries
    const queriesQuery: SearchAnalyticsQuery = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ['query'],
      rowLimit: 20,
      dimensionFilterGroups: dimensionFilterGroups.length > 0 ? dimensionFilterGroups : undefined,
    };

    const queriesResponse = await this.getSearchAnalytics(siteUrl, queriesQuery);
    const topQueries = (queriesResponse.rows || []).map(row => ({
      query: row.keys?.[0] || '',
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));

    // Get device breakdown
    const deviceQuery: SearchAnalyticsQuery = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ['device'],
      rowLimit: 10,
      dimensionFilterGroups: dimensionFilterGroups.length > 0 ? dimensionFilterGroups : undefined,
    };

    const deviceResponse = await this.getSearchAnalytics(siteUrl, deviceQuery);
    const deviceBreakdown = (deviceResponse.rows || []).map(row => ({
      device: row.keys?.[0] || '',
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));

    // Get country breakdown (only if no country filter is applied)
    let countryBreakdown: Array<{
      country: string;
      countryName: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }> = [];

    if (!country) {
      const countryQuery: SearchAnalyticsQuery = {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ['country'],
        rowLimit: 20,
      };

      const countryResponse = await this.getSearchAnalytics(siteUrl, countryQuery);
      countryBreakdown = (countryResponse.rows || []).map(row => ({
        country: row.keys?.[0] || '',
        countryName: getCountryName(row.keys?.[0] || ''),
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
    }

    return {
      totalClicks: overallMetrics.clicks,
      totalImpressions: overallMetrics.impressions,
      averageCtr: overallMetrics.ctr,
      averagePosition: overallMetrics.position,
      dailyData,
      topQueries,
      deviceBreakdown,
      countryBreakdown,
    };
  }

  async getOverallAnalytics(sites: SiteInfo[], country?: string): Promise<OverallAnalytics> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 28);
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Prepare dimension filters for country if specified
    const dimensionFilterGroups: DimensionFilterGroup[] = country ? [{
      groupType: 'and',
      filters: [{
        dimension: 'country',
        operator: 'equals',
        expression: country
      }]
    }] : [];

    const sitePromises = sites.map(async (site) => {
      try {
        // Get overall metrics for each site
        const overallQuery: SearchAnalyticsQuery = {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          rowLimit: 1,
          dimensionFilterGroups: dimensionFilterGroups.length > 0 ? dimensionFilterGroups : undefined,
        };

        const overallResponse = await this.getSearchAnalytics(site.siteUrl, overallQuery);
        const overallMetrics = overallResponse.rows?.[0] || {
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
        };

        // Get top queries for this site
        const queriesQuery: SearchAnalyticsQuery = {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          dimensions: ['query'],
          rowLimit: 10,
          dimensionFilterGroups: dimensionFilterGroups.length > 0 ? dimensionFilterGroups : undefined,
        };

        const queriesResponse = await this.getSearchAnalytics(site.siteUrl, queriesQuery);
        const topQueries = (queriesResponse.rows || []).map(row => ({
          query: row.keys?.[0] || '',
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
          siteUrl: site.siteUrl,
        }));

        return {
          site: {
            siteUrl: site.siteUrl,
            clicks: overallMetrics.clicks,
            impressions: overallMetrics.impressions,
            ctr: overallMetrics.ctr,
            position: overallMetrics.position,
          },
          queries: topQueries,
        };
      } catch (error) {
        console.error(`Failed to get analytics for ${site.siteUrl}:`, error);
        return {
          site: {
            siteUrl: site.siteUrl,
            clicks: 0,
            impressions: 0,
            ctr: 0,
            position: 0,
          },
          queries: [],
        };
      }
    });

    const results = await Promise.all(sitePromises);
    
    // Aggregate results
    const topSites = results
      .map(r => r.site)
      .filter(s => s.clicks > 0)
      .sort((a, b) => b.clicks - a.clicks);

    const allQueries = results.flatMap(r => r.queries);
    const topQueries = allQueries
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 20);

    const totalClicks = topSites.reduce((sum, site) => sum + site.clicks, 0);
    const totalImpressions = topSites.reduce((sum, site) => sum + site.impressions, 0);
    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) : 0;
    const averagePosition = topSites.length > 0 ? 
      topSites.reduce((sum, site) => sum + site.position, 0) / topSites.length : 0;

    // Get country breakdown (only if no country filter is applied)
    let topCountries: Array<{
      country: string;
      countryName: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }> = [];

    if (!country && sites.length > 0) {
      try {
        // Get country data from the first site as a representative sample
        const countryQuery: SearchAnalyticsQuery = {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          dimensions: ['country'],
          rowLimit: 15,
        };

        const countryResponse = await this.getSearchAnalytics(sites[0].siteUrl, countryQuery);
        topCountries = (countryResponse.rows || [])
          .map(row => ({
            country: row.keys?.[0] || '',
            countryName: getCountryName(row.keys?.[0] || ''),
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          }))
          .filter(c => c.clicks > 0)
          .sort((a, b) => b.clicks - a.clicks);
      } catch (error) {
        console.error('Failed to get country breakdown:', error);
      }
    }

    return {
      totalClicks,
      totalImpressions,
      averageCtr,
      averagePosition,
      topSites: topSites.slice(0, 10),
      topQueries,
      topCountries,
    };
  }
}