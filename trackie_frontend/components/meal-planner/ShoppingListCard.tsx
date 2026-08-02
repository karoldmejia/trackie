import { FormSelect } from '@/components/FormSelect';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { PurchaseStatus, ShoppingList, shoppingListService, UnitOfMeasure } from '@/services/shoppingListService';
import { theme } from '@/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ConfirmModal } from './ConfirmModal';

const UNIT_OPTIONS = [
    { label: 'kg', value: UnitOfMeasure.KILOGRAM },
    { label: 'g', value: UnitOfMeasure.GRAM },
    { label: 'mg', value: UnitOfMeasure.MILLIGRAM },
    { label: 'lb', value: UnitOfMeasure.POUND },
    { label: 'L', value: UnitOfMeasure.LITER },
    { label: 'mL', value: UnitOfMeasure.MILLILITER },
    { label: 'und', value: UnitOfMeasure.UNIT },
    { label: 'Docena', value: UnitOfMeasure.DOZEN },
];
const UNIT_DISPLAY_MAP: Record<string, string> = {
    'kg': 'kg',
    'g': 'g',
    'mg': 'mg',
    'lb': 'lb',
    'L': 'L',
    'mL': 'mL',
    'unidad': 'und',
    'docena': 'docena',
};

interface ShoppingListCardProps {
    shoppingList: ShoppingList;
    onUpdate: () => void;
    onAddItem: (listId: string) => void;
    isAlwaysExpanded?: boolean;
}

