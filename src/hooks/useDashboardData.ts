import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Fruehstuecksoptionen, Gaeste, MeinFruehstueck, Zimmer, Fruehstuecksbestellung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [fruehstuecksoptionen, setFruehstuecksoptionen] = useState<Fruehstuecksoptionen[]>([]);
  const [gaeste, setGaeste] = useState<Gaeste[]>([]);
  const [meinFruehstueck, setMeinFruehstueck] = useState<MeinFruehstueck[]>([]);
  const [zimmer, setZimmer] = useState<Zimmer[]>([]);
  const [fruehstuecksbestellung, setFruehstuecksbestellung] = useState<Fruehstuecksbestellung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [fruehstuecksoptionenData, gaesteData, meinFruehstueckData, zimmerData, fruehstuecksbestellungData] = await Promise.all([
        LivingAppsService.getFruehstuecksoptionen(),
        LivingAppsService.getGaeste(),
        LivingAppsService.getMeinFruehstueck(),
        LivingAppsService.getZimmer(),
        LivingAppsService.getFruehstuecksbestellung(),
      ]);
      setFruehstuecksoptionen(fruehstuecksoptionenData);
      setGaeste(gaesteData);
      setMeinFruehstueck(meinFruehstueckData);
      setZimmer(zimmerData);
      setFruehstuecksbestellung(fruehstuecksbestellungData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [fruehstuecksoptionenData, gaesteData, meinFruehstueckData, zimmerData, fruehstuecksbestellungData] = await Promise.all([
          LivingAppsService.getFruehstuecksoptionen(),
          LivingAppsService.getGaeste(),
          LivingAppsService.getMeinFruehstueck(),
          LivingAppsService.getZimmer(),
          LivingAppsService.getFruehstuecksbestellung(),
        ]);
        setFruehstuecksoptionen(fruehstuecksoptionenData);
        setGaeste(gaesteData);
        setMeinFruehstueck(meinFruehstueckData);
        setZimmer(zimmerData);
        setFruehstuecksbestellung(fruehstuecksbestellungData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const fruehstuecksoptionenMap = useMemo(() => {
    const m = new Map<string, Fruehstuecksoptionen>();
    fruehstuecksoptionen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [fruehstuecksoptionen]);

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

  return { fruehstuecksoptionen, setFruehstuecksoptionen, gaeste, setGaeste, meinFruehstueck, setMeinFruehstueck, zimmer, setZimmer, fruehstuecksbestellung, setFruehstuecksbestellung, loading, error, fetchAll, fruehstuecksoptionenMap, gaesteMap, zimmerMap };
}