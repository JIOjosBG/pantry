import { Tabs } from 'expo-router';
import { ColorValue, Text } from 'react-native';
import { colors } from '@/components/theme';

function icon(emoji: string) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Pantry', tabBarIcon: icon('🧊'), headerTitle: 'My pantry' }}
      />
      <Tabs.Screen
        name="cook"
        options={{ title: 'Cook now', tabBarIcon: icon('🍳'), headerTitle: 'Cook now' }}
      />
      <Tabs.Screen
        name="discover"
        options={{ title: 'Discover', tabBarIcon: icon('🔍'), headerTitle: 'Discover recipes' }}
      />
      <Tabs.Screen
        name="shopping"
        options={{ title: 'Shopping', tabBarIcon: icon('🛒'), headerTitle: 'Shopping list' }}
      />
    </Tabs>
  );
}
