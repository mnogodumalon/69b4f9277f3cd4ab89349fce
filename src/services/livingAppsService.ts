// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS, LOOKUP_OPTIONS, FIELD_TYPES } from '@/types/app';
import type { Fruehstuecksoptionen, Gaeste, MeinFruehstueck, Zimmer, Fruehstuecksbestellung, CreateFruehstuecksoptionen, CreateGaeste, CreateMeinFruehstueck, CreateZimmer, CreateFruehstuecksbestellung } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: unknown): string | null {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) window.dispatchEvent(new Event('auth-error'));
    throw new Error(await response.text());
  }
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

/** Upload a file to LivingApps. Returns the file URL for use in record fields. */
export async function uploadFile(file: File | Blob, filename?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, filename ?? (file instanceof File ? file.name : 'upload'));
  const res = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) window.dispatchEvent(new Event('auth-error'));
    throw new Error(`File upload failed: ${res.status}`);
  }
  const data = await res.json();
  return data.url;
}

function enrichLookupFields<T extends { fields: Record<string, unknown> }>(
  records: T[], entityKey: string
): T[] {
  const opts = LOOKUP_OPTIONS[entityKey];
  if (!opts) return records;
  return records.map(r => {
    const fields = { ...r.fields };
    for (const [fieldKey, options] of Object.entries(opts)) {
      const val = fields[fieldKey];
      if (typeof val === 'string') {
        const m = options.find(o => o.key === val);
        fields[fieldKey] = m ?? { key: val, label: val };
      } else if (Array.isArray(val)) {
        fields[fieldKey] = val.map(v => {
          if (typeof v === 'string') {
            const m = options.find(o => o.key === v);
            return m ?? { key: v, label: v };
          }
          return v;
        });
      }
    }
    return { ...r, fields } as T;
  });
}

/** Normalize fields for API writes: strip lookup objects to keys, fix date formats. */
export function cleanFieldsForApi(
  fields: Record<string, unknown>,
  entityKey: string
): Record<string, unknown> {
  const clean: Record<string, unknown> = { ...fields };
  for (const [k, v] of Object.entries(clean)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && 'key' in v) clean[k] = (v as any).key;
    if (Array.isArray(v)) clean[k] = v.map((item: any) => item && typeof item === 'object' && 'key' in item ? item.key : item);
  }
  const types = FIELD_TYPES[entityKey];
  if (types) {
    for (const [k, ft] of Object.entries(types)) {
      if (!(k in clean)) continue;
      const val = clean[k];
      // applookup fields: undefined → null (clear single reference)
      if ((ft === 'applookup/select' || ft === 'applookup/choice') && val === undefined) { clean[k] = null; continue; }
      // multipleapplookup fields: undefined/null → [] (clear multi reference)
      if ((ft === 'multipleapplookup/select' || ft === 'multipleapplookup/choice') && (val === undefined || val === null)) { clean[k] = []; continue; }
      // lookup fields: undefined → null (clear single lookup)
      if ((ft.startsWith('lookup/')) && val === undefined) { clean[k] = null; continue; }
      // multiplelookup fields: undefined/null → [] (clear multi lookup)
      if ((ft.startsWith('multiplelookup/')) && (val === undefined || val === null)) { clean[k] = []; continue; }
      if (typeof val !== 'string' || !val) continue;
      if (ft === 'date/datetimeminute') clean[k] = val.slice(0, 16);
      else if (ft === 'date/date') clean[k] = val.slice(0, 10);
    }
  }
  return clean;
}

let _cachedUserProfile: Record<string, unknown> | null = null;

export async function getUserProfile(): Promise<Record<string, unknown>> {
  if (_cachedUserProfile) return _cachedUserProfile;
  const raw = await callApi('GET', '/user');
  const skip = new Set(['id', 'image', 'lang', 'gender', 'title', 'fax', 'menus', 'initials']);
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v != null && !skip.has(k)) data[k] = v;
  }
  _cachedUserProfile = data;
  return data;
}

export interface HeaderProfile {
  firstname: string;
  surname: string;
  email: string;
  image: string | null;
  company: string | null;
}

