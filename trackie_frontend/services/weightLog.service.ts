import api from './api';

export interface WeightLog {
    id: string;
    date: string;
    weight: number;
    bodyfat?: number;
    skeletalMuscle?: number;
    waist?: number;
    photos?: string[];
}

export interface CreateWeightLogDto {
    date: string;
    weight: number;
    bodyfat?: number;
    skeletalMuscle?: number;
    waist?: number;
    photos?: File[];
    photosToDelete?: string[];

}

export interface UpdateWeightLogDto {
    weight?: number;
    bodyfat?: number;
    skeletalMuscle?: number;
    waist?: number;
    photos?: File[];
    photosToDelete?: string[];
}

// Estadísticas de peso
export interface WeightStats {
    max: {
        weight: number;
        bodyfat: number;
        skeletalMuscle: number;
        waist: number;
        date: string;
    };
    min: {
        weight: number;
        bodyfat: number;
        skeletalMuscle: number;
        waist: number;
        date: string;
    };
    average: {
        weight: number;
        bodyfat: number;
        skeletalMuscle: number;
        waist: number;
    };
    total: {
        weight: number;
        bodyfat: number;
        skeletalMuscle: number;
        waist: number;
    };
    count: number;
    startDate: string;
    endDate: string;
}

export const weightLogService = {
    // Obtener todos los registros de peso
    getAll: async () => {
        const response = await api.get<WeightLog[]>('/weight-logs');
        return response.data;
    },

    // Obtener registros por rango de fechas
    getByDateRange: async (start: string, end: string) => {
        const response = await api.get<WeightLog[]>('/weight-logs/range', {
            params: { start, end }
        });
        return response.data;
    },

    // Obtener registro por fecha específica
    getByDate: async (date: string) => {
        const response = await api.get<WeightLog | null>(`/weight-logs/date/${date}`);
        return response.data;
    },

    // Obtener el último registro de peso
    getLast: async () => {
        const response = await api.get<WeightLog | null>('/weight-logs/last');
        return response.data;
    },

    // Obtener estadísticas (máximo, mínimo, promedio)
    getStats: async (start: string, end: string) => {
        const response = await api.get<WeightStats>('/weight-logs/stats', {
            params: { start, end }
        });
        return response.data;
    },

    // Crear o actualizar por fecha (upsert)
    upsert: async (data: CreateWeightLogDto) => {
        const formData = new FormData();

        formData.append('date', data.date);
        formData.append('weight', data.weight.toString());

        if (data.bodyfat !== undefined && data.bodyfat !== null && !isNaN(data.bodyfat) && data.bodyfat > 0) {
            formData.append('bodyfat', data.bodyfat.toString());
        }

        if (data.skeletalMuscle !== undefined && data.skeletalMuscle !== null && !isNaN(data.skeletalMuscle) && data.skeletalMuscle > 0) {
            formData.append('skeletalMuscle', data.skeletalMuscle.toString());
        }

        if (data.waist !== undefined && data.waist !== null && !isNaN(data.waist) && data.waist > 0) {
            formData.append('waist', data.waist.toString());
        }

        if (data.photos && data.photos.length > 0) {
            data.photos.forEach(photo => {
                formData.append('photos', photo);
            });
        }

        if (data.photosToDelete && data.photosToDelete.length > 0) {
            formData.append('photosToDelete', JSON.stringify(data.photosToDelete));
        }

        const response = await api.put<WeightLog>('/weight-logs/date', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Crear nuevo registro de peso con fotos
    create: async (data: CreateWeightLogDto) => {
        const formData = new FormData();

        formData.append('date', data.date);
        formData.append('weight', data.weight.toString());

        if (data.bodyfat !== undefined) {
            formData.append('bodyfat', data.bodyfat.toString());
        }

        if (data.skeletalMuscle !== undefined) {
            formData.append('skeletalMuscle', data.skeletalMuscle.toString());
        }

        if (data.waist !== undefined) {  // 🆕
            formData.append('waist', data.waist.toString());
        }

        if (data.photos && data.photos.length > 0) {
            data.photos.forEach(photo => {
                formData.append('photos', photo);
            });
        }

        const response = await api.post<WeightLog>('/weight-logs', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    // Actualizar registro de peso por ID
    update: async (id: string, data: UpdateWeightLogDto) => {
        const formData = new FormData();

        if (data.weight !== undefined) {
            formData.append('weight', data.weight.toString());
        }

        if (data.bodyfat !== undefined) {
            formData.append('bodyfat', data.bodyfat.toString());
        }

        if (data.skeletalMuscle !== undefined) {
            formData.append('skeletalMuscle', data.skeletalMuscle.toString());
        }

        if (data.waist !== undefined) {  // 🆕
            formData.append('waist', data.waist.toString());
        }

        if (data.photos && data.photos.length > 0) {
            data.photos.forEach(photo => {
                formData.append('photos', photo);
            });
        }

        if (data.photosToDelete && data.photosToDelete.length > 0) {
            formData.append('photosToDelete', JSON.stringify(data.photosToDelete));
        }

        const response = await api.put<WeightLog>(`/weight-logs/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    // Eliminar registro de peso por ID
    delete: async (id: string) => {
        const response = await api.delete<{ deleted: boolean }>(`/weight-logs/${id}`);
        return response.data;
    },

    // Eliminar registro por fecha
    deleteByDate: async (date: string) => {
        const response = await api.delete<{ deleted: boolean }>(`/weight-logs/date/${date}`);
        return response.data;
    },
};