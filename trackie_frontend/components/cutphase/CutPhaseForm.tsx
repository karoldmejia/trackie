import { FormInput } from '@/components/FormInput';
import { FormSelect } from '@/components/FormSelect';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { CreateCutPhaseDto } from '@/services/cutPhaseService';
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
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

interface CutPhaseFormProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCutPhaseDto) => Promise<void>;
}

const CUT_DURATION_OPTIONS = [
    { label: '4 semanas', value: '4' },
    { label: '6 semanas', value: '6' },
    { label: '8 semanas', value: '8' },
    { label: '10 semanas', value: '10' },
    { label: '12 semanas', value: '12' },
    { label: '14 semanas', value: '14' },
    { label: '16 semanas', value: '16' },
];

const WORKOUTS_PER_WEEK_OPTIONS = [
    { label: '4 días', value: '4' },
    { label: '5 días', value: '5' },
    { label: '6 días', value: '6' },
    { label: '7 días', value: '7' },
];

export const CutPhaseForm: React.FC<CutPhaseFormProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const [startDate, setStartDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [durationWeeks, setDurationWeeks] = useState('8');
    const [targetCalories, setTargetCalories] = useState('');
    const [targetProtein, setTargetProtein] = useState('');
    const [targetSteps, setTargetSteps] = useState('');
    const [targetWater, setTargetWater] = useState('');
    const [workoutsPerWeek, setWorkoutsPerWeek] = useState('4');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const slideAnim = useRef(new Animated.Value(0)).current;
    const screenHeight = Dimensions.get('window').height;
    const { keyboardHeight, keyboardShown } = useKeyboard();

    useEffect(() => {
        if (visible) {
            // Resetear formulario
            setStartDate(new Date());
            setDurationWeeks('8');
            setTargetCalories('');
            setTargetProtein('');
            setTargetSteps('');
            setTargetWater('');
            setWorkoutsPerWeek('4');
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

    const handleSubmit = async () => {
        // Validaciones
        const calories = parseFloat(targetCalories);
        const protein = parseFloat(targetProtein);
        const steps = parseInt(targetSteps);
        const water = parseFloat(targetWater);
        const weeks = parseInt(durationWeeks);
        const workouts = parseInt(workoutsPerWeek);

        if (!targetCalories || isNaN(calories) || calories <= 0) {
            alert('Por favor ingresa un objetivo de calorías válido');
            return;
        }

        if (!targetProtein || isNaN(protein) || protein <= 0) {
            alert('Por favor ingresa un objetivo de proteína válido');
            return;
        }

        if (!targetSteps || isNaN(steps) || steps <= 0) {
            alert('Por favor ingresa un objetivo de pasos válido');
            return;
        }

        if (!targetWater || isNaN(water) || water <= 0) {
            alert('Por favor ingresa un objetivo de agua válido');
            return;
        }

        const endDate = calculateEndDate(startDate, weeks);

        const data: CreateCutPhaseDto = {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            totalWeeks: weeks, 
            targetCalories: calories,
            targetProtein: protein,
            targetSteps: steps,
            targetWater: water,
            workoutsPerWeek: workouts,
            isActive: true,
        };

        setIsSubmitting(true);
        try {
            await onSubmit(data);
            handleClose();
        } catch (error) {
            console.error('Error creating cut phase:', error);
            alert('Error al crear la etapa. Por favor intenta de nuevo.');
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
                            ? screenHeight * 0.6 + keyboardHeight
                            : screenHeight * 0.6
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
                        NUEVA ETAPA DE CUT
                    </ThemedText>

                    <View style={styles.formContainer}>
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

                        {/* Separador */}
                        <View style={styles.divider}>
                            <ThemedText variant="medium" size={11} color={theme.colors.textLight}>
                                OBJETIVOS DIARIOS
                            </ThemedText>
                        </View>

                        {/* Fila 3: Calorías y Proteína */}
                        <View style={styles.row}>
                            <View style={styles.halfColumn}>
                                <FormInput
                                    icon="Flame"
                                    placeholder="Calorías"
                                    value={targetCalories}
                                    onChangeText={setTargetCalories}
                                    keyboardType="numeric"
                                    rounded={false}
                                    containerStyle={styles.topLeftInput}
                                />
                            </View>
                            <View style={styles.halfColumn}>
                                <FormInput
                                    icon="Beef"
                                    placeholder="Proteína"
                                    value={targetProtein}
                                    onChangeText={setTargetProtein}
                                    keyboardType="numeric"
                                    rounded={false}
                                    containerStyle={styles.topRightInput}
                                />
                            </View>
                        </View>

                        {/* Fila 4: Pasos y Agua */}
                        <View style={styles.row}>
                            <View style={styles.halfColumn}>
                                <FormInput
                                    icon="Footprints"
                                    placeholder="Pasos"
                                    value={targetSteps}
                                    onChangeText={setTargetSteps}
                                    keyboardType="numeric"
                                    rounded={false}
                                    containerStyle={styles.bottomLeftInput}
                                />
                            </View>
                            <View style={styles.halfColumn}>
                                <FormInput
                                    icon="Droplet"
                                    placeholder="Agua"
                                    value={targetWater}
                                    onChangeText={setTargetWater}
                                    keyboardType="numeric"
                                    rounded={false}
                                    containerStyle={styles.bottomRightInput}
                                />
                            </View>
                        </View>

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
                                {isSubmitting ? 'Creando...' : 'Crear etapa'}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
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
    divider: {
        alignItems: 'center',
        marginVertical: 5,
        paddingVertical: 4,
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
    // Estilos para bordes redondeados de FormInput en filas
    topLeftInput: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    topRightInput: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    bottomLeftInput: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 0,
    },
    bottomRightInput: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 20,
    },
});

export default CutPhaseForm;