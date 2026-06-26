// components/meal-planner/DayPlanCard.tsx
import { DayPlan } from '@/services/mealPlannerService';
import { theme } from '@/theme';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

const DAY_ICONS = ['🍳', '🥗', '🍝', '🍲', '🌮', '🥘', '🍕', '🥗', '🍣', '🍱'];

export const DayPlanCard: React.FC<DayPlanCardProps> = ({ 
    dayPlan, 
    onPress 
}) => {
    const { date, plannedMeals } = dayPlan;
    
    // Obtener imagen aleatoria basada en el día
    const randomIndex = new Date(date).getDate() % dayPlanImages.length;
    const imageSource = dayPlanImages[randomIndex];
    
    // Formatear fecha
    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        });
    };

    // Obtener el nombre del día
    const getDayName = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString('es-CO', { weekday: 'long' });
    };

    // Obtener emoji aleatorio para el día
    const getRandomEmoji = (dateStr: string) => {
        const dayNum = new Date(dateStr).getDate();
        return DAY_ICONS[dayNum % DAY_ICONS.length];
    };

    // Contar comidas por tipo
    const mealCounts = {
        total: plannedMeals?.length || 0,
        desayuno: plannedMeals?.filter(m => m.mealType === 'desayuno').length || 0,
        almuerzo: plannedMeals?.filter(m => m.mealType === 'almuerzo').length || 0,
        cena: plannedMeals?.filter(m => m.mealType === 'cena').length || 0,
        snack: plannedMeals?.filter(m => m.mealType === 'snack').length || 0,
    };

    const hasMeals = mealCounts.total > 0;

    // Generar el texto de resumen de comidas
    const getMealSummary = () => {
        const mealTypes = [];
        if (mealCounts.desayuno > 0) mealTypes.push('desayuno');
        if (mealCounts.almuerzo > 0) mealTypes.push('almuerzo');
        if (mealCounts.cena > 0) mealTypes.push('cena');
        if (mealCounts.snack > 0) mealTypes.push('snack');

        if (mealTypes.length === 0) return '';

        // Caso especial: solo un tipo
        if (mealTypes.length === 1) {
            return `Se planificó ${mealTypes[0]}`;
        }

        // Caso: dos tipos
        if (mealTypes.length === 2) {
            return `Se planificaron ${mealTypes[0]} y ${mealTypes[1]}`;
        }

        // Caso: tres o más tipos
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
            {/* Imagen del día */}
            <View style={styles.imageContainer}>
                <Image 
                    source={imageSource} 
                    style={styles.image}
                    resizeMode="cover"
                />
            </View>

            {/* Contenido principal */}
            <View style={styles.contentContainer}>
                {/* Fila superior: Fecha y cantidad de comidas */}
                <View style={styles.headerRow}>
                    <View style={styles.dateContainer}>
                        <Text style={styles.dayName}>{getDayName(date)}</Text>
                    </View>
                </View>

                {/* Resumen de comidas - texto natural */}
                <View style={styles.summaryContainer}>
                    {hasMeals ? (
                        <Text style={styles.summaryText}>
                            {mealSummary}
                        </Text>
                    ) : (
                        <Text style={styles.emptyText}>
                            {getRandomEmoji(date)} Sin comidas planificadas
                        </Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: theme.colors.white,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: 'transparent',
        elevation: 2,
    },
    imageContainer: {
        width: 60,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 12,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    dateContainer: {
        flex: 1,
        marginRight: 8,
    },
    dayName: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.text || '#000000',
        textTransform: 'uppercase',
    },
    dateText: {
        fontSize: 10,
        color: theme.colors.secondary || '#888888',
    },
    mealCountBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 5,
    },
    mealCountText: {
        fontSize: 9,
        fontWeight: '600',
        color: theme.colors.text,
    },
    summaryContainer: {
        gap: 2,
    },
    summaryText: {
        fontSize: 15,
        color: theme.colors.text || '#000000',
    },
    emptyText: {
        fontSize: 12,
        color: theme.colors.secondary || '#888888',
    },
});