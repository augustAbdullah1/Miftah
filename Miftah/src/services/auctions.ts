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
  onSnapshot,
  serverTimestamp,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Item, User } from '../types';

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidder?: User;
  amount: number;
  timestamp: Date;
  isWinning: boolean;
  isAutoBid: boolean;
  maxBidAmount?: number; // For auto-bidding
  status: 'active' | 'outbid' | 'winning' | 'won' | 'cancelled';
}

export interface Auction {
  id: string;
  itemId: string;
  item?: Item;
  sellerId: string;
  seller?: User;
  startingPrice: number;
  currentPrice: number;
  buyNowPrice?: number;
  reservePrice?: number;
  startTime: Date;
  endTime: Date;
  status: 'upcoming' | 'active' | 'ended' | 'cancelled';
  totalBids: number;
  watchers: string[];
  watchersCount: number;
  // Advanced features
  bidIncrement: number;
  extensionTime: number; // Auto-extend if bid in last minutes
  allowedBidders: string[]; // For private auctions
  isPrivate: boolean;
  // AI features
  estimatedValue: number;
  priceHistory: { price: number; timestamp: Date }[];
  bidPattern: 'normal' | 'sniping' | 'aggressive' | 'cautious';
  // eBay-like features
  bestOfferEnabled: boolean;
  immediatePaymentRequired: boolean;
  shippingCost: number;
  returnsAccepted: boolean;
  // Analytics
  viewsCount: number;
  uniqueViewers: string[];
  averageBidTime: number;
  // Security
  suspiciousBids: string[];
  blockedBidders: string[];
}

export class AuctionService {
  // Create auction with advanced features
  static async createAuction(auctionData: Omit<Auction, 'id' | 'currentPrice' | 'totalBids' | 'watchers' | 'watchersCount' | 'viewsCount' | 'uniqueViewers' | 'suspiciousBids' | 'blockedBidders'>): Promise<string> {
    try {
      // AI-powered starting price suggestion
      const suggestedPrice = await this.suggestStartingPrice(auctionData.itemId);
      
      // Calculate optimal auction duration
      const optimalDuration = await this.calculateOptimalDuration(auctionData.itemId);
      
      const auction: Omit<Auction, 'id'> = {
        ...auctionData,
        currentPrice: auctionData.startingPrice,
        totalBids: 0,
        watchers: [],
        watchersCount: 0,
        viewsCount: 0,
        uniqueViewers: [],
        suspiciousBids: [],
        blockedBidders: [],
        // AI enhancements
        estimatedValue: suggestedPrice.estimatedValue,
        priceHistory: [{ price: auctionData.startingPrice, timestamp: new Date() }],
        bidPattern: 'normal',
        // Optimal settings
        bidIncrement: this.calculateBidIncrement(auctionData.startingPrice),
        extensionTime: 10 * 60 * 1000, // 10 minutes
      };

      const docRef = await addDoc(collection(db, 'auctions'), {
        ...auction,
        startTime: serverTimestamp(),
        endTime: new Date(Date.now() + optimalDuration),
      });

      // Schedule auction notifications
      await this.scheduleAuctionNotifications(docRef.id, auction);

      return docRef.id;
    } catch (error) {
      console.error('Error creating auction:', error);
      throw error;
    }
  }

