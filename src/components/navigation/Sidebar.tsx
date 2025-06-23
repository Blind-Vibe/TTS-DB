import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  TrendingUpIcon, 
  DollarSignIcon, 
  TicketIcon, 
  SettingsIcon,
  Train,
  X,
  FileText,
  Kanban,
  UserSquare,
  ShoppingCart,
  Zap,
  Award,
  UserCog,
  Monitor,
  Leaf,
  Menu,
  FolderOpen
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `
      flex items-center px-4 py-3 text-sm font-medium rounded-lg
      transition-all duration-200 ease-in-out group
      ${isActive 
        ? 'bg-amber-600 text-white shadow-lg' 
        : 'text-gray-300 hover:bg-zinc-700 hover:text-white hover:shadow-md'}
    `}
  >
    <span className="mr-3 transition-transform group-hover:scale-110">{icon}</span>
    <span className="font-medium">{label}</span>
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle, isMobile: propIsMobile }) => {
  // Use prop or determine if we're on mobile by checking the window width
  const [internalIsMobile, setInternalIsMobile] = useState(false);
  const isMobile = propIsMobile ?? internalIsMobile;
  
  useEffect(() => {
    const checkMobile = () => {
      setInternalIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', checkMobile);
    checkMobile(); // Initial check
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle navigation item click on mobile
  const handleNavClick = () => {
    if (isMobile) {
      onToggle(); // Close sidebar on mobile when nav item is clicked
    }
  };
  
  // Animation classes based on open state and mobile/desktop view
  const sidebarClasses = `
    fixed top-0 left-0 z-50 h-screen w-64 bg-zinc-900 
    transition-transform duration-300 ease-in-out
    ${open ? 'translate-x-0' : '-translate-x-full'}
    ${isMobile ? 'shadow-2xl' : 'shadow-lg'}
    border-r border-zinc-700/50
  `;

  return (
    <>
      {/* Mobile menu button - only show when sidebar is closed on mobile */}
      {isMobile && !open && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-40 p-2 bg-zinc-800 text-white rounded-lg shadow-lg hover:bg-zinc-700 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-700/50 px-4 bg-zinc-900/95 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-600 rounded-lg">
              <Train className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-playfair text-lg font-bold tracking-tight text-white">
            Train Station
          </span>
              <div className="text-xs text-amber-400 font-medium">Dashboard</div>
            </div>
        </div>
        
          {/* Close button - show on mobile or always visible */}
          <button 
            onClick={onToggle}
            className="rounded-full p-2 text-gray-400 hover:bg-zinc-800 hover:text-white transition-colors"
            aria-label="Toggle sidebar"
          >
            <X size={18} />
          </button>
      </div>

      {/* Navigation */}
        <div className="flex flex-col p-4 space-y-1 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Main
            </div>
            <NavItem 
              to="/" 
              icon={<HomeIcon size={18} />} 
              label="Dashboard" 
              onClick={handleNavClick}
            />
            <NavItem 
              to="/artists" 
              icon={<UsersIcon size={18} />} 
              label="Artists" 
              onClick={handleNavClick}
            />
            <NavItem 
              to="/ticketing" 
              icon={<TicketIcon size={18} />} 
              label="Events & Tickets" 
              onClick={handleNavClick}
            />
          </div>

          {/* Business Management */}
          <div className="pt-4 space-y-1">
            <div className="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Business
            </div>
            <NavItem 
              to="/finances" 
              icon={<DollarSignIcon size={18} />} 
              label="Finances" 
              onClick={handleNavClick}
            />
            <NavItem 
              to="/marketing" 
              icon={<TrendingUpIcon size={18} />} 
              label="Marketing" 
              onClick={handleNavClick}
            />
            <NavItem 
              to="/customers" 
              icon={<UserSquare size={18} />} 
              label="Customers" 
              onClick={handleNavClick}
            />
            <NavItem 
              to="/customer-loyalty" 
              icon={<Award size={18} />} 
              label="Loyalty Program" 
              onClick={handleNavClick}
            />
          </div>

          {/* Operations */}
          <div className="pt-4 space-y-1">
            <div className="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Operations
            </div>
            <NavItem 
              to="/inventory" 
              icon={<ShoppingCart size={18} />} 
              label="Inventory" 
              onClick={handleNavClick}
            />
            <NavItem 
              to="/documents" 
              icon={<FileText size={18} />} 
              label="Documents" 
              onClick={handleNavClick}
            />
            <NavItem 
              to="/file-manager" 
              icon={<FolderOpen size={18} />} 
              label="File Manager" 
              onClick={handleNavClick}
            />
            <NavItem 
              to="/projects" 
              icon={<Kanban size={18} />} 
              label="Projects" 
              onClick={handleNavClick}
            />
          </div>

          {/* Tools & Settings */}
          <div className="pt-4 space-y-1">
            <div className="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Tools
            </div>
            <NavItem 
              to="/ai-tools" 
              icon={<Zap size={18} />} 
              label="AI Assistant" 
              onClick={handleNavClick}
            />
            <NavItem
              to="/settings"
              icon={<SettingsIcon size={18} />}
              label="Settings"
              onClick={handleNavClick}
            />
            <NavItem
              to="/settings/system"
              icon={<Monitor size={18} />}
              label="System Settings"
              onClick={handleNavClick}
            />
            <NavItem
              to="/settings/user-roles"
              icon={<UserCog size={18} />}
              label="User Roles"
              onClick={handleNavClick}
            />
          </div>
        </div>
        
        {/* Footer - Venue Information */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-700/50 bg-zinc-900/95 backdrop-blur-sm">
          <div className="rounded-lg bg-gradient-to-r from-zinc-800 to-zinc-700 p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="text-sm font-semibold text-white">The Train Station</div>
            </div>
            <div className="text-xs text-gray-300">4671 5th Street, Corbin, KY</div>
            <div className="text-xs text-amber-400 mt-1">Live Dashboard</div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;