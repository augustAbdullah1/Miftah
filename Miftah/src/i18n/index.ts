import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  en: {
    translation: {
      // App Name
      appName: "Miftah",
      appTagline: "Your Key to Everything",
      
      // Authentication
      login: "Login",
      register: "Register",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot Password?",
      createAccount: "Create Account",
      alreadyHaveAccount: "Already have an account?",
      dontHaveAccount: "Don't have an account?",
      verifyEmail: "Verify Email",
      emailVerified: "Email Verified",
      verificationSent: "Verification email sent",
      
      // Navigation
      home: "Home",
      categories: "Categories",
      addItem: "Add Item",
      messages: "Messages",
      profile: "Profile",
      search: "Search",
      
      // Categories
      electronics: "Electronics",
      vehicles: "Vehicles",
      realEstate: "Real Estate",
      fashion: "Fashion",
      furniture: "Furniture",
      sports: "Sports",
      books: "Books",
      services: "Services",
      jobs: "Jobs",
      other: "Other",
      
      // Item Details
      title: "Title",
      description: "Description",
      price: "Price",
      location: "Location",
      condition: "Condition",
      new: "New",
      used: "Used",
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
      
      // Actions
      post: "Post",
      edit: "Edit",
      delete: "Delete",
      share: "Share",
      favorite: "Favorite",
      contact: "Contact",
      call: "Call",
      message: "Message",
      viewProfile: "View Profile",
      
      // Status
      active: "Active",
      sold: "Sold",
      pending: "Pending",
      verified: "Verified",
      
      // Common
      save: "Save",
      cancel: "Cancel",
      ok: "OK",
      yes: "Yes",
      no: "No",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      retry: "Retry",
      
      // Settings
      settings: "Settings",
      language: "Language",
      notifications: "Notifications",
      privacy: "Privacy",
      terms: "Terms & Conditions",
      about: "About",
      logout: "Logout",
      
      // Filters
      filters: "Filters",
      sortBy: "Sort By",
      newest: "Newest",
      oldest: "Oldest",
      priceLowToHigh: "Price: Low to High",
      priceHighToLow: "Price: High to Low",
      
      // Messages
      noItemsFound: "No items found",
      noMessagesYet: "No messages yet",
      itemPostedSuccessfully: "Item posted successfully",
      itemUpdatedSuccessfully: "Item updated successfully",
      itemDeletedSuccessfully: "Item deleted successfully",
    }
  },
  ar: {
    translation: {
      // App Name
      appName: "مفتاح",
      appTagline: "مفتاحك لكل شيء",
      
      // Authentication
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      forgotPassword: "نسيت كلمة المرور؟",
      createAccount: "إنشاء حساب جديد",
      alreadyHaveAccount: "لديك حساب بالفعل؟",
      dontHaveAccount: "ليس لديك حساب؟",
      verifyEmail: "تحقق من البريد الإلكتروني",
      emailVerified: "تم التحقق من البريد الإلكتروني",
      verificationSent: "تم إرسال رسالة التحقق",
      
      // Navigation
      home: "الرئيسية",
      categories: "التصنيفات",
      addItem: "إضافة إعلان",
      messages: "الرسائل",
      profile: "الملف الشخصي",
      search: "البحث",
      
      // Categories
      electronics: "إلكترونيات",
      vehicles: "مركبات",
      realEstate: "عقارات",
      fashion: "أزياء",
      furniture: "أثاث",
      sports: "رياضة",
      books: "كتب",
      services: "خدمات",
      jobs: "وظائف",
      other: "أخرى",
      
      // Item Details
      title: "العنوان",
      description: "الوصف",
      price: "السعر",
      location: "الموقع",
      condition: "الحالة",
      new: "جديد",
      used: "مستعمل",
      excellent: "ممتاز",
      good: "جيد",
      fair: "مقبول",
      
      // Actions
      post: "نشر",
      edit: "تعديل",
      delete: "حذف",
      share: "مشاركة",
      favorite: "المفضلة",
      contact: "تواصل",
      call: "اتصال",
      message: "رسالة",
      viewProfile: "عرض الملف الشخصي",
      
      // Status
      active: "نشط",
      sold: "تم البيع",
      pending: "معلق",
      verified: "موثق",
      
      // Common
      save: "حفظ",
      cancel: "إلغاء",
      ok: "موافق",
      yes: "نعم",
      no: "لا",
      loading: "جاري التحميل...",
      error: "خطأ",
      success: "نجح",
      retry: "إعادة المحاولة",
      
      // Settings
      settings: "الإعدادات",
      language: "اللغة",
      notifications: "الإشعارات",
      privacy: "الخصوصية",
      terms: "الشروط والأحكام",
      about: "حول التطبيق",
      logout: "تسجيل الخروج",
      
      // Filters
      filters: "المرشحات",
      sortBy: "ترتيب حسب",
      newest: "الأحدث",
      oldest: "الأقدم",
      priceLowToHigh: "السعر: من الأقل إلى الأعلى",
      priceHighToLow: "السعر: من الأعلى إلى الأقل",
      
      // Messages
      noItemsFound: "لم يتم العثور على عناصر",
      noMessagesYet: "لا توجد رسائل بعد",
      itemPostedSuccessfully: "تم نشر الإعلان بنجاح",
      itemUpdatedSuccessfully: "تم تحديث الإعلان بنجاح",
      itemDeletedSuccessfully: "تم حذف الإعلان بنجاح",
    }
  }
};

const STORAGE_KEY = 'user-language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      // Default to Arabic
      callback('ar');
    } catch (error) {
      callback('ar');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lng);
    } catch (error) {
      // Handle error
    }
  }
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;