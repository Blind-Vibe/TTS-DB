import React, { useState, useEffect, useMemo } from 'react';
import { 
  File, 
  Folder, 
  Upload, 
  Download, 
  Share2, 
  Trash2, 
  Edit, 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  Grid,
  List,
  Eye,
  Clock,
  Users,
  MessageSquare,
  Tag,
  Archive,
  Star,
  Copy,
  Move,
  Lock,
  Unlock,
  History,
  GitBranch,
  FileText,
  Image,
  Video,
  Music,
  Paperclip,
  BarChart3,
  TrendingUp,
  Calendar,
  Activity,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Settings,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  RefreshCw
} from 'lucide-react';
import Breadcrumbs, { useBreadcrumbs } from '../components/navigation/Breadcrumbs';
import { Document } from '../types';
import { useDocuments } from '../hooks/useDocuments';
import { useAnalyticsMetrics, useRecentActivity } from '../hooks/useAnalytics';
import { toast } from 'react-hot-toast';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Enhanced interfaces for document management features
interface DocumentVersion {
  id: string;
  documentId: string;
  version: string;
  content: string | null;
  createdBy: string;
  createdAt: string;
  comment: string;
  size: number;
}

interface DocumentComment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
  resolved: boolean;
}

interface DocumentShare {
  id: string;
  documentId: string;
  sharedWith: string;
  permission: 'view' | 'edit' | 'admin';
  sharedBy: string;
  expiresAt?: string;
  createdAt: string;
}

interface DocumentFolder {
  id: string;
  name: string;
  parentId: string | null;
  description?: string;
  color: string;
  createdAt: string;
  documentCount: number;
}

interface DocumentAnalytics {
  totalDocuments: number;
  totalSize: string;
  recentUploads: number;
  activeShares: number;
  totalViews: number;
  totalDownloads: number;
  storageUsed: number;
  storageLimit: number;
}

interface DocumentActivity {
  id: string;
  type: 'created' | 'edited' | 'shared' | 'downloaded' | 'viewed' | 'commented';
  documentId: string;
  documentName: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: any;
}

