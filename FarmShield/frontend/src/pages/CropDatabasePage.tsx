import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Search,
  Filter,
  Droplets,
  Thermometer,
  Clock,
  Sparkles,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Globe,
  MapPin,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useFarmShield } from '../context/FarmShieldContext';
import { Crop } from '../types';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { CropImage } from '../components/common/CropImage';

export const CropDatabasePage: React.FC = () => {
  const navigate = useNavigate();
  const { crops, selectedCountry, countries, setSelectedCountryCode } = useFarmShield();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>(
    selectedCountry.isoCode || selectedCountry.isoAlpha2 || 'ALL'
  );
  const [activeCrop, setActiveCrop] = useState<Crop>(crops[0]);

  // Filter crops by search, category, and country applicability
  const filteredCrops = crops.filter((crop) => {
    const matchesSearch =
      crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Object.values(crop.localNames || {}).some((n) =>
        n.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      crop.family.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || crop.category === selectedCategory;

    const matchesCountry =
      selectedCountryFilter === 'ALL' ||
      crop.countryApplicability.includes(selectedCountryFilter) ||
      crop.countryApplicability.includes('GLOBAL');

    return matchesSearch && matchesCategory && matchesCountry;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#B5CF78]/10 text-[#B5CF78] border border-[#B5CF78]/20">
              <Sprout className="w-5 h-5" />
            </span>
            Pan-African Crop Explorer & Botanical Knowledgebase
          </h2>
          <p className="text-xs sm:text-sm text-[#A6C487] mt-1">
            Verified physiological thresholds, thermal optima, biological nitrogen fixation rates, and regional suitability.
          </p>
        </div>
        <DataSourceBadge source="EIAR, FAO Crop Profiles & KALRO Agricultural Knowledgebase" />
      </div>

      {/* Filter and Search Bar: Glass Panel */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#A6C487]" />
          <input
            type="text"
            placeholder="Search crop by English, local, or botanical name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs bg-[#111913]/80 border border-[#A6C487]/20 rounded-xl focus:outline-none focus:border-[#B5CF78] text-white placeholder-[#A6C487]/60 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Country filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#A6C487]/20 bg-[#111913]/80">
            <Globe className="w-4 h-4 text-[#B5CF78]" />
            <span className="text-xs text-[#A6C487]">Country:</span>
            <select
              aria-label="Filter crops by country"
              value={selectedCountryFilter}
              onChange={(e) => setSelectedCountryFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#18251D] text-white">All Countries ({crops.length})</option>
              {countries.map((c) => {
                const code = c.isoCode || c.isoAlpha2 || '';
                return (
                  <option key={code} value={code} className="bg-[#18251D] text-white">
                    {c.flag} {c.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#A6C487]/20 bg-[#111913]/80">
            <Filter className="w-4 h-4 text-[#E4BA6D]" />
            <span className="text-xs text-[#A6C487]">Category:</span>
            <select
              aria-label="Filter crops by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-[#18251D] text-white">All Categories</option>
              <option value="Cereal" className="bg-[#18251D] text-white">Cereal</option>
              <option value="Pulse" className="bg-[#18251D] text-white">Pulse / Legume</option>
              <option value="Oilseed" className="bg-[#18251D] text-white">Oilseed</option>
              <option value="Root" className="bg-[#18251D] text-white">Root & Tuber</option>
            </select>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Crop Gallery on Left, Active Crop Detailed Dossier on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Crop List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A6C487]">
              Available Crops ({filteredCrops.length})
            </h3>
            <span className="text-[10px] text-[#A9B2A5]">Click to inspect botanical dossier</span>
          </div>

          {filteredCrops.length === 0 ? (
            <div className="p-8 glass-panel text-center text-xs text-[#A6C487]">
              No crops found matching current filters.
            </div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredCrops.map((crop) => {
                const isSelected = activeCrop?.id === crop.id;
                return (
                  <div
                    key={crop.id}
                    onClick={() => setActiveCrop(crop)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1a382b] border-[#B5CF78] shadow-md shadow-[#B5CF78]/10'
                        : 'glass-panel hover:bg-[#18251D] hover:border-[#A6C487]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-12 rounded-xl overflow-hidden shrink-0 border border-[#A6C487]/20">
                        <CropImage
                          cropId={crop.id}
                          cropName={crop.name}
                          aspectRatio="video"
                          className="h-full w-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{crop.name}</h4>
                          {crop.localNames?.am && (
                            <span className="text-xs text-[#B5CF78] font-semibold">
                              {crop.localNames.am.split(' ')[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#A6C487] italic truncate">{crop.scientificName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-[#111913] text-[#A9B2A5] border border-[#A6C487]/20">
                            {crop.category}
                          </span>
                          {crop.nitrogenFixation.capable && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#B5CF78]/20 text-[#B5CF78] border border-[#B5CF78]/30">
                              N-Fixing
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-[#B5CF78] translate-x-0.5' : 'text-[#A6C487]/60'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Crop Dossier */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 space-y-6">
          {activeCrop ? (
            <>
              {/* Dossier Header & Botanical Photograph */}
              <div className="space-y-4 border-b border-[#A6C487]/15 pb-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#B5CF78] bg-[#B5CF78]/15 px-2.5 py-0.5 rounded-md border border-[#B5CF78]/30">
                    Botanical Dossier • {activeCrop.category}
                  </span>

                  <button
                    onClick={() => navigate(`/map?crop=${activeCrop.id}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#B5CF78] text-[#111913] hover:bg-[#A0BC66] text-xs font-bold shadow-md transition-all"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>View on Africa Map</span>
                  </button>
                </div>

                <CropImage
                  cropId={activeCrop.id}
                  cropName={activeCrop.name}
                  scientificName={activeCrop.scientificName}
                  aspectRatio="wide"
                />

                <div>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-2xl font-bold text-white">{activeCrop.name}</h3>
                    {activeCrop.localNames && (
                      <span className="text-sm font-semibold text-[#B5CF78]">
                        {Object.entries(activeCrop.localNames)
                          .map(([lang, name]) => `${name} (${lang.toUpperCase()})`)
                          .join(' • ')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#A6C487] italic mt-0.5">
                    {activeCrop.scientificName} • Family: {activeCrop.family}
                  </p>
                  <p className="text-xs text-[#A9B2A5] mt-2 leading-relaxed">
                    {activeCrop.description}
                  </p>
                </div>
              </div>

              {/* Agronomic Requirements Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-[#111913]/60 p-3.5 rounded-2xl border border-[#A6C487]/20">
                  <div className="flex items-center gap-1.5 text-[#A6C487] text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-[#B5CF78]" />
                    <span>Growing Duration</span>
                  </div>
                  <div className="mt-2 text-base font-bold text-white">
                    {activeCrop.growingDurationDays.min} - {activeCrop.growingDurationDays.max} days
                  </div>
                  <span className="text-[10px] text-[#A6C487]">Seed to harvest</span>
                </div>

                <div className="bg-[#111913]/60 p-3.5 rounded-2xl border border-[#A6C487]/20">
                  <div className="flex items-center gap-1.5 text-[#A6C487] text-xs font-bold">
                    <Droplets className="w-3.5 h-3.5 text-[#B5CF78]" />
                    <span>Water Needs</span>
                  </div>
                  <div className="mt-2 text-base font-bold text-white">
                    {activeCrop.waterRequirementsMm.min} - {activeCrop.waterRequirementsMm.max} mm
                  </div>
                  <span className="text-[10px] text-[#A6C487]">Seasonal precipitation</span>
                </div>

                <div className="bg-[#111913]/60 p-3.5 rounded-2xl border border-[#A6C487]/20">
                  <div className="flex items-center gap-1.5 text-[#A6C487] text-xs font-bold">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Thermal Optimum</span>
                  </div>
                  <div className="mt-2 text-base font-bold text-white">
                    {activeCrop.suitableTemperatureCelsius.optimal.min}°C - {activeCrop.suitableTemperatureCelsius.optimal.max}°C
                  </div>
                  <span className="text-[10px] text-[#A6C487]">
                    Range: {activeCrop.suitableTemperatureCelsius.min}°C - {activeCrop.suitableTemperatureCelsius.max}°C
                  </span>
                </div>
              </div>

              {/* Root & Nitrogen Fixation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-[#A6C487]/20 rounded-2xl p-4 bg-[#111913]/60 text-xs space-y-1.5">
                  <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Root Morphology
                  </h4>
                  <p><strong className="text-white">Type:</strong> {activeCrop.rootCharacteristics.systemType}</p>
                  <p><strong className="text-white">Depth:</strong> {activeCrop.rootCharacteristics.depthCm.min} - {activeCrop.rootCharacteristics.depthCm.max} cm</p>
                  <p className="text-[11px] text-[#A6C487] leading-relaxed">{activeCrop.rootCharacteristics.description}</p>
                </div>

                <div className="border border-[#A6C487]/20 rounded-2xl p-4 bg-[#111913]/60 text-xs space-y-1.5">
                  <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#B5CF78]" />
                    Nitrogen Fixation (BNF)
                  </h4>
                  <p>
                    <strong className="text-white">Active:</strong>{' '}
                    <span className={activeCrop.nitrogenFixation.capable ? 'text-[#B5CF78] font-bold' : 'text-[#A6C487]'}>
                      {activeCrop.nitrogenFixation.capable ? 'Yes (Symbiotic Rhizobium)' : 'No (Nutrient Consumer)'}
                    </span>
                  </p>
                  {activeCrop.nitrogenFixation.rateKgPerHectare && (
                    <p><strong className="text-white">Residual N:</strong> ~{activeCrop.nitrogenFixation.rateKgPerHectare} kg N/ha</p>
                  )}
                  <p className="text-[11px] text-[#A6C487] leading-relaxed">{activeCrop.nitrogenFixation.description}</p>
                </div>
              </div>

              {/* Scientific Sources */}
              <div className="bg-[#111913]/60 p-4 rounded-2xl border border-[#A6C487]/15 text-xs text-[#A6C487]">
                <div className="flex items-center gap-1.5 font-bold text-white mb-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#B5CF78]" />
                  <span>Institutional Scientific References</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#A9B2A5]">
                  {activeCrop.references.map((ref, idx) => (
                    <li key={idx}>{ref}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-[#A6C487]">
              Select a crop from the left gallery to inspect its agronomic properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
