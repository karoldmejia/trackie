import { SearchModal } from '@/components/home/SearchModal';
import { Icon } from '@/components/icon';
import { LongButton } from '@/components/LongButton';
import { NavBar } from '@/components/navbar';
import { WeeklySearchResults } from '@/components/weight/WeeklySearchResults';
import { WeightLogForm } from '@/components/weight/WeightLogForm';
import { WeightLogList } from '@/components/weight/WeightLogList';
import { WeightMetricsGrid } from '@/components/weight/WeightMetricsGrid';
import { WeightProgressCard } from '@/components/weight/WeightProgressCard';
import { Settings, settingsService } from '@/services/settingsService';
import { CreateWeightLogDto, WeightLog, weightLogService } from '@/services/weightLog.service';
import { theme } from '@/theme';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

const logo = require('@/assets/home_logo.png');

const WeightScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [latestWeight, setLatestWeight] = useState<WeightLog | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [allLogs, setAllLogs] = useState<WeightLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editFormVisible, setEditFormVisible] = useState(false);
  const [editingLog, setEditingLog] = useState<WeightLog | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WeightLog[]>([]);
  const [isSearchingWeekly, setIsSearchingWeekly] = useState(false);
  const [weeklySearchResults, setWeeklySearchResults] = useState<WeightLog[]>([]);

  const [currentSearchDate, setCurrentSearchDate] = useState<string | undefined>();
  const router = useRouter();

  // Función para parsear fecha local (YYYY-MM-DD)
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Función para formatear fecha local (YYYY-MM-DD)
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para formatear fecha para mostrar (DD/MM/YYYY)
  const formatDisplayDateFull = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

const getMonthStartDate = (date: Date): Date => {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    return monthStart;
};

const getMonthEndDate = (date: Date): Date => {
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    return monthEnd;
};

const formatDisplayMonth = (date: Date): string => {
    const formatter = new Intl.DateTimeFormat('es-CO', {
        month: 'long',
        year: 'numeric'
    });
    return formatter.format(date);
};

const calculateAverageFilteringZeros = (values: number[]): number => {
    const validValues = values.filter(v => v > 0);
    if (validValues.length === 0) return 0;
    const sum = validValues.reduce((acc, val) => acc + val, 0);
    return sum / validValues.length;
};

const calculateMonthsFromLogs = (logs: WeightLog[]): WeightLog[] => {
    if (!logs.length) return [];

    const months: WeightLog[] = [];
    const sortedLogs = [...logs].sort((a, b) =>
        parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
    );

    const monthMap = new Map<string, WeightLog[]>();

    for (const log of sortedLogs) {
        const logDate = parseLocalDate(log.date);
        const monthStart = getMonthStartDate(logDate);
        const monthKey = formatLocalDate(monthStart);
        
        if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, []);
        }
        monthMap.get(monthKey)!.push(log);
    }

    for (const [monthKey, logsInMonth] of monthMap) {
        // Usar la función auxiliar para calcular promedios
        const avgWeight = calculateAverageFilteringZeros(
            logsInMonth.map(l => l.weight)
        );
        const avgWaist = calculateAverageFilteringZeros(
            logsInMonth.map(l => l.waist || 0)
        );
        const avgBodyfat = calculateAverageFilteringZeros(
            logsInMonth.map(l => l.bodyfat || 0)
        );
        const avgHips = calculateAverageFilteringZeros(
            logsInMonth.map(l => l.hips || 0)
        );

        months.push({
            id: monthKey,
            date: monthKey,
            weight: Math.round(avgWeight * 100) / 100,
            waist: avgWaist > 0 ? Math.round(avgWaist * 100) / 100 : 0,
            bodyfat: avgBodyfat > 0 ? Math.round(avgBodyfat * 100) / 100 : 0,
            hips: avgHips > 0 ? Math.round(avgHips * 100) / 100 : 0,
            photos: [],
        });
    }

    return months.sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
};

  const handleSearchPress = () => {
    setSearchModalVisible(true);
  };

