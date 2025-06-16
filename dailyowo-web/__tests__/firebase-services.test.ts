import { FamilyService } from '@/lib/firebase/family-service';

// Mock Firebase
jest.mock('@/lib/firebase/config', () => ({
  getFirebaseDb: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
  })),
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 })),
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
    now: jest.fn(() => ({ toDate: () => new Date() })),
  },
}));

// Import mocked functions after mocking
import { 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';

const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;
const mockRunTransaction = runTransaction as jest.MockedFunction<typeof runTransaction>;

describe('Firebase Services', () => {
  const mockUserId = 'test-user-123';
  let familyService: FamilyService;

  beforeEach(() => {
    familyService = new FamilyService();
    jest.clearAllMocks();
  });

  describe('FamilyService', () => {
    describe('inviteFamilyMember', () => {
      it('should create family invitation successfully', async () => {
        mockAddDoc.mockResolvedValue({ id: 'invitation-123' } as any);

        const result = await familyService.inviteFamilyMember(
          'family-123',
          mockUserId,
          'Test User', 
          'friend@example.com',
          'member',
          'Welcome to the family!'
        );

        expect(mockAddDoc).toHaveBeenCalledTimes(1);
        expect(result.id).toBe('invitation-123');
      });

      it('should handle database errors gracefully', async () => {
        mockAddDoc.mockRejectedValue(new Error('Database error'));

        await expect(
          familyService.inviteFamilyMember(
            'family-123',
            mockUserId,
            'Test User', 
            'friend@example.com',
            'member'
          )
        ).rejects.toThrow('Database error');
      });
    });

    describe('getFamilyByUserId', () => {
      it('should return family data when user has family', async () => {
        const mockFamilyData = {
          principalId: mockUserId,
          members: {
            [mockUserId]: {
              uid: mockUserId,
              email: 'user1@example.com',
              displayName: 'User One',
              role: 'principal',
              status: 'active'
            }
          },
          memberIds: [mockUserId],
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: {
            defaultPrivacy: 'family',
            allowChildGoals: true,
            requireApprovalForCrossAccount: true
          }
        };

        mockGetDoc.mockResolvedValue({
          exists: () => true,
          id: mockUserId,
          data: () => mockFamilyData
        });

        const result = await familyService.getFamilyByUserId(mockUserId);

        expect(result).toBeDefined();
        expect(result?.principalId).toBe(mockUserId);
        expect(result?.members[mockUserId].email).toBe('user1@example.com');
      });

      it('should return null when user has no family', async () => {
        mockGetDoc.mockResolvedValue({
          exists: () => false
        });
        mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

        const result = await familyService.getFamilyByUserId(mockUserId);

        expect(result).toBeNull();
      });
    });

    describe('updateMemberRole', () => {
      it('should update member role successfully', async () => {
        mockUpdateDoc.mockResolvedValue(undefined);

        const result = await familyService.updateMemberRole('family-123', 'member-123', 'admin', mockUserId);

        expect(result).toBe(true);
        expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      });

      it('should handle database errors', async () => {
        mockUpdateDoc.mockRejectedValue(new Error('Database error'));

        const result = await familyService.updateMemberRole('family-123', 'member-123', 'admin', mockUserId);

        expect(result).toBe(false);
      });
    });

    describe('removeFamilyMember', () => {
      it('should remove family member successfully', async () => {
        mockRunTransaction.mockImplementation((db, transactionFn) => {
          return transactionFn({
            get: jest.fn().mockResolvedValue({
              exists: () => true,
              data: () => ({
                principalId: mockUserId,
                members: { 'member-123': { id: 'member-123' } },
                memberIds: [mockUserId, 'member-123']
              })
            }),
            update: jest.fn()
          });
        });

        const result = await familyService.removeFamilyMember('family-123', 'member-123', mockUserId);

        expect(result).toBe(true);
      });

      it('should handle errors gracefully', async () => {
        mockRunTransaction.mockRejectedValue(new Error('Database error'));

        const result = await familyService.removeFamilyMember('family-123', 'member-123', mockUserId);

        expect(result).toBe(false);
      });
    });

    describe('getPendingInvitations', () => {
      it('should return pending invitations for user', async () => {
        const mockInvitations = [
          {
            id: 'inv-1',
            familyId: 'family-123',
            inviterName: 'Test User',
            invitedEmail: 'test@example.com',
            status: 'pending'
          }
        ];

        mockGetDocs.mockResolvedValue({
          forEach: (callback: any) => {
            mockInvitations.forEach((inv, index) => {
              callback({
                id: inv.id,
                data: () => inv
              });
            });
          }
        });

        const result = await familyService.getPendingInvitations('test@example.com');

        expect(result).toHaveLength(1);
        expect(result[0].familyId).toBe('family-123');
      });

      it('should handle errors gracefully', async () => {
        mockGetDocs.mockRejectedValue(new Error('Database error'));

        const result = await familyService.getPendingInvitations('test@example.com');

        expect(result).toEqual([]);
      });
    });
  });
}); 