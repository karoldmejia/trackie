import AdherenceCalendar from '@/components/program/AdherenceCalendar';
import ProgramDetailsHeader from '@/components/program/ProgramDetailsHeader';
import MeasurementsTable from '@/components/program/MeasurementsTable';
import MetricSquare from '@/components/program/MetricSquare';
import WeeklyAveragesCarousel from '@/components/program/WeeklyAveragesCarousel';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { ProgramDashboard, Streaks, programService } from '@/services/programService';
import { workoutService, WorkoutRoutine } from '@/services/workoutService';
import { theme } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const ProgramDetail: React.FC = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboard, setDashboard] = useState<ProgramDashboard | null>(null);
    const [streaks, setStreaks] = useState<Streaks | null>(null);
    const [programRoutines, setProgramRoutines] = useState<Array<{ routine: WorkoutRoutine; workoutCount: number }>>([]);

    const handleGoBack = () => {
        router.back();
    };

    const formatDisplayDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        const formatter = new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        return formatter.format(localDate);
    };

    const fetchData = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const [data, streaksData] = await Promise.all([
                programService.getDashboard(id),
                programService.getStreaks(id)
            ]);

            setDashboard(data);
            setStreaks(streaksData);

            // Rutinas asignadas al programa (listado anidado con su rutina)
            try {
                const assigned = await programService.listRoutines(id);
                const enriched = await Promise.all(
                    assigned.map(async (a) => {
                        const fallback: WorkoutRoutine = {
                            id: a.routineId,
                            name: a.routine?.name ?? a.routineId,
                            isActive: a.routine?.isActive ?? true,
                            createdAt: a.routine?.createdAt ?? '',
                            updatedAt: a.routine?.updatedAt ?? '',
                        };
                        try {
                            const templates = await workoutService.listTemplates(a.routineId);
                            return { routine: a.routine ?? fallback, workoutCount: templates.length };
                        } catch {
                            return { routine: a.routine ?? fallback, workoutCount: 0 };
                        }
                    }),
                );
                setProgramRoutines(enriched);
            } catch (error) {
                console.error('Error fetching program routines:', error);
                setProgramRoutines([]);
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };


    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.navbar}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <ThemedText variant="medium" size={14} color={theme.colors.text}>
                            Detalle de programa
                        </ThemedText>
                    </View>
                    <View style={styles.placeholderButton} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    if (!dashboard) {
        return (
            <View style={styles.container}>
                <View style={styles.navbar}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <ThemedText variant="medium" size={14} color={theme.colors.text}>
                            Detalle de programa
                        </ThemedText>
                    </View>
                    <View style={styles.placeholderButton} />
                </View>
                <View style={styles.errorContainer}>
                    <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                        No se encontró el programa
                    </ThemedText>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <ThemedText variant="medium" size={14} color={theme.colors.text}>
                        Detalle de programa
                    </ThemedText>
                </View>
                <View style={styles.placeholderButton} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Información general */}
                <ProgramDetailsHeader
                    startDate={dashboard.program.startDate}
                    endDate={dashboard.program.endDate}
                    totalWeeks={dashboard.program.totalWeeks}
                    currentWeek={dashboard.program.currentWeek}
                    averageScore={dashboard.summary.averageScore}
                    targets={dashboard.targets}
                />
                <AdherenceCalendar
                    days={dashboard.days}
                    totalWeeks={dashboard.program.totalWeeks}
                />
                <View style={styles.metricsRow}>
                    <MetricSquare
                        label="Balance calórico acumulado"
                        mainValue={`${(dashboard.caloriesCarryover?.runningBalance ?? 0) > 0 ? '+' : ''}${dashboard.caloriesCarryover?.runningBalance ?? 0} kcal`}
                        style={styles.leftMetric}
                    />
                    <MetricSquare
                        label="Pasos necesarios para meta"
                        mainValue={`${dashboard.stepsCarryover?.averageNeeded ?? 0}`}
                        subValue={`x${dashboard.stepsCarryover?.daysRemaining ?? 0} días`}
                        style={styles.rightMetric}
                    />
                </View>
                <WeeklyAveragesCarousel
                    weeklyAverages={dashboard.weeklyAverages || []}
                    currentWeek={dashboard.program.currentWeek}
                    totalWeeks={dashboard.program.totalWeeks}
                />
                {/* Rutinas del programa */}
                <View style={styles.routinesSection}>
                    <ThemedText variant="medium" size={11} color={theme.colors.textLight} style={styles.routinesTitle}>
                        RUTINAS DEL PROGRAMA
                    </ThemedText>
                    {programRoutines.length === 0 ? (
                        <View style={styles.card}>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight} style={styles.routineEmpty}>
                                Este programa no tiene rutinas asignadas
                            </ThemedText>
                        </View>
                    ) : (
                        programRoutines.map(({ routine, workoutCount }) => (
                            <View key={routine.id} style={styles.card}>
                                <View style={styles.routineRow}>
                                    <View style={styles.routineInfo}>
                                        <ThemedText variant="semiBold" size={13} color={theme.colors.text}>
                                            {routine.name}
                                        </ThemedText>
                                        <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                            {workoutCount} workout{workoutCount === 1 ? '' : 's'}
                                        </ThemedText>
                                    </View>
                                    <Icon name="Dumbbell" size={18} color={theme.colors.placeholder} backgroundColor="transparent" padding={0} />
                                </View>
                            </View>
                        ))
                    )}
                </View>
                {/* 

                {streaks && (
                    <StreakCard
                        currentStreak={dashboard.streaks?.currentStreak || 0}
                        bestStreak={dashboard.streaks?.bestStreak || 0}
                        lastFailedDate={dashboard.streaks?.lastFailedDate || null}
                        days={dashboard.days || []}
                    />
                )}
*/}
                <MeasurementsTable measurements={dashboard.measurements} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 70,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    placeholderButton: {
        width: 40,
        height: 40,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: 'transparent',
    },
    cardHeader: {
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    complianceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    complianceBigNumber: {
        flex: 1,
    },
    complianceDetails: {
        flex: 1,
        gap: 4,
    },
    complianceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    targetsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    targetItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        flex: 1,
        minWidth: '45%',
    },
    measurementsGrid: {
        gap: 12,
    },
    measurementItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.secondary,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    routinesSection: {
        marginBottom: 12,
    },
    routinesTitle: {
        marginBottom: 8,
        letterSpacing: 1,
    },
    routineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    routineInfo: {
        flex: 1,
        gap: 2,
    },
    routineEmpty: {
        textAlign: 'center',
    },
    leftMetric: {
        flex: 1,
    },
    rightMetric: {
        flex: 1,
    },
});

export default ProgramDetail;