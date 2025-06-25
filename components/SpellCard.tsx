import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Spell, SchoolColors } from '@/types/spell';
import { Sparkles, ChevronRight } from 'lucide-react-native';

interface SpellCardProps {
  spell: Spell;
  onPress?: () => void;
}

export function SpellCard({ spell, onPress }: SpellCardProps) {
  const schoolColor = SchoolColors[spell.school as keyof typeof SchoolColors];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.levelIndicator, { backgroundColor: schoolColor }]}>
              <Text style={styles.levelText}>{spell.level}º</Text>
            </View>
            <Text style={styles.spellName}>{spell.name}</Text>
          </View>
          <ChevronRight size={16} color="#666" />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoText}>{spell.castingTime}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.infoText}>{spell.range}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.infoText}>{spell.components}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.classes} numberOfLines={1}>
            {spell.classes.join(', ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 8,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E5E5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  levelIndicator: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spellName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  separator: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 6,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  classes: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
});