import api from './api';

export const WorkoutType = {
    NONE: 'none',
    UPPER: 'upper',
    LOWER: 'lower',
    FULL: 'full',
    CARDIO: 'cardio',
} as const;

export interface CutPhase {
    id: string;
    startDate: string;
    endDate: string;
    totalWeeks: number;
    targetCalories: number;
    targetProtein: number;
    targetSteps: number;
    targetWater: number;
    workoutsPerWeek: number;
    initialWeight?: number;
    initialWaist?: number;
    initialHips?: number;
    initialBodyfat?: number;
    isActive: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCutPhaseDto {
    startDate: string;
    endDate: string;
    targetCalories: number;
    targetProtein: number;
    targetSteps: number;
    targetWater: number;
    workoutsPerWeek: number;
    initialWeight?: number;
    initialWaist?: number;
    initialHips?: number;
    initialBodyfat?: number;
    isActive?: boolean;
    notes?: string;
}

export interface UpdateCutPhaseDto {
    startDate?: string;
    endDate?: string;
    targetCalories?: number;
    targetProtein?: number;
    targetSteps?: number;
    targetWater?: number;
    workoutsPerWeek?: number;
    initialWeight?: number;
    initialWaist?: number;
    initialHips?: number;
    initialBodyfat?: number;
    isActive?: boolean;
    notes?: string;
}

export interface CutPhaseDay {
    id: string;
    date: string;
    weekNumber: number;
    caloriesMet: boolean;
    proteinMet: boolean;
    stepsMet: boolean;
    waterMet: boolean;
    workoutMet: boolean;
    dailyScore: number;
    allMet: boolean;
    cutPhaseId: string;
}

export const cutPhaseService = {
    // Cut Phase methods
    create: async (data: CreateCutPhaseDto): Promise<CutPhase> => {
        const response = await api.post<CutPhase>('/cut-phases', data);
        return response.data;
    },

    findAll: async (): Promise<CutPhase[]> => {
        const response = await api.get<CutPhase[]>('/cut-phases');
        return response.data;
    },

    findActive: async (): Promise<CutPhase | null> => {
        const response = await api.get<CutPhase | null>('/cut-phases/active');
        return response.data;
    },

    findOne: async (id: string): Promise<CutPhase> => {
        const response = await api.get<CutPhase>(`/cut-phases/${id}`);
        return response.data;
    },

    update: async (id: string, data: UpdateCutPhaseDto): Promise<CutPhase> => {
        const response = await api.put<CutPhase>(`/cut-phases/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/cut-phases/${id}`);
    },

    activate: async (id: string): Promise<CutPhase> => {
        const response = await api.put<CutPhase>(`/cut-phases/${id}/activate`);
        return response.data;
    },

    deactivate: async (id: string): Promise<CutPhase> => {
        const response = await api.put<CutPhase>(`/cut-phases/${id}/deactivate`);
        return response.data;
    },

    // Dashboard methods
    getDashboard: async (id: string): Promise<any> => {
        const response = await api.get<any>(`/cut-phases/${id}/dashboard`);
        return response.data;
    },

    getWeeklySummary: async (id: string): Promise<any> => {
        const response = await api.get<any>(`/cut-phases/${id}/weekly-summary`);
        return response.data;
    },

    getTrends: async (id: string): Promise<any> => {
        const response = await api.get<any>(`/cut-phases/${id}/trends`);
        return response.data;
    },

    getMeasurements: async (id: string): Promise<any> => {
        const response = await api.get<any>(`/cut-phases/${id}/measurements`);
        return response.data;
    },

    getSummary: async (id: string): Promise<any> => {
        const response = await api.get<any>(`/cut-phases/${id}/summary`);
        return response.data;
    },

    getStats: async (id: string): Promise<any> => {
        const response = await api.get<any>(`/cut-phases/${id}/stats`);
        return response.data;
    },

    // Cut Phase Days methods
    getDays: async (id: string): Promise<CutPhaseDay[]> => {
        const response = await api.get<CutPhaseDay[]>(`/cut-phases/${id}/days`);
        return response.data;
    },

    getCalendar: async (id: string): Promise<any> => {
        const response = await api.get<any>(`/cut-phases/${id}/calendar`);
        return response.data;
    },

    syncAllDays: async (id: string): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>(`/cut-phases/${id}/sync`);
        return response.data;
    },

    updateDayCompliance: async (phaseId: string, date: string): Promise<CutPhaseDay> => {
        const response = await api.put<CutPhaseDay>(`/cut-phases/${phaseId}/days/${date}`);
        return response.data;
    },
};

export default cutPhaseService;