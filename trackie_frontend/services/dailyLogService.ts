import api from './api';

// TODO(F3): GoodBadDaysResult / DayClassification / FullStatsResult siguen
// tipados con campos específicos de calorías/pasos (averageCalories,
// averageSteps, calories, steps, etc.) porque el contrato nuevo de esos
// endpoints no está definido todavía. Revisar y migrar cuando el backend
// publique el nuevo shape.

export type MetricValueType = 'boolean' | 'number' | 'duration';

export interface MetricEntry {
    key: string;
    label: string;
    valueType: MetricValueType;
    unit?: string;
    value: number;
}

export interface WorkoutBlockExecution {
    id: string;
    kindSnapshot: string;
    nameSnapshot: string;
    metricTypeSnapshot: string;
    plannedRounds: number;
    actualRounds: number;
    actualDistanceMeters?: number;
    actualDurationSeconds?: number;
    actualReps?: number;
    completed: boolean;
}

export interface WorkoutExecution {
    id: string;
    routineId?: string;
    workoutId?: string;
    workoutNameSnapshot: string;
    workoutTypeSnapshot: string;
    totalDistanceMeters: number;
    totalDurationSeconds: number;
    totalRounds: number;
    completed: boolean;
    blocks: WorkoutBlockExecution[];
}

export interface DailyLog {
    id: string;
    date: string;
    metrics: MetricEntry[];
    extraMetrics: Record<string, number>;
    workouts: WorkoutExecution[];
}

export interface WorkoutBlockExecutionInput {
    templateId?: string;
    actualRounds?: number;
    actualDistanceMeters?: number;
    actualDurationSeconds?: number;
    actualReps?: number;
    completed?: boolean;
}

export interface WorkoutExecutionInput {
    workoutId: string;
    routineId?: string;
    completed?: boolean;
    blocks?: WorkoutBlockExecutionInput[];
}

export interface CreateDailyLogDto {
    date?: string;
    metrics?: Record<string, number>;
    workouts?: WorkoutExecutionInput[];
}

export interface FormMetric {
    key: string;
    label: string;
    valueType: MetricValueType;
    unit?: string;
    isUniversal: boolean;
    isDerived?: boolean;
    target?: number;
    direction?: 'at_least' | 'at_most' | 'exact';
    weight?: number;
    isOptional?: boolean;
}

export interface FormSchema {
    metrics: FormMetric[];
    availableToAdd: FormMetric[];
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

export interface PaginatedDailyLogs {
    items: DailyLog[];
    total: number;
    hasMore: boolean;
}

/**
 * Lee el valor de una métrica por su key.
 * Prioriza `metrics` (array con metadata) y cae a `extraMetrics` (record plano).
 * Es el único punto de acceso a métricas: si el contrato cambia, solo se toca aquí.
 */
export const getMetric = (
    log: Pick<DailyLog, 'metrics' | 'extraMetrics'>,
    key: string,
    fallback = 0,
): number => {
    const entry = log.metrics?.find(m => m.key === key);
    if (entry) return entry.value;
    return log.extraMetrics?.[key] ?? fallback;
};

export const dailyLogService = {
    // Obtener todos los logs
    getAll: async () => {
        const response = await api.get<DailyLog[]>('/daily-logs');
        return response.data;
    },

    getPage: async (params: { limit: number; offset: number }) => {
        const response = await api.get<PaginatedDailyLogs>('/daily-logs', { params });
        return response.data;
    },

    // Obtener log por fecha
    getByDate: async (date: string) => {
        const response = await api.get<DailyLog>(`/daily-logs/date/${date}`);
        return response.data;
    },

    // Obtener schema del formulario (métricas disponibles y objetivos)
    getFormSchema: async (): Promise<FormSchema> => {
        const response = await api.get<FormSchema>('/daily-logs/form-schema');
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
