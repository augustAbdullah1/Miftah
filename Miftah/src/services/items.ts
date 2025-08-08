import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  serverTimestamp,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Item, Filter, SortOption, ItemStatus, Condition, User } from '../types';

export class ItemService {
  // Create new item with AI features
  static async createItem(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'favoritesCount'>): Promise<string> {
    try {
      // AI-powered category suggestion
      const suggestedCategory = await this.suggestCategory(itemData.title, itemData.description);
      
      // AI-powered pricing recommendation
      const priceSuggestion = await this.suggestPrice(itemData.category.id, itemData.title, itemData.description);
      
      const item = {
        ...itemData,
        category: suggestedCategory || itemData.category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        viewsCount: 0,
        favoritesCount: 0,
        status: ItemStatus.ACTIVE,
        // AI-generated tags for better searchability
        tags: await this.generateTags(itemData.title, itemData.description),
        // SEO-friendly slug
        slug: this.generateSlug(itemData.title),
        // Price history for analytics
        priceHistory: [{ price: itemData.price, date: new Date(), reason: 'initial' }],
        // Quality score based on description and images
        qualityScore: this.calculateQualityScore(item),
      };

      const docRef = await addDoc(collection(db, 'items'), item);
      
      // Create search index entry
      await this.createSearchIndex(docRef.id, item);
      
      // Send notifications to interested users
      await this.notifyInterestedUsers(item);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  // Upload images with compression and AI analysis
  static async uploadImages(images: string[], itemId: string): Promise<string[]> {
    try {
      const uploadPromises = images.map(async (imageUri, index) => {
        // Compress image
        const compressedImage = await this.compressImage(imageUri);
        
        // AI image analysis for quality and content
        const imageAnalysis = await this.analyzeImage(compressedImage);
        
        const fileName = `items/${itemId}/image_${index}_${Date.now()}.jpg`;
        const imageRef = ref(storage, fileName);
        
        const response = await fetch(compressedImage);
        const blob = await response.blob();
        
        await uploadBytes(imageRef, blob);
        const downloadURL = await getDownloadURL(imageRef);
        
        // Store image metadata
        await this.storeImageMetadata(itemId, downloadURL, imageAnalysis);
        
        return downloadURL;
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  }

  // Advanced search with AI recommendations
  static async searchItems(
    searchQuery?: string,
    filters?: Filter,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ items: Item[], hasMore: boolean, suggestions: string[] }> {
    try {
      let itemsQuery = collection(db, 'items');
      const constraints: any[] = [where('status', '==', ItemStatus.ACTIVE)];

      // Apply filters
      if (filters?.category) {
        constraints.push(where('category.id', '==', filters.category));
      }
      
      if (filters?.minPrice !== undefined) {
        constraints.push(where('price', '>=', filters.minPrice));
      }
      
      if (filters?.maxPrice !== undefined) {
        constraints.push(where('price', '<=', filters.maxPrice));
      }
      
      if (filters?.condition) {
        constraints.push(where('condition', '==', filters.condition));
      }

      // Apply sorting
      const sortBy = filters?.sortBy || SortOption.NEWEST;
      switch (sortBy) {
        case SortOption.NEWEST:
          constraints.push(orderBy('createdAt', 'desc'));
          break;
        case SortOption.OLDEST:
          constraints.push(orderBy('createdAt', 'asc'));
          break;
        case SortOption.PRICE_LOW_TO_HIGH:
          constraints.push(orderBy('price', 'asc'));
          break;
        case SortOption.PRICE_HIGH_TO_LOW:
          constraints.push(orderBy('price', 'desc'));
          break;
        case SortOption.MOST_VIEWED:
          constraints.push(orderBy('viewsCount', 'desc'));
          break;
      }

      constraints.push(limit(pageSize));

      const q = query(itemsQuery, ...constraints);
      const querySnapshot = await getDocs(q);
      
      let items: Item[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Item);
      });

      // Apply text search if query provided
      if (searchQuery) {
        items = await this.performTextSearch(items, searchQuery);
        
        // Store search query for analytics
        await this.logSearchQuery(searchQuery, items.length);
      }

      // AI-powered search suggestions
      const suggestions = await this.generateSearchSuggestions(searchQuery, filters);

      return {
        items,
        hasMore: querySnapshot.size === pageSize,
        suggestions,
      };
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  }

  // Smart recommendations based on user behavior
  static async getRecommendations(userId: string, limit: number = 10): Promise<Item[]> {
    try {
      // Get user's browsing history and preferences
      const userPreferences = await this.getUserPreferences(userId);
      
      // AI-powered recommendation algorithm
      const recommendedItems = await this.generateRecommendations(userPreferences, limit);
      
      return recommendedItems;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  // Price tracking and alerts
  static async trackPriceChanges(itemId: string): Promise<void> {
    try {
      const itemRef = doc(db, 'items', itemId);
      
      return onSnapshot(itemRef, async (doc) => {
        if (doc.exists()) {
          const item = doc.data() as Item;
          
          // Check for price changes
          if (item.priceHistory && item.priceHistory.length > 1) {
            const currentPrice = item.price;
            const previousPrice = item.priceHistory[item.priceHistory.length - 2].price;
            
            if (currentPrice < previousPrice) {
              // Notify users who favorited this item
              await this.notifyPriceDrop(itemId, currentPrice, previousPrice);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error tracking price changes:', error);
    }
  }

  // Advanced fraud detection
  static async detectFraud(item: Partial<Item>): Promise<{ isSuspicious: boolean, reasons: string[] }> {
    try {
      const reasons: string[] = [];
      
      // Check for suspicious pricing
      if (item.price && item.category) {
        const averagePrice = await this.getAveragePriceForCategory(item.category.id);
        if (item.price < averagePrice * 0.3) {
          reasons.push('Price significantly below market average');
        }
      }
      
      // Check for duplicate content
      if (item.title && item.description) {
        const duplicates = await this.findDuplicateContent(item.title, item.description);
        if (duplicates.length > 0) {
          reasons.push('Similar content found in other listings');
        }
      }
      
      // Check image authenticity
      if (item.images && item.images.length > 0) {
        const imageAnalysis = await this.analyzeImagesForFraud(item.images);
        if (imageAnalysis.suspicious) {
          reasons.push('Images may be stolen or manipulated');
        }
      }
      
      return {
        isSuspicious: reasons.length > 0,
        reasons,
      };
    } catch (error) {
      console.error('Error detecting fraud:', error);
      return { isSuspicious: false, reasons: [] };
    }
  }

  // Real-time bidding system
  static async placeBid(itemId: string, userId: string, bidAmount: number): Promise<void> {
    try {
      const bidData = {
        itemId,
        userId,
        amount: bidAmount,
        timestamp: serverTimestamp(),
        status: 'active',
      };
      
      await addDoc(collection(db, 'bids'), bidData);
      
      // Update item's highest bid
      await updateDoc(doc(db, 'items', itemId), {
        highestBid: bidAmount,
        highestBidder: userId,
        updatedAt: serverTimestamp(),
      });
      
      // Notify previous highest bidder
      await this.notifyBidOutbid(itemId, bidAmount);
    } catch (error) {
      console.error('Error placing bid:', error);
      throw error;
    }
  }

  // AI-powered category suggestion
  private static async suggestCategory(title: string, description: string): Promise<any> {
    // Simulate AI category suggestion
    const keywords = `${title} ${description}`.toLowerCase();
    
    if (keywords.includes('phone') || keywords.includes('mobile') || keywords.includes('iphone')) {
      return { id: 'electronics', name: 'Electronics', nameAr: 'إلكترونيات' };
    }
    
    if (keywords.includes('car') || keywords.includes('vehicle') || keywords.includes('toyota')) {
      return { id: 'vehicles', name: 'Vehicles', nameAr: 'مركبات' };
    }
    
    return null;
  }

  // AI-powered pricing recommendation
  private static async suggestPrice(categoryId: string, title: string, description: string): Promise<number | null> {
    try {
      // Get similar items in the same category
      const similarItems = await this.findSimilarItems(categoryId, title, description);
      
      if (similarItems.length > 0) {
        const averagePrice = similarItems.reduce((sum, item) => sum + item.price, 0) / similarItems.length;
        return Math.round(averagePrice);
      }
      
      return null;
    } catch (error) {
      console.error('Error suggesting price:', error);
      return null;
    }
  }

  // Generate SEO-friendly slug
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  // Calculate item quality score
  private static calculateQualityScore(item: any): number {
    let score = 0;
    
    // Title quality (0-25 points)
    if (item.title && item.title.length > 10) score += 25;
    else if (item.title && item.title.length > 5) score += 15;
    
    // Description quality (0-35 points)
    if (item.description && item.description.length > 100) score += 35;
    else if (item.description && item.description.length > 50) score += 25;
    else if (item.description && item.description.length > 20) score += 15;
    
    // Images quality (0-40 points)
    if (item.images && item.images.length >= 5) score += 40;
    else if (item.images && item.images.length >= 3) score += 30;
    else if (item.images && item.images.length >= 1) score += 20;
    
    return score;
  }

  // Generate AI tags
  private static async generateTags(title: string, description: string): Promise<string[]> {
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [];
    
    // Simple keyword extraction (in real app, use proper NLP)
    const keywords = text.match(/\b\w{3,}\b/g) || [];
    const uniqueKeywords = [...new Set(keywords)];
    
    return uniqueKeywords.slice(0, 10);
  }

  // Other helper methods would be implemented here...
  private static async compressImage(imageUri: string): Promise<string> {
    // Image compression logic
    return imageUri;
  }

  private static async analyzeImage(imageUri: string): Promise<any> {
    // AI image analysis
    return { quality: 'high', content: 'product' };
  }

  private static async storeImageMetadata(itemId: string, imageUrl: string, analysis: any): Promise<void> {
    // Store image metadata
  }

  private static async createSearchIndex(itemId: string, item: any): Promise<void> {
    // Create search index
  }

  private static async notifyInterestedUsers(item: any): Promise<void> {
    // Notify users who might be interested
  }

  private static async performTextSearch(items: Item[], query: string): Promise<Item[]> {
    const searchTerm = query.toLowerCase();
    return items.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  private static async logSearchQuery(query: string, resultsCount: number): Promise<void> {
    // Log search analytics
  }

  private static async generateSearchSuggestions(query?: string, filters?: Filter): Promise<string[]> {
    // Generate search suggestions
    return ['iPhone 13', 'Samsung Galaxy', 'Toyota Camry', 'MacBook Pro'];
  }

  private static async getUserPreferences(userId: string): Promise<any> {
    // Get user preferences and behavior
    return {};
  }

  private static async generateRecommendations(preferences: any, limit: number): Promise<Item[]> {
    // AI recommendation algorithm
    return [];
  }

  private static async notifyPriceDrop(itemId: string, currentPrice: number, previousPrice: number): Promise<void> {
    // Send price drop notifications
  }

  private static async getAveragePriceForCategory(categoryId: string): Promise<number> {
    // Calculate average price for category
    return 1000;
  }

  private static async findDuplicateContent(title: string, description: string): Promise<any[]> {
    // Find duplicate content
    return [];
  }

  private static async analyzeImagesForFraud(images: string[]): Promise<{ suspicious: boolean }> {
    // Analyze images for fraud
    return { suspicious: false };
  }

  private static async notifyBidOutbid(itemId: string, newBidAmount: number): Promise<void> {
    // Notify previous highest bidder
  }

  private static async findSimilarItems(categoryId: string, title: string, description: string): Promise<Item[]> {
    // Find similar items for pricing
    return [];
  }
}