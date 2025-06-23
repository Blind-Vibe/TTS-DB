import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { AIProvider } from './contexts/AIContext';
import { ThemeProvider } from './contexts/ThemeContext';

// PWA Components
import { PWAInstallPrompt, PWAUpdateNotification } from './components/ui/PWAInstallPrompt';
import { useMobile } from './hooks/useMobile';
import { usePerformance } from './hooks/usePerformance';

// Security
import { securityMiddleware } from './lib/security';

// Lazy Loading Components
import { LazyLoader, SkeletonLoader } from './components/ui/LazyLoader';

// Auth Components (keep these non-lazy for immediate access)
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Layout Components (keep non-lazy for immediate access)
import AppLayout from './layouts/AppLayout';

// Lazy load main pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Artists = lazy(() => import('./pages/Artists'));
const ArtistDetail = lazy(() => import('./pages/ArtistDetail'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const CustomerLoyalty = lazy(() => import('./pages/CustomerLoyalty'));
const Inventory = lazy(() => import('./pages/Inventory'));
const InventoryDetail = lazy(() => import('./pages/InventoryDetail'));
const Marketing = lazy(() => import('./pages/Marketing'));
const CreateCampaign = lazy(() => import('./pages/CreateCampaign'));
const Ticketing = lazy(() => import('./pages/Ticketing'));
const EventReviews = lazy(() => import('./pages/Ticketing/EventReviews'));
const Finances = lazy(() => import('./pages/Finances'));
const Documents = lazy(() => import('./pages/Documents'));
const FileManager = lazy(() => import('./pages/FileManager'));
const Projects = lazy(() => import('./pages/Projects'));
const Settings = lazy(() => import('./pages/Settings'));
const SystemSettings = lazy(() => import('./pages/SystemSettings'));
const AITools = lazy(() => import('./pages/AITools'));
const StaffManagement = lazy(() => import('./pages/StaffManagement'));
const UserRoles = lazy(() => import('./pages/UserRoles'));

// Import the newly created pages
const CalendarView = lazy(() => import('./pages/CalendarView'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const ArtistRoyalties = lazy(() => import('./pages/ArtistRoyalties'));

import './index.css';

// Create Query Client with better mobile performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => failureCount < 2, // Reduce retries on mobile
      refetchOnWindowFocus: false, // Disable on mobile for better performance
    },
  },
});

// Loading component with mobile optimization
const AppLoading: React.FC = () => (
  <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center z-50">
    <div className="text-center">
      <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-white mb-2">TrainStation Dashboard</h2>
      <p className="text-gray-400">Loading your workspace...</p>
    </div>
  </div>
);

