import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Header from '../components/navigation/Header';
import AIAssistant from '../components/ai/AIAssistant';
import { useAuth } from '../contexts/AuthContext';
import { Loader, Wifi, WifiOff, X, Brain } from 'lucide-react';

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-full bg-zinc-800">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-zinc-600 border-t-amber-500 animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse"></div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-medium">Loading Train Station Dashboard</p>
        <p className="text-gray-400 text-sm">Preparing your venue management tools...</p>
      </div>
    </div>
  </div>
);

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-zinc-900">
          <div className="text-center p-8 max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-white text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-4">
              We're sorry, but something unexpected happened. Please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Network status hook
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateNetworkStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  return isOnline;
};

// Breadcrumb component
interface Breadcrumb {
  label: string;
  path?: string;
}

const getBreadcrumbs = (pathname: string): Breadcrumb[] => {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [{ label: 'Dashboard', path: '/' }];
  
  const pathMap: Record<string, string> = {
    'artists': 'Artists',
    'ticketing': 'Ticketing', 
    'finances': 'Finances',
    'marketing': 'Marketing',
    'projects': 'Projects',
    'crm': 'CRM',
    'inventory': 'Inventory',
    'staff': 'Staff',
    'settings': 'Settings',
    'system': 'System Settings',
    'documents': 'Documents'
  };
  
  paths.forEach((path, index) => {
    if (pathMap[path]) {
      breadcrumbs.push({
        label: pathMap[path],
        path: index === paths.length - 1 ? undefined : `/${paths.slice(0, index + 1).join('/')}`
      });
    }
  });
  
  return breadcrumbs;
};

