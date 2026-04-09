import React, { useState } from 'react';
import { StyleSheet, ScrollView, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import { CheckCircle2, ChevronLeft, Send, AlertCircle } from 'lucide-react-native';

const INQUIRY_TYPES = [
  '不具合・バグの報告',
  '新機能のご要望',
  'その他のお問い合わせ',
];

export default function InquiryScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState(INQUIRY_TYPES[0]);
  const [message, setMessage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      const msg = '返信用メールアドレスを入力してください。';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('入力エラー', msg);
      return;
    }
    if (!message.trim()) {
      const msg = 'お問い合わせ内容を入力してください。';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('入力エラー', msg);
      return;
    }

    // 簡単な形式チェック
    if (!email.includes('@')) {
      const msg = '有効なメールアドレスを入力してください。';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('入力エラー', msg);
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          type,
          message: message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || '送信に失敗しました');
      }

      setIsSuccess(true);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message === 'Failed to fetch' 
        ? 'ネットワーク接続を確認してください。' 
        : error.message || '予期せぬエラーが発生しました。';
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert('送信エラー', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <Stack.Screen options={{ title: '送信完了', headerBackVisible: false }} />
        <CheckCircle2 color="#10B981" size={80} style={{ marginBottom: 24 }} />
        <Text style={styles.successTitle}>お問い合わせを受け付けました</Text>
        <Text style={styles.successText}>
          内容を確認のうえ、必要に応じてご入力いただいたメールアドレス宛にご連絡させていただきます。
        </Text>
        <TouchableOpacity 
          style={[styles.submitBtn, { marginTop: 32 }]} 
          onPress={() => router.back()}
        >
          <ChevronLeft color="#fff" size={20} />
          <Text style={styles.submitBtnText}>元の画面に戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'お問い合わせ', headerBackTitle: '戻る' }} />
      
      <Text style={styles.title}>お問い合わせフォーム</Text>
      <Text style={styles.headerText}>
        アプリの不具合報告や機能の要望など、お気軽にお問い合わせください。
      </Text>

      {/* お問い合わせ種別 */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>お問い合わせ種別 <Text style={styles.required}>*</Text></Text>
        <View style={styles.typeSelector}>
          {INQUIRY_TYPES.map((t) => {
            const isSelected = type === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.typeOption, isSelected && styles.typeOptionSelected]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeOptionText, isSelected && styles.typeOptionTextSelected]}>
                  {t}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* お名前 */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>お名前 <Text style={styles.optional}>（任意）</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="例：山田 太郎 / ニックネーム"
          placeholderTextColor={Colors.dark.icon}
          value={name}
          onChangeText={setName}
          editable={!isSubmitting}
        />
      </View>

      {/* メールアドレス */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>返信用メールアドレス <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="例：email@example.com"
          placeholderTextColor={Colors.dark.icon}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!isSubmitting}
        />
        <View style={styles.hintBox}>
          <AlertCircle color={Colors.dark.icon} size={14} />
          <Text style={styles.hintText}>受付完了メールなどは送信されません。</Text>
        </View>
      </View>

      {/* お問い合わせ内容 */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>お問い合わせ内容 <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="具体的な内容をご記入ください..."
          placeholderTextColor={Colors.dark.icon}
          multiline
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
          editable={!isSubmitting}
        />
      </View>

      {/* 送信ボタン */}
      <TouchableOpacity 
        style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Send color="#fff" size={20} />
            <Text style={styles.submitBtnText}>上記の内容で送信する</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { padding: 20 },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 16, textAlign: 'center' },
  successText: { fontSize: 15, color: Colors.dark.icon, lineHeight: 24, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 8 },
  headerText: { fontSize: 14, color: Colors.dark.icon, lineHeight: 22, marginBottom: 24 },
  fieldContainer: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 8 },
  required: { color: '#ef4444' },
  optional: { color: Colors.dark.icon, fontWeight: 'normal', fontSize: 12 },
  input: {
    backgroundColor: Colors.dark.surface,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    fontSize: 15,
  },
  textArea: {
    height: 150,
    paddingTop: 16,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  hintText: {
    color: Colors.dark.icon,
    fontSize: 12,
  },
  typeSelector: {
    gap: 8,
  },
  typeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  typeOptionSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  typeOptionText: {
    color: Colors.dark.text,
    fontSize: 14,
  },
  typeOptionTextSelected: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: Colors.dark.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
