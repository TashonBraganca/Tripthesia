'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Share2, 
  MessageCircle, 
  Lock, 
  Unlock, 
  Eye,
  Edit3,
  Crown,
  UserPlus,
  Copy,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { useCollaborativeTrip } from '@/hooks/use-collaborative-trip';

interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'online' | 'offline';
  cursor?: {
    x: number;
    y: number;
    elementId?: string;
  };
}

interface Comment {
  id: string;
  activityId?: string;
  content: string;
  userId: string;
  userName: string;
  timestamp: string;
  position?: {
    x: number;
    y: number;
  };
}

interface SharedTripCollaborationProps {
  tripId: string;
  isOwner: boolean;
  currentUserId: string;
}

export function SharedTripCollaboration({ 
  tripId, 
  isOwner, 
  currentUserId 
}: SharedTripCollaborationProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'editor' | 'viewer'>('viewer');
  const [copiedLink, setCopiedLink] = useState(false);

  const { 
    isConnected, 
    connect, 
    disconnect, 
    sendMessage,
    toggleActivityLock 
  } = useCollaborativeTrip(tripId);

  useEffect(() => {
    if (!isConnected) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, isConnected]);

  const handleShareTrip = async () => {
    if (!shareEmail) return;

    try {
      const response = await fetch(`/api/trips/${tripId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: shareEmail,
          role: shareRole,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Collaborator added',
          description: `${shareEmail} has been invited to ${shareRole === 'editor' ? 'edit' : 'view'} this trip.`,
        });
        setShareEmail('');
        setIsShareDialogOpen(false);
      } else {
        throw new Error('Failed to add collaborator');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add collaborator. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}/trips/${tripId}/shared`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast({
        title: 'Link copied',
        description: 'Share link has been copied to clipboard.',
      });
      
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment.trim(),
      userId: currentUserId,
      userName: 'You', // This should come from user context
      timestamp: new Date().toISOString(),
    };

    sendMessage({
      type: 'comment',
      comment,
    });

    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-amber-500" />;
      case 'editor':
        return <Edit3 className="h-3 w-3 text-emerald-500" />;
      case 'viewer':
        return <Eye className="h-3 w-3 text-sky-500" />;
    }
  };

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'editor':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'viewer':
        return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
    }
  };

  const onlineUsers = users.filter(user => user.status === 'online');

  return (
    <div className="relative">
      {/* User Cursors */}
      <AnimatePresence>
        {onlineUsers.map(user => 
          user.cursor && user.id !== currentUserId ? (
            <motion.div
              key={user.id}
              className="fixed pointer-events-none z-50"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: user.cursor.x,
                y: user.cursor.y,
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: getUserColor(user.id) }}
                />
                <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  {user.name}
                </div>
              </div>
            </motion.div>
          ) : null
        )}
      </AnimatePresence>

      {/* Collaboration Header */}
      <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium">
              {onlineUsers.length} online
            </span>
          </div>

          {/* Online User Avatars */}
          <div className="flex -space-x-2">
            {onlineUsers.slice(0, 5).map(user => (
              <TooltipProvider key={user.id}>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback 
                        className="text-xs"
                        style={{ backgroundColor: getUserColor(user.id) }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(user.role)}
                      <span>{user.name}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {onlineUsers.length > 5 && (
              <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white border-2 border-white">
                +{onlineUsers.length - 5}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareDialogOpen(true)}
            disabled={!isOwner}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          <div className="flex items-center space-x-1">
            <div 
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} 
            />
            <span className="text-xs text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <MessageCircle className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Comments ({comments.length})</span>
        </div>

        <div className="space-y-3 max-h-40 overflow-y-auto">
          {comments.map(comment => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex space-x-3"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {comment.userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{comment.userName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex space-x-2 mt-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 min-h-0 resize-none"
            rows={1}
          />
          <Button 
            size="sm" 
            onClick={handleAddComment}
            disabled={!newComment.trim()}
          >
            Send
          </Button>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Trip</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Share Link</label>
              <div className="flex space-x-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/trips/${tripId}/shared`}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyShareLink}
                >
                  {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Invite by Email</label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={shareRole} onValueChange={(value: 'editor' | 'viewer') => setShareRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer - Can view the trip</SelectItem>
                  <SelectItem value="editor">Editor - Can edit the trip</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setIsShareDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleShareTrip} disabled={!shareEmail}>
                Send Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Users List */}
      <div className="p-4">
        <div className="space-y-2">
          <span className="text-sm font-medium">All Collaborators</span>
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{user.name}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    {user.email && (
                      <span className="text-xs text-gray-500">{user.email}</span>
                    )}
                  </div>
                </div>

                <Badge className={getRoleBadgeColor(user.role)}>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(user.role)}
                    <span className="capitalize">{user.role}</span>
                  </div>
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate consistent colors for users
function getUserColor(userId: string): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}