import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

interface ProgressCircleProps {
    currentWeight: number;
    targetWeight: number;
    progress: number;
    unit?: string;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
    currentWeight,
    progress,
    unit = 'kilogramos',
}) => {
    const size = 140;
    const outerStrokeWidth = 8;
    const innerCircleRadius = 45;
    const outerRadius = (size - outerStrokeWidth) / 2;

    const arcPercentage = 0.7;
    const arcDegrees = 360 * arcPercentage;
    const progressAngle = (progress / 100) * arcDegrees;

    const startAngle = -215;
    const endAngle = startAngle + arcDegrees;

    const getPointOnArc = (angleDeg: number) => {
        const angleRad = (angleDeg * Math.PI) / 180;
        const center = size / 2;
        const x = center + outerRadius * Math.cos(angleRad);
        const y = center + outerRadius * Math.sin(angleRad);
        return { x, y };
    };

    const startPoint = getPointOnArc(startAngle);
    const endPoint = getPointOnArc(endAngle);

    const progressEndAngle = startAngle + progressAngle;
    const progressEndPoint = getPointOnArc(progressEndAngle);

    const largeArcFlag = arcDegrees > 180 ? 1 : 0;
    const pathData = `
        M ${startPoint.x} ${startPoint.y}
        A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}
    `;

    const progressPathData = `
        M ${startPoint.x} ${startPoint.y}
        A ${outerRadius} ${outerRadius} 0 ${progressAngle > 180 ? 1 : 0} 1 ${progressEndPoint.x} ${progressEndPoint.y}
    `;

    const iconPoint = getPointOnArc(progressEndAngle);

    return (
        <View style={styles.container}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
                {/* Círculo exterior de fondo */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={outerRadius}
                    fill="none"
                />

                {/* Arco principal (fondo) */}
                <Path
                    d={pathData}
                    stroke={theme.colors.text}
                    strokeWidth={outerStrokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Arco de progreso */}
                <Path
                    d={progressPathData}
                    stroke={theme.colors.white}
                    strokeWidth={outerStrokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Círculo interior */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={innerCircleRadius}
                    fill={theme.colors.white}
                    stroke="#fc3a8b"
                    strokeWidth={6}
                />

                {/* Ícono en el punto de progreso */}
                <G transform={`translate(${iconPoint.x - 12}, ${iconPoint.y - 12})`}>
                    <Circle
                        cx={12}
                        cy={12}
                        r={12}
                        fill={theme.colors.text}
                    />
                    <Icon
                        name="Award"
                        size={14}
                        color={theme.colors.white}
                        backgroundColor="transparent"
                        padding={0}
                        style={styles.iconInside}
                    />
                </G>

            </Svg>

            {/* Texto dentro del círculo interior */}
            <View style={styles.centerText}>
                <ThemedText variant="bold" size={28} color={theme.colors.text}>
                    {currentWeight}
                </ThemedText>
                <ThemedText variant="bold" size={14} color={theme.colors.textLight}>
                    {unit}
                </ThemedText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: 140,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible'
    },
    centerText: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconInside: {
        position: 'absolute',
        top: 5,
        left: 5,
    },
});