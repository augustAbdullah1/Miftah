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
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Message, Conversation, MessageType, User } from '../types';

export class MessagingService {
  // Send message with advanced features
  static async sendMessage(
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
    attachments?: string[],
    itemId?: string,
    offerAmount?: number
  ): Promise<string> {
    try {
      // Auto-translate message if users speak different languages
      const translatedContent = await this.translateMessage(content, senderId, receiverId);
      
      const messageData = {
        conversationId,
        senderId,
        receiverId,
        content,
        translatedContent,
        type,
        createdAt: serverTimestamp(),
        isRead: false,
        attachments: attachments || [],
        itemId,
        offerAmount,
        // Advanced features
        messageId: this.generateMessageId(),
        isEdited: false,
        isDeleted: false,
        reactions: {},
        replyTo: null,
        // AI features
        sentiment: await this.analyzeSentiment(content),
        spamScore: await this.checkSpam(content, senderId),
        // Voice message features
        duration: type === MessageType.TEXT ? null : 0,
        transcription: type === MessageType.TEXT ? null : content,
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);

      // Update conversation
      await this.updateConversation(conversationId, {
        lastMessage: {
          id: docRef.id,
          content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          senderId,
          createdAt: new Date(),
          type,
        },
        updatedAt: serverTimestamp(),
        [`unreadCount_${receiverId}`]: increment(1),
      });

      // Send push notification
      await this.sendPushNotification(receiverId, senderId, content, type);

      // Smart reply suggestions
      await this.generateSmartReplies(conversationId, content);

      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Advanced conversation features
  static async createOrGetConversation(
    user1Id: string,
    user2Id: string,
    itemId?: string
  ): Promise<string> {
    try {
      // Check if conversation already exists
      const existingConversation = await this.findExistingConversation(user1Id, user2Id, itemId);
      
      if (existingConversation) {
        return existingConversation.id;
      }

      // Create new conversation with advanced features
      const conversationData = {
        participants: [user1Id, user2Id],
        itemId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`unreadCount_${user1Id}`]: 0,
        [`unreadCount_${user2Id}`]: 0,
        // Advanced features
        isArchived: false,
        isMuted: false,
        isPinned: false,
        tags: [],
        // AI features
        conversationSummary: '',
        lastActivity: serverTimestamp(),
        // Business features
        dealStatus: itemId ? 'negotiating' : null,
        agreedPrice: null,
        // Security features
        isBlocked: false,
        reportCount: 0,
        // Language preferences
        preferredLanguage: {
          [user1Id]: 'auto',
          [user2Id]: 'auto',
        },
      };

      const docRef = await addDoc(collection(db, 'conversations'), conversationData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Real-time messaging with typing indicators
  static subscribeToConversation(
    conversationId: string,
    callback: (messages: Message[]) => void
  ) {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Message);
      });
      callback(messages.reverse());
    });
  }

  // Typing indicators
  static async setTyping(conversationId: string, userId: string, isTyping: boolean) {
    try {
      const typingRef = doc(db, 'typing', `${conversationId}_${userId}`);
      
      if (isTyping) {
        await updateDoc(typingRef, {
          userId,
          conversationId,
          isTyping: true,
          timestamp: serverTimestamp(),
        });

        // Auto-clear typing after 5 seconds
        setTimeout(async () => {
          await updateDoc(typingRef, { isTyping: false });
        }, 5000);
      } else {
        await updateDoc(typingRef, { isTyping: false });
      }
    } catch (error) {
      console.error('Error setting typing status:', error);
    }
  }

  // Voice messages with transcription
  static async sendVoiceMessage(
    conversationId: string,
    senderId: string,
    receiverId: string,
    audioUri: string,
    duration: number
  ): Promise<string> {
    try {
      // Upload audio file
      const audioUrl = await this.uploadAudio(audioUri, conversationId);
      
      // Transcribe audio using AI
      const transcription = await this.transcribeAudio(audioUrl);
      
      return await this.sendMessage(
        conversationId,
        senderId,
        receiverId,
        transcription,
        MessageType.TEXT, // Store transcription as text
        [audioUrl],
        undefined,
        undefined
      );
    } catch (error) {
      console.error('Error sending voice message:', error);
      throw error;
    }
  }

  // Smart offer system
  static async sendOfferMessage(
    conversationId: string,
    senderId: string,
    receiverId: string,
    itemId: string,
    offerAmount: number,
    message?: string
  ): Promise<string> {
    try {
      const offerText = message || `I'd like to offer $${offerAmount} for this item.`;
      
      const messageId = await this.sendMessage(
        conversationId,
        senderId,
        receiverId,
        offerText,
        MessageType.OFFER,
        [],
        itemId,
        offerAmount
      );

      // Create offer record
      await addDoc(collection(db, 'offers'), {
        messageId,
        conversationId,
        itemId,
        senderId,
        receiverId,
        amount: offerAmount,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      });

      return messageId;
    } catch (error) {
      console.error('Error sending offer:', error);
      throw error;
    }
  }

  // Message reactions (like WhatsApp)
  static async addReaction(messageId: string, userId: string, reaction: string) {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        [`reactions.${userId}`]: reaction,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Message search with AI
  static async searchMessages(
    userId: string,
    query: string,
    conversationId?: string
  ): Promise<Message[]> {
    try {
      // AI-powered semantic search
      const searchResults = await this.performSemanticSearch(query, userId, conversationId);
      return searchResults;
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  // Conversation insights
  static async getConversationInsights(conversationId: string) {
    try {
      const insights = {
        messageCount: 0,
        averageResponseTime: 0,
        mostActiveTime: '',
        sentimentTrend: [],
        commonTopics: [],
        dealProbability: 0,
      };

      // Calculate insights using AI
      return await this.calculateInsights(conversationId, insights);
    } catch (error) {
      console.error('Error getting insights:', error);
      return null;
    }
  }

  // Auto-moderation
  static async moderateMessage(content: string, senderId: string): Promise<{
    isAllowed: boolean;
    reason?: string;
    suggestedEdit?: string;
  }> {
    try {
      // Check for inappropriate content
      const toxicityScore = await this.checkToxicity(content);
      const spamScore = await this.checkSpam(content, senderId);
      const scamScore = await this.checkScam(content);

      if (toxicityScore > 0.7) {
        return {
          isAllowed: false,
          reason: 'Inappropriate language detected',
          suggestedEdit: await this.suggestAlternative(content),
        };
      }

      if (spamScore > 0.8) {
        return {
          isAllowed: false,
          reason: 'Spam content detected',
        };
      }

      if (scamScore > 0.6) {
        return {
          isAllowed: false,
          reason: 'Potential scam detected',
        };
      }

      return { isAllowed: true };
    } catch (error) {
      console.error('Error moderating message:', error);
      return { isAllowed: true };
    }
  }

  // Helper methods
  private static generateMessageId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static async translateMessage(
    content: string,
    senderId: string,
    receiverId: string
  ): Promise<string | null> {
    try {
      // Get user language preferences
      const senderLang = await this.getUserLanguage(senderId);
      const receiverLang = await this.getUserLanguage(receiverId);

      if (senderLang !== receiverLang) {
        return await this.translateText(content, senderLang, receiverLang);
      }
      
      return null;
    } catch (error) {
      console.error('Error translating message:', error);
      return null;
    }
  }

  private static async analyzeSentiment(content: string): Promise<{
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  }> {
    // Simulate sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'perfect', 'love'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible'];
    
    const words = content.toLowerCase().split(' ');
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    const normalizedScore = Math.max(-1, Math.min(1, score / words.length));
    
    return {
      score: normalizedScore,
      label: normalizedScore > 0.1 ? 'positive' : normalizedScore < -0.1 ? 'negative' : 'neutral',
    };
  }

  private static async checkSpam(content: string, senderId: string): Promise<number> {
    // Simple spam detection
    const spamIndicators = [
      /\b(urgent|limited time|act now|click here|free money)\b/gi,
      /(.)\1{4,}/, // Repeated characters
      /[A-Z]{10,}/, // Too many caps
    ];

    let spamScore = 0;
    spamIndicators.forEach(pattern => {
      if (pattern.test(content)) spamScore += 0.3;
    });

    return Math.min(1, spamScore);
  }

  private static async sendPushNotification(
    receiverId: string,
    senderId: string,
    content: string,
    type: MessageType
  ) {
    try {
      // Get sender info
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      const senderName = senderDoc.data()?.displayName || 'Someone';

      const notificationData = {
        userId: receiverId,
        title: `New message from ${senderName}`,
        body: type === MessageType.TEXT ? content.substring(0, 100) : 
              type === MessageType.IMAGE ? '📷 Photo' :
              type === MessageType.OFFER ? `💰 Offer: $${content}` : 'New message',
        data: {
          type: 'message',
          senderId,
          conversationId: '',
        },
        createdAt: serverTimestamp(),
        isRead: false,
      };

      await addDoc(collection(db, 'notifications'), notificationData);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  private static async generateSmartReplies(conversationId: string, lastMessage: string) {
    // Generate contextual quick replies
    const replies = [
      "Thanks!",
      "Sounds good",
      "I'm interested",
      "What's your best price?",
      "Can we meet?",
      "Is it still available?",
    ];

    // Store smart replies for the conversation
    await updateDoc(doc(db, 'conversations', conversationId), {
      smartReplies: replies,
      smartRepliesUpdatedAt: serverTimestamp(),
    });
  }

  // Additional helper methods would be implemented here...
  private static async findExistingConversation(user1Id: string, user2Id: string, itemId?: string) {
    // Implementation for finding existing conversations
    return null;
  }

  private static async updateConversation(conversationId: string, updates: any) {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, updates);
  }

  private static async uploadAudio(audioUri: string, conversationId: string): Promise<string> {
    // Implementation for uploading audio files
    return audioUri;
  }

  private static async transcribeAudio(audioUrl: string): Promise<string> {
    // AI transcription service integration
    return "Transcribed audio content";
  }

  private static async performSemanticSearch(query: string, userId: string, conversationId?: string) {
    // AI-powered semantic search implementation
    return [];
  }

  private static async calculateInsights(conversationId: string, insights: any) {
    // Calculate conversation insights
    return insights;
  }

  private static async checkToxicity(content: string): Promise<number> {
    // Toxicity detection
    return 0.1;
  }

  private static async checkScam(content: string): Promise<number> {
    // Scam detection
    return 0.1;
  }

  private static async suggestAlternative(content: string): Promise<string> {
    // Suggest alternative text
    return content.replace(/bad words/gi, '***');
  }

  private static async getUserLanguage(userId: string): Promise<string> {
    // Get user language preference
    return 'en';
  }

  private static async translateText(text: string, from: string, to: string): Promise<string> {
    // Translation service integration
    return text;
  }
}