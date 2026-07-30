import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface CutPhaseDetailsHeaderProps {
    startDate: string;
    endDate: string;
    totalWeeks: number;
    currentWeek: number;
    compliancePercentage: number;
    targets: {
        calories: number;
        protein: number;
        steps: number;
        water: number;
        workoutsPerWeek: number;
    };
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

export const CutPhaseDetailsHeader: React.FC<CutPhaseDetailsHeaderProps> = ({
    startDate,
    endDate,
    totalWeeks,
    currentWeek,
    compliancePercentage,
    targets,
}) => {
    const formattedStartDate = formatDisplayDate(startDate);
    const formattedEndDate = formatDisplayDate(endDate);
    const compliance = Math.round(compliancePercentage);
    const progress = totalWeeks > 0 ? (currentWeek / totalWeeks) * 100 : 0;

    return (
        <View style={styles.card}>
            <View style={styles.row}>
                {/* Columna izquierda: ocupa todo el espacio */}
                <View style={styles.leftColumn}>
                    {/* Primera fila: Fechas */}
                    <View style={styles.dateRow}>
                        <ThemedText 
                            variant="regular" 
                            size={12} 
                            color={theme.colors.textLight}
                        >
                            {formattedStartDate} - {formattedEndDate}
                        </ThemedText>
                    </View>

                    {/* Segunda fila: Objetivos */}
                    <View style={styles.targetsRow}>
                        <View style={styles.targetItem}>
                            <ThemedText variant="semiBold" size={13} color={theme.colors.text}>
                                {targets.calories}
                            </ThemedText>
                            <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                                kcal
                            </ThemedText>
                        </View>
                        <View style={styles.targetItem}>
                            <ThemedText variant="semiBold" size={13} color={theme.colors.text}>
                                {targets.protein}
                            </ThemedText>
                            <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                                g
                            </ThemedText>
                        </View>
                        <View style={styles.targetItem}>
                            <ThemedText variant="semiBold" size={13} color={theme.colors.text}>
                                {targets.steps}
                            </ThemedText>
                            <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                                pasos
                            </ThemedText>
                        </View>
                        <View style={styles.targetItem}>
                            <ThemedText variant="semiBold" size={13} color={theme.colors.text}>
                                {targets.water}
                            </ThemedText>
                            <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                                L
                            </ThemedText>
                        </View>
                        <View style={styles.targetItem}>
                            <ThemedText variant="semiBold" size={13} color={theme.colors.text}>
                                {targets.workoutsPerWeek}
                            </ThemedText>
                            <ThemedText variant="regular" size={9} color={theme.colors.textLight}>
                                ejerc.
                            </ThemedText>
                        </View>
                    </View>
                </View>

                {/* Compliance con posición absoluta abajo a la derecha */}
                <View style={styles.complianceWrapper}>
                    <View style={styles.complianceContainer}>
                        <ThemedText variant="bold" size={30} color={theme.colors.text}>
                            {compliance}
                        </ThemedText>
                        <ThemedText variant="bold" size={18} color={theme.colors.text}>
                            %
                        </ThemedText>
                    </View>
                </View>
            </View>

            {/* Progress bar con semanas al principio */}
            <View>
                <View style={styles.progressWrapper}>
                    <ThemedText 
                        variant="semiBold" 
                        size={10} 
                        color={theme.colors.text}
                        style={styles.weekTextLeft}
                    >
                        {currentWeek}/{totalWeeks}
                    </ThemedText>
                    <View style={styles.progressBarTrack}>
                        <View 
                            style={[
                                styles.progressBarFill,
                                { width: `${Math.min(progress, 100)}%` }
                            ]} 
                        />
                    </View>
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
        position: 'relative',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 60,
    },
    leftColumn: {
        flex: 1,
        gap: 6,
        paddingRight: 80,
    },
    complianceWrapper: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        paddingBottom: 0,
    },
    complianceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    targetsRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    targetItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    progressWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        gap: 0,
    },
    progressBarTrack: {
        flex: 1,
        height: 6,
        backgroundColor: theme.colors.text,
        borderRadius: 3,
        overflow: 'hidden',
        borderWidth: 0,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 3,
        borderWidth: 0,
    },
    weekTextLeft: {
        flexShrink: 0,
        minWidth: 25,
    },
});

export default CutPhaseDetailsHeader;