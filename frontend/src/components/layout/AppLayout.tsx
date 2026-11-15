import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { useFarmShield } from '../../context/FarmShieldContext';
import { ScientificEvidenceDrawer } from '../common/ScientificEvidenceDrawer';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { contextDrawerOpen, closeContextDrawer, contextDrawerData, openContextDrawer } = useFarmShield();

  return (
    <div className="min-h-screen bg-[#111913] flex flex-col antialiased text-[#F3F2E9] selection:bg-[#B5CF78]/30 selection:text-white">
      {/* Responsive Collapsible Sidebar (Minimized by default, expands on hover) */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area: Left padding is lg:pl-20 to match minimized sidebar width */}
      <div className="flex-1 flex flex-col lg:pl-20 transition-all duration-300 ease-in-out">
        {/* Top Navbar */}
        <TopNavbar onOpenMobileSidebar={() => setMobileOpen(true)} />

        {/* Global Operational Status Strip */}
        <div className="bg-[#18251D] border-b border-[#A6C487]/15 px-4 py-2 text-[11px] text-[#A6C487] flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-[#B5CF78] text-[#111913] px-2 py-0.5 rounded-md font-mono">
              OPERATIONAL
            </span>
            <span className="truncate text-[#D6DDD2] font-medium">
              Understand your land. Make better agricultural decisions across Africa • 54 Sovereign States
            </span>
          </div>
          <span className="hidden sm:inline text-[#D48756] font-semibold text-[10px] bg-[#111913]/80 px-2.5 py-0.5 rounded-md border border-[#D48756]/30">
            5 Pilot Agricultural Hubs
          </span>
        </div>

        {/* Page Body Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="bg-[#18251D]/80 border-t border-[#A6C487]/15 px-6 py-4 text-xs text-[#A9B2A5] mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#F3F2E9] text-sm tracking-tight flex items-center gap-1.5">
                <img src="/logo/farm-shield-mark.svg" alt="" className="w-5 h-5 object-contain" />
                FarmShield
              </span>
              <span className="text-[#A9B2A5]">— Pan-African Agricultural Intelligence & Scientific Decision Support</span>
            </div>
            <div className="flex items-center gap-4 text-[#A9B2A5] text-[11px]">
              <span>Verified Remote Sensing (CHIRPS • NASA POWER • Sentinel-2)</span>
              <span>•</span>
              <span>ISRIC SoilGrids 2.0</span>
              <span>•</span>
              <span className="font-semibold text-[#A6C487]">All 54 African Countries</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Reusable Contextual Scientific Evidence Drawer */}
      <ScientificEvidenceDrawer
        isOpen={contextDrawerOpen}
        onClose={closeContextDrawer}
        panelData={contextDrawerData}
        onNavigateContext={(type, id, extra) => {
          if (type === 'crop') {
            openContextDrawer({
              type: 'crop',
              title: id.toUpperCase(),
              subtitle: 'Botanical profile & agronomic tolerances',
              data: extra || { name: id, scientificName: 'Species' },
              provenance: {
                source: 'EIAR / KALRO Agricultural Extension',
                status: 'LIVE',
              },
            });
          } else if (type === 'farm') {
            openContextDrawer({
              type: 'farm',
              title: extra?.name || id,
              subtitle: 'Verified parcel profile',
              data: extra || { id },
              provenance: {
                source: 'Field-Verified Demonstration Registry',
                status: 'LIVE',
              },
            });
          }
        }}
      />
    </div>
  );
};