const Breadcrumbs: React.FC<{ breadcrumbs: Breadcrumb[] }> = ({ breadcrumbs }) => (
  <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
    {breadcrumbs.map((crumb, index) => (
      <React.Fragment key={index}>
        {index > 0 && <span className="text-gray-600">/</span>}
        {crumb.path ? (
          <a 
            href={crumb.path} 
            className="hover:text-white transition-colors"
          >
            {crumb.label}
          </a>
        ) : (
          <span className="text-white font-medium">{crumb.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

const AppLayout: React.FC = () => {
  const { user, userProfile } = useAuth();
  const location = useLocation();
  const isOnline = useNetworkStatus();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showRowanIntro, setShowRowanIntro] = useState(false);

  // Initialize layout
  useEffect(() => {
    const initializeLayout = async () => {
      // Simulate initialization time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
      
      // Show Rowan intro if user hasn't seen it
      const hasSeenRowanIntro = localStorage.getItem('hasSeenRowanIntro');
      if (!hasSeenRowanIntro) {
        setTimeout(() => {
          setShowRowanIntro(true);
        }, 2000); // Show after 2 seconds
      }
    };
    
    initializeLayout();
  }, []);

  // Toggle sidebar with improved state management
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    
    // Add haptic feedback on mobile devices
    if ('vibrate' in navigator && isMobile) {
      navigator.vibrate(10);
    }
  };

  // Handle window resize with improved performance
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
        
        // Auto-close sidebar on mobile when switching orientations
        if (mobile && sidebarOpen) {
          setSidebarOpen(false);
        }
      
      // Auto-open sidebar on desktop if it's initial load
      if (!mobile && !sidebarOpen && !localStorage.getItem('sidebarState')) {
        setSidebarOpen(true);
      }
      }, 100);
    };
    
    // Load sidebar state from localStorage with error handling
    try {
    const savedSidebarState = localStorage.getItem('sidebarState');
    if (savedSidebarState) {
      setSidebarOpen(savedSidebarState === 'open');
    } else if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
      }
    } catch (error) {
      console.warn('Failed to load sidebar state from localStorage:', error);
    }
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Call on initial load
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Save sidebar state with error handling
  useEffect(() => {
    try {
    localStorage.setItem('sidebarState', sidebarOpen ? 'open' : 'closed');
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  }, [sidebarOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    };
  }, [isMobile, sidebarOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle sidebar with Ctrl/Cmd + B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
      
      // Toggle AI Assistant with Ctrl/Cmd + K
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setAiAssistantOpen(!aiAssistantOpen);
      }
      
      // Open search with Ctrl/Cmd + /
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setSearchOpen(true);
      }
      
      // Close overlays with Escape
      if (event.key === 'Escape') {
        if (searchOpen) setSearchOpen(false);
        if (aiAssistantOpen) setAiAssistantOpen(false);
        if (isMobile && sidebarOpen) setSidebarOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, aiAssistantOpen, searchOpen, isMobile]);

  // Get breadcrumbs for current route
  const breadcrumbs = getBreadcrumbs(location.pathname);

  // Animation classes for main content with improved transitions
  const mainContentClasses = `
    flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-out
    ${sidebarOpen && !isMobile 
      ? 'lg:ml-64 transform-gpu' 
      : 'ml-0 transform-gpu'
    }
  `;

  // Handle Rowan intro dismissal
  const dismissRowanIntro = () => {
    setShowRowanIntro(false);
    localStorage.setItem('hasSeenRowanIntro', 'true');
  };

  // Show loading screen initially
  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white">
      {/* Sidebar */}
        <Sidebar 
          open={sidebarOpen} 
          onToggle={toggleSidebar}
        />
        
        {/* Mobile overlay with improved animation */}
      {isMobile && sidebarOpen && (
        <div 
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-all duration-300 ease-out" 
          onClick={toggleSidebar}
            style={{ 
              opacity: sidebarOpen ? 1 : 0,
              visibility: sidebarOpen ? 'visible' : 'hidden'
            }}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
        <div className={mainContentClasses}>
        {/* Header */}
        <Header 
            username={user?.email || userProfile?.full_name || 'User'}  
          onMenuClick={toggleSidebar}
          onAIAssistantToggle={() => setAiAssistantOpen(!aiAssistantOpen)}
            searchOpen={searchOpen}
            onSearchToggle={() => setSearchOpen(!searchOpen)}
          />

          {/* Network Status Indicator */}
          {!isOnline && (
            <div className="bg-red-600/90 backdrop-blur-sm px-4 py-2 text-center text-sm font-medium flex items-center justify-center space-x-2">
              <WifiOff size={14} />
              <span>You're currently offline. Some features may be limited.</span>
            </div>
          )}

          {/* Page Content with enhanced styling */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-b from-zinc-800/50 to-zinc-900/80 backdrop-blur-sm">
            <div className="p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
                {/* Breadcrumbs */}
                <Breadcrumbs breadcrumbs={breadcrumbs} />
                
                {/* Page Content with Suspense boundary */}
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="flex items-center space-x-3">
                      <Loader className="h-6 w-6 animate-spin text-amber-500" />
                      <span className="text-gray-400">Loading page content...</span>
                    </div>
                  </div>
                }>
                  <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <Outlet />
                  </div>
                </Suspense>
              </div>
            </div>
          </main>

          {/* Connection Status */}
          <div className="fixed bottom-4 right-4 flex items-center space-x-2 z-20">
            {isOnline ? (
              <div className="flex items-center space-x-1 bg-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-full px-3 py-1 text-xs text-green-400">
                <Wifi size={10} />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 bg-red-600/20 backdrop-blur-sm border border-red-500/30 rounded-full px-3 py-1 text-xs text-red-400">
                <WifiOff size={10} />
                <span>Offline</span>
              </div>
            )}
          </div>

          {/* Floating AI Assistant Button (FAB) */}
          <button
            onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
            className={`
              fixed 
              ${isMobile ? 'bottom-16 right-4' : 'bottom-20 right-4'} 
              z-30 
              w-14 h-14 
              bg-gradient-to-r from-amber-500 to-orange-600 
              hover:from-amber-600 hover:to-orange-700 
              text-white rounded-full shadow-lg 
              hover:shadow-xl hover:scale-110 
              transition-all duration-300 ease-out
              flex items-center justify-center
              group
              ${aiAssistantOpen ? 'rotate-180 scale-95' : 'rotate-0 scale-100'}
              backdrop-blur-sm
            `}
            aria-label="Chat with Rowan AI Assistant"
            title="Chat with Rowan AI Assistant (Ctrl+K)"
          >
            {aiAssistantOpen ? (
              <X size={20} className="transition-transform duration-300" />
            ) : (
              <div className="relative">
                <Brain size={20} className="transition-transform duration-300 group-hover:scale-110" />
                {/* Pulsing indicator for AI availability */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
                {/* Small "AI" badge */}
                <div className="absolute -bottom-1 -left-1 text-xs font-bold bg-white text-amber-600 rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                  AI
                </div>
              </div>
            )}
            
            {/* Tooltip - Only show on desktop */}
            {!isMobile && (
              <div className="absolute right-16 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap border border-zinc-700">
                  Chat with Rowan AI
                  <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-zinc-800 border-r border-b border-zinc-700 rotate-45"></div>
                </div>
              </div>
            )}
          </button>

          {/* Rowan AI Introduction Notification */}
          {showRowanIntro && (
            <div className="fixed bottom-36 right-4 z-40 max-w-xs">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-lg shadow-xl border border-amber-400/20 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Brain size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">Meet Rowan AI! 🎉</h4>
                    <p className="text-xs text-white/90 mb-3">
                      Your intelligent venue assistant is ready to help with analytics, planning, and insights. Click the AI button to get started!
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          dismissRowanIntro();
                          setAiAssistantOpen(true);
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded-full transition-colors"
                      >
                        Try it now
                      </button>
                      <button
                        onClick={dismissRowanIntro}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1 rounded-full transition-colors"
                      >
                        Later
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={dismissRowanIntro}
                    className="flex-shrink-0 text-white/70 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
                {/* Arrow pointing to FAB */}
                <div className="absolute -bottom-2 right-8 w-4 h-4 bg-gradient-to-r from-amber-500 to-orange-600 rotate-45 border-r border-b border-amber-400/20"></div>
              </div>
            </div>
          )}
      </div>

      {/* AI Assistant Drawer */}
        <AIAssistant 
          open={aiAssistantOpen} 
          onClose={() => setAiAssistantOpen(false)} 
        />
    </div>
    </ErrorBoundary>
  );
};

export default AppLayout;