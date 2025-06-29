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
import { TestTube, Wifi, Database, User, Shield, CircleCheck as CheckCircle, Circle as XCircle, RefreshCw, Play, Eye, Settings, Lock, AlertTriangle } from 'lucide-react-native';
import { supabase, testSupabaseConnection } from '@/lib/supabase';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending' | 'warning';
  message: string;
  details?: any;
  troubleshooting?: string[];
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

  // Enhanced API Health Check
  const testApiHealth = async () => {
    addTestResult({ name: 'API Health Check', status: 'pending', message: 'Testando saúde da API...' });
    
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (response.ok) {
        addTestResult({
          name: 'API Health Check',
          status: 'success',
          message: 'API está funcionando corretamente',
          details: data
        });
      } else {
        addTestResult({
          name: 'API Health Check',
          status: 'error',
          message: 'API retornou erro',
          details: data,
          troubleshooting: [
            'Verifique se o servidor está rodando',
            'Confirme as configurações de rede',
            'Verifique os logs do servidor'
          ]
        });
      }
    } catch (error) {
      addTestResult({
        name: 'API Health Check',
        status: 'error',
        message: 'Erro de conexão com API',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        troubleshooting: [
          'Verifique sua conexão com a internet',
          'Confirme se o servidor local está rodando',
          'Verifique configurações de firewall/proxy'
        ]
      });
    }
  };

  // Enhanced Connection Test
  const testConnection = async () => {
    addTestResult({ name: 'Test Connection', status: 'pending', message: 'Testando conexão com banco de dados...' });
    
    try {
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      
      if (response.ok) {
        addTestResult({
          name: 'Test Connection',
          status: 'success',
          message: 'Conexão com banco de dados funcionando',
          details: data
        });
      } else {
        addTestResult({
          name: 'Test Connection',
          status: 'error',
          message: 'Erro no teste de conexão com banco',
          details: data,
          troubleshooting: [
            'Verifique EXPO_PUBLIC_SUPABASE_URL no .env',
            'Verifique SUPABASE_SERVICE_ROLE_KEY no .env',
            'Confirme se o projeto Supabase está ativo',
            'Teste conectividade de rede'
          ]
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Test Connection',
        status: 'error',
        message: 'Falha crítica no teste de conexão',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        troubleshooting: [
          'Problema de rede ou configuração',
          'Verifique arquivo .env existe e está configurado',
          'Confirme URL e chaves do Supabase',
          'Teste conectividade manual'
        ]
      });
    }
  };

  // Enhanced Supabase Direct Connection Test
  const testSupabaseDirect = async () => {
    addTestResult({ name: 'Supabase Direct', status: 'pending', message: 'Testando conexão direta com Supabase...' });
    
    try {
      const result = await testSupabaseConnection();
      
      if (result.success) {
        addTestResult({
          name: 'Supabase Direct',
          status: 'success',
          message: `Conexão direta funcionando (${result.duration}ms)`,
          details: result
        });
      } else {
        addTestResult({
          name: 'Supabase Direct',
          status: 'error',
          message: 'Erro na conexão direta com Supabase',
          details: result,
          troubleshooting: [
            'Verifique as credenciais do Supabase',
            'Confirme se o projeto está ativo',
            'Teste conectividade de rede',
            'Verifique configurações de RLS'
          ]
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Supabase Direct',
        status: 'error',
        message: 'Falha crítica na conexão direta',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        troubleshooting: [
          'Erro de configuração ou rede',
          'Verifique variáveis de ambiente',
          'Confirme status do projeto Supabase',
          'Teste conectividade manual'
        ]
      });
    }
  };

  // Enhanced Authentication Test
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
          details: error.message,
          troubleshooting: [
            'Verifique se o email está correto',
            'Confirme se a senha está correta',
            'Verifique se o usuário existe',
            'Confirme configurações de auth no Supabase'
          ]
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
        message: 'Falha crítica na autenticação',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        troubleshooting: [
          'Problema de conectividade',
          'Verifique configuração do Supabase',
          'Confirme se auth está habilitado'
        ]
      });
    }
  };

  // Enhanced Auth Token Validation
  const testAuthToken = async () => {
    addTestResult({ name: 'Auth Token Validation', status: 'pending', message: 'Testando validação de token...' });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        addTestResult({
          name: 'Auth Token Validation',
          status: 'warning',
          message: 'Usuário não autenticado',
          details: 'Faça login primeiro para testar validação de token',
          troubleshooting: [
            'Execute o teste de autenticação primeiro',
            'Faça login na aplicação',
            'Verifique se a sessão não expirou'
          ]
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
          details: data,
          troubleshooting: [
            'Token pode ter expirado',
            'Faça login novamente',
            'Verifique configurações de JWT no Supabase'
          ]
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Auth Token Validation',
        status: 'error',
        message: 'Falha na validação do token',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        troubleshooting: [
          'Problema de conectividade',
          'Erro na API de validação',
          'Verifique logs do servidor'
        ]
      });
    }
  };

  // Enhanced Characters API Test
  const testCharactersApi = async () => {
    addTestResult({ name: 'Characters API', status: 'pending', message: 'Testando API de personagens...' });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        addTestResult({
          name: 'Characters API',
          status: 'warning',
          message: 'Usuário não autenticado',
          details: 'Faça login primeiro para testar API de personagens',
          troubleshooting: [
            'Execute o teste de autenticação primeiro',
            'Faça login na aplicação'
          ]
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
          details: data,
          troubleshooting: data.troubleshooting || [
            'Verifique conexão com banco de dados',
            'Confirme configurações do Supabase',
            'Verifique permissões RLS'
          ]
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Characters API',
        status: 'error',
        message: 'Falha crítica na API de personagens',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        troubleshooting: [
          'Problema de conectividade severo',
          'Verifique se o servidor está rodando',
          'Confirme configurações de rede'
        ]
      });
    }
  };

  // Enhanced Share Token Test
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
          details: data,
          troubleshooting: [
            'Verifique se o token está correto',
            'Confirme se o token não expirou',
            'Verifique se o personagem ainda existe'
          ]
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Share Token',
        status: 'error',
        message: 'Falha no teste de token',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        troubleshooting: [
          'Problema de conectividade',
          'Erro na API de compartilhamento',
          'Verifique configurações do servidor'
        ]
      });
    }
  };

  // Enhanced Network Diagnostics Test
  const testNetworkDiagnostics = async () => {
    addTestResult({ name: 'Network Diagnostics', status: 'pending', message: 'Executando diagnósticos de rede...' });
    
    try {
      // Test 1: Basic connectivity
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        addTestResult({
          name: 'Network Diagnostics',
          status: 'error',
          message: 'URL do Supabase não configurada',
          troubleshooting: [
            'Verifique EXPO_PUBLIC_SUPABASE_URL no arquivo .env',
            'Confirme se o arquivo .env existe',
            'Reinicie o servidor após alterar .env'
          ]
        });
        return;
      }

      // Test 2: DNS Resolution
      const startTime = Date.now();
      const response = await fetch(supabaseUrl + '/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      });
      const endTime = Date.now();
      const latency = endTime - startTime;

      if (response.ok || response.status === 401) { // 401 is expected without proper auth
        addTestResult({
          name: 'Network Diagnostics',
          status: 'success',
          message: `Conectividade de rede OK (${latency}ms)`,
          details: {
            url: supabaseUrl,
            status: response.status,
            latency: `${latency}ms`,
            headers: Object.fromEntries(response.headers.entries())
          }
        });
      } else {
        addTestResult({
          name: 'Network Diagnostics',
          status: 'error',
          message: `Problema de conectividade (Status: ${response.status})`,
          details: {
            status: response.status,
            statusText: response.statusText,
            latency: `${latency}ms`
          },
          troubleshooting: [
            'Verifique sua conexão com a internet',
            'Confirme se o projeto Supabase está ativo',
            'Verifique configurações de firewall/proxy',
            'Teste em uma rede diferente'
          ]
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Network Diagnostics',
        status: 'error',
        message: 'Falha crítica nos diagnósticos de rede',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        troubleshooting: [
          'Problema severo de conectividade',
          'Verifique sua conexão com a internet',
          'Confirme configurações de DNS',
          'Teste em uma rede diferente',
          'Verifique configurações de proxy/VPN'
        ]
      });
    }
  };

  // Enhanced Run All Tests
  const runAllTests = async () => {
    setLoading(true);
    clearResults();
    
    // Add network diagnostics first
    await testNetworkDiagnostics();
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
      case 'warning':
        return <AlertTriangle size={20} color="#F39C12" />;
      case 'pending':
        return <RefreshCw size={20} color="#3498DB" />;
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
      case 'warning':
        return '#F39C12';
      case 'pending':
        return '#3498DB';
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
          Diagnósticos avançados e testes de funcionalidade
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Tests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testes Rápidos</Text>
          
          <View style={styles.buttonGrid}>
            <TouchableOpacity style={styles.testButton} onPress={testNetworkDiagnostics}>
              <Wifi size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Rede</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.testButton} onPress={testApiHealth}>
              <Settings size={20} color="#FFFFFF" />
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
              {loading ? 'Executando Diagnósticos...' : 'Executar Todos os Testes'}
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

                {result.troubleshooting && result.troubleshooting.length > 0 && (
                  <View style={styles.troubleshootingContainer}>
                    <Text style={styles.troubleshootingTitle}>💡 Soluções:</Text>
                    {result.troubleshooting.map((tip, tipIndex) => (
                      <Text key={tipIndex} style={styles.troubleshootingItem}>
                        • {tip}
                      </Text>
                    ))}
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
                  : '❌ Não configurado'
              }
            </Text>
            <Text style={styles.envItem}>
              <Text style={styles.envLabel}>Service Key:</Text> {
                process.env.SUPABASE_SERVICE_ROLE_KEY 
                  ? '✅ Configurado'
                  : '❌ Não configurado'
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
    minWidth: '30%',
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
    marginBottom: 8,
  },
  resultDetailsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  troubleshootingContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F39C12',
  },
  troubleshootingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E67E22',
    marginBottom: 4,
  },
  troubleshootingItem: {
    fontSize: 12,
    color: '#8E6A00',
    marginLeft: 8,
    marginBottom: 2,
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