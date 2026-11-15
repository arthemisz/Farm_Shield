import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Tractor,
  Plus,
  Search,
  Filter,
  MapPin,
  Trash2,
  Edit,
  Eye,
  Droplets,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useFarmShield } from '../context/FarmShieldContext';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Farm } from '../types';
import { UnitConverter } from '../utils/unitConverter';

export const MyFarmsPage: React.FC = () => {
  const { farms, deleteFarm, setSelectedFarm, selectedCountry, countries, setSelectedCountryCode } = useFarmShield();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('ALL');
  const [farmToDelete, setFarmToDelete] = useState<Farm | null>(null);

  // Filtered farms list
  const filteredFarms = farms.filter((farm) => {
    const matchesSearch =
      farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (farm.adminLevel1 && farm.adminLevel1.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (farm.adminLevel2 && farm.adminLevel2.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (farm.zone && farm.zone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (farm.currentCrop && farm.currentCrop.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCountry =
      selectedCountryFilter === 'ALL' || farm.countryCode === selectedCountryFilter;

    return matchesSearch && matchesCountry;
  });

  const handleDeleteConfirm = async () => {
    if (farmToDelete) {
      await deleteFarm(farmToDelete.id);
      setFarmToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2B4031] tracking-tight">
            Your Farms
          </h2>
          <p className="text-xs sm:text-sm text-[#748077] mt-1">
            Manage your fields, soil types, and coordinates across regional territories.
          </p>
        </div>

        {/* Primary Action Button */}
        <Link
          to="/farms/add"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2B4031] hover:bg-[#24392B] text-white font-semibold text-xs sm:text-sm shadow-natural-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D98245]" />
          <span>Add New Farm</span>
        </Link>
      </div>

      <DataSourceBadge source="Local Farm Registry (Simulated NASA & Soil Parameters)" />

      {/* Filter and Search Bar: Warm White #FFFEFA surface with soft border #E4E4D9 */}
      <div className="bg-[#FFFEFA] p-4 rounded-2xl border border-[#E4E4D9] shadow-natural-xs flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#748077]" />
          <input
            type="text"
            placeholder="Search by farm name, location, or crop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F3F1E9] border border-[#E4E4D9] rounded-xl focus:outline-hidden focus:border-[#72966F] focus:bg-[#FFFEFA] text-[#29332D] placeholder-[#748077] transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-[#748077] shrink-0" />
            <span className="text-xs text-[#748077] hidden sm:inline">Country:</span>
            <select
              aria-label="Filter farms by country"
              value={selectedCountryFilter}
              onChange={(e) => setSelectedCountryFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2 bg-[#F3F1E9] border border-[#E4E4D9] rounded-xl text-xs font-bold text-[#2B4031] focus:outline-hidden focus:border-[#72966F]"
            >
              <option value="ALL">All Countries ({farms.length} parcels)</option>
              {countries.map((c) => {
                const count = farms.filter((f) => f.countryCode === c.isoCode).length;
                return (
                  <option key={c.isoCode} value={c.isoCode}>
                    {c.flag} {c.name} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Farm Cards Grid */}
      {filteredFarms.length === 0 ? (
        <div className="bg-[#FFFEFA] p-12 text-center rounded-3xl border border-[#E4E4D9] shadow-natural-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#E5EBDD] flex items-center justify-center mx-auto text-[#2B4031] mb-3">
            <Tractor className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#2B4031]">No farm parcels found</h3>
          <p className="text-xs text-[#748077] mt-1 max-w-sm mx-auto">
            No fields matched your search criteria or country filter. Try adjusting your search query or register a new farm.
          </p>
          <Link
            to="/farms/add"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2B4031] text-white text-xs font-semibold hover:bg-[#24392B] transition-colors"
          >
            <Plus className="w-4 h-4 text-[#D98245]" />
            <span>Register your first parcel</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFarms.map((farm) => (
            <div
              key={farm.id}
              className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] shadow-natural-xs hover:border-[#72966F] hover:shadow-natural-sm transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#2B4031] bg-[#E5EBDD] px-2.5 py-0.5 rounded-md border border-[#DCE8D8]">
                    {farm.countryCode === 'ET' ? '🇪🇹' : farm.countryCode === 'KE' ? '🇰🇪' : '🌍'} {farm.adminLevel1 || farm.region}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#D98245]">
                    {UnitConverter.formatArea(farm.size || farm.sizeHectares || 5.0, farm.sizeUnit)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#2B4031] group-hover:text-[#72966F] transition-colors">
                  {farm.name}
                </h3>
                <p className="text-xs text-[#748077] flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D98245] shrink-0" />
                  <span>
                    {farm.adminLevel2 || farm.zone} • {farm.adminLevel3 || farm.woreda}
                  </span>
                </p>

                {farm.description && (
                  <p className="text-xs text-[#29332D] mt-3 line-clamp-2 leading-relaxed bg-[#F3F1E9] p-2.5 rounded-xl border border-[#E4E4D9]">
                    {farm.description}
                  </p>
                )}

                {/* Details Pill grid */}
                <div className="mt-4 pt-3 border-t border-[#E4E4D9] grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-[#748077] text-[11px] block">Current Crop</span>
                    <span className="font-bold text-[#2B4031] flex items-center gap-1 mt-0.5">
                      <Sparkles className="w-3 h-3 text-[#D98245]" />
                      {farm.currentCrop}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#748077] text-[11px] block">Water Regimen</span>
                    <span className="font-semibold text-[#29332D] flex items-center gap-1 mt-0.5">
                      <Droplets className="w-3 h-3 text-[#72966F]" />
                      {farm.waterAvailability}
                    </span>
                  </div>
                  <div className="col-span-2 mt-1">
                    <span className="text-[#748077] text-[11px] block">Soil Classification</span>
                    <span className="font-medium text-[#29332D] text-[11px] flex items-center gap-1 truncate mt-0.5">
                      <Layers className="w-3 h-3 text-[#D98245] shrink-0" />
                      <span className="truncate">{farm.soilType}</span>
                    </span>
                  </div>
                  <div className="col-span-2 text-[10px] text-[#748077] font-mono mt-0.5">
                    GPS: {farm.latitude.toFixed(4)}° N, {farm.longitude.toFixed(4)}° E
                  </div>
                </div>
              </div>

              {/* Card Footer Actions: Soft Sage Background #E5EBDD */}
              <div className="bg-[#F3F1E9] px-5 py-3 border-t border-[#E4E4D9] flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedFarm(farm);
                    setSelectedCountryCode(farm.countryCode || 'ET');
                    navigate(`/farms/${farm.id}`);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2B4031] hover:text-[#72966F] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#D98245]" />
                  <span>View farm insights</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(`/farms/edit/${farm.id}`)}
                    className="p-1.5 text-[#748077] hover:text-[#2B4031] hover:bg-[#FFFEFA] rounded-lg transition-colors"
                    title="Edit farm details"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFarmToDelete(farm)}
                    className="p-1.5 text-[#748077] hover:text-[#9E2A2B] hover:bg-[#FFFEFA] rounded-lg transition-colors"
                    title="Delete farm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Destructive Action */}
      <ConfirmDialog
        isOpen={!!farmToDelete}
        title="Delete Demonstration Farm"
        message={`Are you sure you want to remove "${farmToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete Farm"
        cancelLabel="Keep Farm"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setFarmToDelete(null)}
      />
    </div>
  );
};
