import { Icon } from '@/components/icon';
import { theme } from '@/theme';
import * as LucideIcons from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

// Importar el tipo correctamente
type LucideIconName = keyof typeof LucideIcons;

interface Option {
    label: string;
    value: string;
}

interface FormSelectProps {
    icon: LucideIconName;  // Ahora TypeScript reconoce el tipo
    placeholder: string;
    value: string;
    options: Option[];
    onSelect: (value: string) => void;
}

export const FormSelect: React.FC<FormSelectProps> = ({
    icon,
    placeholder,
    value,
    options,
    onSelect,
}) => {
    const [modalVisible, setModalVisible] = useState(false);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <>
            <TouchableOpacity 
                style={styles.container} 
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <View style={styles.iconContainer}>
                    <Icon 
                        name={icon} 
                        size={18} 
                        color={theme.colors.placeholder}
                        backgroundColor="transparent"
                        padding={0}
                    />
                </View>
                <View style={styles.textContainer}>
                    <ThemedText 
                        variant="regular" 
                        size={14} 
                        color={selectedOption ? theme.colors.text : theme.colors.placeholder}
                    >
                        {selectedOption ? selectedOption.label : placeholder}
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

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText variant="medium" size={14}>
                                {placeholder.toLocaleUpperCase()}
                            </ThemedText>
                        </View>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.option,
                                    value === option.value && styles.optionSelected
                                ]}
                                onPress={() => {
                                    onSelect(option.value);
                                    setModalVisible(false);
                                }}
                            >
                                <ThemedText 
                                    variant="regular" 
                                    size={16}
                                    color={value === option.value ? theme.colors.error : theme.colors.text}
                                >
                                    {option.label}
                                </ThemedText>
                                {value === option.value && (
                                    <Icon 
                                        name="Check" 
                                        size={20} 
                                        color={theme.colors.error}
                                        backgroundColor="transparent"
                                        padding={0}
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    iconContainer: {
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        marginBottom: 15,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        backgroundColor: 'transparent'
    },
    optionSelected: {
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
});