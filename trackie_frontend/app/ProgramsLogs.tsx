// app/programs-logs.tsx
import { Icon } from '@/components/icon';
import ProgramCard from '@/components/program/ProgramCard';
import ProgramForm, { ProgramFormInitialData } from '@/components/program/ProgramForm';
import { ThemedText } from '@/components/ThemedText';
import { CreateProgramDto, Program, programService } from '@/services/programService';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

interface ProgramWithData extends Program {
    averageScore: number;
    weightDifference?: number | null;
    waistDifference?: number | null;
    hipsDifference?: number | null;
}

const ProgramsLogs: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [phases, setPhases] = useState<ProgramWithData[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
    const [editInitialData, setEditInitialData] = useState<ProgramFormInitialData | null>(null);

    const handleGoBack = () => {
        router.back();
    };

    const handlePhasePress = (phaseId: string) => {
        router.push(`/program/${phaseId}`);
    };

    const handleOpenCreate = () => {
        setFormMode('create');
        setEditingProgramId(null);
        setEditInitialData(null);
        setFormVisible(true);
    };

    const handleEditPress = async (phase: ProgramWithData) => {
        try {
            // El listado no trae targets; el dashboard sí.
            const dashboard = await programService.getDashboard(phase.id);
            setEditingProgramId(phase.id);
            setEditInitialData({
                id: phase.id,
                name: phase.name,
                kind: phase.kind,
                startDate: phase.startDate,
                endDate: phase.endDate,
                totalWeeks: phase.totalWeeks,
                workoutsPerWeek: phase.workoutsPerWeek,
                isActive: phase.isActive,
                targets: dashboard.targets ?? [],
            });
            setFormMode('edit');
            setFormVisible(true);
        } catch (error) {
            if (__DEV__) {
                console.error('Error fetching program for edit:', error);
            }
            Alert.alert('No se pudo cargar el programa', 'Intenta de nuevo.');
        }
    };

    const handleFormSubmit = async (data: CreateProgramDto): Promise<Program | void> => {
        try {
            setIsCreating(true);
            let saved: Program | void;
            if (editingProgramId) {
                saved = await programService.update(editingProgramId, {
                    name: data.name,
                    kind: data.kind,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    workoutsPerWeek: data.workoutsPerWeek,
                    isActive: data.isActive,
                    targets: data.targets,
                });
            } else {
                saved = await programService.create(data);
            }
            await fetchData();
            return saved;
        } catch (error: any) {
            const backendMessage = error?.response?.data?.message;
            const message = Array.isArray(backendMessage)
                ? backendMessage.join('\n')
                : backendMessage ?? 'No se pudo guardar el programa. Intenta de nuevo.';
            Alert.alert('No se pudo guardar el programa', message);
            if (__DEV__) {
                console.error('Backend error:', error?.response?.data);
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleCloseForm = () => {
        setFormVisible(false);
        setFormMode('create');
        setEditingProgramId(null);
        setEditInitialData(null);
    };

        const fetchData = async () => {
            try {
                setLoading(true);
                const allPhases = await programService.findAll();

                // Obtener dashboard para cada fase
                const phasesWithData = await Promise.all(
                    allPhases.map(async (phase) => {
                        try {
                            const dashboard = await programService.getDashboard(phase.id);
                            return {
                                ...phase,
                                averageScore: dashboard.summary?.averageScore || 0,
                                weightDifference: dashboard.measurements?.weight?.difference || null,
                                waistDifference: dashboard.measurements?.waist?.difference || null,
                                hipsDifference: dashboard.measurements?.hips?.difference || null,
                            };
                        } catch (error) {
                            console.error(`Error fetching dashboard for program ${phase.id}:`, error);
                            return {
                                ...phase,
                                averageScore: 0,
                                weightDifference: null,
                                waistDifference: null,
                                hipsDifference: null,
                            };
                        }
                    })
                );

                // Ordenar: activas primero, luego por fecha de creación
                const sortedPhases = phasesWithData.sort((a, b) => {
                    if (a.isActive && !b.isActive) return -1;
                    if (!a.isActive && b.isActive) return 1;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });

                setPhases(sortedPhases);
            } catch (error) {
                console.error('Error fetching programs:', error);
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
                                Mis programas
                            </ThemedText>
                        </View>
                        <TouchableOpacity
                            onPress={handleOpenCreate}
                            style={styles.addButton}
                        >
                            <Icon
                                name="Plus"
                                size={18}
                                color={theme.colors.white}
                                backgroundColor={theme.colors.primary}
                                padding={4}
                                borderRadius={16}
                            />
                        </TouchableOpacity>
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
                            Mis programas
                        </ThemedText>
                    </View>
                    <TouchableOpacity
                        onPress={handleOpenCreate}
                        style={styles.addButton}
                    >
                        <Icon
                            name="Plus"
                            size={18}
                            color={theme.colors.white}
                            backgroundColor={theme.colors.primary}
                            padding={4}
                            borderRadius={16}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <View style={styles.phasesContainer}>
                        {phases.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Icon
                                    name="Package"
                                    size={48}
                                    color={theme.colors.textLight}
                                    backgroundColor="transparent"
                                    padding={0}
                                />
                                <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                                    No hay programas aún
                                </ThemedText>
                            </View>
                        ) : (
                            phases.map((phase) => (
                                <ProgramCard
                                    key={phase.id}
                                    program={{
                                        id: phase.id,
                                        name: phase.name,
                                        kind: phase.kind,
                                        startDate: phase.startDate,
                                        endDate: phase.endDate,
                                        totalWeeks: phase.totalWeeks,
                                        isActive: phase.isActive,
                                        averageScore: phase.averageScore,
                                        weightDifference: phase.weightDifference,
                                        waistDifference: phase.waistDifference,
                                        hipsDifference: phase.hipsDifference,
                                    }}
                                    onPress={() => handlePhasePress(phase.id)}
                                    onEditPress={() => handleEditPress(phase)}
                                />
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Modal del formulario */}
                <ProgramForm
                    visible={formVisible}
                    onClose={handleCloseForm}
                    onSubmit={handleFormSubmit}
                    mode={formMode}
                    initialData={editInitialData}
                />
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
        addButton: {
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingBottom: 100,
        },
        phasesContainer: {
            marginTop: 16,
            marginBottom: 16,
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
            gap: 12,
        },
        createButton: {
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            marginTop: 8,
        },
    });

    export default ProgramsLogs;