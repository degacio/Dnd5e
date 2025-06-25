import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Spell, SchoolColors } from '@/types/spell';
import { Sparkles, ChevronRight, ChevronDown } from 'lucide-react-native';

interface SpellCardProps {
  spell: Spell;
  onPress?: () => void;
}

export function SpellCard({ spell, onPress }: SpellCardProps) {
  const [expanded, setExpanded] = useState(false);
  const schoolColor = SchoolColors[spell.school as keyof typeof SchoolColors];

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress} 
      activeOpacity={0.8}
    >
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

        {expanded ? (
          <View style={styles.expandedContent}>
            <Text style={styles.description}>
              {spell.description}
            </Text>
            
            <View style={styles.componentsContainer}>
              <Text style={styles.componentsLabel}>Componentes:</Text>
              <Text style={styles.componentsText}>{spell.components}</Text>
            </View>
            
            <View style={styles.durationContainer}>
              <Text style={styles.durationLabel}>Duração:</Text>
              <Text style={styles.durationText}>{spell.duration}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.description} numberOfLines={2}>
            {spell.description}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.classes} numberOfLines={1}>
            {spell.classes.join(', ')}
          </Text>
          {expanded ? (
            <ChevronDown size={16} color="#666" />
          ) : (
            <ChevronRight size={16} color="#666" />
          )}
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
    marginBottom: 8,
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
  description: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
    marginBottom: 12,
  },
  expandedContent: {
    marginBottom: 12,
  },
  componentsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 4,
  },
  componentsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginRight: 4,
  },
  componentsText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  durationContainer: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 8,
  },
  durationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginRight: 4,
  },
  durationText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
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