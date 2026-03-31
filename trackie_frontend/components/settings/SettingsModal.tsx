import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (value: number) => void;
    title: string;
    currentValue: number;
    unit?: string;
    iconName: string;
    minValue?: number;
    maxValue?: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    visible,
    onClose,
    onSave,
    title,
    currentValue,
    unit = '',
    iconName,
    minValue = 0,
    maxValue = 10000,
}) => {
    const [value, setValue] = useState(currentValue.toString());

    const handleSave = () => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= minValue && numValue <= maxValue) {
            onSave(numValue);
            onClose();
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <View style={styles.header}>
                                    <View style={styles.headerLeft}>
                                        <Icon
                                            name={iconName as any}
                                            size={16}
                                            color={theme.colors.placeholder}
                                            backgroundColor={theme.colors.background}
                                        />
                                        <ThemedText variant="medium" size={16} color={theme.colors.text}>
                                            {title}
                                        </ThemedText>
                                    </View>
                                    <TouchableOpacity onPress={onClose}>
                                        <Icon
                                            name="X"
                                            size={18}
                                            color={theme.colors.textLight}
                                            backgroundColor="transparent"
                                            padding={0}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        value={value}
                                        onChangeText={setValue}
                                        keyboardType="numeric"
                                        placeholder={`Ingresa ${title.toLowerCase()}`}
                                        placeholderTextColor={theme.colors.textLight}
                                    />
                                    {unit && (
                                        <ThemedText variant="regular" size={14} color={theme.colors.textLight} style={styles.unit}>
                                            {unit}
                                        </ThemedText>
                                    )}
                                </View>

                                <View style={styles.infoContainer}>
                                    <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                        Valor actual: {currentValue} {unit}
                                    </ThemedText>
                                    <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                                        Rango: {minValue} - {maxValue} {unit}
                                    </ThemedText>
                                </View>

                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={handleSave}
                                    activeOpacity={0.8}
                                >
                                    <ThemedText variant="medium" size={14} color={theme.colors.white}>
                                        Guardar
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: theme.colors.white,
        borderRadius: 24,
        overflow: 'hidden',
    },
    modalContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        marginBottom: 16,
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.colors.text,
    },
    unit: {
        paddingRight: 16,
    },
    infoContainer: {
        marginBottom: 20,
        gap: 4,
    },
    saveButton: {
        backgroundColor: theme.colors.primary || '#4CAF50',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});