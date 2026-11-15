/**
 * Unit conversion utility for international measurement standards.
 * Internal data is always stored in standard metric base units:
 * - Area: Hectares (ha)
 * - Temperature: Celsius (°C)
 * - Rainfall: Millimeters (mm)
 */

export const UnitConverter = {
  // Area Conversion (1 hectare = 2.47105 acres)
  formatArea(hectares: number, targetUnit: 'hectares' | 'acres' = 'hectares'): string {
    if (targetUnit === 'acres') {
      const acres = hectares * 2.47105;
      return `${acres.toFixed(1)} acres`;
    }
    return `${hectares.toFixed(1)} ha`;
  },

  toInternalHectares(value: number, inputUnit: 'hectares' | 'acres'): number {
    if (inputUnit === 'acres') {
      return Number((value / 2.47105).toFixed(2));
    }
    return value;
  },

  // Temperature Conversion (°F = °C * 1.8 + 32)
  formatTemperature(celsius: number, targetUnit: 'celsius' | 'fahrenheit' = 'celsius'): string {
    if (targetUnit === 'fahrenheit') {
      const fahrenheit = celsius * 1.8 + 32;
      return `${fahrenheit.toFixed(1)} °F`;
    }
    return `${celsius.toFixed(1)} °C`;
  },

  // Rainfall Conversion (1 mm = 0.03937 inches)
  formatRainfall(mm: number, targetUnit: 'mm' | 'inches' = 'mm'): string {
    if (targetUnit === 'inches') {
      const inches = mm * 0.03937;
      return `${inches.toFixed(1)} in`;
    }
    return `${mm} mm`;
  },

  // Currency formatting
  formatCurrency(amount: number, currencyCode: string = 'ETB', symbol: string = 'Br'): string {
    return `${symbol} ${amount.toLocaleString()}`;
  },
};

