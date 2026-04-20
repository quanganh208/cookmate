import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { ErrorView } from '@/shared/components/error-view';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { flattenRecipePages } from '@/features/recipes/hooks/use-recipes';
import { useRecipesSearch } from '../hooks/use-recipes-search';
import { useRecentSearches } from '../hooks/use-recent-searches';
import { RecentSearchesList } from '../components/recent-searches-list';
import { SearchResultsGrid } from '../components/search-results-grid';
import { SearchEmptyState } from '../components/search-empty-state';

const DEBOUNCE_MS = 300;
const END_REACHED_THRESHOLD = 400;

/** Full-text recipe search: debounced input, recent-history idle state,
 *  infinite scroll results, empty/error/loading branches. */
export function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const {
    entries: recents,
    add: addRecent,
    remove: removeRecent,
    clear: clearRecents,
  } = useRecentSearches();

  const searchQuery = useRecipesSearch(debouncedQuery);
  const results = useMemo(() => flattenRecipePages(searchQuery.data?.pages), [searchQuery.data]);

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    addRecent(trimmed);
  }, [query, addRecent]);

  const handleSelectRecent = useCallback(
    (entry: string) => {
      setQuery(entry);
      addRecent(entry);
    },
    [addRecent],
  );

  const handleRecipePress = (id: string) => {
    router.push(`/recipe/${id}`);
  };

  const handleScroll = ({
    nativeEvent,
  }: {
    nativeEvent: {
      contentOffset: { y: number };
      contentSize: { height: number };
      layoutMeasurement: { height: number };
    };
  }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (
      distanceFromBottom < END_REACHED_THRESHOLD &&
      searchQuery.hasNextPage &&
      !searchQuery.isFetchingNextPage
    ) {
      searchQuery.fetchNextPage();
    }
  };

  const trimmedDebounced = debouncedQuery.trim();
  const showIdle = trimmedDebounced.length === 0;
  const showLoading = !showIdle && searchQuery.isLoading;
  const showError = !showIdle && searchQuery.isError;
  const showEmpty =
    !showIdle && !showLoading && !showError && results.length === 0 && !searchQuery.isFetching;
  const showResults = !showIdle && results.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchBar}>
        <FontAwesome6 name="magnifying-glass" size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSubmit}
          placeholder="Search recipes..."
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="search"
          autoFocus
          accessibilityLabel="Search recipes"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery('')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <FontAwesome6 name="xmark-circle" size={16} color={Colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={200}
        keyboardShouldPersistTaps="handled"
      >
        {showIdle ? (
          <RecentSearchesList
            entries={recents}
            onSelect={handleSelectRecent}
            onRemove={removeRecent}
            onClearAll={clearRecents}
          />
        ) : null}

        {showLoading ? <ActivityIndicator color={Colors.primary} style={styles.loader} /> : null}

        {showError ? (
          <ErrorView
            title="Search failed"
            message={
              searchQuery.error instanceof Error ? searchQuery.error.message : 'Please try again.'
            }
            onRetry={() => searchQuery.refetch()}
          />
        ) : null}

        {showEmpty ? <SearchEmptyState query={trimmedDebounced} /> : null}

        {showResults ? (
          <>
            <View style={styles.resultsHeader}>
              <Text style={[Typography.meta, { color: Colors.textSecondary }]}>
                {searchQuery.data?.pages[0]?.totalElements ?? results.length} results
              </Text>
            </View>
            <SearchResultsGrid recipes={results} onRecipePress={handleRecipePress} />
            {searchQuery.isFetchingNextPage ? (
              <ActivityIndicator color={Colors.primary} style={styles.loader} />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  input: { flex: 1, color: Colors.textPrimary, padding: 0 },
  resultsHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  loader: { marginVertical: 16 },
});
