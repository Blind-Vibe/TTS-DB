import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  ChevronRight, 
  Facebook, 
  Instagram, 
  Twitter, 
  Zap, 
  Plus, 
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Megaphone,
  Mail,
  Smartphone,
  Globe,
  MousePointer,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Pause,
  Settings,
  Download,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Sparkles,
  Filter,
  RefreshCw,
  MoreVertical,
  ExternalLink,
  Lightbulb,
  Rocket,
  Building,
  Camera,
  Video,
  Image as ImageIcon,
  FileText,
  Send,
  Star
} from 'lucide-react';
import { useAI } from '../contexts/AIContext';
import { useMarketing } from '../hooks/useMarketing';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import Breadcrumbs, { useBreadcrumbs } from '../components/navigation/Breadcrumbs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart as RechartsPieChart, 
  Cell,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar
} from 'recharts';

// Enhanced interfaces for marketing analytics
interface MarketingAnalytics {
  totalReach: number;
  engagementRate: number;
  conversionRate: number;
  roi: number;
  campaignCount: number;
  activeCount: number;
  totalSpend: number;
  revenue: number;
  clickThroughRate: number;
  impressions: number;
}

interface SocialMetrics {
  platform: string;
  followers: number;
  engagement: number;
  posts: number;
  reach: number;
  growth: number;
  color: string;
  icon: React.ReactNode;
}

interface ROIData {
  campaign: string;
  spend: number;
  revenue: number;
  roi: number;
  conversions: number;
}

interface CampaignCardProps {
  id: string;
  title: string;
  description: string;
  date: string;
  platforms: string[];
  status: 'active' | 'scheduled' | 'completed' | 'draft';
  performance?: {
    reach: number;
    engagement: number;
    clicks: number;
    conversions: number;
  };
  onClick: () => void;
}

// Enhanced Campaign Card Component
const CampaignCard: React.FC<CampaignCardProps> = ({ 
  id,
  title, 
  description, 
  date, 
  platforms, 
  status,
  performance,
  onClick
}) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return <Facebook className="h-3 w-3" />;
      case 'instagram': return <Instagram className="h-3 w-3" />;
      case 'twitter': return <Twitter className="h-3 w-3" />;
      case 'website': return <Globe className="h-3 w-3" />;
      default: return <Globe className="h-3 w-3" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return 'bg-blue-600';
      case 'instagram': return 'bg-pink-600';
      case 'twitter': return 'bg-blue-400';
      case 'website': return 'bg-amber-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700/50 hover:border-amber-500/30 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      {/* Background gradient animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getStatusColor(status)}`}>
            {status === 'active' && <Activity className="h-3 w-3 mr-1" />}
            {status === 'scheduled' && <Clock className="h-3 w-3 mr-1" />}
            {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
            {status === 'draft' && <AlertCircle className="h-3 w-3 mr-1" />}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-zinc-900 rounded-lg border border-zinc-700 shadow-xl z-10 min-w-[120px]">
                <button className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-800">
                  <Eye className="h-3 w-3 inline mr-2" />
                  View Details
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-800">
                  <Settings className="h-3 w-3 inline mr-2" />
                  Edit Campaign
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-800">
                  <BarChart3 className="h-3 w-3 inline mr-2" />
                  Analytics
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">{title}</h3>
        <p className="text-sm text-gray-300 mb-4 line-clamp-2">{description}</p>

        {/* Platforms */}
        <div className="flex items-center space-x-2 mb-4">
          {platforms.map((platform, index) => (
            <div 
              key={index} 
              className={`flex items-center justify-center rounded-full p-1.5 text-white ${getPlatformColor(platform)}`}
              title={platform}
            >
              {getPlatformIcon(platform)}
            </div>
          ))}
        </div>

        {/* Performance Metrics */}
        {performance && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Reach</span>
                <Users className="h-3 w-3 text-blue-500" />
              </div>
              <p className="text-sm font-semibold text-white">{performance.reach.toLocaleString()}</p>
            </div>
            
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Engagement</span>
                <Heart className="h-3 w-3 text-red-500" />
              </div>
              <p className="text-sm font-semibold text-white">{performance.engagement.toLocaleString()}</p>
        </div>
      </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-700/50">
        <div className="flex items-center text-xs text-gray-400">
            <Calendar className="h-3 w-3 mr-1" />
          <span>{date}</span>
        </div>
        <button 
          onClick={onClick}
            className="flex items-center text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors"
        >
          View Details
            <ChevronRight className="h-3 w-3 ml-1" />
        </button>
        </div>
      </div>
    </div>
  );
};

