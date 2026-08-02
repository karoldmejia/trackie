import { PlannedMeal } from '@/services/mealPlannerService';
import { theme } from '@/theme';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';

interface PlannedMealCardProps {
    plannedMeal: PlannedMeal;
    onPress?: () => void;
}

const mealTypeImages = {
    desayuno: require('@/assets/mealtypes/breakfast.png'),
    almuerzo: require('@/assets/mealtypes/lunch.png'),
    cena: require('@/assets/mealtypes/dinner.png'),
    snack: require('@/assets/mealtypes/snack.png'),
};

const mealTypeLabels = {
    desayuno: 'DESAYUNO',
    almuerzo: 'ALMUERZO',
    cena: 'CENA',
    snack: 'SNACK',
};

export const PlannedMealCard: React.FC<PlannedMealCardProps> = ({ 
    plannedMeal, 
    onPress 
}) => {
    const { mealType, time, dishes } = plannedMeal;
    
    const imageSource = mealTypeImages[mealType] || mealTypeImages.snack;
    
    const dishName = dishes && dishes.length > 0 
        ? dishes.map(d => d.name).join(', ')
        : 'Sin plato asignado';

    const formatTimeToAMPM = (timeStr: string): string => {
        if (!timeStr) return '';
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        let hour12 = hours % 12;
        if (hour12 === 0) hour12 = 12; // 12 AM o 12 PM
        return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
    };

    const formattedTime = formatTimeToAMPM(time);
    return (
        <TouchableOpacity 
            style={styles.card} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Imagen del tipo de comida */}
            <View style={styles.imageContainer}>
                <Image 
                    source={imageSource} 
                    style={styles.image}
                    resizeMode="cover"
                />
            </View>

            {/* Contenido principal */}
            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <ThemedText variant="semiBold" style={styles.mealTypeLabel}>
                        {mealTypeLabels[mealType]}
                    </ThemedText>
                    <ThemedText variant="semiBold" style={styles.timeLabel}>
                        {formattedTime}
                    </ThemedText>
                </View>
                <ThemedText variant="medium" style={styles.dishName} numberOfLines={3}>
                    {dishName}
                </ThemedText>
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
        width: 50,
        height: 50,
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
        marginRight: 12,

    },
    mealTypeLabel: {
        fontSize: 10,
        color: theme.colors.textLight || '#888888',
        letterSpacing: 0.5,
    },
    timeLabel: {
        fontSize: 11,
        color: theme.colors.text || '#555555',
        letterSpacing: 0.5,
    },
    dishName: {
        fontSize: 14,
        color: theme.colors.text || '#000000',
    },
});