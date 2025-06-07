import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter, 
  Target,
  TrendingUp,
  Brain,
  Eye,
  Lightbulb
} from 'lucide-react';
import { WebsiteMetrics } from '../hooks/useMultiAccountSearchConsole';

interface QueryNode {
  id: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  sites: string[];
  category: 'brand' | 'generic' | 'long-tail';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface QueryLink {
  source: string | QueryNode;
  target: string | QueryNode;
  strength: number;
  sharedSites: string[];
  type: 'strong' | 'medium' | 'weak';
}

interface NetworkInsight {
  type: 'opportunity' | 'concern' | 'success';
  title: string;
  description: string;
  metric?: string;
  recommendation: string;
}

interface QueryNetworkMapProps {
  websiteMetrics: WebsiteMetrics[];
  isLoading?: boolean;
}

interface Filters {
  minClicks: number;
  maxPosition: number;
  minCTR: number;
  categories: string[];
  connectionStrength: string;
  showLabels: boolean;
  groupBy: 'category' | 'performance' | 'sites';
}

export const QueryNetworkMap: React.FC<QueryNetworkMapProps> = ({ 
  websiteMetrics, 
  isLoading = false 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<QueryNode | null>(null);
  const [, setHoveredNode] = useState<QueryNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    minClicks: 0,
    maxPosition: 100,
    minCTR: 0,
    categories: ['brand', 'generic', 'long-tail'],
    connectionStrength: 'all',
    showLabels: true,
    groupBy: 'category'
  });

  // Категоризация запросов
  const categorizeQuery = (query: string, sites: string[]): 'brand' | 'generic' | 'long-tail' => {
    const words = query.toLowerCase().split(' ');
    const siteNames = sites.map(site => 
      site.replace(/^https?:\/\//, '').replace(/^sc-domain:/, '').split('.')[0]
    );
    
    // Brand запросы содержат название сайта
    if (siteNames.some(name => query.toLowerCase().includes(name))) {
      return 'brand';
    }
    
    // Long-tail запросы содержат 4+ слов
    if (words.length >= 4) {
      return 'long-tail';
    }
    
    return 'generic';
  };

  // Создание сети запросов с улучшенной логикой
  const createQueryNetwork = () => {
    if (!websiteMetrics.length) return { nodes: [], links: [] };

    const queryMap = new Map<string, {
      query: string;
      totalClicks: number;
      totalImpressions: number;
      sites: Set<string>;
      positions: number[];
    }>();

    // Собираем данные
    websiteMetrics.forEach(siteMetrics => {
      if (siteMetrics.topQueries) {
        siteMetrics.topQueries.forEach(queryData => {
          const existing = queryMap.get(queryData.query);
          if (existing) {
            existing.totalClicks += queryData.clicks;
            existing.totalImpressions += queryData.impressions;
            existing.sites.add(siteMetrics.siteUrl);
            existing.positions.push(queryData.position);
          } else {
            queryMap.set(queryData.query, {
              query: queryData.query,
              totalClicks: queryData.clicks,
              totalImpressions: queryData.impressions,
              sites: new Set([siteMetrics.siteUrl]),
              positions: [queryData.position]
            });
          }
        });
      }
    });

    // Создаем узлы с категоризацией
    let nodes: QueryNode[] = Array.from(queryMap.entries())
      .map(([query, data]) => {
        const sites = Array.from(data.sites);
        return {
          id: query,
          query,
          clicks: data.totalClicks,
          impressions: data.totalImpressions,
          ctr: data.totalImpressions > 0 ? data.totalClicks / data.totalImpressions : 0,
          position: data.positions.reduce((sum, pos) => sum + pos, 0) / data.positions.length,
          sites,
          category: categorizeQuery(query, sites)
        };
      })
      .sort((a, b) => b.clicks - a.clicks);

    // Применяем фильтры
    nodes = nodes.filter(node => 
      node.clicks >= filters.minClicks &&
      node.position <= filters.maxPosition &&
      node.ctr >= filters.minCTR / 100 &&
      filters.categories.includes(node.category)
    ).slice(0, 60); // Увеличиваем до 60 узлов

    // Создаем более плотные связи
    const links: QueryLink[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        
        const sharedSites = nodeA.sites.filter(site => nodeB.sites.includes(site));
        
        if (sharedSites.length > 0) {
          // Улучшенная формула силы связи
          const siteOverlap = sharedSites.length / Math.min(nodeA.sites.length, nodeB.sites.length);
          const performanceSimilarity = 1 - Math.abs(nodeA.ctr - nodeB.ctr) / Math.max(nodeA.ctr, nodeB.ctr, 0.01);
          const categoryBonus = nodeA.category === nodeB.category ? 0.3 : 0;
          
          let strength = (siteOverlap * 0.4 + performanceSimilarity * 0.4 + categoryBonus) * 0.8;
          
          // Определяем тип связи
          let linkType: 'strong' | 'medium' | 'weak' = 'weak';
          if (strength > 0.6) linkType = 'strong';
          else if (strength > 0.3) linkType = 'medium';
          
          // Применяем фильтр силы связи
          const shouldInclude = filters.connectionStrength === 'all' ||
            (filters.connectionStrength === 'strong' && linkType === 'strong') ||
            (filters.connectionStrength === 'medium' && (linkType === 'strong' || linkType === 'medium'));
          
          if (strength > 0.1 && shouldInclude) {
            links.push({
              source: nodeA.id,
              target: nodeB.id,
              strength,
              sharedSites,
              type: linkType
            });
          }
        }
      }
    }

    return { nodes, links };
  };

