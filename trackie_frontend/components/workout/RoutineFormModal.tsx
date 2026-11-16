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
    Switch,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { FormInput } from '../FormInput';

interface RoutineFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSaved: () => void;
    mode: 'create' | 'edit';
    initialData?: {
        id: string;
        name: string;
        isActive: boolean;
    } | null;
}

export const RoutineFormModal: React.FC<RoutineFormModalProps> = ({
    visible,
    onClose,
    onSaved,
    mode,
    initialData,
}) => {
    const [name, setName] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && initialData) {
                setName(initialData.name);
                setIsActive(initialData.isActive);
            } else {
                setName('');
                setIsActive(true);
            }
            setIsSubmitting(false);
        }
    }, [visible, mode, initialData]);

    const handleSubmit = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            Alert.alert('Falta el nombre', 'Escribe un nombre para la rutina.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (mode === 'edit' && initialData) {
                await workoutService.updateRoutine(initialData.id, { name: trimmedName, isActive });
            } else {
                await workoutService.createRoutine({ name: trimmedName, isActive: true });
            }
            onSaved();
            onClose();
        } catch (error: any) {
            const backendMessage = error?.response?.data?.message;
            const text = Array.isArray(backendMessage) ? backendMessage.join('\n') : backendMessage;
            Alert.alert(
                mode === 'edit' ? 'No se pudo guardar la rutina' : 'No se pudo crear la rutina',
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
                        {mode === 'edit' ? 'EDITAR RUTINA' : 'NUEVA RUTINA'}
                    </ThemedText>

                    <ScrollView keyboardShouldPersistTaps="handled">
                        <View style={styles.fullRow}>
                            <FormInput
                                icon="Tag"
                                placeholder="Nombre de la rutina"
                                value={name}
                                onChangeText={setName}
                                rounded={false}
                            />
                        </View>

                        {mode === 'edit' && (
                            <View style={styles.switchRow}>
                                <View style={styles.switchText}>
                                    <ThemedText variant="regular" size={14} color={theme.colors.text}>
                                        Rutina activa
                                    </ThemedText>
                                    <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                        Si se desactiva, no aparece en los selectores
                                    </ThemedText>
                                </View>
                                <Switch
                                    value={isActive}
                                    onValueChange={setIsActive}
                                    trackColor={{ false: theme.colors.background, true: theme.colors.primary }}
                                    thumbColor={theme.colors.white}
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
                                    : (mode === 'edit' ? 'Guardar cambios' : 'Crear rutina')}
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
