import { ThemedText } from '@/components/ThemedText';
import { WeightLog } from '@/services/weightLog.service';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WeightLogCard } from './WeightLogCard';

interface WeightLogListProps {
    logs: WeightLog[];
    onLogPress: (log: WeightLog) => void;
    formatDisplayDate: (dateString: string) => string;
    maxItems?: number;
}

export const WeightLogList: React.FC<WeightLogListProps> = ({
    logs,
    onLogPress,
    formatDisplayDate,
    maxItems = 300,
}) => {
    if (logs.length === 0) return null;

    const displayLogs = logs.slice(0, maxItems);

    return (
        <View style={styles.historySection}>
            <View style={styles.historyHeader}>
                <ThemedText variant="medium" size={12} color={theme.colors.textLight} style={styles.historyTitle}>
                    PROMEDIO POR SEMANA
                </ThemedText>
            </View>

            {displayLogs.map((log) => (
                <WeightLogCard
                    key={log.id}
                    log={log}
                    onPress={onLogPress}
                    formatDisplayDate={formatDisplayDate}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    historySection: {
        marginTop: 16,
        marginBottom: 16,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    historyTitle: {
        letterSpacing: 0.5,
    },
});