let _cachedHeaderProfile: HeaderProfile | null = null;

export async function getHeaderProfile(): Promise<HeaderProfile> {
  if (_cachedHeaderProfile) return _cachedHeaderProfile;
  const raw = await callApi('GET', '/user');
  _cachedHeaderProfile = {
    firstname: raw.firstname ?? '',
    surname: raw.surname ?? '',
    email: raw.email ?? '',
    image: raw.image ?? null,
    company: raw.company ?? null,
  };
  return _cachedHeaderProfile;
}

export interface AppGroupInfo {
  id: string;
  name: string;
  image: string | null;
  createdat: string;
  /** Resolved link: /objects/{id}/ if the dashboard exists, otherwise /gateway/apps/{firstAppId}?template=list_page */
  href: string;
}

let _cachedAppGroups: AppGroupInfo[] | null = null;

export async function getAppGroups(): Promise<AppGroupInfo[]> {
  if (_cachedAppGroups) return _cachedAppGroups;
  const raw = await callApi('GET', '/appgroups?with=apps');
  const groups: AppGroupInfo[] = Object.values(raw)
    .map((g: any) => {
      const firstAppId = Object.keys(g.apps ?? {})[0] ?? g.id;
      return {
        id: g.id,
        name: g.name,
        image: g.image ?? null,
        createdat: g.createdat ?? '',
        href: `/gateway/apps/${firstAppId}?template=list_page`,
        _firstAppId: firstAppId,
      };
    })
    .sort((a, b) => b.createdat.localeCompare(a.createdat));

  // Check which appgroups have a deployed dashboard via app params
  const paramChecks = await Promise.allSettled(
    groups.map(g => callApi('GET', `/apps/${(g as any)._firstAppId}/params/la_page_header_additional_url`))
  );
  paramChecks.forEach((result, i) => {
    if (result.status !== 'fulfilled' || !result.value) return;
    const url = result.value.value;
    if (typeof url === 'string' && url.length > 0) {
      try { groups[i].href = new URL(url).pathname; } catch { groups[i].href = url; }
    }
  });

  // Clean up internal helper property
  groups.forEach(g => delete (g as any)._firstAppId);

  _cachedAppGroups = groups;
  return _cachedAppGroups;
}

