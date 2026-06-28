import { FormSelect } from '@/components/FormSelect';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { Dish, mealPlannerService, PlannedMeal } from '@/services/mealPlannerService';
import { theme } from '@/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useKeyboard } from '@react-native-community/hooks';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const MEAL_TYPE_OPTIONS = [
    { label: 'Desayuno', value: 'desayuno' },
    { label: 'Almuerzo', value: 'almuerzo' },
    { label: 'Cena', value: 'cena' },
    { label: 'Snack', value: 'snack' },
];

// Íconos aleatorios para los dishes
const DISH_ICONS = ['Utensils', 'Pizza', 'Salad', 'Soup', 'Sandwich', 'Coffee', 'Cake', 'Beef', 'Fish', 'Egg'];

interface AddPlannedMealFormProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: {
        date: string;
        time: string;
        mealType: string;
        dishIds: string[];
    }) => void;
    dayPlanId?: string;
    editingMeal?: PlannedMeal | null; // Para edición
    isEditing?: boolean;
    onRemoveDish?: (plannedMealId: string, dishId: string) => Promise<void>;
    editingDate?: string;
}

export const AddPlannedMealForm: React.FC<AddPlannedMealFormProps> = ({
    visible,
    onClose,
    onSubmit,
    dayPlanId,
    editingMeal = null,
    isEditing = false,
    onRemoveDish,
    editingDate,
}) => {
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [time, setTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [mealType, setMealType] = useState('');
    const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);
    const [showDishSelector, setShowDishSelector] = useState(false);
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewDishInput, setShowNewDishInput] = useState(false);
    const [newDishName, setNewDishName] = useState('');
    const [isCreatingDish, setIsCreatingDish] = useState(false);

    const slideAnim = useRef(new Animated.Value(0)).current;
    const screenHeight = Dimensions.get('window').height;
    const { keyboardHeight, keyboardShown } = useKeyboard();

    // Cargar datos de edición cuando se abre el modal
    useEffect(() => {
        if (visible) {
            // Cargar dishes
            loadDishes();

            // Configurar fecha y hora
            if (editingMeal) {
                // Edición
                const dateString = editingDate || editingMeal.dayPlan?.date;
                if (dateString) {
                    const [year, month, day] = dateString.split('-').map(Number);
                    setDate(new Date(year, month - 1, day));
                }

                const [hours, minutes] = editingMeal.time.split(':').map(Number);
                const timeDate = new Date();
                timeDate.setHours(hours, minutes);
                setTime(timeDate);

                setMealType(editingMeal.mealType);
                setSelectedDishIds(editingMeal.dishes.map(d => d.id));
            } else if (editingDate) {
                // Nueva comida con fecha específica
                const [year, month, day] = editingDate.split('-').map(Number);
                setDate(new Date(year, month - 1, day));
                setTime(new Date());
                setMealType('');
                setSelectedDishIds([]);
            } else {
                // Nueva comida con fecha actual
                setDate(new Date());
                setTime(new Date());
                setMealType('');
                setSelectedDishIds([]);
            }

            // Animación
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
    }, [visible, editingMeal, editingDate]);

    const loadDishes = async () => {
        try {
            const allDishes = await mealPlannerService.getAllDishes();
            setDishes(allDishes);
        } catch (error) {
            console.error('Error loading dishes:', error);
        }
    };

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) setDate(selectedDate);
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) setTime(selectedTime);
    };

    const handleSubmit = () => {
        if (!mealType || selectedDishIds.length === 0) {
            return;
        }

        onSubmit({
            date: formatDate(date),
            time: formatTime(time),
            mealType,
            dishIds: selectedDishIds,
        });
        handleClose();
    };
    const handleClose = () => {
        setDate(new Date());
        setTime(new Date());
        setMealType('');
        setSelectedDishIds([]);
        setShowDishSelector(false);
        setSearchQuery('');
        setShowNewDishInput(false);
        setNewDishName('');
        onClose();
    };

    const toggleDishSelection = (dishId: string) => {
        setSelectedDishIds(prev =>
            prev.includes(dishId)
                ? prev.filter(id => id !== dishId)
                : [...prev, dishId]
        );
    };

    const getRandomIcon = (index: number) => {
        return DISH_ICONS[index % DISH_ICONS.length];
    };

    const handleCreateDish = async () => {
        if (!newDishName.trim()) return;

        setIsCreatingDish(true);
        try {
            const newDish = await mealPlannerService.createDish({ name: newDishName.trim() });
            setDishes(prev => [...prev, newDish]);
            setSelectedDishIds(prev => [...prev, newDish.id]);
            setNewDishName('');
            setShowNewDishInput(false);
        } catch (error) {
            console.error('Error creating dish:', error);
        } finally {
            setIsCreatingDish(false);
        }
    };

    const handleRemoveDish = async (dishId: string) => {
        if (!editingMeal || !onRemoveDish) return;

        try {
            await onRemoveDish(editingMeal.id, dishId);
            // Actualizar la lista de dishes seleccionados
            setSelectedDishIds(prev => prev.filter(id => id !== dishId));
            // Recargar los dishes
            await loadDishes();
        } catch (error) {
            console.error('Error removing dish:', error);
        }
    };

    const filteredDishes = dishes.filter(dish =>
        dish.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Obtener los dishes seleccionados para mostrar
    const selectedDishes = dishes.filter(dish => selectedDishIds.includes(dish.id));

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
                    {
                        transform: [{
                            translateY: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [screenHeight, 0],
                            })
                        }],
                        height: keyboardShown
                            ? screenHeight * 0.7 + keyboardHeight
                            : screenHeight * 0.7
                    }
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
                        {isEditing ? 'EDITAR COMIDA' : 'AÑADIR COMIDA'}
                    </ThemedText>

                    <View style={styles.formContainer}>
                        {/* Fila 1: Fecha y Hora */}
                        <View style={styles.row}>
                            <TouchableOpacity
                                style={[styles.halfColumn, styles.dateButton]}
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Icon name="Calendar" size={18} color={theme.colors.placeholder} />
                                <ThemedText variant="regular" size={14} color={theme.colors.text} style={styles.dateText}>
                                    {formatDate(date)}
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.halfColumn, styles.timeButton]}
                                onPress={() => setShowTimePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Icon name="Clock" size={18} color={theme.colors.placeholder} />
                                <ThemedText variant="regular" size={14} color={theme.colors.text} style={styles.dateText}>
                                    {formatTime(time)}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Fila 2: Meal Type */}
                        <View style={styles.fullRow}>
                            <FormSelect
                                icon="Utensils"
                                placeholder="Tipo de comida"
                                value={mealType}
                                options={MEAL_TYPE_OPTIONS}
                                onSelect={setMealType}
                            />
                        </View>

                        {/* Dishes seleccionados */}
                        {selectedDishes.length > 0 && (
                            <View style={styles.selectedDishesContainer}>
                                {selectedDishes.map((dish, index) => (
                                    <View key={dish.id} style={styles.selectedDishItem}>
                                        <View style={styles.selectedDishIconContainer}>
                                            <Icon
                                                name={getRandomIcon(index) as any}
                                                size={16}
                                                color={theme.colors.primary}
                                                backgroundColor="transparent"
                                            />
                                        </View>
                                        <ThemedText
                                            variant="regular"
                                            size={13}
                                            color={theme.colors.text}
                                            style={styles.selectedDishName}
                                            numberOfLines={1}
                                        >
                                            {dish.name}
                                        </ThemedText>
                                        {isEditing && onRemoveDish && (
                                            <TouchableOpacity
                                                onPress={() => handleRemoveDish(dish.id)}
                                                style={styles.removeDishButton}
                                            >
                                                <Icon
                                                    name="X"
                                                    size={14}
                                                    color={theme.colors.error}
                                                    backgroundColor="transparent"
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Fila 3: Botón Add Food */}
                        <TouchableOpacity
                            style={styles.addFoodButton}
                            onPress={() => setShowDishSelector(true)}
                            activeOpacity={0.7}
                        >
                            <Icon name="Plus" size={20} color={theme.colors.primary} />
                            <ThemedText variant="medium" size={14} color={theme.colors.primary}>
                                {selectedDishes.length > 0 ? 'Añadir más comidas' : 'Añadir comida'}
                            </ThemedText>
                        </TouchableOpacity>

                        {/* Botón Guardar */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!mealType || selectedDishIds.length === 0) && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={!mealType || selectedDishIds.length === 0}
                            activeOpacity={0.8}
                        >
                            <ThemedText variant="semiBold" size={14} color={theme.colors.white}>
                                {isEditing ? 'Actualizar' : 'Guardar'}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Animated.View>

            {/* Modal para seleccionar dishes */}
            <Modal
                visible={showDishSelector}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDishSelector(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowDishSelector(false)}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.dishSelectorContainer,
                        {
                            transform: [{
                                translateY: slideAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [screenHeight, 0],
                                })
                            }],
                            height: keyboardShown
                                ? screenHeight * 0.85
                                : screenHeight * 0.8,
                        }
                    ]}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                        style={styles.keyboardView}
                    >
                        <View style={styles.handle} />

                        <ThemedText
                            variant="medium"
                            size={12}
                            color={theme.colors.textLight}
                            style={styles.title}
                        >
                            SELECCIONAR COMIDAS
                        </ThemedText>

                        {/* Header con búsqueda y botón add */}
                        <View style={styles.searchHeader}>
                            <View style={styles.searchContainer}>
                                <Icon name="Search" size={18} color={theme.colors.placeholder} backgroundColor='transparent' padding={0} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Buscar comidas..."
                                    placeholderTextColor={theme.colors.placeholder}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.addDishButton}
                                onPress={() => setShowNewDishInput(!showNewDishInput)}
                            >
                                <Icon name="Plus" size={20} backgroundColor={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Input para nuevo dish */}
                        {showNewDishInput && (
                            <View style={styles.newDishContainer}>
                                <TextInput
                                    style={styles.newDishInput}
                                    placeholder="Nombre del nuevo plato..."
                                    placeholderTextColor={theme.colors.placeholder}
                                    value={newDishName}
                                    onChangeText={setNewDishName}
                                    autoFocus
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.checkButton,
                                        isCreatingDish && styles.checkButtonDisabled
                                    ]}
                                    onPress={handleCreateDish}
                                    disabled={isCreatingDish || !newDishName.trim()}
                                >
                                    <Icon name="Check" size={20} color={theme.colors.white} backgroundColor={theme.colors.text} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Lista de dishes */}
                        <FlatList
                            data={filteredDishes}
                            keyExtractor={(item) => item.id}
                            style={styles.dishList}
                            renderItem={({ item, index }) => {
                                const isSelected = selectedDishIds.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.dishItem,
                                            isSelected && styles.dishItemSelected
                                        ]}
                                        onPress={() => toggleDishSelection(item.id)}
                                    >
                                        <View style={styles.dishIconContainer}>
                                            <Icon
                                                name={getRandomIcon(index) as any}
                                                size={20}
                                                color={isSelected ? theme.colors.white : theme.colors.text}
                                                backgroundColor={isSelected ? theme.colors.primary : theme.colors.background}
                                            />
                                        </View>
                                        <ThemedText
                                            variant="regular"
                                            size={14}
                                            color={isSelected ? theme.colors.primary : theme.colors.text}
                                            style={styles.dishName}
                                        >
                                            {item.name}
                                        </ThemedText>
                                        {isSelected && (
                                            <Icon name="Check" size={18} color={theme.colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                <View style={styles.emptyDishes}>
                                    <ThemedText variant="regular" size={14} color={theme.colors.placeholder}>
                                        No hay platos disponibles
                                    </ThemedText>
                                </View>
                            }
                        />

                        {/* Botón confirmar selección */}
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                selectedDishIds.length === 0 && styles.confirmButtonDisabled
                            ]}
                            onPress={() => setShowDishSelector(false)}
                            disabled={selectedDishIds.length === 0}
                        >
                            <ThemedText variant="semiBold" size={14} color={theme.colors.white}>
                                Confirmar ({selectedDishIds.length})
                            </ThemedText>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </Animated.View>
            </Modal>

            {/* Date Picker */}
            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}

            {/* Time Picker */}
            {showTimePicker && (
                <DateTimePicker
                    value={time}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                />
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    // ... estilos existentes ...
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
        marginBottom: 20,
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
    row: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 12,
    },
    halfColumn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    fullRow: {
        marginBottom: 12,
    },
    dateButton: {
        gap: 10,
    },
    timeButton: {
        gap: 10,
    },
    dateText: {
        flex: 1,
    },
    addFoodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
        borderRadius: 20,
        paddingVertical: 8,
        gap: 5,
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    dishSelectorContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 30,
        maxHeight: '80%',
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 0,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        fontFamily: theme.typography.fonts.regular,
        color: theme.colors.text,
    },
    addDishButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    newDishContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    newDishInput: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        fontFamily: theme.typography.fonts.regular,
        color: theme.colors.text,
        paddingLeft: 40
    },
    checkButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkButtonDisabled: {
        opacity: 0.5,
    },
    dishList: {
        maxHeight: 300,
    },
    dishItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
    },
    dishItemSelected: {
        backgroundColor: 'rgba(255, 107, 107, 0.08)',
    },
    dishIconContainer: {
        marginRight: 12,
    },
    dishName: {
        flex: 1,
    },
    emptyDishes: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    confirmButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    // Nuevos estilos para dishes seleccionados
    selectedDishesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    selectedDishItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.08)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    selectedDishIconContainer: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedDishName: {
        maxWidth: 120,
    },
    removeDishButton: {
        padding: 2,
        marginLeft: 2,
    },
});