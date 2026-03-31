import { DailyLog } from '@/services/dailyLogService';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from '../icon';
import { ThemedText } from '../ThemedText';
import { DailyLogCard } from './DailyLogCard';

interface SearchResultsProps {
    results: DailyLog[];
    onLogPress: (log: DailyLog) => void;
    onClearSearch: () => void;
    searchDate?: string;
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

export const SearchResults: React.FC<SearchResultsProps> = ({
    results,
    onLogPress,
    onClearSearch,
    searchDate,
}) => {
    if (results.length === 0 && searchDate) {
        return (
            <View style={styles.emptyContainer}>
                <Icon 
                    name="CalendarSearch" 
                    size={48} 
                    color={theme.colors.textLight}
                    backgroundColor="transparent"
                    padding={0}
                />
                <ThemedText variant="regular" size={14} color={theme.colors.textLight} style={styles.emptyText}>
                    No se encontraron registros para {formatDisplayDate(searchDate)}
                </ThemedText>
                <TouchableOpacity onPress={onClearSearch} style={styles.clearButton}>
                    <ThemedText variant="medium" size={14} color={theme.colors.primary}>
                        Limpiar búsqueda
                    </ThemedText>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <ThemedText variant="medium" size={14} color={theme.colors.textLight} style={styles.headerText}>
                        {'Resultados de búsqueda'}
                    </ThemedText>
                </View>
                <TouchableOpacity onPress={onClearSearch}>
                    <Icon 
                        name="X" 
                        size={16} 
                        color={theme.colors.textLight}
                        backgroundColor="transparent"
                    />
                </TouchableOpacity>
            </View>
            {results.map((log) => (
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
        marginTop: 24,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        marginLeft: 8,
    },
    emptyContainer: {
        marginTop: 32,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    clearButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
});