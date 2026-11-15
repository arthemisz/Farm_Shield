import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import amCommon from './locales/am/common.json';
import swCommon from './locales/sw/common.json';
import frCommon from './locales/fr/common.json';
import arCommon from './locales/ar/common.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enCommon },
    am: { translation: amCommon },
    sw: { translation: swCommon },
    fr: { translation: frCommon },
    ar: { translation: arCommon },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

