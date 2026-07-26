import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface CutPhaseCardProps {
    phase: {
        id: string;
        startDate: string;
        endDate: string;
        totalWeeks: number;
        isActive: boolean;
        compliancePercentage: number;
        weightDifference?: number | null;
        waistDifference?: number | null;
        hipsDifference?: number | null;
    };
    onPress: () => void;
}

const formatDisplayDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    
    const formatter = new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return formatter.format(localDate);
};

const getDifferenceText = (difference: number | null | undefined): string => {
    if (difference === null || difference === undefined) return '--';
    const sign = difference > 0 ? '+' : '';
    return `${sign}${difference.toFixed(1)}`;
};

export const CutPhaseCard: React.FC<CutPhaseCardProps> = ({ phase, onPress }) => {
    const formattedStartDate = formatDisplayDate(phase.startDate);
    const formattedEndDate = formatDisplayDate(phase.endDate);
    const compliance = Math.round(phase.compliancePercentage);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <View style={styles.card}>
                {/* Header con fechas y estado */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.dateRow}>
                            <Icon 
                                name="Calendar" 
                                size={14} 
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
                                {formattedStartDate} - {formattedEndDate}
                            </ThemedText>
                        </View>
                        <ThemedText 
                            variant="regular" 
                            size={11} 
                            color={theme.colors.textLight}
                            style={styles.weeksText}
                        >
                            {phase.totalWeeks} semanas
                        </ThemedText>
                    </View>
                    <View style={styles.headerRight}>
                        {/* Círculo de estado */}
                        <View style={[
                            styles.statusCircle,
                            phase.isActive ? styles.activeCircle : styles.inactiveCircle
                        ]} />
                    </View>
                </View>

                {/* Cumplimiento - Negrita notoria */}
                <View style={styles.complianceSection}>
                    <ThemedText variant="bold" size={36} color={theme.colors.primary}>
                        {compliance}%
                    </ThemedText>
                    <ThemedText variant="medium" size={14} color={theme.colors.textLight}>
                        Cumplimiento
                    </ThemedText>
                </View>

                {/* Diferencias de medidas */}
                <View style={styles.measurementsSection}>
                    <View style={styles.measurementsRow}>
                        {/* Peso */}
                        <View style={styles.measurementItem}>
                            <Icon 
                                name="Weight" 
                                size={14} 
                                color={theme.colors.textLight}
                                backgroundColor="transparent"
                                padding={0}
                            />
                            <ThemedText 
                                variant="medium" 
                                size={13} 
                                color={theme.colors.textLight}
                                style={styles.measurementText}
                            >
                                {getDifferenceText(phase.weightDifference)} kg
                            </ThemedText>
                        </View>

                        {/* Cintura */}
                        <View style={styles.measurementItem}>
                            <Icon 
                                name="Ruler" 
                                size={14} 
                                color={theme.colors.textLight}
                                backgroundColor="transparent"
                                padding={0}
                            />
                            <ThemedText 
                                variant="medium" 
                                size={13} 
                                color={theme.colors.textLight}
                                style={styles.measurementText}
                            >
                                {getDifferenceText(phase.waistDifference)} cm
                            </ThemedText>
                        </View>

                        {/* Cadera */}
                        <View style={styles.measurementItem}>
                            <Icon 
                                name="Ruler" 
                                size={14} 
                                color={theme.colors.textLight}
                                backgroundColor="transparent"
                                padding={0}
                            />
                            <ThemedText 
                                variant="medium" 
                                size={13} 
                                color={theme.colors.textLight}
                                style={styles.measurementText}
                            >
                                {getDifferenceText(phase.hipsDifference)} cm
                            </ThemedText>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
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
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    dateText: {
        marginLeft: 6,
    },
    weeksText: {
        marginLeft: 20,
    },
    statusCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginLeft: 8,
    },
    activeCircle: {
        backgroundColor: theme.colors.success,
    },
    inactiveCircle: {
        backgroundColor: theme.colors.placeholder,
    },
    complianceSection: {
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 8,
    },
    measurementsSection: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.secondary,
        paddingTop: 12,
    },
    measurementsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    measurementItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    measurementText: {
        marginLeft: 4,
    },
});

export default CutPhaseCard;