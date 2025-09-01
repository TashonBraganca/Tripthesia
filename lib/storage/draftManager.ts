/**
 * Draft Trip Management System
 * Handles auto-save, form recovery, and draft persistence
 */

import React from 'react';
import { LocationData } from '@/lib/data/locations';

// Draft trip interface
export interface DraftTrip {
  id: string;
  userId?: string;
  title: string;
  formData: {
    from?: LocationData | null;
    to?: LocationData | null;
    startDate?: string;
    endDate?: string;
    travelers?: number;
    tripType?: string;
    budget?: number;
    currency?: string;
    currentStep?: number;
    completedSteps?: string[];
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastAccessedAt: Date;
    autoSave: boolean;
    version: number;
    deviceId?: string;
    browserSession?: string;
  };
  status: 'draft' | 'active' | 'completed' | 'abandoned';
  progress: {
    completedFields: number;
    totalFields: number;
    completionPercentage: number;
  };
}

// Auto-save configuration
export interface AutoSaveConfig {
  enabled: boolean;
  localInterval: number; // seconds
  cloudInterval: number; // seconds  
  maxRetries: number;
  conflictResolution: 'merge' | 'latest' | 'prompt';
  offlineMode: boolean;
}

const DEFAULT_CONFIG: AutoSaveConfig = {
  enabled: true,
  localInterval: 2, // Save to localStorage every 2 seconds
  cloudInterval: 10, // Save to server every 10 seconds
  maxRetries: 3,
  conflictResolution: 'latest',
  offlineMode: true
};

class DraftManager {
  private config: AutoSaveConfig;
  private localStorageKey = 'tripthesia_drafts';
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncQueue: DraftTrip[] = [];

