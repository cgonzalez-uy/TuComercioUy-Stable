import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  getDocs,
  getDoc,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ReportReason {
  id: string;
  reason: string;
  details?: string;
  createdAt: Date;
  status: 'pending' | 'resolved' | 'rejected';
  resolvedAt?: Date;
  resolvedBy?: string;
}

export function useBusinessReviews(businessId: string | undefined) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `businesses/${businessId}/reviews`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      setLoading(false);
    }, (err) => {
      console.error('Error fetching reviews:', err);
      setError('Error al cargar las reseñas');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [businessId]);

  const reportReview = async (reviewId: string, reason: string, details?: string) => {
    if (!businessId) {
      throw new Error('ID del comercio no encontrado');
    }

    try {
      // Create report
      await addDoc(
        collection(db, 'businesses', businessId, 'reviews', reviewId, 'reports'),
        {
          reason,
          details,
          createdAt: serverTimestamp(),
          status: 'pending'
        }
      );

      // Update review to mark it as reported
      await updateDoc(
        doc(db, 'businesses', businessId, 'reviews', reviewId),
        { reported: true }
      );
    } catch (err) {
      console.error('Error reporting review:', err);
      throw new Error('Error al reportar la reseña');
    }
  };

  const replyToReview = async (reviewId: string, content: string) => {
    if (!businessId) {
      throw new Error('ID del comercio no encontrado');
    }

    if (!content.trim()) {
      throw new Error('La respuesta no puede estar vacía');
    }

    try {
      // Use a transaction to ensure data consistency
      await runTransaction(db, async (transaction) => {
        // Get review data
        const reviewRef = doc(db, `businesses/${businessId}/reviews/${reviewId}`);
        const reviewDoc = await transaction.get(reviewRef);
        
        if (!reviewDoc.exists()) {
          throw new Error('Reseña no encontrada');
        }

        const reviewData = reviewDoc.data();

        // Get business data
        const businessRef = doc(db, 'businesses', businessId);
        const businessDoc = await transaction.get(businessRef);
        
        if (!businessDoc.exists()) {
          throw new Error('Comercio no encontrado');
        }

        const businessData = businessDoc.data();

        // Update review with reply
        transaction.update(reviewRef, {
          reply: {
            content: content.trim(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        });

        // Create notification
        const notificationRef = doc(collection(db, 'notifications'));
        const notificationData = {
          type: 'new_review_reply',
          businessId,
          businessName: businessData.name,
          businessPhotoURL: businessData.image || null,
          reviewId,
          reviewContent: reviewData.comment,
          replyContent: content.trim(),
          recipientId: reviewData.userId,
          read: false,
          createdAt: serverTimestamp()
        };

        transaction.set(notificationRef, notificationData);

        // Create recipient record in subcollection
        const recipientRef = doc(collection(db, `notifications/${notificationRef.id}/recipients`));
        transaction.set(recipientRef, {
          userId: reviewData.userId,
          read: false,
          createdAt: serverTimestamp()
        });
      });
    } catch (err) {
      console.error('Error replying to review:', err);
      throw err instanceof Error ? err : new Error('Error al responder la reseña');
    }
  };

  const editReply = async (reviewId: string, content: string) => {
    if (!businessId) {
      throw new Error('ID del comercio no encontrado');
    }

    if (!content.trim()) {
      throw new Error('La respuesta no puede estar vacía');
    }

    try {
      await updateDoc(
        doc(db, `businesses/${businessId}/reviews/${reviewId}`),
        {
          'reply.content': content.trim(),
          'reply.updatedAt': serverTimestamp()
        }
      );
    } catch (err) {
      console.error('Error editing reply:', err);
      throw err instanceof Error ? err : new Error('Error al editar la respuesta');
    }
  };

  const deleteReply = async (reviewId: string) => {
    if (!businessId) {
      throw new Error('ID del comercio no encontrado');
    }

    try {
      await updateDoc(
        doc(db, `businesses/${businessId}/reviews/${reviewId}`),
        {
          reply: null
        }
      );
    } catch (err) {
      console.error('Error deleting reply:', err);
      throw err instanceof Error ? err : new Error('Error al eliminar la respuesta');
    }
  };

  return {
    reviews,
    loading,
    error,
    reportReview,
    replyToReview,
    editReply,
    deleteReply
  };
}