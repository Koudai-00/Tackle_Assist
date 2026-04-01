import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { LayoutDashboard, Box, Backpack, Wrench } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.primary,
        tabBarInactiveTintColor: Colors.dark.tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors.dark.surface,
          borderTopColor: Colors.dark.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTintColor: Colors.dark.text,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: '在庫管理',
          tabBarIcon: ({ color }) => <Box color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="packing"
        options={{
          title: 'パッキング',
          tabBarIcon: ({ color }) => <Backpack color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'ツール',
          tabBarIcon: ({ color }) => <Wrench color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
