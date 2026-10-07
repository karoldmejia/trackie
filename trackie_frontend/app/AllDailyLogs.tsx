import { DailyLogCard } from '@/components/home/DailyLogCard';
import { DailyLogEditorHandle, DailyLogEditorHost } from '@/components/home/DailyLogEditorHost';
import { SearchModal } from '@/components/home/SearchModal';
import { SearchResults } from '@/components/home/SearchResults';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/ThemedText';
import { DailyLog, dailyLogService } from '@/services/dailyLogService';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const AllDailyLogs: React.FC = () => {

    const PAGE_SIZE = 15;

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<DailyLog[]>([]);
    const [currentSearchDate, setCurrentSearchDate] = useState<string | undefined>();
    const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const editorRef = useRef<DailyLogEditorHandle>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    const handleGoBack = () => {
        router.back();
    };

    const handleSearchPress = () => {
        setSearchModalVisible(true);
    };

    const handleSearch = async (date: string) => {
        try {
            setCurrentSearchDate(date);
            const result = await dailyLogService.getByDate(date).catch(() => null);
            if (result) {
                setSearchResults([result]);
            } else {
                setSearchResults([]);
            }
            setIsSearching(true);
            setSearchModalVisible(false);
        } catch (error) {
            console.error('Error searching:', error);
            setSearchResults([]);
            setIsSearching(true);
        }
    };

    const handleClearSearch = () => {
        setIsSearching(false);
        setSearchResults([]);
        setCurrentSearchDate(undefined);
    };

    const handleLogPress = (log: DailyLog) => {
        editorRef.current?.open(log);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const { items, hasMore } = await dailyLogService.getPage({
                limit: PAGE_SIZE,
                offset: 0,
            });
            setAllLogs(items);
            setOffset(items.length);
            setHasMore(hasMore);
        } catch (error) {
            console.error('Error fetching daily logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        try {
            setLoadingMore(true);
            const { items, hasMore: more } = await dailyLogService.getPage({
                limit: PAGE_SIZE,
                offset,
            });
            setAllLogs((prev) => [...prev, ...items]);
            setOffset((o) => o + items.length);
            setHasMore(more);
        } catch (error) {
            console.error('Error loading more:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleLogDelete = async (log: DailyLog) => {
        try {
            await dailyLogService.delete(log.id);
            setAllLogs((prev) => prev.filter((l) => l.id !== log.id));
            setOffset((o) => Math.max(0, o - 1));
            if (isSearching && currentSearchDate === log.date) {
                handleClearSearch();
            }
        } catch (error) {
            console.error('Error deleting daily log:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        if (isSearching) {
            handleClearSearch();
        }
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.navbar}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <ThemedText variant="medium" size={14} color={theme.colors.text}>
                            Todos mis registros
                        </ThemedText>
                    </View>
                    <TouchableOpacity onPress={handleSearchPress} style={styles.searchButton}>
                        <Icon
                            name="Search"
                            size={18}
                            color={theme.colors.text}
                            backgroundColor={theme.colors.white}
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Icon name="ArrowLeft" size={18} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <ThemedText variant="medium" size={14} color={theme.colors.text}>
                        Todos mis registros
                    </ThemedText>
                </View>
                <TouchableOpacity onPress={handleSearchPress} style={styles.searchButton}>
                    <Icon
                        name="Search"
                        size={18}
                        color={theme.colors.text}
                        backgroundColor={theme.colors.white}
                    />
                </TouchableOpacity>
            </View>

            {isSearching ? (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <SearchResults
                        results={searchResults}
                        onLogPress={handleLogPress}
                        onClearSearch={handleClearSearch}
                        searchDate={currentSearchDate}
                    />
                </ScrollView>
            ) : (
                <FlatList
                    data={allLogs}
                    keyExtractor={(log) => log.id}
                    renderItem={({ item }) => (
                        <DailyLogCard
                            log={item}
                            onPress={() => handleLogPress(item)}
                            onDelete={() => handleLogDelete(item)}
                        />
                    )}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator
                                style={{ paddingVertical: 20 }}
                                color={theme.colors.primary}
                            />
                        ) : !hasMore && allLogs.length > 0 ? (
                            <ThemedText
                                variant="regular"
                                size={12}
                                color={theme.colors.textLight}
                                style={{ textAlign: 'center', paddingVertical: 16 }}
                            >
                                No hay más registros
                            </ThemedText>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon
                                name="Package"
                                size={48}
                                color={theme.colors.textLight}
                                backgroundColor="transparent"
                                padding={0}
                            />
                            <ThemedText variant="regular" size={14} color={theme.colors.textLight}>
                                No hay registros diarios aún
                            </ThemedText>
                        </View>
                    }
                />
            )}

            {/* Modal de búsqueda */}
            <SearchModal
                visible={searchModalVisible}
                onClose={() => setSearchModalVisible(false)}
                onSearch={handleSearch}
            />

            <DailyLogEditorHost ref={editorRef} onSaved={fetchData} />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 70,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    searchButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    logsContainer: {
        marginTop: 16,
        marginBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
});

export default AllDailyLogs;