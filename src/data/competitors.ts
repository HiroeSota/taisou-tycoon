import type { Competitor } from '../types/game';

// 競合は架空ブランドとして実装（実在教室を直接モデル化しない）
// 市場の参考価格帯は実在教室の公開情報に基づく（2026年10月確認）
// JPCスポーツ: 8,576円/月, biima sports: 9,280円/月, ネイス体操: 9,800円/月

export const COMPETITORS_TEMPLATE: Omit<Competitor, 'id'>[] = [
  {
    name: 'スター体操クラブ',
    areaId: 'kusatsu',
    strategy: 'quality_focused',
    monthlyFee: 9800,
    quality: 75,
    brandAwareness: 65,
    memberCount: 85,
    adSpendWeekly: 15000,
    services: ['elementary_gymnastics', 'kids_gymnastics', 'mat_gymnastics'],
    isActive: true,
    mapX: 290,
    mapY: 130,
  },
  {
    name: 'キッズアクティブ草津',
    areaId: 'kusatsu',
    strategy: 'price_focused',
    monthlyFee: 7500,
    quality: 55,
    brandAwareness: 50,
    memberCount: 60,
    adSpendWeekly: 8000,
    services: ['kids_gymnastics', 'mat_gymnastics'],
    isActive: true,
    mapX: 200,
    mapY: 130,
  },
  {
    name: 'からだ育ち塾',
    areaId: 'ritto',
    strategy: 'community_focused',
    monthlyFee: 8000,
    quality: 65,
    brandAwareness: 55,
    memberCount: 40,
    adSpendWeekly: 5000,
    services: ['kids_gymnastics', 'elementary_gymnastics'],
    isActive: true,
    mapX: 180,
    mapY: 300,
  },
  {
    name: 'びわこスポーツアカデミー',
    areaId: 'otsu',
    strategy: 'quality_focused',
    monthlyFee: 10500,
    quality: 85,
    brandAwareness: 80,
    memberCount: 130,
    adSpendWeekly: 25000,
    services: ['mat_gymnastics', 'acrobatics', 'kids_gymnastics', 'elementary_gymnastics'],
    isActive: true,
    mapX: 100,
    mapY: 120,
  },
];
