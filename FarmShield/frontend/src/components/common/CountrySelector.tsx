import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Search, ArrowRight } from 'lucide-react';
import { useFarmShield } from '../../context/FarmShieldContext';
import { CountryConfig } from '../../types';
import { CountryFlag } from './CountryFlag';
import { AFRICAN_ADMIN_DIVISIONS } from '../../data/countries/divisions';

interface CountrySelectorProps {
  compact?: boolean;
  className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({ compact = false, className = '' }) => {
  const { countries, selectedCountry, setSelectedCountryCode } = useFarmShield();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCountryCode, setHoveredCountryCode] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (code: string) => {
    setSelectedCountryCode(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;
    const q = searchQuery.toLowerCase().trim();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.isoCode && c.isoCode.toLowerCase().includes(q)) ||
        (c.isoAlpha2 && c.isoAlpha2.toLowerCase().includes(q)) ||
        (c.region && c.region.toLowerCase().includes(q)) ||
        (c.capital && c.capital.toLowerCase().includes(q))
    );
  }, [countries, searchQuery]);

  const activeCode = (selectedCountry.isoCode || selectedCountry.isoAlpha2 || 'ET').toUpperCase();
  const previewCode = (hoveredCountryCode || activeCode).toUpperCase();
  const previewDivision = AFRICAN_ADMIN_DIVISIONS[previewCode];
  const previewCountry = countries.find(c => (c.isoCode || c.isoAlpha2)?.toUpperCase() === previewCode) || selectedCountry;

  const isPilot =
    selectedCountry.operationalStatus === 'PILOT_OPERATIONAL' ||
    selectedCountry.supportStatus === 'fully_supported';

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl border transition-all text-xs font-semibold ${
          compact
            ? 'px-2 sm:px-2.5 py-1.5 bg-[#111913] border-[#A6C487]/25 text-white hover:bg-[#18251D]'
            : 'px-3 py-2 bg-[#111913] border-[#A6C487]/25 text-white hover:border-[#B5CF78] shadow-natural-xs'
        }`}
        title={`Active Country: ${selectedCountry.name}`}
      >
        <CountryFlag
          countryCode={selectedCountry.isoCode || selectedCountry.isoAlpha2 || ''}
          countryName={selectedCountry.name}
          flagEmoji={selectedCountry.flag}
          size="sm"
        />
        <span className="truncate max-w-[80px] sm:max-w-[110px]">{selectedCountry.name}</span>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider hidden xs:inline-block ${
            isPilot
              ? 'bg-[#B5CF78]/20 text-[#B5CF78] border border-[#B5CF78]/40'
              : 'bg-[#FAECE1]/20 text-[#BC6935] border border-[#ECC3A2]/40'
          }`}
        >
          {isPilot ? 'Pilot' : 'Dir'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#A6C487] ml-0.5 transition-transform duration-200" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[580px] max-w-[calc(100vw-1.5rem)] bg-[#18251D] rounded-2xl shadow-2xl border border-[#A6C487]/25 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3.5 py-2.5 border-b border-[#A6C487]/15 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#B5CF78]" />
              Select Country ({countries.length} Nations)
            </span>
            <span className="text-[10px] text-[#A6C487] font-medium hidden sm:inline">54 Sovereign States</span>
          </div>

          {/* Search Input */}
          <div className="px-3.5 py-2 border-b border-[#A6C487]/15 bg-[#111913]/60">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#A6C487] absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search country, capital, code or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-[#111913] border border-[#A6C487]/20 rounded-lg text-white placeholder-[#A6C487]/60 focus:outline-hidden focus:border-[#B5CF78]"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#A6C487]/15">
            {/* Left Column: Country List */}
            <div className="md:col-span-7 max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-[#A6C487]/10 py-1">
              {filteredCountries.length === 0 ? (
                <div className="px-4 py-6 text-xs text-center text-[#A6C487]">
                  No country found matching "{searchQuery}"
                </div>
              ) : (
                filteredCountries.map((country: CountryConfig) => {
                  const code = (country.isoCode || country.isoAlpha2 || '').toUpperCase();
                  const isSelected = code === activeCode;
                  const isCountryPilot =
                    country.operationalStatus === 'PILOT_OPERATIONAL' ||
                    country.supportStatus === 'fully_supported';

                  return (
                    <div
                      key={code}
                      onClick={() => handleSelect(code)}
                      onMouseEnter={() => setHoveredCountryCode(code)}
                      className={`px-3 py-2 flex items-center justify-between hover:bg-[#111913]/70 cursor-pointer transition-colors group ${
                        isSelected ? 'bg-[#B5CF78]/15 font-semibold text-[#B5CF78]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CountryFlag
                          countryCode={code}
                          countryName={country.name}
                          flagEmoji={country.flag}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="truncate max-w-[120px] sm:max-w-[140px] text-white group-hover:text-[#B5CF78]">
                              {country.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#A6C487]">({code})</span>
                          </div>
                          <div className="text-[10px] text-[#A9B2A5] truncate max-w-[120px] sm:max-w-[140px]">
                            {country.capital || country.region || 'Africa'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                            isCountryPilot
                              ? 'bg-[#B5CF78] text-[#111913]'
                              : 'bg-[#FAECE1]/20 text-[#BC6935] border border-[#ECC3A2]/40'
                          }`}
                        >
                          {isCountryPilot ? 'Pilot' : 'Dir'}
                        </span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-[#B5CF78]" />
                        ) : (
                          <ArrowRight className="w-3 h-3 text-[#A6C487]/40 group-hover:text-[#B5CF78] group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Dynamic Cities & Sub-Cities Preview */}
            <div className="hidden md:block md:col-span-5 p-3 bg-[#111913]/40 max-h-80 overflow-y-auto text-xs space-y-2">
              <div className="flex items-center gap-2 border-b border-[#A6C487]/15 pb-2">
                <CountryFlag countryCode={previewCode} countryName={previewCountry.name} size="sm" />
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">{previewCountry.name}</div>
                  <div className="text-[10px] text-[#A6C487]">
                    {previewDivision?.admin1_label || 'Administrative Divisions'}
                  </div>
                </div>
              </div>

              {previewDivision && previewDivision.cities ? (
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#B5CF78]">
                    Major Cities & Sub-cities ({Object.keys(previewDivision.cities).length})
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(previewDivision.cities).map(([city, subCities]) => (
                      <div key={city} className="bg-[#18251D] p-2 rounded-lg border border-[#A6C487]/20 shadow-2xs">
                        <div className="font-bold text-[11px] text-white flex items-center justify-between">
                          <span>{city}</span>
                          <span className="text-[9px] text-[#A6C487] font-normal">{subCities.length} sub-areas</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {subCities.slice(0, 5).map((sub) => (
                            <span
                              key={sub}
                              className="text-[9px] bg-[#111913] text-[#D6DDD2] px-1.5 py-0.5 rounded-sm border border-[#A6C487]/15"
                            >
                              {sub}
                            </span>
                          ))}
                          {subCities.length > 5 && (
                            <span className="text-[9px] text-[#A6C487] px-1 py-0.5">
                              +{subCities.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-[#A6C487]">
                  No sub-city divisions registered for this jurisdiction.
                </div>
              )}
            </div>
          </div>

          <div className="px-3.5 pt-2 pb-1.5 border-t border-[#A6C487]/15 bg-[#111913]/80 text-[10px] text-[#A6C487] flex items-center justify-between rounded-b-xl">
            <span>Click any country to set active agricultural & agronomic context.</span>
            <span className="font-mono text-[#B5CF78] font-bold">54 African States</span>
          </div>
        </div>
      )}
    </div>
  );
};
