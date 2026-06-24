import { DailyLogCard } from '@/components/home/DailyLogCard';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { DailyLog, dailyLogService } from '@/services/dailyLogService';
import { theme } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const WeekDetailScreen: React.FC = () => {
    const router = useRouter();
    const { weekStart, weekEnd } = useLocalSearchParams<{ weekStart: string; weekEnd: string }>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [weekLogs, setWeekLogs] = useState<DailyLog[]>([]);
    const [allLogs, setAllLogs] = useState<DailyLog[]>([]);

    const handleGoBack = () => {
        router.back();
    };

    // Función para parsear fecha local (YYYY-MM-DD)
    const parseLocalDate = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
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

    const formatDisplayWeekRange = (start: string, end: string) => {
        const startDate = parseLocalDate(start);
        const endDate = parseLocalDate(end);
        const formatter = new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: 'long',
        });
        const year = startDate.getFullYear();
        const startStr = formatter.format(startDate);
        const endStr = formatter.format(endDate);
        return `${startStr} - ${endStr}, ${year}`;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const logs = await dailyLogService.getAll().catch(() => []);
            setAllLogs(logs);

            // Filtrar logs de la semana seleccionada
            const start = parseLocalDate(weekStart);
            const end = parseLocalDate(weekEnd);

            const filtered = logs.filter(log => {
                const logDate = parseLocalDate(log.date);
                return logDate >= start && logDate <= end;
            });

            // Ordenar de más reciente a más antiguo
            const sorted = filtered.sort((a, b) => 
                parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()
            );

            setWeekLogs(sorted);
        } catch (error) {
            console.error('Error fetching week logs:', error);
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
    }, [weekStart, weekEnd]);

    const handleLogPress = (log: DailyLog) => {
        // Aquí puedes abrir el formulario de edición si lo deseas
        // router.push(`/EditDailyLog?id=${log.id}`);
        console.log('Log presionado:', log);
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
                            Registros de la semana
                        </ThemedText>
                    </View>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
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
                        {formatDisplayWeekRange(weekStart, weekEnd)}
                    </ThemedText>
                </View>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {weekLogs.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon
                            name="Package"
                            size={48}
                            color={theme.colors.textLight}
                            backgroundColor="transparent"
                            padding={0}
                        />
                        <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                            No hay registros en esta semana
                        </ThemedText>
                    </View>
                ) : (
                    <View style={styles.logsContainer}>
                        <View style={styles.headerStats}>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                {weekLogs.length} registros encontrados
                            </ThemedText>
                        </View>
                        {weekLogs.map((log) => (
                            <DailyLogCard
                                key={log.id}
                                log={log}
                                onPress={() => handleLogPress(log)}
                            />
                        ))}
                    </View>
                )}
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
    placeholder: {
        width: 40,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    logsContainer: {
        marginTop: 16,
        marginBottom: 16,
    },
    headerStats: {
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
});

export default WeekDetailScreen;