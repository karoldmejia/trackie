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
                        <ThemedText 
                            variant="regular" 
                            size={12} 
                            color={theme.colors.textLight}
                        >
                            {formattedStartDate} - {formattedEndDate}
                        </ThemedText>
                    </View>
                    <View style={styles.headerRight}>
                        <ThemedText 
                            variant="regular" 
                            size={12} 
                            color={theme.colors.textLight}
                            style={styles.weeksText}
                        >
                            {phase.totalWeeks} semanas
                        </ThemedText>
                        <Icon 
                            name="Asterisk" 
                            size={16} 
                            color={phase.isActive ? theme.colors.primary : theme.colors.placeholder}
                            backgroundColor="transparent"
                            style={styles.asterikIcon}
                        />
                    </View>
                </View>

                <View style={styles.historyStats}>
                    <View style={styles.historyStat}>
                        <ThemedText variant="bold" size={16} color={theme.colors.text}>
                            {compliance}
                        </ThemedText>
                        <ThemedText variant="semiBold" size={12} color={theme.colors.textLight}>
                            %
                        </ThemedText>
                    </View>
                    <View style={styles.historyStat}>
                        <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                            {getDifferenceText(phase.weightDifference)}
                        </ThemedText>
                        <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                            kg
                        </ThemedText>
                    </View>
                    <View style={styles.historyStat}>
                        <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                            {getDifferenceText(phase.waistDifference)}
                        </ThemedText>
                        <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                            cm
                        </ThemedText>
                    </View>
                    <View style={styles.historyStat}>
                        <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                            {getDifferenceText(phase.hipsDifference)}
                        </ThemedText>
                        <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                            cm
                        </ThemedText>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 0,
        shadowColor: 'transparent',
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weeksText: {
        marginRight: 8,
    },
    asterikIcon: {
        paddingHorizontal: 0,
    },
    statsContainer: {
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    historyCard: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
        borderWidth: 0,
        shadowColor: 'transparent',
        elevation: 1,
    },
    historyStats: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'baseline',
    },
    historyStat: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    historyCardContent: {
        flex: 1
    },
});

export default CutPhaseCard;