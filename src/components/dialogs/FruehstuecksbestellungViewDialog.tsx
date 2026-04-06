import type { Fruehstuecksbestellung, Gaeste, Fruehstuecksoptionen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface FruehstuecksbestellungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Fruehstuecksbestellung | null;
  onEdit: (record: Fruehstuecksbestellung) => void;
  gaesteList: Gaeste[];
  fruehstuecksoptionenList: Fruehstuecksoptionen[];
}

export function FruehstuecksbestellungViewDialog({ open, onClose, record, onEdit, gaesteList, fruehstuecksoptionenList }: FruehstuecksbestellungViewDialogProps) {
  function getGaesteDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return gaesteList.find(r => r.record_id === id)?.fields.gast_vorname ?? '—';
  }

  function getFruehstuecksoptionenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return fruehstuecksoptionenList.find(r => r.record_id === id)?.fields.option_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Frühstücksbestellung anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gast</Label>
            <p className="text-sm">{getGaesteDisplayName(record.fields.gast_ref)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Frühstücksdatum</Label>
            <p className="text-sm">{formatDate(record.fields.bestelldatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gewünschte Lieferzeit</Label>
            <p className="text-sm">{record.fields.lieferzeit ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Frühstücksoption</Label>
            <p className="text-sm">{getFruehstuecksoptionenDisplayName(record.fields.optionen_ref)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anzahl Portionen</Label>
            <p className="text-sm">{record.fields.anzahl_portionen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sonderwünsche / Allergien</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.sonderwunsch ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.bestellung_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Interne Notiz</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.interne_notiz ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}