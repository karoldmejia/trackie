import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import { WeeklyDailyAverage } from '@/utils/weeklyAverages';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WeeklyDailyCard } from './WeeklyDailyCard';

interface WeeklyDailyListProps {
    weeks: WeeklyDailyAverage[];
    onWeekPress: (week: WeeklyDailyAverage) => void;
}

export const WeeklyDailyList: React.FC<WeeklyDailyListProps> = ({
    weeks,
    onWeekPress,
}) => {
    if (weeks.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Icon
                    name="Calendar"
                    size={48}
                    color={theme.colors.textLight}
                    backgroundColor="transparent"
                    padding={0}
                />
                <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                    No hay datos semanales disponibles
                </ThemedText>
            </View>
        );
    }

    return (

        <View style={styles.container}>
            <View style={styles.historyHeader}>
                <ThemedText variant="medium" size={12} color={theme.colors.textLight} style={styles.historyTitle}>
                    PROMEDIO POR SEMANA
                </ThemedText>
            </View>

            {weeks.map((week, index) => (
                <WeeklyDailyCard
                    key={`${week.weekStart}-${index}`}
                    weekData={week}
                    onPress={onWeekPress}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
        marginBottom: 16,
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    historyTitle: {
        letterSpacing: 0.5,
    },
});