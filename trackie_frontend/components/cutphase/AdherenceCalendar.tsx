import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Icon } from '../icon';

interface DayData {
    date: string;
    weekNumber: number;
    dailyScore: number;
    allMet: boolean;
    caloriesMet: boolean;
    proteinMet: boolean;
    stepsMet: boolean;
    waterMet: boolean;
    workoutMet: boolean;
    calories: number;
    protein: number;
    steps: number;
    water: number;
    workout: string;
}

interface AdherenceCalendarProps {
    days: DayData[];
    totalWeeks: number;
}

const getScoreColor = (score: number): string => {
    if (score === 0) return theme.colors.placeholder;
    if (score < 50) return '#FFF0F2';
    if (score < 75) return '#FCD7DD';
    if (score < 90) return '#FFB6C1';
    return '#FA9DAB';
};

const getScoreLabel = (score: number): string => {
    if (score === 0) return 'Sin datos';
    if (score < 50) return 'Malo';
    if (score < 75) return 'Regular';
    if (score < 90) return 'Bueno';
    return 'Muy bueno';
};

const getStatusColor = (met: boolean): string => {
    return met ? '#079C3B' : '#C11027';
};

const DAYS_OF_WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const AdherenceCalendar: React.FC<AdherenceCalendarProps> = ({ days, totalWeeks }) => {
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const { width } = useWindowDimensions();

    // Organizar días por semana
    const weeks: DayData[][] = [];
    for (let week = 1; week <= totalWeeks; week++) {
        const weekDays = days.filter(d => d.weekNumber === week);
        weeks.push(weekDays);
    }

    // Transponer: semanas como columnas, días como filas
    const maxDaysInWeek = 7;
    const transposedData: (DayData | null)[][] = [];
    for (let dayIndex = 0; dayIndex < maxDaysInWeek; dayIndex++) {
        const row: (DayData | null)[] = [];
        for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
            const day = weeks[weekIndex].find(d => {
                const date = new Date(d.date);
                return date.getDay() === dayIndex;
            }) || null;
            row.push(day);
        }
        transposedData.push(row);
    }


    const padding = 30; // padding horizontal del contenedor
    const availableWidth = width - padding * 2;
    const labelWidth = 22;
    const gap = 4;

    const maxCellSize = Math.floor((availableWidth - labelWidth - (weeks.length - 1) * gap) / weeks.length);
    const cellSize = Math.min(Math.max(maxCellSize, 14), 32); // entre 14px y 32px
   const rowGap = cellSize * 0.2;

    const handleDayPress = (day: DayData) => {
        setSelectedDay(day);
        setModalVisible(true);
    };

    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);

        const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const dia = String(localDate.getDate()).padStart(2, '0');
        const mes = meses[localDate.getMonth()];
        const año = localDate.getFullYear();

        return `${dia} ${mes} ${año}`;
    };

    const getWorkoutLabel = (workout: string): string => {
        const translations: Record<string, string> = {
            'none': 'Ninguno',
            'upper': 'Superior',
            'lower': 'Glúteos y pierna',
            'full': 'Full body',
            'cardio': 'Cardio',
        };
        return translations[workout] || workout;
    };

    return (
        <View style={styles.container}>
            <View style={styles.calendarWrapper}>
                {/* Filas: días de la semana */}
                {DAYS_OF_WEEK.map((dayLabel, dayIndex) => (
                    <View key={dayIndex} style={[styles.row, { marginBottom: rowGap }]}>
                        <View style={[styles.dayLabelCell, { width: labelWidth, height: cellSize }]}>
                            <ThemedText
                                variant="regular"
                                size={9}
                                color={theme.colors.textLight}
                                style={styles.dayLabelText}
                            >
                                {dayLabel}
                            </ThemedText>
                        </View>

                        {transposedData[dayIndex]?.map((day, weekIndex) => {
                            const isEmpty = !day || day.dailyScore === 0;
                            const bgColor = isEmpty
                                ? '#f0f0f0' // Gris muy claro para relleno
                                : getScoreColor(day.dailyScore);

                            return (
                                <TouchableOpacity
                                    key={`${dayIndex}-${weekIndex}`}
                                    style={[
                                        styles.dayCell,
                                        {
                                            width: cellSize,
                                            height: cellSize,
                                            borderRadius: Math.min(cellSize * 0.25, 6),
                                            backgroundColor: bgColor,
                                            marginHorizontal: gap / 2,
                                        }
                                    ]}
                                    onPress={() => day && !isEmpty && handleDayPress(day)}
                                    disabled={isEmpty}
                                    activeOpacity={0.7}
                                >
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* Leyenda */}
            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                        Mejor
                    </ThemedText>
                    <View style={[styles.legendColor, { backgroundColor: '#FA9DAB' }]} />
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#FFB6C1' }]} />
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#FCD7DD' }]} />
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#FFF0F2' }]} />
                </View>
                <View style={styles.legendItem}>
                    <ThemedText variant="regular" size={10} color={theme.colors.textLight}> Peor</ThemedText>
                </View>
            </View>

            {/* Modal de detalle del día */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        {selectedDay && (
                            <>
                                <View style={styles.modalHeader}>
                                    <View style={styles.scoreBadgeContainer}>

                                        <ThemedText variant="semiBold" size={12} color={theme.colors.placeholder}>
                                            {formatDate(selectedDay.date).toUpperCase()}
                                        </ThemedText>
                                        <View style={[styles.scoreBadge]}>
                                            <Icon
                                                name="Asterisk"
                                                size={30}
                                                color={getScoreColor(selectedDay.dailyScore)}
                                                backgroundColor="transparent"
                                                padding={0}
                                                style={styles.badgeIcon}
                                            />
                                            <View style={styles.badgeTextContainer}>
                                                <ThemedText variant="bold" size={16} color={theme.colors.text}>
                                                    {selectedDay.dailyScore} ({getScoreLabel(selectedDay.dailyScore).toLowerCase()})
                                                </ThemedText>
                                            </View>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => setModalVisible(false)}
                                        style={styles.closeButton}
                                    >
                                        <Icon
                                            name="X"
                                            size={20}
                                            color={theme.colors.text}
                                            backgroundColor="transparent"
                                            padding={0}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Detalles del día */}
                                <View style={styles.modalDetails}>
                                    <View style={styles.modalRow}>
                                        <ThemedText variant="regular" size={13} color={theme.colors.textLight}>
                                            Calorías
                                        </ThemedText>
                                        <View style={styles.modalStatus}>
                                            <ThemedText variant="semiBold" size={13} color={theme.colors.text}>
                                                {selectedDay.calories}
                                            </ThemedText>
                                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedDay.caloriesMet) }]} />
                                        </View>
                                    </View>

                                    <View style={styles.modalRow}>
                                        <ThemedText variant="regular" size={13} color={theme.colors.textLight}>
                                            Proteína
                                        </ThemedText>
                                        <View style={styles.modalStatus}>
                                            <ThemedText variant="semiBold" size={13} color={theme.colors.text}>
                                                {selectedDay.protein}g
                                            </ThemedText>
                                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedDay.proteinMet) }]} />
                                        </View>
                                    </View>

                                    <View style={styles.modalRow}>
                                        <ThemedText variant="regular" size={13} color={theme.colors.textLight}>
                                            Pasos
                                        </ThemedText>
                                        <View style={styles.modalStatus}>
                                            <ThemedText variant="semiBold" size={13} color={theme.colors.text}>
                                                {selectedDay.steps}
                                            </ThemedText>
                                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedDay.stepsMet) }]} />
                                        </View>
                                    </View>

                                    <View style={styles.modalRow}>
                                        <ThemedText variant="regular" size={13} color={theme.colors.textLight}>
                                            Agua
                                        </ThemedText>
                                        <View style={styles.modalStatus}>
                                            <ThemedText variant="semiBold" size={13} color={theme.colors.text}>
                                                {selectedDay.water}L
                                            </ThemedText>
                                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedDay.waterMet) }]} />
                                        </View>
                                    </View>

                                    <View style={styles.modalRow}>
                                        <ThemedText variant="regular" size={13} color={theme.colors.textLight}>
                                            Entrenamiento
                                        </ThemedText>
                                        <View style={styles.modalStatus}>
                                            <ThemedText variant="semiBold" size={13} color={theme.colors.text}>
                                                {getWorkoutLabel(selectedDay.workout)}
                                            </ThemedText>
                                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedDay.workoutMet) }]} />
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
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
    title: {
        marginBottom: 12,
    },
    calendarWrapper: {
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    headerRow: {
        marginBottom: 6,
    },
    cornerCell: {
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekHeaderCell: {
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekNumberText: {
        textAlign: 'center',
    },
    dayLabelCell: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayLabelText: {
        textAlign: 'center',
    },
    dayCell: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0,
    },
    dayScore: {
        textAlign: 'center',
        fontWeight: '600',
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 5,
        gap: 2,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        height: 16,
        justifyContent: 'center',
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 3,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 20,
        width: '85%',
        maxWidth: 340,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    closeButton: {
        padding: 4,
    },
    scoreBadgeContainer: {
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
        borderRadius: 12,
        justifyContent: 'center',
    },
    badgeIcon: {
        marginRight: 2,
    },
    badgeTextContainer: {
        alignItems: 'flex-start',
    },
    modalDetails: {
        gap: 0,
    },
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    modalStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});

export default AdherenceCalendar;