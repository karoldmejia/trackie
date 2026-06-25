// PlannedMealCard.tsx - Versión corregida
import { PlannedMeal } from '@/services/mealPlannerService';
import { theme } from '@/theme';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

    const formattedTime = time.substring(0, 5);

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
                    <Text style={styles.mealTypeLabel}>
                        {mealTypeLabels[mealType]}
                    </Text>
                    <Text style={styles.timeLabel}>
                        {formattedTime}
                    </Text>
                </View>
                <Text style={styles.dishName} numberOfLines={2}>
                    {dishName}
                </Text>
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
        marginBottom: 2, // Reducido
        marginRight: 12,

    },
    mealTypeLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.secondary || '#888888',
        letterSpacing: 0.5,
    },
    timeLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.text || '#555555',
        letterSpacing: 0.5,
    },
    dishName: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text || '#000000',
    },
});