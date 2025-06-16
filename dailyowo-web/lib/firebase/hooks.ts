import { useState } from 'react';
import { 
  getFirebaseDb, 
} from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  QueryConstraint,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';

export function useFirestore() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const db = getFirebaseDb();

  const getDocument = async (collectionName: string, docId: string) => {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      setLoading(true);
      setError(null);
      
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getDocuments = async (
    collectionName: string, 
    constraints: Array<[string, any, any]> = [],
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc',
    limitCount?: number
  ) => {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      setLoading(true);
      setError(null);
      
      const collectionRef = collection(db, collectionName);
      const queryConstraints: QueryConstraint[] = [];

      // Add where constraints
      constraints.forEach(([field, operator, value]) => {
        queryConstraints.push(where(field, operator, value));
      });

      // Add order by
      if (orderByField) {
        queryConstraints.push(orderBy(orderByField, orderDirection));
      }

      // Add limit
      if (limitCount) {
        queryConstraints.push(limit(limitCount));
      }

      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const documents: any[] = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return documents;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get documents';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addDocument = async (collectionName: string, data: any) => {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      setLoading(true);
      setError(null);
      
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return { id: docRef.id, ...data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async (collectionName: string, docId: string, data: any) => {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      setLoading(true);
      setError(null);
      
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
      
      return { id: docId, ...data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (collectionName: string, docId: string) => {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      setLoading(true);
      setError(null);
      
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getDocument,
    getDocuments,
    addDocument,
    updateDocument,
    deleteDocument
  };
} 