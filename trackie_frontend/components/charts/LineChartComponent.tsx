// components/charts/LineChartComponent.tsx
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

export type TimeRange = 'week' | 'month' | 'year';

interface ChartDataPoint {
    value: number;
    label: string;
    date: Date;
}

interface LineChartComponentProps {
    data: ChartDataPoint[];
    unit?: string;
    color?: string;
    onTimeRangeChange?: (range: TimeRange, offset: number) => void;
    onNavigate?: (direction: 'prev' | 'next') => void;
    timeRange?: TimeRange;
    showTimeRangeSelector?: boolean;
    currentPeriodText?: string;
    canGoPrev?: boolean;
    canGoNext?: boolean;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({
    data,
    unit = '',
    color = theme.colors.primary,
    onTimeRangeChange,
    onNavigate,
    timeRange = 'week',
    showTimeRangeSelector = true,
    currentPeriodText = '',
    canGoPrev = true,
    canGoNext = true,
}) => {
    const [selectedRange, setSelectedRange] = useState<TimeRange>(timeRange);
    const screenWidth = Dimensions.get('window').width;

    // Configuración de altura del gráfico
    const CHART_HEIGHT = 350;
    const CHART_TOP_OFFSET = 20;
    const CHART_BOTTOM_OFFSET = 20;

    const timeRanges: { label: string; value: TimeRange }[] = [
        { label: 'Semanas', value: 'week' },
        { label: 'Meses', value: 'month' },
        { label: 'Años', value: 'year' },
    ];

    const handleRangeChange = (range: TimeRange) => {
        setSelectedRange(range);
        onTimeRangeChange?.(range, 0);
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        onNavigate?.(direction);
    };

    // Preparar datos para el gráfico
    const chartData = data.map((point) => ({
        value: point.value,
        label: point.label,
    }));

    // Función para redondear hacia arriba (ceiling)
    const roundUpToNiceNumber = (num: number): number => {
        if (num === 0) return 100;

        const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
        const normalized = num / magnitude;

        let rounded;
        if (normalized <= 1) rounded = 1;
        else if (normalized <= 2) rounded = 2;
        else if (normalized <= 5) rounded = 5;
        else rounded = 10;

        return rounded * magnitude;
    };

    const actualMax = data.length > 0 ? Math.max(...data.map(d => d.value), 0) : 0;
    const maxValue = actualMax > 0 ? roundUpToNiceNumber(actualMax) : 100;

    const step = maxValue / 5;

    const availableHeight = CHART_HEIGHT - CHART_TOP_OFFSET - CHART_BOTTOM_OFFSET;

    const customDataPoints = data.map((point, index) => {
        const value = Math.round(point.value);
        const displayValue = `${value}${unit ? unit : ''}`;

        const spacing = Math.min(50, Math.max(30, (screenWidth - 32) / (chartData.length || 1)));
        const x = 60 + index * spacing;

        const yRatio = point.value / maxValue;
        const y = CHART_TOP_OFFSET + (availableHeight * (1 - yRatio));

        let textOffsetY = -25; // Por defecto arriba
        
        if (y < 50) {
            textOffsetY = -30; // Mostrar abajo
        }
        // Si el punto está cerca del borde inferior (más de 300px), mostrar arriba con mayor desplazamiento
        else if (y > 300) {
            textOffsetY = 20; // Mayor desplazamiento hacia arriba
        }

        return {
            x: x,
            y: y,
            value: point.value,
            label: point.label,
            displayValue: displayValue,
            textOffsetY: textOffsetY,
        };
    });

    const formatYAxisLabel = (label: string): string => {
        const value = parseFloat(label);
        if (isNaN(value)) return '0';
        if (value === 0) return '0';
        if (value >= 1000) return `${Math.round(value / 1000)}k`;
        return Math.round(value).toString();
    };

    const chartWidth = screenWidth - 32;
    const spacing = Math.min(50, Math.max(30, chartWidth / (chartData.length || 1)));

    const hasData = data.length > 0;

    return (
        <View style={styles.container}>
            {/* Selector de rango centrado */}
            {showTimeRangeSelector && (
                <View style={styles.rangeSelectorContainer}>
                    {timeRanges.map((range) => (
                        <TouchableOpacity
                            key={range.value}
                            style={styles.rangeButton}
                            onPress={() => handleRangeChange(range.value)}
                        >
                            <ThemedText
                                variant="medium"
                                size={14}
                                color={selectedRange === range.value ? theme.colors.text : theme.colors.textLight}
                                style={selectedRange === range.value && styles.selectedText}
                            >
                                {range.label}
                            </ThemedText>
                            {selectedRange === range.value && <View style={styles.underline} />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Periodo con botones de navegación */}
            <View style={styles.periodNavigationContainer}>
                <TouchableOpacity
                    style={[styles.navButton, !canGoPrev && styles.navButtonDisabled]}
                    onPress={() => handleNavigate('prev')}
                    disabled={!canGoPrev}
                >
                    <Icon
                        name="ChevronLeft"
                        size={20}
                        color={canGoPrev ? theme.colors.text : theme.colors.textLight}
                        backgroundColor="transparent"
                        padding={0}
                    />
                </TouchableOpacity>

                <View style={styles.periodContainer}>
                    <ThemedText variant="regular" size={12} color={theme.colors.textLight} style={styles.periodText}>
                        {currentPeriodText || 'Sin datos'}
                    </ThemedText>
                </View>

                <TouchableOpacity
                    style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
                    onPress={() => handleNavigate('next')}
                    disabled={!canGoNext}
                >
                    <Icon
                        name="ChevronRight"
                        size={20}
                        color={canGoNext ? theme.colors.text : theme.colors.textLight}
                        backgroundColor="transparent"
                        padding={0}
                    />
                </TouchableOpacity>
            </View>

            {/* Gráfico */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chartScrollContainer}
                >
                    <View style={styles.chartContainer}>
                        <LineChart
                            data={chartData}
                            height={CHART_HEIGHT}
                            width={Math.max(chartWidth, chartData.length * spacing + 40)}
                            spacing={spacing}
                            initialSpacing={20}
                            endSpacing={20}
                            color={color}
                            thickness={2}
                            hideDataPoints={false}
                            dataPointsColor={color}
                            dataPointsRadius={4}
                            isAnimated={true}
                            animationDuration={800}
                            curved={true}
                            showVerticalLines={false}
                            xAxisColor="rgba(0,0,0,0.1)"
                            yAxisColor="rgba(0,0,0,0.1)"
                            xAxisLabelTextStyle={styles.axisLabel}
                            yAxisTextStyle={styles.axisLabel}
                            yAxisLabelPrefix={unit ? `${unit} ` : ''}
                            maxValue={maxValue}
                            stepValue={step}
                            rulesColor="rgba(0,0,0,0.05)"
                            rulesType="solid"
                            dashGap={0}
                            noOfSections={5}
                            formatYLabel={formatYAxisLabel}
                        />

                        {/* Overlay con textos encima de los puntos */}
                        <View style={styles.textOverlay}>
                            {customDataPoints.map((point, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.valueLabel,
                                        {
                                            left: point.x - 20,
                                            top: point.y + point.textOffsetY,
                                        },
                                    ]}
                                >
                                    <Text style={styles.valueText}>
                                        {point.displayValue}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.white,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.005,
        shadowRadius: 4,
        elevation: 2,
    },
    rangeSelectorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
        gap: 32,
    },
    rangeButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignItems: 'center',
        position: 'relative',
    },
    selectedText: {
        textDecorationColor: theme.colors.text,
    },
    underline: {
        position: 'absolute',
        bottom: -2,
        left: 8,
        right: 8,
        height: 2,
        backgroundColor: theme.colors.text,
        borderRadius: 20,
    },
    periodNavigationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 8,
    },
    navButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: theme.colors.background,
    },
    navButtonDisabled: {
        opacity: 0.6,
    },
    periodContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    periodText: {
        marginLeft: 6,
    },
    chartScrollContainer: {
        alignItems: 'center',
    },
    chartContainer: {
        marginVertical: 8,
        minWidth: '100%',
        position: 'relative',
    },
    textOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
    },
    valueLabel: {
        position: 'absolute',
        backgroundColor: 'transparent',
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    valueText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.text,
        textAlign: 'center',
    },
    axisLabel: {
        fontSize: 10,
        color: theme.colors.textLight,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.textLight,
        textAlign: 'center',
    },
});