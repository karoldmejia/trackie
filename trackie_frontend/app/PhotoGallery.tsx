import { SearchModal } from '@/components/home/SearchModal';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { PhotoSearchResults } from '@/components/weight/PhotoSearchResults';
import { weightLogService } from '@/services/weightLog.service';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const { width } = Dimensions.get('window');
const photoSize = (width - 30) / 3;

interface GroupedPhotos {
    date: string;
    photos: string[];
}

const PhotoGallery: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [groupedPhotos, setGroupedPhotos] = useState<GroupedPhotos[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [currentSearchDate, setCurrentSearchDate] = useState<string | undefined>();

    const handleGoBack = () => {
        router.back();
    };

    const handleSearchPress = () => {
        setSearchModalVisible(true);
    };

    const handleSearch = async (date: string) => {
        try {
            setCurrentSearchDate(date);
            const logs = await weightLogService.getAll();
            const logForDate = logs.find(log => log.date === date);
            
            if (logForDate && logForDate.photos && logForDate.photos.length > 0) {
                setSearchResults(logForDate.photos);
            } else {
                setSearchResults([]);
            }
            setIsSearching(true);
            setSearchModalVisible(false);
        } catch (error) {
            console.error('Error searching photos:', error);
            setSearchResults([]);
            setIsSearching(true);
        }
    };

    const handleClearSearch = () => {
        setIsSearching(false);
        setSearchResults([]);
        setCurrentSearchDate(undefined);
    };

    const getImageUrl = (uri: string): string => {
        if (!uri) return '';
        if (uri.startsWith('http')) return uri;
        if (uri.startsWith('file://')) return uri;
        if (uri.startsWith('data:')) return uri;
        if (uri.startsWith('/uploads/')) return `${API_BASE_URL}${uri}`;
        return `${API_BASE_URL}${uri}`;
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

            const logsWithPhotos = logs.filter(log => log.photos && log.photos.length > 0);

            const grouped: GroupedPhotos[] = logsWithPhotos.map(log => ({
                date: log.date,
                photos: log.photos || []
            }));

            grouped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setGroupedPhotos(grouped);
        } catch (error) {
            console.error('Error fetching photos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const renderPhotoItem = ({ item, index, date }: { item: string; index: number; date: string }) => {
        const imageUrl = getImageUrl(item);
        return (
            <TouchableOpacity
                style={styles.photoItem}
                onPress={() => {
                    setSelectedPhoto(imageUrl);
                    setModalVisible(true);
                }}
                activeOpacity={0.8}
            >
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.photo}
                    resizeMode="cover"
                />
            </TouchableOpacity>
        );
    };

    const renderDateSection = ({ item }: { item: GroupedPhotos }) => {
        const photos = item.photos;
        const rows = [];
        for (let i = 0; i < photos.length; i += 3) {
            rows.push(photos.slice(i, i + 3));
        }

        return (
            <View style={styles.dateSection}>
                <View style={styles.dateHeader}>
                    <Icon
                        name="Calendar"
                        size={14}
                        color={theme.colors.placeholder}
                        backgroundColor="transparent"
                        padding={0}
                    />
                    <ThemedText variant="medium" size={12} color={theme.colors.placeholder}>
                        {formatDisplayDate(item.date)}
                    </ThemedText>
                </View>
                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.photoRow}>
                        {row.map((photo, photoIndex) => (
                            <View key={photoIndex} style={styles.photoContainer}>
                                {renderPhotoItem({ item: photo, index: photoIndex, date: item.date })}
                            </View>
                        ))}
                        {row.length < 3 && (
                            <>
                                {Array(3 - row.length).fill(null).map((_, i) => (
                                    <View key={`empty-${i}`} style={styles.photoContainer} />
                                ))}
                            </>
                        )}
                    </View>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.navbar}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <ThemedText variant="medium" size={14} color={theme.colors.text}>
                            Galería de fotos
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
                        Galería de fotos
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

            {isSearching ? (
                <PhotoSearchResults
                    results={searchResults}
                    searchDate={currentSearchDate}
                    onPhotoPress={(photo) => {
                        setSelectedPhoto(photo);
                        setModalVisible(true);
                    }}
                    onClearSearch={handleClearSearch}
                />
            ) : (
                <FlatList
                    data={groupedPhotos}
                    keyExtractor={(item) => item.date}
                    renderItem={renderDateSection}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon
                                name="Image"
                                size={48}
                                color={theme.colors.textLight}
                                backgroundColor="transparent"
                                padding={0}
                            />
                            <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                                No hay fotos registradas
                            </ThemedText>
                        </View>
                    }
                />
            )}

            {/* Modal para ver foto ampliada */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setModalVisible(false);
                    setSelectedPhoto(null);
                }}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => {
                        setModalVisible(false);
                        setSelectedPhoto(null);
                    }}
                >
                    <View style={styles.modalContent}>
                        <Image
                            source={{ uri: selectedPhoto || '' }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setModalVisible(false);
                                setSelectedPhoto(null);
                            }}
                        >
                            <Icon
                                name="X"
                                size={24}
                                color={theme.colors.white}
                                backgroundColor="transparent"
                                padding={0}
                            />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal de búsqueda */}
            <SearchModal
                visible={searchModalVisible}
                onClose={() => setSearchModalVisible(false)}
                onSearch={handleSearch}
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
    content: {
        paddingHorizontal: 15,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateSection: {
        marginBottom: 24,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    photoRow: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: 2,
    },
    photoContainer: {
        width: photoSize,
        height: photoSize,
    },
    photoItem: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: theme.colors.white,
        borderWidth: 0,
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        height: '70%',
        position: 'relative',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: -40,
        right: 0,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default PhotoGallery;