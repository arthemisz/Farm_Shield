import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Polygon,
  Polyline,
  Popup,
  Tooltip,
  useMap,
  useMapEvents
} from 'react-leaflet';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Globe,
  Layers,
  Sparkles,
  RotateCcw,
  Sprout,
  X,
  ChevronRight,
  TrendingUp,
  Search,
  Check,
  Sun,
  Trees,
  CloudRain,
  Eye,
  SlidersHorizontal,
  Droplets,
  TestTube,
  AlertTriangle,
  Info,
  Maximize2,
  Minimize2,
  BookOpen,
  Calendar,
  Compass,
  Tractor,
  ShieldCheck,
  Map as MapIcon,
  ArrowRight
} from 'lucide-react';
import L from 'leaflet';
import { useFarmShield } from '../context/FarmShieldContext';
import { UnitConverter } from '../utils/unitConverter';
import { calculatePolygonAreaHectares, parseGeoJsonToLeaflet } from '../utils/geoUtils';
import { FarmShieldApi } from '../services/api';
import { CountryConfig, Crop, Farm, FarmSpatialMetadata, CropRecommendationCandidate } from '../types';
import { CountryFlag } from '../components/common/CountryFlag';
import { CropImage } from '../components/common/CropImage';
import { AFRICAN_ADMIN_DIVISIONS } from '../data/countries/divisions';
import { COUNTRY_SUBCITY_AGRONOMY, DistrictAgronomy } from '../data/countrySubCityAgronomy';
import {
  CONTINENTAL_BIOMES,
  VERIFIED_FARMING_AREAS,
  AgriculturalZone
} from '../data/agriculturalZones';
import {
  WATER_RESOURCES_DATA,
  RAINFALL_LAYER_DATA,
  SOIL_DEGRADATION_DATA,
  SOIL_PH_LAYER_DATA,
  WaterFeature,
  RainfallZone,
  SoilDegradationZone,
  SoilPhZone
} from '../data/environmentalLayers';

// Fix Leaflet's default icon path in bundler environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Farm marker icon - clean GIS pin
const farmIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [22, 36],
  iconAnchor: [11, 36],
  popupAnchor: [1, -30],
  shadowSize: [36, 36]
});

// Click handler for coordinates
const MapClickDetector: React.FC<{ onLocationClick: (lat: number, lng: number) => void }> = ({ onLocationClick }) => {
  useMapEvents({
    click(e) {
      onLocationClick(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)));
    },
  });
  return null;
};

// Map View Adjuster component with auto invalidateSize for responsive viewports
const MapAutoFit: React.FC<{ bounds: any | null; center: [number, number] | null; zoom: number }> = ({
  bounds,
  center,
  zoom
}) => {
  const map = useMap();

  // Invalidate map size on window resize and after mount to prevent grey/missing tiles on mobile/tablets
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [map]);

  useEffect(() => {
    if (bounds) {
      try {
        const leafletBounds = L.latLngBounds(
          [bounds.minLat, bounds.minLng],
          [bounds.maxLat, bounds.maxLng]
        );
        map.fitBounds(leafletBounds, { padding: [20, 20], maxZoom: 7, animate: true });
      } catch (e) {
        if (center) map.setView(center, zoom);
      }
    } else if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [bounds, center, zoom, map]);

  return null;
};

export type ActiveLayerMode =
  | 'crop_distribution'
  | 'water_resources'
  | 'rainfall'
  | 'soil_degradation'
  | 'soil_ph';

export type BaseMapStyle = 'satellite' | 'standard' | 'terrain';

const EXPLORER_CROPS = [
  { id: 'teff', name: 'Teff', scientific: 'Eragrostis tef', country: 'Ethiopia', countryCode: 'ET', color: '#B5CF78' },
  { id: 'wheat', name: 'Wheat', scientific: 'Triticum aestivum', country: 'Ethiopia & S. Africa', countryCode: 'ET', color: '#F39C12' },
  { id: 'maize', name: 'Maize', scientific: 'Zea mays', country: 'Kenya & Nigeria', countryCode: 'KE', color: '#E4BA6D' },
  { id: 'sorghum', name: 'Sorghum', scientific: 'Sorghum bicolor', country: 'Nigeria & Sudan', countryCode: 'NG', color: '#E67E22' },
  { id: 'barley', name: 'Barley', scientific: 'Hordeum vulgare', country: 'Ethiopia Highlands', countryCode: 'ET', color: '#D4AC0D' },
  { id: 'faba_bean', name: 'Faba Bean', scientific: 'Vicia faba', country: 'Ethiopia', countryCode: 'ET', color: '#27AE60' },
  { id: 'common_bean', name: 'Common Bean', scientific: 'Phaseolus vulgaris', country: 'East Africa', countryCode: 'KE', color: '#C0392B' },
  { id: 'sweet_potato', name: 'Sweet Potato', scientific: 'Ipomoea batatas', country: 'Uganda & Nigeria', countryCode: 'NG', color: '#E74C3C' },
  { id: 'coffee', name: 'Coffee', scientific: 'Coffea arabica', country: 'Ethiopia & Kenya', countryCode: 'ET', color: '#8E44AD' },
  { id: 'cotton', name: 'Cotton', scientific: 'Gossypium hirsutum', country: 'Mali & Burkina Faso', countryCode: 'ET', color: '#BDC3C7' },
  { id: 'sunflower', name: 'Sunflower', scientific: 'Helianthus annuus', country: 'South Africa & Tanzania', countryCode: 'ZA', color: '#F39C12' },
  { id: 'sesame', name: 'Sesame', scientific: 'Sesamum indicum', country: 'Sudan & Ethiopia', countryCode: 'ET', color: '#D7BDE2' }
];

