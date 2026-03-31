import { DailyLogForm, WorkoutType } from '@/components/home/DailyLogForm';
import { DailyLogList } from '@/components/home/DailyLogList';
import { DateHeader } from '@/components/home/DateHeader';
import { MetricsGrid } from '@/components/home/MetricsGrid';
import { SearchModal } from '@/components/home/SearchModal';
import { SearchResults } from '@/components/home/SearchResults';
import { StatsOverview } from '@/components/home/StatsOverview';
import { WorkoutVideo } from '@/components/home/WorkoutVideo';
import { Icon } from '@/components/icon';
import { NavBar } from '@/components/navbar';
import { CreateDailyLogDto, DailyLog, dailyLogService } from '@/services/dailyLogService';
import { Settings, settingsService } from '@/services/settingsService';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editFormVisible, setEditFormVisible] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const router = useRouter();

  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalDate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [logData, settingsData, allLogsData] = await Promise.all([
        dailyLogService.getByDate(today).catch((err) => {
          if (err.response?.status === 404) return null;
          throw err;
        }),
        settingsService.getSettings(),
        dailyLogService.getAll().catch(() => [])
      ]);

      setDailyLog(logData);
      setSettings(settingsData);
      setAllLogs(allLogsData);
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
    setFormVisible(true);
  };

  const handleFormSubmit = async (data: {
    date?: string;
    calories: string;
    steps: string;
    energyDrinks: string;
    waterLiters: string;
    workout: WorkoutType;
  }) => {
    try {
      const newLog: CreateDailyLogDto = {
        date: data.date || today,
        calories: parseInt(data.calories) || 0,
        steps: parseInt(data.steps) || 0,
        energyDrinks: parseInt(data.energyDrinks) || 0,
        waterLiters: parseFloat(data.waterLiters) || 0,
        workout: data.workout,
      };

      await dailyLogService.upsert(newLog);
      await fetchData();
      setFormVisible(false);
    } catch (error) {
      console.error('Error saving daily log:', error);
    }
  };

  const handleLogPress = (log: DailyLog) => {
    setEditingLog(log);
    setEditFormVisible(true);
  };

  const handleEditFormSubmit = async (data: {
    date: string;
    calories: string;
    steps: string;
    energyDrinks: string;
    waterLiters: string;
    workout: WorkoutType;
  }) => {
    try {
      const updatedLog: CreateDailyLogDto = {
        date: data.date,
        calories: parseInt(data.calories) || 0,
        steps: parseInt(data.steps) || 0,
        energyDrinks: parseInt(data.energyDrinks) || 0,
        waterLiters: parseFloat(data.waterLiters) || 0,
        workout: data.workout,
      };

      await dailyLogService.upsert(updatedLog);
      await fetchData();
      setEditFormVisible(false);
      setEditingLog(null);

      // Si estamos en modo búsqueda y editamos el registro buscado, actualizar resultados
      if (isSearching && currentSearchDate === data.date) {
        const updatedResult = await dailyLogService.getByDate(data.date).catch(() => null);
        if (updatedResult) {
          setSearchResults([updatedResult]);
        }
      }
    } catch (error) {
      console.error('Error updating log:', error);
    }
  };

  const handleSearchPress = () => {
    setSearchModalVisible(true);
  };

  const handleCaloriesPress = () => {
    router.push('/CaloriesOverviewScreen');
  };

  const handleStepsPress = () => {
    router.push('/StepsOverviewScreen');
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
        {/* Rectángulo contenedor con métricas diarias */}
        <View style={styles.contentCard}>
          <DateHeader
            date={today}
            onAddPress={handleAdd}
          />

          <MetricsGrid dailyLog={dailyLog} />
        </View>

        {/* Tarjetas de Calorías y Pasos con video de entrenamiento */}
        <StatsOverview
          dailyLog={dailyLog}
          settings={settings}
          onCaloriesPress={handleCaloriesPress}
          onStepsPress={handleStepsPress}
          leftComponent={
            <WorkoutVideo
              workout={dailyLog?.workout}
              videoSource={workoutVideo}
            />
          }
        />

        {/* Mostrar resultados de búsqueda o lista completa */}
        {isSearching ? (
          <SearchResults
            results={searchResults}
            onLogPress={handleLogPress}
            onClearSearch={handleClearSearch}
            searchDate={currentSearchDate}
          />
        ) : (
          <DailyLogList
            logs={allLogs}
            onLogPress={handleLogPress}
          />
        )}
      </ScrollView>

      {/* Modal de búsqueda */}
      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSearch={handleSearch}
      />

      {/* Formulario para crear nuevo registro */}
      <DailyLogForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSubmit={handleFormSubmit}
        initialData={undefined}
        title="Registro Diario"
        hideDatePicker={false}
      />

      {/* Formulario para editar registro existente */}
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
          energyDrinks: editingLog.energyDrinks,
          waterLiters: editingLog.waterLiters,
          workout: editingLog.workout,
        } : undefined}
        title="Editar Registro"
        hideDatePicker={true}
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
    backgroundColor: theme.colors.secondary || '#FFFFFF',
    borderRadius: 24,
    padding: 15,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
});