import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Globe2,
  ArrowLeft,
  Sprout,
  Layers,
  CloudSun,
  Shield,
  FileBarChart2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  ExternalLink,
  Sparkles,
  Info,
  Droplets,
  TrendingUp,
  BarChart3,
  Calendar
} from 'lucide-react';
import { FarmShieldApi } from '../services/api';
import { CountryConfig, Crop } from '../types';
import { useFarmShield } from '../context/FarmShieldContext';
import { CountryAgricultureImage } from '../components/common/CountryAgricultureImage';
import { CountryFlag } from '../components/common/CountryFlag';

export const CountryDashboardPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { setSelectedCountryCode, farms } = useFarmShield();
  const [country, setCountry] = useState<CountryConfig | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [agricultureData, setAgricultureData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCountryData() {
      const countryCode = code?.toUpperCase() || 'ET';
      try {
        setLoading(true);
        const [cRes, cropsRes, agriRes] = await Promise.all([
          FarmShieldApi.getCountry(countryCode),
          FarmShieldApi.getCountryCrops(countryCode),
          FarmShieldApi.getCountryAgriculture(countryCode)
        ]);

        if (cRes.success && cRes.data) {
          setCountry(cRes.data);
        }
        if (cropsRes.success && cropsRes.data) {
          setCrops(cropsRes.data);
        }
        if (agriRes.success && agriRes.data) {
          setAgricultureData(agriRes.data);
        }
      } catch (err) {
        console.error('Failed to load country dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCountryData();
  }, [code]);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-[#A9B2A5] flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-[#B5CF78] border-t-transparent rounded-full animate-spin" />
        <span>Loading national agricultural dossier and verified FAO statistics...</span>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="glass-panel p-12 text-center text-sm text-[#A9B2A5] space-y-4">
        <p>Country "{code}" not found in African database.</p>
        <Link to="/countries" className="inline-flex items-center gap-1.5 text-xs text-[#B5CF78] font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to African Country Explorer</span>
        </Link>
      </div>
    );
  }

  const isPilot = country.operationalStatus === 'PILOT_OPERATIONAL' || country.supportStatus === 'fully_supported';
  const countryFarms = farms.filter((f) => f.countryCode === country.isoCode);
  const faoStats = agricultureData?.agriculturalStatistics || {};
  const faoEntries = Object.entries(faoStats);

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/countries')}
            className="p-2.5 rounded-xl bg-[#18251D] text-[#A9B2A5] hover:text-white hover:bg-[#111913] border border-[#A6C487]/20 transition-colors"
            title="Back to Explorer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <CountryFlag countryCode={country.isoCode} countryName={country.name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{country.name}</h1>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#111913] text-[#B5CF78] border border-[#B5CF78]/30">
                  {country.isoCode} / {country.isoAlpha3}
                </span>
              </div>
              <p className="text-xs text-[#A9B2A5]">
                Capital: <strong className="text-white">{country.capital || 'N/A'}</strong> • Region: <strong className="text-white">{country.region}</strong> • Currency: {country.currency?.name} ({country.currency?.symbol})
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedCountryCode(country.isoCode);
              navigate('/map');
            }}
            className="px-4 py-2 rounded-xl bg-[#B5CF78] text-[#111913] hover:bg-[#A0BC66] font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-[#B5CF78]/20"
          >
            <MapPin className="w-4 h-4" />
            <span>Explore on Map</span>
          </button>

          <Link
            to={`/ai-assistant?country=${country.isoCode}`}
            className="px-4 py-2 rounded-xl bg-[#18251D] text-white hover:bg-[#111913] border border-[#A6C487]/25 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-[#E4BA6D]" />
            <span>Ask AI About {country.name}</span>
          </Link>
        </div>
      </div>

      {/* Hero Geographic & Territorial Landscape Banner */}
      <CountryAgricultureImage
        countryCode={country.isoCode}
        countryName={country.name}
        imageUrl={country.countryImage}
        caption={country.imageCaption}
        agricultureSubject={country.agriculturalRegions?.[0] || 'Agronomic Observation Zone'}
        aspectRatio="wide"
      />

      {/* Operational Notice for Non-Pilot Countries */}
      {!isPilot && (
        <div className="glass-panel p-4 flex items-start gap-3 border-amber-500/30">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-[#A9B2A5] space-y-1">
            <h4 className="font-bold text-white">Directory Profile & Continental Remote Sensing Active</h4>
            <p>
              {country.name} is included with complete national boundaries, capital profile, and satellite coverage (CHIRPS precipitation, NASA POWER solar/temperature, and ISRIC SoilGrids). Granular subnational field trials are staged progressively. Extension researchers can supply proprietary data via the <Link to="/data-import" className="underline font-bold text-[#B5CF78]">Data Import Portal</Link>.
            </p>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between text-xs text-[#A9B2A5]">
            <span>Agricultural Regions</span>
            <Building2 className="w-4 h-4 text-[#B5CF78]" />
          </div>
          <div className="text-xl font-extrabold text-white mt-2">
            {country.agriculturalRegions?.length || 0} Identified
          </div>
          <p className="text-[11px] text-[#A9B2A5] mt-1 truncate">
            {country.agriculturalRegions ? country.agriculturalRegions.slice(0, 2).join(', ') : 'Pan-African agro-zones'}
          </p>
        </div>

        <div className="glass-panel p-4">
          <div className="flex items-center justify-between text-xs text-[#A9B2A5]">
            <span>Verified Crop Packages</span>
            <Sprout className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-white mt-2">
            {crops.length} Crops
          </div>
          <p className="text-[11px] text-[#A9B2A5] mt-1">
            Integrated in agronomic database
          </p>
        </div>

        <div className="glass-panel p-4">
          <div className="flex items-center justify-between text-xs text-[#A9B2A5]">
            <span>Registered Field Parcels</span>
            <MapPin className="w-4 h-4 text-[#B5CF78]" />
          </div>
          <div className="text-xl font-extrabold text-[#B5CF78] mt-2">
            {countryFarms.length} Farms Mapped
          </div>
          <p className="text-[11px] text-[#A9B2A5] mt-1">
            {countryFarms.filter(f => !!f.boundaryGeoJson).length} with verified polygon boundary
          </p>
        </div>

        <div className="glass-panel p-4">
          <div className="flex items-center justify-between text-xs text-[#A9B2A5]">
            <span>Operational Status</span>
            <Shield className="w-4 h-4 text-[#B5CF78]" />
          </div>
          <div className="text-xl font-extrabold text-white mt-2">
            {country.operationalStatus === 'PILOT_OPERATIONAL' ? 'Pilot Operational' : 'Directory Profile'}
          </div>
          <p className="text-[11px] text-[#A9B2A5] mt-1">
            Status: {country.operationalStatus}
          </p>
        </div>
      </div>

      {/* Section: Official FAOSTAT National Agricultural Production & Yields */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#A6C487]/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#B5CF78]/10 text-[#B5CF78] border border-[#B5CF78]/20">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-white">
                Official Agricultural Production & Yield Statistics (FAOSTAT / FAO Agro-MAPS)
              </h3>
              <p className="text-xs text-[#A6C487]">
                Official national production aggregates and average crop yields compiled from FAOSTAT QCL Domain.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[#111913] text-[#B5CF78] border border-[#B5CF78]/30 shrink-0">
            FAO Area Code {country.isoCode}
          </span>
        </div>

        {faoEntries.length === 0 ? (
          <div className="p-6 bg-[#111913]/60 rounded-2xl border border-[#A6C487]/15 text-center text-xs text-[#A6C487]">
            National production statistics for {country.name} are pending official FAOSTAT synchronization or scheduled census upload.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {faoEntries.map(([cropId, stats]: [string, any]) => (
              <div key={cropId} className="p-4 rounded-2xl bg-[#111913]/70 border border-[#A6C487]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white capitalize">{cropId.replace('_', ' ')}</h4>
                  <span className="text-[10px] font-mono text-[#A6C487]">Official QCL</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#A6C487]/10 text-[11px]">
                  <div>
                    <span className="text-[#A6C487] block text-[10px]">Production</span>
                    <strong className="text-white font-mono">
                      {stats.productionTonnes ? `${(stats.productionTonnes / 1000).toLocaleString()} kt` : 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#A6C487] block text-[10px]">Harvested Area</span>
                    <strong className="text-white font-mono">
                      {stats.areaHarvestedHa ? `${(stats.areaHarvestedHa / 1000).toLocaleString()} kha` : 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#A6C487] block text-[10px]">Average Yield</span>
                    <strong className="text-[#B5CF78] font-mono">
                      {stats.yieldKgPerHa ? `${stats.yieldKgPerHa.toLocaleString()} kg/ha` : 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-[#111913]/50 rounded-xl border border-[#A6C487]/10 text-[11px] text-[#A6C487] flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Scientific Transparency Note:</strong> National statistics represent macroeconomic country totals. They provide regional benchmarking context and are NEVER presented as individual farm measurements.
          </span>
        </div>
      </div>

      {/* Main Grid: Data Availability (Left) + National Crop Portfolio (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FileBarChart2 className="w-5 h-5 text-[#B5CF78]" />
                Dataset & Remote Sensing Layer Audit
              </h3>
              <span className="text-xs text-[#A6C487] font-mono">Verified Pipelines</span>
            </div>

            <div className="space-y-3">
              {[
                { label: 'CHIRPS Daily Precipitation (0.05°)', status: 'LIVE', desc: '5km daily rainfall observations & SPI drought anomaly' },
                { label: 'NASA POWER Agroclimatology', status: 'LIVE', desc: 'Solar radiation, temperature mean/max/min & humidity' },
                { label: 'ISRIC SoilGrids 2.0 (250m)', status: 'LIVE', desc: 'Pedological layers: pH, clay, sand, silt, CEC & organic carbon' },
                { label: 'NASA SMAP L-Band Soil Moisture (9km)', status: 'LIVE', desc: 'Topsoil (0-5cm) & Root-zone (0-100cm) volumetric moisture' },
                { label: 'Copernicus Sentinel-2 L2A (10m)', status: 'LIVE', desc: 'Multispectral Red & NIR bands for NDVI vegetation vigor' },
                { label: 'FAO WaPOR 3.0 Water Productivity', status: 'LIVE', desc: 'Continental 100m evapotranspiration (AETI) & biomass water productivity' },
                { label: 'National Extension Crop Calendars', status: isPilot ? 'LIVE' : 'EXTENSION_GENERAL', desc: 'Phenological stages, planting windows & harvest dates' },
              ].map((ds, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#111913]/60 border border-[#A6C487]/15 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{ds.label}</div>
                    <div className="text-[11px] text-[#A9B2A5]">{ds.desc}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      ds.status === 'LIVE'
                        ? 'bg-[#B5CF78]/20 text-[#B5CF78] border border-[#B5CF78]/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {ds.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* National Crop Portfolio */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Sprout className="w-5 h-5 text-amber-400" />
                National Crop Portfolio & Suitability ({crops.length})
              </h3>
              <Link to="/crops" className="text-xs text-[#B5CF78] font-semibold hover:underline">
                View Crop Database &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {crops.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-[#111913]/60 border border-[#A6C487]/15 text-xs space-y-1">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>{c.name}</span>
                    <span className="text-[10px] text-[#A6C487] font-mono">{c.category}</span>
                  </div>
                  <div className="text-[10px] text-[#A9B2A5] italic">{c.scientificName}</div>
                  <div className="text-[10px] text-[#A9B2A5]">
                    Cycle: {c.growingDurationDays ? `${c.growingDurationDays.min}-${c.growingDurationDays.max} days` : 'Variable'}
                  </div>
                  <div className="text-[10px] text-[#A6C487]">
                    Water: {c.waterRequirementsMm?.min}-{c.waterRequirementsMm?.max} mm
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
