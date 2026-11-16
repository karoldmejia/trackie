import { StatCard } from '@/components/home/StatCard';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const programBg = require('@/assets/stats_bg.jpg');
const routinesBg = require('@/assets/stats_bg.jpg');

interface StatsOverviewProps {
    programScore?: number;
    programWeeksRemaining?: number;
    programTotalWeeks?: number;
    activeRoutinesCount?: number;
    workoutsThisWeek?: number;
    onProgramPress?: () => void;
    onRoutinesPress?: () => void;
    leftComponent?: React.ReactNode;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
    programScore = 0,
    programWeeksRemaining = 0,
    activeRoutinesCount = 0,
    workoutsThisWeek = 0,
    onProgramPress,
    onRoutinesPress,
    leftComponent,
}) => {
    const programSubtitle = (programScore === 0 && programWeeksRemaining === 0)
        ? 'Sin programa activo'
        : `${programWeeksRemaining} ${programWeeksRemaining === 1 ? 'semana restante' : 'semanas restantes'}`;

    const routinesSubtitle = activeRoutinesCount === 0
        ? 'Sin rutinas activas'
        : `${workoutsThisWeek} workout${workoutsThisWeek === 1 ? '' : 's'} esta semana`;

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
                        title="Programa"
                        value={Math.round(programScore)}
                        unit="puntos"
                        subtitle={programSubtitle}
                        backgroundImage={programBg}
                        onPress={onProgramPress}
                        headerIcon="Target"
                    />
                </View>
                <View style={styles.cardWrapper}>
                    <StatCard
                        title="Rutinas"
                        value={activeRoutinesCount}
                        unit="rutinas"
                        subtitle={routinesSubtitle}
                        backgroundImage={routinesBg}
                        onPress={onRoutinesPress}
                        headerIcon="Dumbbell"
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
        minHeight: 'auto',
    },
    rightContainer: {
        flex: 1,
        gap: 16,
    },
    cardWrapper: {
        width: '100%',
        height: 'auto'
    },
    emptySpace: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
