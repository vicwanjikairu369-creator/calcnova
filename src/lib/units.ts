export type UnitCategory =
  | 'length' | 'mass' | 'area' | 'volume' | 'temperature'
  | 'speed' | 'time' | 'pressure' | 'energy' | 'power'
  | 'data' | 'dataRate';

export interface Unit {
  id: string;
  name: string;
  // factor to base unit (except temperature which uses custom functions)
  factor: number;
  symbol: string;
}

export interface Category {
  id: UnitCategory;
  name: string;
  baseSymbol: string;
  units: Unit[];
  custom?: {
    toBase: (v: number, unitId: string) => number;
    fromBase: (v: number, unitId: string) => number;
  };
}

const u = (id: string, name: string, symbol: string, factor: number): Unit => ({ id, name, symbol, factor });

export const CATEGORIES: Category[] = [
  {
    id: 'length', name: 'Length', baseSymbol: 'm',
    units: [
      u('m', 'Meter', 'm', 1),
      u('km', 'Kilometer', 'km', 1000),
      u('cm', 'Centimeter', 'cm', 0.01),
      u('mm', 'Millimeter', 'mm', 0.001),
      u('um', 'Micrometer', 'µm', 1e-6),
      u('nm', 'Nanometer', 'nm', 1e-9),
      u('mi', 'Mile', 'mi', 1609.344),
      u('yd', 'Yard', 'yd', 0.9144),
      u('ft', 'Foot', 'ft', 0.3048),
      u('in', 'Inch', 'in', 0.0254),
      u('nmi', 'Nautical mile', 'nmi', 1852),
    ],
  },
  {
    id: 'mass', name: 'Mass', baseSymbol: 'kg',
    units: [
      u('kg', 'Kilogram', 'kg', 1),
      u('g', 'Gram', 'g', 0.001),
      u('mg', 'Milligram', 'mg', 1e-6),
      u('t', 'Metric ton', 't', 1000),
      u('lb', 'Pound-mass', 'lb', 0.45359237),
      u('oz', 'Ounce', 'oz', 0.028349523125),
      u('st', 'Stone', 'st', 6.35029318),
    ],
  },
  {
    id: 'area', name: 'Area', baseSymbol: 'm²',
    units: [
      u('m2', 'Square meter', 'm²', 1),
      u('km2', 'Square kilometer', 'km²', 1e6),
      u('cm2', 'Square centimeter', 'cm²', 1e-4),
      u('ha', 'Hectare', 'ha', 10000),
      u('acre', 'Acre', 'ac', 4046.8564224),
      u('ft2', 'Square foot', 'ft²', 0.09290304),
      u('mi2', 'Square mile', 'mi²', 2589988.110336),
    ],
  },
  {
    id: 'volume', name: 'Volume', baseSymbol: 'L',
    units: [
      u('l', 'Liter', 'L', 1),
      u('ml', 'Milliliter', 'mL', 0.001),
      u('m3', 'Cubic meter', 'm³', 1000),
      u('cm3', 'Cubic centimeter', 'cm³', 0.001),
      u('gal', 'US gallon', 'gal', 3.785411784),
      u('qt', 'US quart', 'qt', 0.946352946),
      u('pt', 'US pint', 'pt', 0.473176473),
      u('cup', 'US cup', 'cup', 0.2365882365),
      u('floz', 'US fluid ounce', 'fl oz', 0.0295735295625),
      u('galuk', 'UK gallon', 'gal (UK)', 4.54609),
    ],
  },
  {
    id: 'temperature', name: 'Temperature', baseSymbol: 'K',
    units: [
      u('c', 'Celsius', '°C', 1),
      u('f', 'Fahrenheit', '°F', 1),
      u('k', 'Kelvin', 'K', 1),
    ],
    custom: {
      toBase: (v, id) => {
        if (id === 'c') return v + 273.15;
        if (id === 'f') return (v - 32) * (5 / 9) + 273.15;
        return v;
      },
      fromBase: (v, id) => {
        if (id === 'c') return v - 273.15;
        if (id === 'f') return (v - 273.15) * (9 / 5) + 32;
        return v;
      },
    },
  },
  {
    id: 'speed', name: 'Speed', baseSymbol: 'm/s',
    units: [
      u('mps', 'Meter/second', 'm/s', 1),
      u('kmh', 'Kilometer/hour', 'km/h', 0.277777778),
      u('mph', 'Mile/hour', 'mph', 0.44704),
      u('knot', 'Knot', 'kn', 0.514444444),
      u('fts', 'Foot/second', 'ft/s', 0.3048),
    ],
  },
  {
    id: 'time', name: 'Time', baseSymbol: 's',
    units: [
      u('s', 'Second', 's', 1),
      u('ms', 'Millisecond', 'ms', 0.001),
      u('min', 'Minute', 'min', 60),
      u('h', 'Hour', 'h', 3600),
      u('d', 'Day', 'd', 86400),
      u('wk', 'Week', 'wk', 604800),
      u('yr', 'Year (365d)', 'yr', 31536000),
    ],
  },
  {
    id: 'pressure', name: 'Pressure', baseSymbol: 'Pa',
    units: [
      u('pa', 'Pascal', 'Pa', 1),
      u('kpa', 'Kilopascal', 'kPa', 1000),
      u('bar', 'Bar', 'bar', 100000),
      u('atm', 'Atmosphere', 'atm', 101325),
      u('psi', 'Pound/inch²', 'psi', 6894.757293168),
      u('mmhg', 'Millimeter mercury', 'mmHg', 133.322387415),
    ],
  },
  {
    id: 'energy', name: 'Energy', baseSymbol: 'J',
    units: [
      u('j', 'Joule', 'J', 1),
      u('kj', 'Kilojoule', 'kJ', 1000),
      u('cal', 'Calorie', 'cal', 4.184),
      u('kcal', 'Kilocalorie', 'kcal', 4184),
      u('wh', 'Watt-hour', 'Wh', 3600),
      u('kwh', 'Kilowatt-hour', 'kWh', 3.6e6),
      u('ev', 'Electronvolt', 'eV', 1.602176634e-19),
    ],
  },
  {
    id: 'power', name: 'Power', baseSymbol: 'W',
    units: [
      u('w', 'Watt', 'W', 1),
      u('kw', 'Kilowatt', 'kW', 1000),
      u('mw', 'Megawatt', 'MW', 1e6),
      u('hp', 'Mechanical horsepower', 'hp', 745.6998715823),
    ],
  },
  {
    id: 'data', name: 'Data (decimal)', baseSymbol: 'B',
    units: [
      u('b', 'Byte', 'B', 1),
      u('kb', 'Kilobyte (10³)', 'kB', 1000),
      u('mb', 'Megabyte (10⁶)', 'MB', 1e6),
      u('gb', 'Gigabyte (10⁹)', 'GB', 1e9),
      u('tb', 'Terabyte (10¹²)', 'TB', 1e12),
      u('kib', 'Kibibyte (2¹⁰)', 'KiB', 1024),
      u('mib', 'Mebibyte (2²⁰)', 'MiB', 1024 ** 2),
      u('gib', 'Gibibyte (2³⁰)', 'GiB', 1024 ** 3),
      u('tib', 'Tebibyte (2⁴⁰)', 'TiB', 1024 ** 4),
    ],
  },
  {
    id: 'dataRate', name: 'Data rate', baseSymbol: 'bit/s',
    units: [
      u('bps', 'Bit/second', 'bit/s', 1),
      u('kbps', 'Kilobit/second', 'kbit/s', 1000),
      u('mbps', 'Megabit/second', 'Mbit/s', 1e6),
      u('gbps', 'Gigabit/second', 'Gbit/s', 1e9),
      u('Bps', 'Byte/second', 'B/s', 8),
      u('MBps', 'Megabyte/second', 'MB/s', 8e6),
    ],
  },
];

export function convert(value: number, fromId: string, toId: string, cat: Category): number {
  if (cat.custom) {
    return cat.custom.fromBase(cat.custom.toBase(value, fromId), toId);
  }
  const from = cat.units.find((x) => x.id === fromId);
  const to = cat.units.find((x) => x.id === toId);
  if (!from || !to) throw new Error('Unknown unit');
  return (value * from.factor) / to.factor;
}

export function findCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function searchUnits(query: string): { cat: Category; unit: Unit }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: { cat: Category; unit: Unit }[] = [];
  for (const cat of CATEGORIES) {
    for (const unit of cat.units) {
      if (
        unit.name.toLowerCase().includes(q) ||
        unit.symbol.toLowerCase().includes(q) ||
        unit.id.toLowerCase().includes(q)
      ) {
        out.push({ cat, unit });
      }
    }
  }
  return out.slice(0, 40);
}