// Enhanced Document Card Component
const EnhancedDocumentCard: React.FC<{
  document: Document & { 
    versions?: DocumentVersion[]; 
    comments?: DocumentComment[]; 
    shares?: DocumentShare[];
    lastActivity?: string;
  };
  onOpen: (document: Document) => void;
  onShare: (document: Document) => void;
  onComment: (document: Document) => void;
  onVersion: (document: Document) => void;
  onMove: (document: Document) => void;
  onStar: (document: Document) => void;
  onDelete: (document: Document) => void;
  viewMode: 'grid' | 'list';
  isSelected?: boolean;
  onSelect?: (document: Document) => void;
}> = ({ 
  document, 
  onOpen, 
  onShare, 
  onComment, 
  onVersion, 
  onMove, 
  onStar, 
  onDelete, 
  viewMode,
  isSelected,
  onSelect
}) => {
  const [showActions, setShowActions] = useState(false);

  const getFileIcon = () => {
    const fileType = document.fileType?.toLowerCase() || '';
    if (fileType.includes('pdf')) return <FileText className="h-6 w-6 text-red-400" />;
    if (fileType.includes('doc') || fileType.includes('docx')) return <FileText className="h-6 w-6 text-blue-400" />;
    if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg') || fileType.includes('jpeg')) return <Image className="h-6 w-6 text-green-400" />;
    if (fileType.includes('video') || fileType.includes('mp4') || fileType.includes('mov')) return <Video className="h-6 w-6 text-purple-400" />;
    if (fileType.includes('audio') || fileType.includes('mp3') || fileType.includes('wav')) return <Music className="h-6 w-6 text-yellow-400" />;
    return <File className="h-6 w-6 text-gray-400" />;
  };

  const formatFileSize = (size: number | null) => {
    if (!size) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let index = 0;
    let fileSize = size;
    while (fileSize >= 1024 && index < units.length - 1) {
      fileSize /= 1024;
      index++;
    }
    return `${fileSize.toFixed(1)} ${units[index]}`;
  };

  const getStatusColor = (isTemplate: boolean) => {
    return isTemplate ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400';
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (viewMode === 'list') {
  return (
      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 backdrop-blur-sm border transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
        isSelected ? 'border-amber-500/50 shadow-amber-500/20' : 'border-zinc-700/50'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
        <div className="relative p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelect?.(document)}
                  className="w-4 h-4 text-amber-500 bg-zinc-700 border-zinc-600 rounded focus:ring-amber-500/20"
                />
        {getFileIcon()}
              </div>
        <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-medium text-white truncate cursor-pointer hover:text-amber-400 transition-colors" onClick={() => onOpen(document)}>
            {document.name}
          </h3>
                  {document.isTemplate && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.isTemplate)}`}>
                      Template
                    </span>
                  )}
                  <Star className={`h-4 w-4 cursor-pointer transition-colors ${true ? 'text-amber-400 fill-current' : 'text-gray-400 hover:text-amber-400'}`} onClick={() => onStar(document)} />
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>{timeAgo(document.updatedAt)}</span>
                  <span>{document.createdBy || 'Unknown'}</span>
                  {document.versions && document.versions.length > 1 && (
                    <span className="flex items-center">
                      <GitBranch className="h-3 w-3 mr-1" />
                      v{document.versions.length}
                    </span>
                  )}
                  {document.comments && document.comments.length > 0 && (
                    <span className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {document.comments.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={() => onShare(document)} className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-zinc-700/50 rounded-lg transition-all">
                <Share2 className="h-4 w-4" />
              </button>
              <button onClick={() => onComment(document)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-zinc-700/50 rounded-lg transition-all">
                <MessageSquare className="h-4 w-4" />
              </button>
              <button onClick={() => onVersion(document)} className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-zinc-700/50 rounded-lg transition-all">
                <History className="h-4 w-4" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowActions(!showActions)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-all"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {showActions && (
                  <div className="absolute right-0 top-8 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-10">
                    <button onClick={() => onMove(document)} className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-zinc-700 hover:text-white">Move</button>
                    <button onClick={() => onDelete(document)} className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-700">Delete</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${
      isSelected ? 'border-amber-500/50 shadow-amber-500/20' : 'border-zinc-700/50'
    }`} onClick={() => onOpen(document)}>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getFileIcon()}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-white truncate">{document.name}</h3>
              <p className="text-xs text-gray-400 truncate">{document.description || 'No description'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Star className={`h-4 w-4 cursor-pointer transition-colors ${true ? 'text-amber-400 fill-current' : 'text-gray-400 hover:text-amber-400'}`} onClick={(e) => { e.stopPropagation(); onStar(document); }} />
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => { e.stopPropagation(); onSelect?.(document); }}
              className="w-4 h-4 text-amber-500 bg-zinc-700 border-zinc-600 rounded focus:ring-amber-500/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.isTemplate)}`}>
            {document.isTemplate ? 'Template' : 'Document'}
          </span>
          <span className="text-xs text-gray-400">{formatFileSize(document.fileSize)}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
          <span>{timeAgo(document.updatedAt)}</span>
          <span>{document.createdBy || 'Unknown'}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {document.versions && document.versions.length > 1 && (
              <span className="flex items-center text-xs text-gray-400">
                <GitBranch className="h-3 w-3 mr-1" />
                v{document.versions.length}
              </span>
            )}
            {document.comments && document.comments.length > 0 && (
              <span className="flex items-center text-xs text-gray-400">
                <MessageSquare className="h-3 w-3 mr-1" />
                {document.comments.length}
              </span>
            )}
      </div>
          <div className="flex items-center space-x-1">
            <button onClick={(e) => { e.stopPropagation(); onShare(document); }} className="p-1 text-gray-400 hover:text-amber-400 transition-colors">
              <Share2 className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onComment(document); }} className="p-1 text-gray-400 hover:text-blue-400 transition-colors">
              <MessageSquare className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onVersion(document); }} className="p-1 text-gray-400 hover:text-green-400 transition-colors">
              <History className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics Dashboard Component
