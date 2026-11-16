import { Icon } from '@/components/icon';
import { theme } from '@/theme';
import React from 'react';
import { ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';

type LucideIconName = keyof typeof import('lucide-react-native');

interface StatCardProps {
    title: string;
    value: number;
    unit: string;
    backgroundImage: any;
    subtitle?: string;
    onPress?: () => void;
    headerIcon?: LucideIconName;
    headerIconColor?: string;
    headerIconSize?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    unit,
    backgroundImage,
    subtitle,
    onPress,
    headerIcon = 'MoreHorizontal',
    headerIconColor,
    headerIconSize = 18,
}) => {
    const displayValue = value;
    
    const cardContent = (
        <View style={styles.card}>
            <ImageBackground 
                source={backgroundImage} 
                style={styles.backgroundImage}
                imageStyle={styles.backgroundImageStyle}
            >
                <View style={styles.content}>
                    {/* Header con título e ícono */}
                    <View style={styles.header}>
                        <ThemedText variant="medium" size={14} color={theme.colors.white}>
                            {title}
                        </ThemedText>
                        <Icon
                            name={headerIcon}
                            size={headerIconSize}
                            color={headerIconColor ?? theme.colors.text}
                        />
                    </View>

                    {/* Valor principal */}
                    <View style={styles.valueContainer}>
                        <ThemedText variant="bold" size={24} color={theme.colors.white}>
                            {Math.round(displayValue).toLocaleString()}
                        </ThemedText>
                        <ThemedText 
                            variant="medium" 
                            size={16} 
                            color={theme.colors.white}
                            style={styles.unit}
                        >
                            {unit}
                        </ThemedText>
                    </View>

                    {/* Subtítulo (ej. "3 semanas restantes" o "5 workouts esta semana") */}
                    {subtitle && (
                        <View style={styles.differenceContainer}>
                            <ThemedText
                                variant="medium"
                                size={11}
                                color={theme.colors.white}
                                style={[styles.differenceText, styles.subtitleText]}
                                numberOfLines={2}
                            >
                                {subtitle}
                            </ThemedText>
                            <Icon
                                name="ChevronRight"
                                size={16}
                                color={theme.colors.white}
                                backgroundColor="transparent"
                                padding={0}
                                style={styles.chevron}
                            />
                        </View>
                    )}
                </View>
            </ImageBackground>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {cardContent}
            </TouchableOpacity>
        );
    }

    return cardContent;
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 0,
        backgroundColor: theme.colors.white,
        shadowColor: 'transparent',
        shadowOpacity: 0.005,
        shadowRadius: 8,
        elevation: 2,
        minHeight: 150,
        maxHeight: 150,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        flex: 1,
    },
    backgroundImageStyle: {
        borderRadius: 20,
    },
    content: {
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.09)',
        flex: 1,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    unit: {
        marginLeft: 4,
        opacity: 0.9,
    },
    differenceContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    differenceText: {
        marginLeft: 0,
    },
    subtitleText: {
        flex: 1,
    },
    chevron: {
        flexShrink: 0,
        marginLeft: 4,
    },
    noDataContainer: {
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.3)',
    },
    noDataText: {
        opacity: 0.7,
        fontStyle: 'italic',
    },
});