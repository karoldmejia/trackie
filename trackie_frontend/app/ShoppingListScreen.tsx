import { Icon } from '@/components/icon';
import { ShoppingListCard } from '@/components/meal-planner/ShoppingListCard';
import { ThemedText } from '@/components/ThemedText';
import { CreateShoppingListDto, ShoppingList, shoppingListService } from '@/services/shoppingListService';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const logo = require('@/assets/home_logo.png');

const ShoppingListScreen: React.FC = () => {
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
    const router = useRouter();

    const fetchData = async () => {
        try {
            setLoading(true);
            const lists = await shoppingListService.findAll();
            setShoppingLists(lists);
        } catch (error) {
            console.error('Error fetching shopping lists:', error);
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

    const handleAddPress = async () => {
        try {
            // Encontrar la última fecha de finalización
            const sortedLists = [...shoppingLists].sort((a, b) =>
                new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
            );

            let startDate = new Date();
            if (sortedLists.length > 0) {
                const lastEndDate = new Date(sortedLists[0].endDate);
                startDate = new Date(lastEndDate);
                startDate.setDate(startDate.getDate() + 1);
            }

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);

            const newList: CreateShoppingListDto = {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                items: []
            };

            await shoppingListService.create(newList);
            await fetchData();
        } catch (error) {
            console.error('Error creating shopping list:', error);
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleAddItem = (listId: string) => {
        console.log('Add item to list:', listId);
    };

    // Función para verificar si una lista contiene la fecha actual
const isListActive = (list: ShoppingList): boolean => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return list.startDate <= todayStr && list.endDate >= todayStr;
};

// Ordenar listas: activas primero, luego por fecha de inicio descendente
const sortedLists = [...shoppingLists].sort((a, b) => {
    const aActive = isListActive(a);
    const bActive = isListActive(b);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
});

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Icon
                            name="ChevronLeft"
                            size={20}
                            color={theme.colors.text}
                            backgroundColor="transparent"
                            padding={0}
                        />
                    </TouchableOpacity>
                    <ThemedText variant="semiBold" size={16} color={theme.colors.text} style={styles.headerTitle}>
                        Lista de compras
                    </ThemedText>
                </View>
                <View style={styles.headerActions}>
                    <Icon
                        name="Plus"
                        color={theme.colors.white}
                        backgroundColor={theme.colors.primary}
                        onPress={handleAddPress}
                        style={styles.addIcon}
                    />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >

{loading ? (
    <View style={styles.emptyContainer}>
        <ThemedText variant="regular" size={14} color={theme.colors.secondary}>
            Cargando...
        </ThemedText>
    </View>
) : sortedLists.length > 0 ? (
    <View style={styles.listsContainer}>
        {sortedLists.map((list, index) => {
            const isActive = isListActive(list);
            return (
                <React.Fragment key={list.id}>
                    <ShoppingListCard
                        shoppingList={list}
                        onUpdate={fetchData}
                        onAddItem={handleAddItem}
                        isAlwaysExpanded={isActive}
                    />
                    {/* Línea separadora después de la lista activa y entre las demás */}
                    {isActive && index < sortedLists.length - 1 && (
                        <View style={styles.separator} />
                    )}
                </React.Fragment>
            );
        })}
    </View>
) : (
    <View style={styles.emptyContainer}>
        <ThemedText variant="semiBold" size={18} color={theme.colors.text} style={styles.emptyTitle}>
            Sin listas de compras
        </ThemedText>
        <ThemedText variant="regular" size={14} color={theme.colors.secondary} style={styles.emptySubtitle}>
            Crea tu primera lista de compras
        </ThemedText>
    </View>
)}
            </ScrollView>
        </View>
    );
};

export default ShoppingListScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
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
    },
    backButton: {
        marginRight: 12,

    },
    headerTitle: {
        fontWeight: '700',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addIcon: {
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        padding: 4,
    },
    listsContainer: {
        flex: 1,
    },
    emptyContainer: {
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
    rightIcons: {
        flexDirection: 'row',
        gap: 12,
    },
    separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 4,
    marginBottom: 10
},
});