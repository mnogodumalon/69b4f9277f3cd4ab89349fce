import type { Gaeste, Zimmer } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface GaesteViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Gaeste | null;
  onEdit: (record: Gaeste) => void;
  zimmerList: Zimmer[];
}

export function GaesteViewDialog({ open, onClose, record, onEdit, zimmerList }: GaesteViewDialogProps) {
  function getZimmerDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return zimmerList.find(r => r.record_id === id)?.fields.zimmernummer ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gäste anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorname</Label>
            <p className="text-sm">{record.fields.gast_vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nachname</Label>
            <p className="text-sm">{record.fields.gast_nachname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">E-Mail-Adresse</Label>
            <p className="text-sm">{record.fields.gast_email ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Telefonnummer</Label>
            <p className="text-sm">{record.fields.gast_telefon ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anreisedatum</Label>
            <p className="text-sm">{formatDate(record.fields.anreisedatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Abreisedatum</Label>
            <p className="text-sm">{formatDate(record.fields.abreisedatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anzahl Personen</Label>
            <p className="text-sm">{record.fields.anzahl_personen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zimmer</Label>
            <p className="text-sm">{getZimmerDisplayName(record.fields.zimmer_ref)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Besondere Hinweise zum Gast</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bemerkung_gast ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}