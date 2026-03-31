import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

interface WeekDaySelectModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (value: number) => void;
    currentValue: number;
}

const WEEK_DAYS = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
];

export const WeekDaySelectModal: React.FC<WeekDaySelectModalProps> = ({
    visible,
    onClose,
    onSave,
    currentValue,
}) => {
    const handleSelect = (value: number) => {
        onSave(value);
        onClose();
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
                                            name="Calendar"
                                            size={20}
                                            color={theme.colors.primary}
                                            backgroundColor="transparent"
                                            padding={0}
                                        />
                                        <ThemedText variant="medium" size={16} color={theme.colors.text}>
                                            Inicio de semana
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

                                <View style={styles.optionsContainer}>
                                    {WEEK_DAYS.map((day) => (
                                        <TouchableOpacity
                                            key={day.value}
                                            style={[
                                                styles.option,
                                                currentValue === day.value && styles.optionSelected
                                            ]}
                                            onPress={() => handleSelect(day.value)}
                                            activeOpacity={0.7}
                                        >
                                            <ThemedText
                                                variant="regular"
                                                size={16}
                                                color={currentValue === day.value ? theme.colors.primary : theme.colors.text}
                                            >
                                                {day.label}
                                            </ThemedText>
                                            {currentValue === day.value && (
                                                <Icon
                                                    name="Check"
                                                    size={18}
                                                    color={theme.colors.primary}
                                                    backgroundColor="transparent"
                                                    padding={0}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
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
    optionsContainer: {
        gap: 8,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    optionSelected: {
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
});