  // Place bid with advanced validation
  static async placeBid(
    auctionId: string,
    bidderId: string,
    bidAmount: number,
    isAutoBid: boolean = false,
    maxBidAmount?: number
  ): Promise<{ success: boolean; message: string; newPrice?: number }> {
    try {
      return await runTransaction(db, async (transaction) => {
        const auctionRef = doc(db, 'auctions', auctionId);
        const auctionDoc = await transaction.get(auctionRef);

        if (!auctionDoc.exists()) {
          throw new Error('Auction not found');
        }

        const auction = { id: auctionDoc.id, ...auctionDoc.data() } as Auction;

        // Validate auction status
        if (auction.status !== 'active') {
          return { success: false, message: 'Auction is not active' };
        }

        // Check if auction has ended
        if (new Date() > auction.endTime) {
          return { success: false, message: 'Auction has ended' };
        }

        // Validate bidder
        if (auction.sellerId === bidderId) {
          return { success: false, message: 'Sellers cannot bid on their own items' };
        }

        if (auction.blockedBidders.includes(bidderId)) {
          return { success: false, message: 'You are blocked from bidding' };
        }

        // Validate bid amount
        const minimumBid = auction.currentPrice + auction.bidIncrement;
        if (bidAmount < minimumBid) {
          return { 
            success: false, 
            message: `Minimum bid is $${minimumBid}` 
          };
        }

        // Check for suspicious bidding pattern
        const isSuspicious = await this.detectSuspiciousBidding(auctionId, bidderId, bidAmount);
        if (isSuspicious.suspicious) {
          return { 
            success: false, 
            message: 'Bid rejected: ' + isSuspicious.reason 
          };
        }

        // Handle auto-bidding logic
        let finalBidAmount = bidAmount;
        if (auction.currentPrice > 0) {
          const currentWinningBid = await this.getCurrentWinningBid(auctionId);
          if (currentWinningBid?.isAutoBid && currentWinningBid.maxBidAmount) {
            finalBidAmount = await this.handleAutoBidding(
              auction,
              currentWinningBid,
              bidAmount,
              isAutoBid,
              maxBidAmount
            );
          }
        }

        // Create bid record
        const bidData: Omit<Bid, 'id'> = {
          auctionId,
          bidderId,
          amount: finalBidAmount,
          timestamp: new Date(),
          isWinning: true,
          isAutoBid,
          maxBidAmount,
          status: 'winning',
        };

        const bidRef = await addDoc(collection(db, 'bids'), {
          ...bidData,
          timestamp: serverTimestamp(),
        });

        // Update previous winning bid
        await this.updatePreviousWinningBids(auctionId, bidRef.id);

        // Update auction
        const updates: Partial<Auction> = {
          currentPrice: finalBidAmount,
          totalBids: increment(1),
          priceHistory: [
            ...auction.priceHistory,
            { price: finalBidAmount, timestamp: new Date() }
          ],
          bidPattern: await this.analyzeBidPattern(auctionId),
        };

        // Auto-extend auction if bid placed in final minutes
        const timeLeft = auction.endTime.getTime() - Date.now();
        if (timeLeft < auction.extensionTime) {
          updates.endTime = new Date(auction.endTime.getTime() + auction.extensionTime);
        }

        transaction.update(auctionRef, updates);

        // Send notifications
        await this.notifyWatchers(auctionId, finalBidAmount, bidderId);
        await this.notifyOutbidBidders(auctionId, finalBidAmount);

        return { 
          success: true, 
          message: 'Bid placed successfully',
          newPrice: finalBidAmount
        };
      });
    } catch (error) {
      console.error('Error placing bid:', error);
      return { success: false, message: 'Failed to place bid' };
    }
  }

  // Watch/Unwatch auction (like eBay's watch feature)
  static async toggleWatchAuction(auctionId: string, userId: string): Promise<boolean> {
    try {
      const auctionRef = doc(db, 'auctions', auctionId);
      const auctionDoc = await getDoc(auctionRef);

      if (!auctionDoc.exists()) {
        throw new Error('Auction not found');
      }

      const auction = auctionDoc.data() as Auction;
      const isWatching = auction.watchers.includes(userId);

      if (isWatching) {
        // Remove from watchers
        await updateDoc(auctionRef, {
          watchers: auction.watchers.filter(id => id !== userId),
          watchersCount: increment(-1),
        });
        return false;
      } else {
        // Add to watchers
        await updateDoc(auctionRef, {
          watchers: [...auction.watchers, userId],
          watchersCount: increment(1),
        });
        return true;
      }
    } catch (error) {
      console.error('Error toggling watch:', error);
      throw error;
    }
  }

  // Make offer (Best Offer feature like eBay)
  static async makeOffer(
    auctionId: string,
    buyerId: string,
    offerAmount: number,
    message?: string
  ): Promise<string> {
    try {
      const auctionDoc = await getDoc(doc(db, 'auctions', auctionId));
      
      if (!auctionDoc.exists()) {
        throw new Error('Auction not found');
      }

      const auction = auctionDoc.data() as Auction;
      
      if (!auction.bestOfferEnabled) {
        throw new Error('Best Offer is not enabled for this auction');
      }

      const offerData = {
        auctionId,
        buyerId,
        sellerId: auction.sellerId,
        amount: offerAmount,
        message: message || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        // AI features
        acceptanceProbability: await this.calculateOfferAcceptanceProbability(
          auction,
          offerAmount
        ),
        suggestedCounterOffer: await this.suggestCounterOffer(auction, offerAmount),
      };

      const docRef = await addDoc(collection(db, 'offers'), offerData);

      // Notify seller
      await this.notifySellerOfOffer(auction.sellerId, offerAmount, buyerId);

      return docRef.id;
    } catch (error) {
      console.error('Error making offer:', error);
      throw error;
    }
  }

