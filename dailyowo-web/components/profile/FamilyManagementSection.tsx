'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Crown, 
  Shield, 
  UserPlus, 
  Mail, 
  Settings, 
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuth } from '@/lib/firebase/auth-context';
import { familyService, FamilyInvitation } from '@/lib/firebase/family-service';
import { getFirebaseDb } from '@/lib/firebase/config';
import { collection, query, getDocs, where, orderBy, addDoc } from 'firebase/firestore';

interface FamilyMember {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member' | 'child';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: Date;
  permissions: string[];
}

interface LocalFamilyInvitation {
  id: string;
  email: string;
  role: string;
  sentAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export default function FamilyManagementSection() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'roles'>('members');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<LocalFamilyInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real family data from Firebase
  useEffect(() => {
    const loadFamilyData = async () => {
      if (!user?.uid) return;
      
      try {
        console.log('[FamilyManagement] Loading family data for user:', user.uid);
        setLoading(true);
        
        const db = await getFirebaseDb();
        if (!db) {
          console.error('[FamilyManagement] Database not available');
          setLoading(false);
          return;
        }
        
        // Load family members from Firebase
        try {
          const familyMembersRef = collection(db, 'users', user.uid, 'family');
          const familySnapshot = await getDocs(familyMembersRef);
          
          const members = familySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            joinedAt: doc.data().joinedAt?.toDate() || new Date()
          })) as FamilyMember[];
          
          // Add the current user as admin if no family members exist
          if (members.length === 0) {
            const currentUserMember: FamilyMember = {
              id: user.uid,
              email: user.email || 'user@example.com',
              displayName: userProfile?.displayName || user.displayName || 'You',
              role: 'admin',
              status: 'active',
              joinedAt: userProfile?.createdAt?.toDate() || new Date(),
              permissions: ['all']
            };
            members.push(currentUserMember);
          }
          
          setFamilyMembers(members);
        } catch (familyError) {
          // Silently fallback to current user only
          setFamilyMembers([{
            id: user.uid,
            email: user.email || 'user@example.com',
            displayName: userProfile?.displayName || user.displayName || 'You',
            role: 'admin',
            status: 'active',
            joinedAt: userProfile?.createdAt?.toDate() || new Date(),
            permissions: ['all']
          }]);
        }
        
        // Load family invitations
        try {
          const invitationsRef = collection(db, 'users', user.uid, 'familyInvitations');
          const invitationsSnapshot = await getDocs(invitationsRef);
          
          const invites = invitationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            sentAt: doc.data().sentAt?.toDate() || new Date()
          })) as LocalFamilyInvitation[];
          
          setInvitations(invites);
        } catch (invitationError) {
          // Silently set empty invitations on error
          setInvitations([]);
        }
        
      } catch (error) {
        // Set fallback data on critical error
        setFamilyMembers([{
          id: user.uid,
          email: user.email || 'user@example.com',
          displayName: userProfile?.displayName || user.displayName || 'You',
          role: 'admin',
          status: 'active',
          joinedAt: new Date(),
          permissions: ['all']
        }]);
        setInvitations([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadFamilyData();
  }, [user, userProfile]);

  const handleInviteMember = async (email: string, role: string) => {
    if (!user?.uid) return;
    
    try {
      console.log('[FamilyManagement] Sending invitation to:', email, 'with role:', role);
      
      const db = await getFirebaseDb();
      if (!db) {
        console.error('[FamilyManagement] Database not available for invitation');
        return;
      }
      
      // Use family service if available, otherwise create invitation manually
      try {
        if (familyService) {
          await familyService.inviteFamilyMember(
            'default-family', // familyId - you may want to get this from userProfile
            user.uid, 
            userProfile?.displayName || user.email || 'User',
            email, 
            role
          );
        } else {
          // Manual invitation creation
          const invitationData = {
            email,
            role,
            sentAt: new Date(),
            status: 'pending' as const,
            sentBy: user.uid,
            sentByName: userProfile?.displayName || user.displayName || 'Unknown'
          };
          
          // Add to user's invitations subcollection
          const invitationsRef = collection(db, 'users', user.uid, 'familyInvitations');
          await addDoc(invitationsRef, invitationData);
        }
        
        console.log('[FamilyManagement] Invitation sent successfully');
        
        // Reload invitations to show the new one
        const invitationsRef = collection(db, 'users', user.uid, 'familyInvitations');
        const invitationsQuery = query(invitationsRef, orderBy('sentAt', 'desc'));
        const invitationsSnapshot = await getDocs(invitationsQuery);
        
        const invites = invitationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          sentAt: doc.data().sentAt?.toDate() || new Date()
        })) as LocalFamilyInvitation[];
        
        setInvitations(invites);
        
      } catch (inviteError) {
        console.error('[FamilyManagement] Error sending invitation:', inviteError);
      }
      
    } catch (error) {
      console.error('[FamilyManagement] Critical error in invitation process:', error);
    } finally {
      setIsInviteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="glass p-8 rounded-2xl border border-white/20">
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="glass p-8 rounded-2xl border border-white/20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="text-lg font-light text-primary">Family Management</h2>
              <p className="text-xs font-light text-primary/40 uppercase tracking-wide">Manage Your Family</p>
            </div>
          </div>
          <GlassButton
            onClick={() => setIsInviteModalOpen(true)}
            variant="primary"
            goldBorder
            className="px-6 py-2 font-light bg-gold text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </GlassButton>
        </div>

        {/* Premium Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'members', label: 'Members', count: familyMembers.length },
            { id: 'invitations', label: 'Invitations', count: invitations.length },
            { id: 'roles', label: 'Roles', count: 3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl transition-all font-light ${
                activeTab === tab.id
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'text-primary/60 hover:text-primary hover:bg-white/5'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'members' && (
              <div className="space-y-4">
                {familyMembers.map((member) => (
                  <div key={member.id} className="glass p-4 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-primary/20 flex items-center justify-center">
                          <span className="text-sm font-light text-primary">
                            {member.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-light text-primary">{member.displayName}</h4>
                          <p className="text-xs font-light text-primary/60">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {member.role === 'admin' && <Crown className="w-4 h-4 text-gold" />}
                            <span className="text-xs font-light text-primary capitalize">{member.role}</span>
                          </div>
                          <p className="text-xs font-light text-primary/40">
                            Joined {member.joinedAt.toLocaleDateString()}
                          </p>
                        </div>
                        {member.email !== user?.email && (
                          <GlassButton variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </GlassButton>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {familyMembers.length === 1 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                    <h3 className="text-lg font-light text-primary mb-2">No family members yet</h3>
                    <p className="text-sm font-light text-primary/60 mb-4">
                      Invite family members to share your financial journey together
                    </p>
                    <GlassButton
                      onClick={() => setIsInviteModalOpen(true)}
                      variant="primary"
                      goldBorder
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Your First Member
                    </GlassButton>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invitations' && (
              <div className="space-y-4">
                {invitations.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                    <h3 className="text-lg font-light text-primary mb-2">No pending invitations</h3>
                    <p className="text-sm font-light text-primary/60">
                      All invitations will appear here
                    </p>
                  </div>
                ) : (
                  invitations.map((invitation) => (
                    <div key={invitation.id} className="glass p-4 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-gold" />
                          <div>
                            <h4 className="font-light text-primary">{invitation.email}</h4>
                            <p className="text-xs font-light text-primary/60">
                              Invited {invitation.sentAt.toLocaleDateString()} • {invitation.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            invitation.status === 'pending' ? 'bg-gold/10 text-gold' :
                            invitation.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {invitation.status}
                          </span>
                          <GlassButton variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </GlassButton>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="space-y-4">
                {['Admin', 'Member', 'Child'].map((role) => (
                  <div key={role} className="glass p-4 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gold" />
                        <div>
                          <h4 className="font-light text-primary">{role}</h4>
                          <p className="text-xs font-light text-primary/60">
                            {role === 'Admin' && 'Full access to all features'}
                            {role === 'Member' && 'Can view and add transactions'}
                            {role === 'Child' && 'Limited access with parental controls'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-primary/40" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteMember}
      />
    </div>
  );
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<void>;
}

function InviteModal({ isOpen, onClose, onInvite }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await onInvite(email, role);
      setEmail('');
      setRole('member');
    } catch (error) {
      console.error('Error sending invitation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass p-8 rounded-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="text-lg font-light text-primary">Invite Family Member</h3>
              <p className="text-xs font-light text-primary/40 uppercase tracking-wide">Send Invitation</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-light text-primary/60 mb-2 uppercase tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-light"
              placeholder="family@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-light text-primary/60 mb-2 uppercase tracking-wide">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-light"
            >
              <option value="member">Member</option>
              <option value="child">Child</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <GlassButton
              type="button"
              onClick={onClose}
              variant="ghost"
              className="flex-1 py-3 font-light"
              disabled={isSubmitting}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              goldBorder
              disabled={isSubmitting || !email.trim()}
              className="flex-1 py-3 font-light bg-gold text-white"
            >
              {isSubmitting ? 'Sending...' : 'Send Invite'}
            </GlassButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}