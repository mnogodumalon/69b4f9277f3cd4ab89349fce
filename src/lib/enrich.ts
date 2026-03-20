import type { EnrichedFruehstuecksbestellung, EnrichedGaeste, EnrichedMeinFruehstueck } from '@/types/enriched';
import type { Fruehstuecksbestellung, Fruehstuecksoptionen, Gaeste, MeinFruehstueck, Zimmer } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface GaesteMaps {
  zimmerMap: Map<string, Zimmer>;
}

export function enrichGaeste(
  gaeste: Gaeste[],
  maps: GaesteMaps
): EnrichedGaeste[] {
  return gaeste.map(r => ({
    ...r,
    zimmer_refName: resolveDisplay(r.fields.zimmer_ref, maps.zimmerMap, 'zimmernummer'),
  }));
}

interface MeinFruehstueckMaps {
  gaesteMap: Map<string, Gaeste>;
}

export function enrichMeinFruehstueck(
  meinFruehstueck: MeinFruehstueck[],
  maps: MeinFruehstueckMaps
): EnrichedMeinFruehstueck[] {
  return meinFruehstueck.map(r => ({
    ...r,
    gast_self_refName: resolveDisplay(r.fields.gast_self_ref, maps.gaesteMap, 'gast_vorname'),
  }));
}

interface FruehstuecksbestellungMaps {
  gaesteMap: Map<string, Gaeste>;
  fruehstuecksoptionenMap: Map<string, Fruehstuecksoptionen>;
}

export function enrichFruehstuecksbestellung(
  fruehstuecksbestellung: Fruehstuecksbestellung[],
  maps: FruehstuecksbestellungMaps
): EnrichedFruehstuecksbestellung[] {
  return fruehstuecksbestellung.map(r => ({
    ...r,
    gast_refName: resolveDisplay(r.fields.gast_ref, maps.gaesteMap, 'gast_vorname'),
    optionen_refName: resolveDisplay(r.fields.optionen_ref, maps.fruehstuecksoptionenMap, 'option_name'),
  }));
}