const DocumentAnalyticsDashboard: React.FC<{ analytics: DocumentAnalytics; activities: DocumentActivity[] }> = ({ analytics, activities }) => {
  const chartData = useMemo(() => [
    { name: 'Mon', uploads: 12, downloads: 45, views: 78 },
    { name: 'Tue', uploads: 8, downloads: 32, views: 56 },
    { name: 'Wed', uploads: 15, downloads: 67, views: 89 },
    { name: 'Thu', uploads: 22, downloads: 54, views: 95 },
    { name: 'Fri', uploads: 18, downloads: 78, views: 123 },
    { name: 'Sat', uploads: 6, downloads: 23, views: 34 },
    { name: 'Sun', uploads: 4, downloads: 18, views: 28 },
  ], []);

  const storageData = useMemo(() => [
    { name: 'Used', value: analytics.storageUsed, color: '#f59e0b' },
    { name: 'Available', value: analytics.storageLimit - analytics.storageUsed, color: '#374151' },
  ], [analytics]);

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4 backdrop-blur-sm border border-zinc-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <File className="h-5 w-5 text-blue-400" />
              <span className="px-2 py-1 rounded-lg text-xs font-medium text-blue-400 bg-blue-400/20">
                {analytics.totalDocuments}
              </span>
            </div>
            <p className="text-sm text-gray-400">Total Documents</p>
            <p className="text-lg font-semibold text-white mt-1">{analytics.totalDocuments} files</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4 backdrop-blur-sm border border-zinc-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Archive className="h-5 w-5 text-green-400" />
              <span className="px-2 py-1 rounded-lg text-xs font-medium text-green-400 bg-green-400/20">
                {analytics.totalSize}
              </span>
            </div>
            <p className="text-sm text-gray-400">Storage Used</p>
            <p className="text-lg font-semibold text-white mt-1">{analytics.totalSize}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4 backdrop-blur-sm border border-zinc-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Share2 className="h-5 w-5 text-amber-400" />
              <span className="px-2 py-1 rounded-lg text-xs font-medium text-amber-400 bg-amber-400/20">
                {analytics.activeShares}
              </span>
            </div>
            <p className="text-sm text-gray-400">Active Shares</p>
            <p className="text-lg font-semibold text-white mt-1">{analytics.activeShares} shared</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4 backdrop-blur-sm border border-zinc-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-purple-400" />
              <span className="px-2 py-1 rounded-lg text-xs font-medium text-purple-400 bg-purple-400/20">
                {analytics.totalViews}
              </span>
            </div>
            <p className="text-sm text-gray-400">Total Views</p>
            <p className="text-lg font-semibold text-white mt-1">{analytics.totalViews} views</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border border-zinc-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
          <div className="relative">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-blue-400" />
              Document Activity
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Area type="monotone" dataKey="uploads" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="downloads" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="views" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border border-zinc-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
          <div className="relative">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Archive className="mr-2 h-5 w-5 text-amber-400" />
              Storage Usage
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={storageData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {storageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 backdrop-blur-sm border border-zinc-700/50">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
        <div className="relative p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-purple-400" />
            Recent Activity
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-zinc-800/30">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  activity.type === 'created' ? 'bg-green-500/20 text-green-400' :
                  activity.type === 'edited' ? 'bg-blue-500/20 text-blue-400' :
                  activity.type === 'shared' ? 'bg-amber-500/20 text-amber-400' :
                  activity.type === 'downloaded' ? 'bg-purple-500/20 text-purple-400' :
                  activity.type === 'viewed' ? 'bg-gray-500/20 text-gray-400' :
                  'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {activity.type === 'created' && <Plus size={14} />}
                  {activity.type === 'edited' && <Edit size={14} />}
                  {activity.type === 'shared' && <Share2 size={14} />}
                  {activity.type === 'downloaded' && <Download size={14} />}
                  {activity.type === 'viewed' && <Eye size={14} />}
                  {activity.type === 'commented' && <MessageSquare size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">
                      {activity.userName} {activity.type} {activity.documentName}
                    </p>
                    <span className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 capitalize">{activity.type} action</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Documents: React.FC = () => {
  const breadcrumbs = useBreadcrumbs();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { documents, isLoading } = useDocuments();

  const { metrics: analyticsMetrics } = useAnalyticsMetrics('documents');
  const { data: recentActivities } = useRecentActivity(5);

  const analytics: DocumentAnalytics = useMemo(() => ({
    totalDocuments: documents.length,
    totalSize: analyticsMetrics.find(m => m.metricName === 'storage_used')?.value + ' MB' || '0 MB',
    recentUploads: analyticsMetrics.find(m => m.metricName === 'recent_uploads')?.value || 0,
    activeShares: analyticsMetrics.find(m => m.metricName === 'active_shares')?.value || 0,
    totalViews: analyticsMetrics.find(m => m.metricName === 'views')?.value || 0,
    totalDownloads: analyticsMetrics.find(m => m.metricName === 'downloads')?.value || 0,
    storageUsed: analyticsMetrics.find(m => m.metricName === 'storage_used')?.value || 0,
    storageLimit: analyticsMetrics.find(m => m.metricName === 'storage_limit')?.value || 0,
  }), [analyticsMetrics, documents.length]);

  // Filtered and sorted documents
  const filteredDocuments = useMemo(() => {
    const filtered = documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' ||
                             (selectedCategory === 'templates' && doc.isTemplate) ||
                             (selectedCategory === 'documents' && !doc.isTemplate) ||
                             doc.tags.includes(selectedCategory);
      
      return matchesSearch && matchesCategory;
  });

  // Sort documents
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.fileSize || 0;
          bValue = b.fileSize || 0;
          break;
        case 'type':
          aValue = a.fileType || '';
          bValue = b.fileType || '';
          break;
        default: // date
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [documents, searchTerm, selectedCategory, sortBy, sortOrder]);

  // Event handlers
  const handleSelectDocument = (document: Document) => {
    setSelectedDocuments(prev => {
      if (prev.includes(document.id)) {
        return prev.filter(id => id !== document.id);
    } else {
        return [...prev, document.id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    }
  };

  const handleBulkAction = (action: 'delete' | 'move' | 'share' | 'download') => {
    const count = selectedDocuments.length;
    switch (action) {
      case 'delete':
        toast.success(`${count} documents moved to trash`);
        break;
      case 'move':
        toast.success(`${count} documents moved to folder`);
        break;
      case 'share':
        toast.success(`${count} documents shared`);
        break;
      case 'download':
        toast.success(`${count} documents downloaded`);
        break;
    }
    setSelectedDocuments([]);
  };

  const handleOpenDocument = (document: Document) => {
    toast.success(`Opening ${document.name}`);
  };

  const handleShareDocument = (document: Document) => {
    toast.success(`Sharing ${document.name}`);
  };

  const handleCommentDocument = (document: Document) => {
    toast.success(`Adding comment to ${document.name}`);
  };

  const handleVersionDocument = (document: Document) => {
    toast.success(`Viewing versions of ${document.name}`);
  };

  const handleMoveDocument = (document: Document) => {
    toast.success(`Moving ${document.name}`);
  };

  const handleStarDocument = (document: Document) => {
    toast.success(`Starred ${document.name}`);
  };

  const handleDeleteDocument = (document: Document) => {
    toast.success(`Deleted ${document.name}`);
  };

  const handleUploadDocument = () => {
    toast.success('Document upload modal would open');
  };

  const handleCreateFolder = () => {
    toast.success('Create folder modal would open');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-bold tracking-tight text-white">Documents</h1>
          <p className="text-gray-400 mt-1">Manage your documents with version control and collaboration</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => {
              setSelectedDocuments([]);
              setCurrentFolder(null);
            }}
            className="inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none"
          >
            <FileText size={12} className="mr-1 sm:mr-2" />
            <span className="hidden xs:inline">New Template</span>
            <span className="xs:hidden">Template</span>
          </button>
          <button 
            onClick={() => {
              setSelectedDocuments([]);
              setCurrentFolder(null);
            }}
            className="inline-flex items-center rounded-lg bg-zinc-800 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-zinc-700 focus:outline-none"
          >
            <Plus size={12} className="mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Upload Document</span>
            <span className="xs:hidden">Upload</span>
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col space-y-3 sm:space-y-4">
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-4 items-start xs:items-center">
          <div className="relative w-full xs:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={12} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border-0 bg-zinc-800 py-2 pl-8 sm:pl-10 pr-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium ${
                viewMode === 'list' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              <List size={12} className="mr-1 sm:mr-2" />
              <span>List View</span>
            </button>
              <button
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium ${
                viewMode === 'grid' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              <Grid size={12} className="mr-1 sm:mr-2" />
              <span>Grid View</span>
              </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex gap-1 sm:gap-2">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'all' 
                ? 'bg-amber-600 text-white' 
                : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
              }`}
            >
              All Types
            </button>
            
            {/* Add document types here */}
          </div>
        </div>
      </div>

      {/* Document grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-full rounded-lg bg-zinc-900 p-4 sm:p-8 text-center">
            <h3 className="text-xl font-semibold text-white">No documents found</h3>
            <p className="mt-2 text-gray-400">
              {searchTerm 
                ? `No documents matching "${searchTerm}"` 
                : selectedCategory 
                  ? `No ${selectedCategory} documents found` 
                    : 'Upload your first document to get started!'
              }
            </p>
            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
              <button 
                onClick={() => {
                  setSelectedDocuments([]);
                  setCurrentFolder(null);
                }}
                className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                <FileText size={14} className="mr-2" />
                Create Template
              </button>
              <button 
                onClick={() => {
                  setSelectedDocuments([]);
                  setCurrentFolder(null);
                }}
                className="inline-flex items-center justify-center rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
              >
                <Plus size={14} className="mr-2" />
                Upload Document
              </button>
            </div>
          </div>
        ) : (
          filteredDocuments.map((document) => (
            <EnhancedDocumentCard 
              key={document.id}
              document={document}
              onOpen={handleOpenDocument}
              onShare={handleShareDocument}
              onComment={handleCommentDocument}
              onVersion={handleVersionDocument}
              onMove={handleMoveDocument}
              onStar={handleStarDocument}
              onDelete={handleDeleteDocument}
              viewMode={viewMode}
              isSelected={selectedDocuments.includes(document.id)}
              onSelect={(doc) => {
                if (selectedDocuments.includes(doc.id)) {
                  setSelectedDocuments(selectedDocuments.filter((id) => id !== doc.id));
                } else {
                  setSelectedDocuments([...selectedDocuments, doc.id]);
                }
              }}
            />
          ))
        )}
      </div>

      {/* Document Analytics Dashboard */}
      {showAnalytics && (
        <DocumentAnalyticsDashboard analytics={analytics} activities={recentActivities || []} />
      )}
    </div>
  );
};

export default Documents;