import type { Area } from '../types/game';

export const AREAS: Area[] = [
  {
    id: 'kusatsu',
    name: '草津',
    population: 145000,
    demandMultiplier: 1.2,
    competitionLevel: 0.8,
    avgRent: 12000,
    description: '人口増加が続く住宅都市。若いファミリー層が多く、子ども向け習い事の需要が高い。競合教室も複数あるが、まだ市場は成長中。',
  },
  {
    id: 'ritto',
    name: '栗東',
    population: 72000,
    demandMultiplier: 1.0,
    competitionLevel: 0.5,
    avgRent: 9000,
    description: '落ち着いた住宅地域。競合が少なく参入しやすいが、人口規模は草津より小さい。口コミが広がりやすい地域密着型のチャンス。',
  },
  {
    id: 'otsu',
    name: '大津',
    population: 342000,
    demandMultiplier: 1.5,
    competitionLevel: 1.2,
    avgRent: 18000,
    description: '滋賀県の県庁所在地。大きな市場があるが、競合も強く集客コストが高い。ブランドを確立できれば大きな成長余地。',
  },
];
