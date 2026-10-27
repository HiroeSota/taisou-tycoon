// 再現性のある乱数生成（Mulberry32アルゴリズム）
export function createRng(seed: number) {
  let s = seed;
  return {
    next(): number {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    },
    // min以上max未満の整数
    int(min: number, max: number): number {
      return Math.floor(this.next() * (max - min)) + min;
    },
    // min以上max以下の浮動小数
    float(min: number, max: number): number {
      return this.next() * (max - min) + min;
    },
    // 確率でtrueを返す
    chance(probability: number): boolean {
      return this.next() < probability;
    },
    // 配列からランダムに選ぶ
    pick<T>(arr: T[]): T {
      return arr[this.int(0, arr.length)];
    },
  };
}

export type Rng = ReturnType<typeof createRng>;
