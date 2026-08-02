import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface MeasurementData {
    initial: number | null;
    current: number | null;
    difference: number | null;
}

interface MeasurementsTableProps {
    measurements: {
        weight: MeasurementData;
        bodyfat: MeasurementData;
        waist: MeasurementData;
        hips: MeasurementData;
    };
}

const formatValue = (value: number | null, unit: string): string => {
    if (value === null || value === undefined) return '--';
    return `${value}${unit}`;
};

const formatDifference = (difference: number | null, unit: string): string => {
    if (difference === null || difference === undefined) return '--';
    const sign = difference > 0 ? '+' : '';
    return `${sign}${difference.toFixed(1)}${unit}`;
};

const getDifferenceColor = (difference: number | null): string => {
    if (difference === null || difference === undefined) return theme.colors.textLight;
    // Para peso, cintura, cadera y grasa: valores negativos son buenos
    return difference < 0 ? theme.colors.success : theme.colors.error;
};

export const MeasurementsTable: React.FC<MeasurementsTableProps> = ({ measurements }) => {
    const rows = [
        { label: 'Peso', key: 'weight', unit: 'kg', icon: 'Weight' },
        { label: 'Grasa corporal', key: 'bodyfat', unit: '%', icon: 'Percent' },
        { label: 'Cintura', key: 'waist', unit: 'cm', icon: 'Ruler' },
        { label: 'Cadera', key: 'hips', unit: 'cm', icon: 'Ruler' },
    ] as const;

    return (
        <View style={styles.card}>
            {/* Título */}
            <View style={styles.titleContainer}>
                <Icon
                    name="Activity"
                    size={14}
                        color={theme.colors.placeholder}
                        backgroundColor={theme.colors.background}
                        borderRadius={50}
                />
                <ThemedText variant="medium" size={13} color={theme.colors.text}>
                    Medidas
                </ThemedText>
            </View>

            {/* Tabla */}
            <View style={styles.table}>
                {/* Encabezado */}
                <View style={[styles.row, styles.headerRow]}>
                    <View style={styles.measureCell}>
                        <ThemedText variant="semiBold" size={12} color={theme.colors.textLight}>
                            Medida
                        </ThemedText>
                    </View>
                    <View style={styles.valueCell}>
                        <ThemedText variant="semiBold" size={12} color={theme.colors.textLight}>
                            Inicial
                        </ThemedText>
                    </View>
                    <View style={styles.valueCell}>
                        <ThemedText variant="semiBold" size={12} color={theme.colors.textLight}>
                            Actual
                        </ThemedText>
                    </View>
                </View>

                {/* Filas de datos */}
                {rows.map((row) => {
                    const data = measurements[row.key];
                    const differenceColor = getDifferenceColor(data.difference);

                    return (
                        <View key={row.key} style={[styles.row, styles.dataRow]}>
                            <View style={styles.measureCell}>
                                <ThemedText variant="regular" size={13} color={theme.colors.text}>
                                    {row.label}
                                </ThemedText>
                            </View>
                            <View style={styles.valueCell}>
                                <ThemedText variant="regular" size={13} color={theme.colors.textLight}>
                                    {formatValue(data.initial, row.unit)}
                                </ThemedText>
                            </View>
                            <View style={styles.valueCell}>
                                <View style={styles.currentValueContainer}>
                                    <ThemedText variant="medium" size={13} color={theme.colors.text}>
                                        {formatValue(data.current, row.unit)}
                                    </ThemedText>
                                    {data.difference !== null && data.difference !== undefined && (
                                    <ThemedText variant="medium" size={13} color={theme.colors.text}>

                                            ({formatDifference(data.difference, row.unit)})
                                        </ThemedText>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                })}
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
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    table: {
        gap: 0,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    headerRow: {
        paddingVertical: 6,
    },
    dataRow: {
        paddingVertical: 6,
    },
    measureCell: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    valueCell: {
        flex: 1.,
        alignItems: 'center',
    },
    rowIcon: {
        marginRight: 2,
    },
    currentValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    differenceText: {
        marginLeft: 2,
    },
});

export default MeasurementsTable;