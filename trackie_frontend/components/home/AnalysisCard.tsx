import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type LucideIconName = keyof typeof import('lucide-react-native');

interface AnalysisCardProps {
    icon: LucideIconName;
    title: string;
    value: string | number;
    iconColor?: string;
    backgroundColor?: string;
    containerStyle?: any;
    valueColor?: string;
    titleColor?: string;

}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({
    icon,
    title,
    value,
    iconColor,
    backgroundColor = theme.colors.white,
    containerStyle,
    valueColor,
    titleColor,
}) => {
    const finalIconColor = iconColor || theme.colors.textLight;
    const finalValueColor = valueColor || theme.colors.text;

    return (
        <View style={[styles.container, { backgroundColor }, containerStyle]}>
            <View style={styles.iconContainer}>
                <Icon
                    name={icon}
                    size={24}
                    backgroundColor={theme.colors.background}
                    color={theme.colors.textLight}
                />
            </View>
            <View style={styles.textContainer}>
                <ThemedText
                    variant="medium"
                    size={10}
                    color={titleColor}
                    style={styles.title}
                >
                    {title}
                </ThemedText>
                <ThemedText
                    variant="bold"
                    size={16}
                    color={finalValueColor}
                    style={styles.value}
                >
                    {value}
                </ThemedText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.0,
        shadowRadius: 8,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        marginBottom: -5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        lineHeight: 32,
    },
});