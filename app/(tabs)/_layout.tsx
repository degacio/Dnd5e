import { Tabs } from 'expo-router';
import { BookOpen, Dice6, Shield, Sword, Users, Settings } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#2C2C2E',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lista de Magias',
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="characters"
        options={{
          title: 'Personagens',
          tabBarIcon: ({ size, color }) => (
            <Shield size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dice"
        options={{
          title: 'Dados',
          tabBarIcon: ({ size, color }) => (
            <Dice6 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="combat"
        options={{
          title: 'Combate',
          tabBarIcon: ({ size, color }) => (
            <Sword size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configurações',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}