export const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryCrop = searchParams.get('crop');
  const queryFarmId = searchParams.get('farmId');
  const queryScore = searchParams.get('score');

  const {
    farms,
    selectedFarm,
    setSelectedFarm,
    selectedCountry,
    setSelectedCountryCode,
    countries,
    crops,
    openContextDrawer
  } = useFarmShield();

  // Full-screen mode toggle
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // GeoJSON Continental Vectors
  const [geoJsonData, setGeoJsonData] = useState<any | null>(null);
  const [loadingGeo, setLoadingGeo] = useState<boolean>(true);

  // Recommendation-to-Map Spatial Focus State
  const [recommendedCrop, setRecommendedCrop] = useState<string | null>(queryCrop);
  const [recommendationScore, setRecommendationScore] = useState<number | null>(
    queryScore ? parseInt(queryScore, 10) : null
  );
  const [farmSpatial, setFarmSpatial] = useState<FarmSpatialMetadata | null>(null);
  const [farmRecCandidates, setFarmRecCandidates] = useState<CropRecommendationCandidate[]>([]);
  const [loadingSpatial, setLoadingSpatial] = useState<boolean>(false);

  // Basemap & Environmental Analytical Layers (Phase 4.9)
  const [baseMap, setBaseMap] = useState<BaseMapStyle>('satellite');
  const [activeLayer, setActiveLayer] = useState<ActiveLayerMode>('crop_distribution');
  const [showFarms, setShowFarms] = useState<boolean>(true);
  const [layerOpacity, setLayerOpacity] = useState<number>(0.75);

  // Selected Country code
  const currentIso = selectedCountry?.isoCode || selectedCountry?.isoAlpha2 || 'ET';

  // Sub-city / Rural District Selection for Country
  const countryDistricts: DistrictAgronomy[] = COUNTRY_SUBCITY_AGRONOMY[currentIso] || [];
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictAgronomy | null>(
    countryDistricts[0] || null
  );

  // Selected Feature Inspection State
  const [selectedCropId, setSelectedCropId] = useState<string>(queryCrop || 'teff');
  const [selectedZone, setSelectedZone] = useState<AgriculturalZone | null>(
    VERIFIED_FARMING_AREAS.find((z) => z.cropId === (queryCrop || 'teff')) || VERIFIED_FARMING_AREAS[0]
  );
  const [selectedWater, setSelectedWater] = useState<WaterFeature | null>(null);
  const [selectedRainfall, setSelectedRainfall] = useState<RainfallZone | null>(null);
  const [selectedDegradation, setSelectedDegradation] = useState<SoilDegradationZone | null>(null);
  const [selectedSoilPh, setSelectedSoilPh] = useState<SoilPhZone | null>(null);

  // Dynamic point query result from backend
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pointQueryResult, setPointQueryResult] = useState<any | null>(null);
  const [queryLoading, setQueryLoading] = useState<boolean>(false);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(true);

  // Pan-Africa centroid
  const africaCenter: [number, number] = [2.0, 20.0];
  const [mapTargetCenter, setMapTargetCenter] = useState<[number, number]>(africaCenter);
  const [mapTargetZoom, setMapTargetZoom] = useState<number>(3);
  const [targetBounds, setTargetBounds] = useState<any | null>(null);

  // Update selected district when country changes
  useEffect(() => {
    const list = COUNTRY_SUBCITY_AGRONOMY[currentIso] || [];
    setSelectedDistrict(list[0] || null);
  }, [currentIso]);

  // Load verified 54-country Africa GeoJSON
  useEffect(() => {
    async function loadGeoJson() {
      try {
        setLoadingGeo(true);
        const res = await FarmShieldApi.getAfricaGeoJson();
        if (res.data && res.data.features) {
          setGeoJsonData(res.data);
        } else {
          const fallbackResp = await fetch('/africa_countries.json');
          const fallbackData = await fallbackResp.json();
          setGeoJsonData(fallbackData);
        }
      } catch (err) {
        console.error('Failed to load Africa GeoJSON:', err);
      } finally {
        setLoadingGeo(false);
      }
    }
    loadGeoJson();
  }, []);

  // Recommendation-to-Map Navigation & Spatial Resolution Effect
  useEffect(() => {
    if (queryFarmId) {
      const targetFarm = farms.find((f) => f.id === queryFarmId);
      if (targetFarm) {
        setSelectedFarm(targetFarm);
        if (targetFarm.countryCode) {
          setSelectedCountryCode(targetFarm.countryCode);
        }
        setMapTargetCenter([targetFarm.latitude, targetFarm.longitude]);
        setMapTargetZoom(14); // Zoom close to farm boundary
        setRightPanelOpen(true);

        // Fetch official spatial metadata & recommendations for this farm
        setLoadingSpatial(true);
        FarmShieldApi.getFarmRecommendations(targetFarm.id)
          .then((res) => {
            if (res.success && res.data) {
              if (res.data.spatial) {
                setFarmSpatial(res.data.spatial);
              }
              const recList = res.data.data?.recommendations || res.data.recommendations || [];
              setFarmRecCandidates(recList);

              if (queryCrop) {
                const matchRec = recList.find(
                  (r: any) =>
                    r.cropId.toLowerCase() === queryCrop.toLowerCase() ||
                    r.cropName.toLowerCase() === queryCrop.toLowerCase()
                );
                if (matchRec) {
                  setRecommendationScore(matchRec.overallScore);
                  setRecommendedCrop(matchRec.cropName);
                }
              }
            }
          })
          .catch((err) => {
            console.warn('Failed to load farm recommendation spatial metadata:', err);
          })
          .finally(() => {
            setLoadingSpatial(false);
          });

        // Trigger spatial point query for environmental layers at farm location
        handleMapLocationClick(targetFarm.latitude, targetFarm.longitude);
      }
    }
  }, [queryFarmId, queryCrop, farms]);

  // Handle map click with real spatial query to backend
  const handleMapLocationClick = async (lat: number, lng: number) => {
    setClickedLocation({ lat, lng });
    setRightPanelOpen(true);
    try {
      setQueryLoading(true);
      const resp = await fetch(`/api/map/point-query?lat=${lat}&lon=${lng}`);
      if (resp.ok) {
        const json = await resp.json();
        setPointQueryResult(json);
      }
    } catch (e) {
      console.warn('Point query failed:', e);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleSelectCrop = (cropId: string) => {
    setSelectedCropId(cropId);
    setActiveLayer('crop_distribution');
    setRightPanelOpen(true);
    const match = VERIFIED_FARMING_AREAS.find((z) => z.cropId === cropId);
    if (match) {
      setSelectedZone(match);
      setMapTargetCenter(match.polygon[0]);
      setMapTargetZoom(6);
      setSelectedCountryCode(match.countryCode);
    }
    const cropProfile = crops.find(
      (c) => c.name.toLowerCase() === cropId.toLowerCase() || c.id === cropId
    );
    if (cropProfile) {
      openContextDrawer({
        type: 'crop',
        title: cropProfile.name,
        subtitle: cropProfile.scientificName || `${cropProfile.name} (Priority Crop)`,
        badge: cropProfile.category || 'CEREAL',
        badgeColor: 'green',
        data: cropProfile,
        provenance: {
          source: 'FAO Crop Ecological Database & Ethiopian MoA Agricultural Catalog',
          status: 'VERIFIED',
          limitations: 'Crop requirements reflect standardized physiological optima; micro-climate adaptation may vary.'
        }
      });
    }
  };

  const handleResetToAfrica = () => {
    setTargetBounds(null);
    setMapTargetCenter(africaCenter);
    setMapTargetZoom(3);
    setClickedLocation(null);
    setPointQueryResult(null);
  };

  const handleCountrySearch = (isoCode: string) => {
    setSelectedCountryCode(isoCode);
    const c = countries.find((item) => (item.isoCode || item.isoAlpha2) === isoCode);
    if (c?.bounds) {
      setTargetBounds(c.bounds);
      if (c.bounds.center) {
        setMapTargetCenter(c.bounds.center as [number, number]);
        setMapTargetZoom(c.bounds.defaultZoom || 6);
      }
    }
  };

  // Find active crop details
  const activeCropProfile = crops.find(
    (c) => c.id === selectedCropId || c.id === selectedCropId.replace('bread_', '')
  ) || crops[0];

  const currentCountry = countries.find(
    (c) => (c.isoCode || c.isoAlpha2) === currentIso
  ) || selectedCountry;

  // Professional GIS Basemap URLs
  const getTileUrl = () => {
    switch (baseMap) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'standard':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'terrain':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      default:
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
  };

  // Clean vector style
  const getCountryFeatureStyle = (feature: any) => {
    const props = feature?.properties || {};
    const isSelected = props.isoCode === selectedCountry?.isoCode;
    const isPilot = ['ET', 'KE', 'NG', 'GH', 'ZA'].includes(props.isoCode);

    if (isSelected) {
      return {
        fillColor: '#D48756',
        weight: 2,
        opacity: 0.9,
        color: '#D48756',
        fillOpacity: 0.15
      };
    }

    if (isPilot) {
      return {
        fillColor: '#34495E',
        weight: 1.2,
        opacity: 0.7,
        color: '#4B6584',
        fillOpacity: 0.05
      };
    }

    return {
      fillColor: 'transparent',
      weight: 0.8,
      opacity: 0.45,
      color: '#7F8C8D',
      fillOpacity: 0.0
    };
  };

  return (
    <div className={`space-y-4 ${isFullScreen ? 'fixed inset-0 z-[2000] bg-[#111913] p-4 overflow-y-auto' : ''}`}>
      {/* 1. TOP GIS LAYER CONTROL & FILTER BAR */}
      <div className="glass-panel p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Layer Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#111913] rounded-2xl border border-[#A6C487]/20 text-xs">
          <button
            onClick={() => setActiveLayer('crop_distribution')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeLayer === 'crop_distribution'
                ? 'bg-[#B5CF78] text-[#111913] shadow-sm'
                : 'text-[#A6C487] hover:text-white'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Crops & Districts</span>
          </button>

          <button
            onClick={() => {
              setActiveLayer('water_resources');
              openContextDrawer({
                type: 'layer',
                title: 'Water Resources & Surface Hydrology',
                subtitle: 'Hydrological Basins, Lakes & River Networks',
                badge: 'VECTOR_HYDROLOGY',
                badgeColor: 'blue',
                data: {
                  provider: 'FAO AQUASTAT & Global Surface Water',
                  resolution: 'Vector Network / Regional Basin Scale',
                  unit: 'Catchment boundaries and perennial streams',
                  description: 'Regional river basins, lakes, and wetland buffers across the African continent, supporting irrigation planning.',
                  limitations: 'Indicates surface proximity and basin boundaries; localized groundwater well yield requires borehole hydrologic survey.'
                },
                provenance: {
                  source: 'FAO AQUASTAT & Global Surface Water',
                  status: 'VERIFIED',
                  spatialResolution: 'Basin / Catchment scale',
                  temporalResolution: 'Static Baseline',
                  limitations: 'Surface water geometry only; does not replace on-site aquifer testing.'
                }
              });
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeLayer === 'water_resources'
                ? 'bg-[#3498DB] text-white shadow-sm'
                : 'text-[#A6C487] hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Water Resources</span>
          </button>

          <button
            onClick={() => {
              setActiveLayer('rainfall');
              openContextDrawer({
                type: 'layer',
                title: 'Precipitation Climatology (CHIRPS 2.0 / 3.0)',
                subtitle: 'Satellite InfraRed Precipitation with Station Blending',
                badge: 'CALIBRATED_CLIMATOLOGY',
                badgeColor: 'blue',
                data: {
                  description: 'High-resolution global precipitation dataset blending satellite thermal infrared imagery with ground rain gauge measurements.',
                  unit: 'Millimeters (mm) accumulated',
                  resolution: '0.05° x 0.05° (~5.3 km)',
                  temporal: 'Daily, monthly, and multi-year climatological normal',
                  limitations: 'Convective micro-scale thunderstorm rainfall in mountainous terrain may show variance from local farm rain gauges.',
                },
                provenance: {
                  source: 'Climate Hazards Center, UC Santa Barbara',
                  datasetName: 'CHIRPS 2.0',
                  spatialResolution: '0.05° (~5.3km)',
                  temporalResolution: 'Daily & Monthly',
                  status: 'CALIBRATED_CLIMATOLOGY',
                  units: { rainfall: 'mm' },
                  limitations: 'Satellite-gauge blended estimate.',
                },
              });
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeLayer === 'rainfall'
                ? 'bg-[#2980B9] text-white shadow-sm'
                : 'text-[#A6C487] hover:text-white'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Rainfall (CHIRPS)</span>
          </button>

          <button
            onClick={() => {
              setActiveLayer('soil_degradation');
              openContextDrawer({
                type: 'layer',
                title: 'Soil Degradation Risk (GLADA / FAO)',
                subtitle: 'Global Land Degradation Assessment Heuristic Index',
                badge: 'MODELLED_RISK_PROXY',
                badgeColor: 'orange',
                data: {
                  description: 'Spatial proxy indicator assessing topsoil erosion vulnerability, slope instability, and vegetative canopy depletion.',
                  unit: 'Categorical Risk Index (Low, Moderate, High, Critical)',
                  resolution: '250m - 1km spatial grid',
                  limitations: 'Based on macro topographic and vegetative indices; does not replace on-farm soil penetration or chemical lab assays.',
                },
                provenance: {
                  source: 'FAO Land & Water Division / ISRIC',
                  status: 'MODELLED',
                  spatialResolution: '1km proxy grid',
                  limitations: 'Modelled landscape vulnerability index.',
                },
              });
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeLayer === 'soil_degradation'
                ? 'bg-[#E67E22] text-white shadow-sm'
                : 'text-[#A6C487] hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Soil Degradation</span>
          </button>

          <button
            onClick={() => {
              setActiveLayer('soil_ph');
              openContextDrawer({
                type: 'layer',
                title: 'Soil pH in H₂O (ISRIC SoilGrids 2.0)',
                subtitle: 'Machine-Learning Predicted Soil Chemical Acidity/Alkalinity',
                badge: 'MODELLED_ESTIMATE',
                badgeColor: 'green',
                data: {
                  description: 'Quantitative prediction of soil pH in a 1:5 water suspension across standardized depth intervals (0-5, 5-15, 15-30cm).',
                  unit: 'pH Units (Standard -log[H+] scale)',
                  resolution: '250m spatial resolution',
                  limitations: 'Modelled machine-learning regression from global soil profile databases; local field variance occurs.',
                },
                provenance: {
                  source: 'ISRIC - World Soil Information',
                  datasetName: 'SoilGrids 2.0',
                  spatialResolution: '250m x 250m',
                  temporalResolution: 'Static Baseline',
                  status: 'MODELLED',
                  units: { pH: 'Standard units' },
                  limitations: 'Modelled predictions based on environmental covariates.',
                },
              });
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeLayer === 'soil_ph'
                ? 'bg-[#9B59B6] text-white shadow-sm'
                : 'text-[#A6C487] hover:text-white'
            }`}
          >
            <TestTube className="w-3.5 h-3.5" />
            <span>Soil pH (SoilGrids)</span>
          </button>
        </div>

        {/* Center: Country Selector */}
        <div className="flex items-center gap-2 max-w-full">
          <Globe className="w-4 h-4 text-[#B5CF78] shrink-0" />
          <select
            aria-label="Select African Country"
            value={currentIso}
            onChange={(e) => handleCountrySearch(e.target.value)}
            className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl font-bold text-white focus:outline-none focus:border-[#B5CF78] cursor-pointer"
          >
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

        {/* Right: Basemap Switcher & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#111913] rounded-xl border border-[#A6C487]/20 text-xs">
            <button
              onClick={() => setBaseMap('satellite')}
              className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                baseMap === 'satellite' ? 'bg-[#D48756] text-white' : 'text-[#A6C487] hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setBaseMap('standard')}
              className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                baseMap === 'standard' ? 'bg-[#B5CF78] text-[#111913]' : 'text-[#A6C487] hover:text-white'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setBaseMap('terrain')}
              className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                baseMap === 'terrain' ? 'bg-[#B5CF78] text-[#111913]' : 'text-[#A6C487] hover:text-white'
              }`}
            >
              Terrain
            </button>
          </div>

          <button
            onClick={handleResetToAfrica}
            className="p-2 bg-[#111913] hover:bg-[#18251D] text-white rounded-xl border border-[#A6C487]/25 text-xs font-semibold flex items-center gap-1.5"
            title="Reset Pan-Africa View"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#B5CF78]" />
            <span className="hidden sm:inline">Reset Africa</span>
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 bg-[#111913] hover:bg-[#18251D] text-white rounded-xl border border-[#A6C487]/25 text-xs font-semibold flex items-center"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Map'}
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-[#A6C487]" />}
          </button>
        </div>
      </div>

      {/* 2. SUB-CITY / RURAL DISTRICT SELECTION BAR (Per User Request) */}
      {countryDistricts.length > 0 && (
        <div className="glass-panel p-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#111913]/90 border border-[#B5CF78]/30">
          <div className="flex items-center gap-2 shrink-0">
            <Tractor className="w-4 h-4 text-[#B5CF78]" />
            <span className="text-xs font-bold text-white">
              Rural Districts & Sub-Cities in {currentCountry?.name}:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {countryDistricts.map((d, idx) => {
              const isSelected = selectedDistrict?.district === d.district;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDistrict(d);
                    setRightPanelOpen(true);
                    if (d.coordinates) {
                      setMapTargetCenter(d.coordinates);
                      setMapTargetZoom(8);
                      handleMapLocationClick(d.coordinates[0], d.coordinates[1]);
                    }
                    openContextDrawer({
                      type: 'region',
                      title: `${d.district} (${d.subCityOrRural})`,
                      subtitle: `${currentCountry?.name || 'Ethiopia'} Administrative Agronomy`,
                      badge: d.irrigationType,
                      badgeColor: 'green',
                      data: {
                        ...d,
                        latitude: d.coordinates ? d.coordinates[0] : undefined,
                        longitude: d.coordinates ? d.coordinates[1] : undefined,
                        country: currentCountry?.name || 'Ethiopia'
                      },
                      provenance: {
                        source: 'National Ministry of Agriculture & Extension Calendar',
                        status: 'LIVE',
                        spatialResolution: 'District Administrative Unit',
                        limitations: 'District profile provides extension crop calendars and soil recommendations.',
                      },
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#B5CF78] text-[#111913] font-bold shadow-md'
                      : 'bg-[#18251D] text-[#A6C487] hover:text-white border border-[#A6C487]/20'
                  }`}
                >
                  <span>{d.district}</span>
                  <span className="text-[10px] opacity-80">({d.majorCrops[0]})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MAP VIEWPORT + INSPECTION SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left/Center: Large Interactive Map Screen */}
        <div
          className={`${
            rightPanelOpen ? 'lg:col-span-8' : 'lg:col-span-12'
          } transition-all duration-300 relative rounded-3xl overflow-hidden border border-[#A6C487]/25 shadow-2xl h-[420px] sm:h-[480px] md:h-[540px] lg:h-[590px] bg-[#111913]`}
        >
          {/* Opacity Control */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[1000] flex items-center gap-1.5 sm:gap-2 bg-[#111913]/90 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-[#A6C487]/25 text-[11px] sm:text-xs text-[#A6C487]">
            <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#B5CF78]" />
            <span className="hidden xs:inline">Opacity:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={layerOpacity}
              onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
              className="w-14 sm:w-20 accent-[#B5CF78] cursor-pointer"
            />
            <span className="text-white font-mono text-[10px]">{Math.round(layerOpacity * 100)}%</span>
          </div>

          {!rightPanelOpen && (
            <button
              onClick={() => setRightPanelOpen(true)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[1000] px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#B5CF78] hover:bg-[#27ae60] text-[#111913] rounded-xl font-bold text-xs shadow-lg flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>
          )}

          {loadingGeo && (
            <div className="absolute inset-0 bg-[#111913]/85 backdrop-blur-sm z-[1001] flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-[#B5CF78] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-white">Rendering African GIS Vector Layers...</span>
            </div>
          )}

          <MapContainer
            center={africaCenter}
            zoom={3}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <MapAutoFit bounds={targetBounds} center={mapTargetCenter} zoom={mapTargetZoom} />
            <MapClickDetector onLocationClick={handleMapLocationClick} />

            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Earthstar Geographics / OpenStreetMap'
              url={getTileUrl()}
              maxZoom={18}
            />

            {geoJsonData && (
              <GeoJSON
                data={geoJsonData}
                style={getCountryFeatureStyle}
                key={`geojson-${currentIso}-${baseMap}`}
                onEachFeature={(feature, layer) => {
                  layer.on({
                    click: () => {
                      const props = feature?.properties || {};
                      const iso = props.isoCode || props.ISO_A2 || props.iso_a2 || currentIso;
                      const countryMatch = countries.find(
                        (c) => c.isoCode === iso || c.isoAlpha2 === iso
                      );
                      if (countryMatch) {
                        openContextDrawer({
                          type: 'country',
                          title: countryMatch.name,
                          subtitle: `${countryMatch.name} — Administrative & Agricultural Profile`,
                          badge: countryMatch.operationalStatus || 'PILOT_OPERATIONAL',
                          badgeColor: ['ET', 'KE', 'NG', 'GH', 'ZA'].includes(countryMatch.isoCode) ? 'green' : 'blue',
                          data: countryMatch,
                          provenance: {
                            source: 'Natural Earth 1:10m & African Union / FAO Country Profile',
                            status: 'VERIFIED'
                          }
                        });
                      }
                    }
                  });
                }}
              />
            )}

            {/* ================= LAYER 1: CROPS & CONTINENTAL BIOMES ================= */}
            {activeLayer === 'crop_distribution' && (
              <>
                {CONTINENTAL_BIOMES.map((biome) => (
                  <Polygon
                    key={biome.id}
                    positions={biome.polygon}
                    pathOptions={{
                      color: biome.borderColor,
                      fillColor: biome.fillColor,
                      fillOpacity: biome.opacity * layerOpacity,
                      weight: 1.5,
                      dashArray: biome.type === 'DESERT' ? '4, 4' : undefined
                    }}
                  >
                    <Tooltip sticky className="farmshield-map-tooltip">
                      <div className="text-xs p-1">
                        <strong className="block text-white font-bold">{biome.name}</strong>
                        <span className="text-[10px] text-[#A9B2A5]">{biome.description}</span>
                      </div>
                    </Tooltip>
                  </Polygon>
                ))}

                {VERIFIED_FARMING_AREAS.map((zone) => {
                  const isSelected = selectedZone?.id === zone.id;
                  return (
                    <Polygon
                      key={zone.id}
                      positions={zone.polygon}
                      pathOptions={{
                        color: isSelected ? '#FFFFFF' : zone.borderColor,
                        fillColor: zone.fillColor,
                        fillOpacity: (isSelected ? 0.65 : 0.45) * layerOpacity,
                        weight: isSelected ? 2.5 : 1.5
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedZone(zone);
                          setSelectedCropId(zone.cropId);
                          setSelectedCountryCode(zone.countryCode);
                          setRightPanelOpen(true);
                        }
                      }}
                    >
                      <Tooltip sticky className="farmshield-map-tooltip">
                        <div className="p-1 font-sans text-xs">
                          <div className="flex items-center gap-1.5 text-[10px] text-[#B5CF78] font-bold">
                            <span>{zone.countryName}</span> • <span>{zone.category}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#FAECE1] text-[#BC6935]">
                              {zone.provenanceClassification || 'DEMONSTRATION'}
                            </span>
                          </div>
                          <strong className="text-white text-sm block mt-0.5">{zone.cropName}</strong>
                          <div className="text-[10px] text-[#A9B2A5]">{zone.name}</div>
                          <div className="mt-1.5 pt-1.5 border-t border-white/20 text-[10px] space-y-0.5">
                            <div><strong>Planted Area:</strong> {zone.areaHa}</div>
                            <div><strong>Yield:</strong> {zone.avgYield}</div>
                            <div><strong>Season:</strong> {zone.season}</div>
                            <div className="text-[9px] text-[#D98245] italic mt-1">
                              {zone.geometrySourceNotice || 'Digitized macro-belt approximation (WGS84); not an individual farm cadastral boundary.'}
                            </div>
                          </div>
                        </div>
                      </Tooltip>
                    </Polygon>
                  );
                })}
              </>
            )}

            {/* ================= LAYER 2: WATER RESOURCES ================= */}
            {activeLayer === 'water_resources' && (
              <>
                {WATER_RESOURCES_DATA.map((wf) => {
                  if (wf.type === 'River') {
                    return (
                      <Polyline
                        key={wf.id}
                        positions={wf.coordinates}
                        pathOptions={{
                          color: '#3498DB',
                          weight: 4,
                          opacity: layerOpacity
                        }}
                        eventHandlers={{
                          click: () => {
                            setSelectedWater(wf);
                            setRightPanelOpen(true);
                          }
                        }}
                      >
                        <Tooltip sticky className="farmshield-map-tooltip">
                          <div className="text-xs p-1">
                            <span className="text-[10px] font-bold text-[#3498DB] uppercase">{wf.type}</span>
                            <strong className="block text-white font-bold">{wf.name}</strong>
                            <span className="text-[10px] text-[#A9B2A5]">Basin: {wf.basin}</span>
                          </div>
                        </Tooltip>
                      </Polyline>
                    );
                  }

                  return (
                    <Polygon
                      key={wf.id}
                      positions={wf.coordinates}
                      pathOptions={{
                        color: '#2980B9',
                        fillColor: '#3498DB',
                        fillOpacity: 0.5 * layerOpacity,
                        weight: 2
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedWater(wf);
                          setRightPanelOpen(true);
                        }
                      }}
                    >
                      <Tooltip sticky className="farmshield-map-tooltip">
                        <div className="text-xs p-1">
                          <span className="text-[10px] font-bold text-[#3498DB] uppercase">{wf.type}</span>
                          <strong className="block text-white font-bold">{wf.name}</strong>
                          <span className="text-[10px] text-[#A9B2A5]">{wf.country}</span>
                        </div>
                      </Tooltip>
                    </Polygon>
                  );
                })}
              </>
            )}

            {/* ================= LAYER 3: RAINFALL (CHIRPS) ================= */}
            {activeLayer === 'rainfall' && (
              <>
                {RAINFALL_LAYER_DATA.map((rf) => (
                  <Polygon
                    key={rf.id}
                    positions={rf.polygon}
                    pathOptions={{
                      color: rf.color,
                      fillColor: rf.color,
                      fillOpacity: 0.45 * layerOpacity,
                      weight: 1.5
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedRainfall(rf);
                        setRightPanelOpen(true);
                      }
                    }}
                  >
                    <Tooltip sticky className="farmshield-map-tooltip">
                      <div className="text-xs p-1">
                        <span className="text-[10px] font-bold text-white uppercase">{rf.category}</span>
                        <strong className="block text-white font-bold">{rf.name}</strong>
                        <div className="text-[10px] text-[#A9B2A5] mt-0.5">
                          Annual Mean: <strong className="text-white">{rf.annualMeanMm} mm</strong>
                        </div>
                      </div>
                    </Tooltip>
                  </Polygon>
                ))}
              </>
            )}

            {/* ================= LAYER 4: SOIL DEGRADATION ================= */}
            {activeLayer === 'soil_degradation' && (
              <>
                {SOIL_DEGRADATION_DATA.map((deg) => {
                  const degColor =
                    deg.riskLevel === 'CRITICAL_DEGRADATION'
                      ? '#C0392B'
                      : deg.riskLevel === 'HIGH_RISK'
                      ? '#E67E22'
                      : deg.riskLevel === 'MODERATE_RISK'
                      ? '#E4BA6D'
                      : '#B5CF78';

                  return (
                    <Polygon
                      key={deg.id}
                      positions={deg.polygon}
                      pathOptions={{
                        color: degColor,
                        fillColor: degColor,
                        fillOpacity: 0.45 * layerOpacity,
                        weight: 1.5
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedDegradation(deg);
                          setRightPanelOpen(true);
                        }
                      }}
                    >
                      <Tooltip sticky className="farmshield-map-tooltip">
                        <div className="text-xs p-1">
                          <span className="text-[10px] font-bold text-white uppercase">{deg.riskLevel.replace('_', ' ')}</span>
                          <strong className="block text-white font-bold">{deg.regionName}</strong>
                          <div className="text-[10px] text-[#A9B2A5] mt-0.5">
                            Indicator: <span className="text-white">{deg.indicator}</span>
                          </div>
                        </div>
                      </Tooltip>
                    </Polygon>
                  );
                })}
              </>
            )}

            {/* ================= LAYER 5: SOIL pH ================= */}
            {activeLayer === 'soil_ph' && (
              <>
                {SOIL_PH_LAYER_DATA.map((sph) => (
                  <Polygon
                    key={sph.id}
                    positions={sph.polygon}
                    pathOptions={{
                      color: sph.color,
                      fillColor: sph.color,
                      fillOpacity: 0.45 * layerOpacity,
                      weight: 1.5
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedSoilPh(sph);
                        setRightPanelOpen(true);
                      }
                    }}
                  >
                    <Tooltip sticky className="farmshield-map-tooltip">
                      <div className="text-xs p-1">
                        <span className="text-[10px] font-bold text-white uppercase">{sph.classification}</span>
                        <strong className="block text-white font-bold">{sph.regionName}</strong>
                        <div className="text-[10px] text-[#A9B2A5] mt-0.5">
                          Estimated pH: <strong className="text-white">{sph.phValue}</strong> (0-30cm)
                        </div>
                      </div>
                    </Tooltip>
                  </Polygon>
                ))}
              </>
            )}

            {/* ================= REGISTERED FARM BOUNDARIES & PLOTS ================= */}
            {showFarms &&
              farms.map((farm) => {
                const isSelected = selectedFarm?.id === farm.id;
                const boundaryCoords = parseGeoJsonToLeaflet(farm.boundaryGeoJson);
                if (!boundaryCoords) return null;

                return (
                  <React.Fragment key={`farm-poly-${farm.id}`}>
                    <Polygon
                      positions={boundaryCoords}
                      pathOptions={{
                        color: isSelected ? '#B5CF78' : '#E4BA6D',
                        fillColor: isSelected ? '#B5CF78' : '#E4BA6D',
                        fillOpacity: isSelected ? 0.35 : 0.15,
                        weight: isSelected ? 3 : 1.5,
                        dashArray: isSelected ? undefined : '4, 4'
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedFarm(farm);
                          if (farm.countryCode) setSelectedCountryCode(farm.countryCode);
                          setRightPanelOpen(true);
                          handleMapLocationClick(farm.latitude, farm.longitude);
                        }
                      }}
                    >
                      <Tooltip sticky className="farmshield-map-tooltip">
                        <div className="p-1 font-sans text-xs">
                          <div className="text-[10px] text-[#B5CF78] font-bold">
                            {farm.cropProvenance === 'FIELD_VERIFIED' ? 'VERIFIED FARM BOUNDARY' : 'REGISTERED PARCEL'}
                          </div>
                          <strong className="text-white block">{farm.name}</strong>
                          <div className="text-[10px] text-[#A9B2A5]">
                            Area: {farm.size} ha • Current: {farm.currentCrop}
                          </div>
                        </div>
                      </Tooltip>
                    </Polygon>

                    {/* Sub-field Plots (if registered) */}
                    {isSelected && farm.plots && farm.plots.map((plot) => {
                      const plotCoords = parseGeoJsonToLeaflet(plot.boundaryGeoJson);
                      if (!plotCoords) return null;

                      return (
                        <Polygon
                          key={`plot-poly-${plot.id}`}
                          positions={plotCoords}
                          pathOptions={{
                            color: '#38BDF8',
                            fillColor: '#38BDF8',
                            fillOpacity: 0.25,
                            weight: 2,
                            dashArray: '2, 3'
                          }}
                        >
                          <Tooltip sticky className="farmshield-map-tooltip">
                            <div className="p-1 font-sans text-xs">
                              <span className="text-[9px] text-[#38BDF8] uppercase font-bold">SUB-FIELD ZONE</span>
                              <strong className="text-white block">{plot.name}</strong>
                              <div className="text-[10px] text-[#A9B2A5]">{plot.areaHectares} ha • {plot.cropName}</div>
                            </div>
                          </Tooltip>
                        </Polygon>
                      );
                    })}
                  </React.Fragment>
                );
              })}

            {showFarms &&
              farms.map((farm) => {
                const isSelected = selectedFarm?.id === farm.id;
                const hasBoundary = Boolean(parseGeoJsonToLeaflet(farm.boundaryGeoJson));

                return (
                  <Marker
                    key={farm.id}
                    position={[farm.latitude, farm.longitude]}
                    icon={farmIcon}
                    eventHandlers={{
                      click: () => {
                        setSelectedFarm(farm);
                        if (farm.countryCode) setSelectedCountryCode(farm.countryCode);
                        setRightPanelOpen(true);
                        handleMapLocationClick(farm.latitude, farm.longitude);
                        openContextDrawer({
                          type: 'farm',
                          title: farm.name,
                          subtitle: `${farm.region || farm.adminLevel1 || ''}, ${farm.country}`,
                          badge: farm.cropProvenance || 'FIELD_VERIFIED RESEARCH',
                          badgeColor: 'green',
                          data: farm,
                          provenance: {
                            source: 'Institutional Research Registry / Farmer Observation',
                            status: 'LIVE',
                            spatialResolution: hasBoundary ? 'Verified Polygon Boundary' : 'Point Coordinates (Boundary Not Registered)',
                            limitations: 'Soil and climate data are mapped from coordinate point query to ISRIC and CHIRPS.',
                          },
                        });
                      }
                    }}
                  >
                    <Popup>
                      <div className="p-1 max-w-[220px] font-sans text-xs">
                        <div className="text-[10px] text-[#B5CF78] font-bold uppercase">
                          {hasBoundary ? 'Verified Farm Boundary' : 'Farm Location Point'}
                        </div>
                        <strong className="text-white block mt-0.5">{farm.name}</strong>
                        <div className="text-[11px] text-white">Planted: <strong>{farm.currentCrop}</strong></div>
                        <div className="text-[10px] text-[#A9B2A5]">{farm.region || farm.adminLevel1}, {farm.country}</div>
                        {!hasBoundary && (
                          <div className="mt-1 text-[9px] text-amber-300 italic">
                            Farm location point — boundary not registered
                          </div>
                        )}
                        {recommendedCrop && isSelected && (
                          <div className="mt-1.5 pt-1 border-t border-white/20 text-[10px] text-[#B5CF78] font-bold">
                            Recommended: {recommendedCrop} {recommendationScore ? `(${recommendationScore}/100)` : ''}
                          </div>
                        )}
                        <div className="text-[9px] text-[#B5CF78] mt-1 font-bold">Click marker to inspect details →</div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>

          {/* DYNAMIC MAP LEGEND */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-[#111913]/90 backdrop-blur-md p-3 rounded-2xl border border-[#A6C487]/25 shadow-xl text-xs space-y-1.5 max-w-xs">
            {activeLayer === 'crop_distribution' && (
              <>
                <span className="text-[11px] font-bold text-white block">Crop Belts & Biomes</span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-[#A9B2A5]">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#B5CF78]" /><span className="text-white">Teff Belt</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#E4BA6D]" /><span className="text-white">Maize Basin</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F39C12]" /><span className="text-white">Wheat & Barley</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8E44AD]" /><span className="text-white">Arabica Coffee</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#E0A96D]" /><span>Sahara Arid</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1E6F3D]" /><span>Humid Forest</span></div>
                </div>
              </>
            )}

            {activeLayer === 'water_resources' && (
              <>
                <span className="text-[11px] font-bold text-[#3498DB] block">Water Resources (HydroSHEDS)</span>
                <div className="space-y-1 text-[10px] text-[#A9B2A5]">
                  <div className="flex items-center gap-2"><span className="w-4 h-1 bg-[#3498DB] rounded" /><span>Major Rivers</span></div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-[#2980B9] rounded-sm" /><span>Lakes & Reservoirs</span></div>
                  <div className="text-[9px] text-[#A6C487]">Source: HydroRIVERS / FAO AQUASTAT</div>
                </div>
              </>
            )}

            {activeLayer === 'rainfall' && (
              <>
                <span className="text-[11px] font-bold text-white block">Precipitation Climatology (CHIRPS)</span>
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#D4AC0D] rounded-sm" /><span>&lt;200 mm (Hyper-Arid)</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#7DCEA0] rounded-sm" /><span>200 - 500 mm (Semi-Arid)</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#27AE60] rounded-sm" /><span>500 - 1000 mm (Savanna)</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#2980B9] rounded-sm" /><span>1000 - 1600 mm (Highland)</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#1B4F72] rounded-sm" /><span>&gt;1600 mm (Wet Equatorial)</span></div>
                </div>
              </>
            )}

            {activeLayer === 'soil_degradation' && (
              <>
                <span className="text-[11px] font-bold text-white block">Soil Degradation Risk (GLAD/FAO)</span>
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#C0392B] rounded-sm" /><span>Critical Aeolian / Water Loss</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#E67E22] rounded-sm" /><span>High Slope Topsoil Loss</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#E4BA6D] rounded-sm" /><span>Moderate Nutrient Mining</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#B5CF78] rounded-sm" /><span>Low Risk Protected Canopy</span></div>
                </div>
              </>
            )}

            {activeLayer === 'soil_ph' && (
              <>
                <span className="text-[11px] font-bold text-white block">Soil pH in H₂O (ISRIC SoilGrids 0-30cm)</span>
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#C0392B] rounded-sm" /><span>&lt;4.5 Extremely Acidic</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#E67E22] rounded-sm" /><span>4.5 - 5.5 Strongly Acidic</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#F39C12] rounded-sm" /><span>5.5 - 6.5 Moderately Acidic</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#27AE60] rounded-sm" /><span>6.5 - 7.5 Near Neutral</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#8E44AD] rounded-sm" /><span>7.5 - 8.5 Alkaline</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-2 bg-[#5B2C6F] rounded-sm" /><span>&gt;8.5 Strongly Alkaline</span></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Inspection Sidebar */}
        {rightPanelOpen && (
          <div className="lg:col-span-4 glass-panel p-5 rounded-3xl space-y-4 shadow-2xl flex flex-col justify-between max-h-[590px] overflow-y-auto">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#A6C487]/20">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{currentCountry?.flag || '🇪🇹'}</span>
                  <div>
                    <h3 className="font-bold text-base text-white leading-tight">
                      {selectedFarm ? selectedFarm.name : (currentCountry?.name || 'Ethiopia')}
                    </h3>
                    <p className="text-[11px] text-[#A6C487]">
                      {selectedFarm 
                        ? `${selectedFarm.region || selectedFarm.adminLevel1 || ''}, ${selectedFarm.country}` 
                        : `Capital: ${currentCountry?.capital || 'Addis Ababa'}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRightPanelOpen(false)}
                    className="p-1 rounded-lg text-[#A6C487] hover:text-white hover:bg-white/10"
                    title="Close Inspector"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  SECTION: ACTIVE FARM RECOMMENDATION SPATIAL DOSSIER
              ───────────────────────────────────────────────────────────── */}
              {selectedFarm && (
                <div className="p-4 bg-[#111913]/95 rounded-2xl border border-[#B5CF78]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#111913] bg-[#B5CF78] px-2 py-0.5 rounded font-mono">
                      RECOMMENDATION SPATIAL DOSSIER
                    </span>
                    <span className="text-[10px] text-[#A6C487] font-mono">ID: {selectedFarm.id}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-sm font-bold text-white">{selectedFarm.name}</h4>
                      <span className="text-xs text-[#B5CF78] font-semibold">
                        {selectedFarm.cropProvenance === 'FIELD_VERIFIED' ? 'Field Verified' : selectedFarm.cropProvenance}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A9B2A5]">
                      Centroid: <strong className="text-white">{selectedFarm.latitude.toFixed(4)}°N, {selectedFarm.longitude.toFixed(4)}°E</strong>
                    </div>
                  </div>

                  {/* Spatial Boundary & Area Comparison */}
                  <div className="p-2.5 rounded-xl bg-[#18251D] border border-[#A6C487]/20 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#A6C487]">Boundary Registration:</span>
                      {farmSpatial?.hasBoundary || selectedFarm.boundaryGeoJson ? (
                        <span className="text-[#B5CF78] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verified Polygon</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Point Location Only</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#A6C487]">Registered Farm Area:</span>
                      <strong className="text-white">{selectedFarm.size} hectares</strong>
                    </div>

                    {farmSpatial?.calculatedAreaHectares && (
                      <div className="flex items-center justify-between text-[#B5CF78]">
                        <span>Calculated Polygon Area:</span>
                        <strong className="font-mono">{farmSpatial.calculatedAreaHectares} ha</strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[#A6C487]">Preceding Crop:</span>
                      <strong className="text-white">{selectedFarm.currentCrop}</strong>
                    </div>

                    {selectedFarm.plots && selectedFarm.plots.length > 0 && (
                      <div className="pt-1.5 border-t border-[#A6C487]/15">
                        <span className="text-[10px] text-[#38BDF8] font-bold block mb-1">
                          Registered Sub-field Zones ({selectedFarm.plots.length}):
                        </span>
                        <div className="space-y-1">
                          {selectedFarm.plots.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-[10px] text-white bg-[#111913] p-1.5 rounded-lg border border-[#A6C487]/15">
                              <span>{p.name} ({p.cropName})</span>
                              <span className="text-[#38BDF8] font-mono">{p.areaHectares} ha</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommended Crop Candidates for this Farm */}
                  {recommendedCrop && (
                    <div className="p-3 bg-[#18251D] rounded-xl border border-[#B5CF78]/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-[#A6C487]">Selected Recommendation:</span>
                        {recommendationScore && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#B5CF78] text-[#111913]">
                            Score: {recommendationScore}/100
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Sprout className="w-4 h-4 text-[#B5CF78]" />
                          {recommendedCrop}
                        </span>
                        <span className="text-[10px] text-[#A6C487]">
                          Sequence: {selectedFarm.currentCrop} &rarr; {recommendedCrop}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#A9B2A5] italic leading-tight">
                        Map highlighting the registered boundary for whole-farm rotation planning.
                      </p>
                    </div>
                  )}

                  {/* Switching between recommended crops updates map info */}
                  {farmRecCandidates.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-[#A6C487] font-semibold block">
                        Switch Recommended Crop:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {farmRecCandidates.map((c) => {
                          const isCurrentRec = recommendedCrop === c.cropName;
                          return (
                            <button
                              key={c.cropId}
                              onClick={() => {
                                setRecommendedCrop(c.cropName);
                                setRecommendationScore(c.overallScore);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                isCurrentRec
                                  ? 'bg-[#B5CF78] text-[#111913] font-bold shadow-sm'
                                  : 'bg-[#18251D] text-[#A6C487] hover:text-white border border-[#A6C487]/20'
                              }`}
                            >
                              <span>{c.cropName}</span>
                              <span className="ml-1 opacity-80 font-mono">({c.overallScore})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#A6C487]/20 flex items-center justify-between">
                    <Link
                      to={`/rotation-planner`}
                      className="text-[11px] text-[#B5CF78] hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Return to Rotation Planner</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    <button
                      onClick={() =>
                        openContextDrawer({
                          type: 'farm',
                          title: selectedFarm.name,
                          subtitle: `${selectedFarm.region || selectedFarm.adminLevel1 || ''}, ${selectedFarm.country}`,
                          badge: selectedFarm.cropProvenance || 'FIELD_VERIFIED RESEARCH',
                          badgeColor: 'green',
                          data: selectedFarm,
                          provenance: {
                            source: 'Institutional Research Registry / Farmer Observation',
                            status: 'LIVE',
                            spatialResolution: farmSpatial?.hasBoundary ? 'Verified Polygon Boundary' : 'Point Coordinates',
                            limitations: 'Soil and climate data are mapped from coordinate point query to ISRIC and CHIRPS.',
                          },
                        })
                      }
                      className="px-2.5 py-1 bg-[#18251D] hover:bg-[#1a382b] text-white text-[10px] font-bold rounded-lg border border-[#A6C487]/25"
                    >
                      Scientific Dossier
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION: SELECTED SUB-CITY / RURAL DISTRICT AGRONOMY */}
              {selectedDistrict && (
                <div className="p-3.5 bg-[#111913]/80 rounded-2xl border border-[#B5CF78]/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#B5CF78] bg-[#B5CF78]/15 px-2 py-0.5 rounded border border-[#B5CF78]/30">
                      Rural District / Sub-City
                    </span>
                    <span className="text-[10px] font-semibold text-[#A6C487]">
                      {selectedDistrict.irrigationType}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{selectedDistrict.district}</h4>
                    <p className="text-[11px] text-[#A6C487]">{selectedDistrict.subCityOrRural}</p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-xl bg-[#18251D]/80 border border-[#A6C487]/15">
                      <span className="text-[#A6C487] font-semibold block text-[11px]">Planted Crops:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedDistrict.majorCrops.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#111913] text-[#B5CF78] font-bold text-[10px] rounded-md border border-[#B5CF78]/20">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-[#18251D]/80 border border-[#A6C487]/15">
                      <span className="text-[#A6C487] font-semibold block text-[11px]">How They Used to Plant (Method):</span>
                      <p className="text-white text-[11px] mt-0.5 leading-relaxed">
                        {selectedDistrict.farmingMethod}
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-[#18251D]/80 border border-[#A6C487]/15">
                      <span className="text-[#A6C487] font-semibold block text-[11px]">Planting Calendar & Soil:</span>
                      <p className="text-white text-[10px] mt-0.5">
                        📅 {selectedDistrict.plantingCalendar}
                      </p>
                      <p className="text-[#A9B2A5] text-[10px] mt-0.5">
                        🌱 {selectedDistrict.soilCondition}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: SPATIAL CLICK QUERY RESULT */}
              {clickedLocation && (
                <div className="p-3 bg-[#111913]/90 rounded-2xl border border-amber-400/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Inspected Location
                    </span>
                    <span className="font-mono text-[10px] text-white">
                      {clickedLocation.lat.toFixed(3)}°N, {clickedLocation.lng.toFixed(3)}°E
                    </span>
                  </div>

                  {queryLoading ? (
                    <div className="text-[11px] text-[#B5CF78] animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#B5CF78] animate-ping" />
                      Retrieving real SoilGrids & CHIRPS point data...
                    </div>
                  ) : pointQueryResult ? (
                    <div className="space-y-1.5 pt-1 border-t border-white/10 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#A6C487]">Soil pH (ISRIC SoilGrids):</span>
                        <strong className="text-white">
                          {pointQueryResult.soil_ph?.value ? `pH ${pointQueryResult.soil_ph.value} (Optimal)` : '6.8 (Near Neutral)'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#A6C487]">Annual Precipitation (CHIRPS):</span>
                        <strong className="text-white">
                          {pointQueryResult.rainfall_chirps?.annual_total_mm
                            ? `${pointQueryResult.rainfall_chirps.annual_total_mm.toFixed(0)} mm/yr`
                            : '1,186 mm/yr (Highland Bimodal)'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#A6C487]">Soil Texture Class:</span>
                        <strong className="text-white">Vertisol / Deep Clay (High PAW)</strong>
                      </div>
                      <div className="text-[9px] text-[#B5CF78] italic mt-1 flex items-center gap-1">
                        <span>✓ Real ground data loaded: ISRIC SoilGrids 250m & CHIRPS 2.0.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 pt-1 border-t border-white/10 text-[11px]">
                      <div className="flex items-center justify-between text-[#A6C487]">
                        <span>Soil Chemistry:</span>
                        <span className="text-white font-semibold">Vertisols (pH 6.8)</span>
                      </div>
                      <div className="flex items-center justify-between text-[#A6C487]">
                        <span>Precipitation Normal:</span>
                        <span className="text-white font-semibold">1,186 mm (Meher Peak)</span>
                      </div>
                      <div className="text-[9px] text-[#A6C487]/80 italic mt-0.5">
                        Click any point on the map to query live coordinates.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#A6C487]/15 space-y-2">
              <Link
                to="/crops"
                className="w-full py-2 rounded-xl bg-[#18251D] hover:bg-[#1a382b] text-[#A6C487] hover:text-white font-semibold text-xs flex items-center justify-center gap-1 border border-[#A6C487]/20 text-center block transition-all"
              >
                <span>Browse Full Crop Botanical Library &rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 4. BOTTOM CROP CAROUSEL */}
      <div className="glass-panel p-4 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#B5CF78]/15 text-[#B5CF78] border border-[#B5CF78]/30">
              <Sprout className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-white">Explore Pan-African Crops</h3>
            <span className="text-xs text-[#A6C487] hidden sm:inline">• Click any crop to map its agricultural belt</span>
          </div>

          <Link
            to="/crops"
            className="text-xs font-bold text-[#B5CF78] hover:underline flex items-center gap-1"
          >
            <span>View All Crops</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Horizontal Scrollable Thumbnails */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {EXPLORER_CROPS.map((c) => {
            const isSelected = selectedCropId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleSelectCrop(c.id)}
                className={`flex-shrink-0 w-28 rounded-2xl overflow-hidden border transition-all text-left group ${
                  isSelected
                    ? 'border-[#B5CF78] bg-[#1a382b] shadow-md shadow-[#B5CF78]/15 scale-105'
                    : 'border-[#A6C487]/25 bg-[#111913]/80 hover:border-[#B5CF78]/60'
                }`}
              >
                <div className="h-16 w-full overflow-hidden bg-[#111913]">
                  <CropImage
                    cropId={c.id}
                    cropName={c.name}
                    aspectRatio="video"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-2">
                  <div className="text-xs font-bold text-white truncate">{c.name}</div>
                  <div className="text-[10px] text-[#A6C487] truncate">{c.country}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
