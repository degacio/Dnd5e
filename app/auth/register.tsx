import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, UserPlus, Eye, EyeOff, Mail, Lock, User, CircleCheck as CheckCircle } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      const message = 'Por favor, preencha todos os campos.';
      if (Platform.OS === 'web') {
        alert(`Erro: ${message}`);
      } else {
        Alert.alert('Erro', message);
      }
      return false;
    }

    if (password !== confirmPassword) {
      const message = 'As senhas não coincidem.';
      if (Platform.OS === 'web') {
        alert(`Erro: ${message}`);
      } else {
        Alert.alert('Erro', message);
      }
      return false;
    }

    if (password.length < 6) {
      const message = 'A senha deve ter pelo menos 6 caracteres.';
      if (Platform.OS === 'web') {
        alert(`Erro: ${message}`);
      } else {
        Alert.alert('Erro', message);
      }
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      const message = 'Por favor, insira um email válido.';
      if (Platform.OS === 'web') {
        alert(`Erro: ${message}`);
      } else {
        Alert.alert('Erro', message);
      }
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    console.log('🔄 Starting registration process...');
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    setLoading(true);
    console.log('🔄 Setting loading state to true');
    
    try {
      console.log('📤 Attempting Supabase registration for:', email.trim());
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      console.log('📥 Registration response received');
      console.log('📊 Registration data:', data ? 'Data received' : 'No data');
      console.log('📊 Registration error:', error ? error.message : 'No error');

      if (error) {
        console.error('❌ Registration error:', error);
        
        let errorMessage = 'Erro de cadastro desconhecido.';
        
        // Handle specific error cases
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          console.log('🔄 Email already registered, offering login option...');
          
          const confirmLogin = () => {
            console.log('🔄 User chose to login, navigating to login screen...');
            router.push('/auth/login');
          };
          
          if (Platform.OS === 'web') {
            if (confirm('Email já cadastrado: Este email já está cadastrado. Você gostaria de fazer login?')) {
              confirmLogin();
            }
          } else {
            Alert.alert(
              'Email já cadastrado', 
              'Este email já está cadastrado. Você gostaria de fazer login?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { 
                  text: 'Fazer Login', 
                  onPress: confirmLogin
                }
              ]
            );
          }
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
          if (Platform.OS === 'web') {
            alert(`Erro de Cadastro: ${errorMessage}`);
          } else {
            Alert.alert('Erro de Cadastro', errorMessage);
          }
        } else {
          errorMessage = error.message;
          if (Platform.OS === 'web') {
            alert(`Erro de Cadastro: ${errorMessage}`);
          } else {
            Alert.alert('Erro de Cadastro', errorMessage);
          }
        }
        return;
      }

      if (data.user) {
        console.log('✅ Registration successful for:', data.user.email);
        console.log('📊 Registration details:', {
          userId: data.user.id,
          email: data.user.email,
          hasSession: !!data.session,
          emailConfirmed: data.user.email_confirmed_at ? 'Yes' : 'No'
        });
        
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // Check if user needs email confirmation
        if (data.user && !data.session) {
          console.log('📧 Email confirmation required');
          const message = 'Um email de confirmação foi enviado para sua caixa de entrada. Por favor, confirme seu email antes de fazer login.';
          
          const navigateToLogin = () => {
            console.log('🔄 Navigating to login after email confirmation notice...');
            router.push('/auth/login');
          };
          
          if (Platform.OS === 'web') {
            alert(`Confirme seu Email: ${message}`);
            navigateToLogin();
          } else {
            Alert.alert(
              'Confirme seu Email',
              message,
              [
                {
                  text: 'OK',
                  onPress: navigateToLogin
                }
              ]
            );
          }
        } else {
          // User is automatically signed in
          console.log('✅ User automatically signed in after registration');
          const successMessage = `Bem-vindo(a), ${data.user.email}! Sua conta foi criada e você já está logado.`;
          
          if (Platform.OS === 'web') {
            alert(`Cadastro Realizado com Sucesso! ${successMessage}`);
            console.log('🔄 Navigating to main app (web)...');
            router.replace('/(tabs)');
          } else {
            Alert.alert(
              'Cadastro Realizado com Sucesso!',
              successMessage,
              [
                {
                  text: 'Continuar',
                  onPress: () => {
                    console.log('🔄 Navigating to main app (mobile)...');
                    router.replace('/(tabs)');
                  },
                },
              ]
            );
          }
        }
      }
    } catch (error) {
      console.error('💥 Registration error:', error);
      console.error('💥 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = 'Erro inesperado durante o cadastro.';
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Tempo limite excedido. Tente novamente.';
      }
      
      if (Platform.OS === 'web') {
        alert(`Erro: ${errorMessage}`);
      } else {
        Alert.alert('Erro', errorMessage);
      }
    } finally {
      console.log('🔄 Setting loading state to false');
      setLoading(false);
    }
  };

  const goBack = () => {
    console.log('🔙 Going back to auth welcome screen');
    router.back();
  };

  const navigateToLogin = () => {
    console.log('🔄 Navigating to login screen');
    router.push('/auth/login');
  };

  const isSmallScreen = screenWidth < 768;
  const isVerySmallScreen = screenWidth < 480;

  console.log('🎨 Rendering RegisterScreen with state:', {
    email: email ? 'Has email' : 'No email',
    password: password ? 'Has password' : 'No password',
    confirmPassword: confirmPassword ? 'Has confirm password' : 'No confirm password',
    loading,
    showPassword,
    showConfirmPassword,
    screenWidth,
    isSmallScreen,
    isVerySmallScreen
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[styles.header, isVerySmallScreen && styles.headerCompact]}>
            <TouchableOpacity 
              style={[styles.backButton, loading && styles.disabledButton]} 
              onPress={goBack}
              disabled={loading}
            >
              <ArrowLeft size={isVerySmallScreen ? 20 : 24} color={loading ? "#95A5A6" : "#333"} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <View style={[styles.iconContainer, isVerySmallScreen && styles.iconContainerSmall]}>
                <UserPlus size={isVerySmallScreen ? 28 : 32} color="#27AE60" />
              </View>
              <Text style={[styles.title, isVerySmallScreen && styles.titleSmall]}>Criar Conta</Text>
              <Text style={[styles.subtitle, isVerySmallScreen && styles.subtitleSmall]}>
                Crie sua conta para salvar seus personagens na nuvem
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={[styles.form, isSmallScreen && styles.formCompact]}>
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, loading && styles.inputWrapperDisabled]}>
                <Mail size={isVerySmallScreen ? 18 : 20} color={loading ? "#BDC3C7" : "#666"} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, isVerySmallScreen && styles.textInputSmall]}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  placeholderTextColor={loading ? "#BDC3C7" : "#999"}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, loading && styles.inputWrapperDisabled]}>
                <Lock size={isVerySmallScreen ? 18 : 20} color={loading ? "#BDC3C7" : "#666"} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.passwordInput, isVerySmallScreen && styles.textInputSmall]}
                  placeholder="Senha (mínimo 6 caracteres)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  placeholderTextColor={loading ? "#BDC3C7" : "#999"}
                />
                <TouchableOpacity
                  style={[styles.eyeButton, loading && styles.disabledButton]}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={isVerySmallScreen ? 18 : 20} color={loading ? "#BDC3C7" : "#666"} />
                  ) : (
                    <Eye size={isVerySmallScreen ? 18 : 20} color={loading ? "#BDC3C7" : "#666"} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, loading && styles.inputWrapperDisabled]}>
                <Lock size={isVerySmallScreen ? 18 : 20} color={loading ? "#BDC3C7" : "#666"} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.passwordInput, isVerySmallScreen && styles.textInputSmall]}
                  placeholder="Confirmar senha"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  placeholderTextColor={loading ? "#BDC3C7" : "#999"}
                />
                <TouchableOpacity
                  style={[styles.eyeButton, loading && styles.disabledButton]}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={isVerySmallScreen ? 18 : 20} color={loading ? "#BDC3C7" : "#666"} />
                  ) : (
                    <Eye size={isVerySmallScreen ? 18 : 20} color={loading ? "#BDC3C7" : "#666"} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton, 
                loading && styles.registerButtonDisabled,
                isVerySmallScreen && styles.registerButtonCompact
              ]}
              onPress={() => {
                console.log('🎯 Register button pressed!');
                console.log('📊 Button state - loading:', loading);
                if (!loading) {
                  console.log('✅ Button not disabled, calling handleRegister...');
                  handleRegister();
                } else {
                  console.log('⚠️ Button is disabled, ignoring press');
                }
              }}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <Text style={[styles.registerButtonText, isVerySmallScreen && styles.registerButtonTextSmall]}>
                  Criando conta...
                </Text>
              ) : (
                <>
                  <UserPlus size={isVerySmallScreen ? 18 : 20} color="#FFFFFF" />
                  <Text style={[styles.registerButtonText, isVerySmallScreen && styles.registerButtonTextSmall]}>
                    Criar Conta
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={[styles.footer, isSmallScreen && styles.footerCompact]}>
            <Text style={[styles.footerText, isVerySmallScreen && styles.footerTextSmall]}>
              Já tem uma conta?
            </Text>
            <TouchableOpacity 
              onPress={navigateToLogin} 
              disabled={loading}
              style={loading && styles.disabledButton}
            >
              <Text style={[
                styles.footerLink, 
                loading && styles.footerLinkDisabled,
                isVerySmallScreen && styles.footerLinkSmall
              ]}>
                Entrar
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerCompact: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 24,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainerSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: 28,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
  },
  subtitleSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  formCompact: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 56,
  },
  inputWrapperDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 16,
  },
  textInputSmall: {
    fontSize: 14,
    paddingVertical: 12,
  },
  passwordInput: {
    paddingRight: 12,
  },
  eyeButton: {
    padding: 8,
    borderRadius: 6,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27AE60',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minHeight: 56,
  },
  registerButtonCompact: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
    minHeight: 48,
  },
  registerButtonDisabled: {
    backgroundColor: '#BDC3C7',
    elevation: 0,
    shadowOpacity: 0,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  registerButtonTextSmall: {
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 8,
  },
  footerCompact: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  footerTextSmall: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '600',
    padding: 4,
  },
  footerLinkSmall: {
    fontSize: 14,
  },
  footerLinkDisabled: {
    color: '#BDC3C7',
  },
});