export const ShoppingListCard: React.FC<ShoppingListCardProps> = ({
    shoppingList,
    onUpdate,
    onAddItem,
    isAlwaysExpanded = false,
}) => {

    const createDateFromString = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const [isEditingDates, setIsEditingDates] = useState(false);
    const { id, startDate, endDate, items, totalCost, totalItems } = shoppingList;
    const [editStartDate, setEditStartDate] = useState(createDateFromString(startDate));
    const [editEndDate, setEditEndDate] = useState(createDateFromString(endDate));
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    React.useEffect(() => {
        setEditStartDate(createDateFromString(startDate));
        setEditEndDate(createDateFromString(endDate));
    }, [startDate, endDate]);

    const [expanded, setExpanded] = useState(isAlwaysExpanded);
    const [showDeleteListModal, setShowDeleteListModal] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemUnit, setNewItemUnit] = useState<UnitOfMeasure>(UnitOfMeasure.UNIT);
    const [newItemUnitPrice, setNewItemUnitPrice] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState('');
    const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const formatDateRange = () => {
        const start = formatDisplayDate(startDate);
        const end = formatDisplayDate(endDate);
        return `${start} - ${end}`;
    };

    const formatDisplayDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);

        const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const dia = String(localDate.getDate()).padStart(2, '0');
        const mes = meses[localDate.getMonth()];
        const año = localDate.getFullYear();

        return `${dia} ${mes} ${año}`;
    };

    const formatDateForDisplay = (date: Date) => {
        return date.toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateForApi = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const saveNewItem = async () => {
        if (!newItemName.trim() || !newItemQuantity || !newItemUnitPrice) {
            return;
        }

        try {
            await shoppingListService.addItems(id, [{
                name: newItemName.trim(),
                unitOfMeasure: newItemUnit,
                quantity: parseFloat(newItemQuantity),
                unitPrice: parseFloat(newItemUnitPrice),
                status: PurchaseStatus.PENDING,
            }]);

            setNewItemName('');
            setNewItemUnit(UnitOfMeasure.UNIT);
            setNewItemUnitPrice('');
            setNewItemQuantity('');
            setShowAddForm(false);
            onUpdate();
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const sortedItems = [...items].sort((a, b) => {
        if (a.status === b.status) return 0;
        if (a.status === PurchaseStatus.PENDING) return -1;
        return 1;
    });

    const getDaysRemaining = () => {
        const end = createDateFromString(endDate);
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const endStr = formatDateForApi(end);

        const diffTime = new Date(endStr).getTime() - new Date(todayStr).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Finalizada';
        if (diffDays === 0) return 'Finaliza hoy';
        return `Finaliza en ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    };

    const toggleItemStatus = async (itemId: string) => {
        try {
            await shoppingListService.toggleItemStatus(itemId);
            onUpdate();
        } catch (error) {
            console.error('Error toggling item status:', error);
        }
    };

    const handleDeleteItemPress = (itemId: string) => {
        setItemToDelete(itemId);
        setShowDeleteItemModal(true);
    };

    const confirmDeleteItem = async () => {
        if (itemToDelete) {
            try {
                await shoppingListService.deleteItem(itemToDelete);
                onUpdate();
            } catch (error) {
                console.error('Error deleting item:', error);
            } finally {
                setShowDeleteItemModal(false);
                setItemToDelete(null);
            }
        }
    };

    const deleteList = async () => {
        try {
            await shoppingListService.delete(id);
            setShowDeleteListModal(false);
            onUpdate();
        } catch (error) {
            console.error('Error deleting list:', error);
        }
    };

    const handleSaveDates = async () => {
        try {
            const updatedList = await shoppingListService.update(id, {
                startDate: formatDateForApi(editStartDate),
                endDate: formatDateForApi(editEndDate),
            });

            setEditStartDate(createDateFromString(updatedList.startDate));
            setEditEndDate(createDateFromString(updatedList.endDate));
            setIsEditingDates(false);
            onUpdate();
        } catch (error) {
            console.error('Error updating dates:', error);
        }
    };

    const handleStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartPicker(false);
        if (selectedDate) {
            setEditStartDate(selectedDate);
            if (selectedDate > editEndDate) {
                setEditEndDate(selectedDate);
            }
        }
    };

    const handleEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndPicker(false);
        if (selectedDate) {
            setEditEndDate(selectedDate);
            if (selectedDate < editStartDate) {
                setEditStartDate(selectedDate);
            }
        }
    };

    return (
        <View style={styles.card}>
            {/* Header - siempre visible */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerTouchable}
                    onPress={() => {
                        if (!isAlwaysExpanded && !isEditingDates) {
                            setExpanded(!expanded);
                        }
                    }}
                    activeOpacity={isAlwaysExpanded || isEditingDates ? 1 : 0.7}
                >
                    <View style={styles.headerLeft}>
                        {!isEditingDates ? (
                            <TouchableOpacity
                                onPress={() => setIsEditingDates(true)}
                                activeOpacity={0.6}
                            >
                                <ThemedText variant="semiBold" size={12} color={theme.colors.textLight} style={styles.dateRange}>
                                    {formatDateRange()}
                                </ThemedText>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.dateEditContainer}>
                                <View style={styles.dateRow}>
                                    <TouchableOpacity
                                        style={styles.datePickerButton}
                                        onPress={() => setShowStartPicker(true)}
                                    >
                                        <ThemedText variant="regular" size={11} color={theme.colors.text}>
                                            {formatDateForDisplay(editStartDate)}
                                        </ThemedText>
                                        <Icon
                                            name="Calendar"
                                            size={12}
                                            color={theme.colors.textLight}
                                            backgroundColor="transparent"
                                        />
                                    </TouchableOpacity>
                                    <ThemedText variant="regular" size={11} color={theme.colors.textLight}>
                                        -
                                    </ThemedText>
                                    <TouchableOpacity
                                        style={styles.datePickerButton}
                                        onPress={() => setShowEndPicker(true)}
                                    >
                                        <ThemedText variant="regular" size={11} color={theme.colors.text}>
                                            {formatDateForDisplay(editEndDate)}
                                        </ThemedText>
                                        <Icon
                                            name="Calendar"
                                            size={12}
                                            color={theme.colors.textLight}
                                            backgroundColor="transparent"
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveDateButton}
                                        onPress={handleSaveDates}
                                    >
                                        <Icon
                                            name="Check"
                                            size={14}
                                            color={theme.colors.white}
                                            backgroundColor={theme.colors.primary}
                                            padding={4}
                                            borderRadius={12}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {showStartPicker && (
                                    <DateTimePicker
                                        value={editStartDate}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={handleStartDateChange}
                                    />
                                )}
                                {showEndPicker && (
                                    <DateTimePicker
                                        value={editEndDate}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={handleEndDateChange}
                                    />
                                )}
                            </View>
                        )}

                        <ThemedText variant="regular" size={14} color={theme.colors.text}>
                            {totalItems} items
                        </ThemedText>
                        <View style={styles.rowWithPrice}>
                            <ThemedText variant="regular" size={12} color={theme.colors.textLight} style={styles.daysRemaining}>
                                {getDaysRemaining()}
                            </ThemedText>
                            <View style={styles.priceContainer}>
                                <ThemedText variant="bold" size={20} color={theme.colors.text}>
                                    ${totalCost.toLocaleString()}
                                </ThemedText>
                                {!isAlwaysExpanded && (
                                    <Icon
                                        name={expanded ? 'ChevronUp' : 'ChevronDown'}
                                        size={20}
                                        color={theme.colors.textLight}
                                        backgroundColor="transparent"
                                    />
                                )}
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                {!isEditingDates && (
                    <TouchableOpacity
                        style={styles.deleteListButton}
                        onPress={() => setShowDeleteListModal(true)}
                    >
                        <Icon
                            name="Trash2"
                            size={16}
                            color={theme.colors.text}
                            backgroundColor={theme.colors.primary}
                            padding={6}
                            borderRadius={20}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Items - solo visible cuando está expandido */}
            {expanded && (
                <View style={styles.itemsContainer}>
                    {sortedItems.map((item) => (
                        <View key={item.id} style={styles.itemRow}>
                            <TouchableOpacity
                                style={styles.checkButton}
                                onPress={() => toggleItemStatus(item.id)}
                            >
                                <Icon
                                    name={item.status === PurchaseStatus.PURCHASED ? 'CheckCircle' : 'Circle'}
                                    size={24}
                                    color={item.status === PurchaseStatus.PURCHASED ? theme.colors.primary : theme.colors.textLight}
                                    backgroundColor="transparent"
                                />
                            </TouchableOpacity>

                            <View style={styles.itemInfo}>
                                <ThemedText variant="regular" size={14} color={theme.colors.text} numberOfLines={1}>
                                    {item.quantity}{UNIT_DISPLAY_MAP[item.unitOfMeasure] || item.unitOfMeasure} de {item.name}
                                </ThemedText>
                            </View>

                            <View style={styles.itemRight}>
                                <ThemedText variant="medium" size={14} color={theme.colors.text}>
                                    ${item.totalPrice.toLocaleString()}
                                </ThemedText>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDeleteItemPress(item.id)}
                                >
                                    <Icon
                                        name="X"
                                        size={16}
                                        color={theme.colors.primary}
                                        backgroundColor="transparent"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {/* Botón Add Item o formulario */}
                    {!showAddForm ? (
                        <TouchableOpacity
                            style={styles.addItemButton}
                            onPress={() => setShowAddForm(true)}
                        >
                            <ThemedText variant="medium" size={14} color={theme.colors.primary}>
                                + Agregar producto
                            </ThemedText>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.addFormContainer}>
                            <View style={styles.formRow}>
                                <TextInput
                                    style={[styles.formInput, styles.formInputName]}
                                    placeholder="Producto"
                                    placeholderTextColor={theme.colors.placeholder}
                                    value={newItemName}
                                    onChangeText={setNewItemName}
                                />

                                <View style={styles.formUnitContainer}>
                                    <FormSelect
                                        icon="Scale"
                                        placeholder="Und."
                                        value={newItemUnit}
                                        options={UNIT_OPTIONS}
                                        onSelect={(value) => setNewItemUnit(value as UnitOfMeasure)}
                                    />
                                </View>
                            </View>

                            <View style={styles.formRow}>
                                <TextInput
                                    style={[styles.formInput, styles.formInputSmall]}
                                    placeholder="Precio"
                                    placeholderTextColor={theme.colors.placeholder}
                                    value={newItemUnitPrice}
                                    onChangeText={setNewItemUnitPrice}
                                    keyboardType="numeric"
                                />

                                <TextInput
                                    style={[styles.formInput, styles.formInputSmall]}
                                    placeholder="Cant."
                                    placeholderTextColor={theme.colors.placeholder}
                                    value={newItemQuantity}
                                    onChangeText={setNewItemQuantity}
                                    keyboardType="numeric"
                                />

                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={saveNewItem}
                                >
                                    <Icon
                                        name="Check"
                                        size={20}
                                        color={theme.colors.white}
                                        backgroundColor={theme.colors.primary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            )}

            <ConfirmModal
                visible={showDeleteItemModal}
                onClose={() => {
                    setShowDeleteItemModal(false);
                    setItemToDelete(null);
                }}
                onConfirm={confirmDeleteItem}
                title="Eliminar item"
                message={`¿Estás seguro de que quieres eliminar este item de la lista?`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />

            <ConfirmModal
                visible={showDeleteListModal}
                onClose={() => setShowDeleteListModal(false)}
                onConfirm={deleteList}
                title="Eliminar lista"
                message={`¿Estás seguro de que quieres eliminar la lista de compras del ${formatDateRange()}?`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: 'transparent',
        elevation: 1,
        paddingBottom: 12
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    headerTouchable: {
        flex: 1,
    },
    headerLeft: {
        flex: 1,
        gap: 2,
        width: '100%',
    },
    dateRange: {
        flexShrink: 1,
    },
    dateEditContainer: {
        flex: 1,
        marginBottom: 4,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: theme.colors.background,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    saveDateButton: {
        marginLeft: 2,
    },
    rowWithPrice: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        gap: 0,
    },
    daysRemaining: {
        flex: 1,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
    },
    deleteListButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 4,
        zIndex: 1,
    },
    itemsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    checkButton: {
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
        marginRight: 8,
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deleteButton: {
        padding: 0,
    },
    addItemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
        borderRadius: 8,
        paddingVertical: 8,
        gap: 5,
        marginTop: 10,
    },
    addFormContainer: {
        paddingVertical: 8,
        gap: 8,
    },
    formRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    formInput: {
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 14,
        fontFamily: theme.typography.fonts.regular,
        color: theme.colors.text,
    },
    formInputName: {
        flex: 2,
        minWidth: 80,
    },
    formInputSmall: {
        flex: 1,
        minWidth: 50,
    },
    formUnitContainer: {
        flex: 1,
        minWidth: 70,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        padding: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
});