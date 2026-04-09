import { DailyLog } from '@/services/dailyLogService';

export interface WeeklyDailyAverage {
    weekStart: string;
    weekEnd: string;
    weekRange: string;
    avgCalories: number;
    avgSteps: number;
    avgEnergyDrinks: number;
    avgWaterLiters: number;
}

export const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
};

export const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatDisplayDateFull = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const getWeekStartDate = (date: Date, weekStartDay: number): Date => {
    const currentDay = date.getDay();
    let daysToSubtract = currentDay - weekStartDay;
    if (daysToSubtract < 0) {
        daysToSubtract += 7;
    }
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
};

export const getWeekEndDate = (weekStart: Date): Date => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
};

export const calculateWeeklyAveragesFromDailyLogs = (
    logs: DailyLog[],
    weekStartDay: number = 1
): WeeklyDailyAverage[] => {
    if (!logs.length) return [];

    const weeks: WeeklyDailyAverage[] = [];
    const sortedLogs = [...logs].sort((a, b) =>
        parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
    );

    const weekMap = new Map<string, DailyLog[]>();

    for (const log of sortedLogs) {
        const logDate = parseLocalDate(log.date);
        const weekStart = getWeekStartDate(logDate, weekStartDay);
        const weekKey = formatLocalDate(weekStart);

        if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, []);
        }
        weekMap.get(weekKey)!.push(log);
    }

    for (const [weekKey, logsInWeek] of weekMap) {
        const avgCalories = logsInWeek.reduce((sum, l) => sum + l.calories, 0) / logsInWeek.length;
        const avgSteps = logsInWeek.reduce((sum, l) => sum + l.steps, 0) / logsInWeek.length;
        const avgEnergyDrinks = logsInWeek.reduce((sum, l) => sum + l.energyDrinks, 0) / logsInWeek.length;
        const avgWaterLiters = logsInWeek.reduce((sum, l) => sum + l.waterLiters, 0) / logsInWeek.length;

        const weekStart = parseLocalDate(weekKey);
        const weekEnd = getWeekEndDate(weekStart);
        const weekRange = `${formatDisplayDateFull(weekStart)} - ${formatDisplayDateFull(weekEnd)}`;

        weeks.push({
            weekStart: weekKey,
            weekEnd: formatLocalDate(weekEnd),
            weekRange,
            avgCalories: Math.round(avgCalories),
            avgSteps: Math.round(avgSteps),
            avgEnergyDrinks: Math.round(avgEnergyDrinks),
            avgWaterLiters: Math.round(avgWaterLiters * 10) / 10,
        });
    }

    return weeks.sort((a, b) =>
        parseLocalDate(b.weekStart).getTime() - parseLocalDate(a.weekStart).getTime()
    );
};