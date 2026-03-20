// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Gaeste {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    gast_vorname?: string;
    gast_nachname?: string;
    gast_email?: string;
    gast_telefon?: string;
    anreisedatum?: string; // Format: YYYY-MM-DD oder ISO String
    abreisedatum?: string; // Format: YYYY-MM-DD oder ISO String
    anzahl_personen?: number;
    zimmer_ref?: string; // applookup -> URL zu 'Zimmer' Record
    bemerkung_gast?: string;
  };
}

export interface MeinFruehstueck {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    gast_self_ref?: string; // applookup -> URL zu 'Gaeste' Record
    self_bestelldatum?: string; // Format: YYYY-MM-DD oder ISO String
    self_lieferzeit?: string;
    self_optionen_ref?: LookupValue[];
    self_anzahl_portionen?: number;
    self_sonderwunsch?: string;
  };
}

export interface Zimmer {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    zimmernummer?: string;
    zimmertyp?: LookupValue;
    kapazitaet?: number;
    etage?: number;
    bemerkung_zimmer?: string;
  };
}

export interface Fruehstuecksbestellung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    gast_ref?: string; // applookup -> URL zu 'Gaeste' Record
    bestelldatum?: string; // Format: YYYY-MM-DD oder ISO String
    lieferzeit?: string;
    optionen_ref?: string; // applookup -> URL zu 'Fruehstuecksoptionen' Record
    anzahl_portionen?: number;
    sonderwunsch?: string;
    bestellung_status?: LookupValue;
    interne_notiz?: string;
  };
}

export interface Fruehstuecksoptionen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    option_name?: string;
    option_beschreibung?: string;
    kategorie?: LookupValue;
    preis?: number;
    verfuegbar?: boolean;
  };
}

export const APP_IDS = {
  GAESTE: '69b4f90b6c0ec0dfc54d65a6',
  MEIN_FRUEHSTUECK: '69b4f90c957a8335b4a4b8b8',
  ZIMMER: '69b4f905281fe5afed4218fb',
  FRUEHSTUECKSBESTELLUNG: '69b4f90b098decdd1ada7e2d',
  FRUEHSTUECKSOPTIONEN: '69b4f90aec1445747e59699b',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  mein_fruehstueck: {
    self_optionen_ref: [{ key: "standard", label: "Standard" }, { key: "vegetarisch", label: "Vegetarisch" }, { key: "vegan", label: "Vegan" }, { key: "glutenfrei", label: "Glutenfrei" }, { key: "kinderfruehstueck", label: "Kinderfrühstück" }, { key: "businessfruehstueck", label: "Businessfrühstück" }],
  },
  zimmer: {
    zimmertyp: [{ key: "doppelzimmer", label: "Doppelzimmer" }, { key: "suite", label: "Suite" }, { key: "einzelzimmer", label: "Einzelzimmer" }, { key: "familienzimmer", label: "Familienzimmer" }, { key: "apartment", label: "Apartment" }],
  },
  fruehstuecksbestellung: {
    bestellung_status: [{ key: "offen", label: "Offen" }, { key: "in_bearbeitung", label: "In Bearbeitung" }, { key: "geliefert", label: "Geliefert" }, { key: "storniert", label: "Storniert" }],
  },
  fruehstuecksoptionen: {
    kategorie: [{ key: "standard", label: "Standard" }, { key: "vegetarisch", label: "Vegetarisch" }, { key: "vegan", label: "Vegan" }, { key: "glutenfrei", label: "Glutenfrei" }, { key: "kinderfruehstueck", label: "Kinderfrühstück" }, { key: "businessfruehstueck", label: "Businessfrühstück" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'gaeste': {
    'gast_vorname': 'string/text',
    'gast_nachname': 'string/text',
    'gast_email': 'string/email',
    'gast_telefon': 'string/tel',
    'anreisedatum': 'date/date',
    'abreisedatum': 'date/date',
    'anzahl_personen': 'number',
    'zimmer_ref': 'applookup/select',
    'bemerkung_gast': 'string/textarea',
  },
  'mein_fruehstueck': {
    'gast_self_ref': 'applookup/select',
    'self_bestelldatum': 'date/date',
    'self_lieferzeit': 'string/text',
    'self_optionen_ref': 'multiplelookup/select',
    'self_anzahl_portionen': 'number',
    'self_sonderwunsch': 'string/textarea',
  },
  'zimmer': {
    'zimmernummer': 'string/text',
    'zimmertyp': 'lookup/select',
    'kapazitaet': 'number',
    'etage': 'number',
    'bemerkung_zimmer': 'string/textarea',
  },
  'fruehstuecksbestellung': {
    'gast_ref': 'applookup/select',
    'bestelldatum': 'date/date',
    'lieferzeit': 'string/text',
    'optionen_ref': 'applookup/select',
    'anzahl_portionen': 'number',
    'sonderwunsch': 'string/textarea',
    'bestellung_status': 'lookup/select',
    'interne_notiz': 'string/textarea',
  },
  'fruehstuecksoptionen': {
    'option_name': 'string/text',
    'option_beschreibung': 'string/textarea',
    'kategorie': 'lookup/select',
    'preis': 'number',
    'verfuegbar': 'bool',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateGaeste = StripLookup<Gaeste['fields']>;
export type CreateMeinFruehstueck = StripLookup<MeinFruehstueck['fields']>;
export type CreateZimmer = StripLookup<Zimmer['fields']>;
export type CreateFruehstuecksbestellung = StripLookup<Fruehstuecksbestellung['fields']>;
export type CreateFruehstuecksoptionen = StripLookup<Fruehstuecksoptionen['fields']>;