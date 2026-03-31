import { WeightLog } from '@/services/weightLog.service';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WeightMetricCard } from './WeightMetricCard';

interface WeightMetricsGridProps {
    latestLog: WeightLog | null;
    onMetricPress?: (metric: string) => void;
}

export const WeightMetricsGrid: React.FC<WeightMetricsGridProps> = ({
    latestLog,
    onMetricPress,
}) => {
    const router = useRouter();

    const handleMetricPress = (metric: string) => {
        switch (metric) {
            case 'weight':
                router.push('/WeightOverviewScreen');
                break;
            case 'waist':
                router.push('/WaistOverviewScreen');
                break;
            case 'bodyfat':
                router.push('/BodyfatOverviewScreen');
                break;
            case 'skeletalMuscle':
                router.push('/SkeletalMuscleOverviewScreen');
                break;
        }
        onMetricPress?.(metric);
    };

    const metrics = [
        {
            key: 'weight',
            title: 'Peso',
            value: latestLog?.weight || 0,
            unit: 'kg',
            iconName: 'Weight' as const,
        },
        {
            key: 'waist',
            title: 'Cintura',
            value: latestLog?.waist || 0,
            unit: 'cm',
            iconName: 'Ruler' as const,
        },
        {
            key: 'bodyfat',
            title: 'Body Fat',
            value: latestLog?.bodyfat || 0,
            unit: '%',
            iconName: 'Activity' as const,
        },
        {
            key: 'skeletalMuscle',
            title: 'Músculo',
            value: latestLog?.skeletalMuscle || 0,
            unit: '%',
            iconName: 'BicepsFlexed' as const,
        },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <View style={styles.col}>
                    <WeightMetricCard
                        title={metrics[0].title}
                        value={metrics[0].value}
                        unit={metrics[0].unit}
                        iconName={metrics[0].iconName}
                        onPress={() => handleMetricPress(metrics[0].key)}
                    />
                </View>
                <View style={styles.col}>
                    <WeightMetricCard
                        title={metrics[1].title}
                        value={metrics[1].value}
                        unit={metrics[1].unit}
                        iconName={metrics[1].iconName}
                        onPress={() => handleMetricPress(metrics[1].key)}
                    />
                </View>
            </View>
            <View style={styles.row}>
                <View style={styles.col}>
                    <WeightMetricCard
                        title={metrics[2].title}
                        value={metrics[2].value}
                        unit={metrics[2].unit}
                        iconName={metrics[2].iconName}
                        onPress={() => handleMetricPress(metrics[2].key)}
                    />
                </View>
                <View style={styles.col}>
                    <WeightMetricCard
                        title={metrics[3].title}
                        value={metrics[3].value}
                        unit={metrics[3].unit}
                        iconName={metrics[3].iconName}
                        onPress={() => handleMetricPress(metrics[3].key)}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    col: {
        flex: 1,
    },
});