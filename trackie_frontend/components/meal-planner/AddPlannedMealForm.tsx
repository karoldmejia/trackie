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
        startDate: string;
        endDate: string;
        time: string;
        mealType: string;
        dishIds: string[];
    }) => void;
    dayPlanId?: string;
    editingMeal?: PlannedMeal | null;
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
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
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
    const [applyToAll, setApplyToAll] = useState(true); // Opción para aplicar a todas las fechas del rango

    const slideAnim = useRef(new Animated.Value(0)).current;
    const screenHeight = Dimensions.get('window').height;
    const { keyboardHeight, keyboardShown } = useKeyboard();

    // Cargar datos de edición cuando se abre el modal
    useEffect(() => {
        if (visible) {
            loadDishes();

            if (editingMeal) {
                const dateString = editingDate || editingMeal.dayPlan?.date;
                if (dateString) {
                    const [year, month, day] = dateString.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    setStartDate(date);
                    setEndDate(date);
                }

                const [hours, minutes] = editingMeal.time.split(':').map(Number);
                const timeDate = new Date();
                timeDate.setHours(hours, minutes);
                setTime(timeDate);

                setMealType(editingMeal.mealType);
                setSelectedDishIds(editingMeal.dishes.map(d => d.id));
            } else if (editingDate) {
                const [year, month, day] = editingDate.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                setStartDate(date);
                setEndDate(date);
                setTime(new Date());
                setMealType('');
                setSelectedDishIds([]);
            } else {
                setStartDate(new Date());
                setEndDate(new Date());
                setTime(new Date());
                setMealType('');
                setSelectedDishIds([]);
            }

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

    const handleStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartDatePicker(false);
        if (selectedDate) {
            setStartDate(selectedDate);
            // Si la fecha de fin es anterior a la nueva fecha de inicio, ajustarla
            if (endDate < selectedDate) {
                setEndDate(selectedDate);
            }
        }
    };

    const handleEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndDatePicker(false);
        if (selectedDate && selectedDate >= startDate) {
            setEndDate(selectedDate);
        } else if (selectedDate && selectedDate < startDate) {
            // Si la fecha de fin es anterior a la de inicio, mostrar alerta
            alert('La fecha de fin debe ser posterior a la fecha de inicio');
        }
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
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            time: formatTime(time),
            mealType,
            dishIds: selectedDishIds,
        });
        handleClose();
    };

    const handleClose = () => {
        setStartDate(new Date());
        setEndDate(new Date());
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
            setSelectedDishIds(prev => prev.filter(id => id !== dishId));
            await loadDishes();
        } catch (error) {
            console.error('Error removing dish:', error);
        }
    };

    const filteredDishes = dishes.filter(dish =>
        dish.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedDishes = dishes.filter(dish => selectedDishIds.includes(dish.id));

    if (!visible) return null;

    const isRange = formatDate(startDate) !== formatDate(endDate);

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
                            ? screenHeight * 0.75 + keyboardHeight
                            : screenHeight * 0.75
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
                        {/* Rango de fechas */}
                        <View style={styles.row}>
                            <TouchableOpacity
                                style={[styles.halfColumn, styles.dateButton]}
                                onPress={() => setShowStartDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Icon name="Calendar" size={18} color={theme.colors.placeholder} />
                                <ThemedText variant="regular" size={13} color={theme.colors.text} style={styles.dateText}>
                                    {formatDate(startDate)}
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.halfColumn, styles.dateButton]}
                                onPress={() => setShowEndDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Icon name="Calendar" size={18} color={theme.colors.placeholder} />
                                <ThemedText variant="regular" size={13} color={theme.colors.text} style={styles.dateText}>
                                    {formatDate(endDate)}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>

                        {isRange && (
                            <View style={styles.rangeInfo}>
                                <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                    {(() => {
                                        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                        return `Se crearán ${diffDays} comidas`;
                                    })()}
                                </ThemedText>
                                <TouchableOpacity
                                    style={styles.applyAllButton}
                                    onPress={() => setApplyToAll(!applyToAll)}
                                >
                                    <Icon
                                        name={applyToAll ? 'CheckSquare' : 'Square'}
                                        size={16}
                                        color={theme.colors.primary}
                                        backgroundColor="transparent"
                                        padding={0}
                                    />
                                    <ThemedText variant="regular" size={11} color={theme.colors.primary}>
                                        Aplicar a todos los días
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Hora */}
                        <View style={styles.row}>
                            <TouchableOpacity
                                style={[styles.fullColumn, styles.timeButton]}
                                onPress={() => setShowTimePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Icon name="Clock" size={18} color={theme.colors.placeholder} />
                                <ThemedText variant="regular" size={14} color={theme.colors.text} style={styles.dateText}>
                                    {formatTime(time)}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Meal Type */}
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

                        {/* Botón Add Food */}
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
                                {isEditing ? 'Actualizar' : isRange ? `Guardar (${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} días)` : 'Guardar'}
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

            {/* Date Pickers */}
            {showStartDatePicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleStartDateChange}
                />
            )}

            {showEndDatePicker && (
                <DateTimePicker
                    value={endDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleEndDateChange}
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
        marginBottom: 16,
    },
    title: {
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 1,
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 10,
        gap: 10,
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
    fullColumn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    fullRow: {
        marginBottom: 10,
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
    rangeInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    applyAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
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