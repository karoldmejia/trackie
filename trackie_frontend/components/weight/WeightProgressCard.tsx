import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ProgressCircle } from './ProgressCircle';

interface WeightProgressCardProps {
    progress: number;
    currentWeight: number;
    targetWeight: number;
    onAddPress: () => void;
}

export const WeightProgressCard: React.FC<WeightProgressCardProps> = ({
    progress,
    currentWeight,
    targetWeight,
    onAddPress,
}) => {

    return (
        <View style={styles.progressCard}>
            <View style={styles.cardContent}>
                <View style={styles.leftSection}>
                    <View style={styles.headerLeft}>
                        <Icon
                            name="TrendingUp"
                            size={16}
                            color={theme.colors.text}
                        />
                        <ThemedText variant="medium" size={13} color={theme.colors.text} style={styles.title}>
                            Mi progreso
                        </ThemedText>
                    </View>

                    <ThemedText variant="bold" size={40} color={theme.colors.text} style={styles.percentage}>
                        {Math.round(progress)}%
                    </ThemedText>

                    <TouchableOpacity style={styles.addButton} onPress={onAddPress} activeOpacity={0.7}>
                        <ThemedText variant="medium" size={12} color={theme.colors.text}>
                            Añadir
                        </ThemedText>
                        <Icon
                            name="Plus"
                            size={16}
                            color={theme.colors.text}
                            backgroundColor="transparent"
                            padding={0}
                            style={styles.plusIcon}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.rightSection}>
                    <ProgressCircle
                        currentWeight={currentWeight}
                        progress={progress}
                        targetWeight={targetWeight}
                        unit="kilos"
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    progressCard: {
        backgroundColor: theme.colors.primary,
        borderRadius: 24,
        padding: 20,
        marginTop: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftSection: {
        flex: 1,
        paddingRight: 16,
    },
    rightSection: {
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ translateY: 15 }],
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 5,
    },
    title: {
        letterSpacing: 0.5,
    },
    percentage: {
        marginBottom: 10,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        gap: 4,
    },
    plusIcon: {
        marginLeft: 2,
    },
});