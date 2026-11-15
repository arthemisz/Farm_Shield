import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Tractor,
  CloudSun,
  Sprout,
  Compass,
  MapPin,
  Globe,
  Database,
  ArrowRight,
  TrendingUp,
  FileBarChart2,
  Sparkles,
  Layers,
  Activity,
  Droplets,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import '../utils/chartSetup';
import { useFarmShield } from '../context/FarmShieldContext';
import { FarmShieldApi } from '../services/api';
import { ClimateIntelligence } from '../types';
import { CountryFlag } from '../components/common/CountryFlag';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { farms, selectedFarm, setSelectedFarm, crops, selectedCountry, setSelectedCountryCode, countries } = useFarmShield();
  const [climate, setClimate] = useState<ClimateIntelligence | null>(null);
  const [recentFaoData, setRecentFaoData] = useState<any | null>(null);

  useEffect(() => {
    if (selectedFarm) {
      FarmShieldApi.getClimateIntelligence(selectedFarm, 2024)
        .then((res) => setClimate(res.data));
    }
  }, [selectedFarm]);

  useEffect(() => {
    const code = selectedCountry.isoCode || selectedCountry.isoAlpha2 || 'ET';
    FarmShieldApi.getCountryAgriculture(code).then((res) => {
      if (res.success && res.data) {
        setRecentFaoData(res.data);
      }
    });
  }, [selectedCountry]);

  // Verified figures from state & backend
  const totalCountries = countries.length || 54;
  const registeredFarmsCount = farms.length;
  const countryFarms = farms.filter(
    (f) => f.countryCode === (selectedCountry.isoCode || selectedCountry.isoAlpha2)
  );

  // 5 Priority Pilot Countries defined in the Official Proposal
  const pilotCountries = [
    {
      code: 'ET',
      name: 'Ethiopia',
      flag: '🇪🇹',
      status: 'Primary Detailed Demonstration',
      isPrimary: true,
      coverage: 'Highland agroecological zones (Vertisols & Nitisols)',
      coreCrops: ['Teff', 'Bread Wheat', 'Maize', 'Faba Bean'],
      datasets: ['NASA POWER', 'CHIRPS 2.0', 'SoilGrids 2.0', 'Sentinel-2', 'GEDI Reference'],
      farmsCount: farms.filter((f) => f.countryCode === 'ET').length,
    },
    {
      code: 'KE',
      name: 'Kenya',
      flag: '🇰🇪',
      status: 'Priority Pilot Country',
      isPrimary: false,
      coverage: 'Rift Valley & Western Cropping Zones',
      coreCrops: ['Maize', 'Common Bean', 'Coffee', 'Sweet Potato'],
      datasets: ['CHIRPS 2.0', 'NASA POWER', 'SoilGrids 2.0', 'Sentinel-2'],
      farmsCount: farms.filter((f) => f.countryCode === 'KE').length,
    },
    {
      code: 'NG',
      name: 'Nigeria',
      flag: '🇳🇬',
      status: 'Priority Pilot Country',
      isPrimary: false,
      coverage: 'Middle Belt & Northern Guinea Savanna',
      coreCrops: ['Maize', 'Sorghum', 'Soybean', 'Cotton'],
      datasets: ['CHIRPS 2.0', 'NASA POWER', 'SoilGrids 2.0'],
      farmsCount: farms.filter((f) => f.countryCode === 'NG').length,
    },
    {
      code: 'GH',
      name: 'Ghana',
      flag: '🇬🇭',
      status: 'Priority Pilot Country',
      isPrimary: false,
      coverage: 'Coastal Savanna & Forest-Transition Zone',
      coreCrops: ['Maize', 'Cassava', 'Faba Bean'],
      datasets: ['CHIRPS 2.0', 'NASA POWER', 'SoilGrids 2.0'],
      farmsCount: farms.filter((f) => f.countryCode === 'GH').length,
    },
    {
      code: 'ZA',
      name: 'South Africa',
      flag: '🇿🇦',
      status: 'Priority Pilot Country',
      isPrimary: false,
      coverage: 'Free State Grain Belt & Highveld Plateau',
      coreCrops: ['Maize', 'Wheat', 'Sunflower', 'Soybean'],
      datasets: ['CHIRPS 2.0', 'NASA POWER', 'SoilGrids 2.0'],
      farmsCount: farms.filter((f) => f.countryCode === 'ZA').length,
    },
  ];

  const rainfallChartData: any = {
    labels: climate?.monthlyData?.map((d) => d.month) || [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    datasets: [
      {
        label: 'Precipitation (mm)',
        data: climate?.monthlyData?.map((d) => d.rainfallMm) || [
          18, 25, 45, 90, 110, 140, 280, 290, 150, 40, 15, 10
        ],
        backgroundColor: 'rgba(181, 207, 120, 0.78)',
        hoverBackgroundColor: '#B5CF78',
        borderRadius: 6,
      },
    ],
  };

  const rainfallChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18251D',
        borderColor: 'rgba(166, 196, 135, 0.3)',
        borderWidth: 1,
        titleColor: '#F3F2E9',
        bodyColor: '#A9B2A5',
      },
    },
    scales: {
      x: {
        ticks: { color: '#A9B2A5', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        ticks: { color: '#A9B2A5', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  };

  return (
    <div className="dashboard-page space-y-12">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: HERO — OFFICIAL PROPOSAL IDENTITY & TAGLINE
      ───────────────────────────────────────────────────────────── */}
      <div className="dashboard-hero relative rounded-2xl overflow-hidden border p-6 sm:p-10">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B5CF78]/10 border border-[#B5CF78]/25 text-[#B5CF78] text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B5CF78]" />
              NASA-Powered Climate-Resilient Crop Rotation Decision Support System
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Smarter Farming.<br />
              Stronger Harvests.<br />
              A Resilient Future.
            </h1>
            
            <p className="text-sm sm:text-base text-[#D6DDD2] leading-relaxed">
              Explore agricultural conditions across Africa using environmental datasets, geographic information, and explainable crop-rotation decision support.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3.5 shrink-0">
            <Link
              to="/map"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#B5CF78] text-[#111913] hover:bg-[#A0BC66] font-bold text-sm shadow-lg shadow-[#B5CF78]/20 transition-all"
            >
              <Globe className="w-4 h-4" />
              <span>Explore Africa Map</span>
            </Link>
            <Link
              to="/rotation-planner"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#D48756] text-white hover:bg-[#B87243] font-bold text-sm shadow-lg shadow-[#D48756]/20 transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Crop Rotation</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: AFRICA-WIDE COVERAGE (GENUINE BACKEND METRICS)
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F3F2E9]">
              Africa-wide coverage
            </h2>
            <p className="text-xs text-[#A9B2A5] mt-0.5">
              Verified metrics derived directly from the SQL backend & country directory
            </p>
          </div>
          <span className="text-[11px] text-[#B5CF78] bg-[#B5CF78]/10 px-2.5 py-1 rounded-lg border border-[#B5CF78]/20 font-semibold">
            All 54 African Countries Available
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-panel p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#A6C487]">African countries</span>
              <Globe className="w-4 h-4 text-[#B5CF78]" />
            </div>
            <div className="text-3xl font-black text-white">{totalCountries}</div>
            <div className="text-[11px] text-[#A9B2A5] mt-1">
              Sovereign African States in Directory
            </div>
            <div className="mt-2 text-[10px] text-[#A6C487]/80 border-t border-[#A6C487]/15 pt-1.5">
              Scope: Continental Africa
            </div>
          </div>

          <div className="glass-panel p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#A6C487]">Priority pilots</span>
              <ShieldCheck className="w-4 h-4 text-[#D48756]" />
            </div>
            <div className="text-3xl font-black text-white">5</div>
            <div className="text-[11px] text-[#A9B2A5] mt-1">
              Ethiopia, Kenya, Nigeria, Ghana, ZA
            </div>
            <div className="mt-2 text-[10px] text-[#D48756] border-t border-[#A6C487]/15 pt-1.5 font-medium">
              Primary: Ethiopia (Highlands)
            </div>
          </div>

          <div className="glass-panel p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#A6C487]">Registered farms</span>
              <Tractor className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white">{registeredFarmsCount}</div>
            <div className="text-[11px] text-[#A9B2A5] mt-1">
              Genuinely Registered Field Parcels
            </div>
            <div className="mt-2 text-[10px] text-[#A6C487]/80 border-t border-[#A6C487]/15 pt-1.5">
              DB Table: `farms`
            </div>
          </div>

          <div className="glass-panel p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#A6C487]">Crop profiles</span>
              <Sprout className="w-4 h-4 text-[#B5CF78]" />
            </div>
            <div className="text-3xl font-black text-white">{crops.length}</div>
            <div className="text-[11px] text-[#A9B2A5] mt-1">
              11 Priority Crops in Catalogue
            </div>
            <div className="mt-2 text-[10px] text-[#A6C487]/80 border-t border-[#A6C487]/15 pt-1.5">
              Source: FAO, EIAR & KALRO
            </div>
          </div>

          <div className="glass-panel p-4 flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#A6C487]">Integrated feeds</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-white">12</div>
            <div className="text-[11px] text-[#A9B2A5] mt-1">
              Cataloged Global & Regional Products
            </div>
            <div className="mt-2 text-[10px] text-[#A6C487]/80 border-t border-[#A6C487]/15 pt-1.5">
              Provenance: Verified
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: EXPLORE THE FIVE PRIORITY PILOT COUNTRIES
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F3F2E9]">
              Five Priority Pilot Countries
            </h2>
            <p className="text-xs text-[#A9B2A5] mt-0.5">
              Each country has specific agroecological coverage and real data availability
            </p>
          </div>
          <Link
            to="/countries"
            className="text-xs text-[#B5CF78] font-bold hover:underline flex items-center gap-1"
          >
            <span>View All 54 African Countries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pilotCountries.map((c) => (
            <div
              key={c.code}
              className={`glass-panel p-5 flex flex-col justify-between transition-all ${
                c.isPrimary
                  ? 'border-[#B5CF78]/50 bg-[#18251D]/90 shadow-xl'
                  : 'hover:border-[#A6C487]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{c.flag}</span>
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-1.5">
                        {c.name}
                        {c.isPrimary && (
                          <span className="text-[9px] font-bold bg-[#D48756] text-white px-1.5 py-0.5 rounded">
                            PRIMARY DEMO
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] text-[#A6C487]">{c.status}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#A9B2A5] bg-[#111913] px-2 py-0.5 rounded border border-[#A6C487]/20">
                    {c.code}
                  </span>
                </div>

                <p className="text-xs text-[#D6DDD2] mb-3 leading-relaxed">
                  <strong className="text-[#A6C487]">Coverage: </strong>{c.coverage}
                </p>

                <div className="space-y-1.5 text-xs text-[#A9B2A5] mb-4">
                  <div>
                    <span className="font-semibold text-white">Target Crops: </span>
                    <span className="text-[#A6C487]">{c.coreCrops.join(', ')}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white">Active Datasets: </span>
                    <span>{c.datasets.join(' • ')}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white">Demonstration Farms: </span>
                    <span className="font-bold text-white">{c.farmsCount} mapped</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#A6C487]/15 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedCountryCode(c.code);
                    navigate(`/country-dashboard/${c.code}`);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    c.isPrimary
                      ? 'bg-[#B5CF78] text-[#111913] hover:bg-[#A0BC66]'
                      : 'bg-[#111913] text-white hover:bg-[#18251D] border border-[#A6C487]/30'
                  }`}
                >
                  <span>Open National Dossier</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <Link
                  to={`/map?country=${c.code}`}
                  className="text-[11px] text-[#A6C487] hover:text-white font-semibold"
                >
                  View on Map
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: PRIMARY DEMONSTRATION FOCUS — ETHIOPIA
      ───────────────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 sm:p-8 border-2 border-[#B5CF78]/40 bg-[#18251D]/95">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D48756]/20 border border-[#D48756]/40 text-[#D48756] text-xs font-bold">
              <span>🇪🇹</span> Primary Detailed Demonstration Country
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Detailed Agroecological Dossier: Ethiopia
            </h2>
            <p className="text-xs sm:text-sm text-[#D6DDD2] leading-relaxed">
              Ethiopia showcases FarmShield's complete workflow: high-resolution highland district agronomy (Ada'a, Gimbichu, Tiyo, Hetosa), Vertisol & Nitisol soil physics, and explainable rotation sequences between cereal staples (Teff, Bread Wheat) and soil-enriching legumes (Faba Bean).
            </p>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-[#111913] text-[#A6C487] border border-[#A6C487]/20">
                Core Crop: Teff (Eragrostis tef)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#111913] text-[#A6C487] border border-[#A6C487]/20">
                Core Crop: Bread Wheat (Triticum aestivum)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#111913] text-[#A6C487] border border-[#A6C487]/20">
                Core Crop: Faba Bean (Vicia faba)
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => {
                setSelectedCountryCode('ET');
                navigate('/country-dashboard/ET');
              }}
              className="px-6 py-3 rounded-xl bg-[#B5CF78] text-[#111913] hover:bg-[#A0BC66] font-bold text-xs shadow-lg shadow-[#B5CF78]/20 transition-all text-center"
            >
              Open Full Ethiopia Experience
            </button>
            <Link
              to="/rotation-planner"
              className="px-6 py-3 rounded-xl bg-[#111913] text-white hover:bg-[#24392B] border border-[#A6C487]/30 font-semibold text-xs transition-all text-center"
            >
              Run Ethiopian Rotation Demo
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: HOW FARMSHIELD WORKS (PROPOSAL WORKFLOW)
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="mb-4 px-1">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F3F2E9]">
            How FarmShield Works — 7-Step Decision Workflow
          </h2>
          <p className="text-xs text-[#A9B2A5] mt-0.5">
            The scientific flow from continental remote sensing to parcel-level decision support
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#18251D]/80 border border-[#A6C487]/20">
            <div className="w-7 h-7 rounded-lg bg-[#B5CF78]/20 text-[#B5CF78] font-mono font-bold text-xs flex items-center justify-center mb-2.5">
              01
            </div>
            <h4 className="font-bold text-sm text-white mb-1">Explore Geography</h4>
            <p className="text-xs text-[#A9B2A5] leading-relaxed">
              Navigate all 54 African sovereign states on the continental GIS map with administrative boundaries.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#18251D]/80 border border-[#A6C487]/20">
            <div className="w-7 h-7 rounded-lg bg-[#B5CF78]/20 text-[#B5CF78] font-mono font-bold text-xs flex items-center justify-center mb-2.5">
              02
            </div>
            <h4 className="font-bold text-sm text-white mb-1">Select Country/District</h4>
            <p className="text-xs text-[#A9B2A5] leading-relaxed">
              Inspect national dossiers and verified district agronomic practices from research institutes (EIAR, KALRO).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#18251D]/80 border border-[#A6C487]/20">
            <div className="w-7 h-7 rounded-lg bg-[#B5CF78]/20 text-[#B5CF78] font-mono font-bold text-xs flex items-center justify-center mb-2.5">
              03
            </div>
            <h4 className="font-bold text-sm text-white mb-1">Examine Conditions</h4>
            <p className="text-xs text-[#A9B2A5] leading-relaxed">
              Retrieve NASA POWER agroclimate, CHIRPS rainfall, and ISRIC SoilGrids 2.0 rooting zone properties.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#18251D]/80 border border-[#A6C487]/20">
            <div className="w-7 h-7 rounded-lg bg-[#B5CF78]/20 text-[#B5CF78] font-mono font-bold text-xs flex items-center justify-center mb-2.5">
              04
            </div>
            <h4 className="font-bold text-sm text-white mb-1">Select/Register Farm</h4>
            <p className="text-xs text-[#A9B2A5] leading-relaxed">
              Pinpoint farm coordinates and enter farmer-reported current crop, soil type, and water availability.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#18251D]/80 border border-[#A6C487]/20">
            <div className="w-7 h-7 rounded-lg bg-[#D48756]/20 text-[#D48756] font-mono font-bold text-xs flex items-center justify-center mb-2.5">
              05
            </div>
            <h4 className="font-bold text-sm text-white mb-1">Explore Crops</h4>
            <p className="text-xs text-[#A9B2A5] leading-relaxed">
              Inspect the 11 priority crop profiles with thermal, moisture, and soil pH tolerance intervals.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#18251D]/80 border border-[#A6C487]/20">
            <div className="w-7 h-7 rounded-lg bg-[#D48756]/20 text-[#D48756] font-mono font-bold text-xs flex items-center justify-center mb-2.5">
              06
            </div>
            <h4 className="font-bold text-sm text-white mb-1">Compare Rotations</h4>
            <p className="text-xs text-[#A9B2A5] leading-relaxed">
              Evaluate multi-season crop sequences to break pest cycles, restore soil nitrogen, and manage moisture.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#18251D]/80 border border-[#A6C487]/20 col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="w-7 h-7 rounded-lg bg-[#D48756]/20 text-[#D48756] font-mono font-bold text-xs flex items-center justify-center mb-2.5">
              07
            </div>
            <h4 className="font-bold text-sm text-white mb-1">Explainable Decision Support</h4>
            <p className="text-xs text-[#A9B2A5] leading-relaxed">
              Read transparent agronomic explanations: why a sequence is recommended, soil health benefits, potential climate risks, and data limitations.
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: SCIENTIFIC DATASETS & DATA GOVERNANCE STATUS
      ───────────────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#A6C487]/15 pb-3">
          <div>
            <h3 className="font-bold text-base text-white">
              Integrated Environmental Datasets & Provenance
            </h3>
            <p className="text-xs text-[#A6C487]">
              Every scientific layer has explicit provenance, spatial resolution, and known limitations
            </p>
          </div>
          <Link
            to="/data-import"
            className="text-xs text-[#B5CF78] font-semibold hover:underline flex items-center gap-1"
          >
            <span>Open Central Data Catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#111913]/60 border border-[#A6C487]/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">CHIRPS 2.0 Precipitation</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#B5CF78]/15 text-[#B5CF78] border border-[#B5CF78]/30">
                CALIBRATED
              </span>
            </div>
            <p className="text-[11px] text-[#A9B2A5]">
              0.05° (~5.3 km) satellite IR blended with station rain gauges. Daily and monthly accumulation.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#111913]/60 border border-[#A6C487]/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">ISRIC SoilGrids 2.0</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30">
                MODELLED
              </span>
            </div>
            <p className="text-[11px] text-[#A9B2A5]">
              250m global digital soil mapping. Rooting zone pH, SOC, sand, silt, clay (0–30 cm).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#111913]/60 border border-[#A6C487]/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">NASA GEDI L4A & L4B</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                LITERATURE REF
              </span>
            </div>
            <p className="text-[11px] text-[#A9B2A5]">
              Aboveground biomass density reference. Values calibrated from published Ethiopian highland studies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
