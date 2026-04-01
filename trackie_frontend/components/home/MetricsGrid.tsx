import { DailyLog } from '@/services/dailyLogService';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MetricCard } from './MetricCard';

interface MetricsGridProps {
    dailyLog: DailyLog | null;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ dailyLog }) => {
    const metrics = [
        { title: 'Calorías', value: dailyLog?.calories ?? 0, unit: '' },
        { title: 'Pasos', value: dailyLog?.steps ?? 0, unit: '' },
        { title: 'Energ.', value: dailyLog?.energyDrinks ?? 0, unit: '' },
        { title: 'Agua', value: dailyLog?.waterLiters ?? 0, unit: 'L' },
    ];

    return (
        <View style={styles.gridContainer}>
            {metrics.map((metric, index) => (
                <MetricCard
                    key={index}
                    title={metric.title}
                    value={metric.value}
                    unit={metric.unit}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
    },
});