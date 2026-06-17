import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface WeeklyDailyAverage {
    weekStart: string;
    weekEnd: string;
    weekRange: string;
    avgCalories: number;
    avgSteps: number;
    avgenergyDrinks: number;
    avgWaterLiters: number;
}

interface WeeklyDailyCardProps {
    weekData: WeeklyDailyAverage;
    onPress: (weekData: WeeklyDailyAverage) => void;
}

export const WeeklyDailyCard: React.FC<WeeklyDailyCardProps> = ({
    weekData,
    onPress,
}) => {
    return (
        <TouchableOpacity
            style={styles.historyCard}
            onPress={() => onPress(weekData)}
            activeOpacity={0.7}
        >
            <View style={styles.historyCardContent}>
                <View style={styles.historyDate}>
                    <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                        {weekData.weekRange}
                    </ThemedText>
                </View>
                <View style={styles.historyStats}>
                    <View style={styles.historyStat}>
                        <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                            {weekData.avgCalories}
                        </ThemedText>
                        <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                            kcal
                        </ThemedText>
                    </View>
                    <View style={styles.historyStat}>
                        <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                            {weekData.avgSteps}
                        </ThemedText>
                        <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                            pasos
                        </ThemedText>
                    </View>
                    <View style={styles.historyStat}>
                        <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                            {weekData.avgenergyDrinks}
                        </ThemedText>
                        <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                            energ.
                        </ThemedText>
                    </View>
                    <View style={styles.historyStat}>
                        <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                            {weekData.avgWaterLiters}
                        </ThemedText>
                        <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                            litros
                        </ThemedText>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    historyCard: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
        borderWidth: 0,
        shadowColor: 'transparent',
        elevation: 1,
    },
    historyDate: {
        marginBottom: 8,
    },
    historyStats: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 4,
    },
    historyStat: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    historyCardContent: {
        flex: 1,
    },
});