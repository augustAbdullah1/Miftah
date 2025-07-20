import { AppTheme } from '../types';

export const lightTheme: AppTheme = {
  colors: {
    primary: '#6366F1',
    secondary: '#EC4899',
    background: '#FAFBFC',
    surface: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    glass: 'rgba(255, 255, 255, 0.25)',
    blur: 'rgba(255, 255, 255, 0.8)',
  },
  gradients: {
    primary: ['#6366F1', '#8B5CF6'],
    secondary: ['#EC4899', '#F97316'],
    background: ['#FAFBFC', '#F3F4F6'],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

export const darkTheme: AppTheme = {
  colors: {
    primary: '#818CF8',
    secondary: '#F472B6',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    border: '#334155',
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    glass: 'rgba(30, 41, 59, 0.4)',
    blur: 'rgba(30, 41, 59, 0.8)',
  },
  gradients: {
    primary: ['#818CF8', '#A78BFA'],
    secondary: ['#F472B6', '#FB923C'],
    background: ['#0F172A', '#1E293B'],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

export const categories = [
  {
    id: 'electronics',
    name: 'Electronics',
    nameAr: 'إلكترونيات',
    icon: 'smartphone',
    color: '#3B82F6',
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    nameAr: 'مركبات',
    icon: 'car',
    color: '#10B981',
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    nameAr: 'عقارات',
    icon: 'home',
    color: '#F59E0B',
  },
  {
    id: 'fashion',
    name: 'Fashion',
    nameAr: 'أزياء',
    icon: 'shirt',
    color: '#EC4899',
  },
  {
    id: 'furniture',
    name: 'Furniture',
    nameAr: 'أثاث',
    icon: 'chair',
    color: '#8B5CF6',
  },
  {
    id: 'sports',
    name: 'Sports',
    nameAr: 'رياضة',
    icon: 'football',
    color: '#06B6D4',
  },
  {
    id: 'books',
    name: 'Books',
    nameAr: 'كتب',
    icon: 'book',
    color: '#84CC16',
  },
  {
    id: 'services',
    name: 'Services',
    nameAr: 'خدمات',
    icon: 'briefcase',
    color: '#F97316',
  },
  {
    id: 'jobs',
    name: 'Jobs',
    nameAr: 'وظائف',
    icon: 'users',
    color: '#6366F1',
  },
  {
    id: 'other',
    name: 'Other',
    nameAr: 'أخرى',
    icon: 'grid',
    color: '#64748B',
  },
];

export const glassMorphismStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.25)',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.18)',
  backdropFilter: 'blur(20px)',
  shadowColor: 'rgba(31, 38, 135, 0.37)',
  shadowOffset: {
    width: 0,
    height: 8,
  },
  shadowOpacity: 0.37,
  shadowRadius: 32,
  elevation: 8,
};

export const darkGlassMorphismStyle = {
  backgroundColor: 'rgba(30, 41, 59, 0.4)',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  shadowColor: 'rgba(0, 0, 0, 0.5)',
  shadowOffset: {
    width: 0,
    height: 8,
  },
  shadowOpacity: 0.5,
  shadowRadius: 32,
  elevation: 8,
};