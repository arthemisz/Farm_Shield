import React, { useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe2,
  Tractor,
  Sprout,
  Compass,
  Database,
  FileBarChart2,
  Settings,
  Layers,
  Sparkles,
  CloudSun,
  X,
  MapPin
} from 'lucide-react';
import { useFarmShield } from '../../context/FarmShieldContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { selectedCountry } = useFarmShield();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  // Canonical Proposal Navigation Sections:
  // A. Overview
  // B. Agriculture Explorer
  // C. Farm Explorer
  // D. Crop Explorer
  // E. Environmental Intelligence
  // F. Crop Rotation
  // G. Data and Sources
  // H. Reports & System
  const navSections = [
    {
      title: 'Overview',
      items: [
        { name: 'Africa Dashboard', href: '/', icon: LayoutDashboard, tooltip: 'Pan-African continental overview & pilot status' },
      ],
    },
    {
      title: 'Agriculture',
      items: [
        { name: 'Africa Map', href: '/map', icon: Globe2, badge: '54 States', tooltip: 'Interactive GIS map with administrative & environmental layers' },
        { name: 'Countries & Regions', href: '/countries', icon: Layers, tooltip: '54 Sovereign countries & sub-city administrative divisions' },
      ],
    },
    {
      title: 'Farms',
      items: [
        { name: 'Registered Farms', href: '/farms', icon: Tractor, tooltip: 'Farm parcel boundaries, coordinates & field records' },
      ],
    },
    {
      title: 'Crops',
      items: [
        { name: 'Crop Catalogue', href: '/crops', icon: Sprout, tooltip: '11 priority African crop profiles & agronomic parameters' },
      ],
    },
    {
      title: 'Environment',
      items: [
        { name: 'Environmental Layers', href: '/agricultural-data', icon: CloudSun, tooltip: 'Climate, soil chemistry, vegetation NDVI & water resources' },
      ],
    },
    {
      title: 'Planning',
      items: [
        { name: 'Rotation Planner', href: '/rotation-planner', icon: Compass, badge: 'Explainable', tooltip: 'Rule-based decision support for sequence alternatives' },
      ],
    },
    {
      title: 'Data sources',
      items: [
        { name: 'Data Catalogue', href: '/data-import', icon: Database, tooltip: 'Catalog of 12 integrated feeds, provenance & data quality' },
      ],
    },
    {
      title: 'Reports & settings',
      items: [
        { name: 'Dossier Reports', href: '/reports', icon: FileBarChart2, tooltip: 'Print-ready farm and agronomic decision reports' },
        { name: 'System Settings', href: '/settings', icon: Settings, tooltip: 'Measurement units, language & platform settings' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar (Minimized by default on desktop, expands smoothly on hover) */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#18251D]/95 backdrop-blur-md text-[#F3F2E9] transition-all duration-300 ease-in-out border-r border-[#A6C487]/15 shadow-2xl ${
          isHovered ? 'lg:w-64' : 'lg:w-20'
        } ${mobileOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#A6C487]/15 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src="/logo/farm-shield-mark.svg" alt="" className="w-10 h-10 object-contain shrink-0" />
            
            <div className={`flex flex-col transition-opacity duration-200 ${isHovered || mobileOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5 font-sans whitespace-nowrap">
                FarmShield
                <span className="text-[9px] font-bold bg-[#D48756] text-white px-1.5 py-0.5 rounded-sm">
                  AFRICA
                </span>
              </span>
              <span className="text-[10px] text-[#A6C487] truncate font-medium whitespace-nowrap">
                Crop Rotation Decision Support
              </span>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#A6C487] hover:text-white hover:bg-[#111913] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-3 space-y-3.5 overflow-y-auto overflow-x-hidden">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {(isHovered || mobileOpen) && (
                <div className="px-3 text-[11px] font-semibold text-[#A6C487]/80 pt-1 pb-1 whitespace-nowrap">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onCloseMobile}
                    title={!isHovered && !mobileOpen ? `${item.name} — ${item.tooltip}` : undefined}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all group ${
                        isActive
                          ? 'bg-[#B5CF78]/15 text-[#B5CF78] border border-[#B5CF78]/30 shadow-sm'
                          : 'text-[#A9B2A5] hover:bg-[#111913]/80 hover:text-white border border-transparent'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    
                    <span className={`truncate flex-1 whitespace-nowrap transition-opacity duration-200 ${
                      isHovered || mobileOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:hidden'
                    }`}>
                      {item.name}
                    </span>

                    {(isHovered || mobileOpen) && item.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md font-mono shrink-0 ${
                        item.badge === 'Explainable'
                          ? 'bg-[#D48756] text-white'
                          : 'bg-[#111913] text-[#A6C487] border border-[#A6C487]/30'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Desktop Tooltip for minimized state */}
                    {!isHovered && !mobileOpen && (
                      <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1.5 bg-[#111913] text-white text-[11px] font-medium rounded-lg border border-[#A6C487]/30 shadow-xl whitespace-nowrap z-50 pointer-events-none">
                        {item.name}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Primary Pilot Focus Badge */}
        <div className="p-3 border-t border-[#A6C487]/15 shrink-0">
          <div className="p-2.5 rounded-xl bg-[#111913]/80 border border-[#A6C487]/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">{selectedCountry.flag || '🇪🇹'}</span>
              <div className={`min-w-0 transition-opacity duration-200 ${isHovered || mobileOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>
                <span className="block font-bold text-white text-[11px] truncate whitespace-nowrap">
                  {selectedCountry.name || 'Ethiopia'}
                </span>
                <span className="block text-[10px] text-[#B5CF78] font-medium whitespace-nowrap">
                  {selectedCountry.isoCode === 'ET' ? 'Primary Detailed Demo' : 'Pilot Country'}
                </span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#B5CF78] shrink-0" title="Active Country Focus" />
          </div>
        </div>
      </aside>
    </>
  );
};
