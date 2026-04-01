import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useIdentity } from '../hooks/useIdentity';
import { Colors } from '../constants/theme';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const { isLoading } = useIdentity();

  // 初回の匿名UUID生成・DB登録のローディング中
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.dark.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* モーダルやサブスクリーンはここに追加 */}
      </Stack>
      <StatusBar style="light" backgroundColor={Colors.dark.background} />
    </ThemeProvider>
  );
}
