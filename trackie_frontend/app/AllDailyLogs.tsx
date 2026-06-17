import { DailyLogForm, WorkoutType } from '@/components/home/DailyLogForm';
import { DailyLogList } from '@/components/home/DailyLogList';
import { SearchModal } from '@/components/home/SearchModal';
import { SearchResults } from '@/components/home/SearchResults';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { CreateDailyLogDto, DailyLog, dailyLogService } from '@/services/dailyLogService';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const AllDailyLogs: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<DailyLog[]>([]);
    const [currentSearchDate, setCurrentSearchDate] = useState<string | undefined>();
    const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
    const [editFormVisible, setEditFormVisible] = useState(false);

    const handleGoBack = () => {
        router.back();
    };

    const handleSearchPress = () => {
        setSearchModalVisible(true);
    };

    const handleSearch = async (date: string) => {
        try {
            setCurrentSearchDate(date);
            const result = await dailyLogService.getByDate(date).catch(() => null);
            if (result) {
                setSearchResults([result]);
            } else {
                setSearchResults([]);
            }
            setIsSearching(true);
            setSearchModalVisible(false);
        } catch (error) {
            console.error('Error searching:', error);
            setSearchResults([]);
            setIsSearching(true);
        }
    };

    const handleClearSearch = () => {
        setIsSearching(false);
        setSearchResults([]);
        setCurrentSearchDate(undefined);
    };

    const handleLogPress = (log: DailyLog) => {
        setEditingLog(log);
        setEditFormVisible(true);
    };

    const handleEditFormSubmit = async (data: {
        date: string;
        calories: string;
        steps: string;
        proteinGrams: string;
        waterLiters: string;
        workout: WorkoutType;
    }) => {
        try {
            const caloriesValue = parseInt(data.calories);
            const stepsValue = parseInt(data.steps);
            const proteinGramsValue = parseInt(data.proteinGrams);
            const waterLitersValue = parseFloat(data.waterLiters);

            const updatedLog: CreateDailyLogDto = {
                date: data.date,
                calories: isNaN(caloriesValue) ? 0 : caloriesValue,
                steps: isNaN(stepsValue) ? 0 : stepsValue,
                proteinGrams: isNaN(proteinGramsValue) ? 0 : proteinGramsValue,
                waterLiters: isNaN(waterLitersValue) ? 0 : waterLitersValue,
                workout: data.workout,
            };

            await dailyLogService.upsert(updatedLog);
            await fetchData();
            setEditFormVisible(false);
            setEditingLog(null);

            if (isSearching && currentSearchDate === data.date) {
                const updatedResult = await dailyLogService.getByDate(data.date).catch(() => null);
                if (updatedResult) {
                    setSearchResults([updatedResult]);
                }
            }
        } catch (error) {
            console.error('Error updating daily log:', error);
        }
    };

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

    const fetchData = async () => {
        try {
            setLoading(true);
            const logs = await dailyLogService.getAll();

            const sortedLogs = [...logs].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setAllLogs(sortedLogs);
        } catch (error) {
            console.error('Error fetching daily logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        if (isSearching) {
            handleClearSearch();
        }
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.navbar}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <ThemedText variant="medium" size={14} color={theme.colors.text}>
                            Todos mis registros
                        </ThemedText>
                    </View>
                    <TouchableOpacity onPress={handleSearchPress} style={styles.searchButton}>
                        <Icon
                            name="Search"
                            size={18}
                            color={theme.colors.text}
                            backgroundColor={theme.colors.white}
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <ThemedText variant="medium" size={14} color={theme.colors.text}>
                        Todos mis registros
                    </ThemedText>
                </View>
                <TouchableOpacity onPress={handleSearchPress} style={styles.searchButton}>
                    <Icon
                        name="Search"
                        size={18}
                        color={theme.colors.text}
                        backgroundColor={theme.colors.white}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {isSearching ? (
                    <SearchResults
                        results={searchResults}
                        onLogPress={handleLogPress}
                        onClearSearch={handleClearSearch}
                        searchDate={currentSearchDate}
                    />
                ) : (
                    <View style={styles.logsContainer}>
                        {allLogs.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Icon
                                    name="Package"
                                    size={48}
                                    color={theme.colors.textLight}
                                    backgroundColor="transparent"
                                    padding={0}
                                />
                                <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                                    No hay registros diarios aún
                                </ThemedText>
                            </View>
                        ) : (
                            <DailyLogList
                                logs={allLogs}
                                onLogPress={handleLogPress}
                            />
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Modal de búsqueda */}
            <SearchModal
                visible={searchModalVisible}
                onClose={() => setSearchModalVisible(false)}
                onSearch={handleSearch}
            />

            {/* Formulario de edición */}
            <DailyLogForm
                visible={editFormVisible}
                onClose={() => {
                    setEditFormVisible(false);
                    setEditingLog(null);
                }}
                onSubmit={handleEditFormSubmit}
                initialData={editingLog ? {
                    date: editingLog.date,
                    calories: editingLog.calories,
                    steps: editingLog.steps,
                    proteinGrams: editingLog.proteinGrams,
                    waterLiters: editingLog.waterLiters,
                    workout: editingLog.workout,
                } : undefined}
                title="Editar Registro"
                hideDatePicker={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 70,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    searchButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    logsContainer: {
        marginTop: 16,
        marginBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
});

export default AllDailyLogs;