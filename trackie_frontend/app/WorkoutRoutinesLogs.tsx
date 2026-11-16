import { SwipeableCard } from '@/components/common/SwipeableCard';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { RoutineFormModal } from '@/components/workout/RoutineFormModal';
import { workoutService, WorkoutRoutine } from '@/services/workoutService';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
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

const WorkoutRoutinesLogs: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
    const [workoutCounts, setWorkoutCounts] = useState<Record<string, number>>({});
    const [routineModalVisible, setRoutineModalVisible] = useState(false);
    const [routineModalMode, setRoutineModalMode] = useState<'create' | 'edit'>('create');
    const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await workoutService.listRoutines();
            setRoutines(data);

            // El listado no trae templates; pedimos el conteo por rutina.
            const counts = await Promise.all(
                data.map(async (routine) => {
                    try {
                        const templates = await workoutService.listTemplates(routine.id);
                        return [routine.id, templates.length] as const;
                    } catch {
                        return [routine.id, 0] as const;
                    }
                }),
            );
            setWorkoutCounts(Object.fromEntries(counts));
        } catch (error) {
            console.error('Error fetching routines:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRoutinePress = (routineId: string) => {
        router.push(`/workout-routine/${routineId}`);
    };

    const handleOpenCreate = () => {
        setRoutineModalMode('create');
        setEditingRoutine(null);
        setRoutineModalVisible(true);
    };

    const handleOpenEdit = (routine: WorkoutRoutine) => {
        setRoutineModalMode('edit');
        setEditingRoutine(routine);
        setRoutineModalVisible(true);
    };

    const handleDelete = (routine: WorkoutRoutine) => {
        Alert.alert(
            'Borrar rutina',
            `Se borrarán la rutina "${routine.name}" y sus workouts/bloques. Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Borrar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await workoutService.deleteRoutine(routine.id);
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
                            Rutinas
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
                        Rutinas
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
                {routines.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon
                            name="Package"
                            size={48}
                            color={theme.colors.textLight}
                            backgroundColor="transparent"
                            padding={0}
                        />
                        <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                            No hay rutinas creadas aún
                        </ThemedText>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {routines.map((routine) => (
                            <SwipeableCard
                                key={routine.id}
                                onEdit={() => handleOpenEdit(routine)}
                                onDelete={() => handleDelete(routine)}
                            >
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => handleRoutinePress(routine.id)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardTop}>
                                    <View style={styles.cardInfo}>
                                        <ThemedText variant="semiBold" size={15} color={theme.colors.text}>
                                            {routine.name}
                                        </ThemedText>
                                        <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                            {workoutCounts[routine.id] ?? 0} workout{(workoutCounts[routine.id] ?? 0) === 1 ? '' : 's'}
                                        </ThemedText>
                                    </View>
                                    <View style={styles.cardActions}>
                                        {!routine.isActive && (
                                            <View style={styles.inactiveBadge}>
                                                <ThemedText variant="medium" size={10} color={theme.colors.white}>
                                                    Inactiva
                                                </ThemedText>
                                            </View>
                                        )}
                                        <Icon name="ChevronRight" size={18} color={theme.colors.textLight} backgroundColor="transparent" padding={0} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                            </SwipeableCard>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB: crear rutina */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleOpenCreate}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Crear rutina"
            >
                <Icon name="Plus" size={24} color={theme.colors.white} backgroundColor="transparent" padding={0} />
            </TouchableOpacity>

            <RoutineFormModal
                visible={routineModalVisible}
                onClose={() => setRoutineModalVisible(false)}
                onSaved={fetchData}
                mode={routineModalMode}
                initialData={editingRoutine}
            />
        </View>
    );
};

export default WorkoutRoutinesLogs;

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
        gap: 2,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    inactiveBadge: {
        backgroundColor: theme.colors.placeholder,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 3,
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
