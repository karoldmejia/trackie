import { Icon } from '@/components/icon';
import { AddPlannedMealForm } from '@/components/meal-planner/AddPlannedMealForm';
import { PlannedMealCard } from '@/components/meal-planner/PlannedMealCard';
import { WeeklyPlannerContainer } from '@/components/meal-planner/WeeklyPlannerContainer';
import { NavBar } from '@/components/navbar';
import { ThemedText } from '@/components/ThemedText';
import { DayPlan, mealPlannerService, PlannedMeal } from '@/services/mealPlannerService';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

const logo = require('@/assets/home_logo.png');

const MealPlannerScreen: React.FC = () => {
    const [refreshing, setRefreshing] = useState(false);
    const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [showAddForm, setShowAddForm] = useState(false);
    const [dayPlanId, setDayPlanId] = useState<string | undefined>();
    const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingDate, setEditingDate] = useState<string>('');
    const [selectedWeekDate, setSelectedWeekDate] = useState<string>('');

    const getTodayDate = (): string => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const handleDayPlanPress = (dayPlan: DayPlan) => {
        router.push({
            pathname: '/DayPlanDetailScreen',
            params: { dayPlanId: dayPlan.id }
        });
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const plans = await mealPlannerService.getAllDayPlans();
            setDayPlans(plans);
        } catch (error) {
            console.error('Error fetching day plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getTodaysPlannedMeals = (): PlannedMeal[] => {
        const today = getTodayDate();
        const todayPlan = dayPlans.find(plan => plan.date === today);

        if (!todayPlan || !todayPlan.plannedMeals || todayPlan.plannedMeals.length === 0) {
            return [];
        }

        return [...todayPlan.plannedMeals].sort((a, b) => {
            return a.time.localeCompare(b.time);
        });
    };

    const plannedMeals = getTodaysPlannedMeals();

    const handleMealPress = (meal: PlannedMeal) => {
        const today = getTodayDate();
        setEditingMeal(meal);
        setEditingDate(today);
        setIsEditing(true);
        setShowAddForm(true);
    };

    const handleAddPlannedMeal = async (data: {
        startDate: string;
        endDate: string;
        time: string;
        mealType: string;
        dishIds: string[];
    }) => {
        try {
            // Si es edición, buscar el dayPlan que contiene el meal
            if (isEditing && editingMeal) {
                const dayPlan = dayPlans.find(dp =>
                    dp.plannedMeals?.some(m => m.id === editingMeal.id)
                );

                if (dayPlan) {
                    await mealPlannerService.updatePlannedMeal(editingMeal.id, {
                        mealType: data.mealType as any,
                        time: data.time,
                    });

                    const currentDishIds = editingMeal.dishes.map(d => d.id);
                    const newDishIds = data.dishIds.filter(id => !currentDishIds.includes(id));

                    if (newDishIds.length > 0) {
                        await mealPlannerService.addDishesToPlannedMeal(
                            editingMeal.id,
                            newDishIds
                        );
                    }
                }
            } else {
                // Crear nuevo: usar el rango de fechas
                const start = new Date(data.startDate);
                const end = new Date(data.endDate);

                if (start.getTime() === end.getTime()) {
                    // Misma fecha: usar addPlannedMealByDate
                    await mealPlannerService.addPlannedMealByDate(data.startDate, {
                        mealType: data.mealType as any,
                        time: data.time,
                        dishIds: data.dishIds,
                    });
                } else {
                    // Rango de fechas
                    await mealPlannerService.addPlannedMealRange({
                        startDate: data.startDate,
                        endDate: data.endDate,
                        time: data.time,
                        mealType: data.mealType,
                        dishIds: data.dishIds,
                    });
                }
            }

            await fetchData();
            setShowAddForm(false);
            setEditingMeal(null);
            setIsEditing(false);
            setDayPlanId(undefined);
        } catch (error) {
            console.error('Error saving planned meal:', error);
            alert('Error al guardar la comida planificada');
        }
    };


    const handleAddPress = async () => {
        const today = getTodayDate();
        // No necesitamos crear el DayPlan aquí, el backend lo hará automáticamente
        setEditingMeal(null);
        setIsEditing(false);
        setEditingDate(today);
        setShowAddForm(true);
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
            await fetchData();
        } catch (error) {
            console.error('Error removing dish:', error);
        }
    };

    const handleCartPress = () => {
        router.push('/ShoppingListScreen');
    };

    const handleWeekDaySelect = (date: string) => {
        setSelectedWeekDate(date);
        console.log('Selected date:', date);
    };

    return (
        <View style={styles.container}>
            <NavBar
                logo={logo}
                title="Meal planner"
                showLogoAndTitle={true}
                height={70}
                rightComponent={
                    <View style={styles.rightIcons}>
                        <Icon
                            name="Search"
                            color={theme.colors.text}
                            backgroundColor={theme.colors.white}
                            onPress={() => { }}
                        />
                    </View>
                }
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header con título y acciones */}
                <View style={styles.header}>
                    <ThemedText style={styles.headerTitle}>
                        {new Date().toLocaleDateString('es-CO', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </ThemedText>
                    <View style={styles.headerActions}>
                        <Icon
                            name="ShoppingCart"
                            color={theme.colors.text}
                            backgroundColor={theme.colors.white}
                            onPress={handleCartPress}
                        />
                        <Icon
                            name="Plus"
                            color={theme.colors.white}
                            backgroundColor={theme.colors.primary}
                            onPress={handleAddPress}
                            style={styles.addIcon}
                        />
                    </View>
                </View>

                {/* Lista de comidas planificadas */}
                {loading ? (
                    <View style={styles.emptyContainer}>
                        <ThemedText style={styles.emptyText}>Cargando...</ThemedText>
                    </View>
                ) : plannedMeals.length > 0 ? (
                    <View style={styles.mealsList}>
                        {plannedMeals.map((meal) => (
                            <PlannedMealCard
                                key={meal.id}
                                plannedMeal={meal}
                                onPress={() => handleMealPress(meal)}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <ThemedText variant="medium" size={15} color={theme.colors.text}>Sin comidas planificadas</ThemedText>
                        <ThemedText variant="regular" size={13} color={theme.colors.placeholder}>

                            Agrega tus primeras comidas para hoy
                        </ThemedText>
                    </View>
                )}

                {/* Componente de semana - sin espacios adicionales */}
                <WeeklyPlannerContainer
                    dayPlans={dayPlans}
                    onDaySelect={handleWeekDaySelect}
                    onDayPlanPress={handleDayPlanPress}
                    selectedDate={selectedWeekDate}
                />
            </ScrollView>

            <AddPlannedMealForm
                visible={showAddForm}
                onClose={() => {
                    setShowAddForm(false);
                    setEditingMeal(null);
                    setIsEditing(false);
                }}
                onSubmit={handleAddPlannedMeal}
                dayPlanId={dayPlanId}
                editingMeal={editingMeal}
                isEditing={isEditing}
                onRemoveDish={handleRemoveDishFromMeal}
                editingDate={editingDate}
            />
        </View>
    );
};

export default MealPlannerScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text || '#000000',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    addIcon: {
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        padding: 4,
    },
    mealsList: {
        // Eliminamos flex: 1
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text || '#000000',
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888888',
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.secondary || '#888888',
        textAlign: 'center',
    },
    rightIcons: {
        flexDirection: 'row',
        gap: 12,
    },
});