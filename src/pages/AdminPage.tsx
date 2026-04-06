import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Fruehstuecksoptionen, Gaeste, MeinFruehstueck, Zimmer, Fruehstuecksbestellung } from '@/types/app';
import { LivingAppsService, extractRecordId, cleanFieldsForApi } from '@/services/livingAppsService';
import { FruehstuecksoptionenDialog } from '@/components/dialogs/FruehstuecksoptionenDialog';
import { FruehstuecksoptionenViewDialog } from '@/components/dialogs/FruehstuecksoptionenViewDialog';
import { GaesteDialog } from '@/components/dialogs/GaesteDialog';
import { GaesteViewDialog } from '@/components/dialogs/GaesteViewDialog';
import { MeinFruehstueckDialog } from '@/components/dialogs/MeinFruehstueckDialog';
import { MeinFruehstueckViewDialog } from '@/components/dialogs/MeinFruehstueckViewDialog';
import { ZimmerDialog } from '@/components/dialogs/ZimmerDialog';
import { ZimmerViewDialog } from '@/components/dialogs/ZimmerViewDialog';
import { FruehstuecksbestellungDialog } from '@/components/dialogs/FruehstuecksbestellungDialog';
import { FruehstuecksbestellungViewDialog } from '@/components/dialogs/FruehstuecksbestellungViewDialog';
import { BulkEditDialog } from '@/components/dialogs/BulkEditDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IconPencil, IconTrash, IconPlus, IconFilter, IconX, IconArrowsUpDown, IconArrowUp, IconArrowDown, IconSearch, IconCopy } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function fmtDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

