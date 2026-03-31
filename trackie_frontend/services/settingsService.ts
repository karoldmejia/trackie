import api from './api';

export interface Settings {
    id: number;
    weekStartDay: number;
    calorieLimit: number;
    stepsLimit: number;
    targetWeight?: number;
}

export interface UpdateSettingsDto {
    weekStartDay?: number;
    calorieLimit?: number;
    stepsLimit?: number;
    targetWeight?: number;
}

export const settingsService = {
    // Obtener configuración actual
    getSettings: async () => {
        const response = await api.get<Settings>('/settings');
        return response.data;
    },

    // Actualizar configuración
    update: async (data: UpdateSettingsDto) => {
        const response = await api.put<Settings>('/settings', data);
        return response.data;
    },
};