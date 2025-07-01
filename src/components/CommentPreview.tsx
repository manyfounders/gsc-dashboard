import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Calendar } from 'lucide-react';
import { commentsService, Comment } from '../services/commentsService';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CommentPreviewProps {
  siteUrl: string;
  className?: string;
}

export const CommentPreview: React.FC<CommentPreviewProps> = ({ siteUrl, className }) => {
  const [lastComment, setLastComment] = useState<Comment | null>(null);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCommentData();
  }, [siteUrl]);

  const loadCommentData = async () => {
    setIsLoading(true);
    
    try {
      const [lastCommentData, count] = await Promise.all([
        commentsService.getLastCommentForSite(siteUrl),
        commentsService.getCommentsCount(siteUrl)
      ]);
      
      setLastComment(lastCommentData);
      setCommentsCount(count);
    } catch (error) {
      console.error('Ошибка загрузки данных комментариев:', error);
      // Не показываем ошибку пользователю, просто оставляем состояние "нет комментариев"
      setLastComment(null);
      setCommentsCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMM в HH:mm', { locale: ru });
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <MessageSquare className="h-4 w-4 animate-pulse" />
        <span>Загрузка...</span>
      </div>
    );
  }

  if (commentsCount === 0) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-400 ${className}`}>
        <MessageSquare className="h-4 w-4" />
        <span>Нет комментариев</span>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Количество комментариев */}
      <Badge variant="secondary" className="text-xs">
        <MessageSquare className="h-3 w-3 mr-1" />
        {commentsCount} {commentsCount === 1 ? 'комментарий' : commentsCount < 5 ? 'комментария' : 'комментариев'}
      </Badge>

      {/* Последний комментарий */}
      {lastComment && (
        <div className="flex items-start gap-2 p-2 bg-gray-50/50 rounded-lg border">
          <Avatar className="h-5 w-5 flex-shrink-0">
            <AvatarImage src={lastComment.userAvatar} />
            <AvatarFallback className="text-xs">
              {lastComment.userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span className="font-medium text-gray-700 truncate">
                {lastComment.userName}
              </span>
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs">{formatDate(lastComment.createdAt)}</span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {lastComment.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 