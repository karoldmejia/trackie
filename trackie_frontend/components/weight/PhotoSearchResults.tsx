import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const { width } = Dimensions.get('window');
const photoSize = (width - 30) / 3;

interface PhotoSearchResultsProps {
    results: string[];
    searchDate?: string;
    onPhotoPress: (photo: string) => void;
    onClearSearch: () => void;
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

const getImageUrl = (uri: string): string => {
    if (!uri) return '';
    if (uri.startsWith('http')) return uri;
    if (uri.startsWith('file://')) return uri;
    if (uri.startsWith('data:')) return uri;
    if (uri.startsWith('/uploads/')) return `${API_BASE_URL}${uri}`;
    return `${API_BASE_URL}${uri}`;
};

export const PhotoSearchResults: React.FC<PhotoSearchResultsProps> = ({
    results,
    searchDate,
    onPhotoPress,
    onClearSearch,
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
                    No se encontraron fotos para {formatDisplayDate(searchDate)}
                </ThemedText>
                <TouchableOpacity onPress={onClearSearch} style={styles.clearButton}>
                    <ThemedText variant="medium" size={14} color={theme.colors.primary}>
                        Limpiar búsqueda
                    </ThemedText>
                </TouchableOpacity>
            </View>
        );
    }

    // Organizar fotos en filas de 3 columnas
    const rows = [];
    for (let i = 0; i < results.length; i += 3) {
        rows.push(results.slice(i, i + 3));
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <ThemedText variant="medium" size={14} color={theme.colors.textLight} style={styles.headerText}>
                        {searchDate ? `Resultados para ${formatDisplayDate(searchDate)}` : 'Resultados de búsqueda'}
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
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.photoRow}>
                        {row.map((photo, photoIndex) => {
                            const imageUrl = getImageUrl(photo);
                            return (
                                <TouchableOpacity
                                    key={photoIndex}
                                    style={styles.photoContainer}
                                    onPress={() => onPhotoPress(imageUrl)}
                                    activeOpacity={0.8}
                                >
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.photo}
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            );
                        })}
                        {/* Completar con espacios vacíos si es necesario */}
                        {row.length < 3 && (
                            <>
                                {Array(3 - row.length).fill(null).map((_, i) => (
                                    <View key={`empty-${i}`} style={styles.photoContainer} />
                                ))}
                            </>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        flex: 1,
        padding: 15
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerText: {
        marginLeft: 8,
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
    photo: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
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