import AdherenceCalendar from '@/components/cutphase/AdherenceCalendar';
import CutPhaseDetailsHeader from '@/components/cutphase/CutPhaseDetailsHeader';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { cutPhaseService } from '@/services/cutPhaseService';
import { theme } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface DayData {
    date: string;
    weekNumber: number;
    dailyScore: number;
    allMet: boolean;
    caloriesMet: boolean;
    proteinMet: boolean;
    stepsMet: boolean;
    waterMet: boolean;
    workoutMet: boolean;
    calories: number;
    protein: number;
    steps: number;
    water: number;
    workout: string;
}

interface DashboardData {
    cutPhaseId: string;
    startDate: string;
    endDate: string;
    totalWeeks: number;
    currentWeek: number;
    targets: {
        calories: number;
        protein: number;
        steps: number;
        water: number;
        workoutsPerWeek: number;
    };
    summary: {
        totalDays: number;
        daysWithAllMet: number;
        compliancePercentage: number;
        averageScore: number;
    };
    measurements: {
        weight: { initial: number | null; current: number | null; difference: number | null };
        bodyfat: { initial: number | null; current: number | null; difference: number | null };
        waist: { initial: number | null; current: number | null; difference: number | null };
        hips: { initial: number | null; current: number | null; difference: number | null };
    };
    weeklySummary: any[];
    trends: any;
    days: DayData[];
}

const CutPhaseDetail: React.FC = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);

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
            const data = await cutPhaseService.getDashboard(id);
            setDashboard(data);
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
                            Detalle de etapa
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
                            Detalle de etapa
                        </ThemedText>
                    </View>
                    <View style={styles.placeholderButton} />
                </View>
                <View style={styles.errorContainer}>
                    <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                        No se encontró la etapa
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
                        Detalle de etapa
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
                <CutPhaseDetailsHeader
                    startDate={dashboard.startDate}
                    endDate={dashboard.endDate}
                    totalWeeks={dashboard.totalWeeks}
                    currentWeek={dashboard.currentWeek}
                    averageScore={dashboard.summary.averageScore}
                    targets={dashboard.targets}
                />
                <AdherenceCalendar
                    days={dashboard.days}
                    totalWeeks={dashboard.totalWeeks}
                />

                {/* Cumplimiento */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                            Cumplimiento
                        </ThemedText>
                    </View>
                    <View style={styles.complianceContainer}>
                        <View style={styles.complianceBigNumber}>
                            <ThemedText variant="bold" size={48} color={theme.colors.primary}>
                                {Math.round(dashboard.summary.compliancePercentage)}%
                            </ThemedText>
                        </View>
                        <View style={styles.complianceDetails}>
                            <View style={styles.complianceRow}>
                                <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                                    Días cumplidos:
                                </ThemedText>
                                <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                                    {dashboard.summary.daysWithAllMet} / {dashboard.summary.totalDays}
                                </ThemedText>
                            </View>
                            <View style={styles.complianceRow}>
                                <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                                    Score promedio:
                                </ThemedText>
                                <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                                    {dashboard.summary.averageScore}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Objetivos diarios */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                            Objetivos diarios
                        </ThemedText>
                    </View>
                    <View style={styles.targetsGrid}>
                        <View style={styles.targetItem}>
                            <Icon name="Flame" size={20} color={theme.colors.primary} backgroundColor="transparent" padding={0} />
                            <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                                {dashboard.targets.calories}
                            </ThemedText>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                kcal
                            </ThemedText>
                        </View>
                        <View style={styles.targetItem}>
                            <Icon name="Beef" size={20} color={theme.colors.primary} backgroundColor="transparent" padding={0} />
                            <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                                {dashboard.targets.protein}
                            </ThemedText>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                g
                            </ThemedText>
                        </View>
                        <View style={styles.targetItem}>
                            <Icon name="Footprints" size={20} color={theme.colors.primary} backgroundColor="transparent" padding={0} />
                            <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                                {dashboard.targets.steps}
                            </ThemedText>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                pasos
                            </ThemedText>
                        </View>
                        <View style={styles.targetItem}>
                            <Icon name="Droplet" size={20} color={theme.colors.primary} backgroundColor="transparent" padding={0} />
                            <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                                {dashboard.targets.water}
                            </ThemedText>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                L
                            </ThemedText>
                        </View>
                    </View>
                </View>

                {/* Mediciones */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                            Mediciones
                        </ThemedText>
                    </View>
                    <View style={styles.measurementsGrid}>
                        <View style={styles.measurementItem}>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                Peso
                            </ThemedText>
                            <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                                {dashboard.measurements.weight.current || '--'} kg
                            </ThemedText>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                Inicial: {dashboard.measurements.weight.initial || '--'} kg
                            </ThemedText>
                        </View>
                        <View style={styles.measurementItem}>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                Grasa corporal
                            </ThemedText>
                            <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                                {dashboard.measurements.bodyfat.current || '--'}%
                            </ThemedText>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                Inicial: {dashboard.measurements.bodyfat.initial || '--'}%
                            </ThemedText>
                        </View>
                        <View style={styles.measurementItem}>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                Cintura
                            </ThemedText>
                            <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                                {dashboard.measurements.waist.current || '--'} cm
                            </ThemedText>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                Inicial: {dashboard.measurements.waist.initial || '--'} cm
                            </ThemedText>
                        </View>
                        <View style={styles.measurementItem}>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                Cadera
                            </ThemedText>
                            <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                                {dashboard.measurements.hips.current || '--'} cm
                            </ThemedText>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                Inicial: {dashboard.measurements.hips.initial || '--'} cm
                            </ThemedText>
                        </View>
                    </View>
                </View>
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
});

export default CutPhaseDetail;