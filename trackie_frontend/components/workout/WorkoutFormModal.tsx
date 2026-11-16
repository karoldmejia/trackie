import { ThemedText } from '@/components/ThemedText';
import { workoutService } from '@/services/workoutService';
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

interface WorkoutFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSaved: () => void;
    mode: 'create' | 'edit';
    routineId?: string;
    initialData?: {
        id: string;
        name: string;
        type: string;
        order?: number;
    } | null;
}

// El backend acepta cualquier string (<=50); ofrecemos valores comunes.
const TYPE_OPTIONS = [
    { label: 'Cardio', value: 'cardio' },
    { label: 'Fuerza', value: 'strength' },
    { label: 'Movilidad', value: 'mobility' },
    { label: 'Otro', value: 'other' },
];

export const WorkoutFormModal: React.FC<WorkoutFormModalProps> = ({
    visible,
    onClose,
    onSaved,
    mode,
    routineId,
    initialData,
}) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('cardio');
    const [order, setOrder] = useState('0');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && initialData) {
                setName(initialData.name);
                setType(initialData.type || 'cardio');
                setOrder(String(initialData.order ?? 0));
            } else {
                setName('');
                setType('cardio');
                setOrder('0');
            }
            setIsSubmitting(false);
        }
    }, [visible, mode, initialData]);

    const handleSubmit = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            Alert.alert('Falta el nombre', 'Escribe un nombre para el workout.');
            return;
        }
        const orderNumber = parseInt(order);

        setIsSubmitting(true);
        try {
            if (mode === 'edit' && initialData) {
                await workoutService.updateTemplate(initialData.id, {
                    name: trimmedName,
                    type,
                    order: isNaN(orderNumber) ? 0 : orderNumber,
                });
            } else {
                if (!routineId) {
                    Alert.alert('Error', 'No se indicó la rutina del workout.');
                    setIsSubmitting(false);
                    return;
                }
                await workoutService.createTemplate({
                    routineId,
                    name: trimmedName,
                    type,
                    order: isNaN(orderNumber) ? 0 : orderNumber,
                });
            }
            onSaved();
            onClose();
        } catch (error: any) {
            const backendMessage = error?.response?.data?.message;
            const text = Array.isArray(backendMessage) ? backendMessage.join('\n') : backendMessage;
            Alert.alert(
                mode === 'edit' ? 'No se pudo guardar el workout' : 'No se pudo crear el workout',
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
                        {mode === 'edit' ? 'EDITAR WORKOUT' : 'NUEVO WORKOUT'}
                    </ThemedText>

                    <ScrollView keyboardShouldPersistTaps="handled">
                        <View style={styles.fullRow}>
                            <FormInput
                                icon="Tag"
                                placeholder="Nombre del workout (ej. Intervalos 5x400)"
                                value={name}
                                onChangeText={setName}
                                rounded={false}
                            />
                        </View>

                        <View style={styles.fullRow}>
                            <FormSelect
                                icon="ListFilter"
                                placeholder="Tipo"
                                value={type}
                                options={TYPE_OPTIONS}
                                onSelect={setType}
                            />
                        </View>

                        <View style={styles.fullRow}>
                            <FormInput
                                icon="ArrowUpDown"
                                placeholder="Orden (0 = primero)"
                                value={order}
                                onChangeText={setOrder}
                                keyboardType="numeric"
                                rounded={false}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                        >
                            <ThemedText variant="semiBold" size={14} color={theme.colors.white}>
                                {isSubmitting
                                    ? (mode === 'edit' ? 'Guardando...' : 'Creando...')
                                    : (mode === 'edit' ? 'Guardar cambios' : 'Crear workout')}
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
