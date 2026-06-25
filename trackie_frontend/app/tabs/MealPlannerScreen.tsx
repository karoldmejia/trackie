import { Icon } from '@/components/icon';
import { AddPlannedMealForm } from '@/components/meal-planner/AddPlannedMealForm';
import { PlannedMealCard } from '@/components/meal-planner/PlannedMealCard';
import { NavBar } from '@/components/navbar';
import { DayPlan, mealPlannerService, PlannedMeal } from '@/services/mealPlannerService';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

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

    // Función para obtener la fecha actual en formato YYYY-MM-DD
    const getTodayDate = (): string => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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

    // Obtener solo las comidas del día actual
    const getTodaysPlannedMeals = (): PlannedMeal[] => {
        const today = getTodayDate();
        
        // Buscar el DayPlan de hoy
        const todayPlan = dayPlans.find(plan => plan.date === today);
        
        if (!todayPlan || !todayPlan.plannedMeals || todayPlan.plannedMeals.length === 0) {
            return [];
        }

        // Ordenar por hora
        return [...todayPlan.plannedMeals].sort((a, b) => {
            return a.time.localeCompare(b.time);
        });
    };

    const plannedMeals = getTodaysPlannedMeals();

    const handleMealPress = (meal: PlannedMeal) => {
        // Abrir el formulario en modo edición
        setEditingMeal(meal);
        setIsEditing(true);
        setShowAddForm(true);
    };

    const handleAddPress = async () => {
        const today = getTodayDate();
        try {
            let existingPlan = await mealPlannerService.getDayPlanByDate(today);
            
            if (!existingPlan) {
                existingPlan = await mealPlannerService.createDayPlan({ date: today });
            }
            
            setDayPlanId(existingPlan.id);
            setEditingMeal(null);
            setIsEditing(false);
            setShowAddForm(true);
        } catch (error) {
            console.error('Error preparing add form:', error);
        }
    };

    const handleAddPlannedMeal = async (data: {
        date: string;
        time: string;
        mealType: string;
        dishIds: string[];
    }) => {
        try {
            if (isEditing && editingMeal) {
                // Actualizar PlannedMeal existente
                await mealPlannerService.updatePlannedMeal(editingMeal.id, {
                    mealType: data.mealType as any,
                    time: data.time,
                });

                // Actualizar dishes (agregar nuevos)
                const currentDishIds = editingMeal.dishes.map(d => d.id);
                const newDishIds = data.dishIds.filter(id => !currentDishIds.includes(id));
                
                if (newDishIds.length > 0) {
                    await mealPlannerService.addDishesToPlannedMeal(
                        editingMeal.id,
                        newDishIds
                    );
                }
            } else if (dayPlanId) {
                // Crear nuevo PlannedMeal
                await mealPlannerService.addPlannedMeal(dayPlanId, {
                    mealType: data.mealType as any,
                    time: data.time,
                    dishIds: data.dishIds,
                });
            }
            
            await fetchData();
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
            // Actualizar el editingMeal local
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
        // Aquí irá la lógica para ver la lista de compras
        console.log('Cart pressed');
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
                            onPress={() => {}}
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
                    <Text style={styles.headerTitle}>Comidas del día</Text>
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

                {/* Mostrar la fecha actual */}
                <Text style={styles.dateLabel}>
                    {new Date().toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </Text>

                {/* Lista de comidas planificadas */}
                {loading ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Cargando...</Text>
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
                        <Text style={styles.emptyTitle}>Sin comidas planificadas</Text>
                        <Text style={styles.emptySubtitle}>
                            Agrega tus primeras comidas para hoy
                        </Text>
                    </View>
                )}
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
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
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
    dateLabel: {
        fontSize: 14,
        color: '#888888',
        marginBottom: 16,
        fontWeight: '700',
    },
    mealsList: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
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