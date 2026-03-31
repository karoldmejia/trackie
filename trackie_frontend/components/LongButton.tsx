import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface LongButtonProps {
    onPress?: () => void;
    text?: string;
    iconLeft?: string;
    iconRight?: string;
    backgroundColor?: string;
    textColor?: string;
    iconColor?: string;
}

export const LongButton: React.FC<LongButtonProps> = ({
    onPress,
    text = 'Ver galería de fotos',
    iconLeft = 'Image',
    iconRight = 'ChevronRight',
    backgroundColor = theme.colors.white,
    textColor = theme.colors.text,
    iconColor = theme.colors.textLight,
}) => {
    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.leftSection}>
                <Icon
                    name={iconLeft as any}
                    size={20}
                    color={iconColor}
                    backgroundColor={theme.colors.background}
                />
                <ThemedText variant="medium" size={14} color={textColor} style={styles.text}>
                    {text}
                </ThemedText>
            </View>
            <Icon
                name={iconRight as any}
                size={18}
                color={iconColor}
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
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    text: {
        letterSpacing: 0.3,
    },
});