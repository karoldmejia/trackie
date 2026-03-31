import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type LucideIconName = keyof typeof import('lucide-react-native');

interface WeightMetricCardProps {
    title: string;
    value: number | string;
    unit?: string;
    iconName?: LucideIconName;
    onPress?: () => void;
    backgroundColor?: string;
    textColor?: string;
    valueColor?: string;
    iconColor?: string;
}

export const WeightMetricCard: React.FC<WeightMetricCardProps> = ({
    title,
    value,
    unit = '',
    iconName = 'Activity',
    onPress,
    backgroundColor = theme.colors.white,
    textColor = theme.colors.text,
    valueColor = theme.colors.text,
    iconColor = theme.colors.textLight,
}) => {
    const displayValue = typeof value === 'number' ? value.toString() : value;
    const displayText = unit ? `${displayValue} ${unit}` : displayValue;

    return (
        <TouchableOpacity 
            style={[styles.container, { backgroundColor }]} 
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress}
        >
            {/* Header con título e ícono */}
            <View style={styles.header}>
                <ThemedText variant="semiBold" size={14} color={textColor}>
                    {title}
                </ThemedText>
                <Icon
                    name={iconName}
                    size={18}
                    color={iconColor}
                    backgroundColor={theme.colors.background}
                />
            </View>

            {/* Valor grande */}
            <ThemedText variant="bold" size={22} color={valueColor} style={styles.value}>
                {displayText}
            </ThemedText>

            {/* Footer con check y flecha */}
            <View style={styles.footer}>
                <View style={styles.checkContainer}>
                    <ThemedText variant="medium" size={12} color={theme.colors.textLight}>
                        Check
                    </ThemedText>
                </View>
                <Icon
                    name="ChevronRight"
                    size={16}
                    color={theme.colors.textLight}
                    backgroundColor="transparent"
                    padding={0}
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        minHeight: 130,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    value: {
        marginVertical: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    checkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
});