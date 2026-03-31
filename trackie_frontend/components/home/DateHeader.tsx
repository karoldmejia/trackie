import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface DateHeaderProps {
    date: string;
    onAddPress?: () => void;
    onEditPress?: () => void;
}

export const DateHeader: React.FC<DateHeaderProps> = ({
    date,
    onAddPress,
    onEditPress
}) => {

    const formatDisplayDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        
        const formatter = new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        return formatter.format(localDate);
    };

    return (
        <View style={styles.headerSection}>
            <View style={styles.dateSection}>
                <Icon
                    name="Calendar"
                    size={24}
                />
                <View style={styles.dateTexts}>
                    <ThemedText variant="bold" size={15} color={theme.colors.text}>
                        Hoy
                    </ThemedText>
                    <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                        {formatDisplayDate(date)}
                    </ThemedText>
                </View>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={onAddPress}>
                    <Icon
                        name="CirclePlus"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    dateSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateTexts: {
        gap: 2,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
    },
});