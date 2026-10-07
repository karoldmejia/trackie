import { WorkoutType } from '@/components/home/DailyLogForm';
import { CreateDailyLogDto, DailyLog, dailyLogService } from '@/services/dailyLogService';
import { useCallback, useState } from 'react';

interface UseDailyLogEditorOptions {
    onSaved?: (updated: CreateDailyLogDto) => void | Promise<void>;
}

export const useDailyLogEditor = ({ onSaved }: UseDailyLogEditorOptions = {}) => {
    const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
    const [visible, setVisible] = useState(false);

    const open = useCallback((log: DailyLog) => {
        setEditingLog(log);
        setVisible(true);
    }, []);

    const close = useCallback(() => {
        setVisible(false);
        setEditingLog(null);
    }, []);

    const submit = useCallback(
        async (data: {
            date: string;
            calories: string;
            steps: string;
            proteinGrams: string;
            waterLiters: string;
            workout: WorkoutType;
        }) => {
            const toInt = (v: string) => {
                const n = parseInt(v);
                return isNaN(n) ? 0 : n;
            };
            const toFloat = (v: string) => {
                const n = parseFloat(v);
                return isNaN(n) ? 0 : n;
            };

            const dto: CreateDailyLogDto = {
                date: data.date,
                calories: toInt(data.calories),
                steps: toInt(data.steps),
                proteinGrams: toFloat(data.proteinGrams),
                waterLiters: toFloat(data.waterLiters),
                workout: data.workout,
            };

            try {
                await dailyLogService.upsert(dto);
                await onSaved?.(dto);
                close();
            } catch (error) {
                console.error('Error updating daily log:', error);
            }
        },
        [onSaved, close],
    );

    const initialData = editingLog
        ? {
            date: editingLog.date,
            calories: editingLog.calories ?? 0,
            steps: editingLog.steps ?? 0,
            proteinGrams:editingLog.proteinGrams ?? 0,
            waterLiters: editingLog.waterLiters ?? 0,
            workout: editingLog.workout as WorkoutType,
        }
        : undefined;

    return { visible, editingLog, open, close, submit, initialData };
};