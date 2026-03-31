import { DailyLog } from '@/services/dailyLogService';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { DailyLogCard } from './DailyLogCard';

interface DailyLogListProps {
    logs: DailyLog[];
    onLogPress: (log: DailyLog) => void;
}

export const DailyLogList: React.FC<DailyLogListProps> = ({ logs, onLogPress }) => {
    if (logs.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                    No hay registros aún. ¡Agrega tu primer registro!
                </ThemedText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {logs.map((log) => (
                <DailyLogCard
                    key={log.id}
                    log={log}
                    onPress={() => onLogPress(log)}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
        marginBottom: 20,
    },
    emptyContainer: {
        marginTop: 32,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
});