import { Icon } from '@/components/icon';
import { theme } from '@/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { ThemedText } from '../ThemedText';

interface SearchModalProps {
    visible: boolean;
    onClose: () => void;
    onSearch: (date: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
    visible,
    onClose,
    onSearch,
}) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (date: Date) => {
        const formatter = new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        return formatter.format(date);
    };

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleSearch = () => {
        onSearch(formatDate(selectedDate));
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
                                    <ThemedText variant="medium" size={14} color={theme.colors.textLight}>
                                    Buscar por fecha
                                    </ThemedText>
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

                                <TouchableOpacity 
                                    style={styles.dateButton}
                                    onPress={() => setShowDatePicker(true)}
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
                                        size={15} 
                                        color={theme.colors.textLight}
                                        style={styles.dateText}
                                    >
                                        {formatDisplayDate(selectedDate)}
                                    </ThemedText>
                                    <Icon 
                                        name="ChevronDown" 
                                        size={20} 
                                        color={theme.colors.placeholder}
                                        backgroundColor="transparent"
                                        padding={0}
                                    />
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={selectedDate}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={handleDateChange}
                                    />
                                )}

                                <TouchableOpacity 
                                    style={styles.searchButton}
                                    onPress={handleSearch}
                                    activeOpacity={0.8}
                                >
                                    <ThemedText variant="medium" size={14} color={theme.colors.white}>
                                        Buscar
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
        marginTop: 10
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    dateText: {
        flex: 1,
        marginLeft: 12,
    },
    searchButton: {
        backgroundColor: theme.colors.primary || '#4CAF50',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});