  constructor(config: Partial<AutoSaveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Set up online/offline detection
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processSyncQueue();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
      
      // Clean up old drafts on page load
      this.cleanupOldDrafts();
    }
  }

  // Generate unique ID for drafts
  private generateDraftId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get device fingerprint for conflict resolution
  private getDeviceId(): string {
    if (typeof window === 'undefined') return 'server';
    
    const stored = localStorage.getItem('tripthesia_device_id');
    if (stored) return stored;
    
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('tripthesia_device_id', deviceId);
    return deviceId;
  }

  // Create a new draft
  createDraft(formData: DraftTrip['formData'], userId?: string): DraftTrip {
    const now = new Date();
    const title = this.generateDraftTitle(formData);
    
    const draft: DraftTrip = {
      id: this.generateDraftId(),
      userId,
      title,
      formData,
      metadata: {
        createdAt: now,
        updatedAt: now,
        lastAccessedAt: now,
        autoSave: true,
        version: 1,
        deviceId: this.getDeviceId(),
        browserSession: this.getBrowserSessionId()
      },
      status: 'draft',
      progress: this.calculateProgress(formData)
    };
    
    this.saveDraftLocal(draft);
    return draft;
  }

  // Generate human-readable title for draft
  private generateDraftTitle(formData: DraftTrip['formData']): string {
    if (formData.from && formData.to) {
      return `${formData.from.name} → ${formData.to.name}`;
    } else if (formData.to) {
      return `Trip to ${formData.to.name}`;
    } else if (formData.from) {
      return `Trip from ${formData.from.name}`;
    }
    return `Untitled Trip - ${new Date().toLocaleDateString()}`;
  }

  // Calculate form completion progress
  private calculateProgress(formData: DraftTrip['formData']) {
    const requiredFields = ['from', 'to', 'startDate', 'endDate', 'tripType', 'travelers'];
    const completedFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return value !== undefined && value !== null && value !== '';
    }).length;
    
    return {
      completedFields,
      totalFields: requiredFields.length,
      completionPercentage: Math.round((completedFields / requiredFields.length) * 100)
    };
  }

  // Get browser session ID
  private getBrowserSessionId(): string {
    if (typeof sessionStorage === 'undefined') return 'session_unknown';
    
    let sessionId = sessionStorage.getItem('tripthesia_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('tripthesia_session_id', sessionId);
    }
    return sessionId;
  }

  // Update existing draft
  updateDraft(draftId: string, formData: Partial<DraftTrip['formData']>): DraftTrip | null {
    const drafts = this.getAllDraftsLocal();
    const existingDraft = drafts.find(d => d.id === draftId);
    
    if (!existingDraft) return null;
    
    const updatedDraft: DraftTrip = {
      ...existingDraft,
      formData: { ...existingDraft.formData, ...formData },
      metadata: {
        ...existingDraft.metadata,
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
        version: existingDraft.metadata.version + 1
      },
      progress: this.calculateProgress({ ...existingDraft.formData, ...formData }),
      title: this.generateDraftTitle({ ...existingDraft.formData, ...formData })
    };
    
    this.saveDraftLocal(updatedDraft);
    
    // Schedule cloud sync if online
    if (this.isOnline) {
      this.scheduleCloudSync(updatedDraft);
    } else {
      this.addToSyncQueue(updatedDraft);
    }
    
    return updatedDraft;
  }

  // Save draft to localStorage
  private saveDraftLocal(draft: DraftTrip): void {
    try {
      const drafts = this.getAllDraftsLocal();
      const existingIndex = drafts.findIndex(d => d.id === draft.id);
      
      if (existingIndex >= 0) {
        drafts[existingIndex] = draft;
      } else {
        drafts.push(draft);
      }
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to save draft locally:', error);
    }
  }

  // Get all drafts from localStorage
  private getAllDraftsLocal(): DraftTrip[] {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (!stored) return [];
      
      return JSON.parse(stored).map((draft: any) => ({
        ...draft,
        metadata: {
          ...draft.metadata,
          createdAt: new Date(draft.metadata.createdAt),
          updatedAt: new Date(draft.metadata.updatedAt),
          lastAccessedAt: new Date(draft.metadata.lastAccessedAt)
        }
      }));
    } catch (error) {
      console.error('Failed to get drafts from localStorage:', error);
      return [];
    }
  }

  // Get specific draft by ID
  getDraft(draftId: string): DraftTrip | null {
    const drafts = this.getAllDraftsLocal();
    const draft = drafts.find(d => d.id === draftId);
    
    if (draft) {
      // Update last accessed time
      draft.metadata.lastAccessedAt = new Date();
      this.saveDraftLocal(draft);
    }
    
    return draft || null;
  }

  // Get all drafts for a user
  getUserDrafts(userId?: string): DraftTrip[] {
    const allDrafts = this.getAllDraftsLocal();
    
    if (userId) {
      return allDrafts.filter(draft => draft.userId === userId);
    }
    
    // Return drafts for current browser session if no userId
    const sessionId = this.getBrowserSessionId();
    return allDrafts.filter(draft => 
      draft.metadata.browserSession === sessionId || 
      !draft.userId // Include anonymous drafts
    );
  }

  // Delete a draft
  deleteDraft(draftId: string): boolean {
    try {
      const drafts = this.getAllDraftsLocal();
      const filteredDrafts = drafts.filter(d => d.id !== draftId);
      
      if (filteredDrafts.length === drafts.length) {
        return false; // Draft not found
      }
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(filteredDrafts));
      
      // Clear auto-save timer if exists
      const timer = this.autoSaveTimers.get(draftId);
      if (timer) {
        clearInterval(timer);
        this.autoSaveTimers.delete(draftId);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete draft:', error);
      return false;
    }
  }

  // Start auto-save for a draft
  startAutoSave(draftId: string, formDataGetter: () => DraftTrip['formData']): void {
    if (!this.config.enabled) return;
    
    // Clear existing timer
    const existingTimer = this.autoSaveTimers.get(draftId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }
    
    // Set up new auto-save timer
    const timer = setInterval(() => {
      const formData = formDataGetter();
      this.updateDraft(draftId, formData);
    }, this.config.localInterval * 1000);
    
    this.autoSaveTimers.set(draftId, timer);
  }

  // Stop auto-save for a draft
  stopAutoSave(draftId: string): void {
    const timer = this.autoSaveTimers.get(draftId);
    if (timer) {
      clearInterval(timer);
      this.autoSaveTimers.delete(draftId);
    }
  }

  // Schedule cloud sync
  private scheduleCloudSync(draft: DraftTrip): void {
    if (!this.isOnline) {
      this.addToSyncQueue(draft);
      return;
    }
    
    // Implement cloud sync (placeholder)
    setTimeout(() => {
      this.syncToCloud(draft);
    }, this.config.cloudInterval * 1000);
  }

  // Add to sync queue for offline mode
  private addToSyncQueue(draft: DraftTrip): void {
    const existingIndex = this.syncQueue.findIndex(d => d.id === draft.id);
    if (existingIndex >= 0) {
      this.syncQueue[existingIndex] = draft;
    } else {
      this.syncQueue.push(draft);
    }
  }

  // Process sync queue when coming online
  private processSyncQueue(): void {
    if (!this.isOnline || this.syncQueue.length === 0) return;
    
    const queue = [...this.syncQueue];
    this.syncQueue = [];
    
    queue.forEach(draft => {
      this.syncToCloud(draft);
    });
  }

  // Sync draft to cloud (placeholder implementation)
  private async syncToCloud(draft: DraftTrip): Promise<void> {
    try {
      // In a real implementation, this would call your API
      // await fetch('/api/drafts', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(draft)
      // });
      
      console.log('Draft synced to cloud:', draft.id);
    } catch (error) {
      console.error('Failed to sync draft to cloud:', error);
      this.addToSyncQueue(draft); // Re-queue for retry
    }
  }

  // Clean up old drafts (older than 30 days)
  private cleanupOldDrafts(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const drafts = this.getAllDraftsLocal();
    const activeDrafts = drafts.filter(draft => 
      draft.metadata.lastAccessedAt > thirtyDaysAgo || 
      draft.status === 'active'
    );
    
    if (activeDrafts.length < drafts.length) {
      localStorage.setItem(this.localStorageKey, JSON.stringify(activeDrafts));
      console.log(`Cleaned up ${drafts.length - activeDrafts.length} old drafts`);
    }
  }

  // Get draft statistics
  getDraftStats(userId?: string): {
    total: number;
    completed: number;
    inProgress: number;
    abandoned: number;
    averageCompletion: number;
  } {
    const drafts = this.getUserDrafts(userId);
    
    const stats = {
      total: drafts.length,
      completed: 0,
      inProgress: 0,
      abandoned: 0,
      averageCompletion: 0
    };
    
    if (drafts.length === 0) return stats;
    
    let totalCompletion = 0;
    
    drafts.forEach(draft => {
      totalCompletion += draft.progress.completionPercentage;
      
      switch (draft.status) {
        case 'completed': stats.completed++; break;
        case 'active': 
        case 'draft': stats.inProgress++; break;
        case 'abandoned': stats.abandoned++; break;
      }
    });
    
    stats.averageCompletion = Math.round(totalCompletion / drafts.length);
    
    return stats;
  }

  // Export draft data for backup
  exportDrafts(userId?: string): string {
    const drafts = this.getUserDrafts(userId);
    return JSON.stringify(drafts, null, 2);
  }

  // Import draft data from backup
  importDrafts(data: string): boolean {
    try {
      const importedDrafts: DraftTrip[] = JSON.parse(data);
      const existingDrafts = this.getAllDraftsLocal();
      
      // Merge without duplicates
      const allDrafts = [...existingDrafts];
      
      importedDrafts.forEach(draft => {
        const existingIndex = allDrafts.findIndex(d => d.id === draft.id);
        if (existingIndex >= 0) {
          // Keep the one with latest version
          if (draft.metadata.version > allDrafts[existingIndex].metadata.version) {
            allDrafts[existingIndex] = draft;
          }
        } else {
          allDrafts.push(draft);
        }
      });
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(allDrafts));
      return true;
    } catch (error) {
      console.error('Failed to import drafts:', error);
      return false;
    }
  }
}

