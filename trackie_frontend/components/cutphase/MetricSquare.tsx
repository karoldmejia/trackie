import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface MetricSquareProps {
    /** Texto superior en gris y mayúsculas (ej: "BALANCE CALÓRICO ACUMULADO") */
    label: string;
    /** Valor principal grande (ej: "+300 kcal") */
    mainValue: string | number;
    /** Texto opcional pequeño al lado del valor principal (ej: "de 1600 kcal") */
    subValue?: string;
    /** Estilo adicional para el contenedor */
    style?: any;
}

const MetricSquare: React.FC<MetricSquareProps> = ({
    label,
    mainValue,
    subValue,
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            {/* Label superior en mayúsculas, gris y pequeño */}
            <ThemedText
                variant="medium"
                size={10}
                color={theme.colors.textLight}
                style={styles.label}
            >
                {label.toUpperCase()}
            </ThemedText>

            {/* Valor principal con sub-valor opcional */}
            <View style={styles.valueContainer}>
                <ThemedText
                    variant="medium"
                    size={18}
                    color={theme.colors.text}
                >
                    {mainValue}
                </ThemedText>
                {subValue && (
                    <ThemedText
                        variant="regular"
                        size={12}
                        color={theme.colors.textLight}
                        style={styles.subValue}
                    >
                        {subValue}
                    </ThemedText>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.white,
        borderRadius: 12,
        padding: 16,
        minHeight: 80,
        justifyContent: 'center',
        elevation: 2,
        shadowColor: 'transparent',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    label: {
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap',
    },
    subValue: {
        marginLeft: 0,
    },
});

export default MetricSquare;