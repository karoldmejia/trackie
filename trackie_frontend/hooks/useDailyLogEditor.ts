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
            metrics: Record<string, number>;
        }) => {
            const dto: CreateDailyLogDto = {
                date: data.date,
                metrics: data.metrics,
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

    const initialData = editingLog ?? undefined;

    return { visible, editingLog, open, close, submit, initialData };
};
