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

interface RegisterScreenProps {
  navigation: any;
  onRegisterSuccess: (user: any) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  navigation,
  onRegisterSuccess,
}) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = I18nManager.isRTL;

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    agreeToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'password') {
      calculatePasswordStrength(value as string);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return theme.colors.error;
      case 2:
      case 3: return theme.colors.warning;
      case 4:
      case 5: return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return 'Weak';
      case 2:
      case 3: return 'Medium';
      case 4:
      case 5: return 'Strong';
      default: return '';
    }
  };

  const validateForm = () => {
    if (!formData.displayName.trim()) {
      Alert.alert(t('error'), 'Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert(t('error'), 'Please enter your email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert(t('error'), 'Please enter a valid email');
      return false;
    }
    if (!formData.password) {
      Alert.alert(t('error'), 'Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert(t('error'), 'Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert(t('error'), 'Passwords do not match');
      return false;
    }
    if (!formData.agreeToTerms) {
      Alert.alert(t('error'), 'Please agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = await AuthService.register(
        formData.email,
        formData.password,
        formData.displayName
      );
      
      Alert.alert(
        t('success'),
        t('verificationSent'),
        [
          {
            text: t('ok'),
            onPress: () => onRegisterSuccess(user),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
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
          <CustomButton
            title=""
            onPress={() => navigation.goBack()}
            variant="ghost"
            size="small"
            style={styles.backButton}
            icon={
              <Ionicons
                name={isRTL ? 'chevron-forward' : 'chevron-back'}
                size={24}
                color={theme.colors.text}
              />
            }
          />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('createAccount')}
          </Text>
        </View>

        <GlassContainer style={styles.formContainer}>
          <View style={styles.form}>
            {/* Name Input */}
            <View style={[
              styles.inputWrapper,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }
            ]}>
              <Ionicons
                name="person"
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
                placeholder="Full Name"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.displayName}
                onChangeText={(value) => updateField('displayName', value)}
                autoCapitalize="words"
              />
            </View>

            {/* Email Input */}
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
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Phone Input */}
            <View style={[
              styles.inputWrapper,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }
            ]}>
              <Ionicons
                name="call"
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
                placeholder="Phone Number (Optional)"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.phoneNumber}
                onChangeText={(value) => updateField('phoneNumber', value)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Password Input */}
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
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
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

            {/* Password Strength Indicator */}
            {formData.password.length > 0 && (
              <View style={styles.passwordStrength}>
                <View style={styles.strengthBar}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor: level <= passwordStrength
                            ? getPasswordStrengthColor()
                            : theme.colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[
                  styles.strengthText,
                  { color: getPasswordStrengthColor() }
                ]}>
                  {getPasswordStrengthText()}
                </Text>
              </View>
            )}

            {/* Confirm Password Input */}
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
                placeholder={t('confirmPassword')}
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <CustomButton
                title=""
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                variant="ghost"
                size="small"
                style={styles.passwordToggle}
                icon={
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                }
              />
            </View>

            {/* Terms Agreement */}
            <View style={styles.termsContainer}>
              <CustomButton
                title=""
                onPress={() => updateField('agreeToTerms', !formData.agreeToTerms)}
                variant="ghost"
                size="small"
                style={styles.checkbox}
                icon={
                  <Ionicons
                    name={formData.agreeToTerms ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={formData.agreeToTerms ? theme.colors.success : theme.colors.textSecondary}
                  />
                }
              />
              <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
                I agree to the{' '}
                <Text style={{ color: theme.colors.primary }}>Terms & Conditions</Text>
                {' '}and{' '}
                <Text style={{ color: theme.colors.primary }}>Privacy Policy</Text>
              </Text>
            </View>

            <CustomButton
              title={t('createAccount')}
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />

            <View style={styles.loginPrompt}>
              <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>
                {t('alreadyHaveAccount')}
              </Text>
              <CustomButton
                title={t('login')}
                onPress={() => navigation.navigate('Login')}
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  formContainer: {
    marginHorizontal: 0,
  },
  form: {
    padding: 24,
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
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  strengthBar: {
    flex: 1,
    flexDirection: 'row',
    height: 4,
    marginRight: 12,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthSegment: {
    flex: 1,
    marginRight: 2,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 60,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    padding: 4,
    marginRight: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  registerButton: {
    marginBottom: 24,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    marginRight: 4,
  },
});