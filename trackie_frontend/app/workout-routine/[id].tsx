import { SwipeableCard } from '@/components/common/SwipeableCard';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { WorkoutFormModal } from '@/components/workout/WorkoutFormModal';
import { workoutService, WorkoutRoutine, WorkoutTemplate } from '@/services/workoutService';
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

const RoutineDetailScreen: React.FC = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [routine, setRoutine] = useState<WorkoutRoutine | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
    const [workoutModalMode, setWorkoutModalMode] = useState<'create' | 'edit'>('create');
    const [editingWorkout, setEditingWorkout] = useState<WorkoutTemplate | null>(null);

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            setNotFound(false);
            const data = await workoutService.getRoutine(id);
            setRoutine({
                ...data,
                templates: [...(data.templates ?? [])].sort((a, b) => a.order - b.order),
            });
        } catch (error) {
            console.error('Error fetching routine:', error);
            setNotFound(true);
            setRoutine(null);
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
        setWorkoutModalMode('create');
        setEditingWorkout(null);
        setWorkoutModalVisible(true);
    };

    const handleOpenEdit = (workout: WorkoutTemplate) => {
        setWorkoutModalMode('edit');
        setEditingWorkout(workout);
        setWorkoutModalVisible(true);
    };

    const handleDelete = (workout: WorkoutTemplate) => {
        Alert.alert(
            'Borrar workout',
            `Se borrará el workout "${workout.name}" y sus bloques. Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Borrar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await workoutService.deleteTemplate(workout.id);
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

    const handleWorkoutPress = (workout: WorkoutTemplate) => {
        router.push(`/workout-template/${workout.id}`);
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
                            Rutina
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

    if (notFound || !routine) {
        return (
            <View style={styles.container}>
                <View style={styles.navbar}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <ThemedText variant="medium" size={14} color={theme.colors.text}>
                            Rutina
                        </ThemedText>
                    </View>
                    <View style={styles.rightPlaceholder} />
                </View>
                <View style={styles.errorContainer}>
                    <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                        No se encontró la rutina
                    </ThemedText>
                </View>
            </View>
        );
    }

    const templates = routine.templates ?? [];

    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <ThemedText variant="medium" size={14} color={theme.colors.text}>
                        {routine.name}
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
                {templates.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon
                            name="Package"
                            size={48}
                            color={theme.colors.textLight}
                            backgroundColor="transparent"
                            padding={0}
                        />
                        <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                            No hay workouts en esta rutina aún
                        </ThemedText>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {templates.map((workout) => (
                            <SwipeableCard
                                key={workout.id}
                                onEdit={() => handleOpenEdit(workout)}
                                onDelete={() => handleDelete(workout)}
                            >
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => handleWorkoutPress(workout)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardInfo}>
                                    <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                                        {workout.name}
                                    </ThemedText>
                                    <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                        {workout.type}
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                            </SwipeableCard>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB: crear workout */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleOpenCreate}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Crear workout"
            >
                <Icon name="Plus" size={24} color={theme.colors.white} backgroundColor="transparent" padding={0} />
            </TouchableOpacity>

            <WorkoutFormModal
                visible={workoutModalVisible}
                onClose={() => setWorkoutModalVisible(false)}
                onSaved={fetchData}
                mode={workoutModalMode}
                routineId={id}
                initialData={editingWorkout}
            />
        </View>
    );
};

export default RoutineDetailScreen;

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
    cardInfo: {
        flex: 1,
        gap: 2,
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
