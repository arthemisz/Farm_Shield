import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  Calendar,
  Shield,
  Download,
  Info
} from 'lucide-react';
import { FarmShieldApi } from '../services/api';
import { useFarmShield } from '../context/FarmShieldContext';

export const DataImportPage: React.FC = () => {
  const { selectedCountry, countries } = useFarmShield();
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload Form State
  const [datasetTitle, setDatasetTitle] = useState<string>('');
  const [datasetType, setDatasetType] = useState<string>('crop_calendar');
  const [countryCode, setCountryCode] = useState<string>(selectedCountry?.isoCode || selectedCountry?.isoAlpha2 || 'ET');
  const [sourceName, setSourceName] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  useEffect(() => {
    loadImports();
  }, [countryCode]);

  async function loadImports() {
    try {
      setLoading(true);
      const res = await FarmShieldApi.getDatasetImports(countryCode);
      if (res.success && res.data) {
        setImports(res.data);
      }
    } catch (err) {
      console.error('Failed to load dataset imports:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileContent || !datasetTitle.trim() || !sourceName.trim()) {
      setFeedback({ type: 'error', text: 'Please fill in required fields and select a file.' });
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      const res = await FarmShieldApi.uploadUserDataset({
        fileContent,
        filename: fileName || 'upload.csv',
        datasetType,
        countryCode,
        title: datasetTitle,
        sourceName,
        sourceUrl: sourceUrl || undefined
      });

      if (res.success) {
        setFeedback({ type: 'success', text: res.data?.message || 'Dataset successfully validated and staged.' });
        setDatasetTitle('');
        setSourceName('');
        setFileContent('');
        setFileName('');
        loadImports();
      } else {
        setFeedback({ type: 'error', text: res.data?.message || 'Validation failed. Check schema guidelines.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error uploading dataset. Ensure file format is valid CSV or JSON.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#2B4031]/10 rounded-2xl p-6 shadow-natural-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-[#2B4031]/10 text-[#2B4031]">
              <UploadCloud className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-[#18251D]">User Data Import & Dataset Registry</h1>
              <p className="text-xs text-[#3E5C4E] mt-0.5">
                Import country-specific planting calendars, rainfall records, and crop statistics without altering source code.
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#D48756]/10 text-[#D48756]">
            Schema Validation Active
          </span>
        </div>
      </div>

      {/* Main Grid: Upload Form (Left) & Staged Datasets (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-5 bg-white border border-[#2B4031]/10 rounded-2xl p-6 shadow-natural-sm space-y-4">
          <h2 className="font-bold text-base text-[#18251D] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#D48756]" />
            Upload New Agricultural Dataset
          </h2>

          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#18251D] mb-1">Dataset Title *</label>
              <input
                type="text"
                placeholder="e.g. 2026 Nakuru Maize Planting Calendar"
                value={datasetTitle}
                onChange={(e) => setDatasetTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#2B4031]/20 bg-[#FBFDFB] text-[#18251D] focus:ring-2 focus:ring-[#2B4031]/30 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#18251D] mb-1">Dataset Type</label>
                <select
                  value={datasetType}
                  onChange={(e) => setDatasetType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2B4031]/20 bg-[#FBFDFB] text-[#18251D] focus:ring-2 focus:ring-[#2B4031]/30 focus:outline-none"
                >
                  <option value="crop_calendar">Crop Planting Calendar</option>
                  <option value="crop_statistics">Crop Yield & Production</option>
                  <option value="rainfall">Precipitation Observations</option>
                  <option value="soil">Soil Characteristics</option>
                  <option value="custom">General Extension Package</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#18251D] mb-1">Country</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2B4031]/20 bg-[#FBFDFB] text-[#18251D] font-semibold focus:ring-2 focus:ring-[#2B4031]/30 focus:outline-none"
                >
                  {countries.map((c) => {
                    const code = c.isoCode || c.isoAlpha2 || '';
                    return (
                      <option key={code} value={code}>
                        {c.flag} {c.name} ({code})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#18251D] mb-1">Source / Extension Institution *</label>
              <input
                type="text"
                placeholder="e.g. KALRO Extension Service / Ministry of Agriculture"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#2B4031]/20 bg-[#FBFDFB] text-[#18251D] focus:ring-2 focus:ring-[#2B4031]/30 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18251D] mb-1">Source Document URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#2B4031]/20 bg-[#FBFDFB] text-[#18251D] focus:ring-2 focus:ring-[#2B4031]/30 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18251D] mb-1">Select Dataset File (CSV or JSON) *</label>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="w-full text-xs text-[#3E5C4E] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#2B4031] file:text-white hover:file:bg-[#24392B] file:cursor-pointer"
              />
              {fileName && <p className="text-[11px] text-[#2B4031] mt-1 font-mono">Loaded: {fileName}</p>}
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 rounded-xl bg-[#D48756] text-white font-semibold hover:bg-[#d65f27] disabled:opacity-50 transition-all shadow-natural-xs"
            >
              {uploading ? 'Validating Dataset Schema...' : 'Validate and Import Dataset'}
            </button>
          </form>

          <div className="pt-3 border-t border-[#2B4031]/10 text-[11px] text-[#3E5C4E] space-y-1">
            <span className="font-semibold text-[#18251D]">Supported Schemas:</span>
            <p>• <strong>Crop Calendar:</strong> cropId, cropName, plantingWindow, harvestWindow</p>
            <p>• <strong>Statistics:</strong> crop, year, productionTonnes, yieldKgPerHa</p>
          </div>
        </div>

        {/* Existing Imports Registry */}
        <div className="lg:col-span-7 bg-white border border-[#2B4031]/10 rounded-2xl p-6 shadow-natural-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-[#18251D] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2B4031]" />
              Staged and Approved User Datasets ({imports.length})
            </h2>
            <span className="text-xs text-[#3E5C4E]">Country: {countryCode}</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#3E5C4E]">Loading import registry...</div>
          ) : imports.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#3E5C4E] border border-dashed border-[#2B4031]/20 rounded-xl">
              No custom datasets imported for {countryCode} yet. Use the upload form on the left to add verified extension data.
            </div>
          ) : (
            <div className="space-y-3">
              {imports.map(imp => (
                <div key={imp.id} className="p-4 rounded-xl border border-[#2B4031]/10 bg-[#FBFDFB] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-[#18251D]">{imp.title}</h4>
                      <p className="text-[11px] text-[#3E5C4E]">
                        Source: {imp.sourceName} • Type: {imp.datasetType} • Records: {imp.recordCount}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {imp.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#3E5C4E]/80 flex items-center gap-3 pt-1 border-t border-[#2B4031]/10">
                    <span>Imported: {new Date(imp.importedAt).toLocaleDateString()}</span>
                    <span>License: {imp.license}</span>
                    <span>Version: {imp.version}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

