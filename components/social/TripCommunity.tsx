"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Filter,
  Search,
  Star,
  Eye,
  ThumbsUp,
  Flag,
  Award,
  Camera,
  Clock,
  User,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react';

interface TripCommunityProps {
  currentUserId?: string;
  className?: string;
}

interface PublicTrip {
  id: string;
  title: string;
  destination: string;
  duration: number;
  budget: number;
  currency: 'USD' | 'INR';
  description: string;
  coverImage?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
    tripCount: number;
  };
  stats: {
    views: number;
    likes: number;
    comments: number;
    saves: number;
  };
  tags: string[];
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  highlights: string[];
  difficulty: 'easy' | 'moderate' | 'challenging';
  travelStyle: 'budget' | 'mid-range' | 'luxury';
  featured: boolean;
}

interface TripComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

interface CommunityStats {
  totalTrips: number;
  totalTravelers: number;
  totalDestinations: number;
  thisWeekTrips: number;
}

// Mock data - would come from API
const mockTrips: PublicTrip[] = [
  {
    id: '1',
    title: 'Cultural Immersion in Kyoto',
    destination: 'Kyoto, Japan',
    duration: 7,
    budget: 1500,
    currency: 'USD',
    description: 'A perfect blend of traditional temples, authentic cuisine, and cultural experiences in Japan\'s ancient capital.',
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop',
    author: {
      id: 'user1',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b85ad3ad?w=40&h=40&fit=crop&crop=face',
      verified: true,
      tripCount: 15,
    },
    stats: {
      views: 2843,
      likes: 156,
      comments: 23,
      saves: 89,
    },
    tags: ['Culture', 'Temples', 'Food', 'History'],
    isLiked: false,
    isSaved: true,
    createdAt: '2025-08-25T10:30:00Z',
    highlights: ['Fushimi Inari Shrine', 'Traditional Tea Ceremony', 'Bamboo Grove'],
    difficulty: 'easy',
    travelStyle: 'mid-range',
    featured: true,
  },
  {
    id: '2',
    title: 'Budget Backpacking Through Southeast Asia',
    destination: 'Thailand, Vietnam, Cambodia',
    duration: 21,
    budget: 800,
    currency: 'USD',
    description: 'An epic adventure across three countries with street food, stunning beaches, and ancient temples.',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    author: {
      id: 'user2',
      name: 'Alex Rodriguez',
      verified: false,
      tripCount: 8,
    },
    stats: {
      views: 1524,
      likes: 98,
      comments: 31,
      saves: 67,
    },
    tags: ['Budget', 'Backpacking', 'Street Food', 'Beaches'],
    isLiked: true,
    isSaved: false,
    createdAt: '2025-08-22T14:15:00Z',
    highlights: ['Angkor Wat Sunrise', 'Ha Long Bay Cruise', 'Bangkok Street Food'],
    difficulty: 'moderate',
    travelStyle: 'budget',
    featured: false,
  },
];

const mockStats: CommunityStats = {
  totalTrips: 15420,
  totalTravelers: 8932,
  totalDestinations: 234,
  thisWeekTrips: 147,
};

