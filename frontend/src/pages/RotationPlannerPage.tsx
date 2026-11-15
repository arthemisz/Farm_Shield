import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Globe,
  MapPin,
  Map,
  Sprout,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Radar } from 'react-chartjs-2';
import '../utils/chartSetup';
import { useFarmShield } from '../context/FarmShieldContext';
import { FarmShieldApi } from '../services/api';
import { RotationEvaluation, CropRecommendationCandidate, FarmSpatialMetadata } from '../types';
import { DataSourceBadge } from '../components/common/DataSourceBadge';

export const RotationPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { farms, selectedFarm, setSelectedFarm, crops, selectedCountry, openContextDrawer } = useFarmShield();

  // State for planner selections
  const [currentCrop, setCurrentCrop] = useState<string>(selectedFarm?.currentCrop || 'Bread Wheat');
  const [proposedCrops, setProposedCrops] = useState<string[]>(['Faba Bean']);
  const [evaluation, setEvaluation] = useState<RotationEvaluation | null>(null);

  // State for AI-ranked crop candidate recommendations for the target farm
  const [recommendations, setRecommendations] = useState<CropRecommendationCandidate[]>([]);
  const [spatialMeta, setSpatialMeta] = useState<FarmSpatialMetadata | null>(null);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);

  // Sync currentCrop and load recommendations when selectedFarm changes
  useEffect(() => {
    if (selectedFarm) {
      setCurrentCrop(selectedFarm.currentCrop);
      loadFarmRecommendations(selectedFarm.id);
    }
  }, [selectedFarm]);

  const loadFarmRecommendations = async (farmId: string) => {
    try {
      setLoadingRecs(true);
      const res = await FarmShieldApi.getFarmRecommendations(farmId);
      if (res.success && res.data) {
        if (res.data.data && res.data.data.recommendations) {
          setRecommendations(res.data.data.recommendations);
        } else if (res.data.recommendations) {
          setRecommendations(res.data.recommendations);
        }
        if (res.data.spatial) {
          setSpatialMeta(res.data.spatial);
        }
      }
    } catch (err) {
      console.warn('Failed to load farm recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  // Run rotation evaluation whenever farm, current crop, or proposed sequence changes
  useEffect(() => {
    if (selectedFarm) {
      FarmShieldApi.evaluateRotation(selectedFarm, currentCrop, proposedCrops)
        .then((res) => setEvaluation(res.data));
    }
  }, [selectedFarm, currentCrop, proposedCrops]);

  // Handler to view specific recommendation on interactive map
  const handleViewOnMap = (cropName: string, score?: number) => {
    if (!selectedFarm) return;
    const cropId = cropName.toLowerCase().replace(/[\s\(\)]+/g, '_');
    const recScore = score || evaluation?.overallScore || 85;
    navigate(`/map?farmId=${encodeURIComponent(selectedFarm.id)}&crop=${encodeURIComponent(cropId)}&score=${encodeURIComponent(recScore)}`);
  };

  // Available rotation options based on active country applicability
  const availableRotationCandidates = crops.filter(
    (c) => c.countryApplicability.includes(selectedFarm?.countryCode || 'ET') || c.countryApplicability.includes('ET')
  );

  // Radar Chart Data: Forest Green #2B4031 and Terracotta Orange #D98245
  const getFactorScore = (val: any): number => {
    if (typeof val === 'number') return val;
    if (val && typeof val.score === 'number') return val.score;
    return 75;
  };

  const radarChartData = {
    labels: [
      'Climate / Thermal (25%)',
      'Soil / Edaphic (25%)',
      'Water Needs (25%)',
      'Nutrient Dynamics (15%)',
      'National Adaptation (10%)',
    ],
    datasets: [
      {
        label: `${currentCrop} → ${proposedCrops.join(' → ')}`,
        data: evaluation
          ? [
              getFactorScore(evaluation.factors.climateSuitability ?? evaluation.factors.soilCompatibility),
              getFactorScore(evaluation.factors.soilSuitability ?? evaluation.factors.soilCompatibility),
              getFactorScore(evaluation.factors.waterRequirements ?? evaluation.factors.moistureSufficiency),
              getFactorScore(evaluation.factors.nitrogenFixation ?? evaluation.factors.nutrientManagement),
              getFactorScore(evaluation.factors.cropDiversity ?? evaluation.factors.adaptationLevel),
            ]
          : [80, 80, 80, 80, 80],
        backgroundColor: 'rgba(36, 76, 58, 0.2)',
        borderColor: '#2B4031',
        pointBackgroundColor: '#D98245',
        pointBorderColor: '#FFFEFA',
        pointHoverBackgroundColor: '#FFFEFA',
        pointHoverBorderColor: '#BC6935',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5EBDD] text-[#2B4031] text-[11px] font-bold mb-2 border border-[#DCE8D8]">
            <Compass className="w-3.5 h-3.5 text-[#D98245]" />
            <span>NASA Space Apps Challenge 07/14 • Field Shift</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2B4031] tracking-tight">
            Plan Your Next Crop Rotation
          </h2>
          <p className="text-xs sm:text-sm text-[#748077] mt-0.5">
            Configurable multi-criteria evaluation integrating climate risk, coordinate soil texture, water balance, and legume nitrogen contribution.
          </p>
        </div>
      </div>

      <DataSourceBadge source="NASA Agroclimate Heuristic Matrix & Multi-Country Suitability Profile" />

      {selectedCountry.supportStatus !== 'fully_supported' && (
        <div className="p-4 bg-[#FAECE1] border border-[#ECC3A2] rounded-2xl text-xs text-[#773E1D] flex items-start gap-3">
          <Info className="w-4 h-4 text-[#D98245] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#BC6935]">Expansion Prototype Notice: </span>
            Evaluations for <strong>{selectedCountry.name}</strong> utilize regional East African baseline indicators. Recommendations for planned countries remain exploratory pending agricultural institution calibration.
          </div>
        </div>
      )}

      {/* Configuration & Selection Panel: Warm White #FFFEFA surface with soft border #E4E4D9 */}
      <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] shadow-natural-xs p-6 space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B4031]">
          Rotation Sequence Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Farm Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#29332D] mb-1">
              1. Target Farm Parcel
            </label>
            <select
              aria-label="Target farm for rotation"
              value={selectedFarm?.id || ''}
              onChange={(e) => {
                const found = farms.find((f) => f.id === e.target.value);
                if (found) setSelectedFarm(found);
              }}
              className="w-full px-3.5 py-2.5 text-xs bg-[#F3F1E9] border border-[#E4E4D9] rounded-xl text-[#2B4031] focus:outline-hidden focus:border-[#72966F] font-bold"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.countryCode} - {f.soilType})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[#748077] mt-1">
              Soil: {selectedFarm?.soilType} • Regimen: {selectedFarm?.waterAvailability}
            </p>
          </div>

          {/* Current Crop */}
          <div>
            <label className="block text-xs font-semibold text-[#29332D] mb-1">
              2. Current / Preceding Crop (Year N)
            </label>
            <select
              aria-label="Current crop for rotation"
              value={currentCrop}
              onChange={(e) => setCurrentCrop(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#F3F1E9] border border-[#E4E4D9] rounded-xl text-[#29332D] focus:outline-hidden focus:border-[#72966F] font-bold"
            >
              {availableRotationCandidates.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[#748077] mt-1">
              Currently occupying harvest bed
            </p>
          </div>

          {/* Proposed Next Crop */}
          <div>
            <label className="block text-xs font-semibold text-[#29332D] mb-1">
              3. Proposed Next Crop (Year N+1)
            </label>
            <select
              aria-label="Proposed next crop for rotation"
              value={proposedCrops[0] || 'Faba Bean'}
              onChange={(e) => setProposedCrops([e.target.value])}
              className="w-full px-3.5 py-2.5 text-xs bg-[#F3F1E9] border border-[#E4E4D9] rounded-xl text-[#2B4031] focus:outline-hidden focus:border-[#72966F] font-bold"
            >
              {availableRotationCandidates.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[#748077] mt-1">
              Sequence candidate to evaluate
            </p>
          </div>
        </div>

        {/* Quick Rotation Sequence Presets */}
        <div className="pt-4 border-t border-[#E4E4D9] flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-[#748077]">Quick Test Pairs:</span>
          <button
            onClick={() => {
              setCurrentCrop('Bread Wheat');
              setProposedCrops(['Faba Bean']);
            }}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#E5EBDD] text-[#2B4031] border border-[#DCE8D8] hover:bg-[#DCE8D8] font-bold transition-colors shadow-natural-xs"
          >
            Wheat → Faba Bean (Legume Break)
          </button>
          <button
            onClick={() => {
              setCurrentCrop('Bread Wheat');
              setProposedCrops(['Bread Wheat']);
            }}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#FAECE1] text-[#9E2A2B] border border-[#F8D7DA] hover:bg-[#FDF2F2] font-bold transition-colors shadow-natural-xs"
          >
            Wheat → Wheat (Continuous Mono-crop)
          </button>
          <button
            onClick={() => {
              setCurrentCrop('Maize (Corn)');
              setProposedCrops(['Teff']);
            }}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#FAECE1] text-[#BC6935] border border-[#ECC3A2] hover:bg-[#FAECE1]/70 font-bold transition-colors shadow-natural-xs"
          >
            Maize → Teff (Cereal Shift)
          </button>
        </div>
      </div>

      {/* Main Results Showcase: Score Banner & Radar */}
      {evaluation && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Score Hero Card */}
            <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] shadow-natural-xs p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#748077]">
                    Decision Support Assessment ({evaluation.countryCode})
                  </span>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-[#2B4031]">
                      {evaluation.overallScore} <span className="text-lg text-[#748077] font-normal">/ 100</span>
                    </span>
                    <span
                      className={`px-3.5 py-1 rounded-full text-xs font-bold ${
                        evaluation.overallAssessment === 'Highly Recommended'
                          ? 'bg-[#E5EBDD] text-[#2B4031] border border-[#DCE8D8]'
                          : evaluation.overallAssessment === 'Recommended'
                          ? 'bg-[#E5EBDD] text-[#72966F] border border-[#DCE8D8]'
                          : evaluation.overallAssessment === 'Not Advised'
                          ? 'bg-[#FDF2F2] text-[#9E2A2B] border border-[#F8D7DA]'
                          : 'bg-[#FAECE1] text-[#BC6935] border border-[#ECC3A2]'
                      }`}
                    >
                      {evaluation.overallAssessment}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <div className="text-right sm:border-l sm:border-[#E4E4D9] sm:pl-5">
                    <div className="text-xs text-[#748077]">Sequence Tested</div>
                    <div className="text-sm font-bold text-[#2B4031] flex items-center gap-1.5 mt-0.5">
                      <span>{evaluation.currentCrop}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D98245]" />
                      <span>{evaluation.proposedSequence.join(' → ')}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-end">
                    <button
                      onClick={() => handleViewOnMap(proposedCrops[0] || 'Faba Bean', evaluation.overallScore)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#B5CF78] text-[#111913] font-bold text-xs hover:bg-[#27ae60] shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Map className="w-3.5 h-3.5" />
                      <span>View on Map</span>
                    </button>
                    <button
                      onClick={() =>
                        openContextDrawer({
                          type: 'rotation',
                          title: `${evaluation.currentCrop} → ${evaluation.proposedSequence.join(' → ')}`,
                          subtitle: `Decision Score: ${evaluation.overallScore}/100 (${evaluation.overallAssessment})`,
                          badge: evaluation.overallAssessment,
                          badgeColor: evaluation.overallAssessment === 'Highly Recommended' ? 'green' : 'orange',
                          data: {
                            ...evaluation,
                            currentCrop: evaluation.currentCrop,
                            nextCrop: evaluation.proposedSequence.join(' → '),
                          },
                          provenance: {
                            source: 'FarmShield Explainable Rule Engine + CHIRPS/NASA POWER/SoilGrids',
                            status: 'LIVE',
                          },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#2B4031] text-[#FFFEFA] font-bold text-xs hover:bg-[#1B3B2D] transition-colors flex items-center gap-1.5"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Scientific Evidence</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-4 bg-[#F3F1E9] rounded-2xl border border-[#E4E4D9] text-xs text-[#29332D] leading-relaxed">
                <strong className="text-[#2B4031]">Agronomic Rationale: </strong>
                {evaluation.summaryExplanation}
              </div>

              {/* 5 Evaluation Categories Bar Gauges */}
              <div className="mt-6 space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B4031]">
                  Evaluation Factors & Profile Weights
                </h4>

                {Object.entries(evaluation.factors).map(([key, factor]: [string, any]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#29332D]">
                        {factor.name} <span className="text-[#748077] font-normal">({factor.weightPct}%)</span>
                      </span>
                      <span className="font-bold text-[#2B4031]">{factor.score} / 100</span>
                    </div>
                    <div className="w-full bg-[#E5EBDD] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          factor.score >= 80
                            ? 'bg-[#2B4031]'
                            : factor.score >= 60
                            ? 'bg-[#D98245]'
                            : 'bg-[#9E2A2B]'
                        }`}
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[#748077]">{factor.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Positive Factors vs Potential Risks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Positive Factors */}
              <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] p-6 shadow-natural-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B4031] flex items-center gap-1.5 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-[#72966F]" />
                  Positive Agronomic Factors
                </h4>
                <ul className="space-y-2 text-xs text-[#29332D]">
                  {evaluation.positiveHighlights.map((pos, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#72966F] mt-0.5 font-bold">•</span>
                      <span>{pos}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Potential Risks */}
              <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] p-6 shadow-natural-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#BC6935] flex items-center gap-1.5 mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#D98245]" />
                  Potential Agronomic Risks
                </h4>
                <ul className="space-y-2 text-xs text-[#29332D]">
                  {evaluation.potentialRisks.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#D98245] mt-0.5 font-bold">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Multi-criteria Radar Chart & Scientific Missing Info */}
          <div className="lg:col-span-5 space-y-6">
            {/* Multi-Factor Radar Chart */}
            <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] p-6 shadow-natural-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#2B4031] mb-1">
                  Multi-Factor Resiliency Polygon
                </h3>
                <p className="text-xs text-[#748077] mb-3">
                  Heuristic radar balance across all 5 evaluation dimensions.
                </p>

                <div className="h-64 flex items-center justify-center">
                  <Radar
                    data={radarChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          min: 0,
                          max: 100,
                          ticks: { stepSize: 20, display: false },
                          pointLabels: { font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" }, color: '#748077' },
                          grid: { color: '#E4E4D9' },
                          angleLines: { color: '#E4E4D9' },
                        },
                      },
                      plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" }, color: '#748077' } },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E4E4D9] text-[11px] text-[#748077] text-center">
                Balanced polygons indicate resilient agricultural diversification.
              </div>
            </div>

            {/* Missing Info & Model Caveats */}
            <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] p-6 shadow-natural-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2B4031]">
                <Info className="w-4 h-4 text-[#72966F]" />
                <span>Known Missing Data / Research Gaps</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#29332D] list-disc list-inside">
                {evaluation.missingInformationNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>

              {/* Transparent Disclaimer */}
              <div className="p-4 bg-[#FAECE1] border border-[#ECC3A2] rounded-2xl text-[11px] text-[#773E1D] leading-relaxed mt-4">
                <strong className="text-[#BC6935]">Transparent Advisory Disclaimer: </strong>
                {evaluation.disclaimer}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION: ALL RECOMMENDED CROPS FOR TARGET FARM (MAP LINKED)
      ───────────────────────────────────────────────────────────── */}
      {selectedFarm && (
        <div className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] shadow-natural-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E4D9] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#E5EBDD] text-[#2B4031]">
                  <Sprout className="w-4 h-4" />
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#2B4031]">
                  Explainable Crop Recommendations for {selectedFarm.name}
                </h3>
              </div>
              <p className="text-xs text-[#748077] mt-1">
                Spatial parcel: {selectedFarm.latitude.toFixed(4)}°N, {selectedFarm.longitude.toFixed(4)}°E • Preceding crop: <strong className="text-[#2B4031]">{selectedFarm.currentCrop}</strong>
                {spatialMeta?.hasBoundary && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#2B4031] bg-[#E5EBDD] px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3 h-3 text-[#72966F]" />
                    Verified Boundary ({spatialMeta.calculatedAreaHectares || selectedFarm.size} ha)
                  </span>
                )}
                {!spatialMeta?.hasBoundary && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#BC6935] bg-[#FAECE1] px-2 py-0.5 rounded-md">
                    <MapPin className="w-3 h-3 text-[#D98245]" />
                    Point Location (Boundary Not Registered)
                  </span>
                )}
              </p>
            </div>

            <Link
              to={`/map?farmId=${encodeURIComponent(selectedFarm.id)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2B4031] hover:bg-[#1B3B2D] text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
            >
              <Map className="w-4 h-4 text-[#B5CF78]" />
              <span>Explore Farm on Map</span>
            </Link>
          </div>

          {loadingRecs ? (
            <div className="p-8 text-center text-xs text-[#748077]">
              Evaluating explainable rotation candidates against soil & climate layers...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#748077] bg-[#F3F1E9] rounded-2xl">
              No additional crop candidates generated for this agroclimatic zone.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec) => {
                const isSelected = proposedCrops[0] === rec.cropName;
                return (
                  <div
                    key={rec.cropId}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#E5EBDD]/60 border-[#2B4031] shadow-md ring-2 ring-[#2B4031]/20'
                        : 'bg-[#FFFEFA] border-[#E4E4D9] hover:border-[#72966F]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#748077] bg-[#F3F1E9] px-2 py-0.5 rounded-md">
                          {rec.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold text-[#2B4031]">
                            {rec.overallScore}
                          </span>
                          <span className="text-[10px] text-[#748077]">/ 100</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-[#2B4031]">{rec.cropName}</h4>
                        <p className="text-[11px] text-[#748077]">{rec.family} • {rec.growingDurationDays}</p>
                      </div>

                      {rec.nitrogenFixation && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2B4031] bg-[#E5EBDD] px-2 py-0.5 rounded-md">
                          <Sparkles className="w-3 h-3 text-[#B5CF78]" />
                          Biological Nitrogen Fixation
                        </div>
                      )}

                      <div className="space-y-1 text-xs text-[#29332D]">
                        <span className="text-[10px] font-bold uppercase text-[#748077] block">Key Evidence:</span>
                        <ul className="space-y-1 text-[11px] text-[#748077]">
                          {rec.supportingObservations.slice(0, 2).map((obs, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-[#72966F] font-bold">•</span>
                              <span className="line-clamp-2">{obs}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#E4E4D9] flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setProposedCrops([rec.cropName]);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                          isSelected
                            ? 'bg-[#2B4031] text-white font-bold'
                            : 'bg-[#F3F1E9] text-[#2B4031] hover:bg-[#E5EBDD]'
                        }`}
                      >
                        {isSelected ? 'Active Sequence' : 'Test Pair'}
                      </button>

                      <button
                        onClick={() => handleViewOnMap(rec.cropName, rec.overallScore)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#B5CF78] text-[#111913] hover:bg-[#27ae60] shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Map className="w-3.5 h-3.5" />
                        <span>View on Map</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
