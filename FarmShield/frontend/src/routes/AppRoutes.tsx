import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { MyFarmsPage } from '../pages/MyFarmsPage';
import { AddFarmPage } from '../pages/AddFarmPage';
import { FarmDetailPage } from '../pages/FarmDetailPage';
import { CountryExplorerPage } from '../pages/CountryExplorerPage';
import { CountryDashboardPage } from '../pages/CountryDashboardPage';
import { AiAssistantPage } from '../pages/AiAssistantPage';
import { DataImportPage } from '../pages/DataImportPage';
import { AgriculturalDataPage } from '../pages/AgriculturalDataPage';
import { CropDatabasePage } from '../pages/CropDatabasePage';
import { RotationPlannerPage } from '../pages/RotationPlannerPage';
import { MapPage } from '../pages/MapPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* 1. Dashboard */}
        <Route index element={<DashboardPage />} />

        {/* 2. Explore Africa & Geospatial Map */}
        <Route path="map" element={<MapPage />} />
        <Route path="countries" element={<CountryExplorerPage />} />
        <Route path="country-dashboard/:code" element={<CountryDashboardPage />} />

        {/* 3. Crop Explorer */}
        <Route path="crops" element={<CropDatabasePage />} />
        <Route path="rotation-planner" element={<RotationPlannerPage />} />

        {/* 4. Farm Management */}
        <Route path="farms" element={<MyFarmsPage />} />
        <Route path="farms/add" element={<AddFarmPage />} />
        <Route path="farms/edit/:id" element={<AddFarmPage />} />
        <Route path="farms/:id" element={<FarmDetailPage />} />

        {/* 5. Agricultural Data (Consolidated Hub) */}
        <Route path="agricultural-data" element={<AgriculturalDataPage />} />
        <Route path="climate" element={<Navigate to="/agricultural-data" replace />} />
        <Route path="soil" element={<Navigate to="/agricultural-data" replace />} />
        <Route path="vegetation" element={<Navigate to="/agricultural-data" replace />} />
        <Route path="drought" element={<Navigate to="/agricultural-data" replace />} />

        {/* 6. AI Assistant */}
        <Route path="ai-assistant" element={<AiAssistantPage />} />

        {/* 7. Reports & Data Import */}
        <Route path="reports" element={<ReportsPage />} />
        <Route path="data-import" element={<DataImportPage />} />

        {/* 8. Settings */}
        <Route path="settings" element={<SettingsPage />} />

        {/* Catch-all redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
