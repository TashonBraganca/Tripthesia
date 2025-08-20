"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Share2, 
  Copy, 
  ExternalLink,
  Check,
  X,
  Trash2,
  Loader2,
  Globe,
  Lock,
  Calendar,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareDialogProps {
  tripId: string;
  tripTitle: string;
  className?: string;
  children?: React.ReactNode;
}

interface ShareSettings {
  id: string;
  shareUrl: string;
  isPublic: boolean;
  allowComments: boolean;
  permissions: string[];
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export function ShareDialog({ 
  tripId, 
  tripTitle, 
  className, 
  children 
}: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shares, setShares] = useState<ShareSettings[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [newShareSettings, setNewShareSettings] = useState({
    isPublic: false,
    allowComments: false,
    expiresAt: "",
  });

  // Load existing shares when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadShares();
    }
  }, [isOpen]);

  const loadShares = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/share`);
      if (response.ok) {
        const data = await response.json();
        setShares(data.shares || []);
      }
    } catch (error) {
      console.error("Failed to load shares:", error);
    }
  };

  const createShare = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          settings: {
            isPublic: newShareSettings.isPublic,
            allowComments: newShareSettings.allowComments,
            expiresAt: newShareSettings.expiresAt || undefined,
            permissions: ["view"],
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await loadShares(); // Reload shares
        setNewShareSettings({
          isPublic: false,
          allowComments: false,
          expiresAt: "",
        });
      } else {
        console.error("Failed to create share");
      }
    } catch (error) {
      console.error("Failed to create share:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeShares = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "revoke",
        }),
      });

      if (response.ok) {
        setShares([]);
      } else {
        console.error("Failed to revoke shares");
      }
    } catch (error) {
      console.error("Failed to revoke shares:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, shareId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(shareId);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasActiveShares = shares.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className={cn("flex items-center gap-2", className)}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Trip
          </DialogTitle>
          <DialogDescription>
            Share your trip itinerary with others via a secure link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Shares */}
          {hasActiveShares && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Active Share Links</h4>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={revokeShares}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Revoke All
                </Button>
              </div>
              
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="p-3 border rounded-lg space-y-2"
                >
                  {/* Share URL */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={share.shareUrl}
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(share.shareUrl, share.id)}
                      className="flex-shrink-0"
                    >
                      {copySuccess === share.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(share.shareUrl, "_blank")}
                      className="flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Share Info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {share.isPublic ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                      {share.isPublic ? "Public" : "Private"}
                    </div>
                    
                    {share.allowComments && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        Comments
                      </div>
                    )}
                    
                    {share.expiresAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Expires {formatDate(share.expiresAt)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Created {formatDate(share.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasActiveShares && <Separator />}

          {/* Create New Share */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">
              {hasActiveShares ? "Create New Share Link" : "Share This Trip"}
            </h4>
            
            {/* Share Settings */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={newShareSettings.isPublic}
                  onCheckedChange={(checked) => 
                    setNewShareSettings(prev => ({ ...prev, isPublic: !!checked }))
                  }
                />
                <Label htmlFor="isPublic" className="text-sm">
                  Make publicly discoverable
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowComments"
                  checked={newShareSettings.allowComments}
                  onCheckedChange={(checked) => 
                    setNewShareSettings(prev => ({ ...prev, allowComments: !!checked }))
                  }
                />
                <Label htmlFor="allowComments" className="text-sm">
                  Allow comments from viewers
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiresAt" className="text-sm">
                  Link expiration (optional)
                </Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={newShareSettings.expiresAt}
                  onChange={(e) => 
                    setNewShareSettings(prev => ({ ...prev, expiresAt: e.target.value }))
                  }
                  className="text-sm"
                />
              </div>
            </div>

            {/* Create Button */}
            <Button
              onClick={createShare}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Create Share Link
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Share Link Features:</p>
            <ul className="space-y-1">
              <li>• Viewers can see your full itinerary</li>
              <li>• Links can be revoked at any time</li>
              <li>• Set expiration dates for temporary sharing</li>
              <li>• Public links may appear in search results</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}