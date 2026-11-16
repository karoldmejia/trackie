import { CreateMetricModal } from '@/components/home/CreateMetricModal';
import { DateHeader } from '@/components/home/DateHeader';
import { MetricsGrid } from '@/components/home/MetricsGrid';
import { SearchModal } from '@/components/home/SearchModal';
import { SearchResults } from '@/components/home/SearchResults';
import { StatsOverview } from '@/components/home/StatsOverview';
import { WeeklyDailyList } from '@/components/home/WeeklyDailyList';
import { WorkoutVideo } from '@/components/home/WorkoutVideo';
import { Icon } from '@/components/icon';
import { LongButton } from '@/components/LongButton';
import { NavBar } from '@/components/navbar';
import { DailyLog, dailyLogService } from '@/services/dailyLogService';
import { Program, ProgramDashboard, programService } from '@/services/programService';
import { Settings, settingsService } from '@/services/settingsService';
import { WorkoutRoutine, workoutService } from '@/services/workoutService';
import { theme } from '@/theme';
import { calculateWeeklyAveragesFromDailyLogs, getWeekEndDate, getWeekStartDate, parseLocalDate, WeeklyDailyAverage } from '@/utils/weeklyAverages';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

const logo = require('@/assets/home_logo.png');
const workoutVideo = require('@/assets/workout_loop.mp4');

