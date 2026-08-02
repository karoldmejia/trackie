import { Icon } from '@/components/icon';
import { AddPlannedMealForm } from '@/components/meal-planner/AddPlannedMealForm';
import { ConfirmModal } from '@/components/meal-planner/ConfirmModal';
import { DateBadge } from '@/components/meal-planner/DateBagde';
import { PlannedMealCard } from '@/components/meal-planner/PlannedMealCard';
import { ThemedText } from '@/components/ThemedText';
import { DayPlan, mealPlannerService, PlannedMeal } from '@/services/mealPlannerService';
import { theme } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const dayPlanImages = [
    require('@/assets/dayplan/f1.png'),
    require('@/assets/dayplan/f2.png'),
    require('@/assets/dayplan/f3.png'),
    require('@/assets/dayplan/f4.png'),
    require('@/assets/dayplan/f5.png'),
    require('@/assets/dayplan/f6.png'),
    require('@/assets/dayplan/f7.png'),
    require('@/assets/dayplan/f8.png'),
    require('@/assets/dayplan/f9.png'),
];

const DayPlanDetailScreen: React.FC = () => {
    const router = useRouter();
    const { dayPlanId } = useLocalSearchParams<{ dayPlanId: string }>();

    const [dayPlan, setDayPlan] = useState<DayPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingDate, setEditingDate] = useState<string>('');
    const [dayPlanImage, setDayPlanImage] = useState<any>(null);
    const [addFormDate, setAddFormDate] = useState<string>('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const fetchDayPlan = async () => {
        try {
            setLoading(true);
            if (dayPlanId) {
                const plan = await mealPlannerService.getDayPlanById(dayPlanId);
                if (plan) {
                    setDayPlan(plan);
                    const randomIndex = new Date(plan.date).getDate() % dayPlanImages.length;
                    setDayPlanImage(dayPlanImages[randomIndex]);
                }
            }
        } catch (error) {
            console.error('Error fetching day plan:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDayPlan();
    }, [dayPlanId]);

    const handleMealPress = (meal: PlannedMeal) => {
        setEditingMeal(meal);
        setEditingDate(dayPlan?.date || '');
        setIsEditing(true);
        setShowAddForm(true);
    };

    const handleAddPress = () => {
        setEditingMeal(null);
        setIsEditing(false);
        setShowAddForm(true);
        setAddFormDate(dayPlan?.date || '');
    };

    const handleAddPlannedMeal = async (data: {
        date: string;
        time: string;
        mealType: string;
        dishIds: string[];
    }) => {
        try {
            if (isEditing && editingMeal && dayPlan) {
                await mealPlannerService.updatePlannedMeal(editingMeal.id, {
                    mealType: data.mealType as any,
                    time: data.time,
                });

                const currentDishIds = editingMeal.dishes.map(d => d.id);
                const newDishIds = data.dishIds.filter(id => !currentDishIds.includes(id));

                if (newDishIds.length > 0 && dayPlan) {
                    await mealPlannerService.addDishesToPlannedMeal(
                        editingMeal.id,
                        newDishIds
                    );
                }
            } else if (dayPlan) {
                await mealPlannerService.addPlannedMeal(dayPlan.id, {
                    mealType: data.mealType as any,
                    time: data.time,
                    dishIds: data.dishIds,
                });
            }

            await fetchDayPlan();
            setShowAddForm(false);
            setEditingMeal(null);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving planned meal:', error);
        }
    };

    const handleRemoveDishFromMeal = async (plannedMealId: string, dishId: string) => {
        try {
            await mealPlannerService.removeDishFromPlannedMeal(plannedMealId, dishId);
            if (editingMeal) {
                const updatedDishes = editingMeal.dishes.filter(d => d.id !== dishId);
                setEditingMeal({
                    ...editingMeal,
                    dishes: updatedDishes,
                });
            }
            await fetchDayPlan();
        } catch (error) {
            console.error('Error removing dish:', error);
        }
    };

    const handleDeleteDayPlan = async () => {
        if (!dayPlan) return;
        try {
            await mealPlannerService.deleteDayPlan(dayPlan.id);
            router.back();
        } catch (error) {
            console.error('Error deleting day plan:', error);
        }
    };

    const handleBack = () => {
        router.back();
    };

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getMealCount = () => {
        return dayPlan?.plannedMeals?.length || 0;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    if (!dayPlan) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>No se encontró el plan</Text>
            </View>
        );
    }

    const sortedMeals = [...(dayPlan.plannedMeals || [])].sort((a, b) => {
        return a.time.localeCompare(b.time);
    });

    const handleDeletePress = () => {
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!dayPlan) return;
        try {
            await mealPlannerService.deleteDayPlan(dayPlan.id);
            setShowDeleteModal(false);
            router.back();
        } catch (error) {
            console.error('Error deleting day plan:', error);
            setShowDeleteModal(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header con imagen y botones */}
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Icon
                            name="ChevronLeft"
                            size={28}
                            color={theme.colors.text}
                            backgroundColor="transparent"
                        />
                    </TouchableOpacity>
                    {dayPlanImage && (
                        <View style={styles.headerImageContainer}>
                            <Image
                                source={dayPlanImage}
                                style={styles.headerImage}
                                resizeMode="cover"
                            />
                        </View>
                    )}
                </View>
                <View style={styles.headerActions}>
                    <DateBadge date={dayPlan.date} />

                    <TouchableOpacity onPress={handleAddPress} style={styles.actionButton}>
                        <Icon
                            name="Plus"
                            size={24}
                            color={theme.colors.text}
                            backgroundColor={theme.colors.white}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDeletePress} style={styles.actionButton}>
                        <Icon
                            name="Trash2"
                            size={24}
                            color={theme.colors.text}
                            backgroundColor={theme.colors.white}
                        />
                    </TouchableOpacity>
                </View>
            </View>


            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Lista de PlannedMeals */}
                <View style={styles.mealsContainer}>
                    {sortedMeals.length > 0 ? (
                        sortedMeals.map((meal) => (
                            <PlannedMealCard
                                key={meal.id}
                                plannedMeal={meal}
                                onPress={() => handleMealPress(meal)}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyMealsContainer}>
                        <ThemedText variant="medium" size={13} color={theme.colors.placeholder}>
                                No hay comidas planificadas para este día
                            </ThemedText>
                        </View>
                    )}
                </View>
            </ScrollView>

            <ConfirmModal
                visible={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar plan?"
                message={`¿Estás seguro de que quieres eliminar el plan del día ${formatDate(dayPlan.date)}?`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />

            <AddPlannedMealForm
                visible={showAddForm}
                onClose={() => {
                    setShowAddForm(false);
                    setEditingMeal(null);
                    setIsEditing(false);
                    setAddFormDate('');
                }}
                onSubmit={handleAddPlannedMeal}
                dayPlanId={dayPlan.id}
                editingMeal={editingMeal}
                isEditing={isEditing}
                onRemoveDish={handleRemoveDishFromMeal}
                editingDate={isEditing ? editingDate : addFormDate}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: theme.colors.background,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    backButton: {
        padding: 4,
    },
    headerImageContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 0,
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    actionButton: {
        padding: 0,
    },
    infoContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: theme.colors.background,
    },
    dateText: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text || '#000000',
        marginBottom: 4,
        textAlign: 'center',
    },
    mealCountText: {
        fontSize: 14,
        color: theme.colors.secondary || '#888888',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    mealsContainer: {
        flex: 1,
    },
    emptyMealsContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyMealsText: {
        fontSize: 16,
        color: theme.colors.secondary || '#888888',
        marginBottom: 16,
        textAlign: 'center',
    },
    addMealButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
    },
    addMealButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.white,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    loadingText: {
        fontSize: 16,
        color: theme.colors.text,
    },
});

export default DayPlanDetailScreen;