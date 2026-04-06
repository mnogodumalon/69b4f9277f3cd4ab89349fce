import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichGaeste, enrichFruehstuecksbestellung } from '@/lib/enrich';
import type { EnrichedFruehstuecksbestellung } from '@/types/enriched';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FruehstuecksbestellungDialog } from '@/components/dialogs/FruehstuecksbestellungDialog';
import { GaesteDialog } from '@/components/dialogs/GaesteDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import {
  IconAlertCircle,
  IconPlus,
  IconPencil,
  IconTrash,
  IconCoffee,
  IconUsers,
  IconDoor,
  IconShoppingCart,
  IconCheck,
  IconClock,
  IconTruck,
  IconX,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';

// --- Status config ---
const STATUS_COLUMNS = [
  { key: 'offen', label: 'Offen', icon: IconClock, color: 'bg-amber-50 border-amber-200', badgeClass: 'bg-amber-100 text-amber-800', headerClass: 'bg-amber-100 border-amber-200 text-amber-800' },
  { key: 'in_bearbeitung', label: 'In Bearbeitung', icon: IconTruck, color: 'bg-blue-50 border-blue-200', badgeClass: 'bg-blue-100 text-blue-800', headerClass: 'bg-blue-100 border-blue-200 text-blue-800' },
  { key: 'geliefert', label: 'Geliefert', icon: IconCheck, color: 'bg-green-50 border-green-200', badgeClass: 'bg-green-100 text-green-800', headerClass: 'bg-green-100 border-green-200 text-green-800' },
  { key: 'storniert', label: 'Storniert', icon: IconX, color: 'bg-gray-50 border-gray-200', badgeClass: 'bg-gray-100 text-gray-600', headerClass: 'bg-gray-100 border-gray-200 text-gray-600' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function offsetDate(base: string, delta: number): string {
  const d = new Date(base + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default function DashboardOverview() {
  const {
    gaeste, zimmer, fruehstuecksbestellung, fruehstuecksoptionen,
    gaesteMap, zimmerMap, fruehstuecksoptionenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  // ALL hooks must be before early returns
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [bestellungDialogOpen, setBestellungDialogOpen] = useState(false);
  const [editBestellung, setEditBestellung] = useState<EnrichedFruehstuecksbestellung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedFruehstuecksbestellung | null>(null);
  const [gaesteDialogOpen, setGaesteDialogOpen] = useState(false);

  const enrichedGaeste = enrichGaeste(gaeste, { zimmerMap });
  const enrichedBestellungen = enrichFruehstuecksbestellung(fruehstuecksbestellung, { gaesteMap, fruehstuecksoptionenMap });

  const bestellungenForDate = useMemo(() =>
    enrichedBestellungen.filter(b => b.fields.bestelldatum === selectedDate),
    [enrichedBestellungen, selectedDate]
  );

  const statsByStatus = useMemo(() => {
    const map: Record<string, EnrichedFruehstuecksbestellung[]> = {};
    for (const col of STATUS_COLUMNS) map[col.key] = [];
    for (const b of bestellungenForDate) {
      const status = b.fields.bestellung_status?.key ?? 'offen';
      if (map[status]) map[status].push(b);
      else map['offen'].push(b);
    }
    return map;
  }, [bestellungenForDate]);

  const totalPortionen = useMemo(() =>
    bestellungenForDate.reduce((sum, b) => sum + (b.fields.anzahl_portionen ?? 0), 0),
    [bestellungenForDate]
  );

  const currentGaeste = useMemo(() =>
    enrichedGaeste.filter(g => {
      const anreise = g.fields.anreisedatum;
      const abreise = g.fields.abreisedatum;
      if (!anreise) return false;
      return anreise <= selectedDate && (!abreise || abreise >= selectedDate);
    }),
    [enrichedGaeste, selectedDate]
  );

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleStatusChange = async (bestellung: EnrichedFruehstuecksbestellung, newStatus: string) => {
    // The API service's cleanFieldsForApi will strip the LookupValue to a key string
    await LivingAppsService.updateFruehstuecksbestellungEntry(bestellung.record_id, {
      bestellung_status: { key: newStatus, label: newStatus } as import('@/types/app').LookupValue,
    });
    fetchAll();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteFruehstuecksbestellungEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  const formattedDate = (() => {
    try {
      const d = new Date(selectedDate + 'T12:00:00');
      return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return selectedDate; }
  })();

  const isToday = selectedDate === todayStr();

  return (
    <div className="space-y-6">
      {/* Header + Date navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">Frühstücksplan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{formattedDate}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
            <button
              onClick={() => setSelectedDate(d => offsetDate(d, -1))}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              aria-label="Vorheriger Tag"
            >
              <IconChevronLeft size={16} className="shrink-0" />
            </button>
            <button
              onClick={() => setSelectedDate(todayStr())}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${isToday ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'}`}
            >
              Heute
            </button>
            <button
              onClick={() => setSelectedDate(d => offsetDate(d, 1))}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              aria-label="Nächster Tag"
            >
              <IconChevronRight size={16} className="shrink-0" />
            </button>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-xl"
            onClick={() => setGaesteDialogOpen(true)}
          >
            <IconPlus size={15} className="shrink-0" />
            <span className="hidden sm:inline">Gast</span>
            <span className="sm:hidden">Gast</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5 rounded-xl"
            onClick={() => { setEditBestellung(null); setBestellungDialogOpen(true); }}
          >
            <IconPlus size={15} className="shrink-0" />
            <span>Bestellung</span>
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Bestellungen heute"
          value={String(bestellungenForDate.length)}
          description={`${statsByStatus['offen']?.length ?? 0} offen`}
          icon={<IconShoppingCart size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Portionen"
          value={String(totalPortionen)}
          description="Gesamt heute"
          icon={<IconCoffee size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Aktuelle Gäste"
          value={String(currentGaeste.length)}
          description="Eincheckiert"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Zimmer"
          value={String(zimmer.length)}
          description="Verfügbar"
          icon={<IconDoor size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUS_COLUMNS.map(col => {
          const orders = statsByStatus[col.key] ?? [];
          const Icon = col.icon;
          return (
            <div key={col.key} className={`rounded-2xl border ${col.color} flex flex-col overflow-hidden min-w-0`}>
              {/* Column header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b ${col.headerClass}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={15} className="shrink-0" />
                  <span className="font-semibold text-sm truncate">{col.label}</span>
                </div>
                <span className="text-xs font-bold rounded-full px-2 py-0.5 bg-white/60">{orders.length}</span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 p-3 min-h-[160px]">
                {orders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <IconCoffee size={28} stroke={1.5} />
                    <p className="text-xs mt-2">Keine Bestellungen</p>
                  </div>
                )}
                {orders.map(b => (
                  <BestellungCard
                    key={b.record_id}
                    bestellung={b}
                    statusColumns={STATUS_COLUMNS}
                    currentStatus={col.key}
                    onStatusChange={handleStatusChange}
                    onEdit={() => { setEditBestellung(b); setBestellungDialogOpen(true); }}
                    onDelete={() => setDeleteTarget(b)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Checked-in guests strip */}
      {currentGaeste.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <IconUsers size={15} className="shrink-0 text-muted-foreground" />
            <span className="font-semibold text-sm">Eingecheckte Gäste</span>
            <span className="ml-auto text-xs text-muted-foreground">{currentGaeste.length} Gäste</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Name</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Zimmer</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Personen</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Abreise</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {currentGaeste.map(g => (
                  <tr key={g.record_id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                      {g.fields.gast_vorname} {g.fields.gast_nachname}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {g.zimmer_refName || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {g.fields.anzahl_personen ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {formatDate(g.fields.abreisedatum)}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                        onClick={() => {
                          setEditBestellung(null);
                          setBestellungDialogOpen(true);
                        }}
                        title="Bestellung für diesen Gast anlegen"
                      >
                        <span className="hidden sm:inline">Bestellen</span>
                        <IconPlus size={13} className="sm:hidden" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Breakfast options reference */}
      {fruehstuecksoptionen.filter(o => o.fields.verfuegbar !== false).length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <IconCoffee size={15} className="shrink-0 text-muted-foreground" />
            <span className="font-semibold text-sm">Frühstücksoptionen</span>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {fruehstuecksoptionen
              .filter(o => o.fields.verfuegbar !== false)
              .map(o => (
                <div key={o.record_id} className="flex items-start justify-between gap-2 p-3 rounded-xl bg-muted/30 border border-border/50 min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{o.fields.option_name ?? '—'}</p>
                    {o.fields.option_beschreibung && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{o.fields.option_beschreibung}</p>
                    )}
                    {o.fields.kategorie && (
                      <Badge variant="secondary" className="mt-1.5 text-xs">{o.fields.kategorie.label}</Badge>
                    )}
                  </div>
                  {o.fields.preis != null && (
                    <span className="text-sm font-semibold text-foreground shrink-0">{formatCurrency(o.fields.preis)}</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <FruehstuecksbestellungDialog
        open={bestellungDialogOpen}
        onClose={() => { setBestellungDialogOpen(false); setEditBestellung(null); }}
        onSubmit={async (fields) => {
          if (editBestellung) {
            await LivingAppsService.updateFruehstuecksbestellungEntry(editBestellung.record_id, fields);
          } else {
            await LivingAppsService.createFruehstuecksbestellungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editBestellung ? {
          ...editBestellung.fields,
          gast_ref: editBestellung.fields.gast_ref
            ? editBestellung.fields.gast_ref
            : undefined,
          optionen_ref: editBestellung.fields.optionen_ref
            ? editBestellung.fields.optionen_ref
            : undefined,
        } : { bestelldatum: selectedDate }}
        gaesteList={gaeste}
        fruehstuecksoptionenList={fruehstuecksoptionen}
        enablePhotoScan={AI_PHOTO_SCAN['Fruehstuecksbestellung']}
      />

      <GaesteDialog
        open={gaesteDialogOpen}
        onClose={() => setGaesteDialogOpen(false)}
        onSubmit={async (fields) => {
          await LivingAppsService.createGaesteEntry(fields);
          fetchAll();
        }}
        defaultValues={undefined}
        zimmerList={zimmer}
        enablePhotoScan={AI_PHOTO_SCAN['Gaeste']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Bestellung löschen"
        description={`Bestellung für ${deleteTarget?.gast_refName || 'diesen Gast'} wirklich löschen?`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// --- Bestellung card component ---
type StatusCol = typeof STATUS_COLUMNS[number];

function BestellungCard({
  bestellung,
  statusColumns,
  currentStatus,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  bestellung: EnrichedFruehstuecksbestellung;
  statusColumns: StatusCol[];
  currentStatus: string;
  onStatusChange: (b: EnrichedFruehstuecksbestellung, status: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const nextStatus = (() => {
    const idx = statusColumns.findIndex(c => c.key === currentStatus);
    if (idx >= 0 && idx < statusColumns.length - 2) return statusColumns[idx + 1];
    return null;
  })();

  const guestName = bestellung.gast_refName || '—';
  const option = bestellung.optionen_refName || '—';
  const portionen = bestellung.fields.anzahl_portionen;
  const lieferzeit = bestellung.fields.lieferzeit;
  const sonderwunsch = bestellung.fields.sonderwunsch;

  return (
    <div className="bg-white rounded-xl border border-white/80 shadow-sm p-3 min-w-0 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate text-foreground">{guestName}</p>
          <p className="text-xs text-muted-foreground truncate">{option}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            title="Bearbeiten"
          >
            <IconPencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            title="Löschen"
          >
            <IconTrash size={13} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        {portionen != null && (
          <span className="bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
            {portionen}× Portion{portionen !== 1 ? 'en' : ''}
          </span>
        )}
        {lieferzeit && (
          <span className="bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
            <IconClock size={10} className="shrink-0" />{lieferzeit}
          </span>
        )}
      </div>

      {sonderwunsch && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5 line-clamp-2">
          {sonderwunsch}
        </p>
      )}

      {nextStatus && (
        <button
          onClick={() => onStatusChange(bestellung, nextStatus.key)}
          className="w-full text-xs font-medium py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5"
        >
          <nextStatus.icon size={12} className="shrink-0" />
          → {nextStatus.label}
        </button>
      )}
    </div>
  );
}

// --- Skeleton & Error ---
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}

