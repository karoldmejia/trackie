import api from './api';

export interface Dish {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PlannedMeal {
    id: string;
    mealType: 'desayuno' | 'almuerzo' | 'cena' | 'snack';
    time: string;
    dayPlan: DayPlan;
    dishes: Dish[];
    createdAt?: string;
    updatedAt?: string;
}

export interface DayPlan {
    id: string;
    date: string;
    plannedMeals: PlannedMeal[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateDishDto {
    name: string;
    description?: string;
}

export interface UpdateDishDto {
    name?: string;
    description?: string;
}

export interface CreatePlannedMealDto {
    mealType: 'desayuno' | 'almuerzo' | 'cena' | 'snack';
    time: string; // Formato HH:mm
    dishIds?: string[];
}

export interface UpdatePlannedMealDto {
    mealType?: 'desayuno' | 'almuerzo' | 'cena' | 'snack';
    time?: string;
}

export interface CreateDayPlanDto {
    date: string;
    plannedMeals?: CreatePlannedMealDto[];
}

export interface AddDishesToPlannedMealDto {
    dishIds: string[];
}


export const mealPlannerService = {
    /**
     * Crear un DayPlan para una fecha específica
     */
    createDayPlan: async (data: CreateDayPlanDto): Promise<DayPlan> => {
        const response = await api.post<DayPlan>('/meal-planner/day-plan', data);
        return response.data;
    },

    /**
     * Consultar todos los DayPlans
     */
    getAllDayPlans: async (): Promise<DayPlan[]> => {
        const response = await api.get<DayPlan[]>('/meal-planner/day-plan');
        return response.data;
    },

    /**
     * Consultar DayPlan por fecha
     */
    getDayPlanByDate: async (date: string): Promise<DayPlan | null> => {
        const response = await api.get<DayPlan | null>(`/meal-planner/day-plan/date/${date}`);
        return response.data;
    },

    /**
     * Consultar DayPlan por ID
     */
    getDayPlanById: async (id: string): Promise<DayPlan | null> => {
        const response = await api.get<DayPlan | null>(`/meal-planner/day-plan/${id}`);
        return response.data;
    },

    /**
     * Eliminar un DayPlan
     */
    deleteDayPlan: async (id: string): Promise<void> => {
        await api.delete(`/meal-planner/day-plan/${id}`);
    },

    /**
     * Agregar un PlannedMeal a un DayPlan
     */
    addPlannedMeal: async (dayPlanId: string, data: CreatePlannedMealDto): Promise<PlannedMeal> => {
        const response = await api.post<PlannedMeal>(
            `/meal-planner/day-plan/${dayPlanId}/planned-meal`,
            data
        );
        return response.data;
    },

    /**
     * Editar un PlannedMeal (tipo de comida y/o hora)
     */
    updatePlannedMeal: async (id: string, data: UpdatePlannedMealDto): Promise<PlannedMeal> => {
        const response = await api.put<PlannedMeal>(`/meal-planner/planned-meal/${id}`, data);
        return response.data;
    },

    /**
     * Eliminar un PlannedMeal
     */
    deletePlannedMeal: async (id: string): Promise<void> => {
        await api.delete(`/meal-planner/planned-meal/${id}`);
    },

    /**
     * Crear un Dish
     */
    createDish: async (data: CreateDishDto): Promise<Dish> => {
        const response = await api.post<Dish>('/meal-planner/dish', data);
        return response.data;
    },

    /**
     * Consultar la biblioteca de Dishes
     */
    getAllDishes: async (): Promise<Dish[]> => {
        const response = await api.get<Dish[]>('/meal-planner/dish');
        return response.data;
    },

    /**
     * Consultar un Dish por ID
     */
    getDishById: async (id: string): Promise<Dish | null> => {
        const response = await api.get<Dish | null>(`/meal-planner/dish/${id}`);
        return response.data;
    },

    /**
     * Editar un Dish
     */
    updateDish: async (id: string, data: UpdateDishDto): Promise<Dish> => {
        const response = await api.put<Dish>(`/meal-planner/dish/${id}`, data);
        return response.data;
    },

    /**
     * Eliminar un Dish
     */
    deleteDish: async (id: string): Promise<void> => {
        await api.delete(`/meal-planner/dish/${id}`);
    },

    /**
     * Agregar uno o varios Dishes a un PlannedMeal
     */
    addDishesToPlannedMeal: async (plannedMealId: string, dishIds: string[]): Promise<PlannedMeal> => {
        const response = await api.post<PlannedMeal>(
            `/meal-planner/planned-meal/${plannedMealId}/dishes`,
            { dishIds }
        );
        return response.data;
    },
    
    removeDishFromPlannedMeal: async (plannedMealId: string, dishId: string): Promise<void> => {
        await api.delete(`/meal-planner/planned-meal/${plannedMealId}/dish/${dishId}`);
    },
};