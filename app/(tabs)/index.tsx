import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { SpellList } from '@/components/SpellList';
import { Spell } from '@/types/spell';
import { Sparkles } from 'lucide-react-native';

export default function SpellsTab() {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpells();
  }, []);

  const loadSpells = async () => {
    try {
      const spellsData = require('@/data/spells.json');
      setSpells(spellsData);
    } catch (error) {
      console.error('Erro ao carregar magias:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Sparkles size={48} color="#D4AF37" />
        <Text style={styles.loadingText}>Carregando magias...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Sparkles size={28} color="#D4AF37" />
          <Text style={styles.title}>Lista de Magias</Text>
        </View>
        <Text style={styles.subtitle}>
          Dungeons & Dragons 5ª Edição
        </Text>
      </View>
      <SpellList spells={spells} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
});