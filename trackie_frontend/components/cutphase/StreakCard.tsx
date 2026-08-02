// components/cutphase/StreakCard.tsx
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface DayData {
    date: string;
    dailyScore: number;
}

interface StreakCardProps {
    currentStreak: number;
    bestStreak: number;
    lastFailedDate: string | null;
    days: DayData[]; // Días de la fase para mostrar el streak
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

const getDayName = (date: Date): string => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
};

const getShortDayName = (date: Date): string => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
};

export const StreakCard: React.FC<StreakCardProps> = ({
    currentStreak,
    bestStreak,
    lastFailedDate,
    days,
}) => {
    const [weekDays, setWeekDays] = useState<{ date: string; dayName: string; shortDay: string; isStreak: boolean; isToday: boolean }[]>([]);

    useEffect(() => {
        const today = new Date();
        const weekDates: { date: string; dayName: string; shortDay: string; isStreak: boolean; isToday: boolean }[] = [];

        const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        const monday = new Date(today);
        monday.setDate(today.getDate() - daysToMonday);

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = days.find(d => d.date === dateStr);
            const isStreak = dayData ? dayData.dailyScore >= 90 : false;
            const isToday = dateStr === today.toISOString().split('T')[0];

            weekDates.push({
                date: dateStr,
                dayName: getDayName(date),
                shortDay: getShortDayName(date),
                isStreak,
                isToday,
            });
        }

        setWeekDays(weekDates);
    }, [days, currentStreak]);

    return (
        <View style={styles.card}>
            {/* Primera fila: Racha actual y Mejor racha */}
            <View style={styles.streakRow}>
                {/* Racha actual */}
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

                {/* Mejor racha */}
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
                            {bestStreak} {bestStreak==1 ? "día" : "días"}
                        </ThemedText>
                    </View>
                </View>
            </View>

            {/* Segunda fila: Días de la semana */}
            <View style={styles.weekRow}>
                {weekDays.map((day, index) => (
                    <View key={index} style={styles.dayItem}>
                        <ThemedText
                                    variant={day.isToday ? "semiBold" : "regular"}
                            size={10}
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
                                    size={16}
                                    color={theme.colors.white}
                                    backgroundColor="transparent"
                                    padding={0}
                                />
                            ) : (
                                <ThemedText
                                    variant="regular"
                                    size={12}
                                    color={theme.colors.textLight}
                                >
                                    {new Date(day.date).getDate()}
                                </ThemedText>
                            )}
                        </View>
                    </View>
                ))}
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
        marginBottom: 12,
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
        borderWidth: 1,
        borderColor: theme.colors.textLight,
    },
    lastFailedContainer: {
        marginTop: 8,
        alignItems: 'center',
    },
});

export default StreakCard;