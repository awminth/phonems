import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  ShoppingBag,
  FileText,
  DollarSign,
  UserCog,
  PieChart,
  Users,
  Bot,
  Menu,
  X,
  Bell,
  LogOut,
  AlertTriangle,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  RotateCcw,
  Search,
  Banknote,
  CreditCard,
  CornerUpLeft,
  ClipboardList,
  BellRing,
  Tags,
  Building2,
  TrendingUp,
  Wrench
} from 'lucide-react';
import { SidebarItem } from '../../types';
import { apiClient, API_ENDPOINTS, sessionManager } from '../../config';

// Searchable menu item interface
interface SearchableMenuItem {
  id: string;
  label: string;
  path: string;
  parent?: string;
  icon: React.ReactNode;
}

const DashboardLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [username, setUsername] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchInputMobileRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load user data from session
  useEffect(() => {
    const user = sessionManager.getUser();
    if (user) {
      setUserPermissions(user.permissions);
      setUsername(user.username);
      setBranchName(user.branch?.name || (user.userType === 'admin' ? 'Admin Panel' : 'Main Menu'));
    } else {
      // Redirect to login if not logged in
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const user = sessionManager.getUser();
      if (user?.id && user?.username) {
        await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT, {
          userId: user.id,
          username: user.username
        });
      }
    } catch (error) {
      console.error('Logout logging failed:', error);
      // Continue logout even if logging fails
    } finally {
      sessionManager.clearSession();
      setIsLogoutModalOpen(false);
      navigate('/');
    }
  };

  // All sidebar items definition - Grouped by category
  const allSidebarItems: SidebarItem[] = [
    // Services
    { id: 'services', label: 'Services', icon: <Wrench size={20} />, path: '/services', color: 'bg-cyan-600' },
    // Sale related
    { id: 'sale', label: 'Sale', icon: <ShoppingCart size={20} />, path: '/sale', color: 'bg-emerald-600' },
    { id: 'sale-return', label: 'Sale Return', icon: <RotateCcw size={20} />, path: '/sale-return/new', color: 'bg-purple-600' },
    // Purchase related
    { id: 'purchase', label: 'Purchase', icon: <ShoppingBag size={20} />, path: '/purchase', color: 'bg-orange-600' },
    // Customer related
    { id: 'customer', label: 'Customer', icon: <Users size={20} />, path: '/customers', color: 'bg-teal-600' },
    // Reports
    { id: 'reports', label: 'Reports', icon: <FileText size={20} />, path: '/reports', color: 'bg-blue-600' },
    // Financial related
    { id: 'expense', label: 'Expense', icon: <DollarSign size={20} />, path: '/expense', color: 'bg-red-600' },
    { id: 'financial', label: 'Financial', icon: <PieChart size={20} />, path: '/financial', color: 'bg-indigo-600' },
    // Settings/Management related
    { id: 'user', label: 'User Setting', icon: <UserCog size={20} />, path: '/users', color: 'bg-purple-600' },
    { id: 'security', label: 'Security', icon: <ShieldCheck size={20} />, path: '/security', color: 'bg-gray-600' },
    // Tools/Marketing
    { id: 'ai', label: 'Post Creator AI', icon: <Bot size={20} />, path: '/dashboard/ai', color: 'bg-pink-600' },
    // Branch Management
    { id: 'branch', label: 'Branch', icon: <Building2 size={20} />, path: '/branches', color: 'bg-amber-600' },
  ];

  // All searchable menu items (main + sub-menu items)
  const allSearchableItems: SearchableMenuItem[] = [
    // Main Menu Items
    { id: 'sale', label: 'Sale', path: '/sale', icon: <ShoppingCart size={18} /> },
    { id: 'sale-return', label: 'Sale Return', path: '/sale-return/new', icon: <RotateCcw size={18} /> },
    { id: 'purchase', label: 'Purchase', path: '/purchase', icon: <ShoppingBag size={18} /> },
    { id: 'customer', label: 'Customer', path: '/customers', icon: <Users size={18} /> },
    { id: 'reports', label: 'Reports', path: '/reports', icon: <FileText size={18} /> },
    { id: 'expense', label: 'Expense', path: '/expense', icon: <DollarSign size={18} /> },
    { id: 'financial', label: 'Financial', path: '/financial', icon: <PieChart size={18} /> },
    { id: 'user', label: 'User Setting', path: '/users', icon: <UserCog size={18} /> },
    { id: 'security', label: 'Security', path: '/security', icon: <ShieldCheck size={18} /> },
    { id: 'ai', label: 'Post Creator AI', path: '/dashboard/ai', icon: <Bot size={18} /> },
    { id: 'branch', label: 'Branch', path: '/branches', icon: <Building2 size={18} /> },
    { id: 'services', label: 'Services', path: '/services', icon: <Wrench size={18} /> },
    // Sale Sub-menu Items
    { id: 'cash-sale', label: 'Cash Sale', path: '/sale/cash', parent: 'Sale', icon: <Banknote size={18} /> },
    { id: 'credit-sale', label: 'Credit Sale', path: '/sale/credit', parent: 'Sale', icon: <CreditCard size={18} /> },
    { id: 'sale-return-list', label: 'Sale Return List', path: '/sale/return', parent: 'Sale', icon: <CornerUpLeft size={18} /> },
    // Purchase Sub-menu Items
    { id: 'purchase-list', label: 'Purchase List', path: '/purchase/list', parent: 'Purchase', icon: <ShoppingBag size={18} /> },
    { id: 'inventory-list', label: 'Inventory List', path: '/purchase/inventory', parent: 'Purchase', icon: <ClipboardList size={18} /> },
    { id: 'purchase-return', label: 'Purchase Return', path: '/purchase/return-list', parent: 'Purchase', icon: <CornerUpLeft size={18} /> },
    { id: 'remainder', label: 'Remainder', path: '/purchase/remainder', parent: 'Purchase', icon: <BellRing size={18} /> },
    { id: 'category', label: 'Category', path: '/purchase/category', parent: 'Purchase', icon: <Tags size={18} /> },
    { id: 'supplier', label: 'Supplier', path: '/purchase/company', parent: 'Purchase', icon: <Building2 size={18} /> },
    // Reports Sub-menu Items
    { id: 'cash-report', label: 'Cash Report', path: '/reports/cash', parent: 'Reports', icon: <Banknote size={18} /> },
    { id: 'credit-report', label: 'Credit Report', path: '/reports/credit', parent: 'Reports', icon: <CreditCard size={18} /> },
    { id: 'sale-return-report', label: 'Sale Return Report', path: '/reports/return', parent: 'Reports', icon: <CornerUpLeft size={18} /> },
    { id: 'top-items-report', label: 'Top Items Report', path: '/reports/top-items', parent: 'Reports', icon: <TrendingUp size={18} /> },
    { id: 'service-report', label: 'Service Report', path: '/reports/service', parent: 'Reports', icon: <Wrench size={18} /> },
  ];

  // Filter sidebar items based on user permissions
  // Security is always visible for all logged in users
  const sidebarItems = allSidebarItems.filter(item => {
    // Security is always visible
    if (item.id === 'security') return true;
    // Check if user has permission for this item
    return userPermissions.includes(item.id);
  });

  // Filter searchable items based on permissions
  const getSearchableItems = (): SearchableMenuItem[] => {
    return allSearchableItems.filter(item => {
      // If it's a sub-menu item, check parent permission
      if (item.parent) {
        const parentId = item.parent.toLowerCase().replace(' ', '-');
        if (parentId === 'sale' && item.id === 'sale-return-list') {
          // Sale Return List uses 'sale' permission
          return userPermissions.includes('sale') || userPermissions.includes('sale-return');
        }
        return userPermissions.includes(parentId);
      }
      // Main menu items - check permission
      if (item.id === 'security') return true;
      return userPermissions.includes(item.id);
    });
  };

  // Filter search results
  const filteredSearchItems = searchQuery.trim()
    ? getSearchableItems().filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.path.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  // Handle search item click
  const handleSearchItemClick = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setIsSearchDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        searchInputMobileRef.current &&
        !searchInputMobileRef.current.contains(event.target as Node)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle sidebar collapse (desktop only)
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
      {/* Header - Fixed Top */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-md z-40 shrink-0">
        {/* Top Row: Logo, Menu Button, User Info */}
        <div className="h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              className="lg:hidden text-gray-300 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>

            {/* Desktop Toggle Button */}
            <button
              className="hidden lg:flex text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}
            >
              {isSidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
            </button>

            <div className="flex items-center gap-2">
              <img src="/assets/logo.png" alt="Logo" className="h-8 w-auto rounded-md object-contain" />
              <span className="text-lg md:text-xl font-bold tracking-tight hidden sm:block text-yellow-500">Marctober Phone & Service POS</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
            {/* Desktop Search Box - In top row */}
            <div className="hidden md:block relative flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchDropdownOpen(true);
                  }}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  placeholder="Search menu items..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchDropdownOpen(false);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Desktop Search Dropdown */}
              {isSearchDropdownOpen && filteredSearchItems.length > 0 && (
                <div
                  ref={searchDropdownRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-[100]"
                >
                  {filteredSearchItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSearchItemClick(item.path)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition-colors text-left border-b border-gray-700 last:border-b-0"
                    >
                      <div className="text-gray-400 flex-shrink-0">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm">{item.label}</div>
                        {item.parent && (
                          <div className="text-xs text-gray-500 mt-0.5">{item.parent}</div>
                        )}
                        <div className="text-xs text-gray-600 mt-0.5 truncate">{item.path}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Desktop No Results */}
              {isSearchDropdownOpen && searchQuery.trim() && filteredSearchItems.length === 0 && (
                <div
                  ref={searchDropdownRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 z-[100]"
                >
                  <div className="text-gray-400 text-sm text-center">No results found</div>
                </div>
              )}
            </div>

            <button className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 pl-2 md:pl-4 border-l border-gray-700">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{username || 'User'}</p>
                <p className="text-xs text-green-400">Online</p>
              </div>
              <div className="w-9 h-9 bg-gray-600 rounded-full flex items-center justify-center border-2 border-gray-500">
                <span className="font-bold text-sm">{username ? username.charAt(0).toUpperCase() : 'U'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Search Box - Visible on mobile/tablet */}
        <div className="px-4 pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={searchInputMobileRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchDropdownOpen(true);
              }}
              onFocus={() => setIsSearchDropdownOpen(true)}
              placeholder="Search menu items..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchDropdownOpen(false);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Search Dropdown - Full width overlay */}
      {isSearchDropdownOpen && filteredSearchItems.length > 0 && (
        <div
          className="md:hidden fixed inset-x-0 top-[76px] bottom-0 bg-black/50 z-[90]"
          onClick={() => setIsSearchDropdownOpen(false)}
        >
          <div
            className="bg-gray-800 border-t border-gray-700 max-h-[calc(100vh-76px)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {filteredSearchItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => {
                  handleSearchItemClick(item.path);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 active:bg-gray-600 transition-colors text-left border-b border-gray-700 last:border-b-0 touch-manipulation"
              >
                <div className="text-gray-400 flex-shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm">{item.label}</div>
                  {item.parent && (
                    <div className="text-xs text-gray-500 mt-0.5">{item.parent}</div>
                  )}
                  <div className="text-xs text-gray-600 mt-0.5 truncate">{item.path}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile/Tablet No Results */}
      {
        isSearchDropdownOpen && searchQuery.trim() && filteredSearchItems.length === 0 && (
          <div
            className="md:hidden fixed inset-x-0 top-[76px] bottom-0 bg-black/50 z-[90] flex items-start justify-center pt-4"
            onClick={() => setIsSearchDropdownOpen(false)}
          >
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 mx-4">
              <div className="text-gray-400 text-sm text-center">No results found</div>
            </div>
          </div>
        )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel (Sidebar) - Collapsible on Desktop */}
        <aside className={`
          absolute lg:static inset-y-0 left-0 z-50 bg-gray-800 border-r border-gray-700 transform transition-all duration-300 ease-in-out shadow-2xl
          ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarCollapsed ? 'lg:w-0 lg:overflow-hidden lg:border-r-0' : 'lg:w-64'}
        `}>
          <div className="h-full overflow-y-auto p-3 w-64">
            {/* Menu Title */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
              <Menu size={20} className="text-yellow-500" />
              <h2 className="text-lg font-bold text-yellow-500 truncate">{branchName}</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {sidebarItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                            flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 aspect-square text-center
                            hover:scale-105 shadow-md
                            ${location.pathname === item.path ? 'bg-gray-700 ring-2 ring-blue-500' : 'bg-gray-800 hover:bg-gray-750'}
                            border border-gray-700
                        `}
                >
                  <div className={`p-3 rounded-full mb-3 text-white shadow-sm ${item.color || 'bg-gray-600'}`}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-300 leading-tight">{item.label}</span>
                </Link>
              ))}

              {/* Logout Button in Grid */}
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 aspect-square text-center bg-gray-800 hover:bg-gray-750 border border-gray-700 group"
              >
                <div className="p-3 rounded-full mb-3 text-white bg-red-900 group-hover:bg-red-700 shadow-sm">
                  <LogOut size={20} />
                </div>
                <span className="text-xs font-medium text-gray-300 group-hover:text-red-400">Logout</span>
              </button>
            </div>

            {/* Permission Info */}
            {userPermissions.length > 0 && (
              <div className="mt-4 p-3 bg-gray-900/50 rounded-xl border border-gray-700">
                <p className="text-xs text-gray-500 text-center">
                  {userPermissions.length === allSidebarItems.length - 1
                    ? 'All Permissions'
                    : `${userPermissions.length} Permission(s)`
                  }
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Right Panel (Main Content) - Expands when sidebar is collapsed */}
        <main className="flex-1 overflow-hidden bg-gray-900 relative transition-all duration-300">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {
        isLogoutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="text-red-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Confirm Logout</h3>
                <p className="text-gray-400 text-sm">Are you sure you want to end your session?</p>
              </div>
              <div className="p-4 bg-gray-750 border-t border-gray-700 flex gap-3">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-900/40 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default DashboardLayout;
