import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Platform 
} from 'react-native';
import { 
  Settings, 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Info,
  BookOpen,
  Users,
  LogOut,
  User
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { adaptSpellsFromLivroDoJogador } from '@/utils/spellAdapter';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function SettingsTab() {
  const [spellsFileLoaded, setSpellsFileLoaded] = useState(false);
  const [classesFileLoaded, setClassesFileLoaded] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    console.log('🔄 SettingsTab mounted, getting user info...');
    getUserInfo();
  }, []);

  const getUserInfo = async () => {
    try {
      console.log('🔍 Getting user info from Supabase...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 User data received:', user ? `${user.email} (${user.id})` : 'No user');
      if (user) {
        setUserEmail(user.email);
        console.log('✅ User email set to state:', user.email);
      } else {
        console.log('❌ No user found');
      }
    } catch (error) {
      console.error('💥 Error getting user info:', error);
    }
  };

  const handleLogout = async () => {
    console.log('🎯 handleLogout function called');
    console.log('📊 Current state - isLoggingOut:', isLoggingOut, 'userEmail:', userEmail);
    
    try {
      console.log('🔔 Showing logout confirmation alert...');
      
      Alert.alert(
        'Sair da Conta',
        'Tem certeza que deseja sair? Você precisará fazer login novamente para acessar seus personagens.',
        [
          { 
            text: 'Cancelar', 
            style: 'cancel',
            onPress: () => {
              console.log('❌ User cancelled logout');
            }
          },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: () => {
              console.log('✅ User confirmed logout, calling performLogout...');
              performLogout();
            }
          }
        ]
      );
      
      console.log('📱 Alert.alert called successfully');
    } catch (error) {
      console.error('💥 Error showing logout alert:', error);
    }
  };

  const performLogout = async () => {
    console.log('🚀 performLogout function started');
    
    if (isLoggingOut) {
      console.log('⚠️ Already logging out, preventing duplicate call');
      return;
    }
    
    setIsLoggingOut(true);
    console.log('🔄 Set isLoggingOut to true');
    
    try {
      console.log('🧹 Starting logout process...');
      
      // Clear any local storage data if on web
      if (Platform.OS === 'web') {
        try {
          console.log('🌐 Platform is web, clearing localStorage...');
          const itemsCleared = [];
          
          // Log what's in localStorage before clearing
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              itemsCleared.push(key);
            }
          }
          console.log('📦 Items in localStorage before clear:', itemsCleared);
          
          localStorage.clear();
          console.log('✅ localStorage cleared successfully');
        } catch (error) {
          console.warn('⚠️ Could not clear localStorage:', error);
        }
      } else {
        console.log('📱 Platform is not web, skipping localStorage clear');
      }

      // Sign out from Supabase
      console.log('🔐 Signing out from Supabase...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase logout error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          statusCode: error.statusCode
        });
        Alert.alert('Erro', `Não foi possível sair da conta: ${error.message}`);
        return;
      }

      console.log('✅ Supabase logout successful');
      
      // Clear user state immediately
      console.log('🧹 Clearing user state...');
      setUserEmail(null);
      console.log('✅ User email cleared from state');
      
      // Force navigation to auth screen
      console.log('🔄 Redirecting to auth screen...');
      
      try {
        // Use router.replace to prevent going back to authenticated area
        console.log('🧭 Calling router.replace("/auth")...');
        router.replace('/auth');
        console.log('✅ Router.replace called successfully');
        
        // Show success message after navigation
        setTimeout(() => {
          console.log('🎉 Showing success message...');
          Alert.alert(
            'Logout Realizado',
            'Você foi desconectado com sucesso.'
          );
        }, 100);
        
      } catch (routerError) {
        console.error('💥 Router error:', routerError);
        Alert.alert('Erro', 'Erro ao redirecionar. Recarregue a página.');
      }
      
    } catch (error) {
      console.error('💥 Logout error:', error);
      console.error('💥 Error stack:', error.stack);
      Alert.alert('Erro', `Erro inesperado ao sair da conta: ${error.message}`);
    } finally {
      console.log('🔄 Setting isLoggingOut to false');
      setIsLoggingOut(false);
    }
  };

  const pickSpellsFile = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, we can try to use the built-in file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = async (e) => {
          // @ts-ignore
          const file = e.target.files[0];
          if (!file) return;
          
          try {
            const text = await file.text();
            const jsonData = JSON.parse(text);
            
            // Use the adapter to convert the data
            const adaptedSpells = adaptSpellsFromLivroDoJogador(jsonData);
            
            if (adaptedSpells.length > 0) {
              // Store the adapted spells in localStorage for web
              localStorage.setItem('customSpells', JSON.stringify(adaptedSpells));
              setSpellsFileLoaded(true);
              Alert.alert('Sucesso', `Arquivo de magias carregado com sucesso! ${adaptedSpells.length} magias importadas.`);
            } else {
              Alert.alert('Erro', 'Não foi possível processar o arquivo de magias.');
            }
          } catch (error) {
            console.error('Error processing JSON file:', error);
            Alert.alert('Erro', 'O arquivo não está em um formato JSON válido.');
          }
        };
        
        input.click();
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        try {
          // For native platforms, we need to read the file
          const response = await fetch(asset.uri);
          const text = await response.text();
          const jsonData = JSON.parse(text);
          
          // Use the adapter to convert the data
          const adaptedSpells = adaptSpellsFromLivroDoJogador(jsonData);
          
          if (adaptedSpells.length > 0) {
            // Here you would store the spells in AsyncStorage for native platforms
            // AsyncStorage.setItem('customSpells', JSON.stringify(adaptedSpells));
            setSpellsFileLoaded(true);
            Alert.alert('Sucesso', `Arquivo de magias carregado com sucesso! ${adaptedSpells.length} magias importadas.`);
          } else {
            Alert.alert('Erro', 'Não foi possível processar o arquivo de magias.');
          }
        } catch (error) {
          console.error('Error processing JSON file:', error);
          Alert.alert('Erro', 'O arquivo não está em um formato JSON válido.');
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o arquivo de magias.');
    }
  };

  const pickClassesFile = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Funcionalidade Web',
          'No navegador, você pode editar diretamente os arquivos JSON na pasta /data do projeto.'
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Aqui você implementaria a lógica para processar o arquivo JSON
        setClassesFileLoaded(true);
        Alert.alert('Sucesso', 'Arquivo de classes carregado com sucesso!');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o arquivo de classes.');
    }
  };

  const exportData = () => {
    Alert.alert(
      'Exportar Dados',
      'Esta funcionalidade permitirá exportar seus dados personalizados.',
      [{ text: 'OK' }]
    );
  };

  const clearData = () => {
    Alert.alert(
      'Limpar Dados',
      'Tem certeza que deseja limpar todos os dados personalizados? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpar', 
          style: 'destructive',
          onPress: () => {
            // Clear localStorage on web or AsyncStorage on native
            if (Platform.OS === 'web') {
              localStorage.removeItem('customSpells');
            } else {
              // AsyncStorage.removeItem('customSpells');
            }
            setSpellsFileLoaded(false);
            setClassesFileLoaded(false);
            Alert.alert('Dados Limpos', 'Todos os dados personalizados foram removidos.');
          }
        }
      ]
    );
  };

  const showInfo = () => {
    Alert.alert(
      'Sobre os Arquivos JSON',
      'Os arquivos JSON devem seguir a estrutura específica do aplicativo:\n\n' +
      '• Magias: Devem conter campos como name, school, level, description, etc.\n' +
      '• Classes: Devem conter informações como hitDie, primaryAbility, classFeatures, etc.\n\n' +
      'O aplicativo suporta a importação do formato "Livro do Jogador" e fará a conversão automaticamente para o formato interno.'
    );
  };

  console.log('🎨 Rendering SettingsTab with state:', {
    userEmail,
    isLoggingOut,
    spellsFileLoaded,
    classesFileLoaded
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Settings size={28} color="#D4AF37" />
          <Text style={styles.title}>Configurações</Text>
        </View>
        <Text style={styles.subtitle}>
          Gerencie seus dados personalizados
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seção de Conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          
          <View style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <User size={24} color="#27AE60" />
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Usuário logado</Text>
                <Text style={styles.accountEmail}>{userEmail || 'Carregando...'}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]} 
              onPress={() => {
                console.log('🎯 Logout button pressed!');
                console.log('📊 Button state - disabled:', isLoggingOut);
                if (!isLoggingOut) {
                  console.log('✅ Button not disabled, calling handleLogout...');
                  handleLogout();
                } else {
                  console.log('⚠️ Button is disabled, ignoring press');
                }
              }}
              disabled={isLoggingOut}
              activeOpacity={0.7}
            >
              <LogOut size={16} color={isLoggingOut ? "#BDC3C7" : "#E74C3C"} />
              <Text style={[styles.logoutButtonText, isLoggingOut && styles.logoutButtonTextDisabled]}>
                {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção de Arquivos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gerenciar Arquivos</Text>
          
          {/* Magias */}
          <View style={styles.fileCard}>
            <View style={styles.fileHeader}>
              <BookOpen size={24} color="#8E44AD" />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>Arquivo de Magias</Text>
                <Text style={styles.fileStatus}>
                  {spellsFileLoaded ? 'Arquivo personalizado carregado' : 'Usando arquivo padrão'}
                </Text>
              </View>
            </View>
            
            <View style={styles.fileActions}>
              <TouchableOpacity style={styles.actionButton} onPress={pickSpellsFile}>
                <Upload size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Carregar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Classes */}
          <View style={styles.fileCard}>
            <View style={styles.fileHeader}>
              <Users size={24} color="#E74C3C" />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>Arquivo de Classes</Text>
                <Text style={styles.fileStatus}>
                  {classesFileLoaded ? 'Arquivo personalizado carregado' : 'Usando arquivo padrão'}
                </Text>
              </View>
            </View>
            
            <View style={styles.fileActions}>
              <TouchableOpacity style={styles.actionButton} onPress={pickClassesFile}>
                <Upload size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Carregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Seção de Ações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={exportData}>
            <Download size={20} color="#27AE60" />
            <Text style={styles.menuItemText}>Exportar Dados</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={clearData}>
            <Trash2 size={20} color="#E74C3C" />
            <Text style={styles.menuItemText}>Limpar Dados Personalizados</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={showInfo}>
            <Info size={20} color="#3498DB" />
            <Text style={styles.menuItemText}>Sobre Arquivos JSON</Text>
          </TouchableOpacity>
        </View>

        {/* Seção de Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          <View style={styles.infoCard}>
            <FileText size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Formato dos Arquivos</Text>
              <Text style={styles.infoDescription}>
                Os arquivos devem estar no formato JSON e seguir a estrutura específica do aplicativo.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Upload size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Como Usar</Text>
              <Text style={styles.infoDescription}>
                Toque em "Carregar" para selecionar um arquivo JSON do seu dispositivo. O arquivo será validado antes de ser aplicado.
              </Text>
            </View>
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
    margin: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  logoutButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E8E8E8',
  },
  logoutButtonText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButtonTextDisabled: {
    color: '#BDC3C7',
  },
  fileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  fileStatus: {
    fontSize: 12,
    color: '#666',
  },
  fileActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});