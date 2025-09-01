'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Clock, Trash2, Download, Upload, MapPin, Calendar, Users, FileText, AlertCircle } from 'lucide-react';
import { useDraftManager, DraftTrip } from '@/lib/storage/draftManager';
import { AnimatedButton } from '@/components/effects/AnimatedButton';
import { formatDistanceToNow } from 'date-fns';

interface DraftManagerProps {
  userId?: string;
  onLoadDraft?: (draft: DraftTrip) => void;
  className?: string;
}

export const DraftManager: React.FC<DraftManagerProps> = ({
  userId,
  onLoadDraft,
  className = ''
}) => {
  const { drafts, loading, deleteDraft, stats } = useDraftManager(userId);
  const [showAll, setShowAll] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);

  const sortedDrafts = drafts
    .sort((a, b) => b.metadata.updatedAt.getTime() - a.metadata.updatedAt.getTime())
    .slice(0, showAll ? drafts.length : 5);

  const handleLoadDraft = (draft: DraftTrip) => {
    if (onLoadDraft) {
      onLoadDraft(draft);
    }
  };

  const handleDeleteDraft = async (draftId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      deleteDraft(draftId);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'teal';
    if (percentage >= 50) return 'sky';
    if (percentage >= 20) return 'amber';
    return 'red';
  };

  const getDraftIcon = (draft: DraftTrip) => {
    if (draft.progress.completionPercentage >= 80) return <FileText className="text-teal-400" size={16} />;
    if (draft.progress.completionPercentage >= 50) return <MapPin className="text-sky-400" size={16} />;
    return <Clock className="text-amber-400" size={16} />;
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-navy-700/50 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <FileText className="text-navy-500 mx-auto mb-3" size={32} />
        <p className="text-navy-400">No draft trips found</p>
        <p className="text-navy-500 text-sm mt-1">Your saved trips will appear here</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-navy-800/60 backdrop-blur-md rounded-lg p-3 border border-navy-600/50">
          <div className="text-xs text-navy-400">Total Drafts</div>
          <div className="text-lg font-semibold text-navy-100">{stats.total}</div>
        </div>
        <div className="bg-navy-800/60 backdrop-blur-md rounded-lg p-3 border border-navy-600/50">
          <div className="text-xs text-navy-400">In Progress</div>
          <div className="text-lg font-semibold text-sky-400">{stats.inProgress}</div>
        </div>
        <div className="bg-navy-800/60 backdrop-blur-md rounded-lg p-3 border border-navy-600/50">
          <div className="text-xs text-navy-400">Completed</div>
          <div className="text-lg font-semibold text-teal-400">{stats.completed}</div>
        </div>
        <div className="bg-navy-800/60 backdrop-blur-md rounded-lg p-3 border border-navy-600/50">
          <div className="text-xs text-navy-400">Avg. Progress</div>
          <div className="text-lg font-semibold text-navy-100">{stats.averageCompletion}%</div>
        </div>
      </div>

      {/* Draft List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy-200">Recent Drafts</h3>
          {drafts.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
            >
              {showAll ? 'Show Less' : `Show All (${drafts.length})`}
            </button>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {sortedDrafts.map((draft, index) => {
            const progressColor = getProgressColor(draft.progress.completionPercentage);
            const isSelected = selectedDraft === draft.id;

            return (
              <motion.div
                key={draft.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`group cursor-pointer p-4 bg-navy-800/60 backdrop-blur-md rounded-lg border border-navy-600/50 hover:border-navy-500/50 transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-teal-400/50' : ''
                }`}
                onClick={() => {
                  setSelectedDraft(draft.id);
                  handleLoadDraft(draft);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center space-x-2 mb-2">
                      {getDraftIcon(draft)}
                      <h4 className="font-medium text-navy-100 truncate">{draft.title}</h4>
                      {draft.metadata.autoSave && (
                        <div className="flex items-center space-x-1 text-xs text-green-400">
                          <Save size={12} />
                          <span>Auto-saved</span>
                        </div>
                      )}
                    </div>

                    {/* Trip Details */}
                    <div className="space-y-1 mb-3">
                      {draft.formData.from && draft.formData.to && (
                        <div className="flex items-center text-xs text-navy-300">
                          <MapPin size={12} className="mr-1" />
                          <span className="truncate">
                            {draft.formData.from.name} → {draft.formData.to.name}
                          </span>
                        </div>
                      )}
                      
                      {draft.formData.startDate && draft.formData.endDate && (
                        <div className="flex items-center text-xs text-navy-300">
                          <Calendar size={12} className="mr-1" />
                          <span>
                            {new Date(draft.formData.startDate).toLocaleDateString()} - {new Date(draft.formData.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      {draft.formData.travelers && (
                        <div className="flex items-center text-xs text-navy-300">
                          <Users size={12} className="mr-1" />
                          <span>{draft.formData.travelers} traveler{draft.formData.travelers > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-navy-400">Progress</span>
                        <span className={`text-${progressColor}-400 font-medium`}>
                          {draft.progress.completionPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-navy-700 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className={`h-full bg-${progressColor}-400 rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${draft.progress.completionPercentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        />
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-navy-500">
                      <span>
                        Updated {formatDistanceToNow(draft.metadata.updatedAt, { addSuffix: true })}
                      </span>
                      <span>v{draft.metadata.version}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => handleDeleteDraft(draft.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all duration-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Warning for drafts without recent activity */}
      {drafts.some(d => {
        const daysSinceUpdate = (Date.now() - d.metadata.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate > 7;
      }) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-3 mt-4"
        >
          <div className="flex items-start space-x-2">
            <AlertCircle size={16} className="text-amber-400 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-amber-300">Old drafts detected</div>
              <div className="text-xs text-amber-400 mt-1">
                Some drafts haven&apos;t been updated in a while. They&apos;ll be automatically cleaned up after 30 days of inactivity.
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DraftManager;