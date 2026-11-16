import { FormInput } from '@/components/FormInput';
import { FormSelect } from '@/components/FormSelect';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { CreateProgramDto, DEFAULT_TARGET_CONFIG, DEFAULT_TARGET_FALLBACK, Program, ProgramKind, ProgramMetricTargetInput, programService, ProgramRoutine } from '@/services/programService';
import { MetricTypeItem, metricService } from '@/services/metricService';
import { workoutService, WorkoutRoutine } from '@/services/workoutService';
import { theme } from '@/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useKeyboard } from '@react-native-community/hooks';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

export interface ProgramFormInitialData {
    id?: string;
    name?: string;
    kind?: ProgramKind;
    startDate?: string;
    endDate?: string;
    totalWeeks?: number;
    workoutsPerWeek?: number;
    isActive?: boolean;
    targets?: ProgramMetricTargetInput[];
}

interface ProgramFormProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: CreateProgramDto) => Promise<Program | void>;
    mode?: 'create' | 'edit';
    initialData?: ProgramFormInitialData | null;
}

const DIRECTION_OPTIONS = [
    { label: 'Máximo', value: 'at_most' },
    { label: 'Mínimo', value: 'at_least' },
    { label: 'Exacto', value: 'exact' },
];

type ProgramTargetFormRow = ProgramMetricTargetInput & { enabled: boolean };

const TARGET_ICONS: Record<string, string> = {
    calories: 'Flame',
    protein: 'Beef',
    steps: 'Footprints',
    water: 'Droplet',
    workout_count: 'Dumbbell',
};

const KIND_OPTIONS = [
    { label: 'Definición', value: 'cut' },
    { label: 'Volumen', value: 'bulk' },
    { label: 'Mantenimiento', value: 'maintain' },
];

const CUT_DURATION_OPTIONS = [
    { label: '4 semanas', value: '4' },
    { label: '6 semanas', value: '6' },
    { label: '8 semanas', value: '8' },
    { label: '10 semanas', value: '10' },
    { label: '12 semanas', value: '12' },
    { label: '14 semanas', value: '14' },
    { label: '16 semanas', value: '16' },
    { label: '18 semanas', value: '18' },
    { label: '20 semanas', value: '20' },
    { label: '22 semanas', value: '22' },
    { label: '24 semanas', value: '24' },

];

const WORKOUTS_PER_WEEK_OPTIONS = [
    { label: '4 días', value: '4' },
    { label: '5 días', value: '5' },
    { label: '6 días', value: '6' },
    { label: '7 días', value: '7' },
];

