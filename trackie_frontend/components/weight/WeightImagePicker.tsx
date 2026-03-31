import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface WeightImagePickerProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
    maxImages?: number;
}

export const WeightImagePicker: React.FC<WeightImagePickerProps> = ({
    images,
    onImagesChange,
    maxImages = 10,
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const getImageUrl = useCallback((uri: string): string => {
        if (uri.startsWith('http')) return uri;
        if (uri.startsWith('file://')) return uri;
        if (uri.startsWith('/uploads/')) return `${API_BASE_URL}${uri}`;
        return `${API_BASE_URL}${uri}`;
    }, []);

    const pickImage = useCallback(async () => {
        if (images.length >= maxImages) return;

        try {
            setIsLoading(true);
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: false,
            });

            if (!result.canceled && result.assets[0]) {
                const newImages = [...images, result.assets[0].uri];
                onImagesChange(newImages);
            }
        } catch (error) {
            console.error('Error picking image:', error);
        } finally {
            setIsLoading(false);
        }
    }, [images, maxImages, onImagesChange]);

    const removeImage = useCallback((indexToRemove: number) => {
        const newImages = images.filter((_, index) => index !== indexToRemove);
        onImagesChange(newImages);
    }, [images, onImagesChange]);

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imageList}>
                    {images.map((image, index) => (
                        <View key={`image-${index}`} style={styles.imageContainer}>
                            <Image
                                source={{ uri: getImageUrl(image) }}
                                style={styles.image}
                            />
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removeImage(index)}
                            >
                                <Icon
                                    name="X"
                                    size={12}
                                    color={theme.colors.white}
                                    backgroundColor="transparent"
                                    padding={0}
                                />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {images.length < maxImages && (
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={pickImage}
                            activeOpacity={0.7}
                            disabled={isLoading}
                        >
                            <Icon
                                name="Plus"
                                size={24}
                                color={theme.colors.placeholder}
                                backgroundColor="transparent"
                                padding={0}
                            />
                            <ThemedText variant="regular" size={12} color={theme.colors.placeholder}>
                                Añadir foto
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    imageList: {
        flexDirection: 'row',
        gap: 12,
    },
    imageContainer: {
        position: 'relative',
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: theme.colors.white,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
});