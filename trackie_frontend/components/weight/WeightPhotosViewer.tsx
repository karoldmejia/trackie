import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface WeightPhotosViewerProps {
    photos: string[];
    visible: boolean;
    onClose: () => void;
}

export const WeightPhotosViewer: React.FC<WeightPhotosViewerProps> = ({
    photos,
    visible,
    onClose,
}) => {
    const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null);

    if (!photos || photos.length === 0) return null;

    return (
        <>
            {/* Miniaturas */}
            <View style={styles.photosContainer}>
                <View style={styles.photosHeader}>
                    <Icon
                        name="Image"
                        size={14}
                        color={theme.colors.textLight}
                        backgroundColor="transparent"
                        padding={0}
                    />
                    <ThemedText variant="medium" size={12} color={theme.colors.textLight}>
                        FOTOS ADJUNTAS ({photos.length})
                    </ThemedText>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.thumbnailList}>
                        {photos.map((photo, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.thumbnailContainer}
                                onPress={() => setSelectedPhoto(photo)}
                            >
                                <Image source={{ uri: photo }} style={styles.thumbnail} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Modal para ver foto ampliada */}
            <Modal
                visible={selectedPhoto !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedPhoto(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectedPhoto(null)}
                >
                    <View style={styles.modalContent}>
                        <Image source={{ uri: selectedPhoto || '' }} style={styles.fullImage} />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setSelectedPhoto(null)}
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
        </>
    );
};

const styles = StyleSheet.create({
    photosContainer: {
        marginTop: 8,
        marginBottom: 8,
    },
    photosHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    thumbnailList: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 4,
    },
    thumbnailContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
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
        resizeMode: 'contain',
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