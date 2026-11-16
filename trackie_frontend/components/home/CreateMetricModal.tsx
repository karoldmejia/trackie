import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { CreateMetricTypeDto, metricService } from '@/services/metricService';
import { theme } from '@/theme';
import React, { useState } from 'react';
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

interface CreateMetricModalProps {
    visible: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const VALUE_TYPE_OPTIONS = [
    { label: 'Número', value: 'number' },
    { label: 'Duración (minutos)', value: 'duration' },
    { label: 'Sí / No', value: 'boolean' },
];

// El backend solo acepta units del enum MetricTypeUnit (src/enums/metric-type-unit.enum.ts).
// No se admite texto libre: una unidad fuera del enum respondería 400.
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

// slugify simple: minúsculas, sin tildes, espacios -> '_', solo [a-z0-9_].
// El backend exige /^[a-z][a-z0-9_]*$/; si empieza por número se antepone 'm_'.
const slugifyKey = (label: string): string => {
    const base = label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '');
    if (!base) return '';
    return /^[a-z]/.test(base) ? base : `m_${base}`;
};

export const CreateMetricModal: React.FC<CreateMetricModalProps> = ({
    visible,
    onClose,
    onCreated,
}) => {
    const [label, setLabel] = useState('');
    const [unit, setUnit] = useState('');
    const [valueType, setValueType] = useState<'number' | 'duration' | 'boolean'>('number');
    const [isUniversal, setIsUniversal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reset = () => {
        setLabel('');
        setUnit('');
        setValueType('number');
        setIsUniversal(false);
        setIsSubmitting(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = async () => {
        const trimmedLabel = label.trim();
        const key = slugifyKey(trimmedLabel);

        if (!trimmedLabel) {
            Alert.alert('Falta el nombre', 'Escribe un nombre para la métrica.');
            return;
        }
        if (!key) {
            Alert.alert('Nombre inválido', 'No se pudo derivar una key válida a partir del nombre.');
            return;
        }

        const dto: CreateMetricTypeDto = {
            key,
            label: trimmedLabel,
            valueType,
            isUniversal,
        };
        if (unit) dto.unit = unit;

        setIsSubmitting(true);
        try {
            await metricService.createMetricType(dto);
            Alert.alert('Métrica creada', `"${trimmedLabel}" quedó disponible.`);
            reset();
            onCreated();
            onClose();
        } catch (error: any) {
            const status = error?.response?.status;
            const backendMessage = error?.response?.data?.message;
            const text = Array.isArray(backendMessage) ? backendMessage.join('\n') : backendMessage;

            if (status === 409) {
                Alert.alert('Ya existe', 'Ya existe una métrica con ese nombre');
            } else {
                Alert.alert('No se pudo crear la métrica', text ?? 'Error desconocido. Intenta de nuevo.');
            }
        } finally {
            setIsSubmitting(false);
        }
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
                        NUEVA MÉTRICA
                    </ThemedText>

                    <ScrollView keyboardShouldPersistTaps="handled">
                        {/* Nombre */}
                        <View style={styles.fullRow}>
                            <FormInput
                                icon="Tag"
                                placeholder="Nombre (ej. Meditación)"
                                value={label}
                                onChangeText={setLabel}
                                rounded={false}
                            />
                        </View>

                        {/* Tipo */}
                        <View style={styles.fullRow}>
                            <FormSelect
                                icon="ListFilter"
                                placeholder="Tipo"
                                value={valueType}
                                options={VALUE_TYPE_OPTIONS}
                                onSelect={(value) => setValueType(value as typeof valueType)}
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
                        <View style={styles.universalRow}>
                            <View style={styles.universalText}>
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

                        {/* Botón guardar */}
                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                        >
                            <ThemedText variant="semiBold" size={14} color={theme.colors.white}>
                                {isSubmitting ? 'Creando...' : 'Crear métrica'}
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleClose}
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
    universalRow: {
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
    universalText: {
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

export default CreateMetricModal;
