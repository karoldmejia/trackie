import { SearchModal } from '@/components/home/SearchModal';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { WeightLogCard } from '@/components/weight/WeightLogCard';
import { WeightLogForm } from '@/components/weight/WeightLogForm';
import { WeightSearchResults } from '@/components/weight/WeightSearchResults';
import { CreateWeightLogDto, WeightLog, weightLogService } from '@/services/weightLog.service';
import { theme } from '@/theme';
import * as FileSystem from 'expo-file-system/legacy';
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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const AllWeightLogs: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<WeightLog[]>([]);
    const [currentSearchDate, setCurrentSearchDate] = useState<string | undefined>();
    const [allLogs, setAllLogs] = useState<WeightLog[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [editingLog, setEditingLog] = useState<WeightLog | null>(null);
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

    const handleLogPress = (log: WeightLog) => {
        setEditingLog(log);
        setEditFormVisible(true);
    };

    const handleEditFormSubmit = async (data: {
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
                const files: any[] = [];
                const photosToDelete: string[] = [];
                const existingPhotos = editingLog?.photos || [];

                for (const uri of data.photos) {
                    if (uri.includes('/uploads/') || uri.includes('railway.app')) {
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
            setEditFormVisible(false);
            setEditingLog(null);
        } catch (error) {
            console.error('Error saving weight log:', error);
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
            const logs = await weightLogService.getAll();

            const sortedLogs = [...logs].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setAllLogs(sortedLogs);
        } catch (error) {
            console.error('Error fetching weight data:', error);
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
                    <WeightSearchResults
                        results={searchResults}
                        onLogPress={handleLogPress}
                        onClearSearch={handleClearSearch}
                        searchDate={currentSearchDate}
                        formatDisplayDate={formatDisplayDate}
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
                                    No hay registros de peso aún
                                </ThemedText>
                            </View>
                        ) : (
                            allLogs.map((log) => (
                                <WeightLogCard
                                    key={log.id}
                                    log={log}
                                    onPress={() => handleLogPress(log)}
                                    formatDisplayDate={formatDisplayDate}
                                />
                            ))
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
            <WeightLogForm
                visible={editFormVisible}
                onClose={() => {
                    setEditFormVisible(false);
                    setEditingLog(null);
                }}
                onSubmit={handleEditFormSubmit}
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

export default AllWeightLogs;