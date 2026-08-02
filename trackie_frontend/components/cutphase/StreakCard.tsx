import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface StreakCardProps {
    currentStreak: number;
    bestStreak: number;
    lastFailedDate: string | null;
}

const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    const formatter = new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    return formatter.format(localDate);
};

export const StreakCard: React.FC<StreakCardProps> = ({
    currentStreak,
    bestStreak,
    lastFailedDate,
}) => {
    return (
        <View style={styles.card}>
            <View style={styles.streakRow}>
                {/* Racha actual */}
                <View style={styles.streakItem}>
                    <View style={styles.streakIconContainer}>
                        <Icon
                            name="Flame"
                            size={24}
                            color={theme.colors.primary}
                            backgroundColor="transparent"
                            padding={0}
                        />
                    </View>
                    <View style={styles.streakInfo}>
                        <ThemedText variant="bold" size={28} color={theme.colors.primary}>
                            {currentStreak}
                        </ThemedText>
                        <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                            Racha actual
                        </ThemedText>
                        {lastFailedDate && (
                            <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                                Último día perdido: {formatDate(lastFailedDate)}
                            </ThemedText>
                        )}
                    </View>
                </View>

                {/* Mejor racha */}
                <View style={[styles.streakItem, styles.bestStreakItem]}>
                    <View style={styles.streakIconContainer}>
                        <Icon
                            name="Award"
                            size={24}
                            color={theme.colors.primary}
                            backgroundColor="transparent"
                            padding={0}
                        />
                    </View>
                    <View style={styles.streakInfo}>
                        <ThemedText variant="bold" size={28} color={theme.colors.primary}>
                            {bestStreak}
                        </ThemedText>
                        <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                            Mejor racha
                        </ThemedText>
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
    },
    streakRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    streakItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    bestStreakItem: {
        borderLeftWidth: 1,
        borderLeftColor: theme.colors.secondary,
        paddingLeft: 16,
    },
    streakIconContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakInfo: {
        flex: 1,
    },
});

export default StreakCard;