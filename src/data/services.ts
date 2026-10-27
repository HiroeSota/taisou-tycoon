import type { ServiceType } from '../types/game';

export interface ServiceDefinition {
  type: ServiceType;
  name: string;
  description: string;
  targetAgeMin: number;
  targetAgeMax: number;
  defaultMonthlyFee: number;
  defaultTrialFee: number;
  defaultCapacity: number;
  defaultDurationMinutes: number;
  requiredCeilingHeight: number;
  requiredFloorArea: number;
  needsMat: boolean;
  instructorsRequired: number;
  demandLevel: number; // 1-5
  safetyRequirement: number; // 1-5
  retentionBase: number; // 月間継続率 0-1
  unlockPhase: number; // 1-7
}

export const SERVICE_DEFINITIONS: Record<ServiceType, ServiceDefinition> = {
  mat_gymnastics: {
    type: 'mat_gymnastics',
    name: 'マット運動教室',
    description: '前転・後転・側転などマット運動の基礎を指導',
    targetAgeMin: 5,
    targetAgeMax: 15,
    defaultMonthlyFee: 8000,
    defaultTrialFee: 1000,
    defaultCapacity: 8,
    defaultDurationMinutes: 60,
    requiredCeilingHeight: 3.0,
    requiredFloorArea: 40,
    needsMat: true,
    instructorsRequired: 1,
    demandLevel: 4,
    safetyRequirement: 3,
    retentionBase: 0.93,
    unlockPhase: 1,
  },
  acrobatics: {
    type: 'acrobatics',
    name: 'アクロバット教室',
    description: 'バク転・逆立ち歩きなど、高度な技術を指導',
    targetAgeMin: 8,
    targetAgeMax: 25,
    defaultMonthlyFee: 10000,
    defaultTrialFee: 2000,
    defaultCapacity: 6,
    defaultDurationMinutes: 90,
    requiredCeilingHeight: 4.0,
    requiredFloorArea: 50,
    needsMat: true,
    instructorsRequired: 1,
    demandLevel: 3,
    safetyRequirement: 5,
    retentionBase: 0.90,
    unlockPhase: 1,
  },
  personal: {
    type: 'personal',
    name: 'パーソナルレッスン',
    description: '1対1の個別指導。目標に合わせたカスタムプログラム',
    targetAgeMin: 6,
    targetAgeMax: 60,
    defaultMonthlyFee: 24000,
    defaultTrialFee: 3000,
    defaultCapacity: 1,
    defaultDurationMinutes: 60,
    requiredCeilingHeight: 2.5,
    requiredFloorArea: 20,
    needsMat: false,
    instructorsRequired: 1,
    demandLevel: 2,
    safetyRequirement: 2,
    retentionBase: 0.88,
    unlockPhase: 1,
  },
  kids_gymnastics: {
    type: 'kids_gymnastics',
    name: '幼児向け運動教室',
    description: '3〜6歳向け。体の基礎動作・バランス感覚を楽しく育てる',
    targetAgeMin: 3,
    targetAgeMax: 6,
    defaultMonthlyFee: 7500,
    defaultTrialFee: 500,
    defaultCapacity: 10,
    defaultDurationMinutes: 45,
    requiredCeilingHeight: 2.5,
    requiredFloorArea: 30,
    needsMat: true,
    instructorsRequired: 1,
    demandLevel: 5,
    safetyRequirement: 4,
    retentionBase: 0.92,
    unlockPhase: 2,
  },
  elementary_gymnastics: {
    type: 'elementary_gymnastics',
    name: '小学生体操教室',
    description: '体操の基礎技術と体力づくり',
    targetAgeMin: 6,
    targetAgeMax: 12,
    defaultMonthlyFee: 9000,
    defaultTrialFee: 1000,
    defaultCapacity: 12,
    defaultDurationMinutes: 60,
    requiredCeilingHeight: 3.5,
    requiredFloorArea: 50,
    needsMat: true,
    instructorsRequired: 1,
    demandLevel: 5,
    safetyRequirement: 3,
    retentionBase: 0.91,
    unlockPhase: 2,
  },
  adult_fitness: {
    type: 'adult_fitness',
    name: '大人向け運動教室',
    description: '成人向けの体操・体幹トレーニング・柔軟性向上',
    targetAgeMin: 20,
    targetAgeMax: 55,
    defaultMonthlyFee: 9800,
    defaultTrialFee: 1000,
    defaultCapacity: 10,
    defaultDurationMinutes: 60,
    requiredCeilingHeight: 2.8,
    requiredFloorArea: 35,
    needsMat: false,
    instructorsRequired: 1,
    demandLevel: 3,
    safetyRequirement: 2,
    retentionBase: 0.85,
    unlockPhase: 2,
  },
  senior_fitness: {
    type: 'senior_fitness',
    name: '高齢者向け運動プログラム',
    description: '転倒予防・筋力維持を目的とした安心のプログラム',
    targetAgeMin: 60,
    targetAgeMax: 90,
    defaultMonthlyFee: 6000,
    defaultTrialFee: 500,
    defaultCapacity: 8,
    defaultDurationMinutes: 50,
    requiredCeilingHeight: 2.5,
    requiredFloorArea: 30,
    needsMat: false,
    instructorsRequired: 1,
    demandLevel: 3,
    safetyRequirement: 5,
    retentionBase: 0.94,
    unlockPhase: 3,
  },
  visit_care: {
    type: 'visit_care',
    name: '介護施設への出張指導',
    description: '介護施設・老人ホームへの訪問型体操プログラム',
    targetAgeMin: 65,
    targetAgeMax: 95,
    defaultMonthlyFee: 50000,
    defaultTrialFee: 5000,
    defaultCapacity: 15,
    defaultDurationMinutes: 60,
    requiredCeilingHeight: 0,
    requiredFloorArea: 0,
    needsMat: false,
    instructorsRequired: 1,
    demandLevel: 2,
    safetyRequirement: 5,
    retentionBase: 0.95,
    unlockPhase: 3,
  },
};

export function getAvailableServices(phase: number): ServiceDefinition[] {
  return Object.values(SERVICE_DEFINITIONS).filter(s => s.unlockPhase <= phase);
}