// Analytics Dashboard Component
const AnalyticsDashboard: React.FC<{ analytics: MarketingAnalytics }> = ({ analytics }) => {
  const chartData = [
    { name: 'Jan', reach: 12000, engagement: 2400, conversions: 180 },
    { name: 'Feb', reach: 19000, engagement: 3800, conversions: 290 },
    { name: 'Mar', reach: 25000, engagement: 4200, conversions: 340 },
    { name: 'Apr', reach: 28000, engagement: 4800, conversions: 420 },
    { name: 'May', reach: 32000, engagement: 5600, conversions: 500 },
    { name: 'Jun', reach: 35000, engagement: 6200, conversions: 580 }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Metric Cards */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Reach</p>
            <p className="text-2xl font-bold text-white">{analytics.totalReach.toLocaleString()}</p>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+12.5%</span>
            </div>
          </div>
          <div className="bg-blue-500/20 p-3 rounded-full">
            <Users className="h-6 w-6 text-blue-400" />
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Engagement Rate</p>
            <p className="text-2xl font-bold text-white">{analytics.engagementRate}%</p>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+3.2%</span>
            </div>
          </div>
          <div className="bg-pink-500/20 p-3 rounded-full">
            <Heart className="h-6 w-6 text-pink-400" />
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Conversion Rate</p>
            <p className="text-2xl font-bold text-white">{analytics.conversionRate}%</p>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+5.1%</span>
            </div>
          </div>
          <div className="bg-green-500/20 p-3 rounded-full">
            <Target className="h-6 w-6 text-green-400" />
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">ROI</p>
            <p className="text-2xl font-bold text-white">{analytics.roi}%</p>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+8.7%</span>
            </div>
          </div>
          <div className="bg-amber-500/20 p-3 rounded-full">
            <DollarSign className="h-6 w-6 text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Social Media Integration Component
const SocialMediaDashboard: React.FC<{ socialMetrics: SocialMetrics[] }> = ({ socialMetrics }) => {
  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Social Media Performance</h3>
        <button className="text-amber-500 hover:text-amber-400 text-sm font-medium">
          View All
          <ExternalLink className="h-3 w-3 inline ml-1" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {socialMetrics.map((metric, index) => (
          <div key={index} className="bg-zinc-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${metric.color}`}>
                  {metric.icon}
                </div>
                <span className="ml-2 text-sm font-medium text-white">{metric.platform}</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+{metric.growth}%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Followers</span>
                <span className="text-xs font-medium text-white">{metric.followers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Engagement</span>
                <span className="text-xs font-medium text-white">{metric.engagement}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Reach</span>
                <span className="text-xs font-medium text-white">{metric.reach.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ROI Tracking Component
const ROITracker: React.FC<{ roiData: ROIData[] }> = ({ roiData }) => {
  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Campaign ROI Tracking</h3>
        <button className="text-amber-500 hover:text-amber-400 text-sm font-medium">
          Export Report
          <Download className="h-3 w-3 inline ml-1" />
        </button>
      </div>
      
      <div className="space-y-4">
        {roiData.map((campaign, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white">{campaign.campaign}</h4>
              <div className="flex items-center space-x-4 mt-2">
                <div className="text-xs">
                  <span className="text-gray-400">Spend: </span>
                  <span className="text-white">${campaign.spend.toLocaleString()}</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-400">Revenue: </span>
                  <span className="text-white">${campaign.revenue.toLocaleString()}</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-400">Conversions: </span>
                  <span className="text-white">{campaign.conversions}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${campaign.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {campaign.roi > 0 ? '+' : ''}{campaign.roi}%
              </div>
              <div className="text-xs text-gray-400">ROI</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// AI Content Generator Enhanced
const AIContentCard: React.FC<{ 
  title: string;
  description: string;
  promptExample: string;
  icon: React.ReactNode;
}> = ({ title, description, promptExample, icon }) => {
  const { isProcessing, generateContent } = useAI();
  const [result, setResult] = useState('');
  
  const handleGenerate = async () => {
    try {
      const content = await generateContent(promptExample);
      setResult(content);
    } catch (error) {
      console.error('Error generating content:', error);
    }
  };
  
  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700/50 hover:border-amber-500/30 transition-all duration-300">
      <div className="flex items-center mb-4">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-full">
          {icon}
        </div>
        <h3 className="ml-3 text-lg font-semibold text-white">{title}</h3>
      </div>
      
      <p className="text-sm text-gray-300 mb-4">{description}</p>
      
      <div className="bg-zinc-800/50 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-400 italic">Example: "{promptExample}"</p>
      </div>
      
      <button 
        onClick={handleGenerate}
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-70"
      >
        {isProcessing ? 'Generating...' : 'Generate Content'}
      </button>
      
      {result && (
        <div className="mt-4 bg-zinc-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-amber-400">Generated Content:</p>
            <button className="text-xs text-gray-400 hover:text-white">
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <p className="text-sm text-white">{result}</p>
        </div>
      )}
    </div>
  );
};

const Marketing: React.FC = () => {
  const navigate = useNavigate();
  const { campaigns, isLoading } = useMarketing();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const breadcrumbs = useBreadcrumbs();
  
  // Mock analytics data
  const analytics: MarketingAnalytics = {
    totalReach: 127840,
    engagementRate: 4.2,
    conversionRate: 2.8,
    roi: 284,
    campaignCount: 12,
    activeCount: 4,
    totalSpend: 8500,
    revenue: 24160,
    clickThroughRate: 3.1,
    impressions: 456000
  };

  const socialMetrics: SocialMetrics[] = [
    {
      platform: 'Facebook',
      followers: 12500,
      engagement: 4.2,
      posts: 24,
      reach: 45000,
      growth: 8.3,
      color: 'bg-blue-600',
      icon: <Facebook className="h-4 w-4 text-white" />
    },
    {
      platform: 'Instagram',
      followers: 8900,
      engagement: 6.1,
      posts: 18,
      reach: 32000,
      growth: 12.1,
      color: 'bg-pink-600',
      icon: <Instagram className="h-4 w-4 text-white" />
    },
    {
      platform: 'Twitter',
      followers: 5600,
      engagement: 3.8,
      posts: 36,
      reach: 28000,
      growth: 5.7,
      color: 'bg-blue-400',
      icon: <Twitter className="h-4 w-4 text-white" />
    }
  ];

  const roiData: ROIData[] = [
    { campaign: 'Summer Festival Promo', spend: 2500, revenue: 8900, roi: 256, conversions: 89 },
    { campaign: 'Artist Spotlight Series', spend: 1800, revenue: 5200, roi: 189, conversions: 52 },
    { campaign: 'Holiday Concert Special', spend: 3200, revenue: 9800, roi: 206, conversions: 98 },
    { campaign: 'New Venue Launch', spend: 1000, revenue: 2800, roi: 180, conversions: 28 }
  ];
  
  // Enhanced filtering
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => 
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  }, [campaigns, searchTerm]);
  
  const activeCampaigns = filteredCampaigns.filter(campaign => 
    campaign.status === 'active' || campaign.status === 'scheduled'
  );

  // Generate mock performance data for campaigns
  const generateMockPerformance = () => ({
    reach: Math.floor(Math.random() * 10000) + 1000,
    engagement: Math.floor(Math.random() * 500) + 50,
    clicks: Math.floor(Math.random() * 200) + 20,
    conversions: Math.floor(Math.random() * 50) + 5
  });

  const handleCampaignClick = (id: string) => {
    navigate(`/marketing/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-zinc-900 to-black">
      <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbs} />

        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="font-playfair text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Marketing Hub
            </h1>
            <p className="text-gray-400 mt-1">
              Campaign analytics, social media integration, and ROI tracking
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-all ${
                showAnalytics 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </button>
            
        <button 
          onClick={() => navigate('/marketing/create')}
              className="flex items-center bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
        >
              <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </button>
      </div>
              </div>

        {/* Analytics Dashboard */}
        {showAnalytics && <AnalyticsDashboard analytics={analytics} />}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Management Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>

              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>

            {/* Active Campaigns */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Active Campaigns</h2>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="mr-3 h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                  <p className="text-xl text-white">Loading campaigns...</p>
            </div>
          ) : activeCampaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeCampaigns.map((campaign) => (
                <CampaignCard 
                  key={campaign.id}
                  id={campaign.id}
                  title={campaign.title} 
                  description={campaign.description || ''} 
                  date={campaign.date ? format(new Date(campaign.date), 'MMM d, yyyy') : 'No date set'}
                  platforms={campaign.platforms || []}
                  status={campaign.status as 'active' | 'scheduled' | 'completed' | 'draft'}
                      performance={generateMockPerformance()}
                  onClick={() => handleCampaignClick(campaign.id)}
                />
              ))}
            </div>
          ) : (
                <div className="text-center py-20">
                  <div className="rounded-full bg-zinc-800 p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Megaphone className="h-12 w-12 text-gray-500" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-2">No campaigns found</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    {searchTerm 
                      ? `No campaigns matching "${searchTerm}".`
                      : 'Create your first marketing campaign to get started!'
                    }
              </p>
              <button 
                onClick={() => navigate('/marketing/create')}
                    className="inline-flex items-center bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                    <Plus className="h-5 w-5 mr-2" />
                New Campaign
              </button>
            </div>
          )}
            </div>

            {/* ROI Tracking */}
            <ROITracker roiData={roiData} />
          </div>

          {/* Sidebar - AI Tools & Social */}
          <div className="space-y-6">
            {/* Social Media Dashboard */}
            <SocialMediaDashboard socialMetrics={socialMetrics} />
            
            {/* AI Content Generator */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">AI Content Generator</h2>
              
              <div className="space-y-4">
                <AIContentCard 
                  title="Social Posts"
                  description="Generate engaging social media content for all platforms."
                  promptExample="Create an Instagram post for our upcoming blues festival with hashtags"
                  icon={<Share2 className="h-4 w-4 text-white" />}
                />
                
                <AIContentCard 
                  title="Email Copy"
                  description="Draft compelling email marketing campaigns."
                  promptExample="Write an email announcement for our VIP event package"
                  icon={<Mail className="h-4 w-4 text-white" />}
                />
                
                <AIContentCard 
                  title="Ad Copy"
                  description="Create high-converting advertisement copy."
                  promptExample="Generate Facebook ad copy for our Saturday night show"
                  icon={<Target className="h-4 w-4 text-white" />}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <Camera className="h-4 w-4 text-amber-500 mr-3" />
                    <span className="text-white text-sm">Create Image Campaign</span>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <Video className="h-4 w-4 text-blue-500 mr-3" />
                    <span className="text-white text-sm">Video Promotion</span>
                </div>
                </button>
                
                <button className="w-full text-left p-3 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <Send className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-white text-sm">Email Blast</span>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 text-purple-500 mr-3" />
                    <span className="text-white text-sm">Analytics Report</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketing;