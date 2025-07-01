import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Comment {
  id?: string;
  siteUrl: string;
  siteName: string;
  userId: string;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isEdited?: boolean;
}

export interface CommentFormData {
  siteUrl: string;
  siteName: string;
  content: string;
}

class CommentsService {
  private collectionName = 'site_comments';

  // Добавить новый комментарий
  async addComment(commentData: CommentFormData, user: any): Promise<string> {
    try {
      const comment: Omit<Comment, 'id'> = {
        siteUrl: commentData.siteUrl,
        siteName: commentData.siteName,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        userAvatar: user.photoURL,
        content: commentData.content,
        createdAt: serverTimestamp() as Timestamp,
        isEdited: false
      };

      const docRef = await addDoc(collection(db, this.collectionName), comment);
      return docRef.id;
    } catch (error) {
      console.error('Ошибка при добавлении комментария:', error);
      throw new Error('Не удалось добавить комментарий');
    }
  }

  // Получить все комментарии для сайта
  async getCommentsForSite(siteUrl: string): Promise<Comment[]> {
    try {
      const commentsRef = collection(db, 'site_comments');
      
      // Сначала пробуем с сортировкой
      const q = query(
        commentsRef,
        where('siteUrl', '==', siteUrl),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
    } catch (error) {
      console.error('Ошибка при получении комментариев:', error);
      
      // Fallback: получаем все комментарии и сортируем на клиенте
      try {
        const commentsRef = collection(db, 'site_comments');
        const q = query(
          commentsRef,
          where('siteUrl', '==', siteUrl)
        );
        
        const querySnapshot = await getDocs(q);
        const comments = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Comment[];
        
        // Сортируем на клиенте
        comments.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : Date.now());
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : Date.now());
          return dateB.getTime() - dateA.getTime();
        });
        
        return comments;
      } catch (fallbackError) {
        console.error('Ошибка при fallback получении комментариев:', fallbackError);
        throw new Error('Не удалось получить комментарии');
      }
    }
  }

  // Получить все комментарии для всех сайтов пользователя
  async getAllCommentsForUser(userId: string): Promise<Comment[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const comments: Comment[] = [];

      querySnapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          ...doc.data()
        } as Comment);
      });

      return comments;
    } catch (error) {
      console.error('Ошибка при получении комментариев пользователя:', error);
      throw new Error('Не удалось получить комментарии пользователя');
    }
  }

  // Обновить комментарий
  async updateComment(commentId: string, content: string): Promise<void> {
    try {
      const commentRef = doc(db, this.collectionName, commentId);
      await updateDoc(commentRef, {
        content,
        updatedAt: serverTimestamp(),
        isEdited: true
      });
    } catch (error) {
      console.error('Ошибка при обновлении комментария:', error);
      throw new Error('Не удалось обновить комментарий');
    }
  }

  // Удалить комментарий
  async deleteComment(commentId: string): Promise<void> {
    try {
      const commentRef = doc(db, this.collectionName, commentId);
      await deleteDoc(commentRef);
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error);
      throw new Error('Не удалось удалить комментарий');
    }
  }

  // Получить количество комментариев для сайта
  async getCommentsCount(siteUrl: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('siteUrl', '==', siteUrl)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Ошибка при подсчете комментариев:', error);
      return 0;
    }
  }

  // Получить последний комментарий для сайта
  async getLastCommentForSite(siteUrl: string): Promise<Comment | null> {
    try {
      const commentsRef = collection(db, 'site_comments');
      
      // Сначала пробуем с сортировкой
      const q = query(
        commentsRef,
        where('siteUrl', '==', siteUrl),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as Comment;
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при получении последнего комментария:', error);
      
      // Fallback: получаем все комментарии и сортируем на клиенте
      try {
        const commentsRef = collection(db, 'site_comments');
        const q = query(
          commentsRef,
          where('siteUrl', '==', siteUrl)
        );
        
        const querySnapshot = await getDocs(q);
        const comments = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Comment[];
        
        // Сортируем на клиенте
        comments.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : Date.now());
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : Date.now());
          return dateB.getTime() - dateA.getTime();
        });
        
        return comments.length > 0 ? comments[0] : null;
      } catch (fallbackError) {
        console.error('Ошибка при fallback получении комментария:', fallbackError);
        return null;
      }
    }
  }
}

export const commentsService = new CommentsService(); 