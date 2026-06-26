import { Icon } from '@/components/icon';
import { DayPlan } from '@/services/mealPlannerService';
import { theme } from '@/theme';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DayPlanCard } from './DayPlanCard';
import { WeekView } from './WeekView';

interface WeeklyPlannerContainerProps {
    dayPlans: DayPlan[];
    onDaySelect?: (date: string) => void;
    onDayPlanPress?: (dayPlan: DayPlan) => void;
    selectedDate?: string;
}

export const WeeklyPlannerContainer: React.FC<WeeklyPlannerContainerProps> = ({
    dayPlans,
    onDaySelect,
    onDayPlanPress,
    selectedDate,
}) => {
    const [currentSelectedDate, setCurrentSelectedDate] = useState<string | undefined>(selectedDate);
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const start = new Date(today);
        start.setDate(today.getDate() - dayOfWeek);
        return start;
    });

    const handleDaySelect = (date: string) => {
        setCurrentSelectedDate(date);
        onDaySelect?.(date);
    };

    // Obtener los day plans de la semana actual
    const weekDayPlans = useMemo(() => {
        const weekDays: string[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            weekDays.push(dateStr);
        }

        return weekDays.map(date => {
            const plan = dayPlans.find(dp => dp.date === date);
            return {
                date,
                dayPlan: plan || null,
                hasPlan: !!plan,
            };
        });
    }, [dayPlans, currentWeekStart]);

    const hasAnyPlan = weekDayPlans.some(item => item.hasPlan);

    // Función para navegar semanas desde el contenedor
    const goToPreviousWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(currentWeekStart.getDate() - 7);
        setCurrentWeekStart(newStart);
    };

    const goToNextWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(currentWeekStart.getDate() + 7);
        setCurrentWeekStart(newStart);
    };

    

    return (
        <View style={styles.container}>
            <WeekView
                onDaySelect={handleDaySelect}
                selectedDate={currentSelectedDate}
                onWeekChange={setCurrentWeekStart}
                currentWeekStart={currentWeekStart}
            />

            {/* Cards de los day plans de la semana */}
            <View style={styles.plansContainer}>
                {weekDayPlans.map(({ date, dayPlan, hasPlan }) => (
                    <View key={date}>
                        {hasPlan && dayPlan && (
                            <DayPlanCard
                                dayPlan={dayPlan}
                                onPress={() => onDayPlanPress?.(dayPlan)}
                            />
                        )}
                    </View>
                ))}
                {!hasAnyPlan && (
                    <View style={styles.emptyContainer}>
                        <Icon
                            name="CalendarX"
                            size={40}
                            color={'#888888'}
                            backgroundColor={theme.colors.background || '#f5f5f5'}
                        />
                        <Text style={styles.emptyText}>
                            No hay planes para esta semana
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    plansContainer: {
        flex: 1,
        paddingTop: 8,
    },
    emptyContainer: {
        paddingVertical: 30,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    emptyText: {
        fontSize: 16,
        color: '#888888',
        fontWeight: 500
    },
});