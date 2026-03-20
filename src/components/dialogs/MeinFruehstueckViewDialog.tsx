import type { MeinFruehstueck, Gaeste } from '@/types/app';
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

interface MeinFruehstueckViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: MeinFruehstueck | null;
  onEdit: (record: MeinFruehstueck) => void;
  gaesteList: Gaeste[];
}

export function MeinFruehstueckViewDialog({ open, onClose, record, onEdit, gaesteList }: MeinFruehstueckViewDialogProps) {
  function getGaesteDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return gaesteList.find(r => r.record_id === id)?.fields.gast_vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mein Frühstück anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mein Name</Label>
            <p className="text-sm">{getGaesteDisplayName(record.fields.gast_self_ref)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Frühstücksdatum</Label>
            <p className="text-sm">{formatDate(record.fields.self_bestelldatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gewünschte Lieferzeit</Label>
            <p className="text-sm">{record.fields.self_lieferzeit ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Frühstücksoptionen</Label>
            <p className="text-sm">{Array.isArray(record.fields.self_optionen_ref) ? record.fields.self_optionen_ref.map((v: any) => v?.label ?? v).join(', ') : '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anzahl Portionen</Label>
            <p className="text-sm">{record.fields.self_anzahl_portionen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sonderwünsche / Allergien</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.self_sonderwunsch ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}