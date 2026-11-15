import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Satellite,
  Calendar,
  Cloud,
  Layers,
  Info,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { useFarmShield } from '../context/FarmShieldContext';
import { FarmShieldApi } from '../services/api';
import { DataSourceBadge } from '../components/common/DataSourceBadge';

// Status badge component for provenance transparency
const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, { color: string; label: string }> = {
    LIVE:          { color: 'bg-green-100 text-green-800 border-green-300',      label: 'LIVE — Actual pixels' },
    PARTIAL:       { color: 'bg-[#D98245]/10 text-[#D98245] border-[#D98245]/30', label: 'PARTIAL — STAC only' },
    CACHED:        { color: 'bg-blue-100 text-blue-800 border-blue-300',          label: 'CACHED' },
    UNAVAILABLE:   { color: 'bg-red-100 text-red-700 border-red-300',             label: 'UNAVAILABLE' },
    DEMONSTRATION: { color: 'bg-gray-100 text-gray-600 border-gray-300',          label: 'DEMONSTRATION' },
  };
  const { color, label } = cfg[status] || cfg['UNAVAILABLE'];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
};

export const VegetationPage: React.FC = () => {
  const { selectedFarm, farms, setSelectedFarm } = useFarmShield();
  const [vegData, setVegData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (selectedFarm) {
      setLoading(true);
      FarmShieldApi.getFarmVegetation(selectedFarm.id)
        .then((res) => {
          setVegData(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [selectedFarm]);

  const ndvi = vegData?.currentNdviIndex;          // null when not computed from pixels
  const hasRealNdvi = ndvi !== null && ndvi !== undefined;
  const sat = vegData?.satelliteObservation;
  const prov = vegData?.provenance ?? {};
  const dataStatus: string = prov.status || 'UNAVAILABLE';
  const isDemoData: boolean = vegData?.isDemoData || prov.isDemoData || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#72966F] bg-[#72966F]/10 px-2 py-0.5 rounded-full">
              Earth Observation Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#2B4031]">Sentinel-2 Vegetation &amp; Canopy Vigor</h1>
          <p className="text-xs text-[#748077]">
            Copernicus Sentinel-2 Level-2A (10m) Normalized Difference Vegetation Index (NDVI).
          </p>
        </div>

        {/* Farm Selector */}
        <select
          value={selectedFarm?.id || ''}
          onChange={(e) => {
            const f = farms.find((item) => item.id === e.target.value);
            if (f) setSelectedFarm(f);
          }}
          className="text-xs bg-[#FFFEFA] border border-[#E4E4D9] rounded-xl px-3 py-2 text-[#2B4031] font-semibold focus:outline-none focus:border-[#72966F]"
        >
          {farms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.countryCode})
            </option>
          ))}
        </select>
      </div>

      {/* Scientific Limitation & Buffer Area Clarification */}
      <div className="p-4 rounded-2xl bg-[#E5EBDD] border border-[#72966F]/40 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#2B4031] shrink-0 mt-0.5" />
        <div className="text-xs text-[#29332D] space-y-1">
          <p className="font-bold text-[#2B4031]">
            Sampling Area Clarification &amp; Scientific Limitations
          </p>
          <p className="text-[#748077]">
            Spectral bands are sampled over a <strong>500-meter centroid buffer</strong> centered on
            the farm's recorded coordinates ({selectedFarm?.latitude?.toFixed(4)}, {selectedFarm?.longitude?.toFixed(4)}).
          </p>
          <p className="text-[#748077]">
            <strong>NDVI</strong> quantifies <em>photosynthetic green canopy absorption</em> via Band 4 (Red, 665nm) and
            Band 8 (NIR, 842nm). It does <strong>not</strong> identify botanical species, quantify soil moisture,
            or guarantee commercial harvest yield.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#748077] bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9]">
          Resolving Sentinel-2 L2A scenes via Microsoft Planetary Computer STAC...
        </div>
      ) : (
        <>
          {/* Data Status Banner */}
          {!hasRealNdvi && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              dataStatus === 'PARTIAL'
                ? 'bg-[#D98245]/8 border-[#D98245]/30'
                : 'bg-red-50 border-red-200'
            }`}>
              <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${dataStatus === 'PARTIAL' ? 'text-[#D98245]' : 'text-red-500'}`} />
              <div className="text-xs space-y-1">
                <p className={`font-bold ${dataStatus === 'PARTIAL' ? 'text-[#D98245]' : 'text-red-700'}`}>
                  {dataStatus === 'PARTIAL'
                    ? 'PARTIAL DATA — Sentinel-2 scene located; pixel reads not completed'
                    : 'NDVI NOT AVAILABLE — No satellite data retrieved'}
                </p>
                <p className="text-[#748077]">
                  {dataStatus === 'PARTIAL'
                    ? 'The Planetary Computer STAC API located a matching Sentinel-2 scene and resolved band asset URLs. However, COG pixel streaming requires an active Microsoft Azure blob storage connection, which was not available. No synthetic NDVI value has been substituted.'
                    : 'No cloud-free Sentinel-2 scene was found in the 90-day search window, or the Planetary Computer STAC API was unreachable. NDVI cannot be reported.'}
                </p>
                {prov.pixelReadError && (
                  <p className="text-[#748077] font-mono text-[10px] bg-[#F3F1E9] px-2 py-1 rounded">
                    Error: {prov.pixelReadError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Main Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* NDVI Card */}
            <div className="bg-[#FFFEFA] p-6 rounded-3xl border border-[#E4E4D9] shadow-natural-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#748077]">Canopy NDVI</span>
                <StatusPill status={dataStatus} />
              </div>
              {hasRealNdvi ? (
                <>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-4xl font-black text-[#2B4031]">{ndvi.toFixed(3)}</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E5EBDD] text-[#2B4031]">
                      {vegData?.vegetationCondition || 'Moderate Activity'}
                    </span>
                  </div>
                  {vegData?.ndviMedian !== undefined && (
                    <p className="text-[11px] text-[#748077] mt-1">
                      Median: <strong>{vegData.ndviMedian.toFixed(3)}</strong> · Std: <strong>{vegData.ndviStd?.toFixed(3)}</strong>
                    </p>
                  )}
                  {vegData?.validPixelCount && (
                    <p className="text-[11px] text-[#748077] mt-0.5">
                      {vegData.validPixelCount} valid pixels sampled
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-2">
                  <span className="text-2xl font-black text-[#748077]">—</span>
                  <p className="text-xs text-[#748077] mt-1">Not computed from pixels</p>
                  <p className="text-[11px] text-[#748077] mt-0.5 italic">No synthetic value substituted</p>
                </div>
              )}
              <p className="text-xs text-[#748077] mt-3">
                Formula: <code className="bg-[#F3F1E9] px-1.5 py-0.5 rounded text-[#2B4031] font-mono">NDVI = (B08 - B04) / (B08 + B04)</code>
              </p>
            </div>

            {/* Satellite Metadata Card */}
            <div className="bg-[#FFFEFA] p-6 rounded-3xl border border-[#E4E4D9] shadow-natural-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-[#748077]">Scene Acquisition</span>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#748077]">Platform:</span>
                  <span className="font-bold text-[#2B4031]">{sat?.platform || 'Sentinel-2'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#748077]">Acquisition Date:</span>
                  <span className="font-semibold text-[#29332D]">
                    {sat?.observationDate ? sat.observationDate.split('T')[0] : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#748077]">Cloud Cover:</span>
                  <span className="font-bold text-[#D98245]">
                    {sat?.cloudCoveragePercentage !== null && sat?.cloudCoveragePercentage !== undefined
                      ? `${sat.cloudCoveragePercentage}%`
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#748077]">Spatial Resolution:</span>
                  <span className="font-semibold text-[#2B4031]">10 metres / pixel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#748077]">Temporal Revisit:</span>
                  <span className="font-semibold text-[#2B4031]">~5 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#748077]">Scene ID:</span>
                  <span className="font-mono text-[10px] text-[#748077] truncate max-w-[120px]" title={sat?.sceneId}>
                    {sat?.sceneId || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Spectral Channels Card */}
            <div className="bg-[#FFFEFA] p-6 rounded-3xl border border-[#E4E4D9] shadow-natural-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-[#748077]">Resolved Bands</span>
              <div className="mt-2 space-y-2 text-xs">
                <div className={`p-2 rounded-xl border ${sat?.redBandHref ? 'bg-green-50 border-green-200' : 'bg-[#F3F1E9] border-[#E4E4D9]'}`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    {sat?.redBandHref ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-[#748077]" />}
                    <span className="font-bold text-red-700">Band 04 (Red 665nm)</span>
                  </div>
                  <p className="text-[11px] text-[#748077]">Chlorophyll-a absorption peak</p>
                  <p className="text-[10px] text-[#748077] mt-0.5">
                    {sat?.redBandHref ? 'HREF resolved from STAC' : 'Not available'}
                  </p>
                </div>
                <div className={`p-2 rounded-xl border ${sat?.nirBandHref ? 'bg-green-50 border-green-200' : 'bg-[#F3F1E9] border-[#E4E4D9]'}`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    {sat?.nirBandHref ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-[#748077]" />}
                    <span className="font-bold text-[#2B4031]">Band 08 (NIR 842nm)</span>
                  </div>
                  <p className="text-[11px] text-[#748077]">Spongy mesophyll cell wall reflectance</p>
                  <p className="text-[10px] text-[#748077] mt-0.5">
                    {sat?.nirBandHref ? 'HREF resolved from STAC' : 'Not available'}
                  </p>
                </div>
                {hasRealNdvi && (
                  <div className="p-2 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <span className="font-bold text-green-800 text-[11px]">COG pixels sampled</span>
                    </div>
                    <p className="text-[10px] text-green-700 mt-0.5">NDVI computed from actual reflectance</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Raster Processing Status */}
          <div className="bg-[#FFFEFA] p-6 rounded-3xl border border-[#E4E4D9] shadow-natural-xs">
            <h3 className="text-sm font-bold text-[#2B4031] mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#72966F]" />
              <span>STAC Asset &amp; Raster Processing Status</span>
            </h3>
            <p className="text-xs text-[#748077] mb-3">
              {vegData?.rasterProcessingStatus || 'Sentinel-2 Level-2A assets parsed from Microsoft Planetary Computer.'}
            </p>

            {/* Data provenance table */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F3F1E9] border border-[#E4E4D9]">
                <p className="text-[#748077] text-[10px] uppercase font-bold mb-1">Source</p>
                <p className="font-semibold text-[#2B4031] text-[11px]">{prov.dataset || 'Sentinel-2 L2A'}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F3F1E9] border border-[#E4E4D9]">
                <p className="text-[#748077] text-[10px] uppercase font-bold mb-1">Status</p>
                <StatusPill status={dataStatus} />
              </div>
              <div className="p-3 rounded-xl bg-[#F3F1E9] border border-[#E4E4D9]">
                <p className="text-[#748077] text-[10px] uppercase font-bold mb-1">Resolution</p>
                <p className="font-semibold text-[#2B4031] text-[11px]">{prov.spatialResolution || '10m'}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F3F1E9] border border-[#E4E4D9]">
                <p className="text-[#748077] text-[10px] uppercase font-bold mb-1">Retrieved</p>
                <p className="font-semibold text-[#2B4031] text-[11px]">
                  {prov.retrievalTimestamp ? prov.retrievalTimestamp.split('T')[0] : '—'}
                </p>
              </div>
            </div>

            {prov.limitations && (
              <div className="mt-3 p-3 rounded-xl bg-[#F3F1E9] border border-[#E4E4D9]">
                <p className="text-[11px] text-[#748077]">
                  <strong className="text-[#29332D]">Known limitations: </strong>{prov.limitations}
                </p>
              </div>
            )}

            {sat?.previewRgbUrl && (
              <div className="mt-4 pt-4 border-t border-[#E4E4D9]">
                <span className="text-xs font-bold text-[#2B4031] block mb-2">True Color Preview Scene:</span>
                <img
                  src={sat.previewRgbUrl}
                  alt="Sentinel-2 Satellite Scene Preview"
                  className="w-full max-w-md rounded-2xl border border-[#E4E4D9] shadow-natural-xs object-cover max-h-64"
                />
              </div>
            )}
          </div>

          {/* Provenance Badge */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[#748077] italic">
              {isDemoData
                ? 'Demonstration mode — no satellite imagery retrieved.'
                : dataStatus === 'LIVE'
                ? 'NDVI computed from actual Sentinel-2 B04/B08 COG pixel values.'
                : 'NDVI not computed. Scene metadata only. No synthetic value substituted.'}
            </p>
            <DataSourceBadge
              source={`Copernicus Sentinel-2 Level-2A (${dataStatus})`}
            />
          </div>
        </>
      )}
    </div>
  );
};