// Lazy route wrapper with performance tracking
const LazyRoute: React.FC<{ 
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  componentName: string;
  fallbackType?: 'card' | 'table' | 'chart' | 'text';
}> = ({ component: Component, componentName, fallbackType = 'card' }) => (
  <LazyLoader 
    componentName={componentName}
    fallback={<SkeletonLoader type={fallbackType} />}
  >
    <Component />
  </LazyLoader>
);

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const { measurePageTransition } = usePerformance();

  useEffect(() => {
    const endMeasure = measurePageTransition('App-Initial-Load');
    
    // Apply security headers globally
    const securityHeaders = securityMiddleware.applySecurityHeaders();
    
    // Add security headers to document meta tags for better browser support
    Object.entries(securityHeaders).forEach(([key, value]) => {
      const existingMeta = document.querySelector(`meta[http-equiv="${key}"]`);
      if (existingMeta) {
        existingMeta.setAttribute('content', value);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', key);
        meta.setAttribute('content', value);
        document.head.appendChild(meta);
      }
    });
    
    // Simulate app initialization with performance tracking
    const timer = setTimeout(() => {
      setIsAppLoading(false);
      // Remove the loading screen from HTML
      const loadingElement = document.querySelector('.app-loading');
      if (loadingElement) {
        loadingElement.remove();
      }
      endMeasure();
    }, 1500);

    return () => {
      clearTimeout(timer);
      endMeasure();
    };
  }, [measurePageTransition]);

  if (isAppLoading) {
    return <AppLoading />;
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AIProvider>
            <Router>
            <div className="App">
            <Routes>
                {/* Public Routes - Login/Signup */}
                <Route 
                  path="/login" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <LoginForm />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/signup" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <SignupForm />
                    </ProtectedRoute>
                  } 
                />

                {/* Protected Routes - Main Application */}
                <Route path="/*" element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  {/* Dashboard - All authenticated users */}
                  <Route 
                    path="dashboard" 
                    element={<LazyRoute component={Dashboard} componentName="Dashboard" fallbackType="chart" />} 
                  />
                  <Route path="" element={<Navigate to="/dashboard" replace />} />

                  {/* Events */}
                  <Route 
                    path="calendar" 
                    element={<LazyRoute component={CalendarView} componentName="CalendarView" fallbackType="chart" />} 
                  />
                  <Route 
                    path="events/create" 
                    element={<LazyRoute component={CreateEvent} componentName="CreateEvent" fallbackType="card" />} 
                  />
                  <Route 
                    path="events/:id" 
                    element={<LazyRoute component={EventDetail} componentName="EventDetail" fallbackType="card" />} 
                  />

                  {/* Artists */}
                  <Route 
                    path="artists" 
                    element={<LazyRoute component={Artists} componentName="Artists" fallbackType="table" />} 
                  />
                  <Route 
                    path="artists/:id" 
                    element={<LazyRoute component={ArtistDetail} componentName="ArtistDetail" fallbackType="card" />} 
                  />

                  {/* Customers */}
                  <Route 
                    path="customers" 
                    element={<LazyRoute component={Customers} componentName="Customers" fallbackType="table" />} 
                  />
                  <Route 
                    path="customers/:id" 
                    element={<LazyRoute component={CustomerDetail} componentName="CustomerDetail" fallbackType="card" />} 
                  />
                  <Route 
                    path="customer-loyalty" 
                    element={<LazyRoute component={CustomerLoyalty} componentName="CustomerLoyalty" fallbackType="chart" />} 
                  />

                  {/* Inventory */}
                  <Route 
                    path="inventory" 
                    element={<LazyRoute component={Inventory} componentName="Inventory" fallbackType="table" />} 
                  />
                  <Route 
                    path="inventory/:id" 
                    element={<LazyRoute component={InventoryDetail} componentName="InventoryDetail" fallbackType="card" />} 
                  />

                  {/* Marketing */}
                  <Route 
                    path="marketing" 
                    element={<LazyRoute component={Marketing} componentName="Marketing" fallbackType="chart" />} 
                  />
                  <Route 
                    path="marketing/create" 
                    element={<LazyRoute component={CreateCampaign} componentName="CreateCampaign" fallbackType="card" />} 
                  />

                  {/* Ticketing */}
                  <Route 
                    path="ticketing" 
                    element={<LazyRoute component={Ticketing} componentName="Ticketing" fallbackType="table" />} 
                  />
                  <Route 
                    path="reviews" 
                    element={<LazyRoute component={EventReviews} componentName="EventReviews" fallbackType="card" />} 
                  />

                  {/* Finances */}
                  <Route 
                    path="finances" 
                    element={<LazyRoute component={Finances} componentName="Finances" fallbackType="chart" />} 
                  />
                  <Route 
                    path="finances/royalties" 
                    element={<LazyRoute component={ArtistRoyalties} componentName="ArtistRoyalties" fallbackType="table" />} 
                  />

                  {/* Documents */}
                  <Route 
                    path="documents" 
                    element={<LazyRoute component={Documents} componentName="Documents" fallbackType="table" />} 
                  />

                  {/* File Manager */}
                  <Route 
                    path="file-manager" 
                    element={<LazyRoute component={FileManager} componentName="FileManager" fallbackType="card" />} 
                  />

                  {/* Projects */}
                  <Route 
                    path="projects" 
                    element={<LazyRoute component={Projects} componentName="Projects" fallbackType="card" />} 
                  />

                  {/* Settings */}
                  <Route
                    path="settings"
                    element={<LazyRoute component={Settings} componentName="Settings" fallbackType="card" />}
                  />
                  <Route
                    path="settings/system"
                    element={<LazyRoute component={SystemSettings} componentName="SystemSettings" fallbackType="card" />}
                  />
                  <Route
                    path="settings/user-roles"
                    element={<LazyRoute component={UserRoles} componentName="UserRoles" fallbackType="table" />}
                  />

                  {/* AI Tools */}
                  <Route 
                    path="ai-tools" 
                    element={<LazyRoute component={AITools} componentName="AITools" fallbackType="card" />} 
                  />

                  {/* Staff Management */}
                  <Route 
                    path="staff" 
                    element={<LazyRoute component={StaffManagement} componentName="StaffManagement" fallbackType="table" />} 
                  />

                  {/* Catch all route - redirect to dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
            </Routes>

              {/* PWA Components */}
              <PWAInstallPrompt />
              <PWAUpdateNotification />

              {/* Enhanced Toast Notifications with mobile support */}
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#374151',
                    color: '#fff',
                    border: '1px solid #4B5563',
                    borderRadius: '8px',
                    fontSize: '14px',
                    maxWidth: '90vw',
                  },
                  success: {
                    style: {
                      background: '#065f46',
                      border: '1px solid #059669',
                    },
                  },
                  error: {
                    style: {
                      background: '#7f1d1d',
                      border: '1px solid #dc2626',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </AIProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;