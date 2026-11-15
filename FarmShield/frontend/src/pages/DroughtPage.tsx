import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Droplets,
  Calendar,
  ShieldAlert,
  Info,
  CheckCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { useFarmShield } from '../context/FarmShieldContext';
import { FarmShieldApi } from '../services/api';
import { DataSourceBadge } from '../components/common/DataSourceBadge';

export const DroughtPage: React.FC = () => {
  const { selectedFarm, farms, setSelectedFarm } = useFarmShield();
  const [droughtData, setDroughtData] = useState<any | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (selectedFarm) {
      setLoading(true);
      FarmShieldApi.getFarmDrought(selectedFarm.id, selectedYear)
        .then((res) => {
          setDroughtData(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [selectedFarm, selectedYear]);

  const meteo = droughtData?.meteorologicalDrought;
  const agri = droughtData?.agriculturalDrought;
  const spi3 = meteo?.spiValue ?? 0.0;
  const spi6 = meteo?.secondaryIndex?.spiValue ?? 0.0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D98245] bg-[#D98245]/10 px-2 py-0.5 rounded-full">
              Meteorological & Agricultural Indicators
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#2B4031]">Drought Monitoring & Risk Analysis</h1>
          <p className="text-xs text-[#748077]">
            Standardized Precipitation Index (SPI) benchmarked against 30-year CHIRPS 2.0 climatology.
          </p>
        </div>

        {/* Farm & Year Selectors */}
        <div className="flex items-center gap-3">
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

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs bg-[#FFFEFA] border border-[#E4E4D9] rounded-xl px-3 py-2 text-[#2B4031] font-semibold focus:outline-none focus:border-[#72966F]"
          >
            <option value={2024}>2024 (Latest Closed Year)</option>
            <option value={2023}>2023</option>
            <option value={2022}>2022</option>
          </select>
        </div>
      </div>

      {/* Critical Scientific Distinction Banner */}
      <div className="p-4 rounded-2xl bg-[#E5EBDD] border border-[#72966F]/40 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#2B4031] shrink-0 mt-0.5" />
        <div className="text-xs text-[#29332D] space-y-1">
          <p className="font-bold text-[#2B4031]">
            Scientific Clarification: Meteorological Drought vs. Agricultural Soil-Moisture Drought
          </p>
          <p className="text-[#748077]">
            The Standardized Precipitation Index (SPI) measures <strong>atmospheric rainfall deficit</strong> over defined monthly periods. It does <strong>not directly measure root-zone soil moisture or guarantee crop loss</strong>, as soil texture (clays vs. sands), organic mulch, groundwater tables, and supplemental irrigation buffer plants against dry spells.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#748077] bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9]">
          Evaluating drought parameters for {selectedFarm?.name}...
        </div>
      ) : (
        <>
          {/* Main Indicator Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* SPI-3 Card */}
            <div className="bg-[#FFFEFA] p-5 rounded-3xl border border-[#E4E4D9] shadow-natural-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#748077]">SPI-3 (Short-term)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-black ${spi3 < -1.0 ? 'text-[#D98245]' : 'text-[#2B4031]'}`}>
                  {spi3 > 0 ? `+${spi3}` : spi3}
                </span>
                <span className="text-xs font-semibold text-[#748077]">std dev</span>
              </div>
              <p className="text-xs font-bold text-[#29332D] mt-2">{meteo?.wmoClassification || 'Near Normal'}</p>
              <p className="text-[11px] text-[#748077] mt-1">Reflects 3-month soil moisture conditions.</p>
            </div>

            {/* SPI-6 Card */}
            <div className="bg-[#FFFEFA] p-5 rounded-3xl border border-[#E4E4D9] shadow-natural-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#748077]">SPI-6 (Seasonal)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-black ${spi6 < -1.0 ? 'text-[#D98245]' : 'text-[#2B4031]'}`}>
                  {spi6 > 0 ? `+${spi6}` : spi6}
                </span>
                <span className="text-xs font-semibold text-[#748077]">std dev</span>
              </div>
              <p className="text-xs font-bold text-[#29332D] mt-2">{meteo?.secondaryIndex?.wmoClassification || 'Near Normal'}</p>
              <p className="text-[11px] text-[#748077] mt-1">Reflects full cropping season moisture.</p>
            </div>

            {/* Consecutive Dry Months */}
            <div className="bg-[#FFFEFA] p-5 rounded-3xl border border-[#E4E4D9] shadow-natural-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#748077]">Dry Month Runs</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#2B4031]">
                  {agri?.maxConsecutiveDryMonths ?? 0}
                </span>
                <span className="text-xs font-semibold text-[#748077]">consecutive</span>
              </div>
              <p className="text-xs font-bold text-[#29332D] mt-2">Months with &lt; 25mm</p>
              <p className="text-[11px] text-[#748077] mt-1">Evaluates prolonged rainless spells.</p>
            </div>

            {/* Agricultural Risk */}
            <div className="bg-[#FFFEFA] p-5 rounded-3xl border border-[#E4E4D9] shadow-natural-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#748077]">Agronomic Risk</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-black ${agri?.riskLevel === 'Severe' ? 'text-red-600' : agri?.riskLevel === 'Moderate' ? 'text-[#D98245]' : 'text-[#2B4031]'}`}>
                  {agri?.riskLevel || 'Low'}
                </span>
              </div>
              <p className="text-xs font-bold text-[#29332D] mt-2">Crop Vulnerability</p>
              <p className="text-[11px] text-[#748077] mt-1">{agri?.interpretation || 'Normal moisture availability.'}</p>
            </div>
          </div>

          {/* WMO Classification Reference Table */}
          <div className="bg-[#FFFEFA] p-6 rounded-3xl border border-[#E4E4D9] shadow-natural-xs">
            <h3 className="text-sm font-bold text-[#2B4031] mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D98245]" />
              <span>Official WMO-No. 1095 SPI Standard Thresholds</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#F3F1E9] border border-[#E4E4D9]">
                <span className="font-bold text-[#2B4031]">&gt;= +2.00</span>
                <p className="text-[11px] text-[#748077]">Extremely Wet</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#F3F1E9] border border-[#E4E4D9]">
                <span className="font-bold text-[#2B4031]">-0.99 to +0.99</span>
                <p className="text-[11px] text-[#748077]">Near Normal</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#F3F1E9] border border-[#E4E4D9]">
                <span className="font-bold text-[#D98245]">-1.00 to -1.49</span>
                <p className="text-[11px] text-[#748077]">Moderately Dry (Mild Drought)</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#F3F1E9] border border-[#E4E4D9]">
                <span className="font-bold text-red-600">&lt;= -1.50</span>
                <p className="text-[11px] text-[#748077]">Severely to Extremely Dry</p>
              </div>
            </div>

            {/* Advisory note */}
            <div className="mt-4 pt-4 border-t border-[#E4E4D9] text-xs text-[#748077]">
              <p><strong>Advisory Guidance:</strong> {agri?.advisoryRecommendation}</p>
            </div>
          </div>

          {/* SPI Methodology Transparency Card */}
          <div className="bg-[#FFFEFA] p-5 rounded-3xl border border-[#E4E4D9] shadow-natural-xs">
            <h3 className="text-sm font-bold text-[#2B4031] mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#72966F]" />
              <span>SPI Data Quality &amp; Methodology</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F3F1E9] border border-[#E4E4D9]">
                <p className="text-[#748077] text-[10px] uppercase font-bold mb-1">SPI-3 Method</p>
                <p className="font-semibold text-[#2B4031] text-[11px]">
                  {meteo?.spiMethod === 'GAMMA_SCIPY'
                    ? 'Gamma distribution (scipy)'
                    : meteo?.spiMethod?.startsWith('LINEAR')
                    ? 'Linear anomaly (approx.)'
                    : meteo?.spiMethod || '—'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F3F1E9] border border-[#E4E4D9]">
                <p className="text-[#748077] text-[10px] uppercase font-bold mb-1">Data Quality</p>
                <p className={`font-bold text-[11px] ${
                  meteo?.spiDataQuality === 'GAMMA_FITTED' ? 'text-green-700'
                  : meteo?.spiDataQuality === 'INSUFFICIENT_HISTORY' ? 'text-[#D98245]'
                  : 'text-red-600'
                }`}>
                  {meteo?.spiDataQuality || '—'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F3F1E9] border border-[#E4E4D9]">
                <p className="text-[#748077] text-[10px] uppercase font-bold mb-1">Baseline</p>
                <p className="font-semibold text-[#2B4031] text-[11px]">
                  {droughtData?.methodology?.baselinePeriod || 'Regional 1981-2010'}
                </p>
              </div>
            </div>
            {meteo?.spiDataQuality === 'INSUFFICIENT_HISTORY' && (
              <div className="mt-3 p-3 rounded-xl bg-[#D98245]/8 border border-[#D98245]/30">
                <p className="text-[11px] text-[#748077]">
                  <strong className="text-[#D98245]">Scientific Note:</strong> {droughtData?.methodology?.baselineLimitation}
                </p>
              </div>
            )}
          </div>

          {/* Provenance Badge */}
          <div className="flex justify-end">
            <DataSourceBadge
              source={`CHIRPS 2.0 & WMO-No. 1095 SPI (${droughtData?.provenance?.status || 'LIVE'})`}
            />
          </div>
        </>
      )}
    </div>
  );
};