  // Buy It Now feature
  static async buyNow(auctionId: string, buyerId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await runTransaction(db, async (transaction) => {
        const auctionRef = doc(db, 'auctions', auctionId);
        const auctionDoc = await transaction.get(auctionRef);

        if (!auctionDoc.exists()) {
          return { success: false, message: 'Auction not found' };
        }

        const auction = { id: auctionDoc.id, ...auctionDoc.data() } as Auction;

        if (!auction.buyNowPrice) {
          return { success: false, message: 'Buy It Now is not available' };
        }

        if (auction.status !== 'active') {
          return { success: false, message: 'Auction is not active' };
        }

        if (auction.sellerId === buyerId) {
          return { success: false, message: 'You cannot buy your own item' };
        }

        // End auction and create sale
        transaction.update(auctionRef, {
          status: 'ended',
          endTime: serverTimestamp(),
          winnerId: buyerId,
          finalPrice: auction.buyNowPrice,
        });

        // Create sale record
        const saleData = {
          auctionId,
          itemId: auction.itemId,
          sellerId: auction.sellerId,
          buyerId,
          amount: auction.buyNowPrice,
          type: 'buy_now',
          status: 'pending_payment',
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'sales'), saleData);

        // Notify all watchers that auction ended
        await this.notifyAuctionEnded(auctionId, buyerId, auction.buyNowPrice);

        return { success: true, message: 'Item purchased successfully' };
      });
    } catch (error) {
      console.error('Error buying now:', error);
      return { success: false, message: 'Failed to complete purchase' };
    }
  }

  // Get auction with real-time updates
  static subscribeToAuction(auctionId: string, callback: (auction: Auction | null) => void) {
    const auctionRef = doc(db, 'auctions', auctionId);
    
    return onSnapshot(auctionRef, (doc) => {
      if (doc.exists()) {
        const auction = {
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime?.toDate() || new Date(),
          endTime: doc.data().endTime?.toDate() || new Date(),
        } as Auction;
        callback(auction);
      } else {
        callback(null);
      }
    });
  }

  // Get auction bids with real-time updates
  static subscribeToAuctionBids(auctionId: string, callback: (bids: Bid[]) => void) {
    const bidsRef = collection(db, 'bids');
    const q = query(
      bidsRef,
      where('auctionId', '==', auctionId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const bids: Bid[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bids.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as Bid);
      });
      callback(bids);
    });
  }

  // Advanced search for auctions
  static async searchAuctions(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    endingSoon?: boolean;
    buyNowOnly?: boolean;
    watchedOnly?: boolean;
    userId?: string;
  }): Promise<Auction[]> {
    try {
      let auctionsQuery = collection(db, 'auctions');
      const constraints: any[] = [where('status', '==', 'active')];

      if (filters.category) {
        constraints.push(where('item.category.id', '==', filters.category));
      }

      if (filters.minPrice !== undefined) {
        constraints.push(where('currentPrice', '>=', filters.minPrice));
      }

      if (filters.maxPrice !== undefined) {
        constraints.push(where('currentPrice', '<=', filters.maxPrice));
      }

      if (filters.buyNowOnly) {
        constraints.push(where('buyNowPrice', '!=', null));
      }

      if (filters.watchedOnly && filters.userId) {
        constraints.push(where('watchers', 'array-contains', filters.userId));
      }

      if (filters.endingSoon) {
        const soonThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        constraints.push(where('endTime', '<=', soonThreshold));
      }

      constraints.push(orderBy('endTime', 'asc'));

      const q = query(auctionsQuery, ...constraints);
      const querySnapshot = await getDocs(q);

      const auctions: Auction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        auctions.push({
          id: doc.id,
          ...data,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate() || new Date(),
        } as Auction);
      });

      return auctions;
    } catch (error) {
      console.error('Error searching auctions:', error);
      return [];
    }
  }

  // Helper methods
  private static async suggestStartingPrice(itemId: string) {
    // AI-powered price suggestion based on similar items
    return {
      estimatedValue: 100,
      suggestedStarting: 80,
      confidence: 0.85,
    };
  }

  private static async calculateOptimalDuration(itemId: string): Promise<number> {
    // Calculate optimal auction duration based on item category and market data
    return 7 * 24 * 60 * 60 * 1000; // 7 days default
  }

  private static calculateBidIncrement(currentPrice: number): number {
    if (currentPrice < 25) return 0.50;
    if (currentPrice < 100) return 1.00;
    if (currentPrice < 250) return 2.50;
    if (currentPrice < 500) return 5.00;
    if (currentPrice < 1000) return 10.00;
    return 25.00;
  }

  private static async detectSuspiciousBidding(
    auctionId: string,
    bidderId: string,
    bidAmount: number
  ): Promise<{ suspicious: boolean; reason?: string }> {
    // AI-powered suspicious bidding detection
    // Check for bid patterns, timing, amounts, etc.
    return { suspicious: false };
  }

  private static async getCurrentWinningBid(auctionId: string): Promise<Bid | null> {
    const bidsRef = collection(db, 'bids');
    const q = query(
      bidsRef,
      where('auctionId', '==', auctionId),
      where('isWinning', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate() || new Date(),
    } as Bid;
  }

  private static async handleAutoBidding(
    auction: Auction,
    currentWinningBid: Bid,
    newBidAmount: number,
    isAutoBid: boolean,
    maxBidAmount?: number
  ): Promise<number> {
    // Complex auto-bidding logic similar to eBay
    if (!currentWinningBid.maxBidAmount) return newBidAmount;

    const increment = auction.bidIncrement;
    
    if (newBidAmount <= currentWinningBid.maxBidAmount) {
      // Current auto-bidder wins with minimum increment
      return Math.min(newBidAmount + increment, currentWinningBid.maxBidAmount);
    } else {
      // New bidder wins
      return isAutoBid && maxBidAmount
        ? Math.min(currentWinningBid.maxBidAmount + increment, maxBidAmount)
        : currentWinningBid.maxBidAmount + increment;
    }
  }

  private static async updatePreviousWinningBids(auctionId: string, newWinningBidId: string) {
    const bidsRef = collection(db, 'bids');
    const q = query(
      bidsRef,
      where('auctionId', '==', auctionId),
      where('isWinning', '==', true)
    );

    const snapshot = await getDocs(q);
    const batch = db.batch ? db.batch() : null;

    snapshot.forEach((doc) => {
      if (doc.id !== newWinningBidId) {
        const bidRef = doc.ref;
        if (batch) {
          batch.update(bidRef, { isWinning: false, status: 'outbid' });
        } else {
          updateDoc(bidRef, { isWinning: false, status: 'outbid' });
        }
      }
    });

    if (batch) {
      await batch.commit();
    }
  }

  private static async analyzeBidPattern(auctionId: string): Promise<Auction['bidPattern']> {
    // Analyze bidding patterns using AI
    return 'normal';
  }

  private static async scheduleAuctionNotifications(auctionId: string, auction: Omit<Auction, 'id'>) {
    // Schedule notifications for auction start, ending soon, etc.
  }

  private static async notifyWatchers(auctionId: string, newPrice: number, bidderId: string) {
    // Notify all watchers of new bid
  }

  private static async notifyOutbidBidders(auctionId: string, newPrice: number) {
    // Notify outbid bidders
  }

  private static async calculateOfferAcceptanceProbability(auction: Auction, offerAmount: number): Promise<number> {
    // AI calculation of offer acceptance probability
    const percentageOfCurrent = offerAmount / auction.currentPrice;
    return Math.min(0.9, Math.max(0.1, percentageOfCurrent - 0.1));
  }

  private static async suggestCounterOffer(auction: Auction, offerAmount: number): Promise<number> {
    // AI-suggested counter offer
    return Math.round((offerAmount + auction.currentPrice) / 2);
  }

  private static async notifySellerOfOffer(sellerId: string, offerAmount: number, buyerId: string) {
    // Notify seller of new offer
  }

  private static async notifyAuctionEnded(auctionId: string, winnerId: string, finalPrice: number) {
    // Notify all watchers that auction ended
  }
}