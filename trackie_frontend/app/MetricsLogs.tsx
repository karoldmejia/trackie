import { SwipeableCard } from '@/components/common/SwipeableCard';
import { CreateMetricModal } from '@/components/home/CreateMetricModal';
import { EditMetricModal } from '@/components/metric/EditMetricModal';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { MetricTypeItem, metricService } from '@/services/metricService';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

const MetricsLogs: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [metrics, setMetrics] = useState<MetricTypeItem[]>([]);
    const [createVisible, setCreateVisible] = useState(false);
    const [editingMetric, setEditingMetric] = useState<MetricTypeItem | null>(null);
    const [editVisible, setEditVisible] = useState(false);

    const fetchMetrics = useCallback(async () => {
        try {
            // La API solo devuelve activas (ver controlador GET /metrics),
            // pero pedimos derivadas e inactivas por si el backend cambia.
            const data = await metricService.listMetricTypes({ includeDerived: true, active: false });
            setMetrics(data);
        } catch (error) {
            console.error('Error fetching metrics:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMetrics();
        setRefreshing(false);
    }, [fetchMetrics]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const handleEditPress = (metric: MetricTypeItem) => {
        setEditingMetric(metric);
        setEditVisible(true);
    };

    const handleGoBack = () => {
        router.back();
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
                            Métricas
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

    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <ThemedText variant="medium" size={14} color={theme.colors.text}>
                        Métricas
                    </ThemedText>
                </View>
                <View style={styles.rightPlaceholder} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {metrics.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon
                            name="Package"
                            size={48}
                            color={theme.colors.textLight}
                            backgroundColor="transparent"
                            padding={0}
                        />
                        <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                            No hay métricas creadas aún
                        </ThemedText>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {metrics.map((metric) => (
                            <SwipeableCard
                                key={metric.id}
                                onEdit={() => handleEditPress(metric)}
                            >
                            <View style={styles.metricCard}>
                                <View style={styles.metricInfo}>
                                    <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                                        {metric.label}
                                    </ThemedText>
                                    <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                        {metric.key}{metric.unit ? ` · ${metric.unit}` : ''}
                                    </ThemedText>
                                </View>
                                <View style={styles.badgesRow}>
                                    {metric.isUniversal && (
                                        <View style={[styles.badge, styles.badgeUniversal]}>
                                            <ThemedText variant="medium" size={10} color={theme.colors.white}>
                                                Universal
                                            </ThemedText>
                                        </View>
                                    )}
                                    {metric.isDerived && (
                                        <View style={[styles.badge, styles.badgeDerived]}>
                                            <ThemedText variant="medium" size={10} color={theme.colors.textLight}>
                                                Derivada
                                            </ThemedText>
                                        </View>
                                    )}
                                    {!metric.isActive && (
                                        <View style={[styles.badge, styles.badgeInactive]}>
                                            <ThemedText variant="medium" size={10} color={theme.colors.white}>
                                                Inactiva
                                            </ThemedText>
                                        </View>
                                    )}
                                </View>
                            </View>
                            </SwipeableCard>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB: crear métrica */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setCreateVisible(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Crear métrica"
            >
                <Icon name="Plus" size={24} color={theme.colors.white} backgroundColor="transparent" padding={0} />
            </TouchableOpacity>

            <CreateMetricModal
                visible={createVisible}
                onClose={() => setCreateVisible(false)}
                onCreated={fetchMetrics}
            />

            <EditMetricModal
                visible={editVisible}
                metric={editingMetric}
                onClose={() => {
                    setEditVisible(false);
                    setEditingMetric(null);
                }}
                onSaved={fetchMetrics}
            />
        </View>
    );
};

export default MetricsLogs;

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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    listContainer: {
        marginTop: 16,
        marginBottom: 16,
    },
    metricCard: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        elevation: 2,
        shadowColor: 'transparent',
    },
    metricInfo: {
        flex: 1,
        gap: 2,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 8,
    },
    badge: {
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    badgeUniversal: {
        backgroundColor: theme.colors.primary,
    },
    badgeDerived: {
        backgroundColor: theme.colors.background,
    },
    badgeInactive: {
        backgroundColor: theme.colors.placeholder,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: 'transparent',
    },
});
