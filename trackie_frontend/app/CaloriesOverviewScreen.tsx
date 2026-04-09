import { LineChartComponent, TimeRange } from '@/components/charts/LineChartComponent';
import { AnalysisCard } from '@/components/home/AnalysisCard';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { DailyLog, dailyLogService, FullStatsResult } from '@/services/dailyLogService';
import { Settings, settingsService } from '@/services/settingsService';
import { theme } from '@/theme';
import { formatLocalDate, getMonthEndDate, getMonthStartDate, getWeekEndDate, getWeekStartDate, getYearEndDate, getYearStartDate, parseLocalDate } from '@/utils/dateHelpers';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const CaloriesOverviewScreen: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<{ value: number; label: string; date: Date }[]>([]);
    const [timeRange, setTimeRange] = useState<TimeRange>('week');
    const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
    const [currentOffset, setCurrentOffset] = useState(0);
    const [currentPeriodText, setCurrentPeriodText] = useState('');
    const [canGoPrev, setCanGoPrev] = useState(true);
    const [canGoNext, setCanGoNext] = useState(true);
    const [stats, setStats] = useState<FullStatsResult | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);

    const handleGoBack = () => {
        router.back();
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [logs, settingsData] = await Promise.all([
                dailyLogService.getAll(),
                settingsService.getSettings()
            ]);
            setAllLogs(logs);
            setSettings(settingsData);
            processChartData(logs, timeRange, currentOffset);
            await fetchStats(logs, timeRange, currentOffset, settingsData);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (logs: DailyLog[], range: TimeRange, offset: number, settingsData: Settings) => {
        if (!logs.length || !settingsData) return;

        const { start, end } = getDateRange(range, offset);
        const startStr = formatLocalDate(start);
        const endStr = formatLocalDate(end);

        try {
            const statsData = await dailyLogService.getFullStats({
                start: startStr,
                end: endStr,
                calorieLimit: settingsData.calorieLimit,
                stepGoal: settingsData.stepsLimit,
            });
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const getDateRange = (range: TimeRange, offset: number) => {
        const now = new Date();
        let start: Date;
        let end: Date;
        let periodText = '';
        const weekStartDay = settings?.weekStartDay ?? 1; // Usar el valor de settings

        if (range === 'week') {
            // Usar la fecha base con offset
            const baseDate = new Date(now);
            baseDate.setDate(now.getDate() + (offset * 7));
            
            start = getWeekStartDate(baseDate, weekStartDay);
            end = getWeekEndDate(start);

            const formatDate = (date: Date) => {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                return `${day}/${month}`;
            };
            periodText = `${formatDate(start)} - ${formatDate(end)}`;
        } else if (range === 'month') {
            const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
            start = getMonthStartDate(targetDate);
            end = getMonthEndDate(targetDate);
            
            const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            periodText = `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
        } else {
            const targetYear = now.getFullYear() + offset;
            start = getYearStartDate(new Date(targetYear, 0, 1));
            end = getYearEndDate(new Date(targetYear, 0, 1));
            periodText = targetYear.toString();
        }

        return { start, end, periodText };
    };

    const processChartData = (logs: DailyLog[], range: TimeRange, offset: number) => {
        const { start, end, periodText } = getDateRange(range, offset);
        setCurrentPeriodText(periodText);

        const now = new Date();

        if (range === 'week') {
            const nextWeekStart = getWeekStartDate(new Date(start), settings?.weekStartDay ?? 1);
            nextWeekStart.setDate(nextWeekStart.getDate() + 7);
            setCanGoNext(nextWeekStart <= now);
        } else if (range === 'month') {
            const nextMonthStart = new Date(start);
            nextMonthStart.setMonth(start.getMonth() + 1);
            setCanGoNext(nextMonthStart <= now);
        } else {
            const nextYear = start.getFullYear() + 1;
            setCanGoNext(nextYear <= now.getFullYear());
        }

        setCanGoPrev(true);

        const filteredLogs = logs.filter(log => {
            const logDate = parseLocalDate(log.date);
            return logDate >= start && logDate <= end;
        });

        const sortedLogs = [...filteredLogs].sort((a, b) => {
            const dateA = parseLocalDate(a.date);
            const dateB = parseLocalDate(b.date);
            return dateA.getTime() - dateB.getTime();
        });

        const data = sortedLogs.map(log => {
            const logDate = parseLocalDate(log.date);
            return {
                value: log.calories,
                label: `${logDate.getDate()}/${logDate.getMonth() + 1}`,
                date: logDate,
            };
        });

        setChartData(data);
    };

    const handleTimeRangeChange = (range: TimeRange, offset: number) => {
        setTimeRange(range);
        setCurrentOffset(offset);
        processChartData(allLogs, range, offset);
        if (settings) {
            fetchStats(allLogs, range, offset, settings);
        }
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        const newOffset = direction === 'prev' ? currentOffset - 1 : currentOffset + 1;
        setCurrentOffset(newOffset);
        processChartData(allLogs, timeRange, newOffset);
        if (settings) {
            fetchStats(allLogs, timeRange, newOffset, settings);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.navbar}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <ThemedText variant="medium" size={14} color={theme.colors.text}>
                            Overview de calorías
                        </ThemedText>
                    </View>
                    <View style={styles.rightPlaceholder} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    const averageCalories = stats?.summary.averageCalories || 0;
    const goodDays = stats?.goodBadStats.goodDays || 0;
    const badDays = stats?.goodBadStats.badDays || 0;

    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <ThemedText variant="medium" size={14} color={theme.colors.text}>
                        Overview de calorías
                    </ThemedText>
                </View>
                <View style={styles.rightPlaceholder} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.chartWrapper}>
                    <LineChartComponent
                        data={chartData}
                        unit=""
                        color={theme.colors.primary}
                        timeRange={timeRange}
                        onTimeRangeChange={handleTimeRangeChange}
                        onNavigate={handleNavigate}
                        currentPeriodText={currentPeriodText}
                        canGoPrev={canGoPrev}
                        canGoNext={canGoNext}
                    />
                </View>

                <View style={styles.stackedContainer}>
                    <View style={styles.cardWrapper}>
                        <AnalysisCard
                            icon="Flame"
                            title="PROMEDIO"
                            value={`${Math.round(averageCalories)} kcal`}
                            iconColor={theme.colors.white}
                            backgroundColor={theme.colors.white}
                        />
                    </View>
                    <View style={styles.cardWrapper}>
                        <AnalysisCard
                            icon="Smile"
                            title="BUENOS DÍAS"
                            value={`${goodDays} días`}
                            backgroundColor={theme.colors.white}
                        />
                    </View>
                    <View style={styles.cardWrapper}>
                        <AnalysisCard
                            icon="Frown"
                            title="MALOS DÍAS"
                            value={`${badDays} días`}
                            backgroundColor={theme.colors.white}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default CaloriesOverviewScreen;

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
    rightPlaceholder: {
        width: 40,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    chartWrapper: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stackedContainer: {
        gap: 4,
        padding: 16,
    },
    cardWrapper: {
        width: '100%',
    },
});