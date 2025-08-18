// Countries and Regions for Lead Management System
// This file contains the mapping of countries to their regions/provinces

export const COUNTRIES_AND_REGIONS = {
  BE: {
    name: 'Belgique',
    regions: [
      'Brussels-Capital Region',
      'Walloon Brabant',
      'Flemish Brabant',
      'Antwerp',
      'East Flanders',
      'West Flanders',
      'Limburg',
      'Liège',
      'Hainaut',
      'Namur',
      'Luxembourg'
    ]
  },
  NL: {
    name: 'Netherlands',
    regions: [
      'Drenthe',
      'Flevoland',
      'Friesland',
      'Gelderland',
      'Groningen',
      'Limburg',
      'North Brabant',
      'North Holland',
      'Overijssel',
      'South Holland',
      'Utrecht',
      'Zeeland'
    ]
  },
  LU: {
    name: 'Luxembourg',
    regions: [
      'Luxembourg District',
      'Diekirch District',
      'Grevenmacher District'
    ]
  },
  FR: {
    name: 'France (Metropolitan regions)',
    regions: [
      'Auvergne-Rhône-Alpes',
      'Bourgogne-Franche-Comté',
      'Bretagne',
      'Centre-Val de Loire',
      'Corse',
      'Grand Est',
      'Hauts-de-France',
      'Île-de-France',
      'Normandie',
      'Nouvelle-Aquitaine',
      'Occitanie',
      'Pays de la Loire',
      'Provence-Alpes-Côte d\'Azur'
    ]
  },
  CH: {
    name: 'Suisse',
    regions: [
      'Zurich',
      'Bern',
      'Lucerne',
      'Uri',
      'Schwyz',
      'Obwalden',
      'Nidwalden',
      'Glarus',
      'Zug',
      'Fribourg',
      'Solothurn',
      'Basel-Stadt',
      'Basel-Landschaft',
      'Schaffhausen',
      'Appenzell Ausserrhoden',
      'Appenzell Innerrhoden',
      'St. Gallen',
      'Graubunden',
      'Aargau',
      'Thurgau',
      'Ticino',
      'Vaud',
      'Valais',
      'Neuchatel',
      'Geneva',
      'Jura'
    ]
  },
  CA: {
    name: 'Canada',
    regions: [
      'Alberta',
      'British Columbia',
      'Manitoba',
      'New Brunswick',
      'Newfoundland and Labrador',
      'Nova Scotia',
      'Ontario',
      'Prince Edward Island',
      'Quebec',
      'Saskatchewan',
      'Northwest Territories',
      'Nunavut',
      'Yukon'
    ]
  },
  GB: {
    name: 'Royaume-Uni',
    regions: [
      'England',
      'Scotland',
      'Wales',
      'Northern Ireland'
    ]
  },
  DE: {
    name: 'Allemagne',
    regions: [
      'Baden-Württemberg',
      'Bavaria',
      'Berlin',
      'Brandenburg',
      'Bremen',
      'Hamburg',
      'Hesse',
      'Lower Saxony',
      'Mecklenburg-Vorpommern',
      'North Rhine-Westphalia',
      'Rhineland-Palatinate',
      'Saarland',
      'Saxony',
      'Saxony-Anhalt',
      'Schleswig-Holstein',
      'Thuringia'
    ]
  },
  IT: {
    name: 'Italie',
    regions: [
      'Abruzzo',
      'Basilicata',
      'Calabria',
      'Campania',
      'Emilia-Romagna',
      'Friuli-Venezia Giulia',
      'Lazio',
      'Liguria',
      'Lombardy',
      'Marche',
      'Molise',
      'Piedmont',
      'Puglia',
      'Sardinia',
      'Sicily',
      'Tuscany',
      'Trentino-South Tyrol',
      'Umbria',
      'Valle d\'Aosta',
      'Veneto'
    ]
  },
  ES: {
    name: 'Espagne',
    regions: [
      'Andalusia',
      'Aragon',
      'Asturias',
      'Balearic Islands',
      'Basque Country',
      'Canary Islands',
      'Cantabria',
      'Castile and León',
      'Castile-La Mancha',
      'Catalonia',
      'Extremadura',
      'Galicia',
      'La Rioja',
      'Madrid',
      'Murcia',
      'Navarre',
      'Valencia'
    ]
  }
};

// Helper function to get country name by code
export const getCountryName = (countryCode) => {
  return COUNTRIES_AND_REGIONS[countryCode]?.name || countryCode;
};

// Helper function to get regions for a country
export const getRegionsForCountry = (countryCode) => {
  return COUNTRIES_AND_REGIONS[countryCode]?.regions || [];
};

// Helper function to check if a region is valid for a country
export const isValidRegionForCountry = (countryCode, region) => {
  const regions = getRegionsForCountry(countryCode);
  return regions.includes(region);
};

// Get all country codes
export const getCountryCodes = () => Object.keys(COUNTRIES_AND_REGIONS);

// Get all countries as options for select dropdowns
export const getCountryOptions = () => {
  return Object.entries(COUNTRIES_AND_REGIONS).map(([code, data]) => ({
    value: code,
    label: data.name
  }));
};

// Get regions as options for a specific country
export const getRegionOptionsForCountry = (countryCode) => {
  const regions = getRegionsForCountry(countryCode);
  return regions.map(region => ({
    value: region,
    label: region
  }));
};

export default COUNTRIES_AND_REGIONS;
