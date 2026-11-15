import React, { useState } from 'react';
import {
  Globe,
  User,
  Database,
  Shield,
  Save,
  CheckCircle,
  Layers,
  Ruler,
} from 'lucide-react';
import { useFarmShield } from '../context/FarmShieldContext';
import { UserSettings } from '../types';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { getCountryConfig } from '../data/countries';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, countries, selectedCountry, setSelectedCountryCode } = useFarmShield();
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
    setSelectedCountryCode(formData.selectedCountryCode);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleCountrySelectionChange = (newCode: string) => {
    const cfg = getCountryConfig(newCode);
    setFormData({
      ...formData,
      selectedCountryCode: newCode,
      language: cfg.defaultLanguage || 'en',
      measurementUnits: {
        ...formData.measurementUnits,
        area: cfg.measurementUnits.area,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#2B4031] tracking-tight">
          System Settings & Platform Architecture
        </h2>
        <p className="text-xs sm:text-sm text-[#748077] mt-1">
          Configure active country context, multilingual translation preferences, and measurement unit standards.
        </p>
      </div>

      <DataSourceBadge source="Global System Configuration Layer (Phase 1 Multi-Country Architecture)" />

      {savedMessage && (
        <div className="p-4 bg-[#E5EBDD] border border-[#DCE8D8] text-[#2B4031] text-xs rounded-2xl flex items-center gap-2.5 shadow-natural-xs">
          <CheckCircle className="w-4 h-4 text-[#72966F]" />
          <span className="font-semibold">Preferences updated and saved to local settings store.</span>
        </div>
      )}

      {/* Main Settings Form: Warm White #FFFEFA surface with soft border #E4E4D9 */}
      <form onSubmit={handleSubmit} className="bg-[#FFFEFA] rounded-3xl border border-[#E4E4D9] shadow-natural-xs p-6 sm:p-8 space-y-6">
        {/* User Identity Section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B4031] flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-[#72966F]" />
            <span>User Profile & Organization</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#29332D] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F3F1E9] border border-[#E4E4D9] rounded-xl focus:outline-hidden focus:border-[#72966F] focus:bg-[#FFFEFA] text-[#29332D] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#29332D] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F3F1E9] border border-[#E4E4D9] rounded-xl focus:outline-hidden focus:border-[#72966F] focus:bg-[#FFFEFA] text-[#29332D] transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#29332D] mb-1">
                Affiliated Agricultural Institution / Cooperative
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F3F1E9] border border-[#E4E4D9] rounded-xl focus:outline-hidden focus:border-[#72966F] focus:bg-[#FFFEFA] text-[#29332D] transition-all"
              />
            </div>
          </div>
        </div>

        {/* International Country Selection */}
        <div className="border-t border-[#E4E4D9] pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B4031] flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-[#72966F]" />
            <span>International Country Context (Phase 1 Registry)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#29332D] mb-1">
                Active Country Context
              </label>
              <select
                aria-label="Select Country Context"
                value={formData.selectedCountryCode}
                onChange={(e) => handleCountrySelectionChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F3F1E9] border border-[#E4E4D9] rounded-xl text-[#2B4031] font-bold focus:outline-hidden focus:border-[#72966F]"
              >
                {countries.map((c) => (
                  <option key={c.isoCode} value={c.isoCode}>
                    {c.flag} {c.name} ({c.supportStatus === 'fully_supported' ? 'MVP Fully Supported' : 'Planned Expansion'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#29332D] mb-1">
                Country Currency Standards
              </label>
              <input
                type="text"
                disabled
                value={`${selectedCountry.currency.name} (${selectedCountry.currency.code} - ${selectedCountry.currency.symbol})`}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F3F1E9]/50 border border-[#E4E4D9] rounded-xl text-[#748077] cursor-not-allowed font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#29332D] mb-1">
                Administrative Divisions for Selected Country
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedCountry.administrativeLevels.map((lvl) => (
                  <span
                    key={lvl.level}
                    className="px-3 py-1 bg-[#F3F1E9] rounded-xl border border-[#E4E4D9] text-xs font-semibold text-[#29332D]"
                  >
                    Level {lvl.level}: <span className="text-[#2B4031] font-bold">{lvl.name}</span> ({lvl.pluralName})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Localization & Measurement Preferences */}
        <div className="border-t border-[#E4E4D9] pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B4031] flex items-center gap-2 mb-3">
            <Ruler className="w-4 h-4 text-[#72966F]" />
            <span>Localization & Measurement Units</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#29332D] mb-1">
                Language
              </label>
              <select
                aria-label="Select Language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F3F1E9] border border-[#E4E4D9] rounded-xl text-[#29332D] focus:outline-hidden focus:border-[#72966F]"
              >
                <option value="en">English (Default)</option>
                <option value="am">አማርኛ (Amharic)</option>
                <option value="sw">Kiswahili (Swahili)</option>
                <option value="fr">Français (French)</option>
                <option value="ar">العربية (Arabic - RTL)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#29332D] mb-1">
                Area Unit Standard
              </label>
              <select
                aria-label="Select Area Unit"
                value={formData.measurementUnits.area}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    measurementUnits: { ...formData.measurementUnits, area: e.target.value as any },
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-[#F3F1E9] border border-[#E4E4D9] rounded-xl text-[#29332D] focus:outline-hidden focus:border-[#72966F]"
              >
                <option value="hectares">Hectares (ha)</option>
                <option value="acres">Acres (ac)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#29332D] mb-1">
                Temperature Unit
              </label>
              <select
                aria-label="Select Temperature Unit"
                value={formData.measurementUnits.temperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    measurementUnits: { ...formData.measurementUnits, temperature: e.target.value as any },
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-[#F3F1E9] border border-[#E4E4D9] rounded-xl text-[#29332D] focus:outline-hidden focus:border-[#72966F]"
              >
                <option value="celsius">Celsius (°C)</option>
                <option value="fahrenheit">Fahrenheit (°F)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Backend Integration & Proposed API Contracts */}
        <div className="border-t border-[#E4E4D9] pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B4031] flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-[#72966F]" />
            <span>Future Flask Backend API Contract Specifications</span>
          </h3>

          <div className="bg-[#F3F1E9] rounded-2xl p-4 border border-[#E4E4D9] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#29332D] font-medium">Configured Base URL:</span>
              <code className="bg-[#FFFEFA] px-2.5 py-1 rounded-md border border-[#E4E4D9] font-mono text-[11px] text-[#2B4031] font-bold">
                http://localhost:5000/api
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#29332D] font-medium">Country Endpoints:</span>
              <code className="font-mono text-[10px] text-[#748077]">
                GET /api/countries • GET /api/countries/&#123;code&#125;/crops
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#29332D] font-medium">Geospatial Provider Query:</span>
              <code className="font-mono text-[10px] text-[#748077]">
                GET /api/climate?lat=X&lon=Y • GET /api/soil?lat=X&lon=Y
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#29332D] font-medium">Rotation Engine Contract:</span>
              <code className="font-mono text-[10px] text-[#748077]">
                POST /api/recommendations/rotation (farm_id, sequence, profile)
              </code>
            </div>
          </div>
        </div>

        {/* About FarmShield */}
        <div className="border-t border-[#E4E4D9] pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B4031] flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-[#72966F]" />
            <span>About FarmShield</span>
          </h3>

          <div className="text-xs text-[#29332D] leading-relaxed space-y-2">
            <p>
              <strong>Positioning:</strong> <em>FarmShield — A Global Agricultural Intelligence Platform, Starting in Ethiopia.</em>
            </p>
            <p>
              <strong>Tagline:</strong> <em>Smarter Farming. Stronger Harvests. A Resilient Future.</em>
            </p>
            <p className="text-[11px] text-[#748077]">
              Active Registry: Ethiopia (ET), Kenya (KE), Uganda (UG), Tanzania (TZ), Rwanda (RW).
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="border-t border-[#E4E4D9] pt-5 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#2B4031] hover:bg-[#24392B] rounded-xl shadow-natural-xs transition-colors"
          >
            <Save className="w-4 h-4 text-[#D98245]" />
            <span>Save Platform Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
