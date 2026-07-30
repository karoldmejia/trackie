import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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
    if (score < 50) return '#e74c3c';
    if (score < 75) return '#f39c12';
    if (score < 90) return '#2ecc71';
    return '#27ae60';
};

const getScoreLabel = (score: number): string => {
    if (score === 0) return 'Sin datos';
    if (score < 50) return 'Malo';
    if (score < 75) return 'Regular';
    if (score < 90) return 'Bueno';
    return 'Muy bueno';
};

const getStatusColor = (met: boolean): string => {
    return met ? theme.colors.success : theme.colors.error;
};

const DAYS_OF_WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const AdherenceCalendar: React.FC<AdherenceCalendarProps> = ({ days, totalWeeks }) => {
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Organizar días por semana
    const weeks: DayData[][] = [];
    for (let week = 1; week <= totalWeeks; week++) {
        const weekDays = days.filter(d => d.weekNumber === week);
        weeks.push(weekDays);
    }
    console.log('📅 Total days received:', days.length);
    console.log('📅 First 5 days:', days.slice(0, 5));
        console.log('📅 Weeks organized:', weeks.map(w => w.length));

    // Transponer la matriz: semanas como columnas, días como filas
    const maxDaysInWeek = 7; // Siempre 7 días por semana
    
    const transposedData: (DayData | null)[][] = [];
    for (let dayIndex = 0; dayIndex < maxDaysInWeek; dayIndex++) {
        const row: (DayData | null)[] = [];
        for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
            // Buscar el día específico en esta semana
            const day = weeks[weekIndex].find(d => {
                const date = new Date(d.date);
                return date.getDay() === dayIndex;
            }) || null;
            row.push(day);
        }
        transposedData.push(row);
    }

    const handleDayPress = (day: DayData) => {
        setSelectedDay(day);
        setModalVisible(true);
    };

    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        const formatter = new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        return formatter.format(localDate);
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
            <ThemedText variant="semiBold" size={14} color={theme.colors.text} style={styles.title}>
                Calendario de adherencia
            </ThemedText>

            {/* Scroll horizontal para las semanas */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                    {/* Encabezado: números de semana */}
                    <View style={styles.weekHeader}>
                        <View style={styles.cornerCell} />
                        {weeks.map((_, index) => (
                            <View key={index} style={styles.weekHeaderCell}>
                                <ThemedText
                                    variant="regular"
                                    size={9}
                                    color={theme.colors.textLight}
                                    style={styles.weekNumberText}
                                >
                                    S{index + 1}
                                </ThemedText>
                            </View>
                        ))}
                    </View>

                    {/* Filas: días de la semana */}
                    {DAYS_OF_WEEK.map((dayLabel, dayIndex) => (
                        <View key={dayIndex} style={styles.row}>
                            {/* Etiqueta del día */}
                            <View style={styles.dayLabelCell}>
                                <ThemedText
                                    variant="regular"
                                    size={9}
                                    color={theme.colors.textLight}
                                    style={styles.dayLabelText}
                                >
                                    {dayLabel}
                                </ThemedText>
                            </View>

                            {/* Celdas del día para cada semana */}
                            {transposedData[dayIndex]?.map((day, weekIndex) => (
                                <TouchableOpacity
                                    key={`${dayIndex}-${weekIndex}`}
                                    style={[
                                        styles.dayCell,
                                        { backgroundColor: day ? getScoreColor(day.dailyScore) : theme.colors.placeholder }
                                    ]}
                                    onPress={() => day && handleDayPress(day)}
                                    disabled={!day}
                                    activeOpacity={0.7}
                                >
                                    {day && day.dailyScore > 0 && (
                                        <ThemedText
                                            variant="regular"
                                            size={7}
                                            color={day.dailyScore > 50 ? theme.colors.white : theme.colors.text}
                                            style={styles.dayScore}
                                        >
                                            {day.dailyScore}
                                        </ThemedText>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Leyenda */}
            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#27ae60' }]} />
                    <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                        90-100
                    </ThemedText>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
                    <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                        75-89
                    </ThemedText>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#f39c12' }]} />
                    <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                        50-74
                    </ThemedText>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
                    <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                        0-49
                    </ThemedText>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: theme.colors.placeholder }]} />
                    <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                        Sin datos
                    </ThemedText>
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
                                    <ThemedText variant="semiBold" size={16} color={theme.colors.text}>
                                        {formatDate(selectedDay.date)}
                                    </ThemedText>
                                    <View style={[styles.modalScoreBadge, { backgroundColor: getScoreColor(selectedDay.dailyScore) }]}>
                                        <ThemedText variant="bold" size={14} color={theme.colors.white}>
                                            {selectedDay.dailyScore}
                                        </ThemedText>
                                        <ThemedText variant="regular" size={10} color={theme.colors.white}>
                                            {getScoreLabel(selectedDay.dailyScore)}
                                        </ThemedText>
                                    </View>
                                </View>

                                <View style={styles.modalDetails}>
                                    <View style={styles.modalRow}>
                                        <ThemedText variant="regular" size={13} color={theme.colors.textLight}>
                                            Calorías
                                        </ThemedText>
                                        <View style={styles.modalStatus}>
                                            <ThemedText variant="semiBold" size={13} color={selectedDay.caloriesMet ? theme.colors.success : theme.colors.error}>
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
                                            <ThemedText variant="semiBold" size={13} color={selectedDay.proteinMet ? theme.colors.success : theme.colors.error}>
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
                                            <ThemedText variant="semiBold" size={13} color={selectedDay.stepsMet ? theme.colors.success : theme.colors.error}>
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
                                            <ThemedText variant="semiBold" size={13} color={selectedDay.waterMet ? theme.colors.success : theme.colors.error}>
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
                                            <ThemedText variant="semiBold" size={13} color={selectedDay.workoutMet ? theme.colors.success : theme.colors.error}>
                                                {getWorkoutLabel(selectedDay.workout)}
                                            </ThemedText>
                                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedDay.workoutMet) }]} />
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.modalCloseButton}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <ThemedText variant="medium" size={14} color={theme.colors.primary}>
                                        Cerrar
                                    </ThemedText>
                                </TouchableOpacity>
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
    weekHeader: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    cornerCell: {
        width: 24,
        height: 20,
    },
    weekHeaderCell: {
        width: 28,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekNumberText: {
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 2,
        alignItems: 'center',
    },
    dayLabelCell: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayLabelText: {
        textAlign: 'center',
    },
    dayCell: {
        width: 28,
        height: 24,
        borderRadius: 3,
        marginHorizontal: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayScore: {
        textAlign: 'center',
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 12,
        gap: 6,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 2,
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
        alignItems: 'center',
        marginBottom: 16,
    },
    modalScoreBadge: {
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    modalDetails: {
        gap: 10,
        marginBottom: 16,
    },
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.secondary,
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
    modalCloseButton: {
        alignItems: 'center',
        paddingVertical: 10,
    },
});

export default AdherenceCalendar;