  // Генерация автоматических инсайтов
  const generateInsights = (nodes: QueryNode[], links: QueryLink[]): NetworkInsight[] => {
    const insights: NetworkInsight[] = [];
    
    if (nodes.length === 0) return insights;

    const genericQueries = nodes.filter(n => n.category === 'generic');
    const longTailQueries = nodes.filter(n => n.category === 'long-tail');

    // Инсайт: Топ-перформер
    const topQuery = nodes[0];
    if (topQuery) {
      insights.push({
        type: 'success',
        title: 'Лидер по кликам',
        description: `Запрос "${topQuery.query}" генерирует ${topQuery.clicks} кликов`,
        metric: `CTR: ${(topQuery.ctr * 100).toFixed(1)}%`,
        recommendation: 'Проанализируйте контент для похожих запросов'
      });
    }

    // Инсайт: Возможности для long-tail
    if (longTailQueries.length > 0) {
      const avgLongTailCTR = longTailQueries.reduce((sum, q) => sum + q.ctr, 0) / longTailQueries.length;
      const avgGenericCTR = genericQueries.reduce((sum, q) => sum + q.ctr, 0) / (genericQueries.length || 1);
      
      if (avgLongTailCTR > avgGenericCTR * 1.2) {
        insights.push({
          type: 'opportunity',
          title: 'Long-tail потенциал',
          description: `Long-tail запросы показывают CTR ${(avgLongTailCTR * 100).toFixed(1)}%`,
          metric: `${longTailQueries.length} запросов`,
          recommendation: 'Создавайте больше контента под длинные запросы'
        });
      }
    }

    // Инсайт: Проблемы с позициями
    const highPositionQueries = nodes.filter(n => n.position > 10 && n.clicks > 50);
    if (highPositionQueries.length > 0) {
      insights.push({
        type: 'concern',
        title: 'Низкие позиции',
        description: `${highPositionQueries.length} популярных запросов в топ-10`,
        metric: `Ср. позиция: ${(highPositionQueries.reduce((sum, q) => sum + q.position, 0) / highPositionQueries.length).toFixed(1)}`,
        recommendation: 'Оптимизируйте контент для улучшения позиций'
      });
    }

    // Инсайт: Кластеризация
    const strongConnections = links.filter(l => l.type === 'strong').length;
    if (strongConnections > 0) {
      insights.push({
        type: 'success',
        title: 'Сильная кластеризация',
        description: `Обнаружено ${strongConnections} сильных связей между запросами`,
        recommendation: 'Создавайте тематические landing pages для кластеров'
      });
    }

    return insights.slice(0, 4); // Показываем топ-4 инсайта
  };

