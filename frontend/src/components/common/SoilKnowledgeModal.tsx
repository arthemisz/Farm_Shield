import React, { useState } from 'react';
import {
  X,
  Search,
  BookOpen,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Layers,
  Sparkles,
  Info,
  Compass,
  ArrowRight
} from 'lucide-react';
import { SOIL_TYPE_DOCUMENTATION, SoilTypeDoc } from '../../data/soilDocumentation';
import { SoilType } from '../../types';

interface SoilKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSoilType?: SoilType;
  onSelectSoilType?: (soilType: SoilType) => void;
}

export const SoilKnowledgeModal: React.FC<SoilKnowledgeModalProps> = ({
  isOpen,
  onClose,
  selectedSoilType,
  onSelectSoilType
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSoilId, setActiveSoilId] = useState<string>(() => {
    if (selectedSoilType) {
      const match = SOIL_TYPE_DOCUMENTATION.find(
        (s) => s.name === selectedSoilType || selectedSoilType.includes(s.shortName)
      );
      if (match) return match.id;
    }
    return SOIL_TYPE_DOCUMENTATION[0].id;
  });

  if (!isOpen) return null;

  const filteredSoils = SOIL_TYPE_DOCUMENTATION.filter((soil) => {
    const q = searchQuery.toLowerCase();
    return (
      soil.name.toLowerCase().includes(q) ||
      soil.shortName.toLowerCase().includes(q) ||
      (soil.localNameAmharic && soil.localNameAmharic.toLowerCase().includes(q)) ||
      soil.farmerCharacteristics.toLowerCase().includes(q) ||
      soil.texture.toLowerCase().includes(q) ||
      soil.recommendedCrops.some((c) => c.toLowerCase().includes(q))
    );
  });

  const activeSoil: SoilTypeDoc =
    SOIL_TYPE_DOCUMENTATION.find((s) => s.id === activeSoilId) || filteredSoils[0] || SOIL_TYPE_DOCUMENTATION[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#111913] border border-[#A6C487]/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#A6C487]/20 bg-[#18251D]/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#B5CF78]/15 text-[#B5CF78] border border-[#B5CF78]/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Farmer Soil Identification & Crop Recommendation Guide
              </h2>
              <p className="text-xs text-[#A6C487]">
                Practical soil characteristics, visual farmer clues, and verified crops recommended for planting.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#A6C487] hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            aria-label="Close soil guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-[#A6C487]/15 bg-[#111913] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A6C487] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search soil by color, crop (e.g. Teff, Chickpea), feel (sticky, sandy), or local name..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#18251D] border border-[#A6C487]/25 rounded-xl text-white placeholder-[#A6C487]/50 focus:outline-none focus:border-[#B5CF78]"
            />
          </div>
          <span className="text-xs text-[#A6C487] shrink-0 hidden sm:inline">
            {filteredSoils.length} {filteredSoils.length === 1 ? 'soil type' : 'soil types'}
          </span>
        </div>

        {/* Content: Left list, Right detail */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#A6C487]/20 min-h-0">
          {/* Soil List (Left on desktop) */}
          <div className="md:col-span-5 p-3 overflow-y-auto space-y-2 max-h-[300px] md:max-h-[65vh]">
            {filteredSoils.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#A6C487]">
                No soil types matched "{searchQuery}". Try searching for "clay", "sand", "Teff", or "red".
              </div>
            ) : (
              filteredSoils.map((soil) => {
                const isSelected = activeSoil?.id === soil.id;
                const isCurrentFarmSoil = selectedSoilType === soil.name;

                return (
                  <button
                    key={soil.id}
                    onClick={() => setActiveSoilId(soil.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[#1B2A21] border-[#B5CF78] shadow-md shadow-[#B5CF78]/10'
                        : 'bg-[#18251D]/50 border-[#A6C487]/15 hover:bg-[#18251D] hover:border-[#A6C487]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: soil.colorCode }}
                        />
                        <span className="text-xs font-bold text-white">{soil.name}</span>
                      </div>
                      {isCurrentFarmSoil && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#B5CF78]/20 text-[#B5CF78] border border-[#B5CF78]/30">
                          Current
                        </span>
                      )}
                    </div>
                    {soil.localNameAmharic && (
                      <span className="text-[11px] text-[#B5CF78] font-medium pl-5">
                        {soil.localNameAmharic}
                      </span>
                    )}
                    <p className="text-[11px] text-[#A6C487] line-clamp-2 pl-5 leading-relaxed">
                      {soil.farmerCharacteristics}
                    </p>
                    <div className="flex items-center gap-2 pl-5 text-[10px] text-[#A9B2A5] pt-0.5">
                      <span className="text-white font-semibold">Recommended:</span>
                      <span className="truncate">{soil.recommendedCrops.slice(0, 3).join(', ')}...</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Detailed Soil Dossier (Right on desktop) */}
          <div className="md:col-span-7 p-5 overflow-y-auto max-h-[450px] md:max-h-[65vh] space-y-4 bg-[#111913]/70">
            {activeSoil ? (
              <>
                {/* Header of Dossier */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#A6C487]/15 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/30"
                        style={{ backgroundColor: activeSoil.colorCode }}
                      />
                      <h3 className="text-lg font-bold text-white">{activeSoil.name}</h3>
                    </div>
                    {activeSoil.localNameAmharic && (
                      <p className="text-xs font-semibold text-[#B5CF78] mt-0.5">
                        Local terminology: {activeSoil.localNameAmharic}
                      </p>
                    )}
                  </div>

                  {onSelectSoilType && (
                    <button
                      onClick={() => {
                        onSelectSoilType(activeSoil.name);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#B5CF78] text-[#111913] hover:bg-[#27ae60] text-xs font-bold transition-all shrink-0 shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Choose for this Farm</span>
                    </button>
                  )}
                </div>

                {/* Farmer Clue Banner */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>How Farmers Recognize This Soil in the Field:</span>
                  </div>
                  <p className="text-[#E2E8F0] leading-relaxed text-[11px] pl-5">
                    {activeSoil.farmerCharacteristics}
                  </p>
                </div>

                {/* Edaphic Properties Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#18251D]/60 border border-[#A6C487]/15">
                    <span className="text-[10px] text-[#A6C487] block">Texture</span>
                    <span className="text-white font-semibold text-[11px]">{activeSoil.texture}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#18251D]/60 border border-[#A6C487]/15">
                    <span className="text-[10px] text-[#A6C487] block">Drainage Profile</span>
                    <span className="text-white font-semibold text-[11px]">{activeSoil.drainage}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#18251D]/60 border border-[#A6C487]/15">
                    <span className="text-[10px] text-[#A6C487] block">Water Retention</span>
                    <span className="text-white font-semibold text-[11px]">{activeSoil.waterHoldingCapacity}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#18251D]/60 border border-[#A6C487]/15">
                    <span className="text-[10px] text-[#A6C487] block">Natural pH Range</span>
                    <span className="text-white font-semibold text-[11px]">
                      {activeSoil.phRange.min} – {activeSoil.phRange.max}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#18251D]/60 border border-[#A6C487]/15 sm:col-span-2">
                    <span className="text-[10px] text-[#A6C487] block">Plowing & Workability</span>
                    <span className="text-white font-semibold text-[11px]">{activeSoil.workability}</span>
                  </div>
                </div>

                {/* What is Recommended to Plant */}
                <div className="p-4 rounded-xl bg-[#18251D]/90 border border-[#B5CF78]/30 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <Sprout className="w-4 h-4 text-[#B5CF78]" />
                    <span>Recommended Crops to Plant on this Soil:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeSoil.recommendedCrops.map((crop) => (
                      <span
                        key={crop}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#B5CF78]/15 text-[#B5CF78] border border-[#B5CF78]/30 text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#B5CF78]" />
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Crops to Avoid or Handle with Caution */}
                {activeSoil.cropsToAvoidOrDrain.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-red-300 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span>Crops to Avoid or Require Drainage:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#E2E8F0] pl-2">
                      {activeSoil.cropsToAvoidOrDrain.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Farmer Management Tips */}
                <div className="p-3.5 rounded-xl bg-[#111913] border border-[#A6C487]/20 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Agronomic Management Recommendations:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-[#A9B2A5] pl-2">
                    {activeSoil.managementTips.map((tip, idx) => (
                      <li key={idx} className="leading-relaxed">{tip}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#A6C487]/20 bg-[#18251D]/80 flex items-center justify-between text-xs text-[#A6C487]">
          <span>Source: ISRIC SoilGrids, FAO World Reference Base & Ethiopian Agricultural Research Institute (EIAR)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#111913] hover:bg-[#1B2A21] text-white border border-[#A6C487]/30 text-xs font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

