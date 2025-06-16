'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Icon } from '@/components/ui/Icon';

interface FamilyStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
}

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'partner' | 'child' | 'parent' | 'other';
  permissions: {
    viewBalance: boolean;
    viewTransactions: boolean;
    viewGoals: boolean;
    addTransactions: boolean;
  };
}

export function FamilyStep({ data, onNext, onBack, onSkip }: FamilyStepProps) {
  const [hasFamily, setHasFamily] = useState(data.hasFamily || false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(data.familyMembers || []);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
    role: 'partner',
    permissions: {
      viewBalance: true,
      viewTransactions: true,
      viewGoals: true,
      addTransactions: false,
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const roleOptions = [
    { value: 'partner', label: 'Partner', icon: 'heart' },
    { value: 'child', label: 'Child', icon: 'users' },
    { value: 'parent', label: 'Parent', icon: 'users' },
    { value: 'other', label: 'Other', icon: 'user' },
  ];

  const handleAddMember = () => {
    const newErrors: Record<string, string> = {};
    
    if (!newMember.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!newMember.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newMember.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const member: FamilyMember = {
      id: Date.now().toString(),
      name: newMember.name!,
      email: newMember.email!,
      role: newMember.role as FamilyMember['role'],
      permissions: newMember.permissions!,
    };

    setFamilyMembers([...familyMembers, member]);
    setNewMember({
      role: 'partner',
      permissions: {
        viewBalance: true,
        viewTransactions: true,
        viewGoals: true,
        addTransactions: false,
      },
    });
    setIsAddingMember(false);
    setErrors({});
  };

  const handleRemoveMember = (id: string) => {
    setFamilyMembers(familyMembers.filter(m => m.id !== id));
  };

  const handleContinue = () => {
    onNext({
      hasFamily,
      familyMembers,
    });
  };

  const handleTogglePermission = (permission: keyof FamilyMember['permissions']) => {
    setNewMember(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions!,
        [permission]: !prev.permissions![permission],
      },
    }));
  };

  return (
    <GlassContainer className="p-8 md:p-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary mb-2">
          Want to manage finances together?
        </h2>
        <p className="text-primary/70">
          Invite family members to collaborate on your financial journey
        </p>
      </div>

      {!hasFamily && !isAddingMember && familyMembers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-6 glass-subtle rounded-full flex items-center justify-center">
            <Icon name="users" size="2xl" className="text-gold" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-3">
            Track finances as a team
          </h3>
          <p className="text-primary/70 mb-8 max-w-md mx-auto">
            Share financial goals, track combined net worth, and build wealth together with privacy controls.
          </p>
          <div className="flex gap-3 justify-center">
            <GlassButton
              variant="ghost"
              onClick={onSkip}
            >
              I'll manage solo
            </GlassButton>
            <GlassButton
              variant="primary"
              goldBorder
              onClick={() => {
                setHasFamily(true);
                setIsAddingMember(true);
              }}
            >
              <Icon name="plus" size="sm" className="mr-2" />
              Add family member
            </GlassButton>
          </div>
        </div>
      )}

      {(hasFamily || familyMembers.length > 0) && !isAddingMember && (
        <div>
          {/* Family members list */}
          {familyMembers.length > 0 && (
            <div className="space-y-3 mb-6">
              {familyMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-subtle p-4 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 glass rounded-full flex items-center justify-center">
                      <Icon name={roleOptions.find(r => r.value === member.role)?.icon || 'user'} size="sm" />
                    </div>
                    <div>
                      <div className="font-medium text-primary">{member.name}</div>
                      <div className="text-sm text-primary/60">{member.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Icon name="delete" size="sm" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center">
            <GlassButton
              variant="ghost"
              onClick={() => setIsAddingMember(true)}
            >
              <Icon name="plus" size="sm" className="mr-2" />
              Add another member
            </GlassButton>
          </div>
        </div>
      )}

      {/* Add member form */}
      {isAddingMember && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Name
              </label>
              <GlassInput
                type="text"
                value={newMember.name || ''}
                onChange={(e) => {
                  setNewMember({ ...newMember, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="Jane Doe"
                error={errors.name}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Email
              </label>
              <GlassInput
                type="email"
                value={newMember.email || ''}
                onChange={(e) => {
                  setNewMember({ ...newMember, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder="jane@example.com"
                error={errors.email}
              />
            </div>
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-primary mb-3">
              Relationship
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {roleOptions.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setNewMember({ ...newMember, role: role.value as FamilyMember['role'] })}
                  className={`glass-subtle p-3 rounded-xl border-2 transition-all ${
                    newMember.role === role.value
                      ? 'border-gold bg-gold/5'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Icon name={role.icon} size="sm" className="mb-1" />
                  <div className="text-sm">{role.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-primary mb-3">
              Permissions
            </label>
            <div className="space-y-2">
              {[
                { key: 'viewBalance' as const, label: 'View total balances' },
                { key: 'viewTransactions' as const, label: 'View transactions' },
                { key: 'viewGoals' as const, label: 'View financial goals' },
                { key: 'addTransactions' as const, label: 'Add transactions' },
              ].map((perm) => (
                <label
                  key={perm.key}
                  className="flex items-center gap-3 glass-subtle p-3 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={newMember.permissions![perm.key]}
                    onChange={() => handleTogglePermission(perm.key)}
                    className="w-4 h-4 text-gold focus:ring-gold/20"
                  />
                  <span className="text-sm text-primary">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <GlassButton
              variant="ghost"
              onClick={() => {
                setIsAddingMember(false);
                setNewMember({
                  role: 'partner',
                  permissions: {
                    viewBalance: true,
                    viewTransactions: true,
                    viewGoals: true,
                    addTransactions: false,
                  },
                });
                setErrors({});
              }}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleAddMember}
            >
              Add Member
            </GlassButton>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      {!isAddingMember && (
        <div className="flex justify-between mt-10">
          <GlassButton
            variant="ghost"
            onClick={onBack}
          >
            <Icon name="arrowLeft" size="sm" className="mr-2" />
            Back
          </GlassButton>
          <div className="flex gap-3">
            {familyMembers.length === 0 && (
              <GlassButton
                variant="ghost"
                onClick={onSkip}
              >
                Skip
              </GlassButton>
            )}
            <GlassButton
              variant="primary"
              goldBorder
              onClick={handleContinue}
            >
              Continue
              <Icon name="arrowRight" size="sm" className="ml-2" />
            </GlassButton>
          </div>
        </div>
      )}
    </GlassContainer>
  );
} 