// Field metadata per entity for bulk edit and column filters
const FRUEHSTUECKSOPTIONEN_FIELDS = [
  { key: 'option_name', label: 'Bezeichnung', type: 'string/text' },
  { key: 'option_beschreibung', label: 'Beschreibung', type: 'string/textarea' },
  { key: 'kategorie', label: 'Kategorie', type: 'lookup/select', options: [{ key: 'standard', label: 'Standard' }, { key: 'vegetarisch', label: 'Vegetarisch' }, { key: 'vegan', label: 'Vegan' }, { key: 'glutenfrei', label: 'Glutenfrei' }, { key: 'kinderfruehstueck', label: 'Kinderfrühstück' }, { key: 'businessfruehstueck', label: 'Businessfrühstück' }] },
  { key: 'preis', label: 'Preis (€)', type: 'number' },
  { key: 'verfuegbar', label: 'Verfügbar', type: 'bool' },
];
const GAESTE_FIELDS = [
  { key: 'gast_vorname', label: 'Vorname', type: 'string/text' },
  { key: 'gast_nachname', label: 'Nachname', type: 'string/text' },
  { key: 'gast_email', label: 'E-Mail-Adresse', type: 'string/email' },
  { key: 'gast_telefon', label: 'Telefonnummer', type: 'string/tel' },
  { key: 'anreisedatum', label: 'Anreisedatum', type: 'date/date' },
  { key: 'abreisedatum', label: 'Abreisedatum', type: 'date/date' },
  { key: 'anzahl_personen', label: 'Anzahl Personen', type: 'number' },
  { key: 'zimmer_ref', label: 'Zimmer', type: 'applookup/select', targetEntity: 'zimmer', targetAppId: 'ZIMMER', displayField: 'zimmernummer' },
  { key: 'bemerkung_gast', label: 'Besondere Hinweise zum Gast', type: 'string/textarea' },
];
const MEINFRUEHSTUECK_FIELDS = [
  { key: 'gast_self_ref', label: 'Mein Name', type: 'applookup/select', targetEntity: 'gaeste', targetAppId: 'GAESTE', displayField: 'gast_vorname' },
  { key: 'self_bestelldatum', label: 'Frühstücksdatum', type: 'date/date' },
  { key: 'self_lieferzeit', label: 'Gewünschte Lieferzeit', type: 'string/text' },
  { key: 'self_optionen_ref', label: 'Frühstücksoptionen', type: 'multiplelookup/select', options: [{ key: 'standard', label: 'Standard' }, { key: 'vegetarisch', label: 'Vegetarisch' }, { key: 'vegan', label: 'Vegan' }, { key: 'glutenfrei', label: 'Glutenfrei' }, { key: 'kinderfruehstueck', label: 'Kinderfrühstück' }, { key: 'businessfruehstueck', label: 'Businessfrühstück' }] },
  { key: 'self_anzahl_portionen', label: 'Anzahl Portionen', type: 'number' },
  { key: 'self_sonderwunsch', label: 'Sonderwünsche / Allergien', type: 'string/textarea' },
];
const ZIMMER_FIELDS = [
  { key: 'zimmernummer', label: 'Zimmernummer', type: 'string/text' },
  { key: 'zimmertyp', label: 'Zimmertyp', type: 'lookup/select', options: [{ key: 'doppelzimmer', label: 'Doppelzimmer' }, { key: 'suite', label: 'Suite' }, { key: 'einzelzimmer', label: 'Einzelzimmer' }, { key: 'familienzimmer', label: 'Familienzimmer' }, { key: 'apartment', label: 'Apartment' }] },
  { key: 'kapazitaet', label: 'Kapazität (Personen)', type: 'number' },
  { key: 'etage', label: 'Etage', type: 'number' },
  { key: 'bemerkung_zimmer', label: 'Bemerkungen', type: 'string/textarea' },
];
const FRUEHSTUECKSBESTELLUNG_FIELDS = [
  { key: 'gast_ref', label: 'Gast', type: 'applookup/select', targetEntity: 'gaeste', targetAppId: 'GAESTE', displayField: 'gast_vorname' },
  { key: 'bestelldatum', label: 'Frühstücksdatum', type: 'date/date' },
  { key: 'lieferzeit', label: 'Gewünschte Lieferzeit', type: 'string/text' },
  { key: 'optionen_ref', label: 'Frühstücksoption', type: 'applookup/select', targetEntity: 'fruehstuecksoptionen', targetAppId: 'FRUEHSTUECKSOPTIONEN', displayField: 'option_name' },
  { key: 'anzahl_portionen', label: 'Anzahl Portionen', type: 'number' },
  { key: 'sonderwunsch', label: 'Sonderwünsche / Allergien', type: 'string/textarea' },
  { key: 'bestellung_status', label: 'Status', type: 'lookup/select', options: [{ key: 'offen', label: 'Offen' }, { key: 'in_bearbeitung', label: 'In Bearbeitung' }, { key: 'geliefert', label: 'Geliefert' }, { key: 'storniert', label: 'Storniert' }] },
  { key: 'interne_notiz', label: 'Interne Notiz', type: 'string/textarea' },
];

const ENTITY_TABS = [
  { key: 'fruehstuecksoptionen', label: 'Frühstücksoptionen', pascal: 'Fruehstuecksoptionen' },
  { key: 'gaeste', label: 'Gäste', pascal: 'Gaeste' },
  { key: 'mein_fruehstueck', label: 'Mein Frühstück', pascal: 'MeinFruehstueck' },
  { key: 'zimmer', label: 'Zimmer', pascal: 'Zimmer' },
  { key: 'fruehstuecksbestellung', label: 'Frühstücksbestellung', pascal: 'Fruehstuecksbestellung' },
] as const;

type EntityKey = typeof ENTITY_TABS[number]['key'];

