import api from './api';

// Backend enum: src/enums/metric-block-type.enum.ts
export type MetricBlockType = 'distance' | 'duration' | 'reps';

export interface WorkoutBlockTemplate {
    id: string;
    workoutId: string;
    kind: string;
    name: string;
    rounds: number;
    metricType: MetricBlockType;
    targetDistanceMeters?: number;
    targetDurationSeconds?: number;
    targetReps?: number;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface WorkoutTemplate {
    id: string;
    routineId: string;
    name: string;
    type: string;
    order: number;
    createdAt: string;
    updatedAt: string;
    blockTemplates?: WorkoutBlockTemplate[];
}

export interface WorkoutRoutine {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    templates?: WorkoutTemplate[];
}

export interface WorkoutBlockExecution {
    id: string;
    templateId?: string;
    kindSnapshot: string;
    nameSnapshot: string;
    metricTypeSnapshot: string;
    plannedRounds: number;
    actualRounds: number;
    targetDistanceMeters?: number;
    actualDistanceMeters?: number;
    targetDurationSeconds?: number;
    actualDurationSeconds?: number;
    targetReps?: number;
    actualReps?: number;
    completed: boolean;
}

export interface WorkoutExecution {
    id: string;
    dailyLogId: string;
    date: string;
    routineId?: string;
    workoutId?: string;
    workoutNameSnapshot: string;
    workoutTypeSnapshot: string;
    totalDistanceMeters: number;
    totalDurationSeconds: number;
    totalRounds: number;
    completed: boolean;
    notes?: string;
    blocks: WorkoutBlockExecution[];
}

export interface WorkoutBlockExecutionInput {
    templateId?: string;
    kind?: string;
    name?: string;
    metricType?: MetricBlockType;
    plannedRounds?: number;
    actualRounds?: number;
    targetDistanceMeters?: number;
    actualDistanceMeters?: number;
    targetDurationSeconds?: number;
    actualDurationSeconds?: number;
    targetReps?: number;
    actualReps?: number;
    completed?: boolean;
}

export interface CreateWorkoutRoutineDto {
    name: string;
    isActive?: boolean;
}

export interface UpdateWorkoutRoutineDto {
    name?: string;
    isActive?: boolean;
}

export interface CreateWorkoutTemplateDto {
    routineId: string;
    name: string;
    type: string;
    order?: number;
}

export interface UpdateWorkoutTemplateDto {
    routineId?: string;
    name?: string;
    type?: string;
    order?: number;
}

export interface CreateBlockTemplateDto {
    workoutId: string;
    kind: string;
    name: string;
    rounds?: number;          // default 1
    metricType: MetricBlockType;
    targetDistanceMeters?: number;
    targetDurationSeconds?: number;
    targetReps?: number;
    order?: number;
}

export type UpdateBlockTemplateDto = Omit<Partial<CreateBlockTemplateDto>, 'workoutId'>;

export interface RegisterWorkoutExecutionDto {
    date: string;
    routineId?: string;
    workoutId?: string;
    workoutNameSnapshot?: string;
    workoutTypeSnapshot?: string;
    notes?: string;
    blocks?: WorkoutBlockExecutionInput[];
}

export const workoutService = {
    // Listar bloques de un workout
    listBlockTemplates: async (workoutId: string): Promise<WorkoutBlockTemplate[]> => {
        const response = await api.get<WorkoutBlockTemplate[]>('/workout-block-templates', {
            params: { workoutId },
        });
        return response.data;
    },

    // Crear bloque
    createBlockTemplate: async (dto: CreateBlockTemplateDto): Promise<WorkoutBlockTemplate> => {
        const response = await api.post<WorkoutBlockTemplate>('/workout-block-templates', dto);
        return response.data;
    },

    // Actualizar bloque
    updateBlockTemplate: async (id: string, dto: UpdateBlockTemplateDto): Promise<WorkoutBlockTemplate> => {
        const response = await api.put<WorkoutBlockTemplate>(`/workout-block-templates/${id}`, dto);
        return response.data;
    },

    // Borrar bloque
    deleteBlockTemplate: async (id: string): Promise<void> => {
        await api.delete(`/workout-block-templates/${id}`);
    },

    // Crear rutina
    createRoutine: async (dto: CreateWorkoutRoutineDto): Promise<WorkoutRoutine> => {
        const response = await api.post<WorkoutRoutine>('/workout-routines', dto);
        return response.data;
    },

    // Actualizar rutina
    updateRoutine: async (id: string, dto: UpdateWorkoutRoutineDto): Promise<WorkoutRoutine> => {
        const response = await api.put<WorkoutRoutine>(`/workout-routines/${id}`, dto);
        return response.data;
    },

    // Borrar rutina (CASCADE a templates y block templates)
    deleteRoutine: async (id: string): Promise<void> => {
        await api.delete(`/workout-routines/${id}`);
    },

    // Crear workout (template) dentro de una rutina
    createTemplate: async (dto: CreateWorkoutTemplateDto): Promise<WorkoutTemplate> => {
        const response = await api.post<WorkoutTemplate>('/workout-templates', dto);
        return response.data;
    },

    // Actualizar workout (template)
    updateTemplate: async (id: string, dto: UpdateWorkoutTemplateDto): Promise<WorkoutTemplate> => {
        const response = await api.put<WorkoutTemplate>(`/workout-templates/${id}`, dto);
        return response.data;
    },

    // Borrar workout (template)
    deleteTemplate: async (id: string): Promise<void> => {
        await api.delete(`/workout-templates/${id}`);
    },

    // Listar rutinas de entrenamiento
    listRoutines: async (): Promise<WorkoutRoutine[]> => {
        const response = await api.get<WorkoutRoutine[]>('/workout-routines');
        return response.data;
    },

    // Obtener una rutina con templates y blockTemplates anidados
    getRoutine: async (id: string): Promise<WorkoutRoutine> => {
        const response = await api.get<WorkoutRoutine>(`/workout-routines/${id}`);
        return response.data;
    },

    // Listar templates (opcionalmente filtrados por rutina)
    listTemplates: async (routineId?: string): Promise<WorkoutTemplate[]> => {
        const response = await api.get<WorkoutTemplate[]>('/workout-templates', {
            params: routineId ? { routineId } : undefined,
        });
        return response.data;
    },

    // Obtener un template con sus blockTemplates
    getTemplate: async (id: string): Promise<WorkoutTemplate> => {
        const response = await api.get<WorkoutTemplate>(`/workout-templates/${id}`);
        return response.data;
    },

    // Registrar una ejecución de workout (crea/actualiza el daily log del día y sincroniza ProgramDay)
    registerExecution: async (dto: RegisterWorkoutExecutionDto): Promise<WorkoutExecution> => {
        const response = await api.post<WorkoutExecution>('/workout-executions', dto);
        return response.data;
    },

    // Listar ejecuciones por fecha o rango
    listExecutions: async (params?: { date?: string; start?: string; end?: string }): Promise<WorkoutExecution[]> => {
        const response = await api.get<WorkoutExecution[]>('/workout-executions', { params });
        return response.data;
    },

    // Eliminar una ejecución
    deleteExecution: async (id: string): Promise<void> => {
        await api.delete(`/workout-executions/${id}`);
    },
};

export default workoutService;
