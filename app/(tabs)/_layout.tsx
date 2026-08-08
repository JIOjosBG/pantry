import { Tabs } from 'expo-router';
import { ColorValue, Text } from 'react-native';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/lib/theme';

function icon(emoji: string) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
  };
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.bg },
        headerRight: () => <ThemeToggle />,
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