  const { nodes, links } = useMemo(() => createQueryNetwork(), [websiteMetrics, filters]);
  const insights = useMemo(() => generateInsights(nodes, links), [nodes, links]);

  // D3 визуализация с улучшенной группировкой
  useEffect(() => {
    if (!svgRef.current || isLoading || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);
    const container = svg.append('g');

    // Цветовые схемы для категорий
    const categoryColors = {
      'brand': '#3B82F6',     // Синий
      'generic': '#10B981',   // Зелёный  
      'long-tail': '#F59E0B'  // Жёлтый
    };

    // Размер узлов на основе кликов (увеличенный диапазон)
    const radiusScale = d3.scaleSqrt()
      .domain(d3.extent(nodes, d => d.clicks) as [number, number])
      .range([6, 35]);

    // Толщина связей
    const linkWidthScale = d3.scaleLinear()
      .domain(d3.extent(links, d => d.strength) as [number, number])
      .range([0.5, 5]);

    // Создаем более плотную симуляцию
    const simulation = d3.forceSimulation<QueryNode>(nodes)
      .force('link', d3.forceLink<QueryNode, QueryLink>(links)
        .id(d => d.id)
        .distance(d => {
          // Более короткие расстояния для сильных связей
          const baseDistance = 40;
          return baseDistance - (d.strength * 25);
        })
        .strength(d => d.strength * 1.5)
      )
      .force('charge', d3.forceManyBody()
        .strength(-80) // Уменьшенное отталкивание для более плотных групп
        .distanceMax(150)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius((d: any) => radiusScale(d.clicks) + 3)
        .strength(0.8)
      )
      // Группировка по категориям
      .force('category', d3.forceX<QueryNode>()
        .x(d => {
          if (filters.groupBy === 'category') {
            switch (d.category) {
              case 'brand': return width * 0.25;
              case 'generic': return width * 0.5;
              case 'long-tail': return width * 0.75;
              default: return width * 0.5;
            }
          }
          return width * 0.5;
        })
        .strength(0.1)
      );

    // Рисуем связи с разными стилями
    const linkElements = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', d => {
        switch (d.type) {
          case 'strong': return '#059669';
          case 'medium': return '#0891b2';  
          case 'weak': return '#64748b';
          default: return '#64748b';
        }
      })
      .attr('stroke-width', d => linkWidthScale(d.strength))
      .attr('opacity', d => d.type === 'strong' ? 0.8 : d.type === 'medium' ? 0.6 : 0.3)
      .attr('stroke-dasharray', d => d.type === 'weak' ? '2,2' : '');

    // Рисуем узлы
    const nodeElements = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(d3.drag<SVGGElement, QueryNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Основные круги узлов
    nodeElements.append('circle')
      .attr('r', d => radiusScale(d.clicks))
      .attr('fill', d => categoryColors[d.category])
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.85)
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('opacity', 1)
          .attr('stroke-width', 3)
          .attr('r', radiusScale(d.clicks) * 1.1);
          
        // Подсвечиваем связанные узлы
        const connectedIds = links
          .filter(l => l.source === d.id || l.target === d.id)
          .map(l => l.source === d.id ? l.target : l.source);
          
