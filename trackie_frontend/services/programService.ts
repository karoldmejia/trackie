import api from './api';

// TODO(F7): `notes` e `initialWeight`/`initialWaist`/`initialHips`/`initialBodyfat`
// se eliminaron de Program (el backend ya no los devuelve ni los acepta). Las
// mediciones iniciales viven en /weight-logs; los % de cumplimiento, en program_metric_targets.

export type ProgramKind = 'cut' | 'bulk' | 'maintain';

export interface Program {
    id: string;
    name: string;
    kind: ProgramKind;
    startDate: string;
    endDate: string;
    totalWeeks: number;
    workoutsPerWeek: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Target dinámico de un Program (misma forma que el DTO del backend: src/dtos/program.dto.ts).
export interface ProgramMetricTargetInput {
    key: string;
    target: number;
    direction: 'at_least' | 'at_most' | 'exact';
    weight: number;
    isOptional?: boolean;
}

export interface CreateProgramDto {
    name: string;
    kind: ProgramKind;
    startDate: string;
    endDate: string;
    workoutsPerWeek?: number;
    totalWeeks?: number;
    isActive?: boolean;
    targets: ProgramMetricTargetInput[]; // backend exige ArrayMinSize(1)
}

export interface UpdateProgramDto {
    name?: string;
    kind?: ProgramKind;
    startDate?: string;
    endDate?: string;
    totalWeeks?: number;
    workoutsPerWeek?: number;
    isActive?: boolean;
}

export interface ProgramDay {
    date: string;
    weekNumber: number;
    dailyScore: number;
    allMet: boolean;
    metricResults: Record<string, boolean>;
}

// --- Dashboard ---

export interface ProgramTarget {
    key: string;
    label: string;
    target: number;
    direction: 'at_least' | 'at_most' | 'exact';
    weight: number;
    isOptional: boolean;
}

export interface ProgramMeasurementValue {
    first: { value: number; date: string } | null;
    last: { value: number; date: string } | null;
    difference: number | null;
}

export interface ProgramMeasurements {
    weight: ProgramMeasurementValue;
    bodyfat?: ProgramMeasurementValue;
    waist?: ProgramMeasurementValue;
    hips?: ProgramMeasurementValue;
}

export interface WeeklySummary {
    weekNumber: number;
    startDate: string;
    endDate: string;
    daysCount: number;
    daysWithAllMet: number;
    compliancePercentage: number;
    targetCompliance: Record<string, number>;
}

export interface WeeklyAverage {
    weekNumber: number;
    daysWithData: number;
    averages: Record<string, number>;
}

export interface TrendWeek {
    weekNumber: number;
    compliancePercentage: number;
}

export interface Trend {
    attribute: string;
    weeks: TrendWeek[];
    overallCompliance: number;
}

export type Trends = Record<string, Trend>;

export interface Streaks {
    currentStreak: number;
    bestStreak: number;
    lastFailedDate: string | null;
}

export interface CarryoverCalories {
    runningBalance: number;
    adjustedBudget: number;
    daysRemaining: number;
    averagePerDay: number;
}

export type CarryoverSteps = {
    totalSteps: number;
    stepBalance: number;
    daysRemaining: number;
    stepsRemaining: number;
    averageNeeded: number;
    isAhead: boolean;
    isBehind: boolean;
} | null;

export interface ProgramDashboard {
    program: {
        id: string;
        name: string;
        kind: ProgramKind;
        startDate: string;
        endDate: string;
        totalWeeks: number;
        currentWeek: number;
    };
    targets: ProgramTarget[];
    summary: {
        totalDays: number;
        daysWithAllMet: number;
        compliancePercentage: number;
        averageScore: number;
    };
    days: ProgramDay[];
    measurements: ProgramMeasurements;
    weeklySummary: WeeklySummary[];
    weeklyAverages: WeeklyAverage[];
    trends: Trends;
    streaks: Streaks;
    caloriesCarryover: CarryoverCalories;
    stepsCarryover: CarryoverSteps;
}

export const programService = {
    // Program methods
    create: async (data: CreateProgramDto): Promise<Program> => {
        const response = await api.post<Program>('/programs', data);
        return response.data;
    },

    findAll: async (): Promise<Program[]> => {
        const response = await api.get<Program[]>('/programs');
        return response.data;
    },

    findActive: async (): Promise<Program | null> => {
        const response = await api.get<Program | null>('/programs/active');
        return response.data;
    },

    findOne: async (id: string): Promise<Program> => {
        const response = await api.get<Program>(`/programs/${id}`);
        return response.data;
    },

    update: async (id: string, data: UpdateProgramDto): Promise<Program> => {
        const response = await api.put<Program>(`/programs/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/programs/${id}`);
    },

    activate: async (id: string): Promise<Program> => {
        const response = await api.put<Program>(`/programs/${id}/activate`);
        return response.data;
    },

    deactivate: async (id: string): Promise<Program> => {
        const response = await api.put<Program>(`/programs/${id}/deactivate`);
        return response.data;
    },

    // Dashboard methods
    getDashboard: async (id: string): Promise<ProgramDashboard> => {
        const response = await api.get<ProgramDashboard>(`/programs/${id}/dashboard`);
        return response.data;
    },

    // TODO(F7): getWeeklySummary/getTrends/getMeasurements/getSummary/getStats/getCalendar
    // se mantienen sin shape tipado porque el backend no publica contrato individual.
    getWeeklySummary: async (id: string): Promise<WeeklySummary[]> => {
        const response = await api.get<WeeklySummary[]>(`/programs/${id}/weekly-summary`);
        return response.data;
    },

    getTrends: async (id: string): Promise<Trends> => {
        const response = await api.get<Trends>(`/programs/${id}/trends`);
        return response.data;
    },

    getMeasurements: async (id: string): Promise<ProgramMeasurements> => {
        const response = await api.get<ProgramMeasurements>(`/programs/${id}/measurements`);
        return response.data;
    },

    getSummary: async (id: string): Promise<ProgramDashboard['summary']> => {
        const response = await api.get<ProgramDashboard['summary']>(`/programs/${id}/summary`);
        return response.data;
    },

    getStats: async (id: string): Promise<any> => {
        const response = await api.get<any>(`/programs/${id}/stats`);
        return response.data;
    },

    // Program Days methods
    getDays: async (id: string): Promise<ProgramDay[]> => {
        const response = await api.get<ProgramDay[]>(`/programs/${id}/days`);
        return response.data;
    },

    getCalendar: async (id: string): Promise<any> => {
        const response = await api.get<any>(`/programs/${id}/calendar`);
        return response.data;
    },

    syncAllDays: async (id: string): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>(`/programs/${id}/sync`);
        return response.data;
    },

    updateDayCompliance: async (programId: string, date: string): Promise<ProgramDay> => {
        const response = await api.put<ProgramDay>(`/programs/${programId}/days/${date}`);
        return response.data;
    },

    getStreaks: async (id: string): Promise<Streaks> => {
        const response = await api.get<Streaks>(`/programs/${id}/streaks`);
        return response.data;
    },
};

export default programService;
