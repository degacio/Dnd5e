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
      <View style={[styles.header, { backgroundColor: schoolColor }]}>
        <View style={styles.titleRow}>
          <Sparkles size={18} color="#FFFFFF" />
          <Text style={styles.spellName}>{spell.name}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{spell.level}º</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={styles.schoolText}>{spell.school}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.castingTimeText}>{spell.castingTime}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.rangeText}>{spell.range}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.classes} numberOfLines={1}>
            {spell.classes.join(', ')}
          </Text>
          <ChevronRight size={16} color="#666" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spellName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  schoolText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  separator: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 6,
  },
  castingTimeText: {
    fontSize: 12,
    color: '#666',
  },
  rangeText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  classes: {
    fontSize: 11,
    color: '#666',
    flex: 1,
    fontWeight: '500',
  },
});