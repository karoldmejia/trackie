import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface WeekDay {
    day: string;
    number: number;
    date: string;
    isToday: boolean;
}

interface WeekViewProps {
    onDaySelect?: (date: string) => void;
    selectedDate?: string;
    onWeekChange?: (startDate: Date) => void;
    currentWeekStart?: Date;
}

export const WeekView: React.FC<WeekViewProps> = ({ 
    onDaySelect, 
    selectedDate,
    onWeekChange,
    currentWeekStart: externalWeekStart,
}) => {
    const [internalWeekStart, setInternalWeekStart] = useState(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const start = new Date(today);
        start.setDate(today.getDate() - dayOfWeek);
        return start;
    });

    const currentWeekStart = externalWeekStart || internalWeekStart;

    const goToPreviousWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(currentWeekStart.getDate() - 7);
        if (onWeekChange) {
            onWeekChange(newStart);
        } else {
            setInternalWeekStart(newStart);
        }
    };

    const goToNextWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(currentWeekStart.getDate() + 7);
        if (onWeekChange) {
            onWeekChange(newStart);
        } else {
            setInternalWeekStart(newStart);
        }
    };

    const goToToday = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const start = new Date(today);
        start.setDate(today.getDate() - dayOfWeek);
        if (onWeekChange) {
            onWeekChange(start);
        } else {
            setInternalWeekStart(start);
        }
    };

    const getWeekDays = (startDate: Date): WeekDay[] => {
        const days: WeekDay[] = [];
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            days.push({
                day: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][i],
                number: date.getDate(),
                date: dateStr,
                isToday: dateStr === todayStr,
            });
        }
        return days;
    };
    
    const formatMonthYear = (date: Date): string => {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const weekDays = getWeekDays(currentWeekStart);
    const monthYear = formatMonthYear(currentWeekStart);

    const isSelected = (date: string) => selectedDate === date;

    return (
        <View style={styles.container}>
            {/* Header con mes/año a la izquierda y botones a la derecha */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goToToday} style={styles.monthContainer}>
                    <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                        {monthYear}
                    </ThemedText>
                </TouchableOpacity>
                
                <View style={styles.navButtonsContainer}>
                    <TouchableOpacity onPress={goToPreviousWeek}>
                        <Icon 
                            name="ChevronLeft" 
                            size={20} 
                            color={theme.colors.white}
                            backgroundColor={theme.colors.text}
                        />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={goToNextWeek}>
                        <Icon 
                            name="ChevronRight" 
                            size={20} 
                            color={theme.colors.white}
                            backgroundColor={theme.colors.text}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Días de la semana */}
            <View style={styles.daysContainer}>
                {weekDays.map((day, index) => {
                    const selected = isSelected(day.date);
                    const isToday = day.isToday;
                    
                    // Determinar el color del texto
                    let textColor = theme.colors.text;
                    if (isToday) {
                        textColor = theme.colors.white;
                    } else if (selected) {
                        textColor = theme.colors.white;
                    }
                    
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dayItem,
                                isToday && styles.dayItemToday,
                                selected && styles.dayItemSelected
                            ]}
                            onPress={() => onDaySelect?.(day.date)}
                        >
                            <ThemedText 
                                variant="regular" 
                                size={12} 
                                color={textColor}
                                style={styles.dayText}
                            >
                                {day.day}
                            </ThemedText>
                            <ThemedText 
                                variant="semiBold" 
                                size={18} 
                                color={textColor}
                                style={styles.numberText}
                            >
                                {day.number}
                            </ThemedText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
        padding: 10,
        marginBottom: 16,
        shadowColor: 'transparent',
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    monthContainer: {
        paddingHorizontal: 4,
        paddingVertical: 4,
        flex: 1,
    },
    navButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    daysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    dayItem: {
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        minWidth: 40,
    },
    dayItemToday: {
        backgroundColor: theme.colors.text,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    dayItemSelected: {
        backgroundColor: theme.colors.textLight,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    dayText: {
        marginBottom: 4,
    },
    numberText: {
        lineHeight: 24,
    },
});