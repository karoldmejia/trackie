import api from './api';

export interface DailyLog {
    id: string;
    date: string;
    calories: number;
    steps: number;
    workout: string;
    energyDrinks: number;
    waterLiters: number;
}

export interface CreateDailyLogDto {
    date?: string;
    calories?: number;
    steps?: number;
    workout?: string;
    energyDrinks?: number;
    waterLiters?: number;
}

export interface GoodBadDaysResult {
    goodDays: number;
    badDays: number;
    totalDays: number;
    goodDaysPercentage: number;
    badDaysPercentage: number;
    averageCalories: number;
    averageSteps: number;
    goodDaysList: DailyLog[];
    badDaysList: DailyLog[];
}

export interface DayClassification {
    date: string;
    calories: number;
    steps: number;
    isGood: boolean;
    isBad: boolean;
    reason: string;
}

export interface FullStatsResult {
    period: { start: string; end: string };
    summary: {
        totalDays: number;
        totalCalories: number;
        averageCalories: number;
        averageSteps: number;
        bestDay: DailyLog | null;
        bestDayCalories: number;
        worstDayCalories: number;
    };
    goodBadStats: GoodBadDaysResult;
    classifications: DayClassification[];
    trend: {
        percentage: number;
        direction: 'up' | 'down' | 'stable';
        previousAverage: number;
        currentAverage: number;
    };
}

export const dailyLogService = {
    // Obtener todos los logs
    getAll: async () => {
        const response = await api.get<DailyLog[]>('/daily-logs');
        return response.data;
    },

    // Obtener log por fecha
    getByDate: async (date: string) => {
        const response = await api.get<DailyLog>(`/daily-logs/date/${date}`);
        return response.data;
    },

    // Crear nuevo log
    create: async (data: CreateDailyLogDto) => {
        const response = await api.post<DailyLog>('/daily-logs', data);
        return response.data;
    },

    // Actualizar log
    update: async (id: string, data: Partial<CreateDailyLogDto>) => {
        const response = await api.patch<DailyLog>(`/daily-logs/${id}`, data);
        return response.data;
    },

    // Upsert (crear o actualizar)
    upsert: async (data: CreateDailyLogDto) => {
        const response = await api.put<DailyLog>('/daily-logs', data);
        return response.data;
    },

    // Eliminar log
    delete: async (id: string) => {
        await api.delete(`/daily-logs/${id}`);
    },

    // Obtener días buenos y malos
    getGoodBadDays: async (params: {
        start: string;
        end: string;
        calorieLimit: number;
        stepGoal: number;
    }): Promise<GoodBadDaysResult> => {
        const response = await api.get<GoodBadDaysResult>('/daily-logs/good-bad-days', { params });
        return response.data;
    },

    // Clasificar días con razones
    classifyDays: async (params: {
        start: string;
        end: string;
        calorieLimit: number;
        stepGoal: number;
    }): Promise<DayClassification[]> => {
        const response = await api.get<DayClassification[]>('/daily-logs/classify', { params });
        return response.data;
    },

    // Obtener estadísticas completas
    getFullStats: async (params: {
        start: string;
        end: string;
        calorieLimit: number;
        stepGoal: number;
    }): Promise<FullStatsResult> => {
        const response = await api.get<FullStatsResult>('/daily-logs/full-stats', { params });
        return response.data;
    },
};