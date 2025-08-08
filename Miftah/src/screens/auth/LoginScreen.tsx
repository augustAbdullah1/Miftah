import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useColorScheme,
  I18nManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../../components/GlassContainer';
import { CustomButton } from '../../components/CustomButton';
import { AuthService } from '../../services/auth';
import { lightTheme, darkTheme } from '../../theme';

interface LoginScreenProps {
  navigation: any;
  onLoginSuccess: (user: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  navigation,
  onLoginSuccess,
}) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = I18nManager.isRTL;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('error'), 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await AuthService.signIn(email, password);
      onLoginSuccess(user);
    } catch (error: any) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t('error'), 'Please enter your email first');
      return;
    }

    try {
      await AuthService.resetPassword(email);
      Alert.alert(t('success'), 'Password reset email sent');
    } catch (error: any) {
      Alert.alert(t('error'), error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={theme.gradients.background}
        style={StyleSheet.absoluteFillObject}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.logo, { color: theme.colors.text }]}>
            {t('appName')}
          </Text>
          <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>
            {t('appTagline')}
          </Text>
        </View>

        <GlassContainer style={styles.formContainer}>
          <View style={styles.form}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('login')}
            </Text>

            <View style={styles.inputContainer}>
              <View style={[
                styles.inputWrapper,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }
              ]}>
                <Ionicons
                  name="mail"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text },
                    isRTL && { textAlign: 'right' }
                  ]}
                  placeholder={t('email')}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={[
                styles.inputWrapper,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }
              ]}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text },
                    isRTL && { textAlign: 'right' }
                  ]}
                  placeholder={t('password')}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <CustomButton
                  title=""
                  onPress={() => setShowPassword(!showPassword)}
                  variant="ghost"
                  size="small"
                  style={styles.passwordToggle}
                  icon={
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  }
                />
              </View>
            </View>

            <CustomButton
              title={t('forgotPassword')}
              onPress={handleForgotPassword}
              variant="ghost"
              size="small"
              style={styles.forgotPassword}
              textStyle={{ fontSize: 14 }}
            />

            <CustomButton
              title={t('login')}
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <View style={styles.signupPrompt}>
              <Text style={[styles.signupText, { color: theme.colors.textSecondary }]}>
                {t('dontHaveAccount')}
              </Text>
              <CustomButton
                title={t('register')}
                onPress={() => navigation.navigate('Register')}
                variant="ghost"
                size="small"
                textStyle={{ fontWeight: '600' }}
              />
            </View>
          </View>
        </GlassContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    marginHorizontal: 20,
  },
  form: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputIconRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  loginButton: {
    marginBottom: 24,
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    marginRight: 4,
  },
});