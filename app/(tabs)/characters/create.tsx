import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { DnDClass } from '@/types/dndClass';
import { ArrowLeft, User, Shield, Heart, Zap, Save } from 'lucide-react-native';
import classesData from '@/data/classes.json';

interface FormData {
  name: string;
  class_name: string;
  level: number;
  hp_current: number;
  hp_max: number;
  spell_slots: Record<string, [number, number]>;
  spells_known: any[];
  character_data: Record<string, any>;
}

export default function CreateCharacterScreen() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    class_name: '',
    level: 1,
    hp_current: 1,
    hp_max: 1,
    spell_slots: {},
    spells_known: [],
    character_data: {},
  });
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<DnDClass | null>(null);

  // Função para calcular espaços de magia baseado na classe e nível
  const calculateSpellSlots = (characterClass: DnDClass, level: number): Record<string, [number, number]> => {
    const spellSlots: Record<string, [number, number]> = {};
    
    if (!characterClass.spellcasting) {
      return spellSlots;
    }

    // Usar o índice correto (level - 1) para acessar os arrays de progressão
    const levelIndex = level - 1;
    
    Object.entries(characterClass.spellcasting.spellSlots).forEach(([spellLevel, slotsArray]) => {
      const maxSlots = slotsArray[levelIndex] || 0;
      if (maxSlots > 0) {
        spellSlots[spellLevel] = [maxSlots, maxSlots]; // [current, max] - inicia com todos os slots disponíveis
      }
    });

    return spellSlots;
  };

  useEffect(() => {
    if (formData.class_name) {
      const dndClass = classesData.find(cls => cls.name === formData.class_name);
      setSelectedClass(dndClass || null);
      
      if (dndClass) {
        // Calculate HP based on class and level
        const hitDieValue = parseInt(dndClass.hitDie.replace('d', ''));
        const baseHP = hitDieValue + 2; // Assuming +2 CON modifier for simplicity
        const levelHP = baseHP + ((formData.level - 1) * (Math.floor(hitDieValue / 2) + 1 + 2));
        
        setFormData(prev => ({
          ...prev,
          hp_max: levelHP,
          hp_current: levelHP,
        }));

        // Set up spell slots if it's a spellcasting class
        if (dndClass.spellcasting) {
          const calculatedSlots = calculateSpellSlots(dndClass, formData.level);
          setFormData(prev => ({
            ...prev,
            spell_slots: calculatedSlots,
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            spell_slots: {},
          }));
        }
      }
    }
  }, [formData.class_name, formData.level]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      const message = 'Por favor, insira um nome para o personagem.';
      if (Platform.OS === 'web') {
        alert(`Erro: ${message}`);
      } else {
        Alert.alert('Erro', message);
      }
      return;
    }

    if (!formData.class_name) {
      const message = 'Por favor, selecione uma classe para o personagem.';
      if (Platform.OS === 'web') {
        alert(`Erro: ${message}`);
      } else {
        Alert.alert('Erro', message);
      }
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const message = 'Você precisa estar autenticado.';
        if (Platform.OS === 'web') {
          alert(`Erro: ${message}`);
        } else {
          Alert.alert('Erro', message);
        }
        return;
      }

      console.log('🚀 Criando personagem:', formData.name);

      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          user_id: session.user.id,
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      // ✅ CORREÇÃO: Verificar se a resposta foi bem-sucedida ANTES de tentar parsear
      if (response.ok) {
        // Resposta bem-sucedida (status 200-299)
        try {
          const result = await response.json();
          console.log('✅ Personagem criado com sucesso:', result);
          
          const successMessage = `Personagem ${formData.name} criado com sucesso!`;
          
          if (Platform.OS === 'web') {
            alert(`Sucesso: ${successMessage}`);
          } else {
            Alert.alert('Sucesso', successMessage);
          }
          
          router.back();
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta de sucesso:', parseError);
          // Mesmo com erro de parse, se o status foi 200-299, consideramos sucesso
          const successMessage = `Personagem ${formData.name} criado com sucesso!`;
          
          if (Platform.OS === 'web') {
            alert(`Sucesso: ${successMessage}`);
          } else {
            Alert.alert('Sucesso', successMessage);
          }
          
          router.back();
        }
      } else {
        // Resposta com erro (status 400+)
        let errorMessage = 'Não foi possível criar o personagem.';
        
        try {
          const errorData = await response.json();
          console.error('❌ Erro do servidor:', errorData);
          
          // Verificar se é um erro temporário de conexão
          if (errorData.type === 'network_error' || response.status === 503) {
            errorMessage = 'Problema temporário de conexão. Tente novamente em alguns segundos.';
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else {
            errorMessage = `Erro do servidor (${response.status}). Tente novamente.`;
          }
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta de erro:', parseError);
          errorMessage = `Erro do servidor (${response.status}). Tente novamente.`;
        }
        
        if (Platform.OS === 'web') {
          alert(`Erro: ${errorMessage}`);
        } else {
          Alert.alert('Erro', errorMessage);
        }
      }
    } catch (networkError) {
      console.error('❌ Erro de rede:', networkError);
      
      let errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      
      // Verificar se é um erro específico de rede
      if (networkError instanceof Error) {
        if (networkError.message.includes('fetch')) {
          errorMessage = 'Problema de conexão com o servidor. Tente novamente.';
        } else if (networkError.message.includes('timeout')) {
          errorMessage = 'Tempo limite excedido. Tente novamente.';
        }
      }
      
      if (Platform.OS === 'web') {
        alert(`Erro: ${errorMessage}`);
      } else {
        Alert.alert('Erro', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={goBack}
            disabled={loading}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.title}>Novo Personagem</Text>
            <Text style={styles.subtitle}>Crie seu aventureiro</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Save size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={20} color="#D4AF37" />
              <Text style={styles.sectionTitle}>Informações Básicas</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome do Personagem</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Digite o nome do personagem"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Classe</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classSelector}>
                {classesData.map((dndClass) => (
                  <TouchableOpacity
                    key={dndClass.id}
                    style={[
                      styles.classCard,
                      formData.class_name === dndClass.name && styles.classCardSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, class_name: dndClass.name }))}
                    disabled={loading}
                  >
                    <Shield size={24} color={formData.class_name === dndClass.name ? "#FFFFFF" : "#D4AF37"} />
                    <Text style={[
                      styles.classCardText,
                      formData.class_name === dndClass.name && styles.classCardTextSelected
                    ]}>
                      {dndClass.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nível</Text>
              <View style={styles.levelSelector}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelButton,
                      formData.level === level && styles.levelButtonSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, level }))}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.levelButtonText,
                      formData.level === level && styles.levelButtonTextSelected
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Health Points */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Heart size={20} color="#E74C3C" />
              <Text style={styles.sectionTitle}>Pontos de Vida</Text>
            </View>

            <View style={styles.hpContainer}>
              <View style={styles.hpInputContainer}>
                <Text style={styles.inputLabel}>HP Atual</Text>
                <TextInput
                  style={styles.numberInput}
                  value={formData.hp_current.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 0;
                    setFormData(prev => ({ ...prev, hp_current: Math.max(0, value) }));
                  }}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              <View style={styles.hpInputContainer}>
                <Text style={styles.inputLabel}>HP Máximo</Text>
                <TextInput
                  style={styles.numberInput}
                  value={formData.hp_max.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 1;
                    setFormData(prev => ({ 
                      ...prev, 
                      hp_max: Math.max(1, value),
                      hp_current: Math.min(prev.hp_current, Math.max(1, value))
                    }));
                  }}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {/* Spell Slots (if spellcaster) */}
          {selectedClass?.spellcasting && Object.keys(formData.spell_slots).length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Zap size={20} color="#8E44AD" />
                <Text style={styles.sectionTitle}>Espaços de Magia</Text>
              </View>

              <View style={styles.spellSlotsContainer}>
                {Object.entries(formData.spell_slots).map(([level, [current, max]]) => (
                  <View key={level} style={styles.spellSlotCard}>
                    <Text style={styles.spellSlotLevel}>Nível {level}</Text>
                    <Text style={styles.spellSlotValue}>{current}/{max}</Text>
                  </View>
                ))}
              </View>
              
              <Text style={styles.spellSlotsNote}>
                Os espaços de magia são calculados automaticamente baseados na classe e nível do personagem.
              </Text>
            </View>
          )}

          {/* Class Description */}
          {selectedClass && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Shield size={20} color="#3498DB" />
                <Text style={styles.sectionTitle}>Sobre a Classe</Text>
              </View>
              
              <Text style={styles.classDescription}>{selectedClass.description}</Text>
              
              <View style={styles.classStats}>
                <View style={styles.classStat}>
                  <Text style={styles.classStatLabel}>Dado de Vida:</Text>
                  <Text style={styles.classStatValue}>{selectedClass.hitDie}</Text>
                </View>
                
                <View style={styles.classStat}>
                  <Text style={styles.classStatLabel}>Habilidade Principal:</Text>
                  <Text style={styles.classStatValue}>{selectedClass.primaryAbility.join(', ')}</Text>
                </View>
                
                {selectedClass.spellcasting && (
                  <View style={styles.classStat}>
                    <Text style={styles.classStatLabel}>Conjurador:</Text>
                    <Text style={styles.classStatValue}>{selectedClass.spellcasting.ability}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
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
  header: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37',
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#27AE60',
    borderRadius: 8,
    padding: 12,
    marginLeft: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#95A5A6',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
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
  classSelector: {
    flexDirection: 'row',
  },
  classCard: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 80,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  classCardSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  classCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  classCardTextSelected: {
    color: '#FFFFFF',
  },
  levelSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    minWidth: 44,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  levelButtonSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  levelButtonTextSelected: {
    color: '#FFFFFF',
  },
  hpContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  hpInputContainer: {
    flex: 1,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    textAlign: 'center',
  },
  spellSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  spellSlotCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  spellSlotLevel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  spellSlotValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E44AD',
  },
  spellSlotsNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  classDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  classStats: {
    gap: 8,
  },
  classStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classStatLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  classStatValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});