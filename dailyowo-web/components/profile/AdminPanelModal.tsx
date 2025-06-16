'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  X, 
  Users, 
  Settings, 
  Database, 
  FileText, 
  Download, 
  Eye,
  Activity,
  Monitor
} from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuth } from '@/lib/firebase/auth-context';
import { useCASL, useIsPrincipal } from '@/lib/auth/casl-provider';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanelModal({ isOpen, onClose }: AdminPanelModalProps) {
  const { user } = useAuth();
  const { familyMembers } = useCASL();
  const isPrincipal = useIsPrincipal();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings' | 'logs'>('overview');

  const handleExportData = async () => {
    try {
      const exportData = {
        familyMembers,
        exportedAt: new Date().toISOString(),
        exportedBy: user?.email
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  if (!isPrincipal) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-8 z-50 overflow-hidden"
          >
            <GlassContainer className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                    <Shield className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-light text-primary">Admin Panel</h2>
                    <p className="text-xs md:text-sm text-primary/60">System administration & management</p>
                  </div>
                </div>
                
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </GlassButton>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 px-4 md:px-6 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview', icon: Activity },
                  { id: 'users', label: 'Users', icon: Users },
                  { id: 'settings', label: 'Settings', icon: Settings },
                  { id: 'logs', label: 'Logs', icon: FileText }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-gold text-gold'
                        : 'border-transparent text-primary/60 hover:text-primary'
                    }`}
                  >
                    <tab.icon className="w-3 h-3 md:w-4 md:h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4 md:p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4 md:space-y-6">
                    {/* System Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      <div className="p-3 md:p-4 glass-subtle rounded-xl">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                          <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                          <div>
                            <p className="text-lg md:text-2xl font-light text-primary">{familyMembers.length}</p>
                            <p className="text-xs md:text-sm text-primary/60">Total Users</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 md:p-4 glass-subtle rounded-xl">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                          <Activity className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                          <div>
                            <p className="text-lg md:text-2xl font-light text-primary">1</p>
                            <p className="text-xs md:text-sm text-primary/60">Active Users</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 md:p-4 glass-subtle rounded-xl">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                          <Monitor className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                          <div>
                            <p className="text-lg md:text-2xl font-light text-primary">2</p>
                            <p className="text-xs md:text-sm text-primary/60">Active Sessions</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 md:p-4 glass-subtle rounded-xl">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                          <Shield className="w-6 h-6 md:w-8 md:h-8 text-gold" />
                          <div>
                            <p className="text-lg md:text-2xl font-light text-primary">1</p>
                            <p className="text-xs md:text-sm text-primary/60">Families</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <h3 className="text-base md:text-lg font-light text-primary mb-3 md:mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        <GlassButton
                          variant="ghost"
                          className="justify-start p-3 md:p-4 h-auto"
                          onClick={handleExportData}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          <div className="text-left">
                            <div className="font-medium text-xs md:text-sm">Export Data</div>
                            <div className="text-xs text-primary/60">Download family data</div>
                          </div>
                        </GlassButton>

                        <GlassButton
                          variant="ghost"
                          className="justify-start p-3 md:p-4 h-auto"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          <div className="text-left">
                            <div className="font-medium text-xs md:text-sm">Manage Users</div>
                            <div className="text-xs text-primary/60">Add or remove members</div>
                          </div>
                        </GlassButton>

                        <GlassButton
                          variant="ghost"
                          className="justify-start p-3 md:p-4 h-auto"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          <div className="text-left">
                            <div className="font-medium text-xs md:text-sm">Security Audit</div>
                            <div className="text-xs text-primary/60">Review security settings</div>
                          </div>
                        </GlassButton>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'users' && (
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base md:text-lg font-light text-primary">Family Members</h3>
                      <GlassButton variant="primary" goldBorder size="sm">
                        <Users className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                        Invite Member
                      </GlassButton>
                    </div>

                    <div className="space-y-3">
                      {familyMembers.map((member) => (
                        <div key={member.id} className="p-3 md:p-4 glass-subtle rounded-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-gold/20 to-primary/20 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-primary text-sm md:text-base">{member.displayName}</p>
                                <p className="text-xs md:text-sm text-primary/60">{member.email}</p>
                                <p className="text-xs text-gold">{member.role}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                member.status === 'active' 
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {member.status}
                              </span>
                              <GlassButton variant="ghost" size="sm">
                                <Settings className="w-3 h-3 md:w-4 md:h-4" />
                              </GlassButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-4 md:space-y-6">
                    <h3 className="text-base md:text-lg font-light text-primary">System Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="p-4 glass-subtle rounded-xl">
                        <h4 className="font-medium text-primary mb-3 text-sm md:text-base">Data Management</h4>
                        <div className="space-y-3">
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={handleExportData}
                            className="w-full justify-start"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Family Data
                          </GlassButton>
                          
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                          >
                            <Database className="w-4 h-4 mr-2" />
                            Backup Settings
                          </GlassButton>
                        </div>
                      </div>

                      <div className="p-4 glass-subtle rounded-xl">
                        <h4 className="font-medium text-primary mb-3 text-sm md:text-base">Security</h4>
                        <div className="space-y-3">
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Security Audit
                          </GlassButton>
                          
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Privacy Settings
                          </GlassButton>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'logs' && (
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base md:text-lg font-light text-primary">System Logs</h3>
                      <GlassButton variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export Logs
                      </GlassButton>
                    </div>

                    <div className="space-y-3">
                      {[
                        { action: 'User Login', user: user?.displayName || user?.email, time: '5 minutes ago', type: 'auth' },
                        { action: 'Profile Updated', user: user?.displayName || user?.email, time: '1 hour ago', type: 'profile' },
                        { action: 'Security Settings Changed', user: user?.displayName || user?.email, time: '2 hours ago', type: 'security' }
                      ].map((log, index) => (
                        <div key={index} className="p-3 glass-subtle rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                log.type === 'auth' ? 'bg-blue-500' :
                                log.type === 'security' ? 'bg-red-500' :
                                'bg-green-500'
                              }`} />
                              <div>
                                <p className="text-sm font-medium text-primary">{log.action}</p>
                                <p className="text-xs text-primary/60">{log.user}</p>
                              </div>
                            </div>
                            <p className="text-xs text-primary/40">{log.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 md:p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs md:text-sm text-primary/60">
                    Admin access level: <span className="text-gold font-medium">Principal</span>
                  </p>
                  <GlassButton variant="ghost" onClick={onClose}>
                    Close
                  </GlassButton>
                </div>
              </div>
            </GlassContainer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 