export class LivingAppsService {
  // --- FRUEHSTUECKSOPTIONEN ---
  static async getFruehstuecksoptionen(): Promise<Fruehstuecksoptionen[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.FRUEHSTUECKSOPTIONEN}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Fruehstuecksoptionen[];
    return enrichLookupFields(records, 'fruehstuecksoptionen');
  }
  static async getFruehstuecksoptionenEntry(id: string): Promise<Fruehstuecksoptionen | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.FRUEHSTUECKSOPTIONEN}/records/${id}`);
    const record = { record_id: data.id, ...data } as Fruehstuecksoptionen;
    return enrichLookupFields([record], 'fruehstuecksoptionen')[0];
  }
  static async createFruehstuecksoptionenEntry(fields: CreateFruehstuecksoptionen) {
    return callApi('POST', `/apps/${APP_IDS.FRUEHSTUECKSOPTIONEN}/records`, { fields: cleanFieldsForApi(fields as any, 'fruehstuecksoptionen') });
  }
  static async updateFruehstuecksoptionenEntry(id: string, fields: Partial<CreateFruehstuecksoptionen>) {
    return callApi('PATCH', `/apps/${APP_IDS.FRUEHSTUECKSOPTIONEN}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'fruehstuecksoptionen') });
  }
  static async deleteFruehstuecksoptionenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.FRUEHSTUECKSOPTIONEN}/records/${id}`);
  }

  // --- GAESTE ---
  static async getGaeste(): Promise<Gaeste[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.GAESTE}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Gaeste[];
    return enrichLookupFields(records, 'gaeste');
  }
  static async getGaesteEntry(id: string): Promise<Gaeste | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.GAESTE}/records/${id}`);
    const record = { record_id: data.id, ...data } as Gaeste;
    return enrichLookupFields([record], 'gaeste')[0];
  }
  static async createGaesteEntry(fields: CreateGaeste) {
    return callApi('POST', `/apps/${APP_IDS.GAESTE}/records`, { fields: cleanFieldsForApi(fields as any, 'gaeste') });
  }
  static async updateGaesteEntry(id: string, fields: Partial<CreateGaeste>) {
    return callApi('PATCH', `/apps/${APP_IDS.GAESTE}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'gaeste') });
  }
  static async deleteGaesteEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.GAESTE}/records/${id}`);
  }

  // --- MEIN_FRUEHSTUECK ---
  static async getMeinFruehstueck(): Promise<MeinFruehstueck[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.MEIN_FRUEHSTUECK}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as MeinFruehstueck[];
    return enrichLookupFields(records, 'mein_fruehstueck');
  }
  static async getMeinFruehstueckEntry(id: string): Promise<MeinFruehstueck | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.MEIN_FRUEHSTUECK}/records/${id}`);
    const record = { record_id: data.id, ...data } as MeinFruehstueck;
    return enrichLookupFields([record], 'mein_fruehstueck')[0];
  }
  static async createMeinFruehstueckEntry(fields: CreateMeinFruehstueck) {
    return callApi('POST', `/apps/${APP_IDS.MEIN_FRUEHSTUECK}/records`, { fields: cleanFieldsForApi(fields as any, 'mein_fruehstueck') });
  }
  static async updateMeinFruehstueckEntry(id: string, fields: Partial<CreateMeinFruehstueck>) {
    return callApi('PATCH', `/apps/${APP_IDS.MEIN_FRUEHSTUECK}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'mein_fruehstueck') });
  }
  static async deleteMeinFruehstueckEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.MEIN_FRUEHSTUECK}/records/${id}`);
  }

  // --- ZIMMER ---
  static async getZimmer(): Promise<Zimmer[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ZIMMER}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Zimmer[];
    return enrichLookupFields(records, 'zimmer');
  }
  static async getZimmerEntry(id: string): Promise<Zimmer | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ZIMMER}/records/${id}`);
    const record = { record_id: data.id, ...data } as Zimmer;
    return enrichLookupFields([record], 'zimmer')[0];
  }
  static async createZimmerEntry(fields: CreateZimmer) {
    return callApi('POST', `/apps/${APP_IDS.ZIMMER}/records`, { fields: cleanFieldsForApi(fields as any, 'zimmer') });
  }
  static async updateZimmerEntry(id: string, fields: Partial<CreateZimmer>) {
    return callApi('PATCH', `/apps/${APP_IDS.ZIMMER}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'zimmer') });
  }
  static async deleteZimmerEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ZIMMER}/records/${id}`);
  }

  // --- FRUEHSTUECKSBESTELLUNG ---
  static async getFruehstuecksbestellung(): Promise<Fruehstuecksbestellung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.FRUEHSTUECKSBESTELLUNG}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Fruehstuecksbestellung[];
    return enrichLookupFields(records, 'fruehstuecksbestellung');
  }
  static async getFruehstuecksbestellungEntry(id: string): Promise<Fruehstuecksbestellung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.FRUEHSTUECKSBESTELLUNG}/records/${id}`);
    const record = { record_id: data.id, ...data } as Fruehstuecksbestellung;
    return enrichLookupFields([record], 'fruehstuecksbestellung')[0];
  }
  static async createFruehstuecksbestellungEntry(fields: CreateFruehstuecksbestellung) {
    return callApi('POST', `/apps/${APP_IDS.FRUEHSTUECKSBESTELLUNG}/records`, { fields: cleanFieldsForApi(fields as any, 'fruehstuecksbestellung') });
  }
  static async updateFruehstuecksbestellungEntry(id: string, fields: Partial<CreateFruehstuecksbestellung>) {
    return callApi('PATCH', `/apps/${APP_IDS.FRUEHSTUECKSBESTELLUNG}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'fruehstuecksbestellung') });
  }
  static async deleteFruehstuecksbestellungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.FRUEHSTUECKSBESTELLUNG}/records/${id}`);
  }

}