import { Tabs, Link } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { Colors } from '../../constants/theme';
import { LayoutDashboard, Box, Backpack, Wrench, Settings, ShoppingCart } from 'lucide-react-native';
import AdBanner from '../components/AdBanner';

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      <Tabs
        tabBar={(props) => (
          <View pointerEvents="box-none">
            {/* タブバーの上にバナー広告を配置 */}
            <AdBanner />
            <BottomTabBar {...props} />
          </View>
        )}
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
            tabBarIcon: ({ color }) => (
              <View pointerEvents="none">
                <LayoutDashboard color={color} size={24} />
              </View>
            ),
            headerRight: () => (
              <Link href="/transfer" asChild>
                <TouchableOpacity style={{ marginRight: 4, padding: 12 }}>
                  <View pointerEvents="none">
                    <Settings color={Colors.dark.text} size={24} />
                  </View>
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
            tabBarIcon: ({ color }) => (
              <View pointerEvents="none">
                <Box color={color} size={24} />
              </View>
            ),
            headerRight: () => (
              <Link href="/shopping" asChild>
                <TouchableOpacity style={{ marginRight: 4, padding: 12 }}>
                  <View pointerEvents="none">
                    <ShoppingCart color={Colors.dark.text} size={24} />
                  </View>
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
            tabBarIcon: ({ color }) => (
              <View pointerEvents="none">
                <Backpack color={color} size={24} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            tabBarLabel: 'ツール',
            headerTitle: '専門単位 一括変換ツール',
            tabBarIcon: ({ color }) => (
              <View pointerEvents="none">
                <Wrench color={color} size={24} />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