export default function AdminPage() {
  const data = useDashboardData();
  const { loading, error, fetchAll } = data;

  const [activeTab, setActiveTab] = useState<EntityKey>('fruehstuecksoptionen');
  const [selectedIds, setSelectedIds] = useState<Record<EntityKey, Set<string>>>(() => ({
    'fruehstuecksoptionen': new Set(),
    'gaeste': new Set(),
    'mein_fruehstueck': new Set(),
    'zimmer': new Set(),
    'fruehstuecksbestellung': new Set(),
  }));
  const [filters, setFilters] = useState<Record<EntityKey, Record<string, string>>>(() => ({
    'fruehstuecksoptionen': {},
    'gaeste': {},
    'mein_fruehstueck': {},
    'zimmer': {},
    'fruehstuecksbestellung': {},
  }));
  const [showFilters, setShowFilters] = useState(false);
  const [dialogState, setDialogState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [createEntity, setCreateEntity] = useState<EntityKey | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<{ entity: EntityKey; ids: string[] } | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState<EntityKey | null>(null);
  const [viewState, setViewState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const getRecords = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'fruehstuecksoptionen': return (data as any).fruehstuecksoptionen as Fruehstuecksoptionen[] ?? [];
      case 'gaeste': return (data as any).gaeste as Gaeste[] ?? [];
      case 'mein_fruehstueck': return (data as any).meinFruehstueck as MeinFruehstueck[] ?? [];
      case 'zimmer': return (data as any).zimmer as Zimmer[] ?? [];
      case 'fruehstuecksbestellung': return (data as any).fruehstuecksbestellung as Fruehstuecksbestellung[] ?? [];
      default: return [];
    }
  }, [data]);

  const getLookupLists = useCallback((entity: EntityKey) => {
    const lists: Record<string, any[]> = {};
    switch (entity) {
      case 'gaeste':
        lists.zimmerList = (data as any).zimmer ?? [];
        break;
      case 'mein_fruehstueck':
        lists.gaesteList = (data as any).gaeste ?? [];
        break;
      case 'fruehstuecksbestellung':
        lists.gaesteList = (data as any).gaeste ?? [];
        lists.fruehstuecksoptionenList = (data as any).fruehstuecksoptionen ?? [];
        break;
    }
    return lists;
  }, [data]);

  const getApplookupDisplay = useCallback((entity: EntityKey, fieldKey: string, url?: unknown) => {
    if (!url) return '—';
    const id = extractRecordId(url);
    if (!id) return '—';
    const lists = getLookupLists(entity);
    void fieldKey; // ensure used for noUnusedParameters
    if (entity === 'gaeste' && fieldKey === 'zimmer_ref') {
      const match = (lists.zimmerList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.zimmernummer ?? '—';
    }
    if (entity === 'mein_fruehstueck' && fieldKey === 'gast_self_ref') {
      const match = (lists.gaesteList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.gast_vorname ?? '—';
    }
    if (entity === 'fruehstuecksbestellung' && fieldKey === 'gast_ref') {
      const match = (lists.gaesteList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.gast_vorname ?? '—';
    }
    if (entity === 'fruehstuecksbestellung' && fieldKey === 'optionen_ref') {
      const match = (lists.fruehstuecksoptionenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.option_name ?? '—';
    }
    return String(url);
  }, [getLookupLists]);

  const getFieldMeta = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'fruehstuecksoptionen': return FRUEHSTUECKSOPTIONEN_FIELDS;
      case 'gaeste': return GAESTE_FIELDS;
      case 'mein_fruehstueck': return MEINFRUEHSTUECK_FIELDS;
      case 'zimmer': return ZIMMER_FIELDS;
      case 'fruehstuecksbestellung': return FRUEHSTUECKSBESTELLUNG_FIELDS;
      default: return [];
    }
  }, []);

  const getFilteredRecords = useCallback((entity: EntityKey) => {
    const records = getRecords(entity);
    const s = search.toLowerCase();
    const searched = !s ? records : records.filter((r: any) => {
      return Object.values(r.fields).some((v: any) => {
        if (v == null) return false;
        if (Array.isArray(v)) return v.some((item: any) => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
        if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
        return String(v).toLowerCase().includes(s);
      });
    });
    const entityFilters = filters[entity] ?? {};
    const fieldMeta = getFieldMeta(entity);
    return searched.filter((r: any) => {
      return fieldMeta.every((fm: any) => {
        const fv = entityFilters[fm.key];
        if (!fv || fv === '') return true;
        const val = r.fields?.[fm.key];
        if (fm.type === 'bool') {
          if (fv === 'true') return val === true;
          if (fv === 'false') return val !== true;
          return true;
        }
        if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
          const label = val && typeof val === 'object' && 'label' in val ? val.label : '';
          return String(label).toLowerCase().includes(fv.toLowerCase());
        }
        if (fm.type.includes('multiplelookup')) {
          if (!Array.isArray(val)) return false;
          return val.some((item: any) => String(item?.label ?? '').toLowerCase().includes(fv.toLowerCase()));
        }
        if (fm.type.includes('applookup')) {
          const display = getApplookupDisplay(entity, fm.key, val);
          return String(display).toLowerCase().includes(fv.toLowerCase());
        }
        return String(val ?? '').toLowerCase().includes(fv.toLowerCase());
      });
    });
  }, [getRecords, filters, getFieldMeta, getApplookupDisplay, search]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(''); setSortDir('asc'); }
    } else { setSortKey(key); setSortDir('asc'); }
  }

  function sortRecords<T extends { fields: Record<string, any> }>(recs: T[]): T[] {
    if (!sortKey) return recs;
    return [...recs].sort((a, b) => {
      let va: any = a.fields[sortKey], vb: any = b.fields[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'object' && 'label' in va) va = va.label;
      if (typeof vb === 'object' && 'label' in vb) vb = vb.label;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  const toggleSelect = useCallback((entity: EntityKey, id: string) => {
    setSelectedIds(prev => {
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (next[entity].has(id)) next[entity].delete(id);
      else next[entity].add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((entity: EntityKey) => {
    const filtered = getFilteredRecords(entity);
    setSelectedIds(prev => {
      const allSelected = filtered.every((r: any) => prev[entity].has(r.record_id));
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (allSelected) {
        filtered.forEach((r: any) => next[entity].delete(r.record_id));
      } else {
        filtered.forEach((r: any) => next[entity].add(r.record_id));
      }
      return next;
    });
  }, [getFilteredRecords]);

  const clearSelection = useCallback((entity: EntityKey) => {
    setSelectedIds(prev => ({ ...prev, [entity]: new Set() }));
  }, []);

  const getServiceMethods = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'fruehstuecksoptionen': return {
        create: (fields: any) => LivingAppsService.createFruehstuecksoptionenEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateFruehstuecksoptionenEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteFruehstuecksoptionenEntry(id),
      };
      case 'gaeste': return {
        create: (fields: any) => LivingAppsService.createGaesteEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateGaesteEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteGaesteEntry(id),
      };
      case 'mein_fruehstueck': return {
        create: (fields: any) => LivingAppsService.createMeinFruehstueckEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateMeinFruehstueckEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteMeinFruehstueckEntry(id),
      };
      case 'zimmer': return {
        create: (fields: any) => LivingAppsService.createZimmerEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateZimmerEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteZimmerEntry(id),
      };
      case 'fruehstuecksbestellung': return {
        create: (fields: any) => LivingAppsService.createFruehstuecksbestellungEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateFruehstuecksbestellungEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteFruehstuecksbestellungEntry(id),
      };
      default: return null;
    }
  }, []);

  async function handleCreate(entity: EntityKey, fields: any) {
    const svc = getServiceMethods(entity);
    if (!svc) return;
    await svc.create(fields);
    fetchAll();
    setCreateEntity(null);
  }

  async function handleUpdate(fields: any) {
    if (!dialogState) return;
    const svc = getServiceMethods(dialogState.entity);
    if (!svc) return;
    await svc.update(dialogState.record.record_id, fields);
    fetchAll();
    setDialogState(null);
  }

  async function handleBulkDelete() {
    if (!deleteTargets) return;
    const svc = getServiceMethods(deleteTargets.entity);
    if (!svc) return;
    setBulkLoading(true);
    try {
      for (const id of deleteTargets.ids) {
        await svc.remove(id);
      }
      clearSelection(deleteTargets.entity);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setDeleteTargets(null);
    }
  }

  async function handleBulkClone() {
    const svc = getServiceMethods(activeTab);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const records = getRecords(activeTab);
      const ids = Array.from(selectedIds[activeTab]);
      for (const id of ids) {
        const rec = records.find((r: any) => r.record_id === id);
        if (!rec) continue;
        const clean = cleanFieldsForApi(rec.fields, activeTab);
        await svc.create(clean as any);
      }
      clearSelection(activeTab);
      fetchAll();
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkEdit(fieldKey: string, value: any) {
    if (!bulkEditOpen) return;
    const svc = getServiceMethods(bulkEditOpen);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds[bulkEditOpen]);
      for (const id of ids) {
        await svc.update(id, { [fieldKey]: value });
      }
      clearSelection(bulkEditOpen);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setBulkEditOpen(null);
    }
  }

  function updateFilter(entity: EntityKey, fieldKey: string, value: string) {
    setFilters(prev => ({
      ...prev,
      [entity]: { ...prev[entity], [fieldKey]: value },
    }));
  }

  function clearEntityFilters(entity: EntityKey) {
    setFilters(prev => ({ ...prev, [entity]: {} }));
  }

  const activeFilterCount = useMemo(() => {
    const f = filters[activeTab] ?? {};
    return Object.values(f).filter(v => v && v !== '').length;
  }, [filters, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-destructive">{error.message}</p>
        <Button onClick={fetchAll}>Erneut versuchen</Button>
      </div>
    );
  }

  const filtered = getFilteredRecords(activeTab);
  const sel = selectedIds[activeTab];
  const allFiltered = filtered.every((r: any) => sel.has(r.record_id)) && filtered.length > 0;
  const fieldMeta = getFieldMeta(activeTab);

  return (
    <PageShell
      title="Verwaltung"
      subtitle="Alle Daten verwalten"
      action={
        <Button onClick={() => setCreateEntity(activeTab)} className="shrink-0">
          <IconPlus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="flex gap-2 flex-wrap">
        {ENTITY_TABS.map(tab => {
          const count = getRecords(tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(''); setSortKey(''); setSortDir('asc'); fetchAll(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)} className="gap-2">
            <IconFilter className="h-4 w-4" />
            Filtern
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => clearEntityFilters(activeTab)}>
              Filter zurücksetzen
            </Button>
          )}
        </div>
        {sel.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-muted/60 rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium">{sel.size} ausgewählt</span>
            <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(activeTab)}>
              <IconPencil className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Feld bearbeiten</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkClone()}>
              <IconCopy className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Kopieren</span>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteTargets({ entity: activeTab, ids: Array.from(sel) })}>
              <IconTrash className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Ausgewählte löschen</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clearSelection(activeTab)}>
              <IconX className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Auswahl aufheben</span>
            </Button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-lg border bg-muted/30">
          {fieldMeta.map((fm: any) => (
            <div key={fm.key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{fm.label}</label>
              {fm.type === 'bool' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="true">Ja</SelectItem>
                    <SelectItem value="false">Nein</SelectItem>
                  </SelectContent>
                </Select>
              ) : fm.type === 'lookup/select' || fm.type === 'lookup/radio' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {fm.options?.map((o: any) => (
                      <SelectItem key={o.key} value={o.label}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 text-xs"
                  placeholder="Filtern..."
                  value={filters[activeTab]?.[fm.key] ?? ''}
                  onChange={e => updateFilter(activeTab, fm.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[27px] bg-card shadow-lg overflow-x-auto">
        <Table className="[&_tbody_td]:px-6 [&_tbody_td]:py-2 [&_tbody_td]:text-base [&_tbody_td]:font-medium [&_tbody_tr:first-child_td]:pt-6 [&_tbody_tr:last-child_td]:pb-10">
          <TableHeader className="bg-secondary">
            <TableRow className="border-b border-input">
              <TableHead className="w-10 px-6">
                <Checkbox
                  checked={allFiltered}
                  onCheckedChange={() => toggleSelectAll(activeTab)}
                />
              </TableHead>
              {fieldMeta.map((fm: any) => (
                <TableHead key={fm.key} className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort(fm.key)}>
                  <span className="inline-flex items-center gap-1">
                    {fm.label}
                    {sortKey === fm.key ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-24 uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortRecords(filtered).map((record: any) => (
              <TableRow key={record.record_id} className={`transition-colors cursor-pointer ${sel.has(record.record_id) ? "bg-primary/5" : "hover:bg-muted/50"}`} onClick={(e) => { if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) return; setViewState({ entity: activeTab, record }); }}>
                <TableCell>
                  <Checkbox
                    checked={sel.has(record.record_id)}
                    onCheckedChange={() => toggleSelect(activeTab, record.record_id)}
                  />
                </TableCell>
                {fieldMeta.map((fm: any) => {
                  const val = record.fields?.[fm.key];
                  if (fm.type === 'bool') {
                    return (
                      <TableCell key={fm.key}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          val ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {val ? 'Ja' : 'Nein'}
                        </span>
                      </TableCell>
                    );
                  }
                  if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{val?.label ?? '—'}</span></TableCell>;
                  }
                  if (fm.type.includes('multiplelookup')) {
                    return <TableCell key={fm.key}>{Array.isArray(val) ? val.map((v: any) => v?.label ?? v).join(', ') : '—'}</TableCell>;
                  }
                  if (fm.type.includes('applookup')) {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getApplookupDisplay(activeTab, fm.key, val)}</span></TableCell>;
                  }
                  if (fm.type.includes('date')) {
                    return <TableCell key={fm.key} className="text-muted-foreground">{fmtDate(val)}</TableCell>;
                  }
                  if (fm.type.startsWith('file')) {
                    return (
                      <TableCell key={fm.key}>
                        {val ? (
                          <div className="relative h-8 w-8 rounded bg-muted overflow-hidden">
                            <img src={val} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        ) : '—'}
                      </TableCell>
                    );
                  }
                  if (fm.type === 'string/textarea') {
                    return <TableCell key={fm.key} className="max-w-xs"><span className="truncate block">{val ?? '—'}</span></TableCell>;
                  }
                  if (fm.type === 'geo') {
                    return (
                      <TableCell key={fm.key} className="max-w-[200px]">
                        <span className="truncate block" title={val ? `${val.lat}, ${val.long}` : undefined}>
                          {val?.info ?? (val ? `${val.lat?.toFixed(4)}, ${val.long?.toFixed(4)}` : '—')}
                        </span>
                      </TableCell>
                    );
                  }
                  return <TableCell key={fm.key}>{val ?? '—'}</TableCell>;
                })}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDialogState({ entity: activeTab, record })}>
                      <IconPencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargets({ entity: activeTab, ids: [record.record_id] })}>
                      <IconTrash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={fieldMeta.length + 2} className="text-center py-16 text-muted-foreground">
                  Keine Ergebnisse gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(createEntity === 'fruehstuecksoptionen' || dialogState?.entity === 'fruehstuecksoptionen') && (
        <FruehstuecksoptionenDialog
          open={createEntity === 'fruehstuecksoptionen' || dialogState?.entity === 'fruehstuecksoptionen'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'fruehstuecksoptionen' ? handleUpdate : (fields: any) => handleCreate('fruehstuecksoptionen', fields)}
          defaultValues={dialogState?.entity === 'fruehstuecksoptionen' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Fruehstuecksoptionen']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Fruehstuecksoptionen']}
        />
      )}
      {(createEntity === 'gaeste' || dialogState?.entity === 'gaeste') && (
        <GaesteDialog
          open={createEntity === 'gaeste' || dialogState?.entity === 'gaeste'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'gaeste' ? handleUpdate : (fields: any) => handleCreate('gaeste', fields)}
          defaultValues={dialogState?.entity === 'gaeste' ? dialogState.record?.fields : undefined}
          zimmerList={(data as any).zimmer ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Gaeste']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Gaeste']}
        />
      )}
      {(createEntity === 'mein_fruehstueck' || dialogState?.entity === 'mein_fruehstueck') && (
        <MeinFruehstueckDialog
          open={createEntity === 'mein_fruehstueck' || dialogState?.entity === 'mein_fruehstueck'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'mein_fruehstueck' ? handleUpdate : (fields: any) => handleCreate('mein_fruehstueck', fields)}
          defaultValues={dialogState?.entity === 'mein_fruehstueck' ? dialogState.record?.fields : undefined}
          gaesteList={(data as any).gaeste ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['MeinFruehstueck']}
          enablePhotoLocation={AI_PHOTO_LOCATION['MeinFruehstueck']}
        />
      )}
      {(createEntity === 'zimmer' || dialogState?.entity === 'zimmer') && (
        <ZimmerDialog
          open={createEntity === 'zimmer' || dialogState?.entity === 'zimmer'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'zimmer' ? handleUpdate : (fields: any) => handleCreate('zimmer', fields)}
          defaultValues={dialogState?.entity === 'zimmer' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Zimmer']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Zimmer']}
        />
      )}
      {(createEntity === 'fruehstuecksbestellung' || dialogState?.entity === 'fruehstuecksbestellung') && (
        <FruehstuecksbestellungDialog
          open={createEntity === 'fruehstuecksbestellung' || dialogState?.entity === 'fruehstuecksbestellung'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'fruehstuecksbestellung' ? handleUpdate : (fields: any) => handleCreate('fruehstuecksbestellung', fields)}
          defaultValues={dialogState?.entity === 'fruehstuecksbestellung' ? dialogState.record?.fields : undefined}
          gaesteList={(data as any).gaeste ?? []}
          fruehstuecksoptionenList={(data as any).fruehstuecksoptionen ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Fruehstuecksbestellung']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Fruehstuecksbestellung']}
        />
      )}
      {viewState?.entity === 'fruehstuecksoptionen' && (
        <FruehstuecksoptionenViewDialog
          open={viewState?.entity === 'fruehstuecksoptionen'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'fruehstuecksoptionen', record: r }); }}
        />
      )}
      {viewState?.entity === 'gaeste' && (
        <GaesteViewDialog
          open={viewState?.entity === 'gaeste'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'gaeste', record: r }); }}
          zimmerList={(data as any).zimmer ?? []}
        />
      )}
      {viewState?.entity === 'mein_fruehstueck' && (
        <MeinFruehstueckViewDialog
          open={viewState?.entity === 'mein_fruehstueck'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'mein_fruehstueck', record: r }); }}
          gaesteList={(data as any).gaeste ?? []}
        />
      )}
      {viewState?.entity === 'zimmer' && (
        <ZimmerViewDialog
          open={viewState?.entity === 'zimmer'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'zimmer', record: r }); }}
        />
      )}
      {viewState?.entity === 'fruehstuecksbestellung' && (
        <FruehstuecksbestellungViewDialog
          open={viewState?.entity === 'fruehstuecksbestellung'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'fruehstuecksbestellung', record: r }); }}
          gaesteList={(data as any).gaeste ?? []}
          fruehstuecksoptionenList={(data as any).fruehstuecksoptionen ?? []}
        />
      )}

      <BulkEditDialog
        open={!!bulkEditOpen}
        onClose={() => setBulkEditOpen(null)}
        onApply={handleBulkEdit}
        fields={bulkEditOpen ? getFieldMeta(bulkEditOpen) : []}
        selectedCount={bulkEditOpen ? selectedIds[bulkEditOpen].size : 0}
        loading={bulkLoading}
        lookupLists={bulkEditOpen ? getLookupLists(bulkEditOpen) : {}}
      />

      <ConfirmDialog
        open={!!deleteTargets}
        onClose={() => setDeleteTargets(null)}
        onConfirm={handleBulkDelete}
        title="Ausgewählte löschen"
        description={`Sollen ${deleteTargets?.ids.length ?? 0} Einträge wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
      />
    </PageShell>
  );
}