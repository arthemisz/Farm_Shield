import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  MapPin,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Plus,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useFarmShield } from '../context/FarmShieldContext';
import { SoilType, WaterAvailability, CropProvenance } from '../types';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { getCountryConfig } from '../data/countries';
import { UnitConverter } from '../utils/unitConverter';
import { FarmShieldApi } from '../services/api';
import { SoilKnowledgeModal } from '../components/common/SoilKnowledgeModal';
import { getSoilDocByType } from '../data/soilDocumentation';
import { resolveAdministrativeCoordinates } from '../data/africanAdministrativeGeo';

// Fix Leaflet's default icon path in bundler environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Interactive map handler for pinning coordinate or drawing boundary vertices
const MapInteractiveDrawer: React.FC<{
  position: [number, number];
  isDrawingMode: boolean;
  boundaryVertices: [number, number][];
  onPinLocation: (lat: number, lng: number) => void;
  onAddVertex: (lat: number, lng: number) => void;
}> = ({ position, isDrawingMode, boundaryVertices, onPinLocation, onAddVertex }) => {
  useMapEvents({
    click(e) {
      const lat = Number(e.latlng.lat.toFixed(5));
      const lng = Number(e.latlng.lng.toFixed(5));
      if (isDrawingMode) {
        onAddVertex(lat, lng);
      } else {
        onPinLocation(lat, lng);
      }
    },
  });

  return (
    <>
      {position && !isDrawingMode && <Marker position={position} />}
      {boundaryVertices.length > 0 && (
        <>
          {boundaryVertices.map((v, i) => (
            <Marker key={i} position={v} />
          ))}
          {boundaryVertices.length >= 3 && (
            <Polygon
              positions={boundaryVertices}
              pathOptions={{
                color: '#B5CF78',
                fillColor: '#B5CF78',
                fillOpacity: 0.35,
                weight: 2
              }}
            />
          )}
        </>
      )}
    </>
  );
};

// Map auto-controller: smoothly fly to the new location when coordinates or zoom change
const MapFlyToController: React.FC<{
  center: [number, number];
  zoom?: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1.2,
      });
    }
  }, [center[0], center[1], zoom, map]);

  return null;
};

const SOIL_OPTIONS: SoilType[] = [
  'Vertisols (Black clay)',
  'Nitisols (Red basaltic)',
  'Cambisols (Brown loamy)',
  'Luvisols',
  'Fluvisols (Alluvial)',
  'Arenosols (Sandy)',
  'Ferralsols (Tropical red)',
  'Acrisols',
  'Leptosols',
];

const WATER_OPTIONS: WaterAvailability[] = [
  'Rainfed',
  'Irrigated',
  'Mixed',
  'Seasonal Stream',
  'Groundwater',
];

