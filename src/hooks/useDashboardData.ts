import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Gaeste, MeinFruehstueck, Zimmer, Fruehstuecksbestellung, Fruehstuecksoptionen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [gaeste, setGaeste] = useState<Gaeste[]>([]);
  const [meinFruehstueck, setMeinFruehstueck] = useState<MeinFruehstueck[]>([]);
  const [zimmer, setZimmer] = useState<Zimmer[]>([]);
  const [fruehstuecksbestellung, setFruehstuecksbestellung] = useState<Fruehstuecksbestellung[]>([]);
  const [fruehstuecksoptionen, setFruehstuecksoptionen] = useState<Fruehstuecksoptionen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [gaesteData, meinFruehstueckData, zimmerData, fruehstuecksbestellungData, fruehstuecksoptionenData] = await Promise.all([
        LivingAppsService.getGaeste(),
        LivingAppsService.getMeinFruehstueck(),
        LivingAppsService.getZimmer(),
        LivingAppsService.getFruehstuecksbestellung(),
        LivingAppsService.getFruehstuecksoptionen(),
      ]);
      setGaeste(gaesteData);
      setMeinFruehstueck(meinFruehstueckData);
      setZimmer(zimmerData);
      setFruehstuecksbestellung(fruehstuecksbestellungData);
      setFruehstuecksoptionen(fruehstuecksoptionenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const gaesteMap = useMemo(() => {
    const m = new Map<string, Gaeste>();
    gaeste.forEach(r => m.set(r.record_id, r));
    return m;
  }, [gaeste]);

  const zimmerMap = useMemo(() => {
    const m = new Map<string, Zimmer>();
    zimmer.forEach(r => m.set(r.record_id, r));
    return m;
  }, [zimmer]);

  const fruehstuecksoptionenMap = useMemo(() => {
    const m = new Map<string, Fruehstuecksoptionen>();
    fruehstuecksoptionen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [fruehstuecksoptionen]);

  return { gaeste, setGaeste, meinFruehstueck, setMeinFruehstueck, zimmer, setZimmer, fruehstuecksbestellung, setFruehstuecksbestellung, fruehstuecksoptionen, setFruehstuecksoptionen, loading, error, fetchAll, gaesteMap, zimmerMap, fruehstuecksoptionenMap };
}