import { StatCard } from '@/components/home/StatCard';
import { DailyLog } from '@/services/dailyLogService';
import { Settings } from '@/services/settingsService';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const caloriesBg = require('@/assets/stats_bg.jpg');
const stepsBg = require('@/assets/stats_bg.jpg');

interface StatsOverviewProps {
    dailyLog: DailyLog | null;
    settings: Settings | null;
    onCaloriesPress?: () => void;
    onStepsPress?: () => void;
    leftComponent?: React.ReactNode;
    caloriesHeaderIcon?: string;
    stepsHeaderIcon?: string;
    caloriesHeaderIconColor?: string;
    stepsHeaderIconColor?: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
    dailyLog,
    settings,
    onCaloriesPress,
    onStepsPress,
    leftComponent,
    caloriesHeaderIcon = 'Flame', // Icono por defecto para calorías
    stepsHeaderIcon = 'Footprints', // Icono por defecto para pasos
    caloriesHeaderIconColor,
    stepsHeaderIconColor,
}) => {
    return (
        <View style={styles.container}>
            {/* Lado izquierdo - componente opcional */}
            <View style={styles.leftContainer}>
                {leftComponent || <View style={styles.emptySpace} />}
            </View>

            {/* Lado derecho - tarjetas */}
            <View style={styles.rightContainer}>
                <View style={styles.cardWrapper}>
                    <StatCard
                        title="Calorías"
                        value={dailyLog?.calories || 0}
                        unit="kcal"
                        limit={settings?.calorieLimit}
                        currentValue={dailyLog?.calories}
                        type="calories"
                        backgroundImage={caloriesBg}
                        onPress={onCaloriesPress}
                        headerIcon={caloriesHeaderIcon as any}
                        headerIconColor={caloriesHeaderIconColor}
                    />
                </View>
                <View style={styles.cardWrapper}>
                    <StatCard
                        title="Pasos"
                        value={dailyLog?.steps || 0}
                        unit="pasos"
                        limit={settings?.stepsLimit}
                        currentValue={dailyLog?.steps}
                        type="steps"
                        backgroundImage={stepsBg}
                        onPress={onStepsPress}
                        headerIcon={stepsHeaderIcon as any}
                        headerIconColor={stepsHeaderIconColor}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 16,
    },
    leftContainer: {
        flex: 1,
        minHeight: 200,
    },
    rightContainer: {
        flex: 1,
        gap: 16,
    },
    cardWrapper: {
        width: '100%',
    },
    emptySpace: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});