import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { WeightLogCard } from '@/components/weight/WeightLogCard';
import { WeightLog, weightLogService } from '@/services/weightLog.service';
import { theme } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const MonthDetailScreen: React.FC = () => {
    const router = useRouter();
    const { monthStart, monthEnd } = useLocalSearchParams<{ monthStart: string; monthEnd: string }>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [monthLogs, setMonthLogs] = useState<WeightLog[]>([]);
    const [allLogs, setAllLogs] = useState<WeightLog[]>([]);

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

        const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const dia = String(localDate.getDate()).padStart(2, '0');
        const mes = meses[localDate.getMonth()];
        const año = localDate.getFullYear();

        return `${dia} ${mes} ${año}`;
    };

    const formatDisplayMonth = (dateString: string) => {
        const [year, month] = dateString.split('-').map(Number);
        const localDate = new Date(year, month - 1, 1);
        const formatter = new Intl.DateTimeFormat('es-CO', {
            month: 'long',
            year: 'numeric'
        });
        return formatter.format(localDate);
    };

    const getMonthStartDate = (date: Date): Date => {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        return monthStart;
    };

    const getMonthEndDate = (date: Date): Date => {
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return monthEnd;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const logs = await weightLogService.getAll().catch(() => []);
            setAllLogs(logs);

            // Filtrar logs del mes seleccionado
            const start = parseLocalDate(monthStart);
            const end = parseLocalDate(monthEnd);

            const filtered = logs.filter(log => {
                const logDate = parseLocalDate(log.date);
                return logDate >= start && logDate <= end;
            });

            // Ordenar de más reciente a más antiguo
            const sorted = filtered.sort((a, b) =>
                parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()
            );

            setMonthLogs(sorted);
        } catch (error) {
            console.error('Error fetching month logs:', error);
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
    }, [monthStart, monthEnd]);

    const handleLogPress = (log: WeightLog) => {
        // Aquí puedes abrir el formulario de edición si lo deseas
        // router.push(`/EditWeightLog?id=${log.id}`);
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
                            Registros del mes
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
                        {formatDisplayMonth(monthStart)}
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
                {monthLogs.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon
                            name="Package"
                            size={48}
                            color={theme.colors.textLight}
                            backgroundColor="transparent"
                            padding={0}
                        />
                        <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                            No hay registros en este mes
                        </ThemedText>
                    </View>
                ) : (
                    <View style={styles.logsContainer}>
                        <View style={styles.headerStats}>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                {monthLogs.length} registros encontrados
                            </ThemedText>
                        </View>
                        {monthLogs.map((log) => (
                            <WeightLogCard
                                key={log.id}
                                log={log}
                                onPress={() => handleLogPress(log)}
                                formatDisplayDate={formatDisplayDate}
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

export default MonthDetailScreen;