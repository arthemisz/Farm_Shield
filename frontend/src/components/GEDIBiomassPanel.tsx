import React, { useState, useEffect } from 'react';
import { TreePine, AlertCircle, RefreshCw, Info, ExternalLink } from 'lucide-react';
import { FarmShieldApi } from '../services/api';

interface GEDIBiomassPanelProps {
  farmId: string;
}

export const GEDIBiomassPanel: React.FC<GEDIBiomassPanelProps> = ({ farmId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGedi = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await FarmShieldApi.getGediDataForFarm(farmId);
      if (res && res.success && res.data) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load GEDI biomass observations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (farmId) {
      fetchGedi();
    }
  }, [farmId]);

  if (loading) {
    return (
      <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] p-6 shadow-natural-xs">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-[#2B4031] animate-spin" />
          <div>
            <h3 className="text-sm font-bold text-[#2B4031]">NASA GEDI Vegetation & Biomass Structure</h3>
            <p className="text-xs text-[#748077] mt-0.5">Querying verified footprint and gridded observations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] p-6 shadow-natural-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
          <button
            onClick={fetchGedi}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2B4031] bg-[#F3F1E9] rounded-xl hover:bg-[#E5EBDD] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  if (!data || (!data.l4a?.count && !data.l4b?.count)) {
    return (
      <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] p-6 shadow-natural-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#F3F1E9] text-[#748077] rounded-2xl">
            <TreePine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2B4031]">NASA GEDI Vegetation & Biomass Structure</h3>
            <p className="text-xs text-[#748077] mt-0.5">
              No verified GEDI footprint or gridded observations are available for this location. Gaps between ISS lidar footprints are classified as DATA_PENDING.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const l4aObs = data.l4a?.observations || [];
  const l4bObs = data.l4b?.observations || [];
  const coverage = data.gediCoverage || {};
  const agbdObs = l4aObs.find((o: any) => o.variableName === 'agbd');
  const agbdSeObs = l4aObs.find((o: any) => o.variableName === 'agbd_se');
  const muObs = l4bObs.find((o: any) => o.variableName === 'MU');

  return (
    <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] p-6 shadow-natural-xs space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E4D9] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#2B4031] text-white rounded-2xl">
            <TreePine className="w-5 h-5 text-[#ECC3A2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#2B4031]">NASA GEDI Vegetation & Aboveground Biomass</h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                {data.l4a?.provenance === 'LITERATURE_REFERENCE' ? 'LITERATURE REFERENCE' : (data.l4a?.provenance || 'REFERENCE')}
              </span>
            </div>
            <p className="text-xs text-[#748077] mt-0.5">
              Regional literature-calibrated baseline reference. <strong>Not an original direct NASA GEDI satellite granule retrieval.</strong>
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold text-[#8C3B00] bg-[#FAECE1] px-2.5 py-1 rounded-xl border border-[#ECC3A2]">
            Spatial Match: {coverage.hasGenuineSpatialMatch ? 'VERIFIED MATCH' : 'NO MATCHING GRANULE (ORBITAL RANGE ONLY)'}
          </span>
        </div>
      </div>

      {/* Grid of L4A and L4B products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* L4A Footprint Card */}
        <div className="p-4 bg-[#F3F1E9] rounded-2xl border border-[#E4E4D9] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2B4031]">GEDI L4A Footprint Level</span>
              <span className="text-[10px] text-[#748077]">v2.1 Baseline</span>
            </div>
            <p className="text-[11px] text-[#748077] mt-0.5">
              Footprint: ~25m circle · ~60m along-track spacing
            </p>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2B4031]">
                {agbdObs ? agbdObs.value : '—'}
              </span>
              <span className="text-xs font-semibold text-[#748077]">
                {agbdObs?.unit || 'Mg/ha'}
              </span>
              {agbdSeObs && (
                <span className="text-xs font-medium text-[#D98245]">
                  ± {agbdSeObs.value} {agbdSeObs.unit}
                </span>
              )}
            </div>

            <div className="mt-2 space-y-1 text-[11px] text-[#748077]">
              <div>Quality: <span className="font-semibold text-[#2B4031]">{agbdObs?.qualityFlag || 'l4_quality_flag=1'}</span></div>
              <div>Acquisition: <span className="font-semibold text-[#2B4031]">{agbdObs?.observationDate || '2022-08'}</span></div>
              {agbdObs?.distanceFromFarmKm !== undefined && (
                <div>Distance from farm centroid: <span className="font-semibold text-[#2B4031]">{agbdObs.distanceFromFarmKm} km</span></div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#E4E4D9] flex items-center justify-between text-[10px] text-[#748077]">
            <span>DOI: 10.3334/ORNLDAAC/2056</span>
            <span className="font-medium text-[#D98245]">Footprint sample</span>
          </div>
        </div>

        {/* L4B Gridded Card */}
        <div className="p-4 bg-[#E5EBDD] rounded-2xl border border-[#DCE8D8] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2B4031]">GEDI L4B Gridded Biomass</span>
              <span className="text-[10px] text-[#748077]">1km Grid Cell</span>
            </div>
            <p className="text-[11px] text-[#748077] mt-0.5">
              Spatial mean (MU) across 1000m × 1000m grid cell
            </p>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2B4031]">
                {muObs ? muObs.value : '—'}
              </span>
              <span className="text-xs font-semibold text-[#748077]">
                {muObs?.unit || 'Mg/ha'}
              </span>
            </div>

            <div className="mt-2 space-y-1 text-[11px] text-[#748077]">
              <div>Grid Period: <span className="font-semibold text-[#2B4031]">2019-04-18 to 2023-03-16</span></div>
              <div>Quality: <span className="font-semibold text-[#2B4031]">{muObs?.qualityFlag || 'VALID'}</span></div>
              <div>Aggregated Variable: <span className="font-semibold text-[#2B4031]">MU (Mean AGBD)</span></div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#DCE8D8] flex items-center justify-between text-[10px] text-[#748077]">
            <span>DOI: 10.3334/ORNLDAAC/2299</span>
            <span className="font-medium text-[#2B4031]">Spatial average</span>
          </div>
        </div>
      </div>

      {/* Scientific Notice & Caveats */}
      <div className="p-3.5 bg-[#FAECE1] rounded-2xl border border-[#ECC3A2] text-xs text-[#29332D] space-y-1.5">
        <div className="flex items-center gap-1.5 text-[#D98245] font-bold">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>Scientific Usage Limitations</span>
        </div>
        <p className="text-[11px] text-[#748077] leading-relaxed">
          GEDI measures woody vegetation structure and aboveground biomass density. It does <strong>not</strong> measure crop yield, soil fertility, or crop health. L4A footprints (~25m) are sampled at ~60m along-track and ~600m beam separation; they do not characterize the entire farm boundary.
        </p>
      </div>
    </div>
  );
};