        nodeElements
          .selectAll('circle')
          .attr('opacity', (node: any) => 
            connectedIds.includes(node.id) || node.id === d.id ? 1 : 0.3
          );
      })
      .on('mouseleave', (event, d) => {
        setHoveredNode(null);
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('opacity', 0.85)
          .attr('stroke-width', 2)
          .attr('r', radiusScale(d.clicks));
          
        // Восстанавливаем обычную прозрачность
        nodeElements.selectAll('circle').attr('opacity', 0.85);
      })
      .on('click', (_event, d) => {
        setSelectedNode(selectedNode?.id === d.id ? null : d);
      });

    // Подписи к узлам
    if (filters.showLabels) {
      nodeElements
        .filter((d, i) => i < 15 || radiusScale(d.clicks) > 20)
        .append('text')
        .text(d => d.query.length > 12 ? d.query.substring(0, 12) + '...' : d.query)
        .attr('text-anchor', 'middle')
        .attr('dy', d => radiusScale(d.clicks) + 12)
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .attr('fill', '#1f2937')
        .attr('pointer-events', 'none')
        .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)');
    }

    // Обновляем позиции
    simulation.on('tick', () => {
      linkElements
        .attr('x1', d => (d.source as QueryNode).x!)
        .attr('y1', d => (d.source as QueryNode).y!)
        .attr('x2', d => (d.target as QueryNode).x!)
        .attr('y2', d => (d.target as QueryNode).y!);

      nodeElements
        .attr('transform', d => `translate(${d.x!},${d.y!})`);
    });

  }, [nodes, links, filters.showLabels, filters.groupBy]);

  // Управление зумом
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const currentTransform = d3.zoomTransform(svgRef.current);
    
    let newScale = currentTransform.k;
    if (direction === 'in') newScale = Math.min(newScale * 1.4, 4);
    else if (direction === 'out') newScale = Math.max(newScale / 1.4, 0.3);
    else newScale = 1;
    
    svg.transition()
      .duration(250)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity.scale(newScale)
      );
  };

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-600" />
            Нейронная карта запросов
          </CardTitle>
          <CardDescription>
            Анализируем связи между запросами...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Строим нейронную карту...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Автоматические инсайты */}
      <Card className="border-gray-200 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Автоматические выводы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                insight.type === 'success' ? 'bg-green-50 border-green-200' :
                insight.type === 'opportunity' ? 'bg-blue-50 border-blue-200' :
                'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-1 rounded-full ${
                    insight.type === 'success' ? 'bg-green-600' :
                    insight.type === 'opportunity' ? 'bg-blue-600' :
                    'bg-orange-600'
                  }`}>
                    {insight.type === 'success' ? (
                      <TrendingUp className="h-3 w-3 text-white" />
                    ) : insight.type === 'opportunity' ? (
                      <Target className="h-3 w-3 text-white" />
                    ) : (
                      <Eye className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-gray-900">{insight.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                    {insight.metric && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {insight.metric}
                      </Badge>
                    )}
                    <p className="text-xs text-gray-700 mt-2 font-medium">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Интерактивные фильтры */}
      <Card className="border-gray-200 shadow-sm bg-white">
        <CardHeader className="bg-white rounded-t-lg border-b border-gray-100">
          <CardTitle className="flex items-center gap-3 text-gray-900">
            <Filter className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-lg">Фильтры и настройки</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Минимальные клики */}
            <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <label className="text-sm font-medium text-gray-700">Мин. клики: {filters.minClicks}</label>
              <Slider
                value={[filters.minClicks]}
                onValueChange={([value]) => setFilters(prev => ({ ...prev, minClicks: value }))}
                max={100}
                step={5}
                className="w-full [&_.slider-track]:bg-gray-200 [&_.slider-range]:bg-blue-500 [&_.slider-thumb]:bg-blue-500 [&_.slider-thumb]:border-blue-500"
              />
            </div>
            {/* Максимальная позиция */}
            <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <label className="text-sm font-medium text-gray-700">Макс. позиция: {filters.maxPosition}</label>
              <Slider
                value={[filters.maxPosition]}
                onValueChange={([value]) => setFilters(prev => ({ ...prev, maxPosition: value }))}
                min={1}
                max={100}
                step={1}
                className="w-full [&_.slider-track]:bg-gray-200 [&_.slider-range]:bg-blue-500 [&_.slider-thumb]:bg-blue-500 [&_.slider-thumb]:border-blue-500"
              />
            </div>
            {/* Минимальный CTR */}
            <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <label className="text-sm font-medium text-gray-700">Мин. CTR: {filters.minCTR}%</label>
              <Slider
                value={[filters.minCTR]}
                onValueChange={([value]) => setFilters(prev => ({ ...prev, minCTR: value }))}
                max={20}
                step={0.5}
                className="w-full [&_.slider-track]:bg-gray-200 [&_.slider-range]:bg-blue-500 [&_.slider-thumb]:bg-blue-500 [&_.slider-thumb]:border-blue-500"
              />
            </div>
            {/* Сила связей */}
            <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <label className="text-sm font-medium text-gray-700">Сила связей</label>
              <Select
                value={filters.connectionStrength}
                onValueChange={(value) => setFilters(prev => ({ ...prev, connectionStrength: value }))}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все связи</SelectItem>
                  <SelectItem value="medium">Средние и сильные</SelectItem>
                  <SelectItem value="strong">Только сильные</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Группировка */}
            <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <label className="text-sm font-medium text-gray-700">Группировка</label>
              <Select
                value={filters.groupBy}
                onValueChange={(value: 'category' | 'performance' | 'sites') =>
                  setFilters(prev => ({ ...prev, groupBy: value }))
                }
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">По категориям</SelectItem>
                  <SelectItem value="performance">По эффективности</SelectItem>
                  <SelectItem value="sites">По сайтам</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Показать подписи */}
            <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <label className="text-sm font-medium text-gray-700">Подписи</label>
              <div className="flex items-center space-x-3">
                <Switch
                  checked={filters.showLabels}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showLabels: checked }))}
                  className="data-[state=checked]:bg-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Показать</span>
              </div>
            </div>
          </div>
          {/* Категории запросов */}
          <div className="mt-4 space-y-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <label className="text-sm font-medium text-gray-700">Категории запросов</label>
            <div className="flex gap-4">
              {[
                { key: 'brand', label: 'Брендовые', color: 'border-blue-500 text-blue-700', switchColor: 'data-[state=checked]:bg-blue-600' },
                { key: 'generic', label: 'Общие', color: 'border-green-500 text-green-700', switchColor: 'data-[state=checked]:bg-green-600' },
                { key: 'long-tail', label: 'Длинные', color: 'border-yellow-500 text-yellow-700', switchColor: 'data-[state=checked]:bg-yellow-600' }
              ].map(({ key, label, color, switchColor }) => (
                <div key={key} className={`flex items-center space-x-3 p-2 bg-white rounded-lg border-2 ${color} transition` }>
                  <Switch
                    checked={filters.categories.includes(key)}
                    onCheckedChange={(checked) => {
                      setFilters(prev => ({
                        ...prev,
                        categories: checked
                          ? [...prev.categories, key]
                          : prev.categories.filter(c => c !== key)
                      }));
                    }}
                    className={switchColor}
                  />
                  <span className={`font-medium ${color}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Основная карта */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-blue-600" />
                Нейронная карта запросов
                <Badge variant="outline">{nodes.length} узлов, {links.length} связей</Badge>
              </CardTitle>
              <CardDescription>
                Интерактивная карта показывает связи между запросами. Размер = клики, цвет = категория
              </CardDescription>
            </div>
            
            {/* Управление */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleZoom('in')}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleZoom('out')}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleZoom('reset')}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <svg
              ref={svgRef}
              width={800}
              height={600}
              className="border border-gray-200 rounded-lg bg-gray-50"
            />
            
            {/* Статус зума */}
            <div className="absolute bottom-4 left-4 bg-white px-2 py-1 rounded shadow text-xs">
              Зум: {zoom.toFixed(1)}x
            </div>

            {/* Информация о выбранном узле */}
            {selectedNode && (
              <div className="absolute top-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-xs">
                <h4 className="font-semibold text-sm text-gray-900 mb-2">{selectedNode.query}</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Клики:</span>
                    <Badge variant="outline">{selectedNode.clicks}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>CTR:</span>
                    <Badge variant="outline">{(selectedNode.ctr * 100).toFixed(1)}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Позиция:</span>
                    <Badge variant="outline">{selectedNode.position.toFixed(1)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Категория:</span>
                    <Badge className={
                      selectedNode.category === 'brand' ? 'bg-blue-100 text-blue-800' :
                      selectedNode.category === 'generic' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>{
                      selectedNode.category === 'brand' ? 'Брендовый' :
                      selectedNode.category === 'generic' ? 'Общий' : 'Длинный'
                    }</Badge>
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-600">Сайты: {selectedNode.sites.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Легенда */}
            <div className="absolute bottom-4 right-4 bg-white border rounded-lg shadow p-3">
              <h5 className="font-semibold text-xs mb-2">Категории</h5>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Брендовые</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Общие</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Длинные</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 