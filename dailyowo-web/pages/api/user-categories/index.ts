// pages/api/user-categories/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { UserCategoryService } from '@/lib/services/user-category-service';
import { UserTransactionCategory } from '@/types/transaction';
import { auth } from '../../../lib/firebase/firebaseAdmin'; // Assuming firebaseAdmin setup exports 'auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserTransactionCategory[] | UserTransactionCategory | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
      }

      const decodedToken = await auth.verifyIdToken(idToken);
      const userId = decodedToken.uid;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user' });
      }

      const userCategoryService = new UserCategoryService(); // Constructor takes no arguments
      const categories = await userCategoryService.getUserCategories(userId); // Correct method name
      
      // The client-side will add the 'type: user' property for its own use.
      // The API should return the full UserTransactionCategory objects.
      res.status(200).json(categories);
    } catch (error: any) {
      console.error('Error fetching user categories:', error);
      if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
      }
      res.status(500).json({ error: 'Failed to fetch user categories' });
    }
  } else if (req.method === 'POST') {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
      }

      const decodedToken = await auth.verifyIdToken(idToken);
      const userId = decodedToken.uid;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user' });
      }

      const { name, icon, color } = req.body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Bad Request: Category name is required and must be a non-empty string.' });
      }

      const userCategoryService = new UserCategoryService();
      
      // Optional: Check if category with the same name already exists for this user
      const existingCategory = await userCategoryService.findUserCategoryByName(userId, name.trim());
      if (existingCategory) {
        return res.status(409).json({ error: `Conflict: A category named '${name.trim()}' already exists.` });
      }

      const newCategoryData: Omit<UserTransactionCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isArchived'> = {
        name: name.trim(),
      };
      if (icon && typeof icon === 'string') newCategoryData.icon = icon;
      if (color && typeof color === 'string') newCategoryData.color = color;

      const createdCategory = await userCategoryService.createUserCategory(userId, newCategoryData);
      
      // Format for consistency with GET response, if needed, though createUserCategory returns the full object
      const formattedCreatedCategory = {
        ...createdCategory,
        type: 'user' as 'user' // Add type for frontend consistency if it relies on this
      };

      return res.status(201).json(formattedCreatedCategory);
    } catch (error: any) {
      console.error('Error creating user category:', error);
      if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
      }
      // Check for specific UserCategoryService errors if any are defined, e.g., validation errors
      return res.status(500).json({ error: 'Failed to create user category' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
