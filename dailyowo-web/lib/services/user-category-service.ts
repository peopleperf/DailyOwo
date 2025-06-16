// File: lib/services/user-category-service.ts

import { firestore } from 'firebase-admin'; // Or firebase/firestore for client-side
import { UserTransactionCategory } from '../../types/transaction'; // Adjust path as needed

const USER_CATEGORIES_COLLECTION = 'userTransactionCategories';

export class UserCategoryService {
  private db: firestore.Firestore;

  constructor() {
    // Initialize Firebase Admin if not already done in a central place
    // if (admin.apps.length === 0) {
    //   admin.initializeApp();
    // }
    this.db = firestore();
  }

  private getCollection(userId: string) {
    // Store user categories in a subcollection under the user's document,
    // or a top-level collection with userId field for querying.
    // Using a top-level collection with userId is often more flexible for queries.
    return this.db.collection(USER_CATEGORIES_COLLECTION).where('userId', '==', userId);
  }
  
  private getDocRef(id: string) {
    // Assumes IDs are unique across all users if stored in a single top-level collection.
    // If user categories are in a subcollection /users/{userId}/userTransactionCategories,
    // then this would be this.db.collection('users').doc(userId).collection(USER_CATEGORIES_COLLECTION).doc(id)
    return this.db.collection(USER_CATEGORIES_COLLECTION).doc(id);
  }

  async createUserCategory(
    userId: string,
    categoryData: Omit<UserTransactionCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived'>
  ): Promise<UserTransactionCategory> {
    const newCategoryRef = this.db.collection(USER_CATEGORIES_COLLECTION).doc();
    const now = new Date(); // Or firestore.Timestamp.now()
    
    const newCategory: UserTransactionCategory = {
      id: newCategoryRef.id,
      userId,
      ...categoryData,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    await newCategoryRef.set(newCategory);
    return newCategory;
  }

  async getUserCategory(userId: string, categoryId: string): Promise<UserTransactionCategory | null> {
    const docRef = this.getDocRef(categoryId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const category = docSnap.data() as UserTransactionCategory;
    // Ensure the category belongs to the requesting user
    if (category.userId !== userId) {
        console.warn(`User ${userId} attempted to access category ${categoryId} belonging to user ${category.userId}`);
        return null; 
    }
    return category;
  }

  async getUserCategories(userId: string): Promise<UserTransactionCategory[]> {
    const snapshot = await this.getCollection(userId).where('isArchived', '==', false).orderBy('name').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => doc.data() as UserTransactionCategory);
  }

  async findUserCategoryByName(userId: string, name: string): Promise<UserTransactionCategory | null> {
    const snapshot = await this.getCollection(userId)
      .where('name', '==', name)
      .where('isArchived', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }
    return snapshot.docs[0].data() as UserTransactionCategory;
  }

  async updateUserCategory(
    userId: string,
    categoryId: string,
    updates: Partial<Omit<UserTransactionCategory, 'id' | 'userId' | 'createdAt'>>
  ): Promise<UserTransactionCategory | null> {
    const category = await this.getUserCategory(userId, categoryId);
    if (!category) {
        // getUserCategory already checks ownership and existence
        return null;
    }

    const docRef = this.getDocRef(categoryId);
    const updateData = {
        ...updates,
        updatedAt: new Date(), // Or firestore.Timestamp.now()
    };
    await docRef.update(updateData);
    return { ...category, ...updateData };
  }

  async archiveUserCategory(userId: string, categoryId: string): Promise<boolean> {
    const category = await this.getUserCategory(userId, categoryId);
    if (!category) {
      return false;
    }
    
    const docRef = this.getDocRef(categoryId);
    await docRef.update({ 
        isArchived: true,
        updatedAt: new Date(), // Or firestore.Timestamp.now()
    });
    return true;
  }
}

// Example Usage (conceptual, would be in an API route or another service):
// const userCategoryService = new UserCategoryService();
// async function handleCreateCategory(reqUserId: string, name: string, icon?: string, color?: string) {
//   const existing = await userCategoryService.findUserCategoryByName(reqUserId, name);
//   if (existing) {
//     throw new Error('Category with this name already exists for the user.');
//   }
//   return userCategoryService.createUserCategory(reqUserId, { name, icon, color });
// }
