import { LineChartComponent, TimeRange } from '@/components/charts/LineChartComponent';
import { AnalysisCard } from '@/components/home/AnalysisCard';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { WeightLog, weightLogService, WeightStats } from '@/services/weightLog.service';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

interface MetricOverviewScreenProps {
    metricKey: 'weight' | 'waist' | 'bodyfat' | 'skeletalMuscle';
    title: string;
    unit: string;
    iconColor: string;
    iconName: string;
}

export const MetricOverviewScreen: React.FC<MetricOverviewScreenProps> = ({
    metricKey,
    title,
    unit,
    iconColor,
    iconName,
}) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<{ value: number; label: string; date: Date }[]>([]);
    const [timeRange, setTimeRange] = useState<TimeRange>('week');
    const [allLogs, setAllLogs] = useState<WeightLog[]>([]);
    const [currentOffset, setCurrentOffset] = useState(0);
    const [currentPeriodText, setCurrentPeriodText] = useState('');
    const [canGoPrev, setCanGoPrev] = useState(true);
    const [canGoNext, setCanGoNext] = useState(true);
    const [stats, setStats] = useState<WeightStats | null>(null);

    const handleGoBack = () => {
        router.back();
    };

    const getCurrentLocalDate = (): Date => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    };

    const parseLocalDate = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const logs = await weightLogService.getAll();
            setAllLogs(logs);
            processChartData(logs, timeRange, currentOffset);
            await fetchStats(logs, timeRange, currentOffset);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (logs: WeightLog[], range: TimeRange, offset: number) => {
        if (!logs.length) return;

        const { start, end } = getDateRange(range, offset);
        const startStr = formatLocalDate(start);
        const endStr = formatLocalDate(end);

        try {
            const statsData = await weightLogService.getStats(startStr, endStr);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const getDateRange = (range: TimeRange, offset: number) => {
        const now = getCurrentLocalDate();
        let start: Date;
        let end: Date;
        let periodText = '';

        if (range === 'week') {
            const dayOfWeek = now.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            start = new Date(now);
            start.setDate(now.getDate() - daysToMonday + (offset * 7));
            start.setHours(0, 0, 0, 0);

            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);

            const formatDate = (date: Date) => {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                return `${day}/${month}`;
            };
            periodText = `${formatDate(start)} - ${formatDate(end)}`;
        } else if (range === 'month') {
            const targetMonth = now.getMonth() + offset;
            const targetYear = now.getFullYear();

            start = new Date(targetYear, targetMonth, 1);
            start.setHours(0, 0, 0, 0);

            end = new Date(targetYear, targetMonth + 1, 0);
            end.setHours(23, 59, 59, 999);

            const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            periodText = `${monthNames[targetMonth]} ${targetYear}`;
        } else {
            const targetYear = now.getFullYear() + offset;

            start = new Date(targetYear, 0, 1);
            start.setHours(0, 0, 0, 0);

            end = new Date(targetYear, 11, 31);
            end.setHours(23, 59, 59, 999);

            periodText = targetYear.toString();
        }

        return { start, end, periodText };
    };

    const processChartData = (logs: WeightLog[], range: TimeRange, offset: number) => {
        const { start, end, periodText } = getDateRange(range, offset);
        setCurrentPeriodText(periodText);

        const now = getCurrentLocalDate();

        if (range === 'week') {
            const nextWeekStart = new Date(start);
            nextWeekStart.setDate(start.getDate() + 7);
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
            let value = 0;
            switch (metricKey) {
                case 'weight': value = log.weight; break;
                case 'waist': value = log.waist || 0; break;
                case 'bodyfat': value = log.bodyfat || 0; break;
                case 'skeletalMuscle': value = log.skeletalMuscle || 0; break;
            }
            return {
                value: value,
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
        fetchStats(allLogs, range, offset);
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        const newOffset = direction === 'prev' ? currentOffset - 1 : currentOffset + 1;
        setCurrentOffset(newOffset);
        processChartData(allLogs, timeRange, newOffset);
        fetchStats(allLogs, timeRange, newOffset);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Obtener valores mínimo y máximo
    const getMinValue = (): number => {
        if (!stats) return 0;
        switch (metricKey) {
            case 'weight': return stats.min.weight;
            case 'waist': return stats.min.waist;
            case 'bodyfat': return stats.min.bodyfat;
            case 'skeletalMuscle': return stats.min.skeletalMuscle;
            default: return 0;
        }
    };

    const getMaxValue = (): number => {
        if (!stats) return 0;
        switch (metricKey) {
            case 'weight': return stats.max.weight;
            case 'waist': return stats.max.waist;
            case 'bodyfat': return stats.max.bodyfat;
            case 'skeletalMuscle': return stats.max.skeletalMuscle;
            default: return 0;
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.navbar}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <ThemedText variant="medium" size={14} color={theme.colors.text}>
                            Overview de {title.toLowerCase()}
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

    const minValue = getMinValue();
    const maxValue = getMaxValue();

    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <ThemedText variant="medium" size={14} color={theme.colors.text}>
                        Overview de {title.toLowerCase()}
                    </ThemedText>
                </View>
                <View style={styles.rightPlaceholder} />
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.chartWrapper}>
                    <LineChartComponent
                        data={chartData}
                        unit={unit}
                        color={iconColor}
                        timeRange={timeRange}
                        onTimeRangeChange={handleTimeRangeChange}
                        onNavigate={handleNavigate}
                        currentPeriodText={currentPeriodText}
                        canGoPrev={canGoPrev}
                        canGoNext={canGoNext}
                    />
                </View>

                <View style={styles.stackedContainer}>
                    {/* Mínimo */}
                    <View style={styles.cardWrapper}>
                        <AnalysisCard
                            icon="TrendingDown"
                            title="MÍNIMO"
                            value={`${minValue} ${unit}`}
                            iconColor={theme.colors.white}
                            backgroundColor={theme.colors.white}
                        />
                    </View>
                    {/* Máximo */}
                    <View style={styles.cardWrapper}>
                        <AnalysisCard
                            icon="TrendingUp"
                            title="MÁXIMO"
                            value={`${maxValue} ${unit}`}
                            iconColor={theme.colors.white}
                            backgroundColor={theme.colors.white}
                        />
                    </View>
                </View>
            </View>
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
    rightPlaceholder: {
        width: 40,
    },
    contentContainer: {
        flex: 1,
    },
    chartWrapper: {
        marginBottom: -10,
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