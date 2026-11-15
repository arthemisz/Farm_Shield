import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Edit,
  Trash2,
  Compass,
  FileText,
} from 'lucide-react';
import { useFarmShield } from '../context/FarmShieldContext';
import { FarmShieldApi } from '../services/api';
import { Farm, ClimateIntelligence, SoilInformation } from '../types';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { UnitConverter } from '../utils/unitConverter';
import { GEDIBiomassPanel } from '../components/GEDIBiomassPanel';

export const FarmDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { farms, deleteFarm, setSelectedFarm, setSelectedCountryCode } = useFarmShield();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [climate, setClimate] = useState<ClimateIntelligence | null>(null);
  const [soil, setSoil] = useState<SoilInformation | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (id) {
      const found = farms.find((f) => f.id === id);
      if (found) {
        setFarm(found);
        setSelectedFarm(found);
        if (found.countryCode) {
          setSelectedCountryCode(found.countryCode);
        }
        FarmShieldApi.getClimateIntelligence(found, 2025).then((r) => setClimate(r.data));
        FarmShieldApi.getSoilInformation(found).then((r) => setSoil(r.data));
      }
    }
  }, [id, farms]);

  if (!farm) {
    return (
      <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] p-12 text-center shadow-natural-xs">
        <h3 className="text-base font-bold text-[#2B4031]">Farm Not Found</h3>
        <p className="text-xs text-[#748077] mt-1 mb-4">The requested farm record does not exist in local demonstration storage.</p>
        <Link to="/farms" className="text-xs font-bold text-[#2B4031] hover:underline">
          Return to Your Farms
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (farm) {
      await deleteFarm(farm.id);
      navigate('/farms');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top back & actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/farms"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#748077] hover:text-[#2B4031]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Your Farms</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to={`/farms/edit/${farm.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#29332D] bg-[#FFFEFA] border border-[#E4E4D9] rounded-xl hover:bg-[#F3F1E9] transition-colors shadow-natural-xs"
          >
            <Edit className="w-3.5 h-3.5 text-[#2B4031]" />
            <span>Edit Farm</span>
          </Link>
          <button
            onClick={() => setShowDelete(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#9E2A2B] bg-[#FFFEFA] border border-[#F8D7DA] rounded-xl hover:bg-[#FDF2F2] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <DataSourceBadge source="Demonstration Farm Record" />

      {/* Main Hero Card: Warm White #FFFEFA surface with soft border #E4E4D9 */}
      <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] shadow-natural-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E4E4D9] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2B4031] bg-[#E5EBDD] px-2.5 py-0.5 rounded-md border border-[#DCE8D8]">
                {farm.country} • {farm.adminLevel1 || farm.region}
              </span>
              <span className="text-xs font-mono text-[#748077]">ID: {farm.id}</span>
            </div>
            <h2 className="text-2xl font-bold text-[#2B4031] mt-2">{farm.name}</h2>
            <p className="text-xs text-[#748077] flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#D98245]" />
              <span>
                {farm.adminLevel2 || farm.zone} • {farm.adminLevel3 || farm.woreda} • Elevation: ~{farm.elevationMeters || 1900}m
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-[#748077]">Field Parcel Area</span>
            <span className="text-2xl font-extrabold text-[#D98245]">
              {UnitConverter.formatArea(farm.size || farm.sizeHectares || 5.0, farm.sizeUnit)}
            </span>
            <span className="text-[11px] font-mono text-[#748077] mt-0.5">
              {farm.latitude.toFixed(4)}°N, {farm.longitude.toFixed(4)}°E
            </span>
          </div>
        </div>

        {farm.description && (
          <div className="mt-4 p-4 bg-[#F3F1E9] rounded-2xl border border-[#E4E4D9] text-xs text-[#29332D] leading-relaxed">
            <strong className="text-[#2B4031]">Field Description: </strong>
            {farm.description}
          </div>
        )}

        {/* 4 Pillars Summary */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-3.5 bg-[#E5EBDD] rounded-2xl border border-[#DCE8D8]">
            <span className="text-[#748077] text-[11px] block">Current Crop</span>
            <span className="text-sm font-bold text-[#2B4031] mt-1 block">{farm.currentCrop}</span>
          </div>
          <div className="p-3.5 bg-[#F3F1E9] rounded-2xl border border-[#E4E4D9]">
            <span className="text-[#748077] text-[11px] block">Water Regimen</span>
            <span className="text-sm font-bold text-[#29332D] mt-1 block">{farm.waterAvailability}</span>
          </div>
          <div className="p-3.5 bg-[#FAECE1] rounded-2xl border border-[#ECC3A2]">
            <span className="text-[#748077] text-[11px] block">Soil Classification</span>
            <span className="text-xs font-bold text-[#D98245] mt-1 block truncate">{farm.soilType}</span>
          </div>
          <div className="p-3.5 bg-[#E5EBDD] rounded-2xl border border-[#DCE8D8]">
            <span className="text-[#748077] text-[11px] block">Est. Annual Rainfall</span>
            <span className="text-sm font-bold text-[#72966F] mt-1 block">
              {climate?.summary.annualRainfallMm || 950} mm/yr
            </span>
          </div>
        </div>

        {/* NASA GEDI Biomass Panel */}
        <div className="mt-6">
          <GEDIBiomassPanel farmId={farm.id} />
        </div>

        {/* Quick Decision Links */}
        <div className="mt-6 pt-5 border-t border-[#E4E4D9] flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/rotation-planner"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2B4031] hover:bg-[#24392B] text-white rounded-xl text-xs font-bold transition-colors shadow-natural-xs"
          >
            <Compass className="w-4 h-4 text-[#D98245]" />
            <span>Plan your next crop rotation</span>
          </Link>

          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F3F1E9] hover:bg-[#E5EBDD] text-[#29332D] rounded-xl text-xs font-semibold transition-colors border border-[#E4E4D9]"
          >
            <FileText className="w-4 h-4 text-[#2B4031]" />
            <span>Generate Farm Dossier Report</span>
          </Link>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete Demonstration Farm"
        message={`Are you sure you want to remove ${farm.name}? This will delete the farm from your local browser storage.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
};
