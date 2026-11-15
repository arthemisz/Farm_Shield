# FarmShield — Internationalization (i18n)

## Overview

FarmShield is designed for multilingual agricultural communities across East Africa and beyond. The frontend utilizes **`i18next`** and **`react-i18next`** for flexible localization, dynamic language switching, and number/unit formatting.

---

## Supported Languages

| Code | Language | Script / Direction | Target Country Context |
|---|---|---|---|
| `en` | English | LTR | Default / International |
| `am` | Amharic (አማርኛ) | LTR (Ethiopic) | Ethiopia |
| `sw` | Swahili (Kiswahili) | LTR (Latin) | Kenya, Tanzania, Uganda, Rwanda |
| `fr` | French (Français) | LTR (Latin) | Rwanda, Central Africa |
| `ar` | Arabic (العربية) | RTL (Arabic) | North & East Africa (planned) |

---

## Architecture and File Organization

Localization files reside in `src/locales/`:

```
src/
├── i18n.ts                    # i18next configuration & initialization
└── locales/
    ├── en/
    │   └── common.json        # English baseline terms
    ├── am/
    │   └── common.json        # Amharic translations
    ├── sw/
    │   └── common.json        # Swahili translations
    ├── fr/
    │   └── common.json        # French translations
    └── ar/
        └── common.json        # Arabic translations
```

---

## Usage in React Components

Use the standard `useTranslation` hook:

```tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

export const MyComponent: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('nav.dashboard', 'Dashboard')}</h1>
      <button onClick={() => i18n.changeLanguage('am')}>
        አማርኛ
      </button>
    </div>
  );
};
```

---

## Synchronization with Country Selection

When a user switches countries using the `CountrySelector`:
1. The country's `defaultLanguage` is recommended.
2. If the user's active language is among the country's `supportedLanguages`, it is preserved; otherwise, the language switches to the new country's default language.
3. Measurement units are synchronized according to `measurementPreferences` (hectares vs. acres, °C vs. °F, mm vs. inches).

