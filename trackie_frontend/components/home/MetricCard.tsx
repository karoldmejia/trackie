import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface MetricCardProps {
    title: string;
    value: number;
    unit?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    unit
}) => {
    return (
        <View style={styles.card}>
            <ThemedText
                variant="medium"
                size={11}
                color={theme.colors.textLight}
                style={styles.title}
            >
                {title}
            </ThemedText>
            <ThemedText
                variant="bold"
                size={18}
                color={theme.colors.text}
                style={styles.value}
            >
                {value}{unit && ` ${unit}`}
            </ThemedText>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '20%',
        backgroundColor: 'transparent',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        elevation: 2,
        shadowColor: 'transparent'
    },
    title: {
        textAlign: 'center',
    },
    value: {
        textAlign: 'center',
    },
});