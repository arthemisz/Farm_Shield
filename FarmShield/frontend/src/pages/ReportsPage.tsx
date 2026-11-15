import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
} from 'lucide-react';
import { useFarmShield } from '../context/FarmShieldContext';
import { FarmShieldApi } from '../services/api';
import { RotationEvaluation, ClimateIntelligence, SoilInformation } from '../types';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { UnitConverter } from '../utils/unitConverter';

export const ReportsPage: React.FC = () => {
  const { farms, selectedFarm, setSelectedFarm, settings } = useFarmShield();
  const [reportData, setReportData] = useState<any | null>(null);
  const [climate, setClimate] = useState<ClimateIntelligence | null>(null);
  const [soil, setSoil] = useState<SoilInformation | null>(null);
  const [evaluation, setEvaluation] = useState<RotationEvaluation | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedFarm) {
      Promise.all([
        FarmShieldApi.getFarmReport(selectedFarm.id, 2024),
        FarmShieldApi.getClimateIntelligence(selectedFarm, 2024),
        FarmShieldApi.getSoilInformation(selectedFarm),
        FarmShieldApi.evaluateRotation(selectedFarm, selectedFarm.currentCrop, ['faba_bean']),
      ])
        .then(([rptRes, climRes, soilRes, evalRes]) => {
          setReportData(rptRes.data);
          setClimate(climRes.data);
          setSoil(soilRes.data);
          setEvaluation(evalRes.data);
        });
    }
  }, [selectedFarm]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2B4031] tracking-tight">
            Decision & Agronomic Reports
          </h2>
          <p className="text-xs sm:text-sm text-[#748077] mt-1">
            Print-ready decision brief combining agroclimate indicators, soil health, and recommended rotation sequences.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <select
            aria-label="Select farm for report"
            value={selectedFarm?.id || ''}
            onChange={(e) => {
              const f = farms.find((item) => item.id === e.target.value);
              if (f) setSelectedFarm(f);
            }}
            className="px-3.5 py-2 text-xs bg-[#FFFEFA] border border-[#E4E4D9] rounded-xl font-bold text-[#2B4031] focus:outline-hidden focus:border-[#72966F] shadow-natural-xs"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.countryCode})
              </option>
            ))}
          </select>

          {/* Primary Action Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2B4031] hover:bg-[#24392B] text-white rounded-xl text-xs font-bold shadow-natural-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-[#D98245]" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      <DataSourceBadge source="FarmShield Report Generator (Simulated Demonstration Matrix)" />

      {/* Printable Report Canvas: Warm White #FFFEFA surface with soft border #E4E4D9 */}
      <div
        ref={reportRef}
        className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] shadow-natural-sm p-6 sm:p-10 max-w-4xl mx-auto space-y-8 print:p-0 print:border-none print:shadow-none"
      >
        {/* Document Header */}
        <div className="border-b-2 border-[#2B4031] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-[#2B4031]">
                FarmShield
              </span>
              <span className="text-[10px] bg-[#E5EBDD] text-[#2B4031] border border-[#DCE8D8] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                NASA Space Apps 2026
              </span>
            </div>
            <p className="text-xs text-[#748077] mt-1 font-medium">
              A Global Agricultural Intelligence Platform, Starting in Ethiopia • Challenge 07/14
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-[#748077]">
            <div><strong>Report Date:</strong> {new Date().toLocaleDateString('en-GB')}</div>
            <div>
              <strong>Territory Scope:</strong> <span className="text-[#2B4031] font-bold">{selectedFarm?.country}</span>
            </div>
            <div className="font-mono text-[10px] text-[#748077]">DOC ID: FS-RPT-{selectedFarm?.id.toUpperCase()}</div>
          </div>
        </div>

        {/* Section 1: Farm Profile */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B4031] mb-3 border-b border-[#E4E4D9] pb-1.5">
            1. Farm & Geographic Baseline
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#748077] block text-[11px]">Farm Name</span>
              <span className="font-bold text-[#2B4031]">{selectedFarm?.name}</span>
            </div>
            <div>
              <span className="text-[#748077] block text-[11px]">Country & Admin Division</span>
              <span className="font-semibold text-[#29332D]">
                {selectedFarm?.country}, {selectedFarm?.adminLevel1 || selectedFarm?.region}
              </span>
            </div>
            <div>
              <span className="text-[#748077] block text-[11px]">Parcel Area</span>
              <span className="font-bold text-[#D98245]">
                {UnitConverter.formatArea(selectedFarm?.size || selectedFarm?.sizeHectares || 5.0, selectedFarm?.sizeUnit)}
              </span>
            </div>
            <div>
              <span className="text-[#748077] block text-[11px]">GPS Coordinates</span>
              <span className="font-mono text-[#29332D]">
                {selectedFarm?.latitude.toFixed(4)}°N, {selectedFarm?.longitude.toFixed(4)}°E
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Climate & Soil Health Profile */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B4031] mb-3 border-b border-[#E4E4D9] pb-1.5">
            2. Climate & Soil Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-[#F3F1E9] p-4 rounded-2xl border border-[#E4E4D9]">
            <div>
              <span className="text-[#748077] block text-[11px]">Annual Rainfall (Est.)</span>
              <span className="font-bold text-[#2B4031]">
                {UnitConverter.formatRainfall(climate?.summary.annualRainfallMm || 950, settings.measurementUnits.rainfall)}
              </span>
            </div>
            <div>
              <span className="text-[#748077] block text-[11px]">Mean Temperature</span>
              <span className="font-bold text-[#29332D]">
                {UnitConverter.formatTemperature(climate?.summary.avgTempC || 19.4, settings.measurementUnits.temperature)}
              </span>
            </div>
            <div>
              <span className="text-[#748077] block text-[11px]">Soil Classification</span>
              <span className="font-bold text-[#29332D]">{soil?.soilType}</span>
            </div>
            <div>
              <span className="text-[#748077] block text-[11px]">Soil pH & Fertility</span>
              <span className="font-bold text-[#72966F]">{soil?.ph} pH • {soil?.fertilityStatus}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Rotation Evaluation Result */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B4031] mb-3 border-b border-[#E4E4D9] pb-1.5">
            3. Crop Rotation Recommendation & Decision Factors
          </h3>

          <div className="p-5 rounded-2xl border border-[#E4E4D9] space-y-3 bg-[#FFFEFA]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-[#748077]">Evaluated Sequence:</span>
                <div className="text-sm font-bold text-[#2B4031]">
                  {evaluation?.currentCrop} → {evaluation?.proposedSequence.join(' → ')}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#748077]">Overall Score:</span>
                <div className="text-lg font-black text-[#2B4031]">
                  {evaluation?.overallScore} / 100 ({evaluation?.overallAssessment})
                </div>
              </div>
            </div>

            <p className="text-xs text-[#2B4031] leading-relaxed bg-[#E5EBDD] p-3.5 rounded-xl border border-[#DCE8D8]">
              {evaluation?.summaryExplanation}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-[11px] font-bold text-[#2B4031] block mb-1">
                  Key Agronomic Advantages:
                </span>
                <ul className="text-xs text-[#29332D] space-y-1 list-disc list-inside">
                  {evaluation?.positiveHighlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#D98245] block mb-1">
                  Monitored Agronomic Risks:
                </span>
                <ul className="text-xs text-[#29332D] space-y-1 list-disc list-inside">
                  {evaluation?.potentialRisks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

            {/* Environmental Provenance Details */}
            {reportData?.sources && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B4031] mb-2 border-b border-[#E4E4D9] pb-1.5">
                  4. Integrated Agricultural Data Sources & Provenance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#748077]">
                  {reportData.sources.map((src: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-xl bg-[#F3F1E9] border border-[#E4E4D9]">
                      <span className="font-bold text-[#2B4031]">{src.name}</span>: {src.type} ({src.provider})
                    </div>
                  ))}
                </div>
                {reportData?.faostatStatistics?.statistics && (
                  <div className="mt-3 p-3 rounded-xl bg-[#E5EBDD] border border-[#72966F]/40 text-[11px]">
                    <span className="font-bold text-[#2B4031] block mb-1">FAOSTAT National Production Context:</span>
                    <p className="text-[#748077] mb-1">National production benchmarks for {selectedFarm?.country}:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(reportData.faostatStatistics.statistics).slice(0, 4).map(([k, v]: [string, any]) => (
                        <span key={k} className="bg-[#FFFEFA] px-2 py-0.5 rounded border border-[#E4E4D9] font-medium text-[#2B4031]">
                          {v.cropName}: {v.yieldKgPerHa ? `${v.yieldKgPerHa} kg/ha` : `${v.productionTonnes} tonnes`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {reportData?.nationalCropCalendar?.crops && (
                  <div className="mt-2 p-3 rounded-xl bg-[#F3F1E9] border border-[#E4E4D9] text-[11px]">
                    <span className="font-bold text-[#2B4031] block mb-1">
                      National Agronomic Extension Calendar ({reportData.nationalCropCalendar.researchInstitution}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {Object.entries(reportData.nationalCropCalendar.crops).slice(0, 2).map(([k, v]: [string, any]) => (
                        <div key={k} className="text-[#29332D]">
                          <strong>{k.toUpperCase()}</strong>: Planting: {v.plantingWindow} | Harvest: {v.harvestingWindow}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Scientific Disclaimer & Signature Block */}
        <div className="border-t border-[#E4E4D9] pt-6 space-y-4">
          <div className="p-4 bg-[#FAECE1] rounded-2xl text-[11px] text-[#773E1D] leading-relaxed border border-[#ECC3A2]">
            <strong className="text-[#BC6935]">Prototype Advisory Notice: </strong>
            This dossier was compiled using calibrated heuristic decision models and simulated NASA POWER & SoilGrids indices for the NASA Space Apps Challenge 2026. This report does not replace certified soil chemistry laboratory tests or localized on-site extension advisory.
          </div>

          <div className="flex justify-between items-end pt-4 text-xs text-[#748077]">
            <div>
              <p className="font-bold text-[#2B4031]">FarmShield International Decision Support Platform</p>
              <p>NASA Space Apps Challenge 2026</p>
            </div>
            <div className="border-t border-[#748077] w-48 text-center pt-1 text-[11px] text-[#748077]">
              Authorized Agronomist Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
