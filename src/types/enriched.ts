import type { Fruehstuecksbestellung, Gaeste, MeinFruehstueck } from './app';

export type EnrichedGaeste = Gaeste & {
  zimmer_refName: string;
};

export type EnrichedMeinFruehstueck = MeinFruehstueck & {
  gast_self_refName: string;
};

export type EnrichedFruehstuecksbestellung = Fruehstuecksbestellung & {
  gast_refName: string;
  optionen_refName: string;
};
