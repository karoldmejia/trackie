import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { WorkoutBlockExecutionInput, WorkoutBlockTemplate } from '@/services/workoutService';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { FormInput } from '../FormInput';

export interface WorkoutBlockRowProps {
    block: WorkoutBlockTemplate;
    input?: WorkoutBlockExecutionInput;
    onChangeRounds: (value: number) => void;
    onChangeMeasure: (value: number) => void;
    onToggleCompleted: (completed: boolean) => void;
}

export const WorkoutBlockRow: React.FC<WorkoutBlockRowProps> = ({
    block,
    input,
    onChangeRounds,
    onChangeMeasure,
    onToggleCompleted,
}) => {
    const completed = input?.completed ?? true;
    const rounds = input?.actualRounds ?? 0;

    const metricConfig = block.metricType === 'distance'
        ? { placeholder: 'km', unit: 'km', value: input?.actualDistanceMeters ?? 0 }
        : block.metricType === 'duration'
            ? { placeholder: 'min', unit: 'min', value: input?.actualDurationSeconds ?? 0 }
            : block.metricType === 'reps'
                ? { placeholder: 'reps', unit: 'reps', value: input?.actualReps ?? 0 }
                : null;

    const handleRounds = (text: string) => {
        const parsed = parseFloat(text);
        onChangeRounds(isNaN(parsed) ? 0 : parsed);
    };

    const handleMeasure = (text: string) => {
        const parsed = parseFloat(text);
        onChangeMeasure(isNaN(parsed) ? 0 : parsed);
    };

    return (
        <View style={styles.row}>
            {/* Check de completado */}
            <TouchableOpacity
                onPress={() => onToggleCompleted(!completed)}
                style={styles.checkButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={completed ? 'Marcar bloque como no completado' : 'Marcar bloque como completado'}
            >
                {completed ? (
                    <View style={styles.checkCircleFilled}>
                        <Icon
                            name="Check"
                            size={14}
                            color="#000"
                            backgroundColor="transparent"
                            padding={0}
                        />
                    </View>
                ) : (
                    <View style={styles.checkCircleEmpty} />
                )}
            </TouchableOpacity>

            {/* Nombre + kind */}
            <ThemedText
                variant="semiBold"
                size={13}
                color={theme.colors.text}
                style={styles.name}
                numberOfLines={1}
            >
                {block.name}
                <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                    {' '}({block.kind})
                </ThemedText>
            </ThemedText>

            {/* Rondas × medida unidad */}
            <View style={styles.rightGroup}>
                <FormInput
                    placeholder="Rondas"
                    value={String(rounds)}
                    onChangeText={handleRounds}
                    keyboardType="numeric"
                    rounded={false}
                    compact={true}
                    containerStyle={styles.roundsInput}
                />
                {metricConfig && (
                    <>
                        <ThemedText variant="regular" size={13} color={theme.colors.textLight}>
                            ×
                        </ThemedText>
                        <FormInput
                            placeholder={metricConfig.placeholder}
                            value={String(metricConfig.value)}
                            onChangeText={handleMeasure}
                            keyboardType="numeric"
                            rounded={false}
                            compact={true}
                            containerStyle={styles.measureInput}
                        />
                        <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                            {metricConfig.unit}
                        </ThemedText>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    checkButton: {
        width: 32,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        flex: 1,
    },
    rightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    checkCircleFilled: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkCircleEmpty: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.placeholder,
    },
    roundsInput: {
        width: 40,
        backgroundColor: theme.colors.inputBackground,
        borderRadius: 12,
    },
    measureInput: {
        width: 60,
        backgroundColor: theme.colors.inputBackground,
        borderRadius: 12,
    },
});
