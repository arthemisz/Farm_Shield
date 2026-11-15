import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  User,
  ChevronRight,
  Layers,
  X,
  Sparkles,
  Shield,
  HelpCircle
} from 'lucide-react';
import { useFarmShield } from '../../context/FarmShieldContext';
import { CountrySelector } from '../common/CountrySelector';

interface TopNavbarProps {
  onOpenMobileSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileSidebar }) => {
  const location = useLocation();
  const { notifications, removeNotification, clearNotifications, settings, farms, selectedFarm, setSelectedFarm, selectedCountry } = useFarmShield();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Page title and breadcrumbs determination
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Continental Agricultural Intelligence', crumbs: ['Dashboard'] };
    if (path === '/farms') return { title: 'Farm Management', crumbs: ['Dashboard', 'My Farms'] };
    if (path === '/farms/add') return { title: 'Register New Farm', crumbs: ['Dashboard', 'My Farms', 'Add Farm'] };
    if (path.startsWith('/farms/edit/')) return { title: 'Edit Farm Coordinates', crumbs: ['Dashboard', 'My Farms', 'Edit'] };
    if (path.startsWith('/farms/')) return { title: 'Farm Profile Details', crumbs: ['Dashboard', 'My Farms', 'Details'] };
    if (path === '/climate') return { title: 'Climate & Weather Intelligence', crumbs: ['Dashboard', 'NASA Agroclimatology'] };
    if (path === '/soil') return { title: 'Soil Characteristics & Health', crumbs: ['Dashboard', 'Soil Health'] };
    if (path === '/crops') return { title: 'Crop Management & Database', crumbs: ['Dashboard', 'Crops'] };
    if (path === '/rotation-planner') return { title: 'Crop Rotation Decision Support', crumbs: ['Dashboard', 'Rotation Planner'] };
    if (path === '/map') return { title: 'Geospatial Field Map', crumbs: ['Dashboard', 'Africa Map'] };
    if (path === '/countries') return { title: 'All 54 African Countries', crumbs: ['Dashboard', 'Country Explorer'] };
    if (path.startsWith('/country-dashboard/')) return { title: 'National Agricultural Dashboard', crumbs: ['Dashboard', 'Countries', 'Dashboard'] };
    if (path === '/vegetation') return { title: 'Sentinel-2 Vegetation Monitoring', crumbs: ['Dashboard', 'Vegetation'] };
    if (path === '/drought') return { title: 'Data Sources & Drought Monitoring', crumbs: ['Dashboard', 'Data Sources'] };
    if (path === '/data-import') return { title: 'Agricultural Extension Data Import', crumbs: ['Dashboard', 'Data Import'] };
    if (path === '/ai-assistant') return { title: 'AI Agricultural Assistant', crumbs: ['Dashboard', 'AI Assistant'] };
    if (path === '/reports') return { title: 'Decision & Agronomic Reports', crumbs: ['Dashboard', 'Reports'] };
    if (path === '/settings') return { title: 'System Settings & Architecture', crumbs: ['Dashboard', 'Settings'] };
    return { title: 'FarmShield Platform', crumbs: ['Dashboard'] };
  };

  const { title, crumbs } = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-[#18251D]/95 border-b border-[#A6C487]/15 shadow-sm backdrop-blur-md">
      {/* Left section: mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 text-[#A6C487] rounded-xl lg:hidden hover:bg-[#111913] focus:outline-hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-[#A9B2A5] mb-0.5">
            {crumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#A6C487]/40" />}
                <span className={idx === crumbs.length - 1 ? 'font-semibold text-[#B5CF78]' : 'hover:text-white'}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
            {title}
          </h1>
        </div>
      </div>

      {/* Center/Right section: active country selector, global search, notifications & profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Global Search Input */}
        <div className="hidden xl:flex items-center relative">
          <Search className="w-3.5 h-3.5 text-[#A9B2A5] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search crops, regions, coordinates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 lg:w-64 pl-8 pr-3 py-1.5 text-xs bg-[#111913]/80 border border-[#A6C487]/20 rounded-xl text-white placeholder-[#A9B2A5] focus:outline-none focus:border-[#B5CF78] transition-all"
          />
        </div>

        {/* Global Country Selector Component */}
        <CountrySelector compact={true} />

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-[#A9B2A5] hover:text-white hover:bg-[#111913] border border-[#A6C487]/15 transition-colors relative"
            title="System Notifications"
            aria-label="View system notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D48756] ring-2 ring-[#18251D]" />
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-[#18251D] rounded-2xl shadow-2xl border border-[#A6C487]/25 py-2 z-50 text-xs">
                <div className="px-3.5 py-2 border-b border-[#A6C487]/15 flex items-center justify-between">
                  <span className="font-bold text-white">System Notifications</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[10px] text-[#A9B2A5] hover:text-[#B5CF78]"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-[#A6C487]/10">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-[#A9B2A5]">No unread alerts</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 hover:bg-[#111913]/50 transition-colors">
                        <div className="flex items-center justify-between font-semibold text-white">
                          <span>{n.title}</span>
                          <button onClick={() => removeNotification(n.id)}>
                            <X className="w-3 h-3 text-[#A9B2A5]" />
                          </button>
                        </div>
                        <p className="text-[11px] text-[#A9B2A5] mt-1">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-1 border-l border-[#A6C487]/15">
          <div className="w-8 h-8 rounded-xl bg-[#111913] border border-[#B5CF78]/30 flex items-center justify-center text-[#B5CF78] text-xs font-bold">
            {settings.userName ? settings.userName.charAt(0) : 'A'}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-white leading-tight">
              {settings.userName || 'Abebe Bekele'}
            </span>
            <span className="text-[10px] text-[#A6C487] truncate max-w-[120px]">
              {selectedCountry.name} Partner
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
