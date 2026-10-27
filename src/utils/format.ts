export function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 10000) {
    const man = amount / 10000;
    return `${man % 1 === 0 ? man.toFixed(0) : man.toFixed(1)}万円`;
  }
  return `${amount.toLocaleString()}円`;
}

export function formatCurrencyFull(amount: number): string {
  return `${amount.toLocaleString()}円`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDate(year: number, month: number, week: number): string {
  return `${year}年${month}月 第${week}週`;
}

export function weekToDate(weekNumber: number, startYear = 2027, startMonth = 9): { year: number; month: number; week: number } {
  // Game starts 2027/9/week1
  const totalMonths = Math.floor(weekNumber / 4);
  const weekInMonth = (weekNumber % 4) + 1;
  const startMonthIndex = (startYear - 2027) * 12 + (startMonth - 1);
  const currentMonthIndex = startMonthIndex + totalMonths;
  const year = 2027 + Math.floor(currentMonthIndex / 12);
  const month = (currentMonthIndex % 12) + 1;
  return { year, month, week: weekInMonth };
}

export function getAbsoluteWeek(year: number, month: number, week: number): number {
  const monthsFromStart = (year - 2027) * 12 + (month - 1);
  return monthsFromStart * 4 + (week - 1);
}

export function formatHM(hour: number, minute: number = 0): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