export const AddFarmPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;

  const { farms, addFarm, updateFarm, selectedCountry, countries, crops } = useFarmShield();

  // Country selection state
  const [countryCode, setCountryCode] = useState<string>(
    selectedCountry?.isoCode || selectedCountry?.isoAlpha2 || 'ET'
  );
  const activeCountryCfg =
    countries.find(
      (c) => (c.isoCode || c.isoAlpha2)?.toUpperCase() === countryCode.toUpperCase()
    ) || getCountryConfig(countryCode);

  // Administrative Divisions loaded from backend
  const [divisionsData, setDivisionsData] = useState<any | null>(null);
  const [loadingDivisions, setLoadingDivisions] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState('');
  const [adminLevel1, setAdminLevel1] = useState('');
  const [adminLevel2, setAdminLevel2] = useState('');
  const [adminLevel3, setAdminLevel3] = useState('');
  const [sizeInput, setSizeInput] = useState<number | string>(5.0);
  const [sizeUnit, setSizeUnit] = useState<'hectares' | 'acres'>('hectares');
  
  // Coordinates from query params or country default
  const paramLat = searchParams.get('lat');
  const paramLng = searchParams.get('lng');
  const initialLat = paramLat ? Number(paramLat) : (activeCountryCfg.bounds?.center[0] || 9.02);
  const initialLng = paramLng ? Number(paramLng) : (activeCountryCfg.bounds?.center[1] || 38.74);

  const [latitude, setLatitude] = useState<number>(initialLat);
  const [longitude, setLongitude] = useState<number>(initialLng);
  const [mapZoom, setMapZoom] = useState<number>(activeCountryCfg.bounds?.defaultZoom || 13);
  const [currentCrop, setCurrentCrop] = useState<string>('Teff');
  const [plantingDate, setPlantingDate] = useState<string>('2024-07-01');
  const [growingSeason, setGrowingSeason] = useState<string>('Main Season');
  const [cropProvenance, setCropProvenance] = useState<CropProvenance>('FARMER_REPORTED');
  const [soilType, setSoilType] = useState<SoilType>('Vertisols (Black clay)');
  const [waterAvailability, setWaterAvailability] = useState<WaterAvailability>('Rainfed');
  const [description, setDescription] = useState('');
  const [elevationMeters, setElevationMeters] = useState<number | string>(1950);
  const [showSoilModal, setShowSoilModal] = useState<boolean>(false);

  // Interactive Boundary Drawing State
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [boundaryVertices, setBoundaryVertices] = useState<[number, number][]>([]);
  const [geoJsonInput, setGeoJsonInput] = useState<string>('');

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load Administrative Divisions from backend when country changes
  useEffect(() => {
    async function fetchDivisions() {
      try {
        setLoadingDivisions(true);
        const res = await FarmShieldApi.getCountryDivisions(countryCode);
        if (res.success && res.data) {
          setDivisionsData(res.data);
        } else {
          setDivisionsData(null);
        }
      } catch (err) {
        setDivisionsData(null);
      } finally {
        setLoadingDivisions(false);
      }
    }
    fetchDivisions();
  }, [countryCode]);

  // Update center and map viewport when country changes if adding new
  const handleCountryChange = (newCode: string) => {
    setCountryCode(newCode);
    const cfg =
      countries.find(
        (c) => (c.isoCode || c.isoAlpha2)?.toUpperCase() === newCode.toUpperCase()
      ) || getCountryConfig(newCode);

    setAdminLevel1('');
    setAdminLevel2('');
    setAdminLevel3('');

    if (!isEditing) {
      const geo = resolveAdministrativeCoordinates(newCode);
      setLatitude(Number(geo.center[0].toFixed(4)));
      setLongitude(Number(geo.center[1].toFixed(4)));
      setMapZoom(geo.zoom || cfg.bounds?.defaultZoom || 6);
    }
  };

  // Update map viewport when farmer selects or types a Region / State
  const handleAdmin1Change = (newAdmin1: string) => {
    setAdminLevel1(newAdmin1);
    setAdminLevel2('');
    if (!isEditing && newAdmin1.trim()) {
      const geo = resolveAdministrativeCoordinates(countryCode, newAdmin1);
      setLatitude(Number(geo.center[0].toFixed(4)));
      setLongitude(Number(geo.center[1].toFixed(4)));
      setMapZoom(geo.zoom || 9);
    }
  };

  // Update map viewport when farmer selects or types a District / Sub-City
  const handleAdmin2Change = (newAdmin2: string) => {
    setAdminLevel2(newAdmin2);
    if (!isEditing && newAdmin2.trim()) {
      const geo = resolveAdministrativeCoordinates(countryCode, adminLevel1, newAdmin2);
      setLatitude(Number(geo.center[0].toFixed(4)));
      setLongitude(Number(geo.center[1].toFixed(4)));
      setMapZoom(geo.zoom || 12);
    }
  };

  // Populate data if editing
  useEffect(() => {
    if (isEditing && id) {
      const existing = farms.find((f) => f.id === id);
      if (existing) {
        setName(existing.name);
        setCountryCode(existing.countryCode || 'ET');
        setAdminLevel1(existing.adminLevel1 || existing.region || '');
        setAdminLevel2(existing.adminLevel2 || existing.zone || '');
        setAdminLevel3(existing.adminLevel3 || existing.woreda || '');
        setSizeInput(existing.size || existing.sizeHectares || 5.0);
        setSizeUnit(existing.sizeUnit || 'hectares');
        setLatitude(existing.latitude);
        setLongitude(existing.longitude);
        setCurrentCrop(existing.currentCrop);
        setPlantingDate(existing.plantingDate || '2024-07-01');
        setGrowingSeason(existing.growingSeason || 'Main Season');
        setCropProvenance(existing.cropProvenance || 'FARMER_REPORTED');
        setSoilType(existing.soilType);
        setWaterAvailability(existing.waterAvailability);
        setDescription(existing.description || '');
        setElevationMeters(existing.elevationMeters || 1950);

        if (existing.boundaryGeoJson) {
          try {
            setGeoJsonInput(JSON.stringify(existing.boundaryGeoJson, null, 2));
            const coords = existing.boundaryGeoJson.coordinates?.[0];
            if (coords && Array.isArray(coords)) {
              setBoundaryVertices(coords.map((c: any) => [c[1], c[0]]));
            }
          } catch (e) {
            console.error('Failed to parse existing boundary', e);
          }
        }
      }
    }
  }, [isEditing, id, farms]);

  const handleAddVertex = (lat: number, lng: number) => {
    const updated: [number, number][] = [...boundaryVertices, [lat, lng]];
    setBoundaryVertices(updated);
    // Auto-update center to first point
    if (updated.length === 1) {
      setLatitude(lat);
      setLongitude(lng);
    }
    // Update GeoJSON representation [lng, lat] format
    const geoJsonObj = {
      type: 'Polygon',
      coordinates: [
        [...updated.map((v) => [v[1], v[0]]), [updated[0][1], updated[0][0]]]
      ]
    };
    setGeoJsonInput(JSON.stringify(geoJsonObj, null, 2));
  };

  const handleClearBoundary = () => {
    setBoundaryVertices([]);
    setGeoJsonInput('');
  };

  const handleGeoJsonTextChange = (text: string) => {
    setGeoJsonInput(text);
    try {
      const parsed = JSON.parse(text);
      if (parsed.type === 'Polygon' && parsed.coordinates?.[0]) {
        const vertices: [number, number][] = parsed.coordinates[0].map(
          (c: any) => [c[1], c[0]] as [number, number]
        );
        setBoundaryVertices(vertices);
        if (vertices.length > 0) {
          setLatitude(vertices[0][0]);
          setLongitude(vertices[0][1]);
        }
      }
    } catch (e) {
      // Allow user to continue typing
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Farm name is required.';
    if (!adminLevel1.trim()) errs.adminLevel1 = 'Region or State selection is required.';

    const sizeNum = Number(sizeInput);
    if (isNaN(sizeNum) || sizeNum <= 0) {
      errs.size = 'Please enter a valid farm area greater than 0.';
    }

    if (latitude < -35.0 || latitude > 38.0) {
      errs.latitude = 'Latitude must be within the African continent span (-35° to 38°).';
    }

    if (longitude < -26.0 || longitude > 52.0) {
      errs.longitude = 'Longitude must be within the African continent span (-26° to 52°).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const rawSize = Number(sizeInput);
      const internalHectares = UnitConverter.toInternalHectares(rawSize, sizeUnit);

      let parsedBoundary = null;
      if (geoJsonInput.trim()) {
        try {
          parsedBoundary = JSON.parse(geoJsonInput);
        } catch (err) {
          console.warn('Invalid GeoJSON boundary string provided');
        }
      } else if (boundaryVertices.length >= 3) {
        parsedBoundary = {
          type: 'Polygon',
          coordinates: [
            [...boundaryVertices.map((v) => [v[1], v[0]]), [boundaryVertices[0][1], boundaryVertices[0][0]]]
          ]
        };
      }

      const payload = {
        name,
        countryCode,
        country: activeCountryCfg.name,
        adminLevel1,
        adminLevel2,
        adminLevel3: adminLevel3 || '',
        region: adminLevel1,
        zone: adminLevel2,
        woreda: adminLevel3 || '',
        size: internalHectares,
        sizeHectares: internalHectares,
        sizeUnit,
        latitude: Number(latitude),
        longitude: Number(longitude),
        currentCrop,
        plantingDate,
        growingSeason,
        cropProvenance,
        soilType,
        waterAvailability,
        description,
        elevationMeters: Number(elevationMeters) || undefined,
        boundaryGeoJson: parsedBoundary
      };

      if (isEditing && id) {
        await updateFarm(id, payload);
      } else {
        await addFarm(payload);
      }
      navigate('/farms');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Extract cities / regions from division payload
  const citiesMap = divisionsData?.cities || {};
  const cityKeys = Object.keys(citiesMap);
  const subCitiesOptions = adminLevel1 && citiesMap[adminLevel1] ? citiesMap[adminLevel1] : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/farms"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A6C487] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Registered Farms</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#B5CF78]/10 text-[#B5CF78] border border-[#B5CF78]/20">
              <MapPin className="w-5 h-5" />
            </span>
            {isEditing ? 'Edit Farm Parcel & Boundary' : 'Register Farm & Map Boundary'}
          </h2>
          <p className="text-xs sm:text-sm text-[#A6C487] mt-1">
            Draw precise farm boundary polygons, register planted crops with verified provenance, and attach edaphic attributes.
          </p>
        </div>
        <DataSourceBadge source="FarmShield Cadastral Database & WGS-84 Geospatial Engine" />
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 space-y-6">
        {/* Section 1: Sovereign Country & Administrative Hierarchy */}
        <div className="border-b border-[#A6C487]/15 pb-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B5CF78]"></span>
            1. Country Selection & Administrative Hierarchy (All 54 African Countries)
          </h3>
          <p className="text-xs text-[#A6C487] mt-0.5">
            Synchronized directly with the centralized 54-country African registry and subnational divisions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Country Selector */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Sovereign Country <span className="text-[#B5CF78]">*</span>
              </label>
              <select
                aria-label="Select Country"
                value={countryCode}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl font-bold text-white focus:outline-none focus:border-[#B5CF78]"
              >
                {countries.map((c) => {
                  const code = c.isoCode || c.isoAlpha2 || '';
                  return (
                    <option key={code} value={code} className="bg-[#18251D] text-white">
                      {c.flag} {c.name} ({code})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Region / State Selector */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                {divisionsData?.admin1_label || 'Region / Province / State'} <span className="text-[#B5CF78]">*</span>
              </label>
              {cityKeys.length > 0 ? (
                <select
                  value={adminLevel1}
                  onChange={(e) => handleAdmin1Change(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white focus:outline-none focus:border-[#B5CF78]"
                >
                  <option value="" className="bg-[#18251D]">-- Select {divisionsData?.admin1_label || 'Region'} --</option>
                  {cityKeys.map((k) => (
                    <option key={k} value={k} className="bg-[#18251D] text-white">
                      {k}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={adminLevel1}
                  onChange={(e) => handleAdmin1Change(e.target.value)}
                  placeholder="Enter Region / State"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white focus:outline-none focus:border-[#B5CF78]"
                />
              )}
              {errors.adminLevel1 && <p className="text-[11px] text-red-400 mt-1">{errors.adminLevel1}</p>}
            </div>

            {/* District / Sub-City / Zone Selector */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                {divisionsData?.admin2_label || 'District / Sub-City / County'}
              </label>
              {subCitiesOptions.length > 0 ? (
                <select
                  value={adminLevel2}
                  onChange={(e) => handleAdmin2Change(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white focus:outline-none focus:border-[#B5CF78]"
                >
                  <option value="" className="bg-[#18251D]">-- Select District / Sub-City --</option>
                  {subCitiesOptions.map((sc: string) => (
                    <option key={sc} value={sc} className="bg-[#18251D] text-white">
                      {sc}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={adminLevel2}
                  onChange={(e) => handleAdmin2Change(e.target.value)}
                  placeholder="Enter District or Zone"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white focus:outline-none focus:border-[#B5CF78]"
                />
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Farm Name, Planted Crops & Field Verification */}
        <div className="border-b border-[#A6C487]/15 pb-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            2. Farm Identification, Planted Crops & Provenance Classification
          </h3>
          <p className="text-xs text-[#A6C487] mt-0.5">
            Honest crop provenance categorization prevents unverified satellite claims.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-white mb-1">
                Farm Name <span className="text-[#B5CF78]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bishoftu Highlands Agricultural Cooperative"
                className="w-full px-3.5 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white focus:outline-none focus:border-[#B5CF78]"
              />
              {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Farm Area <span className="text-[#B5CF78]">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white focus:outline-none focus:border-[#B5CF78]"
                />
                <select
                  value={sizeUnit}
                  onChange={(e) => setSizeUnit(e.target.value as any)}
                  className="w-28 px-2 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white font-semibold focus:outline-none focus:border-[#B5CF78]"
                >
                  <option value="hectares" className="bg-[#18251D]">Hectares</option>
                  <option value="acres" className="bg-[#18251D]">Acres</option>
                </select>
              </div>
              {errors.size && <p className="text-[11px] text-red-400 mt-1">{errors.size}</p>}
            </div>

            {/* Planted Crop */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Planted Crop <span className="text-[#B5CF78]">*</span>
              </label>
              <select
                value={currentCrop}
                onChange={(e) => setCurrentCrop(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white focus:outline-none focus:border-[#B5CF78]"
              >
                {crops.map((c) => (
                  <option key={c.id} value={c.name} className="bg-[#18251D] text-white">
                    {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Planting Date & Growing Season */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Planting Date
              </label>
              <input
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white focus:outline-none focus:border-[#B5CF78]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Growing Season
              </label>
              <input
                type="text"
                value={growingSeason}
                onChange={(e) => setGrowingSeason(e.target.value)}
                placeholder="e.g. Meher, Belg, Long Rains"
                className="w-full px-3.5 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white focus:outline-none focus:border-[#B5CF78]"
              />
            </div>

            {/* Crop Provenance Classification */}
            <div className="md:col-span-3 p-3.5 bg-[#111913]/60 border border-[#A6C487]/20 rounded-2xl">
              <label className="block text-xs font-bold text-white mb-1">
                Scientific Crop Label Provenance <span className="text-[#B5CF78]">*</span>
              </label>
              <select
                value={cropProvenance}
                onChange={(e) => setCropProvenance(e.target.value as CropProvenance)}
                className="w-full px-3 py-2 text-xs bg-[#18251D] border border-[#A6C487]/25 rounded-xl text-[#B5CF78] font-bold focus:outline-none focus:border-[#B5CF78]"
              >
                <option value="FARMER_REPORTED" className="bg-[#18251D] text-white">
                  FARMER_REPORTED — Declared by the farmer or cooperative manager
                </option>
                <option value="FIELD_VERIFIED" className="bg-[#18251D] text-white">
                  FIELD_VERIFIED — Confirmed on-site by certified agricultural extension officer
                </option>
                <option value="SATELLITE_CLASSIFIED" className="bg-[#18251D] text-white">
                  SATELLITE_CLASSIFIED — Derived from validated multi-temporal Sentinel-2 spectral classification
                </option>
                <option value="STATISTICAL_ESTIMATE" className="bg-[#18251D] text-white">
                  STATISTICAL_ESTIMATE — Regional statistical projection (FAO Agro-MAPS)
                </option>
              </select>
              <span className="text-[10px] text-[#A6C487] mt-1 block">
                FarmShield strictly distinguishes farmer-declared crops from satellite-classified phenology.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Interactive Boundary Drawing & Coordinate Entry */}
        <div className="border-b border-[#A6C487]/15 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                3. Interactive Boundary Polygon & GPS Coordinates
              </h3>
              <p className="text-xs text-[#A6C487]">
                Click points on the map to draw the farm parcel perimeter or paste standard GeoJSON.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isDrawingMode
                    ? 'bg-amber-500 text-[#111913] shadow-md'
                    : 'bg-[#111913] border border-[#A6C487]/25 text-[#A6C487] hover:text-white'
                }`}
              >
                {isDrawingMode ? 'Mode: Drawing Polygon Active' : 'Enable Polygon Drawing'}
              </button>

              {boundaryVertices.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearBoundary}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                >
                  Clear Boundary ({boundaryVertices.length} pts)
                </button>
              )}
            </div>
          </div>

          {/* Interactive Leaflet Drawing Surface */}
          <div className="h-72 w-full rounded-2xl overflow-hidden border border-[#A6C487]/25 my-3 relative">
            <MapContainer
              center={[latitude, longitude]}
              zoom={mapZoom}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              <MapFlyToController
                center={[latitude, longitude]}
                zoom={mapZoom}
              />
              <MapInteractiveDrawer
                position={[latitude, longitude]}
                isDrawingMode={isDrawingMode}
                boundaryVertices={boundaryVertices}
                onPinLocation={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                onAddVertex={handleAddVertex}
              />
            </MapContainer>

            <div className="absolute top-2 left-2 z-[1000] bg-[#111913]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#A6C487]/20 text-[11px] text-white">
              {isDrawingMode
                ? 'Click on the satellite imagery to add perimeter boundary vertices.'
                : 'Click anywhere to pin farm centroid coordinate.'}
            </div>

            {/* Current Geo Target Badge */}
            <div className="absolute bottom-2 right-2 z-[1000] bg-[#111913]/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#A6C487]/25 text-[10px] text-[#A6C487] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B5CF78] animate-pulse"></span>
              <span>
                {adminLevel2 || adminLevel1 || countryCode}: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Centroid Latitude (°N) <span className="text-[#B5CF78]">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white focus:outline-none focus:border-[#B5CF78]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Centroid Longitude (°E) <span className="text-[#B5CF78]">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white focus:outline-none focus:border-[#B5CF78]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-white mb-1">
                Boundary GeoJSON String (Automatic or Paste Custom Feature)
              </label>
              <textarea
                rows={3}
                value={geoJsonInput}
                onChange={(e) => handleGeoJsonTextChange(e.target.value)}
                placeholder='{"type": "Polygon", "coordinates": [[[...]]]}'
                className="w-full p-2.5 font-mono text-[11px] bg-[#111913] border border-[#A6C487]/25 rounded-xl text-[#A6C487] focus:outline-none focus:border-[#B5CF78]"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Soil, Water Supply & Farmer Soil Guide */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              4. Edaphic Properties & Water Supply
            </h3>
            <button
              type="button"
              onClick={() => setShowSoilModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#B5CF78]/15 hover:bg-[#B5CF78]/25 text-[#B5CF78] border border-[#B5CF78]/30 text-xs font-semibold transition-all shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Soil Identification & Recommended Crops Guide</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-white">
                  Dominant Soil Type
                </label>
                <button
                  type="button"
                  onClick={() => setShowSoilModal(true)}
                  className="text-[11px] text-[#B5CF78] hover:underline flex items-center gap-1 font-medium"
                >
                  <HelpCircle className="w-3 h-3" />
                  Not sure? Identify soil
                </button>
              </div>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value as SoilType)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white focus:outline-none focus:border-[#B5CF78]"
              >
                {SOIL_OPTIONS.map((soil) => (
                  <option key={soil} value={soil} className="bg-[#18251D] text-white">
                    {soil}
                  </option>
                ))}
              </select>

              {/* Dynamic Soil Quick Preview for Farmers */}
              {(() => {
                const doc = getSoilDocByType(soilType);
                if (!doc) return null;
                return (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#18251D]/70 border border-[#A6C487]/20 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: doc.colorCode }}
                        />
                        {doc.shortName}
                        {doc.localNameAmharic && (
                          <span className="text-[#B5CF78] font-normal">({doc.localNameAmharic})</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSoilModal(true)}
                        className="text-[#B5CF78] hover:underline text-[10px] font-semibold"
                      >
                        View Full Dossier
                      </button>
                    </div>
                    <p className="text-[#A6C487] leading-relaxed line-clamp-2">
                      <strong className="text-white">Farmer Clue:</strong> {doc.farmerCharacteristics}
                    </p>
                    <p className="text-[#A6C487] leading-relaxed">
                      <strong className="text-white">Recommended:</strong>{' '}
                      <span className="text-[#B5CF78] font-medium">
                        {doc.recommendedCrops.slice(0, 4).join(', ')}
                        {doc.recommendedCrops.length > 4 ? '...' : ''}
                      </span>
                    </p>
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Water Availability
              </label>
              <select
                value={waterAvailability}
                onChange={(e) => setWaterAvailability(e.target.value as WaterAvailability)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white focus:outline-none focus:border-[#B5CF78]"
              >
                {WATER_OPTIONS.map((w) => (
                  <option key={w} value={w} className="bg-[#18251D] text-white">
                    {w}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-[#A6C487] leading-relaxed">
                Indicate if field relies purely on seasonal precipitation or has access to river diversion, boreholes, or supplemental gravity irrigation.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-white mb-1">
                Field Observations & Historical Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention historical yields, drainage conditions, or local irrigation access..."
                className="w-full px-3.5 py-2.5 text-xs bg-[#111913] border border-[#A6C487]/25 rounded-xl text-white placeholder-[#A6C487]/50 focus:outline-none focus:border-[#B5CF78]"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-[#A6C487]/15 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/farms')}
            className="px-4 py-2.5 text-xs font-semibold text-[#A6C487] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-[#111913] bg-[#B5CF78] hover:bg-[#27ae60] rounded-xl shadow-lg shadow-[#B5CF78]/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Farm Changes' : 'Register Farm in Database'}</span>
          </button>
        </div>
      </form>

      {/* Soil Knowledge & Identification Modal */}
      <SoilKnowledgeModal
        isOpen={showSoilModal}
        onClose={() => setShowSoilModal(false)}
        selectedSoilType={soilType}
        onSelectSoilType={(newSoil) => setSoilType(newSoil)}
      />
    </div>
  );
};
