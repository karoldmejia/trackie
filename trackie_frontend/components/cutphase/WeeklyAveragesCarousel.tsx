// components/cutphase/WeeklyAveragesCarousel.tsx

import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 70;

interface WeeklyAverage {
    weekNumber: number;
    averages: {
        calories: number;
        protein: number;
        steps: number;
        water: number;
    };
    daysWithData: number;
}

interface WeeklyAveragesCarouselProps {
    weeklyAverages: WeeklyAverage[];
    currentWeek: number;
    totalWeeks: number;
}

const WeeklyAveragesCarousel: React.FC<WeeklyAveragesCarouselProps> = ({
    weeklyAverages,
    currentWeek,
    totalWeeks,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const displayWeeks = weeklyAverages
        .filter((week, index) => {
            const weekNumber = index + 1;
            if (week.daysWithData > 0) return true;
            if (weekNumber === currentWeek) return true;
            if (weekNumber > currentWeek && week.daysWithData > 0) return true;
            return false;
        })
        .map((week, index) => ({
            ...week,
            isCurrent: week.weekNumber === currentWeek,
            isFuture: week.daysWithData === 0 && week.weekNumber > currentWeek,
            isPast: week.weekNumber < currentWeek && week.daysWithData > 0,
        }));

    if (displayWeeks.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <ThemedText variant="medium" size={14} color={theme.colors.text}>
                        Promedios semanales
                    </ThemedText>
                </View>
                <View style={styles.noDataContainer}>
                    <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                        No hay datos de semanas disponibles
                    </ThemedText>
                </View>
            </View>
        );
    }

    const initialIndex = displayWeeks.findIndex(w => w.isCurrent);
    const safeInitialIndex = initialIndex !== -1 ? initialIndex : 0;

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / CARD_WIDTH);
        if (index >= 0 && index < displayWeeks.length) {
            setCurrentIndex(index);
        }
    };

    const currentWeekNumber = displayWeeks[currentIndex]?.weekNumber || currentWeek;

    const renderWeek = ({ item }: { item: typeof displayWeeks[0] }) => {
        const isCurrent = item.isCurrent;
        const isFuture = item.isFuture;
        const hasData = item.daysWithData > 0;

        return (
            <View style={[styles.weekCard, { width: CARD_WIDTH }]}>

                {hasData ? (
                    <View style={styles.metricsGrid}>
                        <View style={styles.metricItem}>
                            <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                                {item.averages.calories}
                            </ThemedText>
                            <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                                kcal
                            </ThemedText>
                        </View>
                        <View style={styles.metricItem}>
                            <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                                {item.averages.protein}
                            </ThemedText>
                            <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                                g
                            </ThemedText>
                        </View>
                        <View style={styles.metricItem}>
                            <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                                {item.averages.steps}
                            </ThemedText>
                            <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                                pasos
                            </ThemedText>
                        </View>
                        <View style={styles.metricItem}>
                            <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                                {item.averages.water}
                            </ThemedText>
                            <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                                L
                            </ThemedText>
                        </View>
                    </View>
                ) : (
                    <View style={styles.noDataContainer}>
        <ThemedText 
            variant="regular" 
            size={12} 
            color={theme.colors.textLight}
            style={styles.noDataText}
        >
            {isCurrent ? 'Semana en curso :p' : 'Próximamente'}
        </ThemedText>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <ThemedText variant="medium" size={12} color={theme.colors.text}>
                    Promedio por semana
                </ThemedText>
                <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                    {currentIndex + 1} / {displayWeeks.length}
                </ThemedText>
            </View>

            <FlatList
                ref={flatListRef}
                data={displayWeeks}
                renderItem={renderWeek}
                keyExtractor={(item) => `week-${item.weekNumber}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={safeInitialIndex}
                getItemLayout={(data, index) => ({
                    length: CARD_WIDTH,
                    offset: CARD_WIDTH * index,
                    index,
                })}
                onMomentumScrollEnd={handleScroll}
                contentContainerStyle={styles.flatListContent}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH}
                snapToAlignment="center"
            />

            <View style={styles.dotsContainer}>
                {displayWeeks.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === currentIndex && styles.dotActive,
                            index < currentIndex && styles.dotPast,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    flatListContent: {
        paddingHorizontal: 0,
    },
    weekCard: {
        paddingHorizontal: 4,
        paddingVertical: 8,
    },
    weekHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    currentBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
        backgroundColor: theme.colors.background,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: '45%',
        flex: 1,
        justifyContent: 'center',
    },
    noDataContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 60,
        flex: 1,
    },
    daysCount: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: theme.colors.secondary,
        alignItems: 'center',
        width: '100%',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.secondary,
    },
    dotActive: {
        width: 16,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
    },
    dotPast: {
        backgroundColor: theme.colors.primary + '40',
    },
    noDataText: {
    textAlign: 'center',
},
});

export default WeeklyAveragesCarousel;