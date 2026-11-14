import { FormInput } from '@/components/FormInput';
import { FormSelect } from '@/components/FormSelect';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { CreateProgramDto, ProgramKind, ProgramMetricTargetInput } from '@/services/programService';
import { theme } from '@/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useKeyboard } from '@react-native-community/hooks';
import React, { useEffect, useRef, useState } from 'react';
import {
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

interface ProgramFormProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: CreateProgramDto) => Promise<void>;
}

const DIRECTION_OPTIONS = [
    { label: 'Máximo', value: 'at_most' },
    { label: 'Mínimo', value: 'at_least' },
    { label: 'Exacto', value: 'exact' },
];

type ProgramTargetFormRow = ProgramMetricTargetInput & { enabled: boolean };

const DEFAULT_TARGETS: ProgramTargetFormRow[] = [
    { key: 'calories',      target: 2000, direction: 'at_most',  weight: 0.30, isOptional: false, enabled: true },
    { key: 'protein',       target: 150,  direction: 'at_least', weight: 0.30, isOptional: false, enabled: true },
    { key: 'steps',         target: 8000, direction: 'at_least', weight: 0.25, isOptional: false, enabled: true },
    { key: 'water',         target: 2.5,  direction: 'at_least', weight: 0.10, isOptional: false, enabled: true },
    { key: 'workout_count', target: 1,    direction: 'at_least', weight: 0.05, isOptional: false, enabled: true },
];

const TARGET_LABELS: Record<string, string> = {
    calories: 'Calorías',
    protein: 'Proteína',
    steps: 'Pasos',
    water: 'Agua',
    workout_count: 'Entrenamientos',
};

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
}) => {
    const [name, setName] = useState('');
    const [kind, setKind] = useState<ProgramKind>('cut');
    const [startDate, setStartDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [durationWeeks, setDurationWeeks] = useState('8');
    const [workoutsPerWeek, setWorkoutsPerWeek] = useState('4');
    // Estado local de targets: `enabled` solo controla filas (no se envía al backend)
    const [targets, setTargets] = useState<ProgramTargetFormRow[]>(() => DEFAULT_TARGETS.map(t => ({ ...t })));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const slideAnim = useRef(new Animated.Value(0)).current;
    const screenHeight = Dimensions.get('window').height;
    const { keyboardHeight, keyboardShown } = useKeyboard();

    useEffect(() => {
        if (visible) {
            // Resetear formulario
            setStartDate(new Date());
            setName('');
            setKind('cut');
            setDurationWeeks('8');
            setWorkoutsPerWeek('4');
            setTargets(DEFAULT_TARGETS.map(t => ({ ...t })));
            setIsSubmitting(false);

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

    const handleSubmit = async () => {
        // Validaciones
        const weeks = parseInt(durationWeeks);
        const workouts = parseInt(workoutsPerWeek);

        if (!name.trim()) {
            alert('Por favor ingresa un nombre para el programa');
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
            totalWeeks: weeks,
            workoutsPerWeek: workouts || 0,
            isActive: true,
            targets: targetsPayload,
        };

        setIsSubmitting(true);
        try {
            await onSubmit(data);
            handleClose();
        } catch (error) {
            console.error('Error creating program:', error);
            alert('Error al crear el programa. Por favor intenta de nuevo.');
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
                        NUEVO PROGRAMA
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

                        {targets.map((target, index) => (
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
                                        {TARGET_LABELS[target.key]}
                                    </ThemedText>
                                </View>
                                <View
                                    style={!target.enabled && styles.targetRowDisabled}
                                    pointerEvents={target.enabled ? 'auto' : 'none'}
                                >
                                    <View style={styles.row}>
                                        <View style={styles.targetInputCol}>
                                            <FormInput
                                                icon={(TARGET_ICONS[target.key] ?? 'Target') as any}
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
                        ))}

                        {/* Botón Guardar */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                isSubmitting && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                        >
                            <ThemedText variant="semiBold" size={14} color={theme.colors.white}>
                                {isSubmitting ? 'Creando...' : 'Crear programa'}
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