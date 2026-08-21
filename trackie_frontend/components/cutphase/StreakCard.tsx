import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

interface DayData {
    date: string;
    dailyScore: number;
}

interface StreakCardProps {
    currentStreak: number;
    bestStreak: number;
    lastFailedDate: string | null;
    days: DayData[];
}

const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    const formatter = new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    return formatter.format(localDate);
};

const getDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDayIndex = (date: Date): number => {
    const day = date.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    return day === 0 ? 6 : day - 1; // Lunes=0, Martes=1, ..., Domingo=6
};

const getShortDayName = (date: Date): string => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days[getDayIndex(date)];
};

const getMonthName = (date: Date): string => {
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return months[date.getMonth()];
};


interface WeekData {
    id: string;
    startDate: string;
    endDate: string;
    month: string;
    days: {
        date: string;
        shortDay: string;
        isStreak: boolean;
        isToday: boolean;
        dayNumber: number;
    }[];
}

export const StreakCard: React.FC<StreakCardProps> = ({
    currentStreak,
    bestStreak,
    lastFailedDate,
    days,
}) => {
    const [weeks, setWeeks] = useState<WeekData[]>([]);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        // Generar todas las semanas desde la primera fecha hasta hoy
        const today = new Date();
        const allWeeks: WeekData[] = [];

        let earliestDate = new Date(today);
        if (days.length > 0) {
            const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));
            earliestDate = new Date(sortedDays[0].date);
        } else {
            earliestDate.setDate(today.getDate() - 28);
        }

        const startDayOfWeek = earliestDate.getDay();
        const daysToMonday = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
        earliestDate.setDate(earliestDate.getDate() - daysToMonday);

        // Generar semanas hasta hoy
        let currentDate = new Date(earliestDate);
        while (currentDate <= today) {
            const weekStart = new Date(currentDate);
            const weekEnd = new Date(currentDate);
            weekEnd.setDate(weekEnd.getDate() + 6);

            const weekDays = [];
            let month = getMonthName(weekStart);

            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + i);
                const dateStr = getDateStr(date);

                const dayData = days.find(d => d.date === dateStr);
                const isStreak = dayData ? dayData.dailyScore >= 90 : false;
                const isToday = dateStr === getDateStr(today);

                weekDays.push({
                    date: dateStr,
                    shortDay: getShortDayName(date),
                    isStreak,
                    isToday,
                    dayNumber: date.getDate(),
                });
            }
            allWeeks.push({
                id: weekStart.toISOString().split('T')[0],
                startDate: weekStart.toISOString().split('T')[0],
                endDate: weekEnd.toISOString().split('T')[0],
                month,
                days: weekDays,
            });

            currentDate.setDate(currentDate.getDate() + 7);
        }

        setWeeks(allWeeks);
        // Encontrar la semana actual (la que contiene hoy)
        const todayStr = today.toISOString().split('T')[0];
        const currentWeekIdx = allWeeks.findIndex(week =>
            week.days.some(day => day.date === todayStr)
        );
        setCurrentWeekIndex(currentWeekIdx !== -1 ? currentWeekIdx : allWeeks.length - 1);
    }, [days]);

    const handleWeekChange = (index: number) => {
        if (index >= 0 && index < weeks.length) {
            setCurrentWeekIndex(index);
            flatListRef.current?.scrollToIndex({ index, animated: true });
        }
    };

    const renderWeek = ({ item }: { item: WeekData }) => {
        const isCurrentWeek = item === weeks[currentWeekIndex];

        return (
            <View style={styles.weekContainer}>
                <View style={styles.weekRow}>
                    {item.days.map((day, index) => (
                        <View key={index} style={styles.dayItem}>
                            <ThemedText
                                variant={day.isToday ? "semiBold" : "regular"}
                                size={11}
                                color={theme.colors.textLight}
                                style={styles.dayLabel}
                            >
                                {day.shortDay}
                            </ThemedText>
                            <View style={[
                                styles.dayCircle,
                                day.isStreak && styles.dayCircleStreak,
                                day.isToday && styles.dayCircleToday,
                            ]}>
                                {day.isStreak ? (
                                    <Icon
                                        name="Check"
                                        size={14}
                                        color={theme.colors.white}
                                        backgroundColor="transparent"
                                        padding={0}
                                    />
                                ) : (
                                    <ThemedText
                                        variant={day.isToday ? "medium" : "regular"}
                                        size={13}
                                        color={theme.colors.textLight}
                                        style={styles.dayNumberText}
                                    >
                                        {day.dayNumber}
                                    </ThemedText>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    // Si no hay semanas, mostrar mensaje
    if (weeks.length === 0) {
        return (
            <View style={styles.card}>
                <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                    No hay datos de racha disponibles
                </ThemedText>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            {/* Primera fila: Racha actual y Mejor racha */}
            <View style={styles.streakRow}>
                <View style={styles.streakItem}>
                    <Icon
                        name="Flame"
                        size={14}
                        color={theme.colors.placeholder}
                        backgroundColor={theme.colors.background}
                        borderRadius={50}
                    />
                    <View style={styles.streakInfo}>
                        <ThemedText variant="medium" size={13} color={theme.colors.text}>
                            Racha actual:
                        </ThemedText>
                        <ThemedText variant="bold" size={13} color={theme.colors.primary}>
                            {currentStreak} días
                        </ThemedText>
                    </View>
                </View>

                <View style={[styles.streakItem, styles.bestStreakItem]}>
                    <View style={styles.bestStreakBadge}>
                        <Icon
                            name="Medal"
                            size={16}
                            color={theme.colors.text}
                            backgroundColor="transparent"
                            padding={0}
                        />
                        <ThemedText variant="semiBold" size={12} color={theme.colors.text}>
                            {bestStreak} {bestStreak === 1 ? "día" : "días"}
                        </ThemedText>
                    </View>
                </View>
            </View>

            {/* FlatList para desplazamiento horizontal */}
            <FlatList
                ref={flatListRef}
                data={weeks}
                renderItem={renderWeek}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={currentWeekIndex}
                getItemLayout={(data, index) => ({
                    length: 320, // Ancho aproximado de cada semana
                    offset: 320 * index,
                    index,
                })}
                onScrollToIndexFailed={(info) => {
                    // Fallback si no puede hacer scroll
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({
                            index: info.index,
                            animated: true,
                        });
                    }, 100);
                }}
                onMomentumScrollEnd={(event) => {
                    const offsetX = event.nativeEvent.contentOffset.x;
                    const index = Math.round(offsetX / 320);
                    if (index >= 0 && index < weeks.length) {
                        setCurrentWeekIndex(index);
                    }
                }}
                contentContainerStyle={styles.flatListContent}
            />
            {/* Segunda fila: Mes a la izquierda y navegación */}
            <View style={styles.navigationRow}>
                <View style={styles.monthContainer}>
                    <ThemedText variant="medium" size={12} color={theme.colors.placeholder}>
                        {weeks[currentWeekIndex]?.month || ''}
                    </ThemedText>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: 'transparent',
    },
    streakRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    streakItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    bestStreakItem: {
        justifyContent: 'flex-end',
    },
    bestStreakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    streakInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    navigationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    monthContainer: {
        flex: 1,
        marginRight: 10,
        alignItems: 'flex-end',
    },
    navigationButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    navButton: {
        padding: 4,
        borderRadius: 20,
        backgroundColor: theme.colors.background,
    },
    navButtonDisabled: {
        opacity: 0.3,
    },
    flatListContent: {
        paddingHorizontal: 0,
        marginTop: 10,

    },
    weekContainer: {
        width: 320,
        paddingHorizontal: 0,
    },
    weekHeader: {
        marginBottom: 6,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    dayItem: {
        alignItems: 'center',
        gap: 4,
    },
    dayLabel: {
        textAlign: 'center',
    },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },
    dayCircleStreak: {
        backgroundColor: theme.colors.primary,
    },
    dayCircleToday: {
        borderWidth: 1.2,
        borderColor: theme.colors.textLight,
    },
    dayNumberText: {
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
        lineHeight: 13,
    },
});

export default StreakCard;