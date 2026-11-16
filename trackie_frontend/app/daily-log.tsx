import { FormInput } from '@/components/FormInput';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { WorkoutBlockRow } from '@/components/workout/WorkoutBlockRow';
import { DailyLog, FormMetric, FormSchema, WorkoutBlockExecution, dailyLogService, getMetric } from '@/services/dailyLogService';
import { ProgramRoutine, programService } from '@/services/programService';
import { WorkoutBlockExecutionInput, WorkoutBlockTemplate, WorkoutRoutine, WorkoutTemplate, workoutService } from '@/services/workoutService';
import { theme } from '@/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

// El backend incluye templateId en cada bloque de ejecución, aunque la
// interface WorkoutBlockExecution (services/dailyLogService.ts) no lo declare.
type WorkoutBlockExecutionWithTemplate = WorkoutBlockExecution & { templateId?: string | null };

const METRIC_ICONS: Record<string, string> = {
    calories: 'Flame',
    steps: 'Footprints',
    protein: 'Beef',
    water: 'Droplets',
    meditation: 'Brain',
    reading: 'BookOpen',
};

const getEditableMetrics = (schema: FormSchema | null): FormMetric[] =>
    (schema?.metrics ?? []).filter(m => !m.isDerived);

const DailyLogPage: React.FC = () => {
    const router = useRouter();
    const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
    const routeDate = (typeof dateParam === 'string' && dateParam) ? dateParam : undefined;
    const [initialData, setInitialData] = useState<DailyLog | undefined>(undefined);
    const [loadingInitial, setLoadingInitial] = useState(!!routeDate);
    const [initialError, setInitialError] = useState<string | null>(null);
    const hideDatePicker = false;
    const parseLocalDateStr = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const getNow = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    };

    const [date, setDate] = useState(() => (routeDate ? parseLocalDateStr(routeDate) : getNow()));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [schema, setSchema] = useState<FormSchema | null>(null);
    const [loadingSchema, setLoadingSchema] = useState(false);
    // Estado del form: clave = metric.key, valor = número.
    // Los inputs numéricos guardan NaN mientras están vacíos; NaN → 0 en el submit.
    const [values, setValues] = useState<Record<string, number>>({});
    // Métricas añadidas por el usuario en esta sesión (botón "Añadir métrica")
    const [extraMetrics, setExtraMetrics] = useState<FormMetric[]>([]);
    const [showAddMetricModal, setShowAddMetricModal] = useState(false);
    // Entrenamientos añadidos en esta sesión (workout_sessions) — aún no se envían
    const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
    const [loadingRoutines, setLoadingRoutines] = useState(false);
    const [routinesError, setRoutinesError] = useState<string | null>(null);
    const [activeProgramWithoutRoutines, setActiveProgramWithoutRoutines] = useState(false);
    // IDs de las ejecuciones que venían en initialData (para borrarlas y re-registrarlas en edición)
    const [originalExecutionIds, setOriginalExecutionIds] = useState<string[]>([]);
    const [showWorkoutSelector, setShowWorkoutSelector] = useState(false);
    const [selectedWorkouts, setSelectedWorkouts] = useState<Array<{ workout: WorkoutTemplate; routine: WorkoutRoutine }>>([]);
    const [loadingWorkoutDetails, setLoadingWorkoutDetails] = useState(false);
    const [selectedRoutineForSelector, setSelectedRoutineForSelector] = useState<WorkoutRoutine | null>(null);
    const [routineTemplates, setRoutineTemplates] = useState<WorkoutTemplate[]>([]);
    // Detalle de bloques por workout ('loading' = cargando, null = error)
    const [workoutDetails, setWorkoutDetails] = useState<Record<string, WorkoutTemplate | null | 'loading'>>({});
    const [blockInputs, setBlockInputs] = useState<Record<string, WorkoutBlockExecutionInput[]>>({});
    const [savingWorkouts, setSavingWorkouts] = useState(false);

    // Cargar el daily log por fecha (modo edición si existe)
    useEffect(() => {
        if (!routeDate) {
            setLoadingInitial(false);
            return;
        }
        setLoadingInitial(true);
        setInitialError(null);
        dailyLogService.getByDate(routeDate)
            .then((log) => {
                setInitialData(log ?? undefined);
            })
            .catch((error) => {
                console.error('Error fetching daily log:', error);
                setInitialError('No se pudo cargar el registro.');
            })
            .finally(() => {
                setLoadingInitial(false);
            });
    }, [routeDate]);

    // Pedir el schema al montar
    useEffect(() => {
            let cancelled = false;
        setLoadingSchema(true);
        dailyLogService.getFormSchema()
            .then((data) => {
                if (cancelled) return;
                setSchema(data);
            })
            .catch((error) => {
                console.error('Error loading form schema:', error);
                if (!cancelled) setSchema(null);
            })
            .finally(() => {
                if (!cancelled) setLoadingSchema(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Precargar las ejecuciones de workout existentes (modo edición):
    // carga template (con bloques ordenados) y rutina de cada ejecución,
    // puebla selectedWorkouts / workoutDetails / blockInputs.
    useEffect(() => {
        if (!initialData?.workouts?.length) {
            setOriginalExecutionIds([]);
            return;
        }

        let cancelled = false;

        const preload = async () => {
            try {
                const loaded = await Promise.all(
                    initialData.workouts.map(async (execution) => {
                        const workout = execution.workoutId
                            ? await workoutService.getTemplate(execution.workoutId)
                            : null;
                        const routine = execution.routineId
                            ? await workoutService.getRoutine(execution.routineId)
                            : null;
                        return { execution, workout, routine };
                    }),
                );

                if (cancelled) return;

                const selected: Array<{ workout: WorkoutTemplate; routine: WorkoutRoutine }> = [];
                const details: Record<string, WorkoutTemplate | 'loading' | null> = {};
                const inputs: Record<string, WorkoutBlockExecutionInput[]> = {};
                const ids: string[] = [];

                for (const { execution, workout, routine } of loaded) {
                    if (!workout || !routine) {
                        // Sin workoutId/routineId utilizable: se omite la ejecución
                        continue;
                    }
                    const orderedBlocks = [...(workout.blockTemplates ?? [])]
                        .sort((a, b) => a.order - b.order);

                    selected.push({ workout, routine });
                    ids.push(execution.id);
                    details[workout.id] = { ...workout, blockTemplates: orderedBlocks };
                    inputs[workout.id] = orderedBlocks.map((templateBlock) => {
                        const execBlock = execution.blocks?.find(b => (b as WorkoutBlockExecutionWithTemplate).templateId === templateBlock.id) as WorkoutBlockExecutionWithTemplate | undefined;
                        if (execBlock) {
                            return {
                                templateId: templateBlock.id,
                                actualRounds: execBlock.actualRounds,
                                ...(templateBlock.metricType === 'distance'
                                    ? { actualDistanceMeters: execBlock.actualDistanceMeters ?? 0 }
                                    : templateBlock.metricType === 'duration'
                                        ? { actualDurationSeconds: execBlock.actualDurationSeconds ?? 0 }
                                        : templateBlock.metricType === 'reps'
                                            ? { actualReps: execBlock.actualReps ?? 0 }
                                            : {}),
                                completed: execBlock.completed,
                            };
                        }
                        // Bloque del template sin ejecución previa: defaults como al añadir
                        return buildBlockInput(templateBlock);
                    });
                }

                setSelectedWorkouts(selected);
                setWorkoutDetails(details);
                setBlockInputs(inputs);
                setOriginalExecutionIds(ids);
            } catch (error) {
                console.error('Error preloading workouts:', error);
                if (!cancelled) {
                    Alert.alert(
                        'No se pudieron cargar los entrenamientos del registro',
                        'Algunos workouts no se pudieron precargar. Se partirá de una sección vacía.',
                    );
                    setSelectedWorkouts([]);
                    setWorkoutDetails({});
                    setBlockInputs({});
                    setOriginalExecutionIds([]);
                }
            }
        };

        preload();

        return () => {
            cancelled = true;
            setOriginalExecutionIds([]);
        };
    }, [initialData]);

    // Inicializar valores cuando llega el schema (o cambia initialData)
    useEffect(() => {
        if (!schema) return;
        const editable = getEditableMetrics(schema);
        const initialValues: Record<string, number> = {};
        for (const metric of schema.metrics) {
            initialValues[metric.key] = initialData ? getMetric(initialData, metric.key) : 0;
        }

        // Modo edición: las métricas registradas en el log que no están en el schema
        // (ni son derivadas) se muestran también como entradas editables, con su valor.
        // La metadata viene del propio entry del log (label, valueType, unit).
        const derivedKeys = new Set(schema.metrics.filter(m => m.isDerived).map(m => m.key));
        const seeded: FormMetric[] = [];
        for (const entry of initialData?.metrics ?? []) {
            if (editable.some(m => m.key === entry.key)) continue;
            if (derivedKeys.has(entry.key)) continue;
            seeded.push({
                key: entry.key,
                label: entry.label,
                valueType: entry.valueType,
                unit: entry.unit,
                isUniversal: false,
            });
            initialValues[entry.key] = entry.value;
        }
        setExtraMetrics(seeded);

        setValues(initialValues);

        if (initialData?.date) {
            const [year, month, day] = initialData.date.split('-').map(Number);
            const initialDate = new Date(year, month - 1, day);
            if (!isNaN(initialDate.getTime())) {
                setDate(initialDate);
            }
        }
    }, [schema, initialData]);

    // Cargar rutinas al montar y resetear los entrenamientos seleccionados.
    // Si hay un programa activo, solo se ofrecen sus rutinas asignadas;
    // si no lo hay, se ofrecen todas las rutinas del catálogo.
    useEffect(() => {
            setSelectedWorkouts([]);
            setWorkoutDetails({});
            setBlockInputs({});
            setOriginalExecutionIds([]);
            setSavingWorkouts(false);
            setRoutinesError(null);
            setActiveProgramWithoutRoutines(false);
            setLoadingRoutines(true);
            (async () => {
                try {
                    const activeProgram = await programService.findActive().catch(() => null);
                    if (activeProgram) {
                        const assigned = await programService.listRoutines(activeProgram.id);
                        const assignedRoutines = assigned
                            .map((a: ProgramRoutine) => a.routine)
                            .filter((r): r is WorkoutRoutine => !!r);
                        if (assignedRoutines.length === 0) {
                            setRoutines([]);
                            setActiveProgramWithoutRoutines(true);
                        } else {
                            setRoutines(assignedRoutines);
                        }
                    } else {
                        const data = await workoutService.listRoutines();
                        setRoutines(data);
                    }
                } catch (error) {
                    console.error('Error loading routines:', error);
                    setRoutines([]);
                    setRoutinesError('No se pudieron cargar las rutinas');
                } finally {
                    setLoadingRoutines(false);
                }
            })();
    }, []);

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth();
            const day = selectedDate.getDate();
            setDate(new Date(year, month, day));
        }
    };

    const setNumericValue = (key: string, text: string) => {
        const parsed = parseFloat(text);
        setValues(prev => ({ ...prev, [key]: isNaN(parsed) ? NaN : parsed }));
    };

    const setBooleanValue = (key: string, enabled: boolean) => {
        setValues(prev => ({ ...prev, [key]: enabled ? 1 : 0 }));
    };

    const editableMetrics = getEditableMetrics(schema);
    const allMetrics = [...editableMetrics, ...extraMetrics]
        .filter((m, i, arr) => arr.findIndex(x => x.key === m.key) === i);
    const addableMetrics = (schema?.availableToAdd ?? []).filter(m =>
        !editableMetrics.some(e => e.key === m.key) && !extraMetrics.some(x => x.key === m.key));
    const showAddButton = addableMetrics.length > 0;

    const handleAddMetric = (metric: FormMetric) => {
        setExtraMetrics(prev => [...prev, metric]);
        setValues(prev => ({ ...prev, [metric.key]: 0 }));
        setShowAddMetricModal(false);
    };

    const handleSelectRoutine = async (routine: WorkoutRoutine) => {
        setSelectedRoutineForSelector(routine);
        setLoadingWorkoutDetails(true);
        try {
            const detail = await workoutService.getRoutine(routine.id);
            setRoutineTemplates(detail.templates ?? []);
        } catch (error) {
            console.error('Error loading routine templates:', error);
            setRoutineTemplates([]);
        } finally {
            setLoadingWorkoutDetails(false);
        }
    };

    const handleBackToRoutines = () => {
        setSelectedRoutineForSelector(null);
        setRoutineTemplates([]);
    };

    // Construye los inputs iniciales de un bloque (defaults = planificado)
    const buildBlockInput = (block: WorkoutBlockTemplate): WorkoutBlockExecutionInput => {
        const base: WorkoutBlockExecutionInput = {
            templateId: block.id,
            actualRounds: block.rounds ?? 0,
            completed: true,
        };
        switch (block.metricType) {
            case 'distance':
                return { ...base, actualDistanceMeters: block.targetDistanceMeters ?? 0 };
            case 'duration':
                return { ...base, actualDurationSeconds: block.targetDurationSeconds ?? 0 };
            case 'reps':
                return { ...base, actualReps: block.targetReps ?? 0 };
            default:
                return base;
        }
    };

    const handleSelectWorkout = async (workout: WorkoutTemplate) => {
        if (!selectedRoutineForSelector) return;
        const routine = selectedRoutineForSelector;
        setSelectedWorkouts(prev => [...prev, { workout, routine }]);
        closeWorkoutSelector();

        // Marca el workout como cargando (un único set funcional, atómico con el await)
        setWorkoutDetails(prev => ({ ...prev, [workout.id]: 'loading' }));
        try {
            const detail = await workoutService.getTemplate(workout.id);
            const ordered = [...(detail.blockTemplates ?? [])].sort((a, b) => a.order - b.order);
            setWorkoutDetails(prev => ({ ...prev, [workout.id]: { ...detail, blockTemplates: ordered } }));
            setBlockInputs(prev => (workout.id in prev ? prev : { ...prev, [workout.id]: ordered.map(buildBlockInput) }));
        } catch (error) {
            console.error('Error loading workout detail:', error);
            setWorkoutDetails(prev => ({ ...prev, [workout.id]: null }));
            Alert.alert('No se pudieron cargar los bloques', `El workout "${workout.name}" se añadió, pero no se pudieron cargar sus bloques.`);
        }
    };

    const closeWorkoutSelector = () => {
        setShowWorkoutSelector(false);
        setSelectedRoutineForSelector(null);
        setRoutineTemplates([]);
    };

    const removeWorkout = (index: number) => {
        setSelectedWorkouts(prev => prev.filter((_, i) => i !== index));
    };

    const setBlockNumber = (
        workoutId: string,
        blockIndex: number,
        field: 'actualRounds' | 'actualDistanceMeters' | 'actualDurationSeconds' | 'actualReps',
        text: string,
    ) => {
        const parsed = parseFloat(text);
        setBlockInputs(prev => {
            const list = [...(prev[workoutId] ?? [])];
            if (!list[blockIndex]) return prev;
            list[blockIndex] = { ...list[blockIndex], [field]: isNaN(parsed) ? 0 : parsed };
            return { ...prev, [workoutId]: list };
        });
    };

    const setBlockCompleted = (workoutId: string, blockIndex: number, completed: boolean) => {
        setBlockInputs(prev => {
            const list = [...(prev[workoutId] ?? [])];
            if (!list[blockIndex]) return prev;
            list[blockIndex] = { ...list[blockIndex], completed };
            return { ...prev, [workoutId]: list };
        });
    };

    const handleSubmit = async () => {
        const metrics: Record<string, number> = {};
        for (const metric of allMetrics) {
            const raw = values[metric.key];
            metrics[metric.key] = raw === undefined || isNaN(raw) ? 0 : raw;
        }
        const dateStr = formatDate(date);

        setSavingWorkouts(true);
        try {
            // Paso 0 (solo edición): borrar las ejecuciones originales para no duplicarlas
            const deleteFailures: string[] = [];
            if (initialData?.workouts?.length && originalExecutionIds.length > 0) {
                for (const id of originalExecutionIds) {
                    try {
                        await workoutService.deleteExecution(id);
                    } catch (error) {
                        console.error('Error deleting execution:', error);
                        deleteFailures.push(id);
                    }
                }
                if (deleteFailures.length > 0) {
                    Alert.alert(
                        'No se pudo borrar la ejecución anterior',
                        'Se crearán duplicados de algún workout. Los registros antiguos deberán reconciliarse manualmente.',
                    );
                }
            }

            // Paso 1: guardar el daily log (upsert: PUT /daily-logs)
            try {
                await dailyLogService.upsert({ date: dateStr, metrics });
            } catch (error: any) {
                const backendMessage = error?.response?.data?.message;
                const message = Array.isArray(backendMessage) ? backendMessage.join('\n') : backendMessage;
                Alert.alert('No se pudo guardar', message ?? 'Error al guardar el registro. Intenta de nuevo.');
                return;
            }

            // Paso 2: registrar la ejecución de cada workout añadido
            const failures: string[] = [];
            for (const { workout, routine } of selectedWorkouts) {
                try {
                    await workoutService.registerExecution({
                        date: dateStr,
                        workoutId: workout.id,
                        routineId: routine.id,
                        blocks: blockInputs[workout.id] ?? [],
                    });
                } catch (error) {
                    console.error('Error registering workout execution:', error);
                    failures.push(workout.name);
                }
            }

            if (failures.length > 0) {
                Alert.alert(
                    'Algunos entrenamientos no se pudieron guardar',
                    `Fallaron: ${failures.join(', ')}. El registro diario sí se guardó.`,
                );
            }

            // Paso 3: limpiar estado de workouts y volver
            setBlockInputs({});
            setWorkoutDetails({});
            setOriginalExecutionIds([]);
            router.back();
        } finally {
            setSavingWorkouts(false);
        }
    };

    const goBack = () => {
        router.back();
    };

    const renderMetricInput = (metric: FormMetric, position: 'left' | 'right' | 'full' = 'full') => {
        const value = values[metric.key];
        const icon = (METRIC_ICONS[metric.key] ?? 'Activity') as any;
        const placeholder = metric.label;
        const displayValue = value === undefined || isNaN(value) || value === 0 ? '' : String(value);
        const containerStyle = position === 'left'
            ? styles.leftInput
            : position === 'right'
                ? styles.rightInput
                : styles.fullInput;

        return (
            <FormInput
                icon={icon}
                placeholder={placeholder}
                value={displayValue}
                onChangeText={(text) => setNumericValue(metric.key, text)}
                keyboardType="numeric"
                rounded={false}
                containerStyle={containerStyle}
            />
        );
    };

    const renderBooleanMetricInput = (metric: FormMetric) => {
        const value = values[metric.key];
        return (
            <View style={styles.boolRow} key={metric.key}>
                <ThemedText variant="regular" size={14} color={theme.colors.text}>
                    {metric.label}
                </ThemedText>
                <Switch
                    value={value === 1}
                    onValueChange={(enabled) => setBooleanValue(metric.key, enabled)}
                    trackColor={{ false: theme.colors.background, true: theme.colors.primary }}
                    thumbColor={theme.colors.white}
                />
            </View>
        );
    };

    // Agrupa las métricas number/duration en pares de 2 columnas.
    // Los booleanos van en fila propia a ancho completo.
    const renderMetricRows = () => {
        const numberMetrics = allMetrics.filter(m => m.valueType !== 'boolean');
        const booleanMetrics = allMetrics.filter(m => m.valueType === 'boolean');

        const rows: FormMetric[][] = [];
        for (let i = 0; i < numberMetrics.length; i += 2) {
            rows.push(numberMetrics.slice(i, i + 2));
        }

        return (
            <>
                {rows.map((pair, idx) =>
                    pair.length === 2 ? (
                        <View style={styles.row} key={`pair-${idx}`}>
                            <View style={styles.halfColumn}>
                                {renderMetricInput(pair[0], 'left')}
                            </View>
                            <View style={styles.halfColumn}>
                                {renderMetricInput(pair[1], 'right')}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.row} key={`pair-${idx}`}>
                            <View style={styles.fullColumn}>
                                {renderMetricInput(pair[0], 'full')}
                            </View>
                        </View>
                    ),
                )}
                {booleanMetrics.map(renderBooleanMetricInput)}
            </>
        );
    };

    const pageNavbar = (
        <View style={styles.navbar}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
                <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
                <ThemedText variant="medium" size={14} color={theme.colors.text}>
                    {routeDate ? 'Editar registro' : 'Nuevo registro'}
                </ThemedText>
            </View>
            <View style={styles.rightPlaceholder} />
        </View>
    );

    if (loadingInitial) {
        return (
            <View style={styles.pageContainer}>
                {pageNavbar}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    if (initialError) {
        return (
            <View style={styles.pageContainer}>
                {pageNavbar}
                <View style={styles.loadingContainer}>
                    <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                        {initialError}
                    </ThemedText>
                </View>
            </View>
        );
    }

    return (
        <>
        <View style={styles.pageContainer}>
            {pageNavbar}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                    <ScrollView
                        style={styles.formContainer}
                        contentContainerStyle={styles.formContainerContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {!hideDatePicker && (
                            <>
                                <View style={styles.dateRow}>
                                    <TouchableOpacity
                                        style={styles.dateButton}
                                        onPress={() => setShowDatePicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.dateIconContainer}>
                                            <Icon
                                                name="Calendar"
                                                size={18}
                                                color={theme.colors.placeholder}
                                                backgroundColor="transparent"
                                                padding={0}
                                            />
                                        </View>
                                        <View style={styles.dateTextContainer}>
                                            <ThemedText
                                                variant="regular"
                                                size={14}
                                                color={theme.colors.placeholder}
                                            >
                                                {formatDate(date)}
                                            </ThemedText>
                                        </View>
                                        <Icon
                                            name="ChevronDown"
                                            size={20}
                                            color={theme.colors.placeholder}
                                            backgroundColor="transparent"
                                            padding={0}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={handleDateChange}
                                    />
                                )}
                            </>
                        )}

                        {loadingSchema && (
                            <ThemedText
                                variant="regular"
                                size={12}
                                color={theme.colors.textLight}
                                style={styles.loadingText}
                            >
                                Cargando...
                            </ThemedText>
                        )}

                        {/* Métricas dinámicas: schema (editables) + añadidas por el usuario */}
                        {renderMetricRows()}

                        {/* Botón "Añadir métrica" */}
                        {showAddButton && (
                            <TouchableOpacity
                                style={styles.addMetricButton}
                                onPress={() => setShowAddMetricModal(true)}
                                activeOpacity={0.7}
                            >
                                <Icon
                                    name="Plus"
                                    size={14}
                                    color={theme.colors.placeholder}
                                    backgroundColor="transparent"
                                    padding={0}
                                />
                                <ThemedText variant="medium" size={12} color={theme.colors.placeholder}>
                                    Añadir métrica
                                </ThemedText>
                            </TouchableOpacity>
                        )}

                        {/* Entrenamientos */}
                        <View style={styles.sectionHeader}>
                            <ThemedText variant="medium" size={11} color={theme.colors.textLight}>
                                ENTRENAMIENTOS
                            </ThemedText>
                        </View>

                        {selectedWorkouts.length === 0 ? (
                                <ThemedText
                                    variant="regular"
                                    size={12}
                                    color={theme.colors.textLight}
                                    style={styles.workoutEmpty}
                                >
                                    No has añadido entrenamientos
                                </ThemedText>
                        ) : (
                            selectedWorkouts.map(({ workout, routine }, index) => {
                                const detail = workoutDetails[workout.id];
                                const blocks = detail && detail !== 'loading' && detail !== null
                                    ? [...(detail.blockTemplates ?? [])].sort((a, b) => a.order - b.order)
                                    : [];

                                return (
                                <View
                                    key={`${routine.id}-${workout.id}-${index}`}
                                    style={styles.workoutGroup}
                                >
                                    <View style={styles.workoutItem}>
                                        <View style={styles.workoutInfo}>
                                            <ThemedText
                                                variant="semiBold"
                                                size={13}
                                                color={theme.colors.text}
                                                numberOfLines={1}
                                            >
                                                {workout.name}
                                                <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                                    {' '}({workout.type})
                                                </ThemedText>
                                            </ThemedText>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => removeWorkout(index)}
                                            style={styles.removeButton}
                                            activeOpacity={0.7}
                                            accessibilityRole="button"
                                            accessibilityLabel="Quitar entrenamiento"
                                        >
                                            <Icon
                                                name="X"
                                                size={16}
                                                color={theme.colors.textLight}
                                                backgroundColor="transparent"
                                                padding={0}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Editor de bloques */}
                                    {detail === undefined || detail === 'loading' ? (
                                        <ThemedText
                                            variant="regular"
                                            size={12}
                                            color={theme.colors.textLight}
                                            style={styles.blocksLoading}
                                        >
                                            Cargando bloques...
                                        </ThemedText>
                                    ) : detail === null ? (
                                        <ThemedText
                                            variant="regular"
                                            size={12}
                                            color={theme.colors.textLight}
                                            style={styles.blocksLoading}
                                        >
                                            No se pudieron cargar los bloques del workout
                                        </ThemedText>
                                    ) : (
                                        <View style={styles.blocksContainer}>
                                            {blocks.map((block, blockIndex) => {
                                                const input = blockInputs[workout.id]?.[blockIndex];
                                                const isDistance = block.metricType === 'distance';
                                                const isDuration = block.metricType === 'duration';
                                                const isReps = block.metricType === 'reps';

                                                return (
                                                    <WorkoutBlockRow
                                                        key={block.id}
                                                        block={block}
                                                        input={input}
                                                        onChangeRounds={(v) => setBlockNumber(workout.id, blockIndex, 'actualRounds', String(v))}
                                                        onChangeMeasure={(v) => {
                                                            if (isDistance) setBlockNumber(workout.id, blockIndex, 'actualDistanceMeters', String(v));
                                                            else if (isDuration) setBlockNumber(workout.id, blockIndex, 'actualDurationSeconds', String(v));
                                                            else if (isReps) setBlockNumber(workout.id, blockIndex, 'actualReps', String(v));
                                                        }}
                                                        onToggleCompleted={(c) => setBlockCompleted(workout.id, blockIndex, c)}
                                                    />
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>
                                );
                            })
                        )}

                        {/* Entrenamientos: si hay programa activo sin rutinas, solo mensaje */}
                        {activeProgramWithoutRoutines && (
                            <ThemedText
                                variant="regular"
                                size={12}
                                color={theme.colors.textLight}
                                style={styles.workoutEmpty}
                            >
                                El programa activo no tiene rutinas asignadas. Añade rutinas al programa o desactívalo para ver todas.
                            </ThemedText>
                        )}

                        {/* Botón "Añadir entrenamiento" */}
                        {!activeProgramWithoutRoutines && (
                        <TouchableOpacity
                            style={[
                                styles.addWorkoutButton,
                                (!!routinesError || routines.length === 0 || loadingRoutines) && styles.addWorkoutButtonDisabled,
                            ]}
                            onPress={() => setShowWorkoutSelector(true)}
                            activeOpacity={0.7}
                            disabled={!!routinesError || routines.length === 0 || loadingRoutines}
                        >
                            <Icon
                                name="Plus"
                                size={14}
                                color={(!!routinesError || routines.length === 0 || loadingRoutines) ? theme.colors.textLight : theme.colors.placeholder}
                                backgroundColor="transparent"
                                padding={0}
                            />
                            <ThemedText
                                variant="medium"
                                size={12}
                                color={(!!routinesError || routines.length === 0 || loadingRoutines) ? theme.colors.textLight : theme.colors.placeholder}
                            >
                                {routinesError
                                    ? 'No se pudieron cargar las rutinas'
                                    : loadingRoutines
                                        ? 'Cargando rutinas...'
                                        : routines.length === 0
                                            ? 'No hay rutinas creadas'
                                            : 'Añadir entrenamiento'}
                            </ThemedText>
                        </TouchableOpacity>
                        )}

                        {/* Botón de guardar */}
                        <TouchableOpacity
                            style={[styles.submitButton, savingWorkouts && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={savingWorkouts}
                            activeOpacity={0.8}
                        >
                            <ThemedText variant="semiBold" size={14} color={theme.colors.white}>
                                {savingWorkouts ? 'Guardando...' : 'Guardar'}
                            </ThemedText>
                        </TouchableOpacity>
                    </ScrollView>
            </KeyboardAvoidingView>
        </View>

        {/* Modal selector de métricas disponibles para añadir */}
        <Modal
            visible={showAddMetricModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowAddMetricModal(false)}
        >
            <TouchableWithoutFeedback onPress={() => setShowAddMetricModal(false)}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <View style={styles.addMetricSheet}>
                <View style={styles.handle} />

                <ThemedText
                    variant="medium"
                    size={12}
                    color={theme.colors.textLight}
                    style={styles.title}
                >
                    AÑADIR MÉTRICA
                </ThemedText>

                <ScrollView
                    style={styles.addMetricList}
                    keyboardShouldPersistTaps="handled"
                >
                    {addableMetrics.map((metric) => (
                        <TouchableOpacity
                            key={metric.key}
                            style={styles.addMetricItem}
                            onPress={() => handleAddMetric(metric)}
                            activeOpacity={0.7}
                        >
                            <Icon
                                name={(METRIC_ICONS[metric.key] ?? 'Activity') as any}
                                size={18}
                                color={theme.colors.placeholder}
                                backgroundColor="transparent"
                                padding={0}
                            />
                            <ThemedText
                                variant="regular"
                                size={14}
                                color={theme.colors.text}
                                style={styles.addMetricLabel}
                            >
                                {metric.label}{metric.unit ? ` (${metric.unit})` : ''}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowAddMetricModal(false)}
                    activeOpacity={0.7}
                >
                    <ThemedText variant="semiBold" size={14} color={theme.colors.textLight}>
                        Cancelar
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </Modal>

        {/* Modal selector de entrenamiento: paso 1 rutina → paso 2 workout */}
        <Modal
            visible={showWorkoutSelector}
            transparent={true}
            animationType="slide"
            onRequestClose={closeWorkoutSelector}
        >
            <TouchableWithoutFeedback onPress={closeWorkoutSelector}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <View style={styles.addMetricSheet}>
                <View style={styles.handle} />

                <View style={styles.selectorHeader}>
                    {selectedRoutineForSelector && (
                        <TouchableOpacity
                            style={styles.selectorBackButton}
                            onPress={handleBackToRoutines}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel="Volver"
                        >
                            <Icon
                                name="ArrowLeft"
                                size={18}
                                color={theme.colors.text}
                                backgroundColor="transparent"
                                padding={0}
                            />
                        </TouchableOpacity>
                    )}
                    <ThemedText
                        variant="medium"
                        size={12}
                        color={theme.colors.textLight}
                        style={styles.selectorTitle}
                    >
                        {selectedRoutineForSelector
                            ? selectedRoutineForSelector.name.toUpperCase()
                            : 'SELECCIONAR RUTINA'}
                    </ThemedText>
                    {selectedRoutineForSelector && <View style={styles.backButtonSpacer} />}
                </View>

                <ScrollView
                    style={styles.addMetricList}
                    keyboardShouldPersistTaps="handled"
                >
                    {!selectedRoutineForSelector ? (
                        routines.map((routine) => (
                            <TouchableOpacity
                                key={routine.id}
                                style={styles.addMetricItem}
                                onPress={() => handleSelectRoutine(routine)}
                                activeOpacity={0.7}
                            >
                                <Icon
                                    name="Dumbbell"
                                    size={18}
                                    color={theme.colors.placeholder}
                                    backgroundColor="transparent"
                                    padding={0}
                                />
                                <ThemedText
                                    variant="regular"
                                    size={14}
                                    color={theme.colors.text}
                                    style={styles.addMetricLabel}
                                >
                                    {routine.name}
                                </ThemedText>
                            </TouchableOpacity>
                        ))
                    ) : loadingWorkoutDetails ? (
                        <ThemedText
                            variant="regular"
                            size={12}
                            color={theme.colors.textLight}
                            style={styles.loadingText}
                        >
                            Cargando...
                        </ThemedText>
                    ) : routineTemplates.length === 0 ? (
                        <ThemedText
                            variant="regular"
                            size={12}
                            color={theme.colors.textLight}
                            style={styles.loadingText}
                        >
                            No hay workouts en esta rutina
                        </ThemedText>
                    ) : (
                        [...routineTemplates]
                            .sort((a, b) => a.order - b.order)
                            .map((workout) => (
                                <TouchableOpacity
                                    key={workout.id}
                                    style={styles.addMetricItem}
                                    onPress={() => handleSelectWorkout(workout)}
                                    activeOpacity={0.7}
                                >
                                    <Icon
                                        name="Dumbbell"
                                        size={18}
                                        color={theme.colors.placeholder}
                                        backgroundColor="transparent"
                                        padding={0}
                                    />
                                    <View style={styles.workoutOptionInfo}>
                                        <ThemedText
                                            variant="regular"
                                            size={14}
                                            color={theme.colors.text}
                                        >
                                            {workout.name}
                                        </ThemedText>
                                        <ThemedText
                                            variant="regular"
                                            size={11}
                                            color={theme.colors.textLight}
                                        >
                                            {workout.type}
                                        </ThemedText>
                                    </View>
                                </TouchableOpacity>
                            ))
                    )}
                </ScrollView>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeWorkoutSelector}
                    activeOpacity={0.7}
                >
                    <ThemedText variant="semiBold" size={14} color={theme.colors.textLight}>
                        Cancelar
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    pageContainer: {
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
        marginBottom: 30,
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
        letterSpacing: 1,
    },
    formContainer: {
        paddingHorizontal: 20,
    },
    formContainerContent: {
        paddingBottom: 30,
    },
    sectionHeader: {
        alignItems: 'center',
        marginVertical: 5,
        paddingVertical: 4,
    },
    workoutEmpty: {
        textAlign: 'center',
        marginBottom: 8,
    },
    workoutItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        paddingVertical: 8,
        gap: 12,
    },
    workoutInfo: {
        flex: 1,
    },
    workoutOptionInfo: {
        flex: 1,
        gap: 2,
    },
    removeButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addWorkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        paddingVertical: 8,
        paddingRight: 12,
        marginBottom: 4,
    },
    addWorkoutButtonDisabled: {
        opacity: 0.7,
    },
    selectorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    selectorTitle: {
        textAlign: 'center',
        letterSpacing: 1,
        flex: 1,
    },
    selectorBackButton: {
        width: 40,
        alignItems: 'flex-start',
    },
    backButtonSpacer: {
        width: 40,
    },
    dateRow: {
        marginBottom: 16,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    dateIconContainer: {
        marginRight: 10,
    },
    dateTextContainer: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    halfColumn: {
        flex: 1,
    },
    fullColumn: {
        flex: 1,
    },
    leftInput: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        marginRight: 6,
    },
    rightInput: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        marginLeft: 6,
    },
    fullInput: {
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        marginLeft: 0,
        marginRight: 0,
    },
    boolRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
    },
    loadingText: {
        textAlign: 'center',
        marginBottom: 12,
    },
    addMetricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        paddingVertical: 8,
        paddingRight: 12,
        marginBottom: 4,
    },
    addMetricSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    addMetricList: {
        maxHeight: 320,
    },
    addMetricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 8,
    },
    addMetricLabel: {
        flex: 1,
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: theme.colors.primary || '#4CAF50',
        borderRadius: 20,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    workoutGroup: {
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        padding: 12,
        marginBottom: 8,
    },
    blocksLoading: {
        textAlign: 'center',
        paddingVertical: 8,
    },
    blocksContainer: {
        gap: 8,
        marginTop: 4,
    },
});

export default DailyLogPage;
