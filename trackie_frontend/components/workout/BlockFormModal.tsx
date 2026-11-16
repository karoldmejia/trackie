import { ThemedText } from '@/components/ThemedText';
import { workoutService, MetricBlockType, WorkoutBlockTemplate } from '@/services/workoutService';
import { theme } from '@/theme';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { FormInput } from '../FormInput';
import { FormSelect } from '../FormSelect';

interface BlockFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSaved: () => void;
    workoutId?: string;
    mode: 'create' | 'edit';
    initialData?: WorkoutBlockTemplate | null;
}

const BLOCK_KIND_OPTIONS = [
    { label: 'Warmup', value: 'warmup' },
    { label: 'Interval', value: 'interval' },
    { label: 'Strength', value: 'strength' },
    { label: 'Cooldown', value: 'cooldown' },
    { label: 'Otro', value: 'other' },
];

const METRIC_TYPE_OPTIONS = [
    { label: 'Distancia', value: 'distance' },
    { label: 'Duración', value: 'duration' },
    { label: 'Reps', value: 'reps' },
];

export const BlockFormModal: React.FC<BlockFormModalProps> = ({
    visible,
    onClose,
    onSaved,
    workoutId,
    mode,
    initialData,
}) => {
    const [name, setName] = useState('');
    const [kind, setKind] = useState('interval');
    const [rounds, setRounds] = useState('1');
    const [metricType, setMetricType] = useState<MetricBlockType>('duration');
    const [targetDistanceMeters, setTargetDistanceMeters] = useState('0');
    const [targetDurationSeconds, setTargetDurationSeconds] = useState('0');
    const [targetReps, setTargetReps] = useState('0');
    const [order, setOrder] = useState('0');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && initialData) {
                setName(initialData.name);
                setKind(initialData.kind || 'interval');
                setRounds(String(initialData.rounds ?? 1));
                setMetricType(initialData.metricType ?? 'duration');
                setTargetDistanceMeters(String(initialData.targetDistanceMeters ?? 0));
                setTargetDurationSeconds(String(initialData.targetDurationSeconds ?? 0));
                setTargetReps(String(initialData.targetReps ?? 0));
                setOrder(String(initialData.order ?? 0));
            } else {
                setName('');
                setKind('interval');
                setRounds('1');
                setMetricType('duration');
                setTargetDistanceMeters('0');
                setTargetDurationSeconds('0');
                setTargetReps('0');
                setOrder('0');
            }
            setIsSubmitting(false);
        }
    }, [visible, mode, initialData]);

    const handleSubmit = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            Alert.alert('Falta el nombre', 'Escribe un nombre para el bloque.');
            return;
        }
        const roundsNumber = Math.max(1, parseInt(rounds) || 1);
        const targetNumber = (value: string) => {
            const parsed = parseFloat(value);
            return isNaN(parsed) || parsed < 0 ? 0 : parsed;
        };

        // Solo el target de la métrica activa viaja al backend
        const dto = {
            name: trimmedName,
            kind,
            rounds: roundsNumber,
            metricType,
            targetDistanceMeters: metricType === 'distance' ? targetNumber(targetDistanceMeters) : undefined,
            targetDurationSeconds: metricType === 'duration' ? Math.round(targetNumber(targetDurationSeconds)) : undefined,
            targetReps: metricType === 'reps' ? Math.round(targetNumber(targetReps)) : undefined,
            order: parseInt(order) || 0,
        };

        setIsSubmitting(true);
        try {
            if (mode === 'edit' && initialData) {
                await workoutService.updateBlockTemplate(initialData.id, dto);
            } else {
                if (!workoutId) {
                    Alert.alert('Error', 'No se indicó el workout del bloque.');
                    setIsSubmitting(false);
                    return;
                }
                await workoutService.createBlockTemplate({ ...dto, workoutId });
            }
            onSaved();
            onClose();
        } catch (error: any) {
            const backendMessage = error?.response?.data?.message;
            const text = Array.isArray(backendMessage) ? backendMessage.join('\n') : backendMessage;
            Alert.alert(
                mode === 'edit' ? 'No se pudo guardar el bloque' : 'No se pudo crear el bloque',
                text ?? 'Error desconocido. Intenta de nuevo.',
            );
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
                        {mode === 'edit' ? 'EDITAR BLOQUE' : 'NUEVO BLOQUE'}
                    </ThemedText>

                    <ScrollView keyboardShouldPersistTaps="handled">
                        <View style={styles.fullRow}>
                            <FormInput
                                icon="Tag"
                                placeholder="Nombre del bloque (ej. Sprint 400m)"
                                value={name}
                                onChangeText={setName}
                                rounded={false}
                            />
                        </View>

                        <View style={styles.fullRow}>
                            <FormSelect
                                icon="ListFilter"
                                placeholder="Tipo de bloque"
                                value={kind}
                                options={BLOCK_KIND_OPTIONS}
                                onSelect={setKind}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={styles.halfColumn}>
                                <FormInput
                                    icon="Layers"
                                    placeholder="Rondas"
                                    value={rounds}
                                    onChangeText={setRounds}
                                    keyboardType="numeric"
                                    rounded={false}
                                />
                            </View>
                            <View style={styles.halfColumn}>
                                <FormInput
                                    icon="ArrowUpDown"
                                    placeholder="Orden"
                                    value={order}
                                    onChangeText={setOrder}
                                    keyboardType="numeric"
                                    rounded={false}
                                />
                            </View>
                        </View>

                        <View style={styles.fullRow}>
                            <FormSelect
                                icon="Gauge"
                                placeholder="Métrica"
                                value={metricType}
                                options={METRIC_TYPE_OPTIONS}
                                onSelect={(value) => setMetricType(value as MetricBlockType)}
                            />
                        </View>

                        {metricType === 'distance' && (
                            <View style={styles.fullRow}>
                                <FormInput
                                    icon="Ruler"
                                    placeholder="Distancia objetivo (km)"
                                    value={targetDistanceMeters}
                                    onChangeText={setTargetDistanceMeters}
                                    keyboardType="numeric"
                                    rounded={false}
                                />
                            </View>
                        )}
                        {metricType === 'duration' && (
                            <View style={styles.fullRow}>
                                <FormInput
                                    icon="Clock"
                                    placeholder="Duración objetivo (min)"
                                    value={targetDurationSeconds}
                                    onChangeText={setTargetDurationSeconds}
                                    keyboardType="numeric"
                                    rounded={false}
                                />
                            </View>
                        )}
                        {metricType === 'reps' && (
                            <View style={styles.fullRow}>
                                <FormInput
                                    icon="Repeat2"
                                    placeholder="Reps objetivo"
                                    value={targetReps}
                                    onChangeText={setTargetReps}
                                    keyboardType="numeric"
                                    rounded={false}
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                        >
                            <ThemedText variant="semiBold" size={14} color={theme.colors.white}>
                                {isSubmitting
                                    ? (mode === 'edit' ? 'Guardando...' : 'Creando...')
                                    : (mode === 'edit' ? 'Guardar cambios' : 'Crear bloque')}
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
    row: {
        flexDirection: 'row',
        marginBottom: 10,
        gap: 10,
    },
    halfColumn: {
        flex: 1,
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
