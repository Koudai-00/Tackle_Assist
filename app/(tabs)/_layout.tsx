import { Tabs, Link } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/theme';
import { LayoutDashboard, Box, Backpack, Wrench, Settings, ShoppingCart } from 'lucide-react-native';

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
          backgroundColor: Colors.dark.surface,
        },
        headerTintColor: Colors.dark.text,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'ホーム',
          headerTitle: 'メンテナンス・アラート',
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
          headerRight: () => (
            <Link href="/transfer" asChild>
              <TouchableOpacity style={{ marginRight: 20 }}>
                <Settings color={Colors.dark.text} size={24} />
              </TouchableOpacity>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          tabBarLabel: '在庫管理',
          headerTitle: 'マイタックルボックス',
          tabBarIcon: ({ color }) => <Box color={color} size={24} />,
          headerRight: () => (
            <Link href="/shopping" asChild>
              <TouchableOpacity style={{ marginRight: 20 }}>
                <ShoppingCart color={Colors.dark.text} size={24} />
              </TouchableOpacity>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="packing"
        options={{
          tabBarLabel: 'パッキング',
          headerTitle: 'パッキング＆セット一覧',
          tabBarIcon: ({ color }) => <Backpack color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          tabBarLabel: 'ツール',
          headerTitle: '専門単位 一括変換ツール',
          tabBarIcon: ({ color }) => <Wrench color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
