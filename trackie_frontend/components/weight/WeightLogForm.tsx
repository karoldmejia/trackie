import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { FormInput } from '../FormInput';
import { WeightImagePicker } from './WeightImagePicker';

interface WeightLogFormProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: {
        date: string;
        weight: string;
        waist: string;
        bodyfat: string;
        skeletalMuscle: string;
        photos: string[];
    }) => void;
    initialData?: {
        date?: string;
        weight?: number;
        waist?: number;
        bodyfat?: number;
        skeletalMuscle?: number;
        photos?: string[];
    };
    title?: string;
    hideDatePicker?: boolean;
}

export const WeightLogForm: React.FC<WeightLogFormProps> = ({
    visible,
    onClose,
    onSubmit,
    initialData,
    title = 'Registro de peso',
    hideDatePicker = false,
}) => {
    const getCurrentLocalDate = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    };

    const [date, setDate] = useState(getCurrentLocalDate());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [weight, setWeight] = useState('');
    const [waist, setWaist] = useState('');
    const [bodyfat, setBodyfat] = useState('');
    const [skeletalMuscle, setSkeletalMuscle] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);

    const slideAnim = useRef(new Animated.Value(0)).current;
    const screenHeight = Dimensions.get('window').height;

    useEffect(() => {
        if (initialData) {
            if (initialData.date) {
                const [year, month, day] = initialData.date.split('-').map(Number);
                const initialDate = new Date(year, month - 1, day);
                if (!isNaN(initialDate.getTime())) {
                    setDate(initialDate);
                }
            }
            if (initialData.weight) setWeight(initialData.weight.toString());
            if (initialData.waist) setWaist(initialData.waist.toString());
            if (initialData.bodyfat) setBodyfat(initialData.bodyfat.toString());
            if (initialData.skeletalMuscle) setSkeletalMuscle(initialData.skeletalMuscle.toString());
            if (initialData.photos) setPhotos(initialData.photos);
        }
    }, [initialData]);

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                damping: 20,
                stiffness: 300,
            }).start();
        } else {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 300,
            }).start();
        }
    }, [visible]);

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [screenHeight, 0],
    });

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth();
            const day = selectedDate.getDate();
            setDate(new Date(year, month, day));
        }
    };

    const handleSubmit = () => {
        onSubmit({
            date: formatDate(date),
            weight,
            waist,
            bodyfat,
            skeletalMuscle,
            photos,
        });
        handleClose();
    };

    const handleClose = () => {
        setDate(getCurrentLocalDate());
        setWeight('');
        setWaist('');
        setBodyfat('');
        setSkeletalMuscle('');
        setPhotos([]);
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <Animated.View
                style={[
                    styles.container,
                    { transform: [{ translateY }], height: screenHeight * 0.6 }
                ]}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.handle} />

                    <ThemedText
                        variant="medium"
                        size={12}
                        color={theme.colors.textLight}
                        style={styles.title}
                    >
                        {title.toUpperCase()}
                    </ThemedText>

                    <View style={styles.formContainer}>
                        {/* Campo de fecha */}
                        {!hideDatePicker && (
                            <>
                                <View style={styles.dateRow}>
                                    <TouchableOpacity
                                        style={styles.dateButton}
                                        onPress={() => setShowDatePicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.dateIconContainer}>
                                            <Icon
                                                name="Calendar"
                                                size={18}
                                                color={theme.colors.placeholder}
                                                backgroundColor="transparent"
                                                padding={0}
                                            />
                                        </View>
                                        <View style={styles.dateTextContainer}>
                                            <ThemedText
                                                variant="regular"
                                                size={14}
                                                color={theme.colors.placeholder}
                                            >
                                                {formatDate(date)}
                                            </ThemedText>
                                        </View>
                                        <Icon
                                            name="ChevronDown"
                                            size={20}
                                            color={theme.colors.placeholder}
                                            backgroundColor="transparent"
                                            padding={0}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={handleDateChange}
                                    />
                                )}
                            </>
                        )}

                        {/* Primera fila - Peso y Cintura */}
                        <View style={styles.row}>
                            <View style={styles.halfColumn}>
                                <FormInput
                                    icon="Weight"
                                    placeholder="Peso (kg)"
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="numeric"
                                    rounded={false}
                                    containerStyle={styles.topLeftInput}
                                />
                            </View>
                            <View style={styles.halfColumn}>
                                <FormInput
                                    icon="Ruler"
                                    placeholder="Cintura (cm)"
                                    value={waist}
                                    onChangeText={setWaist}
                                    keyboardType="numeric"
                                    rounded={false}
                                    containerStyle={styles.topRightInput}
                                />
                            </View>
                        </View>

                        {/* Segunda fila - Bodyfat y Skeletal Muscle */}
                        <View style={styles.row}>
                            <View style={styles.halfColumn}>
                                <FormInput
                                    icon="Activity"
                                    placeholder="Bodyfat (%)"
                                    value={bodyfat}
                                    onChangeText={setBodyfat}
                                    keyboardType="numeric"
                                    rounded={false}
                                    containerStyle={styles.middleLeftInput}
                                />
                            </View>
                            <View style={styles.halfColumn}>
                                <FormInput
                                    icon="BicepsFlexed"
                                    placeholder="Músculo (%)"
                                    value={skeletalMuscle}
                                    onChangeText={setSkeletalMuscle}
                                    keyboardType="numeric"
                                    rounded={false}
                                    containerStyle={styles.middleRightInput}
                                />
                            </View>
                        </View>

                        {/* Imágenes */}
                        <View style={styles.imageSection}>
                            <WeightImagePicker
                                images={photos}
                                onImagesChange={setPhotos}
                                maxImages={10}
                            />
                        </View>

                        {/* Botón de guardar */}
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            activeOpacity={0.8}
                        >
                            <ThemedText variant="semiBold" size={14} color={theme.colors.white}>
                                Guardar
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    keyboardView: {
        flex: 1,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: theme.colors.primary,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 30,
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
        letterSpacing: 1,
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    dateRow: {
        marginBottom: 16,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    dateIconContainer: {
        marginRight: 10,
    },
    dateTextContainer: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    halfColumn: {
        flex: 1,
    },
    imageSection: {
        marginTop: 8,
        marginBottom: 20,
    },
    topLeftInput: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 0,
        marginRight: 6,
    },
    topRightInput: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 20,
        marginLeft: 6,
    },
    middleLeftInput: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 0,
        marginRight: 6,
    },
    middleRightInput: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 20,
        marginLeft: 6,
    },
    submitButton: {
        backgroundColor: theme.colors.primary || '#4CAF50',
        borderRadius: 20,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
});