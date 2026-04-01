import { ThemedText } from '@/components/ThemedText';
import { WeightLog } from '@/services/weightLog.service';
import { theme } from '@/theme';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface WeightLogCardProps {
    log: WeightLog;
    onPress: (log: WeightLog) => void;
    formatDisplayDate: (dateString: string) => string;
}

export const WeightLogCard: React.FC<WeightLogCardProps> = ({
    log,
    onPress,
    formatDisplayDate,
}) => {
    const getImageUrl = (uri: string): string => {
        if (!uri) return '';
        if (uri.startsWith('http')) return uri;
        if (uri.startsWith('file://')) return uri;
        if (uri.startsWith('data:')) return uri;
        if (uri.startsWith('/uploads/')) return `${API_BASE_URL}${uri}`;
        return `${API_BASE_URL}${uri}`;
    };

    return (
        <TouchableOpacity
            style={styles.historyCard}
            onPress={() => onPress(log)}
            activeOpacity={0.7}
        >
            <View style={styles.historyCardContent}>
                <View style={styles.historyDate}>
                    <ThemedText variant="regular" size={12} color={theme.colors.textLight}>
                        {formatDisplayDate(log.date)}
                    </ThemedText>
                </View>
                <View style={styles.historyStats}>
                    <View style={styles.historyStat}>
                        <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                            {log.weight}
                        </ThemedText>
                        <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                            kg
                        </ThemedText>
                    </View>
                    {log.waist !== undefined && log.waist > 0 && (
                        <View style={styles.historyStat}>
                            <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                                {log.waist}
                            </ThemedText>
                            <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                                cm
                            </ThemedText>
                        </View>
                    )}
                    {log.bodyfat !== undefined && log.bodyfat > 0 && (
                        <View style={styles.historyStat}>
                            <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                                {log.bodyfat}
                            </ThemedText>
                            <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                                %
                            </ThemedText>
                        </View>
                    )}
                    {log.skeletalMuscle !== undefined && log.skeletalMuscle > 0 && (
                        <View style={styles.historyStat}>
                            <ThemedText variant="semiBold" size={14} color={theme.colors.text}>
                                {log.skeletalMuscle}
                            </ThemedText>
                            <ThemedText variant="regular" size={10} color={theme.colors.textLight}>
                                %
                            </ThemedText>
                        </View>
                    )}
                </View>
            </View>

            {/* Mostrar miniaturas de fotos si existen */}
            {log.photos && log.photos.length > 0 && (
                <View style={styles.cardPhotos}>
                    {log.photos.slice(0, 2).map((photo, idx) => {
                        const imageUrl = getImageUrl(photo);
                        return (
                            <Image
                                key={idx}
                                source={{ uri: imageUrl }}
                                style={styles.cardThumbnail}
                                onError={(e) => console.log('Error loading image:', photo, e.nativeEvent.error)}
                            />
                        );
                    })}
                    {log.photos.length > 2 && (
                        <View style={styles.morePhotosBadge}>
                            <ThemedText variant="regular" size={10} color={theme.colors.white}>
                                +{log.photos.length - 2}
                            </ThemedText>
                        </View>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    historyCard: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 0,
        shadowColor: 'transparent',
        elevation: 1,
    },
    historyDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    historyStats: {
        flexDirection: 'row',
        gap: 16,
    },
    historyStat: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    historyCardContent: {
        flex: 1,
    },
    cardPhotos: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 6,
    },
    cardThumbnail: {
        width: 40,
        height: 40,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    morePhotosBadge: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});