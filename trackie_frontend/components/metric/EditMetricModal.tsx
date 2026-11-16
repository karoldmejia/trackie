import { ThemedText } from '@/components/ThemedText';
import { MetricTypeItem, metricService } from '@/services/metricService';
import { theme } from '@/theme';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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
import { FormInput } from '../FormInput';
import { FormSelect } from '../FormSelect';

interface EditMetricModalProps {
    visible: boolean;
    metric: MetricTypeItem | null;
    onClose: () => void;
    onSaved: () => void;
}

// El backend solo acepta units del enum MetricTypeUnit (src/enums/metric-type-unit.enum.ts).
const UNIT_OPTIONS = [
    { label: 'Sin unidad', value: '' },
    { label: 'kcal', value: 'kcal' },
    { label: 'min', value: 'min' },
    { label: 'pasos', value: 'pasos' },
    { label: 'litros', value: 'litros' },
    { label: 'gramos', value: 'gramos' },
    { label: 'kg', value: 'kg' },
    { label: 'cm', value: 'cm' },
    { label: 'porcentaje', value: 'percent' },
    { label: 'km', value: 'km' },
    { label: 'unidad', value: 'unidad' },
];

const VALUE_TYPE_LABELS: Record<string, string> = {
    number: 'Número',
    duration: 'Duración (minutos)',
    boolean: 'Sí / No',
};

export const EditMetricModal: React.FC<EditMetricModalProps> = ({
    visible,
    metric,
    onClose,
    onSaved,
}) => {
    const [label, setLabel] = useState('');
    const [unit, setUnit] = useState('');
    const [isUniversal, setIsUniversal] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (metric) {
            setLabel(metric.label);
            setUnit(metric.unit ?? '');
            setIsUniversal(metric.isUniversal);
            setIsActive(metric.isActive);
            setIsSubmitting(false);
        }
    }, [metric]);

    const handleSubmit = async () => {
        if (!metric) return;

        const trimmedLabel = label.trim();
        if (!trimmedLabel) {
            Alert.alert('Falta el nombre', 'Escribe un nombre para la métrica.');
            return;
        }

        setIsSubmitting(true);
        try {
            await metricService.updateMetricType(metric.id, {
                label: trimmedLabel,
                unit: unit || undefined,
                isUniversal,
                isActive,
            });
            onSaved();
            onClose();
        } catch (error: any) {
            const backendMessage = error?.response?.data?.message;
            const text = Array.isArray(backendMessage) ? backendMessage.join('\n') : backendMessage;
            Alert.alert('No se pudo guardar', text ?? 'Error desconocido. Intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!visible || !metric) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.container}>
                    <View style={styles.handle} />

                    <ThemedText
                        variant="medium"
                        size={12}
                        color={theme.colors.textLight}
                        style={styles.title}
                    >
                        EDITAR MÉTRICA
                    </ThemedText>

                    <ScrollView keyboardShouldPersistTaps="handled">
                        {/* key y valueType son inmutables: solo texto */}
                        <View style={styles.readonlyRow}>
                            <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                Key
                            </ThemedText>
                            <ThemedText variant="medium" size={13} color={theme.colors.text}>
                                {metric.key}
                            </ThemedText>
                        </View>
                        <View style={styles.readonlyRow}>
                            <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                Tipo
                            </ThemedText>
                            <ThemedText variant="medium" size={13} color={theme.colors.text}>
                                {VALUE_TYPE_LABELS[metric.valueType] ?? metric.valueType}
                            </ThemedText>
                        </View>

                        {/* Label */}
                        <View style={styles.fullRow}>
                            <FormInput
                                icon="Tag"
                                placeholder="Nombre"
                                value={label}
                                onChangeText={setLabel}
                                rounded={false}
                            />
                        </View>

                        {/* Unidad */}
                        <View style={styles.fullRow}>
                            <FormSelect
                                icon="Ruler"
                                placeholder="Unidad (opcional)"
                                value={unit}
                                options={UNIT_OPTIONS}
                                onSelect={setUnit}
                            />
                        </View>

                        {/* Universal */}
                        <View style={styles.switchRow}>
                            <View style={styles.switchText}>
                                <ThemedText variant="regular" size={14} color={theme.colors.text}>
                                    Métrica universal
                                </ThemedText>
                                <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                    Aparece siempre en el registro diario
                                </ThemedText>
                            </View>
                            <Switch
                                value={isUniversal}
                                onValueChange={setIsUniversal}
                                trackColor={{ false: theme.colors.background, true: theme.colors.primary }}
                                thumbColor={theme.colors.white}
                            />
                        </View>

                        {/* Activa */}
                        <View style={styles.switchRow}>
                            <View style={styles.switchText}>
                                <ThemedText variant="regular" size={14} color={theme.colors.text}>
                                    Métrica activa
                                </ThemedText>
                                <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                    Si se desactiva, desaparece del registro diario
                                </ThemedText>
                            </View>
                            <Switch
                                value={isActive}
                                onValueChange={setIsActive}
                                trackColor={{ false: theme.colors.background, true: theme.colors.primary }}
                                thumbColor={theme.colors.white}
                            />
                        </View>

                        {/* Guardar */}
                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                        >
                            <ThemedText variant="semiBold" size={14} color={theme.colors.white}>
                                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={isSubmitting}
                            activeOpacity={0.7}
                        >
                            <ThemedText variant="semiBold" size={14} color={theme.colors.textLight}>
                                Cancelar
                            </ThemedText>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 30,
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
    },
    fullRow: {
        marginBottom: 10,
    },
    readonlyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 8,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
        gap: 12,
    },
    switchText: {
        flex: 1,
        gap: 2,
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
        opacity: 0.5,
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
});
