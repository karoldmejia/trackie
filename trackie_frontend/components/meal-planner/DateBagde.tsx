import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DateBadgeProps {
    date: string;
}

export const DateBadge: React.FC<DateBadgeProps> = ({ date }) => {
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    const dayNumber = dateObj.getDate();
    const monthName = dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
    
    return (
        <View style={styles.container}>
            <Text style={styles.dayText}>{dayNumber}</Text>
            <Text style={styles.monthText}>{monthName}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#000000',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 40,
        maxHeight: 40,
    },
    dayText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: -2
    },
    monthText: {
        fontSize: 8,
        fontWeight: '600',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
});