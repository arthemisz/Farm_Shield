import React, { createContext, useContext, useState, useEffect } from 'react';
import { Farm, Crop, UserSettings, CountryConfig } from '../types';
import { FarmShieldApi } from '../services/api';
import { COUNTRIES_LIST, getCountryConfig } from '../data/countries';
import i18n from '../i18n';

interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

interface FarmShieldContextType {
  farms: Farm[];
  selectedFarm: Farm | null;
  setSelectedFarm: (farm: Farm | null) => void;
  crops: Crop[];
  countries: CountryConfig[];
  selectedCountry: CountryConfig;
  setSelectedCountryCode: (countryCode: string) => void;
  settings: UserSettings;
  updateSettings: (newSettings: UserSettings) => Promise<void>;
  loadingFarms: boolean;
  refreshFarms: () => Promise<void>;
  addFarm: (farmData: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Farm>;
  updateFarm: (id: string, farmData: Partial<Farm>) => Promise<Farm | null>;
  deleteFarm: (id: string) => Promise<boolean>;
  notifications: NotificationItem[];
  addNotification: (type: NotificationItem['type'], title: string, message: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  // Contextual Evidence Drawer State & Controller
  contextDrawerOpen: boolean;
  contextDrawerData: any | null;
  openContextDrawer: (data: any) => void;
  closeContextDrawer: () => void;
}

const FarmShieldContext = createContext<FarmShieldContextType | undefined>(undefined);

export const FarmShieldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [countries, setCountries] = useState<CountryConfig[]>(COUNTRIES_LIST);
  const [selectedCountryCode, setSelectedCountryCodeState] = useState<string>('ET');

  // Contextual Evidence Drawer State
  const [contextDrawerOpen, setContextDrawerOpen] = useState<boolean>(false);
  const [contextDrawerData, setContextDrawerData] = useState<any | null>(null);

  const openContextDrawer = (data: any) => {
    setContextDrawerData(data);
    setContextDrawerOpen(true);
  };

  const closeContextDrawer = () => {
    setContextDrawerOpen(false);
  };

  const [settings, setSettings] = useState<UserSettings>({
    userName: 'Abebe Bekele',
    organization: 'Ethiopian Agricultural Research Institute (EIAR) Partner',
    email: 'abebe.b@farmshield.demo',
    selectedCountryCode: 'ET',
    language: 'en',
    measurementUnits: {
      area: 'hectares',
      temperature: 'celsius',
      rainfall: 'mm',
    },
    theme: 'light',
    dataRefreshCadence: 'weekly',
    notificationsEnabled: true,
  });

  const [loadingFarms, setLoadingFarms] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'info',
      title: 'Global Platform Architecture',
      message: 'FarmShield supports country-specific administrative divisions and crop profiles starting with Ethiopia.',
      timestamp: 'Just now',
    },
  ]);

  // Derive selectedCountry from the loaded list (all 54), falling back to hardcoded config
  const selectedCountry: CountryConfig = (() => {
    const code = (selectedCountryCode || 'ET').toUpperCase();
    const fromLoaded = countries.find((c) => c.isoCode?.toUpperCase() === code || c.isoAlpha2?.toUpperCase() === code);
    return fromLoaded || getCountryConfig(code);
  })();

  const addNotification = (type: NotificationItem['type'], title: string, message: string) => {
    const item: NotificationItem = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      timestamp: 'Just now',
    };
    setNotifications((prev) => [item, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const refreshFarms = async () => {
    setLoadingFarms(true);
    try {
      const res = await FarmShieldApi.getFarms();
      setFarms(res.data);
      if (res.data.length > 0 && !selectedFarm) {
        // Prioritize a farm from active country, or first farm
        const matchCountry = res.data.find((f) => f.countryCode === selectedCountryCode);
        setSelectedFarm(matchCountry || res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch farms', err);
      addNotification('error', 'Failed to load farms', 'Could not retrieve farm data.');
    } finally {
      setLoadingFarms(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const settingsRes = await FarmShieldApi.getSettings();
      setSettings(settingsRes.data);
      if (settingsRes.data.selectedCountryCode) {
        setSelectedCountryCodeState(settingsRes.data.selectedCountryCode);
      }
      if (settingsRes.data.language) {
        i18n.changeLanguage(settingsRes.data.language);
      }

      await refreshFarms();
      const cropsRes = await FarmShieldApi.getCrops();
      setCrops(cropsRes.data);

      try {
        const countriesRes = await FarmShieldApi.getCountries();
        if (countriesRes.data && countriesRes.data.length > 0) {
          // Sort alphabetically by name
          const sorted = [...countriesRes.data].sort((a, b) => a.name.localeCompare(b.name));
          setCountries(sorted);
        }
      } catch (err) {
        console.warn('Could not load countries from API, using fallback list', err);
      }
    };
    init();
  }, []);

  const setSelectedCountryCode = (code: string) => {
    const cleanCode = (code || 'ET').toUpperCase();
    setSelectedCountryCodeState(cleanCode);
    const updatedSettings = {
      ...settings,
      selectedCountryCode: cleanCode,
    };
    setSettings(updatedSettings);
    FarmShieldApi.updateSettings(updatedSettings);

    const countryCfg = getCountryConfig(cleanCode);
    if (countryCfg.supportStatus !== 'fully_supported') {
      addNotification(
        'warning',
        `${countryCfg.name} Expansion Status`,
        `${countryCfg.name} is in ${countryCfg.supportStatus} phase. Administrative divisions configured; field agronomic models pending validation.`
      );
    } else {
      addNotification(
        'info',
        `Country Context: ${countryCfg.name}`,
        `Loaded national crop catalog and regional administrative levels.`
      );
    }
  };

  const addFarm = async (farmData: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await FarmShieldApi.createFarm(farmData);
    setFarms((prev) => [res.data, ...prev]);
    setSelectedFarm(res.data);
    addNotification('success', 'Farm Registered', `Successfully added ${res.data.name} to local records.`);
    return res.data;
  };

  const updateFarm = async (id: string, farmData: Partial<Farm>) => {
    const res = await FarmShieldApi.updateFarm(id, farmData);
    if (res.data) {
      setFarms((prev) => prev.map((f) => (f.id === id ? res.data! : f)));
      if (selectedFarm?.id === id) {
        setSelectedFarm(res.data);
      }
      addNotification('success', 'Farm Updated', `Changes to ${res.data.name} were saved.`);
    }
    return res.data;
  };

  const deleteFarm = async (id: string) => {
    const farmToDelete = farms.find((f) => f.id === id);
    const res = await FarmShieldApi.deleteFarm(id);
    if (res.data) {
      setFarms((prev) => prev.filter((f) => f.id !== id));
      if (selectedFarm?.id === id) {
        const remaining = farms.filter((f) => f.id !== id);
        setSelectedFarm(remaining.length > 0 ? remaining[0] : null);
      }
      addNotification('warning', 'Farm Deleted', `Removed ${farmToDelete?.name || 'farm'} from demonstration storage.`);
      return true;
    }
    return false;
  };

  const updateUserSettings = async (newSettings: UserSettings) => {
    const res = await FarmShieldApi.updateSettings(newSettings);
    setSettings(res.data);
    if (newSettings.selectedCountryCode !== selectedCountryCode) {
      setSelectedCountryCodeState(newSettings.selectedCountryCode);
    }
    if (newSettings.language) {
      i18n.changeLanguage(newSettings.language);
    }
    addNotification('success', 'Settings Saved', 'Your system preferences have been updated.');
  };

  return (
    <FarmShieldContext.Provider
      value={{
        farms,
        selectedFarm,
        setSelectedFarm,
        crops,
        countries,
        selectedCountry,
        setSelectedCountryCode,
        settings,
        updateSettings: updateUserSettings,
        loadingFarms,
        refreshFarms,
        addFarm,
        updateFarm,
        deleteFarm,
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        contextDrawerOpen,
        contextDrawerData,
        openContextDrawer,
        closeContextDrawer,
      }}
    >
      {children}
    </FarmShieldContext.Provider>
  );
};

export const useFarmShield = () => {
  const context = useContext(FarmShieldContext);
  if (!context) {
    throw new Error('useFarmShield must be used within a FarmShieldProvider');
  }
  return context;
};
