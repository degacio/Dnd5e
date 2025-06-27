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
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, LogIn, Eye, EyeOff, Mail, Lock, Shield } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Starting login process for:', email.trim());
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert(
            'Credenciais Inválidas', 
            'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
          );
        } else if (error.message.includes('Email not confirmed')) {
          Alert.alert(
            'Email não confirmado',
            'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.'
          );
        } else {
          Alert.alert('Erro de Login', error.message);
        }
        return;
      }

      if (data.user && data.session) {
        console.log('✅ Login successful for:', data.user.email);
        
        // Show success message and redirect
        Alert.alert(
          'Login Realizado com Sucesso!',
          `Bem-vindo(a) de volta, ${data.user.email}!`,
          [
            {
              text: 'Continuar',
              onPress: () => {
                console.log('🔄 Redirecting to main app...');
                // Use replace to prevent going back to login screen
                router.replace('/(tabs)');
              },
            },
          ]
        );
      } else {
        console.error('❌ Login failed: No user or session returned');
        Alert.alert('Erro', 'Falha no login. Tente novamente.');
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      Alert.alert('Erro', 'Erro inesperado durante o login. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert(
        'Email necessário',
        'Por favor, digite seu email no campo acima e tente novamente.'
      );
      return;
    }

    Alert.alert(
      'Redefinir Senha',
      `Enviar email de redefinição de senha para ${email.trim()}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
              if (error) {
                Alert.alert('Erro', error.message);
              } else {
                Alert.alert(
                  'Email Enviado',
                  'Verifique sua caixa de entrada para redefinir sua senha.'
                );
              }
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível enviar o email de redefinição.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <ArrowLeft size={24} color="#333" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Shield size={32} color="#D4AF37" />
              </View>
              <Text style={styles.title}>Entrar</Text>
              <Text style={styles.subtitle}>
                Acesse sua conta para gerenciar seus personagens
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  placeholder="Senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={[styles.forgotPasswordText, loading && styles.forgotPasswordTextDisabled]}>
                Esqueceu sua senha?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <Text style={styles.loginButtonText}>Entrando...</Text>
              ) : (
                <>
                  <LogIn size={20} color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>Entrar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem uma conta?</Text>
            <TouchableOpacity onPress={navigateToRegister} disabled={loading}>
              <Text style={[styles.footerLink, loading && styles.footerLinkDisabled]}>
                Criar conta
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
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 24,
    marginBottom: 40,
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
  passwordInput: {
    paddingRight: 12,
  },
  eyeButton: {
    padding: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '500',
  },
  forgotPasswordTextDisabled: {
    color: '#BDC3C7',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 8,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  footerLink: {
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '600',
  },
  footerLinkDisabled: {
    color: '#BDC3C7',
  },
});