import { Icon } from '@/components/icon';
import { DailyLog, FormMetric, FormSchema, dailyLogService, getMetric } from '@/services/dailyLogService';
import { theme } from '@/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useKeyboard } from '@react-native-community/hooks';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, KeyboardAvoidingView, Modal, Platform, StyleSheet, Switch, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { FormInput } from '../FormInput';
import { ThemedText } from '../ThemedText';

/**
 * @deprecated Solo se mantiene exportado porque hooks/useDailyLogEditor.ts todavía
 * lo importa en su firma. El form ya no lo usa. Eliminar en F5.
 */
export enum WorkoutType {
    NONE = 'none',
    UPPER = 'upper',
    LOWER = 'lower',
    FULL = 'full',
    CARDIO = 'cardio',
}

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

interface DailyLogFormProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: {
        date: string;
        metrics: Record<string, number>;
    }) => void;
    initialData?: DailyLog;
    title?: string;
    hideDatePicker?: boolean;
}

export const DailyLogForm: React.FC<DailyLogFormProps> = ({
    visible,
    onClose,
    onSubmit,
    initialData,
    title = 'Registro ciario',
    hideDatePicker = false,
}) => {
    const getCurrentLocalDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = now.getDate();
        return new Date(year, month, day);
    };

    const [date, setDate] = useState(getCurrentLocalDate());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [schema, setSchema] = useState<FormSchema | null>(null);
    const [loadingSchema, setLoadingSchema] = useState(false);
    // Estado del form: clave = metric.key, valor = número.
    // Los inputs numéricos guardan NaN mientras están vacíos; NaN → 0 en el submit.
    const [values, setValues] = useState<Record<string, number>>({});

    const slideAnim = useRef(new Animated.Value(0)).current;
    const screenHeight = Dimensions.get('window').height;
    const { keyboardHeight, keyboardShown } = useKeyboard();

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

    // Inicializar valores cuando llega el schema (o cambia initialData)
    useEffect(() => {
        if (!schema) return;
        const initialValues: Record<string, number> = {};
        for (const metric of schema.metrics) {
            initialValues[metric.key] = initialData ? getMetric(initialData, metric.key) : 0;
        }
        setValues(initialValues);

        if (initialData?.date) {
            const [year, month, day] = initialData.date.split('-').map(Number);
            const initialDate = new Date(year, month - 1, day);
            if (!isNaN(initialDate.getTime())) {
                setDate(initialDate);
            }
        }
    }, [schema, initialData]);

    useEffect(() => {
        if (visible) {
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

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [screenHeight, 0],
    });

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

    // TODO(F5): availableToAdd se ignora en esta fase; no se implementa el
    // botón "Añadir métrica". El form solo muestra schema.metrics.

    const handleSubmit = () => {
        const metrics: Record<string, number> = {};
        for (const metric of getEditableMetrics(schema)) {
            const raw = values[metric.key];
            metrics[metric.key] = raw === undefined || isNaN(raw) ? 0 : raw;
        }
        onSubmit({
            date: formatDate(date),
            metrics,
        });
        handleClose();
    };

    const handleClose = () => {
        setDate(getCurrentLocalDate());
        setValues({});
        onClose();
    };

    const renderMetricInput = (metric: FormMetric) => {
        const value = values[metric.key];
        const icon = (METRIC_ICONS[metric.key] ?? 'Activity') as any;

        if (metric.valueType === 'boolean') {
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
        }

        const isDuration = metric.valueType === 'duration';
        const placeholder = isDuration
            ? `${metric.label} (${metric.unit ?? 'min'})`
            : metric.unit
                ? `${metric.label} (${metric.unit})`
                : metric.label;
        const displayValue = value === undefined || isNaN(value) ? '' : String(value);

        return (
            <View style={styles.metricRow} key={metric.key}>
                <FormInput
                    icon={icon}
                    placeholder={placeholder}
                    value={displayValue}
                    onChangeText={(text) => setNumericValue(metric.key, text)}
                    keyboardType="numeric"
                    rounded={false}
                />
            </View>
        );
    };

    if (!visible) return null;

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
                        transform: [{ translateY }],
                        height: keyboardShown
                            ? screenHeight * 0.6 + keyboardHeight
                            : screenHeight * 0.6
                    }
                ]}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                    style={styles.keyboardView}
                >
                    <View style={styles.handle} />

                    <ThemedText
                        variant="medium"
                        size={12}
                        color={theme.colors.textLight}
                        style={styles.title}
                    >
                        {title.toUpperCase()}
                    </ThemedText>

                    <View style={styles.formContainer}>
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

                        {/* Métricas dinámicas según el FormSchema del backend (solo editables) */}
                        {getEditableMetrics(schema).map(renderMetricInput)}

                        {/* TODO(F5): La sección de workout (WorkoutType / FormSelect) se
                            elimina hasta que se migren workout_sessions. */}

                        {/* Botón de guardar */}
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            activeOpacity={0.8}
                        >
                            <ThemedText variant="semiBold" size={14} color={theme.colors.white}>
                                Guardar
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
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
        paddingBottom: 30,
    },
    dateRow: {
        marginBottom: 16,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
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
    metricRow: {
        marginBottom: 12,
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
    submitButton: {
        backgroundColor: theme.colors.primary || '#4CAF50',
        borderRadius: 20,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
});
