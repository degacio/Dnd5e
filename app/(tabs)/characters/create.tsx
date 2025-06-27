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
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { DnDClass } from '@/types/dndClass';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Heart, 
  Zap, 
  Sword,
  ChevronDown,
  Save
} from 'lucide-react-native';

interface CharacterFormData {
  name: string;
  class_name: string;
  level: number;
  race: string;
  background: string;
  alignment: string;
  hp_max: number;
  hp_current: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export default function CreateCharacterScreen() {
  const [classes, setClasses] = useState<DnDClass[]>([]);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    class_name: '',
    level: 1,
    race: '',
    background: '',
    alignment: '',
    hp_max: 8,
    hp_current: 8,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const classesData = require('@/data/classes.json');
      setClasses(classesData);
    } catch (error) {
      console.error('Erro ao carregar classes:', error);
    }
  };

  const updateFormData = (field: keyof CharacterFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const calculateHP = (classHitDie: string, constitution: number, level: number): number => {
    const hitDieValue = parseInt(classHitDie.replace('d', ''));
    const conModifier = getModifier(constitution);
    return hitDieValue + conModifier + ((level - 1) * (Math.floor(hitDieValue / 2) + 1 + conModifier));
  };

  const handleClassSelect = (selectedClass: DnDClass) => {
    const newHP = calculateHP(selectedClass.hitDie, formData.constitution, formData.level);
    updateFormData('class_name', selectedClass.name);
    updateFormData('hp_max', newHP);
    updateFormData('hp_current', newHP);
    setShowClassPicker(false);
  };

  const handleAbilityScoreChange = (ability: keyof CharacterFormData, value: string) => {
    const numValue = parseInt(value) || 10;
    updateFormData(ability, Math.max(1, Math.min(20, numValue)));
    
    // Recalculate HP if Constitution changes
    if (ability === 'constitution' && formData.class_name) {
      const selectedClass = classes.find(c => c.name === formData.class_name);
      if (selectedClass) {
        const newHP = calculateHP(selectedClass.hitDie, numValue, formData.level);
        updateFormData('hp_max', newHP);
        updateFormData('hp_current', newHP);
      }
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Nome do personagem é obrigatório.');
      return false;
    }
    if (!formData.class_name) {
      Alert.alert('Erro', 'Classe é obrigatória.');
      return false;
    }
    if (!formData.race.trim()) {
      Alert.alert('Erro', 'Raça é obrigatória.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Erro', 'Você precisa estar autenticado para criar personagens.');
        return;
      }

      const characterData = {
        name: formData.name,
        class_name: formData.class_name,
        level: formData.level,
        hp_current: formData.hp_current,
        hp_max: formData.hp_max,
        spell_slots: {},
        spells_known: [],
        character_data: {
          race: formData.race,
          background: formData.background,
          alignment: formData.alignment,
          stats: {
            strength: formData.strength,
            dexterity: formData.dexterity,
            constitution: formData.constitution,
            intelligence: formData.intelligence,
            wisdom: formData.wisdom,
            charisma: formData.charisma,
          }
        }
      };

      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterData),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Personagem criado com sucesso!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Erro', 'Não foi possível criar o personagem.');
      }
    } catch (error) {
      console.error('Error creating character:', error);
      Alert.alert('Erro', 'Erro ao criar personagem.');
    } finally {
      setLoading(false);
    }
  };

  const races = [
    'Humano', 'Elfo', 'Anão', 'Halfling', 'Draconato', 'Gnomo', 
    'Meio-elfo', 'Meio-orc', 'Tiefling'
  ];

  const backgrounds = [
    'Acólito', 'Artesão', 'Artista', 'Charlatão', 'Criminoso', 'Eremita',
    'Herói do Povo', 'Nobre', 'Forasteiro', 'Sábio', 'Soldado', 'Órfão'
  ];

  const alignments = [
    'Leal e Bom', 'Neutro e Bom', 'Caótico e Bom',
    'Leal e Neutro', 'Neutro', 'Caótico e Neutro',
    'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Criar Personagem</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome do Personagem *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              placeholder="Digite o nome do personagem"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Classe *</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowClassPicker(true)}
            >
              <Text style={[styles.pickerText, !formData.class_name && styles.placeholderText]}>
                {formData.class_name || 'Selecione uma classe'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Raça *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.race}
              onChangeText={(value) => updateFormData('race', value)}
              placeholder="Ex: Humano, Elfo, Anão..."
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Antecedente</Text>
            <TextInput
              style={styles.textInput}
              value={formData.background}
              onChangeText={(value) => updateFormData('background', value)}
              placeholder="Ex: Soldado, Nobre, Criminoso..."
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tendência</Text>
            <TextInput
              style={styles.textInput}
              value={formData.alignment}
              onChangeText={(value) => updateFormData('alignment', value)}
              placeholder="Ex: Leal e Bom, Caótico e Neutro..."
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nível</Text>
            <TextInput
              style={styles.numberInput}
              value={formData.level.toString()}
              onChangeText={(value) => updateFormData('level', parseInt(value) || 1)}
              placeholder="1"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Health Points */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={20} color="#E74C3C" />
            <Text style={styles.sectionTitle}>Pontos de Vida</Text>
          </View>

          <View style={styles.hpContainer}>
            <View style={styles.hpInputGroup}>
              <Text style={styles.inputLabel}>HP Máximo</Text>
              <TextInput
                style={styles.numberInput}
                value={formData.hp_max.toString()}
                onChangeText={(value) => updateFormData('hp_max', parseInt(value) || 1)}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.hpInputGroup}>
              <Text style={styles.inputLabel}>HP Atual</Text>
              <TextInput
                style={styles.numberInput}
                value={formData.hp_current.toString()}
                onChangeText={(value) => updateFormData('hp_current', parseInt(value) || 1)}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Ability Scores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sword size={20} color="#8E44AD" />
            <Text style={styles.sectionTitle}>Atributos</Text>
          </View>

          <View style={styles.abilitiesGrid}>
            {[
              { key: 'strength', label: 'Força' },
              { key: 'dexterity', label: 'Destreza' },
              { key: 'constitution', label: 'Constituição' },
              { key: 'intelligence', label: 'Inteligência' },
              { key: 'wisdom', label: 'Sabedoria' },
              { key: 'charisma', label: 'Carisma' },
            ].map((ability) => (
              <View key={ability.key} style={styles.abilityItem}>
                <Text style={styles.abilityLabel}>{ability.label}</Text>
                <TextInput
                  style={styles.abilityInput}
                  value={formData[ability.key as keyof CharacterFormData].toString()}
                  onChangeText={(value) => handleAbilityScoreChange(ability.key as keyof CharacterFormData, value)}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                <Text style={styles.abilityModifier}>
                  {getModifier(formData[ability.key as keyof CharacterFormData] as number) >= 0 ? '+' : ''}
                  {getModifier(formData[ability.key as keyof CharacterFormData] as number)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Class Picker Modal */}
      {showClassPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Classe</Text>
              <TouchableOpacity onPress={() => setShowClassPicker(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {classes.map((dndClass) => (
                <TouchableOpacity
                  key={dndClass.id}
                  style={styles.classOption}
                  onPress={() => handleClassSelect(dndClass)}
                >
                  <Text style={styles.classOptionName}>{dndClass.name}</Text>
                  <Text style={styles.classOptionDescription}>{dndClass.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: '#27AE60',
    borderRadius: 8,
    padding: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#95A5A6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  inputGroup: {
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
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
    width: 80,
    textAlign: 'center',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  hpContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  hpInputGroup: {
    flex: 1,
  },
  abilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  abilityItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  abilityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  abilityInput: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
    width: 50,
    textAlign: 'center',
    marginBottom: 4,
  },
  abilityModifier: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalCloseButton: {
    fontSize: 18,
    color: '#666',
    padding: 4,
  },
  modalList: {
    maxHeight: 400,
  },
  classOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: '#F8F9FA',
  },
  classOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  classOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});