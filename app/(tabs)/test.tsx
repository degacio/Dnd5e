import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { TestTube, Wifi, Database, User, Shield, CircleCheck as CheckCircle, Circle as XCircle, RefreshCw, Play, Eye, Settings, Lock } from 'lucide-react-native';
import { supabase, testSupabaseConnection } from '@/lib/supabase';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: any;
}

export default function TestTab() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [shareToken, setShareToken] = useState('');

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: API Health Check
  const testApiHealth = async () => {
    addTestResult({ name: 'API Health Check', status: 'pending', message: 'Testando...' });
    
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (response.ok) {
        addTestResult({
          name: 'API Health Check',
          status: 'success',
          message: 'API está funcionando',
          details: data
        });
      } else {
        addTestResult({
          name: 'API Health Check',
          status: 'error',
          message: 'API retornou erro',
          details: data
        });
      }
    } catch (error) {
      addTestResult({
        name: 'API Health Check',
        status: 'error',
        message: 'Erro de conexão com API',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  // Test 2: Connection Test
  const testConnection = async () => {
    addTestResult({ name: 'Test Connection', status: 'pending', message: 'Testando conexão...' });
    
    try {
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      
      if (response.ok) {
        addTestResult({
          name: 'Test Connection',
          status: 'success',
          message: 'Conexão testada com sucesso',
          details: data
        });
      } else {
        addTestResult({
          name: 'Test Connection',
          status: 'error',
          message: 'Erro no teste de conexão',
          details: data
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Test Connection',
        status: 'error',
        message: 'Falha no teste de conexão',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  // Test 3: Supabase Direct Connection
  const testSupabaseDirect = async () => {
    addTestResult({ name: 'Supabase Direct', status: 'pending', message: 'Testando Supabase...' });
    
    try {
      const result = await testSupabaseConnection();
      
      if (result.success) {
        addTestResult({
          name: 'Supabase Direct',
          status: 'success',
          message: 'Conexão direta com Supabase funcionando',
          details: result
        });
      } else {
        addTestResult({
          name: 'Supabase Direct',
          status: 'error',
          message: 'Erro na conexão direta com Supabase',
          details: result
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Supabase Direct',
        status: 'error',
        message: 'Falha na conexão direta',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  // Test 4: Authentication Test
  const testAuthentication = async () => {
    if (!testEmail || !testPassword) {
      Alert.alert('Erro', 'Por favor, preencha email e senha para testar autenticação');
      return;
    }

    addTestResult({ name: 'Authentication', status: 'pending', message: 'Testando autenticação...' });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail.trim(),
        password: testPassword,
      });

      if (error) {
        addTestResult({
          name: 'Authentication',
          status: 'error',
          message: 'Erro de autenticação',
          details: error.message
        });
      } else {
        addTestResult({
          name: 'Authentication',
          status: 'success',
          message: 'Autenticação bem-sucedida',
          details: {
            userId: data.user?.id,
            email: data.user?.email,
            hasSession: !!data.session
          }
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Authentication',
        status: 'error',
        message: 'Falha na autenticação',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  // Test 5: Auth Token Validation
  const testAuthToken = async () => {
    addTestResult({ name: 'Auth Token Validation', status: 'pending', message: 'Testando validação de token...' });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        addTestResult({
          name: 'Auth Token Validation',
          status: 'error',
          message: 'Usuário não autenticado',
          details: 'Faça login primeiro'
        });
        return;
      }

      const response = await fetch('/api/test-auth', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.authenticated) {
        addTestResult({
          name: 'Auth Token Validation',
          status: 'success',
          message: 'Token de autenticação válido',
          details: data
        });
      } else {
        addTestResult({
          name: 'Auth Token Validation',
          status: 'error',
          message: 'Token de autenticação inválido',
          details: data
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Auth Token Validation',
        status: 'error',
        message: 'Falha na validação do token',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  // Test 6: Characters API Test
  const testCharactersApi = async () => {
    addTestResult({ name: 'Characters API', status: 'pending', message: 'Testando API de personagens...' });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        addTestResult({
          name: 'Characters API',
          status: 'error',
          message: 'Usuário não autenticado',
          details: 'Faça login primeiro'
        });
        return;
      }

      const response = await fetch('/api/characters', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        addTestResult({
          name: 'Characters API',
          status: 'success',
          message: `API de personagens funcionando (${Array.isArray(data) ? data.length : 0} personagens)`,
          details: data
        });
      } else {
        addTestResult({
          name: 'Characters API',
          status: 'error',
          message: 'Erro na API de personagens',
          details: data
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Characters API',
        status: 'error',
        message: 'Falha na API de personagens',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  // Test 7: Share Token Test
  const testShareToken = async () => {
    if (!shareToken.trim()) {
      Alert.alert('Erro', 'Por favor, insira um token de compartilhamento para testar');
      return;
    }

    addTestResult({ name: 'Share Token', status: 'pending', message: 'Testando token de compartilhamento...' });
    
    try {
      const response = await fetch(`/api/share/${shareToken.trim()}`);
      const data = await response.json();

      if (response.ok) {
        addTestResult({
          name: 'Share Token',
          status: 'success',
          message: 'Token de compartilhamento válido',
          details: {
            characterName: data.name,
            characterClass: data.class_name,
            level: data.level
          }
        });
      } else {
        addTestResult({
          name: 'Share Token',
          status: 'error',
          message: 'Token inválido ou expirado',
          details: data
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Share Token',
        status: 'error',
        message: 'Falha no teste de token',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  // Run All Tests
  const runAllTests = async () => {
    setLoading(true);
    clearResults();
    
    await testApiHealth();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testConnection();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testSupabaseDirect();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testAuthToken();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testCharactersApi();
    
    setLoading(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color="#27AE60" />;
      case 'error':
        return <XCircle size={20} color="#E74C3C" />;
      case 'pending':
        return <RefreshCw size={20} color="#F39C12" />;
      default:
        return <TestTube size={20} color="#666" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '#27AE60';
      case 'error':
        return '#E74C3C';
      case 'pending':
        return '#F39C12';
      default:
        return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <TestTube size={28} color="#D4AF37" />
          <Text style={styles.title}>Campo de Teste</Text>
        </View>
        <Text style={styles.subtitle}>
          Teste todas as funcionalidades do app
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Tests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testes Rápidos</Text>
          
          <View style={styles.buttonGrid}>
            <TouchableOpacity style={styles.testButton} onPress={testApiHealth}>
              <Wifi size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>API Health</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.testButton} onPress={testConnection}>
              <Database size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Conexão</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.testButton} onPress={testSupabaseDirect}>
              <Shield size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Supabase</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.testButton} onPress={testAuthToken}>
              <Lock size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Auth Token</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.testButton} onPress={testCharactersApi}>
              <User size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Characters</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.runAllButton, loading && styles.runAllButtonDisabled]} 
            onPress={runAllTests}
            disabled={loading}
          >
            <Play size={20} color="#FFFFFF" />
            <Text style={styles.runAllButtonText}>
              {loading ? 'Executando Testes...' : 'Executar Todos os Testes'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Authentication Test Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teste de Autenticação</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email de Teste</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Digite um email para testar"
              value={testEmail}
              onChangeText={setTestEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha de Teste</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Digite uma senha para testar"
              value={testPassword}
              onChangeText={setTestPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.authTestButton} onPress={testAuthentication}>
            <User size={20} color="#FFFFFF" />
            <Text style={styles.authTestButtonText}>Testar Autenticação</Text>
          </TouchableOpacity>
        </View>

        {/* Share Token Test Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teste de Token de Compartilhamento</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Token de Compartilhamento</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Cole um token de compartilhamento aqui"
              value={shareToken}
              onChangeText={setShareToken}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.shareTestButton} onPress={testShareToken}>
            <Eye size={20} color="#FFFFFF" />
            <Text style={styles.shareTestButtonText}>Testar Token</Text>
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {testResults.length > 0 && (
          <View style={styles.section}>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>Resultados dos Testes</Text>
              <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
                <Text style={styles.clearButtonText}>Limpar</Text>
              </TouchableOpacity>
            </View>

            {testResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  {getStatusIcon(result.status)}
                  <Text style={styles.resultName}>{result.name}</Text>
                </View>
                
                <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
                  {result.message}
                </Text>
                
                {result.details && (
                  <View style={styles.resultDetails}>
                    <Text style={styles.resultDetailsText}>
                      {typeof result.details === 'string' 
                        ? result.details 
                        : JSON.stringify(result.details, null, 2)
                      }
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Environment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Ambiente</Text>
          
          <View style={styles.envInfo}>
            <Text style={styles.envItem}>
              <Text style={styles.envLabel}>Plataforma:</Text> {Platform.OS}
            </Text>
            <Text style={styles.envItem}>
              <Text style={styles.envLabel}>Timestamp:</Text> {new Date().toLocaleString()}
            </Text>
            <Text style={styles.envItem}>
              <Text style={styles.envLabel}>URL Supabase:</Text> {
                process.env.EXPO_PUBLIC_SUPABASE_URL 
                  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL.substring(0, 30)}...`
                  : 'Não configurado'
              }
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498DB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    flex: 1,
    minWidth: '45%',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  runAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27AE60',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  runAllButtonDisabled: {
    backgroundColor: '#95A5A6',
  },
  runAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  authTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E44AD',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  authTestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shareTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E67E22',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  shareTestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  resultItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  resultDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  resultDetailsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  envInfo: {
    gap: 8,
  },
  envItem: {
    fontSize: 14,
    color: '#666',
  },
  envLabel: {
    fontWeight: '600',
    color: '#333',
  },
});