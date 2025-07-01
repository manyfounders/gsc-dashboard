import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Send, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Calendar,
  User,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { commentsService, Comment, CommentFormData } from '../services/commentsService';
import { auth } from '../lib/firebase';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CommentsProps {
  siteUrl: string;
  siteName: string;
  className?: string;
}

export const Comments: React.FC<CommentsProps> = ({ siteUrl, siteName, className }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadComments();
  }, [siteUrl]);

  const loadComments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const commentsData = await commentsService.getCommentsForSite(siteUrl);
      setComments(commentsData);
    } catch (err) {
      setError('Не удалось загрузить комментарии');
      console.error('Ошибка загрузки комментариев:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      setError('Необходимо войти в систему');
      return;
    }

    if (!newComment.trim()) {
      setError('Комментарий не может быть пустым');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const commentData: CommentFormData = {
        siteUrl,
        siteName,
        content: newComment.trim()
      };

      await commentsService.addComment(commentData, user);
      setNewComment('');
      await loadComments(); // Перезагружаем комментарии
    } catch (err) {
      setError('Не удалось добавить комментарий');
      console.error('Ошибка добавления комментария:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      setError('Комментарий не может быть пустым');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await commentsService.updateComment(commentId, editContent.trim());
      setEditingComment(null);
      setEditContent('');
      await loadComments();
    } catch (err) {
      setError('Не удалось обновить комментарий');
      console.error('Ошибка обновления комментария:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await commentsService.deleteComment(commentId);
      await loadComments();
    } catch (err) {
      setError('Не удалось удалить комментарий');
      console.error('Ошибка удаления комментария:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id!);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMMM yyyy в HH:mm', { locale: ru });
  };

  const canEditComment = (comment: Comment) => {
    return user && (comment.userId === user.uid || user.email === 'admin@example.com');
  };

  const canDeleteComment = (comment: Comment) => {
    return user && (comment.userId === user.uid || user.email === 'admin@example.com');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Комментарии к сайту
          <Badge variant="secondary">{comments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Форма добавления комментария */}
        {user ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Напишите комментарий..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="h-4 w-4" />
                {user.displayName || user.email}
              </div>
              <Button
                onClick={handleSubmitComment}
                disabled={isSubmitting || !newComment.trim()}
                size="sm"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Отправить
              </Button>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              Войдите в систему, чтобы оставлять комментарии
            </AlertDescription>
          </Alert>
        )}

        {/* Ошибки */}
        {error && (
          <Alert className="border-red-200 bg-red-50/50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Список комментариев */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Пока нет комментариев</p>
              <p className="text-sm">Будьте первым, кто оставит комментарий!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 bg-gray-50/50">
                {editingComment === comment.id ? (
                  // Режим редактирования
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[80px] resize-none"
                      disabled={isSubmitting}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                        disabled={isSubmitting}
                      >
                        Отмена
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditComment(comment.id!)}
                        disabled={isSubmitting || !editContent.trim()}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Edit className="h-4 w-4 mr-2" />
                        )}
                        Сохранить
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Режим просмотра
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.userAvatar} />
                          <AvatarFallback className="text-xs">
                            {comment.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{comment.userName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(comment.createdAt)}
                            {comment.isEdited && (
                              <Badge variant="outline" className="text-xs">
                                Изменено
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {(canEditComment(comment) || canDeleteComment(comment)) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEditComment(comment) && (
                              <DropdownMenuItem onClick={() => startEditing(comment)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Редактировать
                              </DropdownMenuItem>
                            )}
                            {canDeleteComment(comment) && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteComment(comment.id!)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Удалить
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    
                    <div className="pl-11">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 