const HomeScreen: React.FC = () => {
    const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
    const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
    const [searchResults, setSearchResults] = useState<DailyLog[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [currentSearchDate, setCurrentSearchDate] = useState<string | undefined>();
    const [activeProgram, setActiveProgram] = useState<Program | null>(null);
    const [programDashboard, setProgramDashboard] = useState<ProgramDashboard | null>(null);
    const [workoutRoutines, setWorkoutRoutines] = useState<WorkoutRoutine[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createMetricVisible, setCreateMetricVisible] = useState(false);
    const [isSearchingWeekly, setIsSearchingWeekly] = useState(false);
    const [weeklySearchResults, setWeeklySearchResults] = useState<WeeklyDailyAverage[]>([]);
    const router = useRouter();

    const getLocalDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = getLocalDate();

    // Calcular promedios semanales
    const weeklyAverages = useMemo(() => {
        if (!allLogs.length || !settings) return [];
        return calculateWeeklyAveragesFromDailyLogs(allLogs, settings.weekStartDay ?? 1);
    }, [allLogs, settings]);

    // Workouts ejecutados en la semana actual (cuenta executions de todos los logs de la semana)
    const workoutsThisWeek = useMemo(() => {
        if (!settings) return 0;
        const weekStartDay = settings.weekStartDay ?? 1;
        const start = getWeekStartDate(new Date(), weekStartDay);
        const end = getWeekEndDate(start);
        return allLogs
            .filter((log) => {
                const d = parseLocalDate(log.date);
                return d >= start && d <= end;
            })
            .reduce((sum, log) => sum + (log.workouts?.length ?? 0), 0);
    }, [allLogs, settings]);

    const activeRoutinesCount = workoutRoutines.filter((r) => r.isActive).length;
    const programScore = programDashboard?.summary?.averageScore ?? 0;
    const programCurrentWeek = programDashboard?.program?.currentWeek ?? 0;
    const programWeeksRemaining = activeProgram
        ? Math.max(0, activeProgram.totalWeeks - programCurrentWeek)
        : 0;
    const programTotalWeeks = activeProgram?.totalWeeks ?? 0;

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [logData, settingsData, allLogsData, activeProgramData, routinesData] = await Promise.all([
                dailyLogService.getByDate(today).catch((err) => {
                    if (err.response?.status === 404) return null;
                    throw err;
                }),
                settingsService.getSettings(),
                dailyLogService.getAll().catch(() => []),
                programService.findActive().catch(() => null),
                workoutService.listRoutines().catch(() => []),
            ]);

            setDailyLog(logData);
            setSettings(settingsData);
            setAllLogs(allLogsData);
            setActiveProgram(activeProgramData);
            setWorkoutRoutines(routinesData);

            if (activeProgramData) {
                const dashboard = await programService.getDashboard(activeProgramData.id).catch(() => null);
                setProgramDashboard(dashboard);
            } else {
                setProgramDashboard(null);
            }
        } catch (err: any) {
            setError('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
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

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        if (isSearching) {
            handleClearSearch();
        }
        setRefreshing(false);
    };

    const handleAdd = () => {
        router.push('/daily-log');
    };

    const handleAddMetric = () => {
        setCreateMetricVisible(true);
    };

    const handleMetricCreated = () => {
        fetchData();
    };

    const handleLogPress = (log: DailyLog) => {
        router.push(`/daily-log?date=${log.date}`);
    };

    const handleSearchPress = () => {
        setSearchModalVisible(true);
    };

    const handleAllLogsPress = () => {
        router.push('/AllDailyLogs');
    };

    const handleProgramsPress = () => {
        router.push('/ProgramsLogs');
    };

    const handleMetricsPress = () => {
        router.push('/MetricsLogs');
    };

    const handleRoutinesPress = () => {
        router.push('/WorkoutRoutinesLogs');
    };


    useEffect(() => {
        fetchData();
    }, []);

    return (
        <View style={styles.container}>
            <NavBar
                logo={logo}
                title="¡Hola Karold!"
                showLogoAndTitle={true}
                height={70}
                rightComponent={
                    <View style={styles.rightIcons}>
                        <Icon
                            name="Search"
                            color={theme.colors.text}
                            padding={8}
                            onPress={handleSearchPress}
                        />
                    </View>
                }
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.contentCard}>
                    <DateHeader
                        date={today}
                        onAddPress={handleAdd}
                        onMetricAddPress={handleAddMetric}
                    />
                    <MetricsGrid dailyLog={dailyLog} />
                </View>

                <StatsOverview
                    programScore={programScore}
                    programWeeksRemaining={programWeeksRemaining}
                    programTotalWeeks={programTotalWeeks}
                    activeRoutinesCount={activeRoutinesCount}
                    workoutsThisWeek={workoutsThisWeek}
                    onProgramPress={handleProgramsPress}
                    onRoutinesPress={handleRoutinesPress}
                    leftComponent={
                        <WorkoutVideo
                            workout={dailyLog?.workouts?.[0]?.workoutTypeSnapshot}
                            videoSource={workoutVideo}
                        />
                    }
                />
                <View style={styles.gallerySection}>
                    <LongButton
                        onPress={handleAllLogsPress}
                        text="Todos mis registros"
                        iconLeft="Package2"
                    />
                </View>
                <View style={styles.gallerySection}>
                    <LongButton
                        onPress={handleMetricsPress}
                        text="Métricas"
                        iconLeft="Sigma"
                    />
                </View>
                {isSearching ? (
                    <SearchResults
                        results={searchResults}
                        onLogPress={handleLogPress}
                        onClearSearch={handleClearSearch}
                        searchDate={currentSearchDate}
                    />
                ) : (
                <WeeklyDailyList
                    weeks={weeklyAverages}
                    onWeekPress={(week) => {
                        router.push({
                            pathname: '/WeekDetailScreen',
                            params: {
                                weekStart: week.weekStart,
                                weekEnd: week.weekEnd,
                            }
                        });
                    }}
                />
                )}
            </ScrollView>

            <SearchModal
                visible={searchModalVisible}
                onClose={() => setSearchModalVisible(false)}
                onSearch={handleSearch}
            />

            <CreateMetricModal
                visible={createMetricVisible}
                onClose={() => setCreateMetricVisible(false)}
                onCreated={handleMetricCreated}
            />
        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    rightIcons: {
        flexDirection: 'row',
        gap: 12,
    },
    contentCard: {
        backgroundColor: theme.colors.primary || '#FFFFFF',
        borderRadius: 24,
        padding: 15,
        marginTop: 10,
        marginBottom: 10,
        shadowColor: 'transparent',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    gallerySection: {
        marginTop: 16,
    },
});
