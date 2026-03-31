import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface SettingsButtonProps {
    onPress: () => void;
    icon: string;
    title: string;
    value: number | string;
    unit?: string;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({
    onPress,
    icon,
    title,
    value,
    unit = '',
}) => {
    const displayValue = typeof value === 'number' ? `${value} ${unit}` : value;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.leftSection}>
                <Icon
                    name={icon as any}
                    size={20}
                    color={theme.colors.placeholder}
                    backgroundColor={theme.colors.background}
                />
                <View>
                    <ThemedText variant="medium" size={14} color={theme.colors.text} style={styles.title}>
                        {title}
                    </ThemedText>
                    <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                        {displayValue}
                    </ThemedText>
                </View>
            </View>
            <Icon
                name="ChevronRight"
                size={18}
                color={theme.colors.textLight}
                backgroundColor="transparent"
                padding={0}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        backgroundColor: theme.colors.white,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        marginBottom: 2,
    },
});