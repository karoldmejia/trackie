import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { WeightLog } from '@/services/weightLog.service';
import { theme } from '@/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { WeightLogCard } from './WeightLogCard';

interface WeeklySearchResultsProps {
    results: WeightLog[];
    searchDate?: string;
    onLogPress: (log: WeightLog) => void;
    onClearSearch: () => void;
    formatDisplayDate: (dateString: string) => string;
}

export const WeeklySearchResults: React.FC<WeeklySearchResultsProps> = ({
    results,
    searchDate,
    onLogPress,
    onClearSearch,
    formatDisplayDate,
}) => {
    // Función para formatear el rango de la semana
    const formatWeekRange = (dateString: string) => {
        const weekStart = new Date(dateString);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const startStr = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
        const endStr = `${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
        return `${startStr} - ${endStr}`;
    };

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
                    No se encontraron datos para la semana que contiene {formatDisplayDate(searchDate)}
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
                    <Icon 
                        name="Search" 
                        size={16} 
                        color={theme.colors.textLight}
                        backgroundColor="transparent"
                        padding={0}
                    />
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
                        padding={0}
                    />
                </TouchableOpacity>
            </View>
            
            {results.map((log) => (
                <WeightLogCard
                    key={log.id}
                    log={{ ...log, date: log.date }}
                    onPress={() => onLogPress(log)}
                    formatDisplayDate={formatWeekRange}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
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
        gap: 8,
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