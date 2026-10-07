import { Icon } from '@/components/icon';
import { theme } from '@/theme';
import { formatShortDate } from '@/utils/date';
import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';

interface DailyLogCardProps {
    log: {
        id: string;
        date: string;
        calories: number;
        steps: number;
        proteinGrams: number;
        waterLiters: number;
        workout: string;
    };
    onPress: () => void;
    onDelete?: () => void;

}

const workoutTranslations: Record<string, string> = {
    'none': 'Ninguno',
    'upper': 'Superior',
    'lower': 'Glúteos y pierna',
    'full': 'Full body',
    'cardio': 'Cardio',
};

const getTranslatedWorkout = (workoutValue?: string): string => {
    if (!workoutValue || workoutValue.trim() === '' || workoutValue === 'none') {
        return 'Ninguno';
    }
    const translated = workoutTranslations[workoutValue.toLowerCase()];
    return translated || workoutValue;
};

const RightAction: React.FC<{
    drag: SharedValue<number>;
    onDelete?: () => void;
}> = ({ drag, onDelete }) => {
    const styleAnimation = useAnimatedStyle(() => ({
        transform: [{ translateX: drag.value + 72 }],
    }));

    return (
        <Reanimated.View style={styleAnimation}>
            <TouchableOpacity
                onPress={onDelete}
                style={styles.deleteButton}
                activeOpacity={0.7}
            >
                <Icon name="Trash" size={20} color={theme.colors.placeholder} />
            </TouchableOpacity>
        </Reanimated.View>
    );
};


export const DailyLogCard: React.FC<DailyLogCardProps> = ({
    log,
    onPress,
    onDelete,
}) => {
    const swipeableRef = useRef<SwipeableMethods>(null);

    const formattedDate = formatShortDate(log.date);
    const translatedWorkout = getTranslatedWorkout(log.workout);

    const handleDelete = () => {
        swipeableRef.current?.close();
        onDelete?.();
    };

    const card = (
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
                            name="Beef"
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
                            {log.proteinGrams}g de proteína, {log.waterLiters} litros de agua
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

    if (!onDelete) return card;

    return (
        <ReanimatedSwipeable
            ref={swipeableRef}
            friction={2}
            rightThreshold={40}
            renderRightActions={(progress, drag) => (
                <RightAction drag={drag} onDelete={handleDelete} />
            )}
            overshootRight={false}
        >
            {card}
        </ReanimatedSwipeable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 0,
        shadowColor: 'transparent',
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
    deleteButton: {
        width: 60,
        height: '100%',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        marginLeft: 0,
    },
});