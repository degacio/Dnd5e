import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Spell, SchoolColors } from '@/types/spell';
import { Sparkles, Clock, Target, Zap, Timer } from 'lucide-react-native';

interface SpellCardProps {
  spell: Spell;
  onPress?: () => void;
}

export function SpellCard({ spell, onPress }: SpellCardProps) {
  const schoolColor = SchoolColors[spell.school as keyof typeof SchoolColors];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.header, { backgroundColor: schoolColor }]}>
        <View style={styles.titleRow}>
          <Sparkles size={20} color="#FFFFFF" />
          <Text style={styles.spellName}>{spell.name}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{spell.level}º</Text>
          </View>
        </View>
        <Text style={styles.schoolText}>{spell.school}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Clock size={16} color="#666" />
            <Text style={styles.statLabel}>Tempo</Text>
            <Text style={styles.statValue}>{spell.castingTime}</Text>
          </View>
          <View style={styles.statItem}>
            <Target size={16} color="#666" />
            <Text style={styles.statLabel}>Alcance</Text>
            <Text style={styles.statValue}>{spell.range}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Zap size={16} color="#666" />
            <Text style={styles.statLabel}>Componentes</Text>
            <Text style={styles.statValue}>{spell.components}</Text>
          </View>
          <View style={styles.statItem}>
            <Timer size={16} color="#666" />
            <Text style={styles.statLabel}>Duração</Text>
            <Text style={styles.statValue}>{spell.duration}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {spell.description}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.classes}>
            Classes: {spell.classes.join(', ')}
          </Text>
          <Text style={styles.source}>{spell.source}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  spellName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  schoolText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 12,
  },
  classes: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  source: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});