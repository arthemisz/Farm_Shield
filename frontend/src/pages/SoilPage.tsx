import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Activity,
  Droplets,
  ShieldCheck,
  CheckCircle2,
  Info,
  Waves,
  Satellite,
  Gauge,
  AlertTriangle,
  ArrowDownCircle,
  Clock,
  BookOpen
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import '../utils/chartSetup';
import { useFarmShield } from '../context/FarmShieldContext';
import { FarmShieldApi } from '../services/api';
import { SoilInformation, SmapSoilMoistureIntelligence } from '../types';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { SoilKnowledgeModal } from '../components/common/SoilKnowledgeModal';

export const SoilPage: React.FC = () => {
  const { farms, selectedFarm, setSelectedFarm } = useFarmShield();
  const [soil, setSoil] = useState<SoilInformation | null>(null);
  const [moisture, setMoisture] = useState<SmapSoilMoistureIntelligence | null>(null);
  const [loadingMoisture, setLoadingMoisture] = useState<boolean>(false);
  const [showSoilModal, setShowSoilModal] = useState<boolean>(false);

  useEffect(() => {
    if (selectedFarm) {
      FarmShieldApi.getSoilInformation(selectedFarm)
        .then((res) => setSoil(res.data));

      setLoadingMoisture(true);
      FarmShieldApi.getSoilMoistureIntelligence(
        selectedFarm.latitude || 9.02,
        selectedFarm.longitude || 38.74,
        selectedFarm.currentCrop || 'Field Crop'
      )
        .then((res) => setMoisture(res.data))
        .finally(() => setLoadingMoisture(false));
    }
  }, [selectedFarm]);

  // Texture Class Chart: Forest Green #2B4031, Terracotta Orange #D98245, Secondary Green #72966F
  const textureChartData = {
    labels: ['Clay', 'Sand', 'Silt'],
    datasets: [
      {
        data: [soil?.clayPct || 55, soil?.sandPct || 20, soil?.siltPct || 25],
        backgroundColor: ['#2B4031', '#D98245', '#72966F'],
        borderWidth: 2,
        borderColor: '#FFFEFA',
      },
    ],
  };

  const getMoistureBadgeClass = (stress: string | undefined) => {
    switch (stress) {
      case 'OPTIMAL_MOISTURE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'MILD_MOISTURE_DEFICIT':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'SEVERE_DROUGHT_STRESS':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'WATERLOGGED_SATURATED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Farm Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2B4031] tracking-tight">
            Soil Characteristics & Moisture Analytical Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-[#748077] mt-1">
            Physical pedology (ISRIC SoilGrids 2.0) coupled with NASA SMAP (Soil Moisture Active Passive) L-band radiometry & USDA Ag Data Commons calibration standards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSoilModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-[#2B4031] text-white hover:bg-[#1b3a2c] rounded-xl font-bold shadow-natural-xs transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#A6C487]" />
            <span>Soil & Crop Guide</span>
          </button>
          <span className="text-xs text-[#748077] font-medium">Active Farm:</span>
          <select
            aria-label="Select farm for soil data"
            value={selectedFarm?.id || ''}
            onChange={(e) => {
              const f = farms.find((item) => item.id === e.target.value);
              if (f) setSelectedFarm(f);
            }}
            className="px-3.5 py-2 text-xs bg-[#FFFEFA] border border-[#E4E4D9] rounded-xl font-bold text-[#2B4031] focus:outline-hidden focus:border-[#72966F] shadow-natural-xs"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.countryCode} - {f.soilType})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <DataSourceBadge source="ISRIC SoilGrids 250m Spatial Model" />
        <DataSourceBadge source="NASA SMAP 9km EASE-Grid 2.0 Radiometer Pipeline" />
        <DataSourceBadge source="USDA NAL Ag Data Commons Metadata Standard" />
      </div>

      {/* Primary Soil Properties Grid: Warm White #FFFEFA Surfaces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Soil pH */}
        <div className="bg-[#FFFEFA] p-5 rounded-3xl border border-[#E4E4D9] shadow-natural-xs hover:border-[#72966F] transition-all">
          <div className="flex items-center justify-between text-[#748077] text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Soil pH</span>
            <FlaskConical className="w-4 h-4 text-[#D98245]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#2B4031]">{soil?.ph.toFixed(1)}</span>
            <span className="text-xs font-semibold text-[#748077]">pH Units</span>
          </div>
          <p className="mt-2 text-xs text-[#748077]">
            {soil && soil.ph < 5.5 ? 'Acidic - Liming beneficial' : soil && soil.ph > 7.5 ? 'Alkaline' : 'Near Neutral (Ideal)'}
          </p>
        </div>

        {/* Soil Organic Carbon */}
        <div className="bg-[#FFFEFA] p-5 rounded-3xl border border-[#E4E4D9] shadow-natural-xs hover:border-[#72966F] transition-all">
          <div className="flex items-center justify-between text-[#748077] text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Organic Carbon</span>
            <Activity className="w-4 h-4 text-[#2B4031]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#2B4031]">{soil?.organicCarbonPct.toFixed(2)}%</span>
            <span className="text-xs font-semibold text-[#748077]">Mass Fraction</span>
          </div>
          <p className="mt-2 text-xs text-[#748077]">
            {soil && soil.organicCarbonPct > 2.0 ? 'High Carbon Reserve' : 'Moderate Carbon Stock'}
          </p>
        </div>

        {/* Cation Exchange Capacity (CEC) */}
        <div className="bg-[#FFFEFA] p-5 rounded-3xl border border-[#E4E4D9] shadow-natural-xs hover:border-[#72966F] transition-all">
          <div className="flex items-center justify-between text-[#748077] text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Cation Capacity (CEC)</span>
            <ShieldCheck className="w-4 h-4 text-[#72966F]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#2B4031]">
              {soil?.cationExchangeCapacityCmol ? soil.cationExchangeCapacityCmol.toFixed(1) : '28.0'}
            </span>
            <span className="text-xs font-semibold text-[#748077]">cmol(+)/kg</span>
          </div>
          <p className="mt-2 text-xs text-[#748077]">
            Nutrient retention status: <strong className="text-[#2B4031]">{soil?.fertilityStatus || 'High'}</strong>
          </p>
        </div>

        {/* Drainage Class */}
        <div className="bg-[#FFFEFA] p-5 rounded-3xl border border-[#E4E4D9] shadow-natural-xs hover:border-[#72966F] transition-all">
          <div className="flex items-center justify-between text-[#748077] text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Natural Drainage</span>
            <Droplets className="w-4 h-4 text-[#2B4031]" />
          </div>
          <div className="mt-3">
            <span className="text-lg font-extrabold text-[#2B4031] block truncate">
              {soil?.drainageClass || 'Well drained'}
            </span>
            <span className="text-xs font-semibold text-[#748077]">Water Infiltration Profile</span>
          </div>
          <p className="mt-2 text-xs text-[#748077]">Aeration and percolation dynamics</p>
        </div>
      </div>

      {/* NASA SMAP Soil Moisture Active Passive Analytical Section */}
      <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] p-6 shadow-natural-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#E4E4D9] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2B4031]/10 flex items-center justify-center text-[#2B4031]">
              <Waves className="w-5 h-5 text-[#D48756]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#18251D] flex items-center gap-2">
                NASA SMAP L-Band Soil Moisture & Irrigation Pipeline
                <span className="text-[10px] font-mono bg-[#E5EBDD] text-[#2B4031] px-2 py-0.5 rounded-full border border-[#DCE8D8]">
                  9km EASE-Grid 2.0
                </span>
              </h3>
              <p className="text-xs text-[#748077]">
                Real-time surface (0-5cm) & root-zone (0-100cm) volumetric water content calibrated via Saxton-Rawls pedotransfer hydraulics.
              </p>
            </div>
          </div>

          {moisture && (
            <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${getMoistureBadgeClass(moisture.agronomicMoistureStatus?.stressLevel)}`}>
              {moisture.agronomicMoistureStatus?.stressLevel?.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {loadingMoisture ? (
          <div className="py-8 text-center text-xs text-[#748077] flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[#2B4031] border-t-transparent rounded-full animate-spin" />
            <span>Processing NASA SMAP telemetry & SoilGrids hydraulic limits...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metric 1: Surface Soil Moisture */}
            <div className="p-4 rounded-2xl bg-[#F9FAF9] border border-[#2B4031]/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#3E5C4E]">
                <span className="font-bold flex items-center gap-1.5">
                  <Satellite className="w-3.5 h-3.5 text-[#D48756]" />
                  Surface Moisture (0-5 cm)
                </span>
                <span className="text-[10px] font-mono">SMAP L3_SM_P</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#2B4031]">
                  {moisture?.smapObservations?.surfaceMoisture_0_5cm}
                </span>
                <span className="text-xs font-semibold text-[#748077]">m³/m³</span>
              </div>
              <div className="w-full bg-[#E4E4D9] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#2B4031] h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((moisture?.smapObservations?.surfaceMoisture_0_5cm || 0.2) / (moisture?.hydraulicLimits?.saturationPointVolumetric || 0.5)) * 100)}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-[#748077]">
                Immediate topsoil moisture. Sensitive to diurnal evaporation and recent shower activity.
              </p>
            </div>

            {/* Metric 2: Root-Zone Moisture */}
            <div className="p-4 rounded-2xl bg-[#F9FAF9] border border-[#2B4031]/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#3E5C4E]">
                <span className="font-bold flex items-center gap-1.5">
                  <ArrowDownCircle className="w-3.5 h-3.5 text-[#2B4031]" />
                  Root-Zone Moisture (0-100 cm)
                </span>
                <span className="text-[10px] font-mono">SMAP L4_SM</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#2B4031]">
                  {moisture?.smapObservations?.rootZoneMoisture_0_100cm}
                </span>
                <span className="text-xs font-semibold text-[#748077]">m³/m³</span>
              </div>
              <div className="w-full bg-[#E4E4D9] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#D98245] h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, moisture?.agronomicMoistureStatus?.relativeAvailableMoisturePercent || 50)}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-[#748077]">
                Plant Available Water (PAW): <strong>{moisture?.agronomicMoistureStatus?.relativeAvailableMoisturePercent}%</strong> of capacity.
              </p>
            </div>

            {/* Metric 3: Irrigation Deficit & Guidance */}
            <div className="p-4 rounded-2xl bg-[#F9FAF9] border border-[#2B4031]/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#3E5C4E]">
                <span className="font-bold flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[#D98245]" />
                  Irrigation Deficit (60cm root)
                </span>
                <span className="text-[10px] font-mono">Deficit Depth</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#D48756]">
                  {moisture?.agronomicMoistureStatus?.irrigationDeficitMm}
                </span>
                <span className="text-xs font-semibold text-[#748077]">mm water depth</span>
              </div>
              <p className="text-[11px] font-medium text-[#18251D] leading-snug">
                {moisture?.agronomicMoistureStatus?.actionRecommended}
              </p>
              <div className="text-[10px] text-[#748077] pt-1 border-t border-[#E4E4D9]/60">
                PWP: {moisture?.hydraulicLimits?.permanentWiltingPointVolumetric} • Field Capacity: {moisture?.hydraulicLimits?.fieldCapacityVolumetric} m³/m³
              </div>
            </div>
          </div>
        )}

        {/* Provenance and Reference Information */}
        <div className="p-3 bg-[#F5F7F5] border border-[#2B4031]/10 rounded-2xl flex flex-wrap items-center justify-between text-[11px] text-[#3E5C4E] gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#2B4031]" />
            <span>
              <strong>Scientific Provenance:</strong> {moisture?.provenance?.dataSource} ({moisture?.provenance?.calibrationSpecification})
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#748077]">
            Standard: {moisture?.provenance?.repositoryStandard}
          </span>
        </div>
      </div>

      {/* Soil Texture & Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Texture Fraction Doughnut Chart */}
        <div className="bg-[#FFFEFA] p-6 rounded-3xl border border-[#E4E4D9] shadow-natural-xs">
          <h3 className="text-base font-bold text-[#2B4031] mb-1">Soil Texture Fractions</h3>
          <p className="text-xs text-[#748077] mb-6">USDA particle size class distribution</p>

          <div className="w-48 h-48 mx-auto relative flex items-center justify-center">
            <Doughnut
              data={textureChartData}
              options={{
                cutout: '72%',
                plugins: {
                  legend: { display: false },
                },
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-[#748077] font-medium">Texture</span>
              <span className="text-xs font-bold text-[#2B4031] text-center px-2">
                {soil?.textureClass || 'Clay'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E4E4D9] grid grid-cols-3 text-center text-xs">
            <div>
              <span className="text-[#748077] text-[10px] block font-medium">Clay</span>
              <span className="font-bold text-[#2B4031]">{soil?.clayPct}%</span>
            </div>
            <div>
              <span className="text-[#748077] text-[10px] block font-medium">Sand</span>
              <span className="font-bold text-[#D98245]">{soil?.sandPct}%</span>
            </div>
            <div>
              <span className="text-[#748077] text-[10px] block font-medium">Silt</span>
              <span className="font-bold text-[#72966F]">{soil?.siltPct}%</span>
            </div>
          </div>
        </div>

        {/* Soil Agronomic Suitability & Management Notes */}
        <div className="lg:col-span-2 bg-[#FFFEFA] p-6 rounded-3xl border border-[#E4E4D9] shadow-natural-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-[#2B4031]">
                Agronomic Soil Suitability & Structural Management
              </h3>
              <span className="text-[10px] bg-[#E5EBDD] text-[#2B4031] font-bold px-2.5 py-1 rounded-md border border-[#DCE8D8]">
                Soil Order: {selectedFarm?.soilType}
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {soil?.suitabilityNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F3F1E9] border border-[#E4E4D9] text-xs text-[#29332D] leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#72966F] mt-0.5 shrink-0" />
                  <span>{note}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-[#FAECE1] border border-[#ECC3A2] rounded-2xl text-xs text-[#773E1D] flex items-start gap-3">
              <Info className="w-4 h-4 text-[#D98245] mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-[#BC6935]">Data Provenance Notice: </span>
                Soil physical properties are derived from ISRIC SoilGrids 250m digital soil models. Root-zone volumetric water content is calculated via NASA SMAP L-band radar/radiometer algorithms adhering to USDA Ag Data Commons FAIR standards.
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E4E4D9] flex items-center justify-between text-xs text-[#748077]">
            <span>Soil Texture Class: <strong className="text-[#2B4031]">{soil?.textureClass}</strong></span>
            <span>Bulk Density: <strong className="text-[#2B4031]">{soil?.bulkDensityGPerCm3 || 1.25} g/cm³</strong></span>
          </div>
        </div>
      </div>

      {/* Soil Knowledge & Crop Guide Modal */}
      <SoilKnowledgeModal
        isOpen={showSoilModal}
        onClose={() => setShowSoilModal(false)}
        selectedSoilType={selectedFarm?.soilType}
      />
    </div>
  );
};
