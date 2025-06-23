import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Sword, Target, Shield, Clock } from 'lucide-react-native';

export default function CombatTab() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Sword size={28} color="#D4AF37" />
          <Text style={styles.title}>Combate</Text>
        </View>
        <Text style={styles.subtitle}>
          Gerenciamento de encontros
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.placeholderContainer}>
          <Target size={64} color="#D4AF37" />
          <Text style={styles.placeholderTitle}>Em Desenvolvimento</Text>
          <Text style={styles.placeholderText}>
            Esta seção permitirá gerenciar combates e iniciativa.
          </Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Clock size={20} color="#666" />
              <Text style={styles.featureText}>Controle de iniciativa</Text>
            </View>
            <View style={styles.featureItem}>
              <Target size={20} color="#666" />
              <Text style={styles.featureText}>Rastreamento de HP</Text>
            </View>
            <View style={styles.featureItem}>
              <Shield size={20} color="#666" />
              <Text style={styles.featureText}>Condições e efeitos</Text>
            </View>
            <View style={styles.featureItem}>
              <Sword size={20} color="#666" />
              <Text style={styles.featureText}>Calculadora de dano</Text>
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
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresList: {
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
});