export const ProgramForm: React.FC<ProgramFormProps> = ({
    visible,
    onClose,
    onSubmit,
    mode = 'create',
    initialData = null,
}) => {
    const [name, setName] = useState('');
    const [kind, setKind] = useState<ProgramKind>('cut');
    const [startDate, setStartDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [durationWeeks, setDurationWeeks] = useState('8');
    const [workoutsPerWeek, setWorkoutsPerWeek] = useState('4');
    const [isActive, setIsActive] = useState(true);
    // Estado local de targets: `enabled` solo controla filas (no se envía al backend)
    const [targets, setTargets] = useState<ProgramTargetFormRow[]>([]);
    const [availableMetrics, setAvailableMetrics] = useState<MetricTypeItem[]>([]);
    const [loadingMetrics, setLoadingMetrics] = useState(false);
    const [metricsError, setMetricsError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Rutinas disponibles y seleccionadas para el programa
    const [availableRoutines, setAvailableRoutines] = useState<WorkoutRoutine[]>([]);
    const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([]);
    const [initialRoutineIds, setInitialRoutineIds] = useState<string[]>([]);
    const [loadingRoutines, setLoadingRoutines] = useState(false);
    const [routinesError, setRoutinesError] = useState<string | null>(null);

    const slideAnim = useRef(new Animated.Value(0)).current;
    const screenHeight = Dimensions.get('window').height;
    const { keyboardHeight, keyboardShown } = useKeyboard();

    useEffect(() => {
        if (visible) {
            // Resetear formulario (o precargar en modo edición)
            if (mode === 'edit' && initialData) {
                setStartDate(initialData.startDate ? parseLocalDateStr(initialData.startDate) : new Date());
                setName(initialData.name ?? '');
                setKind(initialData.kind ?? 'cut');
                setDurationWeeks(String(initialData.totalWeeks ?? 8));
                setWorkoutsPerWeek(String(initialData.workoutsPerWeek ?? '4'));
                setIsActive(initialData.isActive ?? true);
            } else {
                setStartDate(new Date());
                setName('');
                setKind('cut');
                setDurationWeeks('8');
                setWorkoutsPerWeek('4');
                setIsActive(true);
            }
            setTargets([]);
            setIsSubmitting(false);

            // Cargar el catálogo de métricas (activas, sin derivadas:
            // las derivadas las calcula el backend, no se miden)
            setLoadingMetrics(true);
            setMetricsError(false);
            metricService.listMetricTypes({ active: true, includeDerived: false })
                .then((metrics) => {
                    const editable = metrics.filter(m => !m.isDerived);
                    const initialTargets = (mode === 'edit' && initialData?.targets) ? initialData.targets : [];
                    // Cargar rutinas disponibles y (en edición) las asignadas al programa
                    setLoadingRoutines(true);
                    setRoutinesError(null);
                    Promise.all([
                        workoutService.listRoutines(),
                        (mode === 'edit' && initialData?.id) ? programService.listRoutines(initialData.id) : Promise.resolve([] as ProgramRoutine[]),
                    ])
                        .then(([available, assigned]) => {
                            setAvailableRoutines(available);
                            const assignedIds = assigned.map(a => a.routineId);
                            setSelectedRoutineIds(assignedIds);
                            setInitialRoutineIds(assignedIds);
                        })
                        .catch((error) => {
                            console.error('Error loading routines:', error);
                            setAvailableRoutines([]);
                            setSelectedRoutineIds([]);
                            setInitialRoutineIds([]);
                            setRoutinesError('No se pudieron cargar las rutinas');
                        })
                        .finally(() => {
                            setLoadingRoutines(false);
                        });
                    const initialByKey = new Map(initialTargets.map(t => [t.key, t]));
                    const known = new Set(editable.map(m => m.key));

                    const rows: ProgramTargetFormRow[] = editable.map((m) => {
                        const initial = initialByKey.get(m.key);
                        const cfg = DEFAULT_TARGET_CONFIG[m.key] ?? DEFAULT_TARGET_FALLBACK;
                        return {
                            key: m.key,
                            target: initial?.target ?? cfg.target,
                            direction: initial?.direction ?? cfg.direction,
                            weight: initial?.weight ?? cfg.weight,
                            isOptional: initial?.isOptional ?? false,
                            // En edición: activos los targets del programa. En creación: las 5 universales.
                            enabled: mode === 'edit' ? !!initial : m.key in DEFAULT_TARGET_CONFIG,
                        };
                    });

                    // Targets del programa que ya no están en el catálogo activo (p.ej. métrica
                    // desactivada): se conservan como filas para no perderlos al guardar (replace-all).
                    const pseudoMetrics: MetricTypeItem[] = [];
                    for (const t of initialTargets) {
                        if (known.has(t.key)) continue;
                        pseudoMetrics.push({
                            id: t.key,
                            key: t.key,
                            label: t.key,
                            valueType: 'number',
                            isUniversal: false,
                            isDerived: false,
                            isActive: true,
                        });
                        rows.push({
                            key: t.key,
                            target: t.target,
                            direction: t.direction,
                            weight: t.weight,
                            isOptional: t.isOptional ?? false,
                            enabled: true,
                        });
                    }

                    setAvailableMetrics([...editable, ...pseudoMetrics]);
                    setTargets(rows);
                })
                .catch((error) => {
                    console.error('Error loading metric types:', error);
                    setAvailableMetrics([]);
                    setMetricsError(true);
                })
                .finally(() => {
                    setLoadingMetrics(false);
                });

            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                damping: 20,
                stiffness: 300,
            }).start();
        } else {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 300,
            }).start();
        }
    }, [visible]);

    const parseLocalDateStr = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const calculateEndDate = (start: Date, weeks: number) => {
        const end = new Date(start);
        end.setDate(end.getDate() + (weeks * 7) - 1);
        return end;
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowStartDatePicker(false);
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    const setTargetEnabled = (index: number, enabled: boolean) => {
        setTargets(prev => prev.map((t, i) => (i === index ? { ...t, enabled } : t)));
    };

    // Campos numéricos: NaN representa "vacío" y se traduce a 0 al enviar
    const setTargetNumber = (index: number, field: 'target' | 'weight', text: string) => {
        const parsed = parseFloat(text);
        setTargets(prev => prev.map((t, i) => (i === index ? { ...t, [field]: isNaN(parsed) ? NaN : parsed } : t)));
    };

    const setTargetDirection = (index: number, direction: string) => {
        setTargets(prev => prev.map((t, i) => (i === index ? { ...t, direction: direction as ProgramMetricTargetInput['direction'] } : t)));
    };

    const toggleRoutine = (routineId: string) => {
        setSelectedRoutineIds(prev =>
            prev.includes(routineId) ? prev.filter(r => r !== routineId) : [...prev, routineId]);
    };

    const handleSubmit = async () => {
        // Validaciones
        const weeks = parseInt(durationWeeks);
        const workouts = parseInt(workoutsPerWeek);

        if (!name.trim()) {
            alert('Por favor ingresa un nombre para el programa');
            return;
        }

        if (metricsError || availableMetrics.length === 0) {
            alert('No se pudieron cargar las métricas. Intenta de nuevo.');
            return;
        }

        const activeTargets = targets.filter(t => t.enabled);
        if (activeTargets.length === 0) {
            alert('Activa al menos un objetivo para el programa');
            return;
        }

        const endDate = calculateEndDate(startDate, weeks);

        const targetsPayload = activeTargets.map(({ enabled, ...rest }) => ({
            ...rest,
            target: isNaN(rest.target) ? 0 : rest.target,
            weight: isNaN(rest.weight) || rest.weight < 0 ? 0 : Math.min(rest.weight, 1),
        }));

        const data: CreateProgramDto = {
            name: name.trim(),
            kind,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            workoutsPerWeek: workouts || 0,
            isActive,
            targets: targetsPayload,
        };

        setIsSubmitting(true);
        try {
            const saved = await onSubmit(data);
            const savedProgram = saved as Program | undefined;
            const savedId = (mode === 'edit' && initialData?.id) ? initialData.id : savedProgram?.id;

            // Paso 2 y 3: sincronizar rutinas asignadas al programa
            if (savedId) {
                const toAssign = selectedRoutineIds.filter(rid => !initialRoutineIds.includes(rid));
                const toRemove = initialRoutineIds.filter(rid => !selectedRoutineIds.includes(rid));
                const failures: string[] = [];
                for (const rid of toAssign) {
                    try {
                        await programService.assignRoutine(savedId, rid);
                    } catch (error) {
                        console.error('Error assigning routine:', error);
                        failures.push(availableRoutines.find(r => r.id === rid)?.name ?? rid);
                    }
                }
                for (const rid of toRemove) {
                    try {
                        await programService.removeRoutine(savedId, rid);
                    } catch (error) {
                        console.error('Error removing routine:', error);
                        failures.push(availableRoutines.find(r => r.id === rid)?.name ?? rid);
                    }
                }
                if (failures.length > 0) {
                    Alert.alert(
                        'El programa se guardó',
                        `Pero algunas rutinas no se pudieron actualizar: ${failures.join(', ')}.`,
                    );
                }
            }
            handleClose();
        } catch (error) {
            // El padre (ProgramsLogs) muestra el Alert con el mensaje del backend.
            if (__DEV__) {
                console.error('Error saving program:', error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    if (!visible) return null;

    const endDate = calculateEndDate(startDate, parseInt(durationWeeks));

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <Animated.View
                style={[
                    styles.container,
                    {
                        transform: [{
                            translateY: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [screenHeight, 0],
                            })
                        }],
                        height: keyboardShown
                            ? screenHeight * 0.7 + keyboardHeight
                            : screenHeight * 0.7
                    }
                ]}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.handle} />

                    <ThemedText
                        variant="medium"
                        size={12}
                        color={theme.colors.textLight}
                        style={styles.title}
                    >
                        {mode === 'edit' ? 'EDITAR PROGRAMA' : 'NUEVO PROGRAMA'}
                    </ThemedText>

                    <ScrollView
                        style={styles.formContainer}
                        contentContainerStyle={styles.formContainerContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Nombre y tipo de programa */}
                        <View style={styles.fullRow}>
                            <FormInput
                                icon="Tag"
                                placeholder="Nombre del programa"
                                value={name}
                                onChangeText={setName}
                                rounded={false}
                            />
                        </View>
                        <View style={styles.fullRow}>
                            <FormSelect
                                icon="Target"
                                placeholder="Tipo de programa"
                                value={kind}
                                options={KIND_OPTIONS}
                                onSelect={(value) => setKind(value as ProgramKind)}
                            />
                        </View>

                        {/* Fila 1: Fecha de inicio y Duración */}
                        <View style={styles.row}>
                            <View style={styles.halfColumn}>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowStartDatePicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <Icon
                                        name="Calendar"
                                        size={18}
                                        color={theme.colors.placeholder}
                                        backgroundColor="transparent"
                                        padding={0}
                                    />
                                    <ThemedText
                                        variant="regular"
                                        size={14}
                                        color={theme.colors.text}
                                        style={styles.dateText}
                                    >
                                        {formatDate(startDate)}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.halfColumn}>
                                <FormSelect
                                    icon="Clock"
                                    placeholder="Duración"
                                    value={durationWeeks}
                                    options={CUT_DURATION_OPTIONS}
                                    onSelect={setDurationWeeks}
                                />
                            </View>
                        </View>

                        {/* Rango de fechas */}
                        <View style={styles.dateRangeContainer}>
                            <View style={styles.dateRangeItem}>
                                <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                    Inicio
                                </ThemedText>
                                <ThemedText variant="medium" size={13} color={theme.colors.text}>
                                    {formatDate(startDate)}
                                </ThemedText>
                            </View>
                            <Icon name="ArrowRight" size={16} color={theme.colors.placeholder} backgroundColor='transparent' padding={0} />
                            <View style={styles.dateRangeItem}>
                                <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                    Fin
                                </ThemedText>
                                <ThemedText variant="medium" size={13} color={theme.colors.text}>
                                    {formatDate(endDate)}
                                </ThemedText>
                            </View>
                        </View>

                        {/* Fila 2: Entrenamientos por semana (campo completo) */}
                        <View style={styles.fullRow}>
                            <FormSelect
                                icon="Dumbbell"
                                placeholder="Entrenamientos por semana"
                                value={workoutsPerWeek}
                                options={WORKOUTS_PER_WEEK_OPTIONS}
                                onSelect={setWorkoutsPerWeek}
                            />
                        </View>

                        {/* Objetivos del programa */}
                        <View style={styles.sectionHeader}>
                            <ThemedText variant="medium" size={11} color={theme.colors.textLight}>
                                OBJETIVOS DEL PROGRAMA
                            </ThemedText>
                        </View>

                        {loadingMetrics && (
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight} style={styles.loadingText}>
                                Cargando métricas...
                            </ThemedText>
                        )}

                        {metricsError && (
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight} style={styles.loadingText}>
                                No se pudieron cargar las métricas
                            </ThemedText>
                        )}

                        {!loadingMetrics && !metricsError && targets.map((target, index) => {
                            const metric = availableMetrics[index];
                            if (!metric) return null;
                            return (
                            <View key={target.key} style={styles.targetRow}>
                                <View style={styles.targetRowHeader}>
                                    <Switch
                                        value={target.enabled}
                                        onValueChange={(value) => setTargetEnabled(index, value)}
                                        trackColor={{ false: theme.colors.background, true: theme.colors.primary }}
                                        thumbColor={theme.colors.white}
                                    />
                                    <ThemedText
                                        variant="regular"
                                        size={13}
                                        color={target.enabled ? theme.colors.text : theme.colors.textLight}
                                    >
                                        {metric.label}{metric.unit ? ` (${metric.unit})` : ''}
                                    </ThemedText>
                                </View>
                                <View
                                    style={!target.enabled && styles.targetRowDisabled}
                                    pointerEvents={target.enabled ? 'auto' : 'none'}
                                >
                                    <View style={styles.row}>
                                        <View style={styles.targetInputCol}>
                                            <FormInput
                                                icon={(TARGET_ICONS[target.key] ?? 'Activity') as any}
                                                placeholder="Objetivo"
                                                value={isNaN(target.target) ? '' : String(target.target)}
                                                onChangeText={(text) => setTargetNumber(index, 'target', text)}
                                                keyboardType="numeric"
                                                rounded={false}
                                            />
                                        </View>
                                        <View style={styles.weightInputCol}>
                                            <FormInput
                                                icon="Scale"
                                                placeholder="Peso (0-1)"
                                                value={isNaN(target.weight) ? '' : String(target.weight)}
                                                onChangeText={(text) => setTargetNumber(index, 'weight', text)}
                                                keyboardType="numeric"
                                                rounded={false}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.directionRow}>
                                        <FormSelect
                                            icon="ArrowLeftRight"
                                            placeholder="Dirección"
                                            value={target.direction}
                                            options={DIRECTION_OPTIONS}
                                            onSelect={(value) => setTargetDirection(index, value)}
                                        />
                                    </View>
                                </View>
                            </View>
                        );
                        })}

                        {/* Rutinas del programa */}
                        <View style={styles.sectionHeader}>
                            <ThemedText variant="medium" size={11} color={theme.colors.textLight}>
                                RUTINAS DEL PROGRAMA
                            </ThemedText>
                        </View>

                        {loadingRoutines && (
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight} style={styles.loadingText}>
                                Cargando rutinas...
                            </ThemedText>
                        )}

                        {routinesError && (
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight} style={styles.loadingText}>
                                {routinesError}
                            </ThemedText>
                        )}

                        {!loadingRoutines && !routinesError && availableRoutines.length === 0 && (
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight} style={styles.loadingText}>
                                No hay rutinas creadas
                            </ThemedText>
                        )}

                        {!loadingRoutines && !routinesError && availableRoutines.map((routine) => (
                            <View key={routine.id} style={styles.routineRow}>
                                <View style={styles.routineInfo}>
                                    <ThemedText
                                        variant="regular"
                                        size={13}
                                        color={theme.colors.text}
                                    >
                                        {routine.name}
                                    </ThemedText>
                                    {!routine.isActive && (
                                        <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                                            inactiva
                                        </ThemedText>
                                    )}
                                </View>
                                <Switch
                                    value={selectedRoutineIds.includes(routine.id)}
                                    onValueChange={() => toggleRoutine(routine.id)}
                                    trackColor={{ false: theme.colors.background, true: theme.colors.primary }}
                                    thumbColor={theme.colors.white}
                                />
                            </View>
                        ))}

                        {/* Botón Guardar */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (isSubmitting || metricsError || availableMetrics.length === 0) && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={isSubmitting || metricsError || availableMetrics.length === 0}
                            activeOpacity={0.8}
                        >
                            <ThemedText variant="semiBold" size={14} color={theme.colors.white}>
                                {isSubmitting
                                    ? (mode === 'edit' ? 'Guardando...' : 'Creando...')
                                    : (mode === 'edit' ? 'Guardar cambios' : 'Crear programa')}
                            </ThemedText>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Animated.View>

            {/* Date Picker */}
            {showStartDatePicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    keyboardView: {
        flex: 1,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: theme.colors.primary,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    title: {
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 1,
        paddingHorizontal: 20,
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    formContainerContent: {
        paddingBottom: 30,
    },
    sectionHeader: {
        alignItems: 'center',
        marginVertical: 5,
        paddingVertical: 4,
    },
    routineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 8,
        gap: 12,
    },
    routineInfo: {
        flex: 1,
        gap: 2,
    },
    loadingText: {
        textAlign: 'center',
        marginBottom: 12,
    },
    targetRow: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: theme.colors.background,
        borderRadius: 10,
        gap: 8,
    },
    targetRowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    targetRowDisabled: {
        opacity: 0.5,
    },
    targetInputCol: {
        flex: 2,
    },
    weightInputCol: {
        flex: 1,
    },
    directionRow: {
        marginTop: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 10,
        gap: 10,
    },
    halfColumn: {
        flex: 1,
    },
    fullRow: {
        marginBottom: 10,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 10,
        height: 48,
    },
    dateText: {
        flex: 1,
    },
    dateRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: theme.colors.background,
        borderRadius: 10,
        paddingVertical: 5,
        paddingHorizontal: 14,
        marginBottom: 10,
    },
    dateRangeItem: {
        alignItems: 'center',
        gap: 0,
    },
    submitButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
});

export default ProgramForm;