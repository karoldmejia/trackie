import { SearchModal } from '@/components/home/SearchModal';
import { Icon } from '@/components/icon';
import { LongButton } from '@/components/LongButton';
import { NavBar } from '@/components/navbar';
import { WeightLogForm } from '@/components/weight/WeightLogForm';
import { WeightLogList } from '@/components/weight/WeightLogList';
import { WeightMetricsGrid } from '@/components/weight/WeightMetricsGrid';
import { WeightProgressCard } from '@/components/weight/WeightProgressCard';
import { WeightSearchResults } from '@/components/weight/WeightSearchResults';
import { Settings, settingsService } from '@/services/settingsService';
import { CreateWeightLogDto, WeightLog, weightLogService } from '@/services/weightLog.service';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
    const [currentSearchDate, setCurrentSearchDate] = useState<string | undefined>();
    const router = useRouter();

    const handleSearchPress = () => {
        setSearchModalVisible(true);
    };

    const handleSearch = async (date: string) => {
        try {
            setCurrentSearchDate(date);
            const result = await weightLogService.getByDate(date).catch(() => null);
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

    const handleAddPress = () => {
        setFormVisible(true);
    };

    const handleLogPress = (log: WeightLog) => {
        setEditingLog(log);
        setEditFormVisible(true);
    };

    const handleMetricPress = (metric: string) => {
        switch (metric) {
            case 'weight':
                router.push('/WeightOverviewScreen');
                break;
            case 'waist':
                router.push('/WaistOverviewScreen');
                break;
            case 'bodyfat':
                router.push('/BodyfatOverviewScreen');
                break;
            case 'skeletalMuscle':
                router.push('/SkeletalMuscleOverviewScreen');
                break;
        }
    };

    const handleGalleryPress = () => {
        router.push('/PhotoGallery');
    };

    const handleFormSubmit = async (data: {
        date: string;
        weight: string;
        waist: string;
        bodyfat: string;
        skeletalMuscle: string;
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
            
            if (data.skeletalMuscle && !isNaN(parseFloat(data.skeletalMuscle)) && parseFloat(data.skeletalMuscle) > 0) {
                newLog.skeletalMuscle = parseFloat(data.skeletalMuscle);
            }
            
            if (data.photos && data.photos.length > 0) {
                const files: File[] = [];
                const photosToDelete: string[] = [];
                const existingPhotos = editingLog?.photos || [];

                for (const uri of data.photos) {
                    if (uri.includes('/uploads/') || uri.includes('localhost:3000/uploads/')) {
                        if (!existingPhotos.includes(uri)) {
                            // Esta es una foto existente que no ha cambiado
                        }
                    } else {
                        try {
                            const response = await fetch(uri);
                            const blob = await response.blob();
                            const fileName = uri.split('/').pop() || `photo_${Date.now()}.jpg`;
                            const file = new File([blob], fileName, { type: 'image/jpeg' });
                            files.push(file);
                        } catch (error) {
                            console.error('Error converting photo to file:', error);
                        }
                    }
                }

                if (editingLog && editingLog.photos) {
                    for (const oldPhoto of editingLog.photos) {
                        if (!data.photos.includes(oldPhoto)) {
                            photosToDelete.push(oldPhoto);
                        }
                    }
                }

                newLog.photos = files;
                newLog.photosToDelete = photosToDelete;
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

    const initialWeight = 69;
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

    useEffect(() => {
        fetchData();
    }, []);

    const progress = Math.min(Math.max(((initialWeight - currentWeight) / (initialWeight - targetWeight)) * 100, 0), 100);

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
                    currentWeight={currentWeight}
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

                {isSearching ? (
                    <WeightSearchResults
                        results={searchResults}
                        onLogPress={handleLogPress}
                        onClearSearch={handleClearSearch}
                        searchDate={currentSearchDate}
                        formatDisplayDate={formatDisplayDate}
                    />
                ) : (
                    <WeightLogList
                        logs={allLogs}
                        onLogPress={handleLogPress}
                        formatDisplayDate={formatDisplayDate}
                        maxItems={5}
                    />
                )}
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
                    skeletalMuscle: editingLog.skeletalMuscle,
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
        marginBottom: 8,
    },
});