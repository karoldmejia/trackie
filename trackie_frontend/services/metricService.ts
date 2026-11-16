import api from './api';
import { FormMetric } from './dailyLogService';

// El backend devuelve `type` (no `valueType`) en GET/POST /metrics.
// Normalizamos siempre a `valueType` para el front.
// Item del catálogo tal como lo devuelve GET /metrics (incluye id e isActive).
export interface MetricTypeItem extends FormMetric {
    id: string;
    isActive: boolean;
    isDerived: boolean;
}

const normalizeItem = (m: any): MetricTypeItem => ({ ...m, valueType: m.valueType ?? m.type });

const normalize = (m: any): FormMetric => ({
    ...m,
    valueType: m.valueType ?? m.type,
});

export interface CreateMetricTypeDto {
    key: string;
    label: string;
    valueType: 'boolean' | 'number' | 'duration';
    unit?: string;
    isUniversal?: boolean;
}

export interface UpdateMetricTypeDto {
    label?: string;
    unit?: string;
    isUniversal?: boolean;
    isActive?: boolean;
}

export const metricService = {
    createMetricType: async (dto: CreateMetricTypeDto): Promise<FormMetric> => {
        const response = await api.post<any>('/metrics', dto);
        return normalize(response.data);
    },

    listMetricTypes: async (params?: { active?: boolean; includeDerived?: boolean }): Promise<MetricTypeItem[]> => {
        const response = await api.get<any[]>('/metrics', { params });
        return response.data.map(normalizeItem);
    },

    updateMetricType: async (id: string, dto: UpdateMetricTypeDto): Promise<MetricTypeItem> => {
        const response = await api.patch<any>(`/metrics/${id}`, dto);
        return normalizeItem(response.data);
    },

    // Soft delete: el backend marca isActive = false
    deactivateMetricType: async (id: string): Promise<void> => {
        await api.delete(`/metrics/${id}`);
    },
};
