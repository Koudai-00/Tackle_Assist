import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, TouchableOpacity, Text, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { useIdentity } from '../hooks/useIdentity';
import { Colors } from '../constants/theme';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

import { initializeAds } from '../utils/admob-init';


export default function RootLayout() {
  const { isLoading } = useIdentity();

  // AdMob SDK 初期化
  useEffect(() => {
    initializeAds();
  }, []);

  // 初回の匿名UUID生成・DB登録のローディング中
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.dark.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  const renderCloseButton = (navigation: any) => (
    <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
      <Text style={{ color: Colors.dark.primary, fontSize: 16, fontWeight: 'bold' }}>閉じる</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="inventory-add" 
            options={({ navigation }) => ({ 
              presentation: 'modal', 
              title: '釣具の登録', 
              headerStyle: { backgroundColor: Colors.dark.surface }, 
              headerTintColor: Colors.dark.text,
              headerRight: () => renderCloseButton(navigation)
            })} 
          />
          <Stack.Screen name="shopping" options={{ title: '買い物・補充リスト', headerStyle: { backgroundColor: Colors.dark.surface }, headerTintColor: Colors.dark.text }} />
          <Stack.Screen 
            name="maintenance-add" 
            options={({ navigation }) => ({ 
              presentation: 'modal', 
              title: 'メンテナンス記録', 
              headerStyle: { backgroundColor: Colors.dark.surface }, 
              headerTintColor: Colors.dark.text,
              headerRight: () => renderCloseButton(navigation)
            })} 
          />
          <Stack.Screen 
            name="maintenance-edit" 
            options={({ navigation }) => ({ 
              presentation: 'modal', 
              title: 'アラートの編集', 
              headerStyle: { backgroundColor: Colors.dark.surface }, 
              headerTintColor: Colors.dark.text,
              headerRight: () => renderCloseButton(navigation)
            })} 
          />
          <Stack.Screen 
            name="location-tags" 
            options={({ navigation }) => ({ 
              presentation: 'modal', 
              title: '保管場所タグの管理', 
              headerStyle: { backgroundColor: Colors.dark.surface }, 
              headerTintColor: Colors.dark.text,
              headerRight: () => renderCloseButton(navigation)
            })} 
          />
          <Stack.Screen 
            name="inventory-detail" 
            options={({ navigation }) => ({ 
              presentation: 'modal', 
              title: 'タックル詳細', 
              headerStyle: { backgroundColor: Colors.dark.surface }, 
              headerTintColor: Colors.dark.text,
              headerRight: () => renderCloseButton(navigation)
            })} 
          />
          <Stack.Screen 
            name="set-editor" 
            options={({ navigation }) => ({ 
              presentation: 'modal', 
              title: 'セットの編集', 
              headerStyle: { backgroundColor: Colors.dark.surface }, 
              headerTintColor: Colors.dark.text,
              headerRight: () => renderCloseButton(navigation)
            })} 
          />
          <Stack.Screen 
            name="trip-packing" 
            options={{ 
              title: 'パッキング', 
              headerStyle: { backgroundColor: Colors.dark.surface }, 
              headerTintColor: Colors.dark.text
            }} 
          />
          <Stack.Screen 
            name="ai-packing" 
            options={({ navigation }) => ({ 
              presentation: 'modal', 
              title: 'AIパッキング提案', 
              headerStyle: { backgroundColor: Colors.dark.surface }, 
              headerTintColor: Colors.dark.text,
              headerRight: () => renderCloseButton(navigation)
            })} 
          />
          <Stack.Screen name="transfer" options={{ title: 'データ引き継ぎ・設定', headerStyle: { backgroundColor: Colors.dark.surface }, headerTintColor: Colors.dark.text }} />
        </Stack>
        <StatusBar style="light" backgroundColor={Colors.dark.background} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
