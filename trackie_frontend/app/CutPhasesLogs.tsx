// app/cut-phases-logs.tsx
import CutPhaseCard from '@/components/cutphase/CutPhaseCard';
import CutPhaseForm from '@/components/cutphase/CutPhaseForm';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { CreateCutPhaseDto, CutPhase, cutPhaseService } from '@/services/cutPhaseService';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

interface PhaseWithData extends CutPhase {
    compliancePercentage: number;
    weightDifference?: number | null;
    waistDifference?: number | null;
    hipsDifference?: number | null;
}

const CutPhasesLogs: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [phases, setPhases] = useState<PhaseWithData[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const handleGoBack = () => {
        router.back();
    };

    const handlePhasePress = (phaseId: string) => {
        // TODO: Navegar a la pantalla de detalle de la fase
        // router.push(`/cut-phase/${phaseId}`);
        console.log('Fase seleccionada:', phaseId);
    };

    const handleCreatePhase = async (data: CreateCutPhaseDto) => {
        try {
            setIsCreating(true);
            await cutPhaseService.create(data);
            await fetchData();
        } catch (error) {
            console.error('Error creating cut phase:', error);
            throw error;
        } finally {
            setIsCreating(false);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const allPhases = await cutPhaseService.findAll();

            // Obtener dashboard para cada fase
            const phasesWithData = await Promise.all(
                allPhases.map(async (phase) => {
                    try {
                        const dashboard = await cutPhaseService.getDashboard(phase.id);
                        return {
                            ...phase,
                            compliancePercentage: dashboard.summary?.compliancePercentage || 0,
                            weightDifference: dashboard.measurements?.weight?.difference || null,
                            waistDifference: dashboard.measurements?.waist?.difference || null,
                            hipsDifference: dashboard.measurements?.hips?.difference || null,
                        };
                    } catch (error) {
                        console.error(`Error fetching dashboard for phase ${phase.id}:`, error);
                        return {
                            ...phase,
                            compliancePercentage: 0,
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
            console.error('Error fetching cut phases:', error);
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
                            Mis etapas de déficit
                        </ThemedText>
                    </View>
                    <TouchableOpacity
                        onPress={() => setFormVisible(true)}
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
                        Mis etapas de déficit
                    </ThemedText>
                </View>
                <TouchableOpacity
                    onPress={() => setFormVisible(true)}
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
                                No hay etapas de déficit aún
                            </ThemedText>
                        </View>
                    ) : (
                        phases.map((phase) => (
                            <CutPhaseCard
                                key={phase.id}
                                phase={{
                                    id: phase.id,
                                    startDate: phase.startDate,
                                    endDate: phase.endDate,
                                    totalWeeks: phase.totalWeeks,
                                    isActive: phase.isActive,
                                    compliancePercentage: phase.compliancePercentage,
                                    weightDifference: phase.weightDifference,
                                    waistDifference: phase.waistDifference,
                                    hipsDifference: phase.hipsDifference,
                                }}
                                onPress={() => handlePhasePress(phase.id)}
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Modal del formulario */}
            <CutPhaseForm
                visible={formVisible}
                onClose={() => {
                    setFormVisible(false);
                }}
                onSubmit={handleCreatePhase}
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

export default CutPhasesLogs;