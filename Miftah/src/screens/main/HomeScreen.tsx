import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  I18nManager,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { GlassContainer } from '../../components/GlassContainer';
import { CustomButton } from '../../components/CustomButton';
import { ItemService } from '../../services/items';
import { lightTheme, darkTheme, categories } from '../../theme';
import { Item, Filter, SortOption, User } from '../../types';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
  user: User;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  navigation,
  user,
}) => {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = I18nManager.isRTL;

  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [featuredItems, setFeaturedItems] = useState<Item[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Load recent items
      const recentItemsResult = await ItemService.searchItems('', {
        sortBy: SortOption.NEWEST,
      }, 1, 10);
      
      // Load featured items (high quality score)
      const featuredResult = await ItemService.searchItems('', {
        sortBy: SortOption.MOST_VIEWED,
      }, 1, 5);
      
      // Load personalized recommendations
      const recommendations = await ItemService.getRecommendations(user.id, 8);
      
      setItems(recentItemsResult.items);
      setFeaturedItems(featuredResult.items);
      setRecommendedItems(recommendations);
      setSearchSuggestions(recentItemsResult.suggestions);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  }, []);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { 
        query: searchQuery,
        filters: {} as Filter 
      });
    }
  };

  const handleCategoryPress = (category: any) => {
    navigation.navigate('Category', { category });
  };

  const handleItemPress = (item: Item) => {
    navigation.navigate('ItemDetails', { item });
  };

  const renderSearchBar = () => (
    <Animatable.View animation="fadeInDown" style={styles.searchContainer}>
      <GlassContainer style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.textSecondary}
            style={[styles.searchIcon, isRTL && styles.searchIconRTL]}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: theme.colors.text },
              isRTL && { textAlign: 'right' }
            ]}
            placeholder={t('search')}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          <CustomButton
            title=""
            onPress={handleSearch}
            variant="ghost"
            size="small"
            style={styles.searchButton}
            icon={
              <Ionicons
                name="filter"
                size={20}
                color={theme.colors.primary}
              />
            }
          />
        </View>
      </GlassContainer>

      {/* Search Suggestions */}
      {showSuggestions && searchSuggestions.length > 0 && (
        <Animatable.View animation="fadeIn" style={styles.suggestionsContainer}>
          <GlassContainer style={styles.suggestions}>
            {searchSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => {
                  setSearchQuery(suggestion);
                  setShowSuggestions(false);
                  handleSearch();
                }}
              >
                <Ionicons
                  name="search"
                  size={16}
                  color={theme.colors.textSecondary}
                  style={styles.suggestionIcon}
                />
                <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </GlassContainer>
        </Animatable.View>
      )}
    </Animatable.View>
  );

  const renderCategories = () => (
    <Animatable.View animation="fadeInLeft" delay={200} style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {t('categories')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category, index) => (
          <Animatable.View
            key={category.id}
            animation="bounceIn"
            delay={100 * index}
          >
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
            >
              <GlassContainer style={styles.categoryContainer}>
                <LinearGradient
                  colors={[category.color + '20', category.color + '40']}
                  style={styles.categoryGradient}
                />
                <Ionicons
                  name={category.icon as any}
                  size={32}
                  color={category.color}
                  style={styles.categoryIcon}
                />
                <Text style={[
                  styles.categoryName,
                  { color: theme.colors.text }
                ]}>
                  {i18n.language === 'ar' ? category.nameAr : category.name}
                </Text>
              </GlassContainer>
            </TouchableOpacity>
          </Animatable.View>
        ))}
      </ScrollView>
    </Animatable.View>
  );

  const renderFeaturedItems = () => (
    <Animatable.View animation="fadeInRight" delay={400} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          🔥 Featured Items
        </Text>
        <CustomButton
          title="View All"
          onPress={() => navigation.navigate('Featured')}
          variant="ghost"
          size="small"
        />
      </View>
      <FlatList
        horizontal
        data={featuredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animatable.View
            animation="zoomIn"
            delay={100 * index}
            style={styles.featuredItemContainer}
          >
            <TouchableOpacity
              onPress={() => handleItemPress(item)}
              style={styles.featuredItem}
            >
              <GlassContainer style={styles.itemCard}>
                <View style={styles.itemImageContainer}>
                  {item.images && item.images.length > 0 ? (
                    <Text style={styles.itemImagePlaceholder}>📷</Text>
                  ) : (
                    <Text style={styles.itemImagePlaceholder}>🖼️</Text>
                  )}
                  {user.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={theme.colors.success}
                      />
                    </View>
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text
                    style={[styles.itemTitle, { color: theme.colors.text }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
                    {item.currency} {item.price.toLocaleString()}
                  </Text>
                  <View style={styles.itemMeta}>
                    <Text style={[styles.itemLocation, { color: theme.colors.textSecondary }]}>
                      📍 {item.location.city}
                    </Text>
                    <Text style={[styles.itemViews, { color: theme.colors.textSecondary }]}>
                      👁 {item.viewsCount}
                    </Text>
                  </View>
                </View>
              </GlassContainer>
            </TouchableOpacity>
          </Animatable.View>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.itemsList}
      />
    </Animatable.View>
  );

  const renderRecommendations = () => (
    <Animatable.View animation="fadeInUp" delay={600} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          🎯 {t('recommendations')} 
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
          Based on your interests
        </Text>
      </View>
      <FlatList
        data={recommendedItems}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animatable.View
            animation="fadeInUp"
            delay={50 * index}
            style={styles.recommendedItemContainer}
          >
            <TouchableOpacity
              onPress={() => handleItemPress(item)}
              style={styles.recommendedItem}
            >
              <GlassContainer style={styles.compactItemCard}>
                <Text style={styles.compactItemImage}>📱</Text>
                <Text
                  style={[styles.compactItemTitle, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <Text style={[styles.compactItemPrice, { color: theme.colors.primary }]}>
                  ${item.price}
                </Text>
              </GlassContainer>
            </TouchableOpacity>
          </Animatable.View>
        )}
        scrollEnabled={false}
      />
    </Animatable.View>
  );

  const renderQuickActions = () => (
    <Animatable.View animation="pulse" delay={800} style={styles.section}>
      <View style={styles.quickActions}>
        <CustomButton
          title="🎯 Smart Search"
          onPress={() => navigation.navigate('SmartSearch')}
          variant="outline"
          style={styles.quickActionButton}
        />
        <CustomButton
          title="📊 Price Alerts"
          onPress={() => navigation.navigate('PriceAlerts')}
          variant="outline"
          style={styles.quickActionButton}
        />
        <CustomButton
          title="🔥 Live Auctions"
          onPress={() => navigation.navigate('Auctions')}
          variant="outline"
          style={styles.quickActionButton}
        />
      </View>
    </Animatable.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.gradients.background}
        style={StyleSheet.absoluteFillObject}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
                {t('greeting')}, 
              </Text>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {user.displayName} {user.isVerified && '✅'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <GlassContainer style={styles.notificationContainer}>
                <Ionicons
                  name="notifications"
                  size={24}
                  color={theme.colors.primary}
                />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>3</Text>
                </View>
              </GlassContainer>
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {renderSearchBar()}
        {renderCategories()}
        {renderFeaturedItems()}
        {renderRecommendations()}
        {renderQuickActions()}

        {/* Recent Items */}
        <Animatable.View animation="fadeIn" delay={1000} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🆕 Recent Items
          </Text>
          {items.map((item, index) => (
            <Animatable.View
              key={item.id}
              animation="slideInRight"
              delay={50 * index}
            >
              <TouchableOpacity
                onPress={() => handleItemPress(item)}
                style={styles.listItem}
              >
                <GlassContainer style={styles.listItemContainer}>
                  <Text style={styles.listItemImage}>🖼️</Text>
                  <View style={styles.listItemInfo}>
                    <Text
                      style={[styles.listItemTitle, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.listItemPrice, { color: theme.colors.primary }]}>
                      ${item.price}
                    </Text>
                    <Text style={[styles.listItemLocation, { color: theme.colors.textSecondary }]}>
                      📍 {item.location.city}
                    </Text>
                  </View>
                  <Ionicons
                    name={isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </GlassContainer>
              </TouchableOpacity>
            </Animatable.View>
          ))}
        </Animatable.View>
      </ScrollView>

      {/* Floating Add Button */}
      <Animatable.View
        animation="bounceIn"
        delay={1200}
        style={styles.floatingButton}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('AddItem')}
          style={styles.fab}
        >
          <LinearGradient
            colors={theme.gradients.primary}
            style={styles.fabGradient}
          >
            <Ionicons
              name="add"
              size={28}
              color={theme.colors.surface}
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    position: 'relative',
    zIndex: 10,
  },
  searchBar: {
    borderRadius: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchIconRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
    marginRight: 8,
  },
  searchButton: {
    padding: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  suggestions: {
    borderRadius: 12,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    marginRight: 16,
  },
  categoryContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  categoryGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryIcon: {
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  itemsList: {
    paddingHorizontal: 20,
  },
  featuredItemContainer: {
    marginRight: 16,
  },
  featuredItem: {
    width: 200,
  },
  itemCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  itemImageContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  itemImagePlaceholder: {
    fontSize: 40,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 4,
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemLocation: {
    fontSize: 12,
  },
  itemViews: {
    fontSize: 12,
  },
  recommendedItemContainer: {
    flex: 1,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  recommendedItem: {
    flex: 1,
  },
  compactItemCard: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minHeight: 120,
  },
  compactItemImage: {
    fontSize: 32,
    marginBottom: 8,
  },
  compactItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  compactItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  listItem: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  listItemImage: {
    fontSize: 24,
    marginRight: 16,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  listItemLocation: {
    fontSize: 12,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});