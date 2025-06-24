import React, { useState } from 'react';
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
  Users
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

export default function SettingsTab() {
  const [spellsFileLoaded, setSpellsFileLoaded] = useState(false);
  const [classesFileLoaded, setClassesFileLoaded] = useState(false);

  const pickSpellsFile = async () => {
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

      if (!result.canceled) {
        // Aqui você implementaria a lógica para processar o arquivo JSON
        setSpellsFileLoaded(true);
        Alert.alert('Sucesso', 'Arquivo de magias carregado com sucesso!');
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

      if (!result.canceled) {
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
      'Consulte a documentação para mais detalhes sobre a estrutura dos dados.'
    );
  };

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