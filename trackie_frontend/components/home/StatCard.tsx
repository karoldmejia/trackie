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
    limit?: number;
    currentValue?: number;
    type: 'calories' | 'steps';
    backgroundImage: any;
    onPress?: () => void;
    headerIcon?: LucideIconName;
    headerIconColor?: string;
    headerIconSize?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
    title, 
    value, 
    unit, 
    limit, 
    currentValue, 
    type, 
    backgroundImage, 
    onPress,
    headerIcon = 'MoreHorizontal',
    headerIconColor,
    headerIconSize = 20,
}) => {
    const hasData = currentValue !== undefined && currentValue !== null;
    
    const calculateDifference = () => {
        if (limit === undefined) return null;
        
        if (!hasData) {
            const absoluteDifference = limit;
            
            if (type === 'calories') {
                return {
                    icon: 'ArrowDown',
                    text: `${absoluteDifference} restantes`,
                    color: theme.colors.white,
                };
            } else {
                // steps
                return {
                    icon: 'ArrowDown',
                    text: `${absoluteDifference} faltantes`,
                    color: theme.colors.white,
                };
            }
        }
        
        const difference = limit - currentValue;
        const isPositive = difference > 0;
        const absoluteDifference = Math.abs(difference);
        
        if (type === 'calories') {
            if (isPositive) {
                return {
                    icon: 'ArrowDown',
                    text: `${absoluteDifference} restantes`,
                    color: theme.colors.white,
                };
            } else {
                return {
                    icon: 'ArrowUp',
                    text: `${absoluteDifference} excedidas`,
                    color: theme.colors.white,
                };
            }
        } else {
            // steps
            if (isPositive) {
                return {
                    icon: 'ArrowDown',
                    text: `${absoluteDifference} faltantes`,
                    color: theme.colors.white,
                };
            } else {
                return {
                    icon: 'ArrowUp',
                    text: `${absoluteDifference} extra`,
                    color: theme.colors.white || '#F44336',
                };
            }
        }
    };

    const differenceData = calculateDifference();
    const finalHeaderIconColor = headerIconColor || theme.colors.white;
    
    const displayValue = hasData ? value : 0;
    
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
                        <ThemedText variant="medium" size={16} color={theme.colors.white}>
                            {title}
                        </ThemedText>
                        <Icon 
                            name={headerIcon}
                            size={headerIconSize}                         />
                    </View>

                    {/* Valor principal */}
                    <View style={styles.valueContainer}>
                        <ThemedText variant="bold" size={28} color={theme.colors.white}>
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

                    {/* Diferencia con límite */}
                    {differenceData && (
                        <View style={styles.differenceContainer}>
                            <Icon 
                                name={differenceData.icon as any} 
                                size={14} 
                                padding={2}
                                color={theme.colors.primary}
                                backgroundColor={theme.colors.text}
                            />
                            <ThemedText 
                                variant="medium" 
                                size={14} 
                                color={differenceData.color}
                                style={styles.differenceText}
                            >
                                {differenceData.text}
                            </ThemedText>
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
        maxHeight: 150,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
    },
    backgroundImageStyle: {
        borderRadius: 20,
    },
    content: {
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.09)',
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
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    differenceText: {
        marginLeft: 6,
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