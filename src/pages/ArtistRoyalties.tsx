import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  DollarSign, 
  User, 
  Download, 
  Search,
  Plus,
  Edit,
  Eye,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Breadcrumbs, { useBreadcrumbs } from '../components/navigation/Breadcrumbs';
import { useRoyaltyReports, useArtistContracts, useArtistPayments } from '../hooks/useArtistContracts';
import { useArtists } from '../hooks/useArtists';
import { artistContractsApi } from '../lib/supabase';

interface Artist {
  id: string;
  name: string;
  email: string;
  phone?: string;
  contractType: 'percentage' | 'flat_rate' | 'hourly';
  contractRate: number; // percentage or amount
  image?: string;
}

interface RoyaltyPayment {
  id: string;
  artistId: string;
  artistName: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  grossRevenue: number;
  artistShare: number;
  contractRate: number;
  contractType: string;
  status: 'pending' | 'paid' | 'processing';
  paymentDate?: string;
  notes?: string;
  createdAt: string;
}

interface RoyaltyReport {
  period: string;
  totalGrossRevenue: number;
  totalArtistPayments: number;
  venueRetention: number;
  paymentsPending: number;
  paymentsProcessed: number;
  paymentsPaid: number;
}

const ArtistRoyalties: React.FC = () => {
  const breadcrumbs = useBreadcrumbs();

  const { artists: artistList, isLoading: isArtistsLoading } = useArtists();
  const { payments: paymentList, isLoading: isPaymentsLoading } = useArtistPayments();
  const { reports, isLoading: isReportsLoading } = useRoyaltyReports();
  const report = reports[0] || null;

  const [artists, setArtists] = useState<Artist[]>([]);
  const [payments, setPayments] = useState<RoyaltyPayment[]>([]);

  useEffect(() => {
    setArtists(artistList);
  }, [artistList]);

  useEffect(() => {
    setPayments(paymentList);
  }, [paymentList]);

  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<RoyaltyPayment | null>(null);

  const isLoading = isArtistsLoading || isPaymentsLoading || isReportsLoading;

  const filteredPayments = payments.filter(payment => {
    const matchesArtist = selectedArtist === '' || payment.artistId === selectedArtist;
    const matchesStatus = selectedStatus === '' || payment.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      payment.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.eventTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesArtist && matchesStatus && matchesSearch;
  });

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      await artistContractsApi.updateArtistPayment(paymentId, {
        status: 'paid',
        paymentDate: new Date().toISOString()
      });
      setPayments(prev => prev.map(payment =>
        payment.id === paymentId
          ? { ...payment, status: 'paid', paymentDate: new Date().toISOString() }
          : payment
      ));
      toast.success('Payment marked as paid');
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const handleGenerateReport = () => {
    // Generate and download royalty report
    toast.success('Royalty report generated successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-400">Loading royalty data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <DollarSign className="h-8 w-8 mr-3 text-green-400" />
            Artist Royalties
          </h1>
          <p className="text-gray-400 mt-1">Manage artist payments and revenue sharing</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateReport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
          
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(report.totalGrossRevenue)}</p>
              </div>
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">{report.period}</p>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Artist Payments</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(report.totalArtistPayments)}</p>
              </div>
              <div className="p-3 bg-green-600/20 rounded-lg">
                <User className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {((report.totalArtistPayments / report.totalGrossRevenue) * 100).toFixed(1)}% of revenue
            </p>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Venue Retention</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(report.venueRetention)}</p>
              </div>
              <div className="p-3 bg-amber-600/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {((report.venueRetention / report.totalGrossRevenue) * 100).toFixed(1)}% of revenue
            </p>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Payments</p>
                <p className="text-2xl font-bold text-white">{report.paymentsPending}</p>
              </div>
              <div className="p-3 bg-red-600/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">Require attention</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search payments..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Artist
            </label>
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Artists</option>
              {artists.map(artist => (
                <option key={artist.id} value={artist.id}>{artist.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="current_year">Current Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 overflow-hidden">
        <div className="p-6 border-b border-zinc-700/50">
          <h2 className="text-xl font-semibold text-white">Payment History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-700/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Artist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Event Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Artist Share
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-zinc-700/20">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{payment.artistName}</p>
                        <p className="text-gray-400 text-sm">
                          {payment.contractType === 'percentage' 
                            ? `${payment.contractRate}%` 
                            : formatCurrency(payment.contractRate)}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{payment.eventTitle}</p>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-gray-300">{formatDate(payment.eventDate)}</p>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-white font-medium">{formatCurrency(payment.grossRevenue)}</p>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-green-400 font-semibold">{formatCurrency(payment.artistShare)}</p>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1">{payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</span>
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => handleMarkAsPaid(payment.id)}
                          className="p-2 text-green-400 hover:text-green-300 transition-colors"
                          title="Mark as Paid"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowPaymentModal(true);
                        }}
                        className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
                        title="Edit Payment"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No payments found for the selected criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-800 rounded-xl p-6 max-w-lg w-full border border-zinc-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-white">Payment Details</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayment(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Artist</label>
                  <p className="text-white">{selectedPayment.artistName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Event</label>
                  <p className="text-white">{selectedPayment.eventTitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Event Date</label>
                  <p className="text-white">{formatDate(selectedPayment.eventDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusIcon(selectedPayment.status)}
                    <span className="ml-1">{selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Gross Revenue</label>
                  <p className="text-white font-semibold">{formatCurrency(selectedPayment.grossRevenue)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Contract Rate</label>
                  <p className="text-white">
                    {selectedPayment.contractType === 'percentage' 
                      ? `${selectedPayment.contractRate}%` 
                      : formatCurrency(selectedPayment.contractRate)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Artist Share</label>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(selectedPayment.artistShare)}</p>
              </div>

              {selectedPayment.paymentDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Payment Date</label>
                  <p className="text-white">{formatDate(selectedPayment.paymentDate)}</p>
                </div>
              )}

              {selectedPayment.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
                  <p className="text-gray-300">{selectedPayment.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayment(null);
                }}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
              
              {selectedPayment.status === 'pending' && (
                <button
                  onClick={() => {
                    handleMarkAsPaid(selectedPayment.id);
                    setShowPaymentModal(false);
                    setSelectedPayment(null);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Mark as Paid
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistRoyalties; 