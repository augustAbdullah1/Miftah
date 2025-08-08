export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  location?: {
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  rating?: number;
  totalRatings?: number;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: Category;
  condition: Condition;
  images: string[];
  location: {
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  userId: string;
  user?: User;
  status: ItemStatus;
  createdAt: Date;
  updatedAt: Date;
  viewsCount: number;
  favoritesCount: number;
  tags?: string[];
  features?: string[];
  contactInfo: {
    phone?: string;
    whatsapp?: string;
    email?: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  createdAt: Date;
  isRead: boolean;
  itemId?: string;
  attachments?: string[];
}

export interface Conversation {
  id: string;
  participants: string[];
  itemId?: string;
  item?: Item;
  lastMessage?: Message;
  updatedAt: Date;
  unreadCount: number;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  color: string;
  subcategories?: Category[];
}

export interface Filter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: Condition;
  location?: string;
  sortBy?: SortOption;
  searchQuery?: string;
}

export enum ItemStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  PENDING = 'pending',
  INACTIVE = 'inactive'
}

export enum Condition {
  NEW = 'new',
  USED = 'used',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  LOCATION = 'location',
  OFFER = 'offer'
}

export enum SortOption {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  PRICE_LOW_TO_HIGH = 'priceLowToHigh',
  PRICE_HIGH_TO_LOW = 'priceHighToLow',
  MOST_VIEWED = 'mostViewed'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export enum NotificationType {
  NEW_MESSAGE = 'newMessage',
  ITEM_FAVORITED = 'itemFavorited',
  ITEM_SOLD = 'itemSold',
  PRICE_DROP = 'priceDrop',
  VERIFICATION_APPROVED = 'verificationApproved'
}

export interface AppTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    glass: string;
    blur: string;
  };
  gradients: {
    primary: string[];
    secondary: string[];
    background: string[];
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadows: {
    sm: object;
    md: object;
    lg: object;
  };
}