export default function TripCommunity({ currentUserId, className = '' }: TripCommunityProps) {
  const [trips, setTrips] = useState<PublicTrip[]>(mockTrips);
  const [selectedTrip, setSelectedTrip] = useState<PublicTrip | null>(null);
  const [filter, setFilter] = useState<'all' | 'featured' | 'recent' | 'popular'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'likes'>('recent');
  const [comments, setComments] = useState<TripComment[]>([]);
  const [newComment, setNewComment] = useState('');

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'featured' && trip.featured) ||
                         (filter === 'recent' && new Date(trip.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                         (filter === 'popular' && trip.stats.likes > 50);
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.stats.likes - a.stats.likes;
      case 'likes':
        return b.stats.views - a.stats.views;
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handleLike = useCallback(async (tripId: string) => {
    setTrips(prev => prev.map(trip => {
      if (trip.id === tripId) {
        return {
          ...trip,
          isLiked: !trip.isLiked,
          stats: {
            ...trip.stats,
            likes: trip.isLiked ? trip.stats.likes - 1 : trip.stats.likes + 1,
          }
        };
      }
      return trip;
    }));
  }, []);

  const handleSave = useCallback(async (tripId: string) => {
    setTrips(prev => prev.map(trip => {
      if (trip.id === tripId) {
        return {
          ...trip,
          isSaved: !trip.isSaved,
          stats: {
            ...trip.stats,
            saves: trip.isSaved ? trip.stats.saves - 1 : trip.stats.saves + 1,
          }
        };
      }
      return trip;
    }));
  }, []);

  const handleShare = useCallback(async (trip: PublicTrip) => {
    if (navigator.share) {
      await navigator.share({
        title: trip.title,
        text: trip.description,
        url: `${window.location.origin}/community/trip/${trip.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/community/trip/${trip.id}`);
    }
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'moderate': return 'bg-yellow-100 text-yellow-700';
      case 'challenging': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTravelStyleIcon = (style: string) => {
    switch (style) {
      case 'budget': return '💰';
      case 'mid-range': return '🏨';
      case 'luxury': return '✨';
      default: return '🎒';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Globe className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Trip Community</h2>
              <p className="text-sm text-gray-600">Discover and share amazing travel experiences</p>
            </div>
          </div>

          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
            Share Your Trip
          </button>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Trips', value: mockStats.totalTrips, icon: MapPin },
            { label: 'Travelers', value: mockStats.totalTravelers, icon: Users },
            { label: 'Destinations', value: mockStats.totalDestinations, icon: Globe },
            { label: 'This Week', value: mockStats.thisWeekTrips, icon: TrendingUp },
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                <IconComponent className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                <p className="text-lg font-semibold text-gray-900">{formatNumber(stat.value)}</p>
                <p className="text-xs text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search trips, destinations, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Trips</option>
              <option value="featured">Featured</option>
              <option value="recent">Recent</option>
              <option value="popular">Popular</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="recent">Recent</option>
              <option value="popular">Most Popular</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trip Grid */}
      <div className="p-6">
        {filteredTrips.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No trips found matching your criteria</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip, index) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedTrip(trip)}
              >
                {/* Trip Image */}
                <div className="relative h-48 bg-gray-200">
                  {trip.coverImage ? (
                    <img
                      src={trip.coverImage}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-blue-500">
                      <MapPin className="h-12 w-12 text-white" />
                    </div>
                  )}
                  
                  {trip.featured && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>Featured</span>
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave(trip.id);
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        trip.isSaved 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-white bg-opacity-80 text-gray-700 hover:bg-opacity-100'
                      }`}
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="absolute bottom-2 left-2 flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(trip.difficulty)}`}>
                      {trip.difficulty}
                    </span>
                    <span className="bg-white bg-opacity-80 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                      {getTravelStyleIcon(trip.travelStyle)} {trip.travelStyle}
                    </span>
                  </div>
                </div>

                {/* Trip Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{trip.title}</h3>
                  </div>

                  <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                    <MapPin className="h-3 w-3" />
                    <span>{trip.destination}</span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{trip.duration} days</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>{formatCurrency(trip.budget, trip.currency)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{trip.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {trip.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Author */}
                  <div className="flex items-center space-x-2 mb-3">
                    {trip.author.avatar ? (
                      <img
                        src={trip.author.avatar}
                        alt={trip.author.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-600" />
                      </div>
                    )}
                    <span className="text-sm text-gray-700">{trip.author.name}</span>
                    {trip.author.verified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{formatNumber(trip.stats.views)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{trip.stats.comments}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(trip.id);
                        }}
                        className={`flex items-center space-x-1 text-xs transition-colors ${
                          trip.isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                        }`}
                      >
                        <Heart className={`h-3 w-3 ${trip.isLiked ? 'fill-current' : ''}`} />
                        <span>{formatNumber(trip.stats.likes)}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(trip);
                        }}
                        className="text-gray-500 hover:text-purple-600 transition-colors"
                      >
                        <Share2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Trip Detail Modal */}
      <AnimatePresence>
        {selectedTrip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTrip(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedTrip.title}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedTrip.destination}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{selectedTrip.duration} days</span>
                      </div>
                      <span>{formatCurrency(selectedTrip.budget, selectedTrip.currency)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTrip(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* Trip Image */}
                  {selectedTrip.coverImage && (
                    <img
                      src={selectedTrip.coverImage}
                      alt={selectedTrip.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">About This Trip</h3>
                    <p className="text-gray-600">{selectedTrip.description}</p>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Trip Highlights</h3>
                    <ul className="space-y-1">
                      {selectedTrip.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-center space-x-2 text-gray-600">
                          <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleLike(selectedTrip.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        selectedTrip.isLiked
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${selectedTrip.isLiked ? 'fill-current' : ''}`} />
                      <span>{formatNumber(selectedTrip.stats.likes)} Likes</span>
                    </button>

                    <button
                      onClick={() => handleSave(selectedTrip.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        selectedTrip.isSaved
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Bookmark className={`h-4 w-4 ${selectedTrip.isSaved ? 'fill-current' : ''}`} />
                      <span>{selectedTrip.isSaved ? 'Saved' : 'Save Trip'}</span>
                    </button>

                    <button
                      onClick={() => handleShare(selectedTrip)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </button>

                    <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      <Copy className="h-4 w-4" />
                      <span>Use as Template</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}