const handleSearch = async (date: string) => {
    try {
        setCurrentSearchDate(date);
        const allLogsData = await weightLogService.getAll().catch(() => []);

        // Calcular meses
        const months = calculateMonthsFromLogs(allLogsData);

        // Encontrar el mes que contiene la fecha buscada
        const targetDate = parseLocalDate(date);
        const result = months.filter(month => {
            const monthStart = parseLocalDate(month.date);
            const monthEnd = getMonthEndDate(monthStart);
            return targetDate >= monthStart && targetDate <= monthEnd;
        });

        setWeeklySearchResults(result);
        setIsSearchingWeekly(true);
        setSearchModalVisible(false);
    } catch (error) {
        console.error('Error searching:', error);
        setWeeklySearchResults([]);
        setIsSearchingWeekly(true);
    }
};

  const handleClearSearch = () => {
    setIsSearchingWeekly(false);
    setWeeklySearchResults([]);
    setCurrentSearchDate(undefined);
  };

  const handleAddPress = () => {
    setFormVisible(true);
  };

  const handleLogPress = (log: WeightLog) => {
      const monthStartDate = parseLocalDate(log.date);
      const monthEndDate = getMonthEndDate(monthStartDate);
      
      router.push({
          pathname: '/MonthDetailScreen',
          params: {
              monthStart: formatLocalDate(monthStartDate),
              monthEnd: formatLocalDate(monthEndDate),
          }
      });
  };

  const handleMetricPress = (metric: string) => {
    switch (metric) {
      case 'weight':
        router.replace('/WeightOverviewScreen');
        break;
      case 'waist':
        router.replace('/WaistOverviewScreen');
        break;
      case 'bodyfat':
        router.replace('/BodyfatOverviewScreen');
        break;
      case 'hips':
        router.replace('/HipsOverviewScreen');
        break;
    }
  };

  const handleGalleryPress = () => {
    router.push('/PhotoGallery');
  };

  const handleAllLogsPress = () => {
    router.push('/AllWeightLogs');
  };
  const handleFormSubmit = async (data: {
    date: string;
    weight: string;
    waist: string;
    bodyfat: string;
    hips: string;
    photos: string[];
  }) => {
    try {
      const weightValue = parseFloat(data.weight);
      if (isNaN(weightValue) || weightValue <= 0) {
        console.error('Peso inválido:', data.weight);
        return;
      }

      const newLog: CreateWeightLogDto = {
        date: data.date,
        weight: weightValue,
      };

      if (data.waist && !isNaN(parseFloat(data.waist)) && parseFloat(data.waist) > 0) {
        newLog.waist = parseFloat(data.waist);
      }

      if (data.bodyfat && !isNaN(parseFloat(data.bodyfat)) && parseFloat(data.bodyfat) > 0) {
        newLog.bodyfat = parseFloat(data.bodyfat);
      }

      if (data.hips && !isNaN(parseFloat(data.hips)) && parseFloat(data.hips) > 0) {
        newLog.hips = parseFloat(data.hips);
      }

      if (data.photos && data.photos.length > 0) {
        const files: any[] = [];
        const photosToDelete: string[] = [];
        const existingPhotos = editingLog?.photos || [];

        for (const uri of data.photos) {
          if (uri.includes('/uploads/') || uri.includes('onrender.com')) {
          }
          // Nueva foto local
          else if (uri.startsWith('file://')) {
            try {
              // Verificar que el archivo existe
              const fileInfo = await FileSystem.getInfoAsync(uri);

              if (fileInfo.exists) {

                // Leer el archivo como base64
                const base64 = await FileSystem.readAsStringAsync(uri, {
                  encoding: 'base64',
                });

                // Determinar extensión
                const extension = uri.split('.').pop()?.split('?')[0] || 'jpg';
                const mimeType = extension === 'jpg' ? 'jpeg' : extension;
                const fileName = `photo_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

                // Crear objeto con base64
                files.push({
                  uri: `data:image/${mimeType};base64,${base64}`,
                  name: fileName,
                  type: `image/${mimeType}`,
                });

              } else {
                console.error('Archivo no encontrado:', uri);
              }
            } catch (error) {
              console.error('Error procesando foto:', error);
            }
          }
        }

        // Calcular fotos a eliminar
        if (editingLog && editingLog.photos) {
          for (const oldPhoto of editingLog.photos) {
            if (!data.photos.includes(oldPhoto)) {
              photosToDelete.push(oldPhoto);
            }
          }
        }
        if (files.length > 0) {
          newLog.photos = files as any;
        }
        if (photosToDelete.length > 0) {
          newLog.photosToDelete = photosToDelete;
        }
      }

      await weightLogService.upsert(newLog);
      await fetchData();
      setFormVisible(false);
      setEditFormVisible(false);
      setEditingLog(null);
    } catch (error) {
      console.error('Error saving weight log:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsData, lastWeight, allLogsData] = await Promise.all([
        settingsService.getSettings(),
        weightLogService.getLast(),
        weightLogService.getAll().catch(() => [])
      ]);

      setSettings(settingsData);
      setLatestWeight(lastWeight);
      setAllLogs(allLogsData);
    } catch (error) {
      console.error('Error fetching weight data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initialWeight = settings?.startWeight || 70;
  const currentWeight = latestWeight?.weight || 0;
  const targetWeight = settings?.targetWeight || 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    if (isSearching) {
      handleClearSearch();
    }
    setRefreshing(false);
  };

const monthlyAveragesAsLogs = useMemo(() => {
    if (!allLogs.length) return [];

    const months: WeightLog[] = [];
    const sortedLogs = [...allLogs].sort((a, b) => 
        parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
    );

    const monthMap = new Map<string, WeightLog[]>();

    for (const log of sortedLogs) {
        const logDate = parseLocalDate(log.date);
        const monthStart = getMonthStartDate(logDate);
        const monthKey = formatLocalDate(monthStart);
        
        if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, []);
        }
        monthMap.get(monthKey)!.push(log);
    }

    for (const [monthKey, logsInMonth] of monthMap) {
        const avgWeight = calculateAverageFilteringZeros(
            logsInMonth.map(l => l.weight)
        );
        const avgWaist = calculateAverageFilteringZeros(
            logsInMonth.map(l => l.waist || 0)
        );
        const avgBodyfat = calculateAverageFilteringZeros(
            logsInMonth.map(l => l.bodyfat || 0)
        );
        const avgHips = calculateAverageFilteringZeros(
            logsInMonth.map(l => l.hips || 0)
        );

        months.push({
            id: monthKey,
            date: monthKey,
            weight: Math.round(avgWeight * 100) / 100,
            waist: avgWaist > 0 ? Math.round(avgWaist * 100) / 100 : 0,
            bodyfat: avgBodyfat > 0 ? Math.round(avgBodyfat * 100) / 100 : 0,
            hips: avgHips > 0 ? Math.round(avgHips * 100) / 100 : 0,
            photos: [],
        });
    }

    return months.sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
}, [allLogs]);

  useEffect(() => {
    fetchData();
  }, []);

const getCurrentMonthAverage = (monthlyAverages: WeightLog[]): number => {
    if (monthlyAverages.length === 0) return 0;
    return monthlyAverages[0].weight;
};

const progress = Math.min(Math.max(((initialWeight - currentWeight) / (initialWeight - targetWeight)) * 100, 0), 100);
const currentMonthAverage = getCurrentMonthAverage(monthlyAveragesAsLogs);

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
              backgroundColor={theme.colors.white}
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
        <WeightProgressCard
          progress={progress}
          currentWeight={currentMonthAverage}
          targetWeight={targetWeight}
          onAddPress={handleAddPress}
        />
        <View style={styles.section}>
          <WeightMetricsGrid
            latestLog={latestWeight}
            onMetricPress={handleMetricPress}
          />
        </View>

        <View style={styles.gallerySection}>
          <LongButton onPress={handleGalleryPress} />
        </View>

        <View style={styles.gallerySection}>
          <LongButton onPress={handleAllLogsPress}
            text='Todos mis registros'
            iconLeft='Package2'
          />
        </View>

        {isSearchingWeekly ? (
          <WeeklySearchResults
            results={weeklySearchResults}
            searchDate={currentSearchDate}
            onLogPress={handleLogPress}
            onClearSearch={handleClearSearch}
            formatDisplayDate={formatDisplayDate}
          />
        ) : (
          <WeightLogList
            logs={monthlyAveragesAsLogs}
            onLogPress={handleLogPress}
            formatDisplayDate={(date) => {
              const monthStart = parseLocalDate(date);
              const monthEnd = getMonthEndDate(monthStart);
              const startStr = formatDisplayDateFull(monthStart);
              const endStr = formatDisplayDateFull(monthEnd);
              return `${startStr} - ${endStr}`;
            }}
          />)}
      </ScrollView>

      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSearch={handleSearch}
      />

      <WeightLogForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSubmit={handleFormSubmit}
        title="Registro de Peso"
      />

      <WeightLogForm
        visible={editFormVisible}
        onClose={() => {
          setEditFormVisible(false);
          setEditingLog(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingLog ? {
          date: editingLog.date,
          weight: editingLog.weight,
          waist: editingLog.waist,
          bodyfat: editingLog.bodyfat,
          hips: editingLog.hips,
          photos: editingLog.photos,
        } : undefined}
        title="Editar Registro de Peso"
        hideDatePicker={true}
      />
    </View>
  );
};

export default WeightScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 0,
  },
  gallerySection: {
    marginTop: 16,
  },
});