import { Icon } from '@/components/icon';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';

interface DailyLogCardProps {
    log: {
        id: string;
        date: string;
        calories: number;
        steps: number;
        energyDrinks: number;
        waterLiters: number;
        workout: string;
    };
    onPress: () => void;
}

const workoutTranslations: Record<string, string> = {
    'none': 'Ninguno',
    'upper': 'Superior',
    'lower': 'Glúteos y pierna',
    'full': 'Full body',
    'cardio': 'Cardio',
};

const formatDisplayDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    
    const formatter = new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return formatter.format(localDate);
};

const getTranslatedWorkout = (workoutValue?: string): string => {
    if (!workoutValue || workoutValue.trim() === '' || workoutValue === 'none') {
        return 'Ninguno';
    }
    const translated = workoutTranslations[workoutValue.toLowerCase()];
    return translated || workoutValue;
};

export const DailyLogCard: React.FC<DailyLogCardProps> = ({ log, onPress }) => {
    const formattedDate = formatDisplayDate(log.date);
    const translatedWorkout = getTranslatedWorkout(log.workout);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                    <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                        {log.calories} calorías, {log.steps} pasos
                    </ThemedText>
                    </View>
                    <View style={styles.headerRight}>
                        <Icon 
                            name="Calendar" 
                            size={16} 
                            color={theme.colors.placeholder}
                            backgroundColor="transparent"
                            padding={0}
                        />
                        <ThemedText 
                            variant="medium" 
                            size={12} 
                            color={theme.colors.placeholder}
                            style={styles.dateText}
                        >
                            {formattedDate}
                        </ThemedText>
                    </View>
                </View>

                {/* Energizantes y agua */}
                <View style={styles.secondaryStats}>
                    <View style={styles.statRow}>
                        <Icon 
                            name="Droplets" 
                            size={14} 
                            color={theme.colors.textLight}
                            backgroundColor="transparent"
                            padding={0}
                        />
                        <ThemedText 
                            variant="medium" 
                            size={11} 
                            color={theme.colors.textLight}
                            style={styles.statText}
                        >
                            {log.energyDrinks} energizantes, {log.waterLiters} litros de agua
                        </ThemedText>
                    </View>
                </View>

                {/* Entrenamiento */}
                <View style={styles.workoutRow}>
                    <Icon 
                        name="Dumbbell" 
                        size={14} 
                        color={theme.colors.textLight}
                        backgroundColor="transparent"
                        padding={0}
                    />
                    <ThemedText 
                        variant="medium" 
                        size={11} 
                        color={theme.colors.textLight}
                        style={styles.workoutText}
                    >
                        Entrenamiento: {translatedWorkout}
                    </ThemedText>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        marginLeft: 8,
    },
    mainStats: {
        marginBottom: 8,
        paddingBottom: 8,
    },
    secondaryStats: {
        marginBottom: 4,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        marginLeft: 6,
    },
    workoutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    workoutText: {
        marginLeft: 6,
    },
});