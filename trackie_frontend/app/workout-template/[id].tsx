import { SwipeableCard } from '@/components/common/SwipeableCard';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { BlockFormModal } from '@/components/workout/BlockFormModal';
import { workoutService, WorkoutBlockTemplate, WorkoutTemplate } from '@/services/workoutService';
import { theme } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

const KIND_LABELS: Record<string, string> = {
    warmup: 'Warmup',
    interval: 'Interval',
    strength: 'Strength',
    cooldown: 'Cooldown',
    other: 'Otro',
};

const plannedSummary = (block: WorkoutBlockTemplate): string => {
    const roundsLabel = block.rounds === 1 ? '1 ronda' : `${block.rounds} rondas`;
    switch (block.metricType) {
        case 'distance':
            return `${roundsLabel} × ${block.targetDistanceMeters ?? 0} km`;
        case 'duration':
            return `${roundsLabel} × ${block.targetDurationSeconds ?? 0} min`;
        case 'reps':
            return `${roundsLabel} × ${block.targetReps ?? 0} reps`;
        default:
            return roundsLabel;
    }
};

const WorkoutTemplateDetailScreen: React.FC = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [blockModalVisible, setBlockModalVisible] = useState(false);
    const [blockModalMode, setBlockModalMode] = useState<'create' | 'edit'>('create');
    const [editingBlock, setEditingBlock] = useState<WorkoutBlockTemplate | null>(null);
    const [reordering, setReordering] = useState(false);

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            setNotFound(false);
            const data = await workoutService.getTemplate(id);
            setTemplate({
                ...data,
                blockTemplates: [...(data.blockTemplates ?? [])].sort((a, b) => a.order - b.order),
            });
        } catch (error) {
            console.error('Error fetching workout template:', error);
            setNotFound(true);
            setTemplate(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenCreate = () => {
        setBlockModalMode('create');
        setEditingBlock(null);
        setBlockModalVisible(true);
    };

    const handleOpenEdit = (block: WorkoutBlockTemplate) => {
        setBlockModalMode('edit');
        setEditingBlock(block);
        setBlockModalVisible(true);
    };

    const handleDelete = (block: WorkoutBlockTemplate) => {
        Alert.alert(
            'Borrar bloque',
            `Se borrará el bloque "${block.name}". Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Borrar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await workoutService.deleteBlockTemplate(block.id);
                            await fetchData();
                        } catch (error: any) {
                            const backendMessage = error?.response?.data?.message;
                            const text = Array.isArray(backendMessage) ? backendMessage.join('\n') : backendMessage;
                            Alert.alert('No se pudo borrar', text ?? 'Error desconocido. Intenta de nuevo.');
                        }
                    },
                },
            ],
        );
    };

    // Reordenar bloques intercambiando `order` con el vecino (optimistic update)
    const handleMoveBlock = async (block: WorkoutBlockTemplate, direction: 'up' | 'down') => {
        if (!template || reordering) return;
        const ordered = [...(template.blockTemplates ?? [])].sort((a, b) => a.order - b.order);
        const index = ordered.findIndex(b => b.id === block.id);
        const neighborIndex = direction === 'up' ? index - 1 : index + 1;
        if (index < 0 || neighborIndex < 0 || neighborIndex >= ordered.length) return;

        const neighbor = ordered[neighborIndex];
        const hasDuplicateOrders = new Set(ordered.map(b => b.order)).size !== ordered.length;

        // Si hay orders duplicados, normalizar primero (1..N en el orden actual)
        const base = hasDuplicateOrders
            ? ordered.map((b, i) => ({ ...b, order: i + 1 }))
            : ordered;
        const currentNorm = base[index];
        const neighborNorm = base[neighborIndex];

        const swapped = base.map(b =>
            b.id === currentNorm.id ? { ...b, order: neighborNorm.order }
            : b.id === neighborNorm.id ? { ...b, order: currentNorm.order }
            : b,
        );

        const previousTemplate = template;
        setTemplate({ ...template, blockTemplates: swapped.sort((a, b) => a.order - b.order) });
        setReordering(true);

        // Solo persistir los bloques afectados (si se normalizó, todos)
        const toPersist = hasDuplicateOrders
            ? swapped
            : swapped.filter(b => b.id === currentNorm.id || b.id === neighborNorm.id);

        try {
            await Promise.all(toPersist.map(b => workoutService.updateBlockTemplate(b.id, { order: b.order })));
        } catch (error: any) {
            // Revertir cambio local si falla la persistencia
            setTemplate(previousTemplate);
            const backendMessage = error?.response?.data?.message;
            const text = Array.isArray(backendMessage) ? backendMessage.join('\n') : backendMessage;
            Alert.alert('No se pudo reordenar', text ?? 'Error desconocido. Intenta de nuevo.');
        } finally {
            setReordering(false);
        }
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
                            Workout
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

    if (notFound || !template) {
        return (
            <View style={styles.container}>
                <View style={styles.navbar}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <ThemedText variant="medium" size={14} color={theme.colors.text}>
                            Workout
                        </ThemedText>
                    </View>
                    <View style={styles.rightPlaceholder} />
                </View>
                <View style={styles.errorContainer}>
                    <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                        No se encontró el workout
                    </ThemedText>
                </View>
            </View>
        );
    }

    const blocks = [...(template.blockTemplates ?? [])].sort((a, b) => a.order - b.order);

    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <ThemedText variant="medium" size={14} color={theme.colors.text}>
                        {template.name}
                    </ThemedText>
                    <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                        {template.type}
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
                {blocks.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon
                            name="Package"
                            size={48}
                            color={theme.colors.textLight}
                            backgroundColor="transparent"
                            padding={0}
                        />
                        <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                            No hay bloques en este workout aún
                        </ThemedText>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {blocks.map((block) => (
                            <SwipeableCard
                                key={block.id}
                                onEdit={() => handleOpenEdit(block)}
                                onDelete={() => handleDelete(block)}
                            >
                            <View style={styles.card}>
                                <View style={styles.cardTop}>
                                    <View style={styles.cardInfo}>
                                        <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                                            {block.name}
                                        </ThemedText>
                                        <View style={styles.metaRow}>
                                            <View style={styles.kindBadge}>
                                                <ThemedText variant="medium" size={10} color={theme.colors.textLight}>
                                                    {KIND_LABELS[block.kind] ?? block.kind}
                                                </ThemedText>
                                            </View>
                                            <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                                {plannedSummary(block)}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    <View style={styles.cardActions}>
                                        <TouchableOpacity
                                            onPress={() => handleMoveBlock(block, 'up')}
                                            style={styles.iconButton}
                                            activeOpacity={0.7}
                                            disabled={reordering || blocks.findIndex(b => b.id === block.id) === 0}
                                            accessibilityRole="button"
                                            accessibilityLabel="Subir bloque"
                                        >
                                            <Icon
                                                name="ChevronUp"
                                                size={18}
                                                color={reordering || blocks.findIndex(b => b.id === block.id) === 0 ? theme.colors.placeholder : theme.colors.text}
                                                backgroundColor="transparent"
                                                padding={0}
                                            />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleMoveBlock(block, 'down')}
                                            style={styles.iconButton}
                                            activeOpacity={0.7}
                                            disabled={reordering || blocks.findIndex(b => b.id === block.id) === blocks.length - 1}
                                            accessibilityRole="button"
                                            accessibilityLabel="Bajar bloque"
                                        >
                                            <Icon
                                                name="ChevronDown"
                                                size={18}
                                                color={reordering || blocks.findIndex(b => b.id === block.id) === blocks.length - 1 ? theme.colors.placeholder : theme.colors.text}
                                                backgroundColor="transparent"
                                                padding={0}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                            </SwipeableCard>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB: crear bloque */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleOpenCreate}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Crear bloque"
            >
                <Icon name="Plus" size={24} color={theme.colors.white} backgroundColor="transparent" padding={0} />
            </TouchableOpacity>

            <BlockFormModal
                visible={blockModalVisible}
                onClose={() => setBlockModalVisible(false)}
                onSaved={fetchData}
                workoutId={id}
                mode={blockModalMode}
                initialData={editingBlock}
            />
        </View>
    );
};

export default WorkoutTemplateDetailScreen;

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
    errorContainer: {
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
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        elevation: 2,
        shadowColor: 'transparent',
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    cardInfo: {
        flex: 1,
        gap: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    kindBadge: {
        backgroundColor: theme.colors.background,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
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
