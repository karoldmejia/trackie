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

export const getMonthStartDate = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getMonthEndDate = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const getYearStartDate = (date: Date): Date => {
    return new Date(date.getFullYear(), 0, 1);
};

export const getYearEndDate = (date: Date): Date => {
    return new Date(date.getFullYear(), 11, 31);
};