import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Plus, 
  BarChart3,
  FileText,
  AlertTriangle,
  ShoppingCart, 
  Trash2,
  Edit,
  MoreVertical,
  TrendingUp,
  AlertCircle,
  Package,
  Boxes,
  DollarSign,
  ScanLine,
  Eye,
  Edit3,
  RefreshCw,
  Filter,
  Tag
} from 'lucide-react';

import { 
  useInventoryItems, 
  useInventoryCategories, 
  useLowStockItems, 
  useInventoryTransactions,
  type InventoryItem,
  type InventoryCategory,
  type CreateInventoryItemRequest,
  type CreateInventoryCategoryRequest,
  type CreateInventoryTransactionRequest
} from '../hooks/useInventory';
import Breadcrumbs from '../components/navigation/Breadcrumbs';

// Import the actual modal components
import InventoryFormModal from '../components/inventory/InventoryFormModal';
import CategoryFormModal from '../components/inventory/CategoryFormModal';
import TransactionFormModal from '../components/inventory/TransactionFormModal';

// Interfaces for analytics
interface InventoryAnalytics {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalCategories: number;
  reorderPending: number;
  turnoverRate: number;
  warehouseUtilization: number;
}

// Component for individual inventory item cards
const InventoryItemCard: React.FC<{
  item: InventoryItem;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onQuickStock: () => void;
}> = ({ item, onView, onEdit, onDelete, onQuickStock }) => {
  const getStockStatus = (): string => {
    if (!item.currentStock || item.currentStock === 0) return 'out';
    if (item.currentStock <= item.minStockLevel) return 'low';
    if (item.currentStock >= item.maxStockLevel) return 'high';
    return 'normal';
  };

  const getStockStatusColor = (status: string): string => {
    switch (status) {
      case 'out': return 'text-red-600 bg-red-50 border-red-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-1">{item.name}</h3>
            <p className="text-sm text-gray-500">{item.sku}</p>
          </div>
          <div className="flex items-center space-x-1">
          <button 
              onClick={onView}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
              <Eye className="w-4 h-4" />
          </button>
          <button 
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
              <Edit3 className="w-4 h-4" />
          </button>
          <button 
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Current Stock</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStockStatusColor(stockStatus)}`}>
              {item.currentStock || 0} {item.unit || 'units'}
                  </span>
          </div>
          
          {item.costPrice && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Cost Price</span>
              <span className="text-sm font-medium text-gray-900">${item.costPrice}</span>
            </div>
          )}
          
          {item.sellPrice && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Sell Price</span>
              <span className="text-sm font-medium text-gray-900">${item.sellPrice}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Reorder Level</span>
            <span className="text-sm text-gray-600">{item.reorderPoint || 0}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <button
              onClick={onQuickStock}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Quick Stock Update
            </button>
            <span className="text-xs text-gray-400">
              Last updated: {new Date(item.updatedAt || '').toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics dashboard component
const InventoryAnalyticsDashboard: React.FC<{ 
  analytics: InventoryAnalytics; 
  items: InventoryItem[] 
}> = ({ analytics, items }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Overview</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.totalItems}</div>
            <div className="text-sm text-gray-500">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">${analytics.totalValue.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{analytics.lowStockItems}</div>
            <div className="text-sm text-gray-500">Low Stock</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{analytics.outOfStockItems}</div>
            <div className="text-sm text-gray-500">Out of Stock</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Stock Status Distribution</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Normal Stock</span>
                <span className="text-sm font-medium">
                  {items.filter((item: InventoryItem) => {
                    const stock = item.currentStock || 0;
                    return stock > item.minStockLevel && stock < item.maxStockLevel;
                  }).length}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h3>
            <div className="text-sm text-gray-600">
              <p>Turnover Rate: {analytics.turnoverRate}%</p>
              <p>Warehouse Utilization: {analytics.warehouseUtilization}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick actions component
const QuickActions: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="flex items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <Plus className="w-5 h-5 mr-2" />
            Add Item
          </button>
          <button className="flex items-center justify-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Stock In
          </button>
          <button className="flex items-center justify-center p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Low Stock
          </button>
          <button className="flex items-center justify-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
            <BarChart3 className="w-5 h-5 mr-2" />
            Reports
          </button>
        </div>
      </div>
    </div>
  );
};

// Table view component
const InventoryTable: React.FC<{
  items: InventoryItem[];
  onView: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onQuickStock: (item: InventoryItem) => void;
}> = ({ items, onView, onEdit, onDelete, onQuickStock }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item: InventoryItem) => {
              const getStockStatus = (): string => {
                if (!item.currentStock || item.currentStock === 0) return 'out';
                if (item.currentStock <= item.minStockLevel) return 'low';
                return 'normal';
              };

              const stockStatus = getStockStatus();
              
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.currentStock || 0} {item.unit || 'units'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.costPrice || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      stockStatus === 'out' ? 'bg-red-100 text-red-800' :
                      stockStatus === 'low' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {stockStatus === 'out' ? 'Out of Stock' :
                       stockStatus === 'low' ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onQuickStock(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onView(item)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main Inventory component
const Inventory: React.FC = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out' | 'normal' | 'overstock'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedCategory_, setSelectedCategory_] = useState<InventoryCategory | null>(null);

  const navigate = useNavigate();

  // Hooks with proper type handling
  const inventoryItemsResult = useInventoryItems();
  const inventoryCategoriesResult = useInventoryCategories();
  const lowStockResult = useLowStockItems();
  const inventoryTransactionsResult = useInventoryTransactions();

  // Extract data with proper type safety and fallbacks
  const items: InventoryItem[] = inventoryItemsResult.items || [];
  const categories: InventoryCategory[] = inventoryCategoriesResult.categories || [];
  const lowStockItems: InventoryItem[] = lowStockResult.data || [];
  
  const isLoadingItems: boolean = inventoryItemsResult.isLoading || false;
  const isLoadingCategories: boolean = inventoryCategoriesResult.isLoading || false;
  
  // Extract functions with proper null checks
  const createItem = inventoryItemsResult.createItem;
  const createCategory = inventoryCategoriesResult.createCategory;
  const createTransaction = inventoryTransactionsResult.createTransaction;

  // Breadcrumbs with proper typing
  const breadcrumbs = [
    { label: 'Dashboard', path: '/' },
    { label: 'Inventory', path: '/inventory' }
  ];

  // Filter items based on search and filters
  const filteredItems: InventoryItem[] = useMemo(() => {
    if (!Array.isArray(items)) return [];
    
    return items.filter((item: InventoryItem) => {
      // Search filter
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.sku.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Category filter
      if (selectedCategory && item.categoryId !== selectedCategory) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        const stock = item.currentStock || 0;
        switch (filterStatus) {
          case 'low':
            return stock <= item.minStockLevel && stock > 0;
          case 'out':
            return stock === 0;
          case 'normal':
            return stock > item.minStockLevel && stock < item.maxStockLevel;
          case 'overstock':
            return stock >= item.maxStockLevel;
          default:
            return true;
        }
      }

      return true;
    });
  }, [items, searchTerm, selectedCategory, filterStatus]);

  // Calculate analytics with proper type safety
  const analytics: InventoryAnalytics = useMemo(() => {
    const itemsArray: InventoryItem[] = Array.isArray(items) ? items : [];
    const categoriesArray: InventoryCategory[] = Array.isArray(categories) ? categories : [];
    
    const totalItems = itemsArray.length;
    const totalValue = itemsArray.reduce((sum: number, item: InventoryItem) => {
      return sum + (item.costPrice || 0) * (item.currentStock || 0);
    }, 0);
    const lowStockItemsCount = itemsArray.filter((item: InventoryItem) => 
      (item.currentStock || 0) <= item.minStockLevel && (item.currentStock || 0) > 0
    ).length;
    const outOfStockItems = itemsArray.filter((item: InventoryItem) => 
      (item.currentStock || 0) === 0
    ).length;
    const totalCategories = categoriesArray.length;

    return {
      totalItems,
      totalValue,
      lowStockItems: lowStockItemsCount,
      outOfStockItems,
      totalCategories,
      reorderPending: lowStockItemsCount,
      turnoverRate: 75, // Mock data
      warehouseUtilization: 82 // Mock data
    };
  }, [items, categories]);

  // Handlers with proper type annotations
  const handleAddItem = async (itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
    try {
      if (createItem) {
        const createRequest: CreateInventoryItemRequest = {
          name: itemData.name,
          sku: itemData.sku || 'AUTO-' + Date.now(),
          description: itemData.description || undefined,
          categoryId: itemData.category_id || '',
          unit: 'piece',
          currentStock: itemData.current_stock || 0,
          minStockLevel: itemData.minStockLevel || 10,
          maxStockLevel: itemData.maxStockLevel || 100,
          reorderPoint: itemData.reorder_level || 10,
          reorderQuantity: 50,
          costPrice: itemData.cost_price || 0,
          sellPrice: itemData.unit_price || undefined,
          supplier: itemData.vendor || undefined,
          location: undefined,
          tags: [],
          isActive: itemData.is_active !== false,
          trackStock: true,
          allowNegativeStock: false
        };
        await createItem(createRequest);
        setIsItemModalOpen(false);
        setSelectedItem(null);
        toast.success('Item added successfully!');
      } else {
        toast.error('Add item function not available');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Error adding item');
    }
  };

  const handleAddCategory = async (categoryData: CreateInventoryCategoryRequest): Promise<void> => {
    try {
      if (createCategory) {
        await createCategory(categoryData);
        setIsCategoryModalOpen(false);
        toast.success('Category added successfully!');
      } else {
        toast.error('Add category function not available');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Error adding category');
    }
  };

  const handleEditItem = (item: InventoryItem): void => {
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = async (item: InventoryItem): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        // Implementation would go here
        console.log('Deleting item:', item.id);
        toast.success('Item deleted successfully!');
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Error deleting item');
      }
    }
  };

  const handleViewItem = (item: InventoryItem): void => {
    navigate(`/inventory/${item.id}`);
  };

  const handleQuickStock = (item: InventoryItem): void => {
    setSelectedItem(item);
    setIsTransactionModalOpen(true);
  };

  const handleAddTransaction = async (transactionData: CreateInventoryTransactionRequest): Promise<void> => {
    try {
      if (createTransaction) {
        await createTransaction(transactionData);
        setIsTransactionModalOpen(false);
        toast.success('Transaction recorded successfully!');
      } else {
        toast.error('Add transaction function not available');
      }
    } catch (error) {
      console.error('Error recording transaction:', error);
      toast.error('Error recording transaction');
    }
  };

  // Loading state
  if (isLoadingItems || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your venue's inventory, track stock levels, and monitor supplies
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
            <Tag className="w-4 h-4 mr-2" />
              Add Category
            </button>
            <button
              onClick={() => setIsItemModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
            <Plus className="w-4 h-4 mr-2" />
              Add Item
            </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <InventoryAnalyticsDashboard analytics={analytics} items={items} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items or SKU..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={selectedCategory || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value || null)}
                className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Categories</option>
                {Array.isArray(categories) && categories.map((category: InventoryCategory) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value as 'all' | 'low' | 'out' | 'normal' | 'overstock')}
                className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="normal">Normal</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
                <option value="overstock">Overstock</option>
              </select>

              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 text-blue-700 border-r border-gray-300'
                      : 'text-gray-500 hover:text-gray-700 border-r border-gray-300'
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === 'table'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredItems.length}</span> of{' '}
              <span className="font-medium">{Array.isArray(items) ? items.length : 0}</span> items
            </p>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item: InventoryItem) => (
                <InventoryItemCard
                  key={item.id}
                  item={item}
                  onView={() => handleViewItem(item)}
                  onEdit={() => handleEditItem(item)}
                  onDelete={() => handleDeleteItem(item)}
                  onQuickStock={() => handleQuickStock(item)}
                />
              ))}
            </div>
          ) : (
            <InventoryTable
              items={filteredItems}
              onView={handleViewItem}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onQuickStock={handleQuickStock}
            />
          )}

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first inventory item'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    onClick={() => setIsItemModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
        <InventoryFormModal
          isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setSelectedItem(null);
        }}
          onSave={handleAddItem}
        initialItem={selectedItem}
          categories={categories}
        isSubmitting={false}
        />
      
        <CategoryFormModal
          isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategory_(null);
        }}
          onSave={handleAddCategory}
        initialCategory={selectedCategory_}
        isSubmitting={false}
        />
      
        <TransactionFormModal
          isOpen={isTransactionModalOpen}
        onClose={() => {
            setIsTransactionModalOpen(false);
          setSelectedItem(null);
          }}
        onSave={handleAddTransaction}
          inventoryItems={items}
        itemId={selectedItem?.id}
          isSubmitting={false}
        />
    </div>
  );
};

export default Inventory;