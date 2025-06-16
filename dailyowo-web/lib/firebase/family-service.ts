import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  getFirestore,
  Firestore
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { FamilyMember, DEFAULT_ROLE_PERMISSIONS } from '@/types/permissions';
import { sendEmail } from '@/lib/services/email-service';

export interface FamilyDocument {
  id: string;
  principalId: string;
  members: { [userId: string]: FamilyMember };
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
  familyName?: string;
  settings: {
    defaultPrivacy: 'public' | 'family' | 'private';
    allowChildGoals: boolean;
    requireApprovalForCrossAccount: boolean;
  };
}

export interface FamilyInvitation {
  id?: string;
  familyId: string;
  inviterUserId: string;
  inviterName: string;
  invitedEmail: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  message?: string;
}

export class FamilyService {
  private db: any = null;

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializeDb();
    }
  }

  private initializeDb() {
    try {
      this.db = getFirebaseDb();
    } catch (error) {
      console.warn('Failed to initialize Firestore in FamilyService:', error);
    }
  }

  private getDb() {
    if (!this.db && typeof window !== 'undefined') {
      this.initializeDb();
    }
    return this.db;
  }

  private checkDb() {
    const db = this.getDb();
    if (!db) {
      console.warn('Firestore not initialized in FamilyService - operations will be skipped');
      return null;
    }
    return db;
  }

  // ===== FAMILY CREATION & MANAGEMENT =====

  async createFamily(userId: string, userEmail: string, userName: string): Promise<FamilyDocument> {
    const db = this.checkDb();
    if (!db) {
      throw new Error('Cannot create family: Firestore not initialized');
    }

    const principalMember: FamilyMember = {
      id: userId,
      uid: userId,
      email: userEmail,
      displayName: userName,
      role: 'principal',
      status: 'active',
      joinedAt: new Date(),
      invitedBy: 'system',
      permissions: DEFAULT_ROLE_PERMISSIONS['principal'],
      accountAccess: {
        ownAccountId: userId,
        accessibleAccounts: [userId],
        canMergeAccounts: true
      },
      transactionVisibility: {
        defaultLevel: 'all',
        categoryOverrides: {},
        hiddenTransactionIds: [],
        hiddenCategories: []
      }
    };

    const familyData: Omit<FamilyDocument, 'id'> = {
      principalId: userId,
      members: {
        [userId]: principalMember
      },
      memberIds: [userId],
      createdAt: new Date(),
      updatedAt: new Date(),
      familyName: `${userName}'s Family`,
      settings: {
        defaultPrivacy: 'family',
        allowChildGoals: true,
        requireApprovalForCrossAccount: true
      }
    };

    const familyRef = doc(db, 'families', userId);
    await setDoc(familyRef, familyData);

    return { id: userId, ...familyData };
  }

  async getFamilyByUserId(userId: string): Promise<FamilyDocument | null> {
    try {
      const db = this.checkDb();
      if (!db) {
        // Return null instead of throwing error during initialization
        return null;
      }
      
      // First try to get family where user is principal
      const principalFamilyRef = doc(db, 'families', userId);
      const principalFamilySnap = await getDoc(principalFamilyRef);
      
      if (principalFamilySnap.exists()) {
        return { id: principalFamilySnap.id, ...principalFamilySnap.data() } as FamilyDocument;
      }

      // If not principal, search for family membership
      const familiesQuery = query(
        collection(db, 'families'),
        where('memberIds', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(familiesQuery);
      
      if (!querySnapshot.empty) {
        const familyDoc = querySnapshot.docs[0];
        return { id: familyDoc.id, ...familyDoc.data() } as FamilyDocument;
      }

      return null;
    } catch (error) {
      console.error('Error getting family:', error);
      return null;
    }
  }

  // ===== INVITATION SYSTEM =====

  async inviteFamilyMember(
    familyId: string, 
    inviterUserId: string, 
    inviterName: string,
    invitedEmail: string, 
    role: string,
    message?: string
  ): Promise<FamilyInvitation> {
    const db = this.checkDb();
    if (!db) {
      throw new Error('Cannot invite family member: Firestore not initialized');
    }

    const invitation: Omit<FamilyInvitation, 'id'> = {
      familyId,
      inviterUserId,
      inviterName,
      invitedEmail,
      role,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ...(message && { message }) // Only include message if it's provided
    };

    const invitationRef = await addDoc(collection(db, 'family_invitations'), invitation);
    
    // Send invitation email
    try {
      await sendEmail({
        to: invitedEmail,
        subject: `${inviterName} invited you to join their family on DailyOwo`,
        template: 'family-invitation',
        data: {
          inviteeName: invitedEmail.split('@')[0],
          inviterName,
          familyName: `${inviterName}'s Family`,
          role,
          joinLink: `${process.env.NEXT_PUBLIC_APP_URL}/join-family?invitation=${invitationRef.id}`,
          personalMessage: message,
        },
      });
      console.log('Family invitation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue even if email fails - user can still share the link manually
    }
    
    return { id: invitationRef.id, ...invitation };
  }

  async getPendingInvitations(email: string): Promise<FamilyInvitation[]> {
    try {
      const db = this.checkDb();
      if (!db) {
        return [];
      }

      const invitationsQuery = query(
        collection(db, 'family_invitations'),
        where('invitedEmail', '==', email),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(invitationsQuery);
      const invitations: FamilyInvitation[] = [];
      
      querySnapshot.forEach((doc) => {
        invitations.push({ id: doc.id, ...doc.data() } as FamilyInvitation);
      });
      
      return invitations;
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      return [];
    }
  }

  async acceptInvitation(invitationId: string, userId: string, userEmail: string, userName: string): Promise<boolean> {
    try {
      const db = this.checkDb();
      if (!db) {
        console.warn('Cannot accept invitation: Firestore not initialized');
        return false;
      }

      return await runTransaction(db, async (transaction) => {
        // Get invitation details
        const invitationRef = doc(db, 'family_invitations', invitationId);
        const invitationSnap = await transaction.get(invitationRef);
        
        if (!invitationSnap.exists()) {
          throw new Error('Invitation not found');
        }

        const invitation = invitationSnap.data() as FamilyInvitation;
        
        if (invitation.status !== 'pending') {
          throw new Error('Invitation is no longer pending');
        }

        if (new Date() > invitation.expiresAt) {
          throw new Error('Invitation has expired');
        }

        // Add user to family
        const familyRef = doc(db, 'families', invitation.familyId);
        const familySnap = await transaction.get(familyRef);
        
        if (!familySnap.exists()) {
          throw new Error('Family not found');
        }

        const familyData = familySnap.data() as FamilyDocument;
        
        const newMember: FamilyMember = {
          id: userId,
          uid: userId,
          email: userEmail,
          displayName: userName,
          role: invitation.role as any,
          status: 'active',
          joinedAt: new Date(),
          invitedBy: invitation.inviterUserId,
          permissions: DEFAULT_ROLE_PERMISSIONS[invitation.role as keyof typeof DEFAULT_ROLE_PERMISSIONS],
          accountAccess: {
            ownAccountId: userId,
            accessibleAccounts: [userId],
            canMergeAccounts: false
          },
          transactionVisibility: {
            defaultLevel: 'own',
            categoryOverrides: {},
            hiddenTransactionIds: [],
            hiddenCategories: []
          }
        };

        // Update family document
        transaction.update(familyRef, {
          [`members.${userId}`]: newMember,
          memberIds: [...familyData.memberIds, userId],
          updatedAt: serverTimestamp()
        });

        // Update invitation status
        transaction.update(invitationRef, {
          status: 'accepted',
          updatedAt: serverTimestamp()
        });

        return true;
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return false;
    }
  }

  async getAllFamilyInvitations(familyId: string): Promise<FamilyInvitation[]> {
    try {
      const db = this.checkDb();
      if (!db) {
        return [];
      }

      const invitationsQuery = query(
        collection(db, 'family_invitations'),
        where('familyId', '==', familyId)
      );

      const querySnapshot = await getDocs(invitationsQuery);
      const invitations: FamilyInvitation[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        invitations.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt)
        } as FamilyInvitation);
      });
      
      // Sort by most recent first
      return invitations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting family invitations:', error);
      return [];
    }
  }

  async cancelInvitation(invitationId: string): Promise<boolean> {
    try {
      const db = this.checkDb();
      if (!db) {
        return false;
      }

      const invitationRef = doc(db, 'family_invitations', invitationId);
      await updateDoc(invitationRef, {
        status: 'declined',
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      return false;
    }
  }

  // ===== MEMBER MANAGEMENT =====

  async updateMemberRole(familyId: string, userId: string, newRole: string, updatedBy: string): Promise<boolean> {
    try {
      const db = this.checkDb();
      if (!db) {
        console.warn('Cannot update member role: Firestore not initialized');
        return false;
      }

      const familyRef = doc(db, 'families', familyId);
      
      await updateDoc(familyRef, {
        [`members.${userId}.role`]: newRole,
        [`members.${userId}.updatedAt`]: serverTimestamp(),
        [`members.${userId}.updatedBy`]: updatedBy,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      return false;
    }
  }

  async removeFamilyMember(familyId: string, userIdToRemove: string, removedBy: string): Promise<boolean> {
    try {
      const db = this.checkDb();
      if (!db) {
        console.warn('Cannot remove family member: Firestore not initialized');
        return false;
      }

      return await runTransaction(db, async (transaction) => {
        const familyRef = doc(db, 'families', familyId);
        const familySnap = await transaction.get(familyRef);
        
        if (!familySnap.exists()) {
          throw new Error('Family not found');
        }

        const familyData = familySnap.data() as FamilyDocument;
        
        // Can't remove the principal
        if (userIdToRemove === familyData.principalId) {
          throw new Error('Cannot remove the principal');
        }

        // Remove member from members object
        const updatedMembers = { ...familyData.members };
        delete updatedMembers[userIdToRemove];

        // Remove from memberIds array
        const updatedMemberIds = familyData.memberIds.filter(id => id !== userIdToRemove);

        transaction.update(familyRef, {
          members: updatedMembers,
          memberIds: updatedMemberIds,
          updatedAt: serverTimestamp()
        });

        return true;
      });
    } catch (error) {
      console.error('Error removing family member:', error);
      return false;
    }
  }

  // ===== PERMISSION MANAGEMENT =====

  async updateMemberPermissions(
    familyId: string, 
    userId: string, 
    permissions: any, 
    updatedBy: string
  ): Promise<boolean> {
    try {
      const db = this.checkDb();
      if (!db) {
        console.warn('Cannot update member permissions: Firestore not initialized');
        return false;
      }

      const familyRef = doc(db, 'families', familyId);
      
      await updateDoc(familyRef, {
        [`members.${userId}.permissions`]: permissions,
        [`members.${userId}.updatedAt`]: serverTimestamp(),
        [`members.${userId}.updatedBy`]: updatedBy,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating member permissions:', error);
      return false;
    }
  }

  // ===== FAMILY SETTINGS =====

  async updateFamilySettings(familyId: string, settings: Partial<FamilyDocument['settings']>): Promise<boolean> {
    try {
      const db = this.checkDb();
      if (!db) {
        console.warn('Cannot update family settings: Firestore not initialized');
        return false;
      }

      const familyRef = doc(db, 'families', familyId);
      
      await updateDoc(familyRef, {
        settings: settings,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating family settings:', error);
      return false;
    }
  }
}

// Export singleton instance
export const familyService = new FamilyService(); 