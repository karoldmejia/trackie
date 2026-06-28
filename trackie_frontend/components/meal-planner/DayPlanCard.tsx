// components/meal-planner/DayPlanCard.tsx
import { Icon } from '@/components/icon';
import { DayPlan } from '@/services/mealPlannerService';
import { theme } from '@/theme';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';

interface DayPlanCardProps {
    dayPlan: DayPlan;
    onPress?: () => void;
}

const dayPlanImages = [
    require('@/assets/dayplan/f1.png'),
    require('@/assets/dayplan/f2.png'),
    require('@/assets/dayplan/f3.png'),
    require('@/assets/dayplan/f4.png'),
    require('@/assets/dayplan/f5.png'),
    require('@/assets/dayplan/f6.png'),
    require('@/assets/dayplan/f7.png'),
    require('@/assets/dayplan/f8.png'),
    require('@/assets/dayplan/f9.png'),
];

export const DayPlanCard: React.FC<DayPlanCardProps> = ({ 
    dayPlan, 
    onPress 
}) => {
    const { date, plannedMeals } = dayPlan;
    
    const randomIndex = new Date(date).getDate() % dayPlanImages.length;
    const imageSource = dayPlanImages[randomIndex];
    
    const getDayName = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString('es-CO', { weekday: 'long' });
    };

    const mealCounts = {
        total: plannedMeals?.length || 0,
        desayuno: plannedMeals?.filter(m => m.mealType === 'desayuno').length || 0,
        almuerzo: plannedMeals?.filter(m => m.mealType === 'almuerzo').length || 0,
        cena: plannedMeals?.filter(m => m.mealType === 'cena').length || 0,
        snack: plannedMeals?.filter(m => m.mealType === 'snack').length || 0,
    };

    const hasMeals = mealCounts.total > 0;

    const getMealSummary = () => {
        const mealTypes = [];
        if (mealCounts.desayuno > 0) mealTypes.push('desayuno');
        if (mealCounts.almuerzo > 0) mealTypes.push('almuerzo');
        if (mealCounts.cena > 0) mealTypes.push('cena');
        if (mealCounts.snack > 0) mealTypes.push('snack');

        if (mealTypes.length === 0) return '';
        if (mealTypes.length === 1) return `Se planificó ${mealTypes[0]}`;
        if (mealTypes.length === 2) return `Se planificaron ${mealTypes[0]} y ${mealTypes[1]}`;
        const last = mealTypes.pop();
        return `Se planificaron ${mealTypes.join(', ')} y ${last}`;
    };

    const mealSummary = getMealSummary();

    return (
        <TouchableOpacity 
            style={styles.card} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.rowContainer}>
                {/* Imagen - más grande que el rectángulo */}
                <View style={styles.imageWrapper}>
                    <Image 
                        source={imageSource} 
                        style={styles.image}
                        resizeMode="cover"
                    />
                </View>

                {/* Rectángulo blanco - empieza en la mitad de la imagen */}
                <View style={styles.contentContainer}>
                    <View style={styles.textWrapper}>
                        <View style={styles.headerRow}>
                            <View style={styles.dateContainer}>
                                <ThemedText variant="semiBold" style={styles.dayName} numberOfLines={1}>
                                    {getDayName(date)}
                                </ThemedText>
                            </View>
                        </View>

                        <View style={styles.summaryContainer}>
                            {hasMeals ? (
                                <ThemedText variant="medium" style={styles.summaryText} numberOfLines={2}>
                                    {mealSummary}
                                </ThemedText>
                            ) : (
                                <ThemedText style={styles.emptyText} numberOfLines={1}>
                                    Sin comidas planificadas
                                </ThemedText>
                            )}
                        </View>
                    </View>

                    {/* Flecha en el extremo derecho */}
                    <View style={styles.arrowContainer}>
                        <Icon
                            name="ChevronRight"
                            size={20}
                            color={theme.colors.secondary || '#888888'}
                            backgroundColor="transparent"
                        />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'transparent',
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageWrapper: {
        width: 80,
        height: 90,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 10,
        marginRight: -40,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        paddingVertical: 14,
        paddingRight: 12,
        paddingLeft: 50,
        minHeight: 76,
        shadowColor: 'transparent',
        elevation: 1,
        borderWidth: 0,
    },
    textWrapper: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    dateContainer: {
        flex: 1,
        marginRight: 8,
    },
    dayName: {
        fontSize: 10,
        color: theme.colors.textLight || '#000000',
        textTransform: 'uppercase',
    },
    summaryContainer: {
        gap: 0,
    },
    summaryText: {
        fontSize: 14,
        color: theme.colors.text || '#000000',
        lineHeight: 18,
    },
    emptyText: {
        fontSize: 13,
        color: theme.colors.secondary || '#888888',
    },
    arrowContainer: {
        alignSelf: 'center',
        paddingLeft: 4,
    },
});