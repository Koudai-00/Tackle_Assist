import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/theme';
import { useIdentity } from '../hooks/useIdentity';
import { SmartphoneNfc, Copy, Upload, Shield, Mail } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter, Stack } from 'expo-router';

const IDENTITY_KEY = 'fishing_agent_user_uuid';

export default function TransferScreen() {
  const router = useRouter();
  const { uuid } = useIdentity();
  const [newCode, setNewCode] = useState('');

  const handleCopy = async () => {
    if (uuid) {
      await Clipboard.setStringAsync(uuid);
      if (Platform.OS === 'web') alert('引き継ぎコードをコピーしました');
      else Alert.alert('コピー完了', '引き継ぎコードをクリップボードにコピーしました。');
    }
  };

  const executeTransfer = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(IDENTITY_KEY, newCode.trim());
        alert('引き継ぎが完了しました。ページをリロードします。');
        window.location.reload();
      } else {
        await SecureStore.setItemAsync(IDENTITY_KEY, newCode.trim());
        Alert.alert('引き継ぎ完了', 'データの引き継ぎが完了しました。アプリを一度完全に終了し、再起動してください。');
      }
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') alert('エラーが発生しました');
      else Alert.alert('エラー', '引き継ぎに失敗しました。');
    }
  };

  const handleTransfer = async () => {
    if (!newCode.trim()) {
      if (Platform.OS === 'web') alert('コードを入力してください');
      else Alert.alert('エラー', '引き継ぎコードを入力してください');
      return;
    }

    if (Platform.OS === 'web') {
      if (window.confirm('データを引き継ぎますか？現在の端末のデータは上書きされ、復元できなくなります。')) {
        executeTransfer();
      }
    } else {
      Alert.alert(
        '引き継ぎの確認',
        '現在の端末のデータは上書きされ、復元できなくなります。\n本当に実行しますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '引き継ぐ', style: 'destructive', onPress: executeTransfer }
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'データ引き継ぎ・設定', headerBackTitle: '' }} />
      <View style={styles.headerArea}>
        <SmartphoneNfc color={Colors.dark.primary} size={48} />
        <Text style={styles.headerTitle}>データ引き継ぎ</Text>
        <Text style={styles.headerSub}>
          ログイン不要でデータを保持するため、独自の引き継ぎコードを利用しています。
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>■ 現在のあなたの引き継ぎコード</Text>
        <Text style={styles.cardSub}>機種変更先の端末でこのコードを入力すると、現在のデータをそのまま復元できます。</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeText} selectable>{uuid}</Text>
        </View>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
          <Copy color={Colors.dark.text} size={18} />
          <Text style={styles.copyBtnText}>コードをコピー</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { marginTop: 24, borderColor: Colors.dark.accent }]}>
        <Text style={[styles.cardTitle, { color: Colors.dark.accent }]}>■ 別の端末からデータを復元する</Text>
        <Text style={styles.cardSub}>以前の端末で発行された引き継ぎコードを入力してください。</Text>
        
        <TextInput
          style={styles.input}
          placeholder="引き継ぎコードを入力"
          placeholderTextColor={Colors.dark.icon}
          value={newCode}
          onChangeText={setNewCode}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.transferBtn} onPress={handleTransfer}>
          <Upload color="#fff" size={20} />
          <Text style={styles.transferBtnText}>この端末にデータを復元</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { marginTop: 24 }]}>
        <Text style={styles.cardTitle}>■ アプリについて</Text>

        <TouchableOpacity style={styles.menuBtn} onPress={() => router.push('/privacy')}>
          <Shield color={Colors.dark.text} size={20} />
          <Text style={styles.menuBtnText}>プライバシーポリシー</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBtn} onPress={() => router.push('/inquiry')}>
          <Mail color={Colors.dark.text} size={20} />
          <Text style={styles.menuBtnText}>お問い合わせ</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { padding: 20 },
  headerArea: { alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.text, marginTop: 12 },
  headerSub: { fontSize: 13, color: Colors.dark.icon, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  card: { backgroundColor: Colors.dark.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border },
  cardTitle: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  cardSub: { color: Colors.dark.icon, fontSize: 13, marginBottom: 16, lineHeight: 20 },
  codeBox: { backgroundColor: Colors.dark.background, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 12 },
  codeText: { color: Colors.dark.primary, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.border, paddingVertical: 12, borderRadius: 8, gap: 8 },
  copyBtnText: { color: Colors.dark.text, fontWeight: '600' },
  input: { backgroundColor: Colors.dark.background, color: Colors.dark.text, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, fontSize: 14, marginBottom: 16 },
  transferBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.accent, paddingVertical: 16, borderRadius: 12, gap: 8 },
  transferBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  menuBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.background, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 12, gap: 12 },
  menuBtnText: { color: Colors.dark.text, fontSize: 15, fontWeight: '600' }
});
