import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  useColorScheme,
  I18nManager,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';

// Import i18n configuration
import './src/i18n';

// Services
import { AuthService } from './src/services/auth';

// Screens
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { HomeScreen } from './src/screens/main/HomeScreen';

// Components
import { GlassContainer } from './src/components/GlassContainer';

// Theme
import { lightTheme, darkTheme } from './src/theme';

// Types
import { User } from './src/types';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Main Tab Navigator
const MainTabNavigator = ({ user }: { user: User }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'AddItem') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.glass,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <GlassContainer
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 0,
            }}
            intensity={30}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        children={(props) => <HomeScreen {...props} user={user} />}
        options={{ title: 'الرئيسية' }}
      />
      <Tab.Screen
        name="Categories"
        component={DummyScreen}
        options={{ title: 'التصنيفات' }}
      />
      <Tab.Screen
        name="AddItem"
        component={DummyScreen}
        options={{ title: 'إضافة إعلان' }}
      />
      <Tab.Screen
        name="Messages"
        component={DummyScreen}
        options={{ title: 'الرسائل' }}
      />
      <Tab.Screen
        name="Profile"
        component={DummyScreen}
        options={{ title: 'الملف الشخصي' }}
      />
    </Tab.Navigator>
  );
};

// Dummy Screen Component (to be replaced with actual screens)
const DummyScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <LinearGradient
      colors={theme.gradients.background}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <GlassContainer style={{ padding: 20, borderRadius: 16 }}>
        <Ionicons
          name="construct"
          size={48}
          color={theme.colors.primary}
          style={{ marginBottom: 16, alignSelf: 'center' }}
        />
        <text style={{ color: theme.colors.text, fontSize: 18, textAlign: 'center' }}>
          🚧 Under Development 🚧
        </text>
        <text style={{ color: theme.colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
          This feature is coming soon!
        </text>
      </GlassContainer>
    </LinearGradient>
  );
};

// Auth Stack Navigator
const AuthStackNavigator = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleRegisterSuccess = (userData: User) => {
    setUser(userData);
  };

  if (user) {
    return <MainTabNavigator user={user} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {(props) => (
          <RegisterScreen {...props} onRegisterSuccess={handleRegisterSuccess} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

// Main App Component
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Set RTL for Arabic
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(false); // Set to true for RTL layout

      // Check if user is already logged in
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }

      // Listen to auth state changes
      const unsubscribe = AuthService.onAuthStateChanged((userData) => {
        setUser(userData);
      });

      // Hide splash screen
      await SplashScreen.hideAsync();
      
      return unsubscribe;
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Splash screen is still visible
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <NavigationContainer>
          {user ? <MainTabNavigator user={user} /> : <AuthStackNavigator />}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
