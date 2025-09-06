"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { 
  Share2, 
  Link as LinkIcon, 
  Copy, 
  Mail, 
  Users, 
  Eye, 
  Edit, 
  UserPlus, 
  Check,
  X,
  Globe,
  Lock,
  Settings,
  Crown,
  MessageCircle,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { collaborationEngine } from '@/lib/collaboration/real-time-sync';
import type { CollaboratorInfo } from '@/lib/collaboration/real-time-sync';

export interface SharePermission {
  level: 'view' | 'comment' | 'edit';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface SharedUser {
  id: string;
  email: string;
  name?: string;
  permission: SharePermission['level'];
  addedAt: string;
  avatarUrl?: string;
}

export interface TripShareSettings {
  isPublic: boolean;
  allowPublicComments: boolean;
  shareLink: string;
  sharedUsers: SharedUser[];
  ownerPermissions: {
    canInvite: boolean;
    canChangePermissions: boolean;
    canRemoveUsers: boolean;
  };
}

interface TripSharingProps {
  tripId: string;
  tripTitle: string;
  currentSettings: TripShareSettings;
  onSettingsChange: (settings: TripShareSettings) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: 'owner' | 'editor' | 'viewer';
}

const PERMISSION_LEVELS: SharePermission[] = [
  {
    level: 'view',
    label: 'View Only',
    description: 'Can view trip details but cannot make changes',
    icon: Eye,
  },
  {
    level: 'comment',
    label: 'Comment',
    description: 'Can view and add comments/suggestions',
    icon: Edit,
  },
  {
    level: 'edit',
    label: 'Full Edit',
    description: 'Can view, comment, and modify the trip',
    icon: Edit,
  },
];

export default function TripSharing({
  tripId,
  tripTitle,
  currentSettings,
  onSettingsChange,
  isOpen,
  onClose,
  currentUserRole = 'viewer',
}: TripSharingProps) {
  const { user } = useUser();
  const [settings, setSettings] = useState<TripShareSettings>(currentSettings);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<SharePermission['level']>('view');
  const [isInviting, setIsInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [activeCollaborators, setActiveCollaborators] = useState<CollaboratorInfo[]>([]);
  const [isCollaborationConnected, setIsCollaborationConnected] = useState(false);
  const [realtimeActivity, setRealtimeActivity] = useState<string[]>([]);

  const shareUrl = `${window.location.origin}/shared-trip/${tripId}`;

  // Update local settings when props change
  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  // Initialize real-time collaboration
  useEffect(() => {
    if (!user || !tripId || !isOpen) return;

    const initCollaboration = async () => {
      const joined = await collaborationEngine.joinTrip(tripId, user.id, {
        name: user.fullName || user.username || 'Anonymous',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar: user.imageUrl,
        role: currentUserRole,
        isOnline: true,
        lastSeen: new Date(),
      });
      setIsCollaborationConnected(joined);
    };

    collaborationEngine.setEventHandlers({
      onCollaboratorJoin: (collaborator) => {
        setActiveCollaborators(prev => {
          const filtered = prev.filter(c => c.id !== collaborator.id);
          return [...filtered, collaborator];
        });
        setRealtimeActivity(prev => ["" + collaborator.name + " joined the collaboration", ...prev.slice(0, 4)]);
      },
      onCollaboratorLeave: (userId) => {
        setActiveCollaborators(prev => {
          const leaving = prev.find(c => c.id === userId);
          if (leaving) {
            setRealtimeActivity(prevActivity => ["" + leaving.name + " left the collaboration", ...prevActivity.slice(0, 4)]);
          }
          return prev.filter(c => c.id !== userId);
        });
      },
      onContentChange: (change) => {
        setRealtimeActivity(prev => ["Content updated by " + change.author, ...prev.slice(0, 4)]);
      },
    });

    initCollaboration();

    return () => {
      collaborationEngine.leaveTrip();
    };
  }, [user, tripId, currentUserRole, isOpen]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, [shareUrl]);

  const handleInviteUser = useCallback(async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newUser: SharedUser = {
      id: `user-${Date.now()}`,
      email: inviteEmail.trim(),
      name: inviteEmail.split('@')[0], // Extract name from email
      permission: invitePermission,
      addedAt: new Date().toISOString(),
    };

    const updatedSettings = {
      ...settings,
      sharedUsers: [...settings.sharedUsers, newUser],
    };

    setSettings(updatedSettings);
    onSettingsChange(updatedSettings);

    // Reset form
    setInviteEmail('');
    setInvitePermission('view');
    setIsInviting(false);
  }, [inviteEmail, invitePermission, settings, onSettingsChange]);

  const handleRemoveUser = useCallback((userId: string) => {
    const updatedSettings = {
      ...settings,
      sharedUsers: settings.sharedUsers.filter(user => user.id !== userId),
    };

    setSettings(updatedSettings);
    onSettingsChange(updatedSettings);
  }, [settings, onSettingsChange]);

  const handleChangePermission = useCallback((userId: string, newPermission: SharePermission['level']) => {
    const updatedSettings = {
      ...settings,
      sharedUsers: settings.sharedUsers.map(user =>
        user.id === userId ? { ...user, permission: newPermission } : user
      ),
    };

    setSettings(updatedSettings);
    onSettingsChange(updatedSettings);
  }, [settings, onSettingsChange]);

  const handlePublicToggle = useCallback(() => {
    const updatedSettings = {
      ...settings,
      isPublic: !settings.isPublic,
    };

    setSettings(updatedSettings);
    onSettingsChange(updatedSettings);
  }, [settings, onSettingsChange]);

  const getPermissionIcon = (level: SharePermission['level']) => {
    const permission = PERMISSION_LEVELS.find(p => p.level === level);
    return permission?.icon || Eye;
  };

  const getPermissionLabel = (level: SharePermission['level']) => {
    return PERMISSION_LEVELS.find(p => p.level === level)?.label || 'View Only';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Share2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Share Trip</h2>
                <p className="text-sm text-gray-600">{tripTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Real-time Collaboration Status */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {isCollaborationConnected ? (
                    <Wifi className="h-5 w-5 text-green-600" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {isCollaborationConnected ? 'Real-time sync active' : 'Offline'}
                  </span>
                </div>
                {activeCollaborators.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {activeCollaborators.length} active
                    </span>
                  </div>
                )}
              </div>
              <div className="flex -space-x-2">
                {activeCollaborators.slice(0, 3).map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="relative"
                    title={collaborator.name}
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-white">
                      {collaborator.avatar ? (
                        <img
                          src={collaborator.avatar}
                          alt={collaborator.name}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <span className="text-xs font-medium text-indigo-600">
                          {collaborator.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                ))}
                {activeCollaborators.length > 3 && (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-xs font-medium text-gray-600">
                      +{activeCollaborators.length - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            {realtimeActivity.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Recent Activity
                </h3>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {realtimeActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
                    >
                      {activity}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Public Sharing Toggle */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-3">
                {settings.isPublic ? (
                  <Globe className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-400 mt-0.5" />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">
                    {settings.isPublic ? 'Public Trip' : 'Private Trip'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {settings.isPublic
                      ? 'Anyone with the link can view this trip'
                      : 'Only invited people can access this trip'
                    }
                  </p>
                </div>
              </div>
              
              <motion.button
                onClick={handlePublicToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.isPublic ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    settings.isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                  layout
                />
              </motion.button>
            </div>

            {/* Share Link */}
            <div className="space-y-3">
              <label htmlFor="share-link-input" className="block text-sm font-medium text-gray-700">
                Share Link
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 flex items-center border border-gray-300 rounded-lg">
                  <div className="p-3 border-r border-gray-300">
                    <LinkIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="share-link-input"
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 text-sm text-gray-600"
                  />
                </div>
                <motion.button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    copiedLink
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {copiedLink ? (
                    <div className="flex items-center space-x-1">
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </div>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Invite Users */}
            <div className="space-y-4">
              <label htmlFor="invite-email-input" className="block text-sm font-medium text-gray-700">
                Invite Collaborators
              </label>
              
              <div className="space-y-3">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <input
                      id="invite-email-input"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={invitePermission}
                    onChange={(e) => setInvitePermission(e.target.value as SharePermission['level'])}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {PERMISSION_LEVELS.map((permission) => (
                      <option key={permission.level} value={permission.level}>
                        {permission.label}
                      </option>
                    ))}
                  </select>
                  
                  <motion.button
                    onClick={handleInviteUser}
                    disabled={!inviteEmail.trim() || isInviting}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      !inviteEmail.trim() || isInviting
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                    whileHover={!isInviting && inviteEmail.trim() ? { scale: 1.05 } : {}}
                    whileTap={!isInviting && inviteEmail.trim() ? { scale: 0.95 } : {}}
                  >
                    {isInviting ? 'Inviting...' : 'Invite'}
                  </motion.button>
                </div>
                
                <div className="text-xs text-gray-500">
                  {PERMISSION_LEVELS.find(p => p.level === invitePermission)?.description}
                </div>
              </div>
            </div>

            {/* Shared Users List */}
            {settings.sharedUsers.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Shared with ({settings.sharedUsers.length})
                </h3>
                
                <div className="space-y-2">
                  {settings.sharedUsers.map((user) => {
                    const PermissionIcon = getPermissionIcon(user.permission);
                    
                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name || user.email}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <span className="text-sm font-medium text-indigo-600">
                                {(user.name || user.email).charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.name || user.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.email} • Added {formatDate(user.addedAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Show if user is online */}
                          {activeCollaborators.find(c => c.email === user.email) && (
                            <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span className="text-xs">Online</span>
                            </div>
                          )}
                          
                          <select
                            value={user.permission}
                            onChange={(e) => handleChangePermission(user.id, e.target.value as SharePermission['level'])}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            disabled={currentUserRole !== 'owner'}
                          >
                            {PERMISSION_LEVELS.map((permission) => (
                              <option key={permission.level} value={permission.level}>
                                {permission.label}
                              </option>
                            ))}
                          </select>
                          
                          {currentUserRole === 'owner' && (
                            <button
                              onClick={() => handleRemoveUser(user.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Remove user"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            <div className="space-y-4">
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <Settings className="h-4 w-4" />
                <span>Advanced Settings</span>
              </button>

              <AnimatePresence>
                {showAdvancedSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Allow Public Comments</p>
                        <p className="text-xs text-gray-600">Let anyone with the link add comments</p>
                      </div>
                      <motion.button
                        onClick={() => {
                          const updatedSettings = {
                            ...settings,
                            allowPublicComments: !settings.allowPublicComments,
                          };
                          setSettings(updatedSettings);
                          onSettingsChange(updatedSettings);
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          settings.allowPublicComments ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.span
                          className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
                            settings.allowPublicComments ? 'translate-x-5' : 'translate-x-1'
                          }`}
                          layout
                        />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}