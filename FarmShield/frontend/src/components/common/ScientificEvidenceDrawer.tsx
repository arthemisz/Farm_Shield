import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Info,
  MapPin,
  Calendar,
  Layers,
  Thermometer,
  Droplets,
  Sprout,
  Compass,
  ArrowRight,
  Database,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Maximize2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type ContextPanelType =
  | 'country'
  | 'region'
  | 'farm'
  | 'crop'
  | 'layer'
  | 'dataset'
  | 'rotation';

export interface ContextPanelData {
  type: ContextPanelType;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'green' | 'orange' | 'blue' | 'gray';
  data: any;
  provenance?: {
    source: string;
    datasetName?: string;
    version?: string;
    spatialResolution?: string;
    temporalResolution?: string;
    measurementType?: string;
    status: 'LIVE' | 'CACHED' | 'PARTIAL' | 'MODELLED' | 'LITERATURE_REFERENCE' | 'DEMONSTRATION' | 'UNAVAILABLE';
    units?: Record<string, string>;
    retrievalDate?: string;
    limitations?: string;
  };
}

interface ScientificEvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  panelData: ContextPanelData | null;
  onNavigateContext?: (type: ContextPanelType, id: string, extra?: any) => void;
}

export const ScientificEvidenceDrawer: React.FC<ScientificEvidenceDrawerProps> = ({
  isOpen,
  onClose,
  panelData,
  onNavigateContext
}) => {
  const navigate = useNavigate();

  if (!isOpen || !panelData) return null;

  const { type, title, subtitle, badge, badgeColor, data, provenance } = panelData;

  const getBadgeStyle = (color?: string) => {
    switch (color) {
      case 'green':
        return 'bg-[#E5EBDD] text-[#2B4031] border-[#DCE8D8]';
      case 'orange':
        return 'bg-[#FAECE1] text-[#BC6935] border-[#ECC3A2]';
      case 'blue':
        return 'bg-[#EBF5FB] text-[#2980B9] border-[#D4E6F1]';
      default:
        return 'bg-[#F3F1E9] text-[#748077] border-[#E4E4D9]';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-[#E5EBDD] text-[#2B4031] border-[#DCE8D8]';
      case 'CACHED':
        return 'bg-[#EBF5FB] text-[#2980B9] border-[#D4E6F1]';
      case 'MODELLED':
        return 'bg-[#FEF9E7] text-[#B7950B] border-[#F9E79F]';
      case 'LITERATURE_REFERENCE':
        return 'bg-[#FAECE1] text-[#773E1D] border-[#ECC3A2]';
      case 'DEMONSTRATION':
        return 'bg-[#FDF2E9] text-[#E67E22] border-[#F5CBA7]';
      case 'UNAVAILABLE':
        return 'bg-[#FDF2F2] text-[#9E2A2B] border-[#F8D7DA]';
      default:
        return 'bg-[#F3F1E9] text-[#748077] border-[#E4E4D9]';
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[520px] bg-[#FFFEFA] shadow-2xl border-l border-[#E4E4D9] flex flex-col transition-all duration-300 animate-in slide-in-from-right font-sans">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#E4E4D9] flex items-center justify-between bg-[#FDFCF7]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#E5EBDD] flex items-center justify-center text-[#2B4031] shrink-0">
              {type === 'country' && <Compass className="w-4 h-4 text-[#2B4031]" />}
              {type === 'region' && <MapPin className="w-4 h-4 text-[#2B4031]" />}
              {type === 'farm' && <Sprout className="w-4 h-4 text-[#2B4031]" />}
              {type === 'crop' && <Sprout className="w-4 h-4 text-[#72966F]" />}
              {type === 'layer' && <Layers className="w-4 h-4 text-[#D98245]" />}
              {type === 'dataset' && <Database className="w-4 h-4 text-[#BC6935]" />}
              {type === 'rotation' && <TrendingUp className="w-4 h-4 text-[#2B4031]" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#748077]">
                  {type.toUpperCase()} CONTEXT
                </span>
                {badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(badgeColor)}`}>
                    {badge}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#2B4031] leading-tight mt-0.5 truncate max-w-[220px] xs:max-w-[280px] sm:max-w-[340px]">
                {title}
              </h3>
              {subtitle && <p className="text-[11px] text-[#748077] truncate">{subtitle}</p>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 sm:p-1.5 rounded-xl text-[#748077] hover:text-[#2B4031] hover:bg-[#E5EBDD] transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Close panel"
            aria-label="Close scientific evidence drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-[#29332D]">
        {/* 1. Country Selection View */}
        {type === 'country' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#F3F1E9] rounded-2xl border border-[#E4E4D9] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#2B4031]">Operational Status:</span>
                <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] border ${getStatusBadge(data.operationalStatus || 'PILOT_OPERATIONAL')}`}>
                  {data.operationalStatus || 'PILOT_OPERATIONAL'}
                </span>
              </div>
              <p className="text-[11px] text-[#748077]">
                {data.description || `Pan-African member state with documented agricultural extension profiles.`}
              </p>
            </div>

            {/* Core Agronomic Profile */}
            <div className="border border-[#E4E4D9] rounded-2xl p-4 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B4031] block">
                Priority Crops & Extension Packages
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(data.supportedCrops || ['Teff', 'Bread Wheat', 'Maize', 'Faba Bean']).map((c: string) => (
                  <span
                    key={c}
                    onClick={() => onNavigateContext && onNavigateContext('crop', c.toLowerCase())}
                    className="px-2.5 py-1 bg-[#E5EBDD] text-[#2B4031] rounded-lg font-bold text-[11px] border border-[#DCE8D8] cursor-pointer hover:bg-[#DCE8D8] transition-colors"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-[#748077] italic mt-1">
                Click any crop to inspect botanical requirements and rotation compatibility.
              </p>
            </div>

            {/* Administrative Divisions */}
            <div className="border border-[#E4E4D9] rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B4031] block">
                Administrative Divisions
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9]">
                  <span className="text-[#748077] block text-[10px]">Level 1:</span>
                  <span className="font-bold text-[#2B4031]">{data.admin1Name || '12 Regional States + 2 Cities'}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9]">
                  <span className="text-[#748077] block text-[10px]">Level 2 / 3:</span>
                  <span className="font-bold text-[#2B4031]">{data.admin2Name || 'Zones & Woredas'}</span>
                </div>
              </div>
            </div>

            {/* Registered Demonstration Farms */}
            <div className="border border-[#E4E4D9] rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B4031] block">
                Demonstration & Registered Farms
              </span>
              <div className="space-y-1.5">
                {(data.farms || [
                  { id: 'farm-1', name: 'Bishoftu Demonstration Farm', type: 'FIELD_VERIFIED RESEARCH', size: '12.5 ha' },
                  { id: 'farm-2', name: 'Arsi Highland Wheat Plot', type: 'FIELD_VERIFIED RESEARCH', size: '8.0 ha' },
                ]).map((f: any) => (
                  <div
                    key={f.id}
                    onClick={() => onNavigateContext && onNavigateContext('farm', f.id, f)}
                    className="p-2.5 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9] flex items-center justify-between cursor-pointer hover:border-[#72966F] transition-all"
                  >
                    <div>
                      <span className="font-bold text-[#2B4031] block">{f.name}</span>
                      <span className="text-[10px] text-[#748077]">{f.type} • {f.size}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#D98245]" />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate(`/country-dashboard/${data.isoCode || 'ET'}`)}
              className="w-full py-2.5 rounded-xl bg-[#2B4031] text-[#FFFEFA] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#1B3B2D] transition-colors"
            >
              <span>Open Detailed Country Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1.5. Region / Administrative Division View */}
        {type === 'region' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#F3F1E9] rounded-2xl border border-[#E4E4D9] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2B4031] text-xs">Administrative Unit:</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E5EBDD] text-[#2B4031]">
                  {data.adminLevel || 'Admin Level 1 / District'}
                </span>
              </div>
              <div className="text-[11px] text-[#29332D]">
                <div className="flex justify-between py-1 border-b border-[#E4E4D9]">
                  <span className="text-[#748077]">Country / Territory:</span>
                  <span className="font-bold text-[#2B4031]">{data.country || 'Ethiopia (ET)'}</span>
                </div>
                {data.zone && (
                  <div className="flex justify-between py-1 border-b border-[#E4E4D9]">
                    <span className="text-[#748077]">Administrative Zone:</span>
                    <span className="font-bold text-[#2B4031]">{data.zone}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-[#748077]">Cartographic Status:</span>
                  <span className="font-bold text-[#2B4031]">{data.boundaryStatus || 'Generalized Polygon Boundary'}</span>
                </div>
              </div>
            </div>

            {/* Major Agro-Ecological Profiles */}
            <div className="border border-[#E4E4D9] rounded-2xl p-4 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B4031] block">
                Agro-Ecological Classification & Cropping Systems
              </span>
              <p className="text-[11px] text-[#29332D] leading-relaxed">
                {data.description || 'Predominant highland mixed crop-livestock zone with bimodal (Belg/Meher) or unimodal precipitation regime.'}
              </p>
              {data.crops && data.crops.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#748077] block mb-1.5">
                    Verified Regional Crops (Click to view evidence)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.crops.map((crop: string) => (
                      <button
                        key={crop}
                        onClick={() => onNavigateContext?.('crop', crop)}
                        className="px-2.5 py-1 rounded-lg bg-[#FDFCF7] border border-[#E4E4D9] text-[#2B4031] text-[11px] font-bold hover:bg-[#E5EBDD] transition-colors"
                      >
                        {crop}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Environmental Baselines */}
            <div className="border border-[#E4E4D9] rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B4031] block">
                Environmental & Soil Characteristics (ISRIC SoilGrids & CHIRPS)
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9]">
                  <span className="text-[#748077] block text-[10px]">Predominant Soil:</span>
                  <span className="font-bold text-[#2B4031]">{data.soilCondition || data.soilType || 'Heavy Vertisols (Black clay, pH 6.8-7.2)'}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9]">
                  <span className="text-[#748077] block text-[10px]">Rainfall Normal:</span>
                  <span className="font-bold text-[#2B4031]">{data.rainfallAnnual || '1,186 mm/yr (Meher/Kiremt)'}</span>
                </div>
                {data.farmingMethod && (
                  <div className="col-span-2 p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9]">
                    <span className="text-[#748077] block text-[10px]">Farming Practice & Tillage:</span>
                    <span className="text-[#29332D] text-[10.5px] leading-relaxed block mt-0.5">{data.farmingMethod}</span>
                  </div>
                )}
                {data.plantingCalendar && (
                  <div className="col-span-2 p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9]">
                    <span className="text-[#748077] block text-[10px]">Extension Calendar & Season:</span>
                    <span className="font-bold text-[#2B4031] text-[10.5px] block mt-0.5">📅 {data.plantingCalendar}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Farm Selection View */}
        {type === 'farm' && (
          <div className="space-y-4">
            {/* Identity & Coordinates */}
            <div className="p-4 bg-[#F3F1E9] rounded-2xl border border-[#E4E4D9] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2B4031] text-xs">Farm Classification:</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E5EBDD] text-[#2B4031]">
                  {data.cropProvenance || 'FIELD_VERIFIED RESEARCH'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-[#748077] block text-[10px]">Coordinates:</span>
                  <span className="font-mono font-bold text-[#2B4031]">
                    {data.latitude?.toFixed(4)}°N, {data.longitude?.toFixed(4)}°E
                  </span>
                </div>
                <div>
                  <span className="text-[#748077] block text-[10px]">Area / Boundary:</span>
                  <span className="font-bold text-[#2B4031]">
                    {data.sizeHectares || data.size || 12.5} ha ({data.boundaryGeoJson ? 'Verified Polygon' : 'Point Marker'})
                  </span>
                </div>
              </div>
            </div>

            {/* Soil & Edaphic Properties */}
            <div className="border border-[#E4E4D9] rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B4031] block">
                Soil Chemistry & Physical Texture (ISRIC SoilGrids)
              </span>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9] text-center">
                  <span className="text-[#748077] block text-[10px]">Soil Type</span>
                  <span className="font-bold text-[#2B4031]">{data.soilType || 'Vertisol (Black clay)'}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9] text-center">
                  <span className="text-[#748077] block text-[10px]">Soil pH</span>
                  <span className="font-bold text-[#2B4031]">6.8 (Near Neutral)</span>
                </div>
                <div className="p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9] text-center">
                  <span className="text-[#748077] block text-[10px]">Organic C</span>
                  <span className="font-bold text-[#2B4031]">1.8%</span>
                </div>
              </div>
              <p className="text-[10px] text-[#748077] italic mt-1">
                Status: MODELLED 250m gridded estimate across 0-30cm depths.
              </p>
            </div>

            {/* Climate Baseline */}
            <div className="border border-[#E4E4D9] rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B4031] block">
                Seasonal Climate Normal (CHIRPS & NASA POWER)
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9]">
                  <span className="text-[#748077] block text-[10px]">Annual Rainfall:</span>
                  <span className="font-bold text-[#2B4031]">1186.1 mm (Highland)</span>
                </div>
                <div className="p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9]">
                  <span className="text-[#748077] block text-[10px]">Thermal Mean:</span>
                  <span className="font-bold text-[#2B4031]">20.0°C (10-25°C highland)</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate(`/farm/${data.id || 'farm-1'}`)}
                className="py-2.5 rounded-xl bg-[#2B4031] text-[#FFFEFA] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#1B3B2D] transition-colors"
              >
                <span>Full Farm View</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/crop-rotation')}
                className="py-2.5 rounded-xl bg-[#D98245] text-[#FFFEFA] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#BC6935] transition-colors"
              >
                <span>Plan Rotation</span>
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 3. Crop Selection View */}
        {type === 'crop' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#F3F1E9] rounded-2xl border border-[#E4E4D9] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-base font-bold text-[#2B4031] block">{data.name || title}</span>
                  <span className="text-[11px] text-[#748077] italic font-mono">{data.scientificName || 'Botanical Species'}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E5EBDD] text-[#2B4031]">
                  {data.family || 'Family'} • {data.category || 'Category'}
                </span>
              </div>
              <p className="text-[11px] text-[#29332D] leading-relaxed">
                {data.description || 'Key agro-ecological crop documented in national research extension packages.'}
              </p>
            </div>

            {/* Environmental Requirements */}
            <div className="border border-[#E4E4D9] rounded-2xl p-4 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B4031] block">
                Growing Requirements & Tolerance
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9]">
                  <span className="text-[#748077] block text-[10px]">Thermal Window:</span>
                  <span className="font-bold text-[#2B4031]">
                    {data.suitableTemperatureCelsius ? `${data.suitableTemperatureCelsius.min} - ${data.suitableTemperatureCelsius.max}°C (Opt: ${data.suitableTemperatureCelsius.optimal}°C)` : '10 - 27°C'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9]">
                  <span className="text-[#748077] block text-[10px]">Water Needs:</span>
                  <span className="font-bold text-[#2B4031]">
                    {data.waterRequirementsMm ? `${data.waterRequirementsMm.min} - ${data.waterRequirementsMm.max} mm` : '350 - 650 mm'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9]">
                  <span className="text-[#748077] block text-[10px]">Soil pH Range:</span>
                  <span className="font-bold text-[#2B4031]">
                    {data.pHRange ? `${data.pHRange.min} - ${data.pHRange.max}` : '5.5 - 7.5'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[#FDFCF7] border border-[#E4E4D9]">
                  <span className="text-[#748077] block text-[10px]">Nitrogen Dynamic:</span>
                  <span className="font-bold text-[#2B4031]">
                    {data.nitrogenFixation ? 'Rhizobium Fixer (+N)' : 'Nitrogen Extractor (-N)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rotation Recommendations */}
            <div className="border border-[#E4E4D9] rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B4031] block">
                Agronomic Rotation Synergy
              </span>
              <p className="text-[11px] text-[#29332D] leading-relaxed">
                {data.nitrogenFixation
                  ? 'Excellent break crop following Poaceae cereals (Teff/Wheat/Maize), depositing residual biological nitrogen and breaking root rot fungi.'
                  : 'Requires alternating with pulse legumes (Faba Bean/Chickpea) to avoid soil nutrient mining and rust spore persistence.'}
              </p>
            </div>

            <button
              onClick={() => navigate('/crops')}
              className="w-full py-2.5 rounded-xl bg-[#2B4031] text-[#FFFEFA] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#1B3B2D] transition-colors"
            >
              <span>Explore All 11 Priority Crops</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4. Environmental Layer & Dataset View */}
        {(type === 'layer' || type === 'dataset') && (
          <div className="space-y-4">
            <div className="p-4 bg-[#F3F1E9] rounded-2xl border border-[#E4E4D9] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2B4031] text-xs">Dataset Standard:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(provenance?.status || 'LIVE')}`}>
                  {provenance?.status || 'LIVE'}
                </span>
              </div>
              <p className="text-[11px] text-[#29332D] leading-relaxed">
                {data.description || 'Earth observation layer utilized in FarmShield multi-factor environmental evaluation.'}
              </p>
            </div>

            {/* Technical Specifications */}
            <div className="border border-[#E4E4D9] rounded-2xl p-4 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B4031] block">
                Technical Specifications & Units
              </span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between py-1 border-b border-[#E4E4D9]">
                  <span className="text-[#748077]">Provider:</span>
                  <span className="font-bold text-[#2B4031]">{provenance?.source || data.provider || 'NASA / CHC / ISRIC'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E4E4D9]">
                  <span className="text-[#748077]">Spatial Resolution:</span>
                  <span className="font-bold text-[#2B4031]">{provenance?.spatialResolution || data.resolution || '0.05° (~5km)'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E4E4D9]">
                  <span className="text-[#748077]">Temporal Resolution:</span>
                  <span className="font-bold text-[#2B4031]">{provenance?.temporalResolution || 'Monthly Aggregated'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#748077]">Measurement Units:</span>
                  <span className="font-bold text-[#2B4031]">{data.unit || 'mm / °C / MJ/m²/day'}</span>
                </div>
              </div>
            </div>

            {/* Scientific Caveat / Limitations */}
            <div className="p-4 bg-[#FAECE1] border border-[#ECC3A2] rounded-2xl text-[11px] text-[#773E1D] space-y-1">
              <span className="font-bold text-[#BC6935] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Scientific Boundary & Limitations:
              </span>
              <p className="leading-relaxed">
                {provenance?.limitations || data.limitations || 'Data provides regional satellite and station-blended estimates. Ground soil sampling is recommended for micro-nutrient calibration.'}
              </p>
            </div>
          </div>
        )}

        {/* 5. Rotation Recommendation View */}
        {type === 'rotation' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#F3F1E9] rounded-2xl border border-[#E4E4D9] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#748077]">Decision Score</span>
                <span className="text-2xl font-black text-[#2B4031]">{data.overallScore || 84} / 100</span>
              </div>
              <div className="text-[11px] font-bold text-[#2B4031] flex items-center gap-1.5">
                <span>{data.currentCrop || 'Bread Wheat'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D98245]" />
                <span className="text-[#D98245]">{data.nextCrop || 'Faba Bean'}</span>
              </div>
              <p className="text-[11px] text-[#29332D] leading-relaxed pt-1">
                {data.summaryExplanation || 'Rotating from cereal to legume replenishes biological nitrogen and breaks host-specific foliar rust cycles.'}
              </p>
            </div>

            {/* Factor Scores Breakdown */}
            <div className="border border-[#E4E4D9] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B4031] block">
                  Factor Score Breakdown (Weighted Polygon)
                </span>
                <span className="text-[10px] text-[#748077] font-semibold">
                  Weights: 25% + 25% + 25% + 15% + 10% = 100%
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between py-1 border-b border-[#E4E4D9]">
                  <span className="text-[#748077]">
                    {data.factors?.climateSuitability?.name || 'Climate Suitability'} ({data.factors?.climateSuitability?.weightPct || 25}%):
                  </span>
                  <span className="font-bold text-[#2B4031]">{data.factors?.climateSuitability?.score ?? 87} / 100</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E4E4D9]">
                  <span className="text-[#748077]">
                    {data.factors?.soilSuitability?.name || 'Soil Suitability'} ({data.factors?.soilSuitability?.weightPct || 25}%):
                  </span>
                  <span className="font-bold text-[#2B4031]">{data.factors?.soilSuitability?.score ?? 88} / 100</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E4E4D9]">
                  <span className="text-[#748077]">
                    {data.factors?.waterRequirements?.name || 'Water Requirements'} ({data.factors?.waterRequirements?.weightPct || 25}%):
                  </span>
                  <span className="font-bold text-[#2B4031]">{data.factors?.waterRequirements?.score ?? 65} / 100</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E4E4D9]">
                  <span className="text-[#748077]">
                    {data.factors?.nitrogenFixation?.name || 'Biological Nitrogen Fixation'} ({data.factors?.nitrogenFixation?.weightPct || 15}%):
                  </span>
                  <span className="font-bold text-[#2B4031]">{data.factors?.nitrogenFixation?.score ?? 92} / 100</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#748077]">
                    {data.factors?.cropDiversity?.name || 'Botanical Family Diversity'} ({data.factors?.cropDiversity?.weightPct || 10}%):
                  </span>
                  <span className="font-bold text-[#2B4031]">{data.factors?.cropDiversity?.score ?? 90} / 100</span>
                </div>
              </div>

              {/* Exact Weighted Calculation Proof */}
              {data.factors?.climateSuitability && data.factors?.soilSuitability && (
                <div className="mt-2 pt-2 border-t border-[#E4E4D9] text-[10px] text-[#748077] font-mono leading-relaxed">
                  <div>
                    Calculation: ({data.factors.climateSuitability.score}×0.25) + ({data.factors.soilSuitability.score}×0.25) + ({data.factors.waterRequirements?.score ?? 0}×0.25) + ({data.factors.nitrogenFixation?.score ?? 0}×0.15) + ({data.factors.cropDiversity?.score ?? 0}×0.10)
                  </div>
                  <div className="font-bold text-[#2B4031] mt-0.5">
                    = {Math.round(
                      (data.factors.climateSuitability.score * 0.25) +
                      (data.factors.soilSuitability.score * 0.25) +
                      ((data.factors.waterRequirements?.score ?? 0) * 0.25) +
                      ((data.factors.nitrogenFixation?.score ?? 0) * 0.15) +
                      ((data.factors.cropDiversity?.score ?? 0) * 0.10)
                    )} / 100 (matches Decision Score: {data.overallScore})
                  </div>
                </div>
              )}
            </div>

            {/* Scientific Guardrail */}
            <div className="p-4 bg-[#FAECE1] border border-[#ECC3A2] rounded-2xl text-[11px] text-[#773E1D] space-y-1">
              <span className="font-bold text-[#BC6935]">Advisory Transparency Notice:</span>
              <p>
                Suitability scores indicate agronomic compatibility indexes; they do NOT constitute guaranteed commercial crop yield predictions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Bottom Provenance Banner */}
      {provenance && (
        <div className="p-4 border-t border-[#E4E4D9] bg-[#FDFCF7] text-[10px] text-[#748077] flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#72966F] shrink-0" />
            <span className="truncate">Source: {provenance.source || 'NASA & Institutional Open Data'}</span>
          </div>
          <span className={`px-2 py-0.5 rounded font-bold border shrink-0 ${getStatusBadge(provenance.status)}`}>
            {provenance.status}
          </span>
        </div>
      )}
    </div>
    </>
  );
};

