/**
 * Collaborative Trip Sharing Component
 * Real-time collaboration UI for shared trip planning
 */

"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Users,
  Share2,
  Copy,
  Eye,
  Edit,
  Lock,
  Unlock,
  MessageCircle,
  UserPlus,
  Settings,
  Crown,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollaborativeEditing, CollaborativeTripService } from '@/lib/collaborative-editing';
import type { Collaborator } from '@/lib/collaborative-editing';
import { containerVariants, itemVariants } from '@/lib/motion';
import { trackEvent } from '@/lib/monitoring';

interface CollaborativeTripSharingProps {
  tripId: string;
  tripTitle: string;
  isOwner: boolean;
  onEditingModeChange?: (isCollaborative: boolean) => void;
}

export function CollaborativeTripSharing({
  tripId,
  tripTitle,
  isOwner,
  onEditingModeChange
}: CollaborativeTripSharingProps) {
  const { user } = useUser();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isCollaborativeMode, setIsCollaborativeMode] = useState(false);
  
  const {
    service,
    collaborators,
    isConnected,
    canEdit
  } = useCollaborativeEditing(
    tripId,
    user?.id || '',
    user?.fullName || user?.firstName || 'Anonymous'
  );

  useEffect(() => {
    setShareUrl(`${window.location.origin}/trip/${tripId}/shared`);
  }, [tripId]);

  useEffect(() => {
    onEditingModeChange?.(isCollaborativeMode && isConnected);
  }, [isCollaborativeMode, isConnected, onEditingModeChange]);

  const handleToggleCollaboration = async () => {
    if (!isCollaborativeMode) {
      setIsCollaborativeMode(true);
      trackEvent('collaboration_enabled', {
        trip_id: tripId,
        user_id: user?.id,
        is_owner: isOwner
      });
    } else {
      setIsCollaborativeMode(false);
      await service.disconnect();
      trackEvent('collaboration_disabled', {
        trip_id: tripId,
        user_id: user?.id
      });
    }
  };

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      trackEvent('share_url_copied', {
        trip_id: tripId,
        user_id: user?.id
      });
    } catch (error) {
      console.error('Failed to copy share URL:', error);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;
    
    // TODO: Implement email invitation
    console.log('Inviting user:', inviteEmail);
    trackEvent('user_invited', {
      trip_id: tripId,
      inviter_id: user?.id,
      invited_email: inviteEmail
    });
    
    setInviteEmail('');
  };

  if (!user) return null;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Collaboration Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Collaborative Planning
              {isConnected ? (
                <Badge variant="secondary" className="gap-1">
                  <Wifi className="h-3 w-3" />
                  Live
                </Badge>
              ) : isCollaborativeMode ? (
                <Badge variant="outline" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  Connecting...
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Real-time collaboration</p>
                <p className="text-xs text-muted-foreground">
                  Work together on this trip with friends and family
                </p>
              </div>
              <Button
                variant={isCollaborativeMode ? "secondary" : "outline"}
                size="sm"
                onClick={handleToggleCollaboration}
                disabled={!isOwner && !canEdit()}
              >
                {isCollaborativeMode ? "Exit" : "Start"} Collaboration
              </Button>
            </div>

            {isCollaborativeMode && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {/* Active Collaborators */}
                {collaborators.length > 0 && (
                  <motion.div variants={itemVariants} className="space-y-2">
                    <p className="text-sm font-medium">Active collaborators ({collaborators.length})</p>
                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence>
                        {collaborators.map((collaborator) => (
                          <CollaboratorAvatar
                            key={collaborator.userId}
                            collaborator={collaborator}
                            isCurrentUser={collaborator.userId === user.id}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                <Separator />

                {/* Share Options */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <p className="text-sm font-medium">Share this trip</p>
                  
                  <div className="flex gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="text-xs"
                      placeholder="Share URL will appear here"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={handleCopyShareUrl}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy share URL</TooltipContent>
                    </Tooltip>
                  </div>

                  {isOwner && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter email to invite"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleInviteUser()}
                      />
                      <Button size="sm" onClick={handleInviteUser} disabled={!inviteEmail.trim()}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Invite
                      </Button>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Collaboration Status */}
        {isCollaborativeMode && isConnected && (
          <CollaborationStatus
            collaborators={collaborators}
            canEdit={canEdit()}
            isOwner={isOwner}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

interface CollaboratorAvatarProps {
  collaborator: Collaborator;
  isCurrentUser: boolean;
}

function CollaboratorAvatar({ collaborator, isCurrentUser }: CollaboratorAvatarProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="relative"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Avatar className={cn("h-8 w-8 ring-2", isCurrentUser && "ring-emerald-500")}>
              <AvatarImage src={collaborator.avatar} />
              <AvatarFallback 
                style={{ backgroundColor: collaborator.color }}
                className="text-white text-xs font-medium"
              >
                {collaborator.userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Online indicator */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
              collaborator.isOnline ? "bg-green-500" : "bg-gray-400"
            )} />

            {/* Owner crown */}
            {collaborator.role === 'owner' && (
              <Crown className="absolute -top-1 -right-1 h-3 w-3 text-amber-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{collaborator.userName}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {collaborator.role} • {collaborator.isOnline ? 'Online' : 'Offline'}
            </p>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs mt-1">You</Badge>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </motion.div>
  );
}

interface CollaborationStatusProps {
  collaborators: Collaborator[];
  canEdit: boolean;
  isOwner: boolean;
}

function CollaborationStatus({ collaborators, canEdit, isOwner }: CollaborationStatusProps) {
  const activeCount = collaborators.filter(c => c.isOnline).length;
  const editorsCount = collaborators.filter(c => c.role === 'editor' || c.role === 'owner').length;
  const viewersCount = collaborators.filter(c => c.role === 'viewer').length;

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center"
    >
      <div className="p-3 rounded-lg bg-muted/50">
        <div className="text-2xl font-bold text-emerald-500">{activeCount}</div>
        <div className="text-xs text-muted-foreground">Active Now</div>
      </div>
      
      <div className="p-3 rounded-lg bg-muted/50">
        <div className="text-2xl font-bold text-sky-500">{editorsCount}</div>
        <div className="text-xs text-muted-foreground">Editors</div>
      </div>
      
      <div className="p-3 rounded-lg bg-muted/50">
        <div className="text-2xl font-bold text-amber-500">{viewersCount}</div>
        <div className="text-xs text-muted-foreground">Viewers</div>
      </div>
      
      <div className="p-3 rounded-lg bg-muted/50">
        <div className="flex items-center justify-center gap-1">
          {canEdit ? (
            <>
              <Edit className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Can Edit</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500 font-medium">View Only</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Hook for activity-level collaboration features
export function useActivityCollaboration(activityId: string, service: CollaborativeTripService) {
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);

  const lockActivity = () => {
    service.toggleActivityLock(activityId, true);
    setIsLocked(true);
  };

  const unlockActivity = () => {
    service.toggleActivityLock(activityId, false);
    setIsLocked(false);
    setLockedBy(null);
  };

  // Listen for lock events
  useEffect(() => {
    service.on('lock', (event: any) => {
      if (event.data?.activityId === activityId) {
        setIsLocked(true);
        setLockedBy(event.userId);
      }
    });

    service.on('unlock', (event: any) => {
      if (event.data?.activityId === activityId) {
        setIsLocked(false);
        setLockedBy(null);
      }
    });

    return () => {
      service.off('lock');
      service.off('unlock');
    };
  }, [activityId, service]);

  return {
    isLocked,
    lockedBy,
    lockActivity,
    unlockActivity
  };
}