// Global instance
export const draftManager = new DraftManager();

// React hook for using draft manager

export const useDraftManager = (userId?: string) => {
  const [drafts, setDrafts] = React.useState<DraftTrip[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const loadDrafts = () => {
      const userDrafts = draftManager.getUserDrafts(userId);
      setDrafts(userDrafts);
      setLoading(false);
    };
    
    loadDrafts();
    
    // Set up periodic refresh
    const interval = setInterval(loadDrafts, 5000);
    
    return () => clearInterval(interval);
  }, [userId]);
  
  const createDraft = (formData: DraftTrip['formData']) => {
    const draft = draftManager.createDraft(formData, userId);
    setDrafts(prev => [draft, ...prev]);
    return draft;
  };
  
  const updateDraft = (draftId: string, formData: Partial<DraftTrip['formData']>) => {
    const updated = draftManager.updateDraft(draftId, formData);
    if (updated) {
      setDrafts(prev => prev.map(d => d.id === draftId ? updated : d));
    }
    return updated;
  };
  
  const deleteDraft = (draftId: string) => {
    const success = draftManager.deleteDraft(draftId);
    if (success) {
      setDrafts(prev => prev.filter(d => d.id !== draftId));
    }
    return success;
  };
  
  return {
    drafts,
    loading,
    createDraft,
    updateDraft,
    deleteDraft,
    getDraft: draftManager.getDraft.bind(draftManager),
    startAutoSave: draftManager.startAutoSave.bind(draftManager),
    stopAutoSave: draftManager.stopAutoSave.bind(draftManager),
    stats: draftManager.getDraftStats(userId)
  };
};

export default draftManager;