import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import { useIdentity } from '../hooks/useIdentity';
import { Sparkles, Save, Lightbulb } from 'lucide-react-native';
import { useInterstitialAd } from '../hooks/useInterstitialAd';

export default function AIPackingModal() {
  const router = useRouter();
  const { uuid } = useIdentity();
  
  const [targetFish, setTargetFish] = useState('');
  const [location, setLocation] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ advice: string; recommendedItemIds: string[] } | null>(null);
  const { showAd } = useInterstitialAd();

  const handleAskAI = async () => {
    if (!targetFish.trim()) {
      if (Platform.OS === 'web') alert('対象魚（ターゲット）を入力してください');
      else Alert.alert('エラー', '対象魚（ターゲット）を入力してください');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uuid, targetFish, location, extraInfo })
      });
      const data = await res.json();
      if (data.recommendation) {
        setResult(data.recommendation);
      } else {
        throw new Error(data.error || 'No recommendation received');
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') alert('AI通信エラーが発生しました（APIキーや在庫の確認をしてください）');
      else Alert.alert('通信エラー', 'AI機能の呼び出しに失敗しました。Geminiへの疎通ができているか確認してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsSet = async () => {
     if (!result) return;
     setIsSubmitting(true);
     try {
       const baseUrl = require('@/utils/api').getBaseUrl();
       const res = await fetch(`${baseUrl}/api/sets`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            userId: uuid,
            name: `${targetFish}攻略セット (${location || '場所指定なし'})`,
            description: result.advice,
            items: result.recommendedItemIds.map((id: string) => ({
              itemId: id,
              requiredQuantity: 1
            }))
         })
       });
       if (res.ok) {
         router.back();
       } else {
         if (Platform.OS === 'web') alert('保存に失敗しました');
         else Alert.alert('エラー', 'セットの保存に失敗しました');
       }
     } catch (e) {
       console.error(e);
     } finally {
       setIsSubmitting(false);
     }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!result ? (
        <>
          <View style={styles.headerArea}>
            <Sparkles color={Colors.dark.primary} size={48} />
            <Text style={styles.headerTitle}>AI アシスタント</Text>
            <Text style={styles.headerSub}>あなたの在庫から、次の釣りに最適なタックルを選び出します。</Text>
          </View>

          <Text style={styles.label}>対象魚 / ターゲット (必須)</Text>
          <TextInput
            style={styles.input}
            placeholder="例：シーバス、アジング"
            placeholderTextColor={Colors.dark.icon}
            value={targetFish}
            onChangeText={setTargetFish}
          />

          <Text style={styles.label}>釣り場の環境・地域</Text>
          <TextInput
            style={styles.input}
            placeholder="例：東京湾の河口、強風、夜間"
            placeholderTextColor={Colors.dark.icon}
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>その他（こだわり等）</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="例：今日はトップウォーターメインで遊びたい"
            placeholderTextColor={Colors.dark.icon}
            multiline
            value={extraInfo}
            onChangeText={setExtraInfo}
          />

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
            onPress={() => {
              if (!targetFish.trim()) {
                if (Platform.OS === 'web') alert('対象魚（ターゲット）を入力してください');
                else Alert.alert('エラー', '対象魚（ターゲット）を入力してください');
                return;
              }
              // インタースティシャル広告を表示してからAIリクエストを実行
              showAd(() => handleAskAI());
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <><Sparkles color="#fff" size={20} /><Text style={styles.submitBtnText}>提案を生成する</Text></>}
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.resultArea}>
          <View style={styles.resultHeader}>
             <Lightbulb color={Colors.dark.accent} size={32} />
             <Text style={styles.resultTitle}>AIからの提案</Text>
          </View>
          
          <View style={styles.adviceBox}>
            <Text style={styles.adviceText}>{result.advice}</Text>
          </View>

          <View style={styles.itemsBox}>
             <Text style={styles.itemsTitle}>選出されたアイテム数: {result.recommendedItemIds.length}個</Text>
             <Text style={styles.itemsSub}>※自分の現在の在庫に一致したものが選ばれています。</Text>
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]} 
            onPress={handleSaveAsSet}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <><Save color="#fff" size={20} /><Text style={styles.saveBtnText}>お気に入りセットとして保存</Text></>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetBtn} onPress={() => setResult(null)} disabled={isSubmitting}>
             <Text style={styles.resetBtnText}>やり直す</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { padding: 20 },
  headerArea: { alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.text, marginTop: 12 },
  headerSub: { fontSize: 13, color: Colors.dark.icon, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.dark.icon, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.dark.surface, color: Colors.dark.text, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, fontSize: 16 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.primary, paddingVertical: 18, borderRadius: 16, marginTop: 40, gap: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  resultArea: { marginTop: 20 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  resultTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.dark.text },
  adviceBox: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: Colors.dark.accent, borderWidth: 1, padding: 20, borderRadius: 16, marginBottom: 20 },
  adviceText: { color: Colors.dark.text, fontSize: 15, lineHeight: 24 },
  itemsBox: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border, borderWidth: 1, padding: 16, borderRadius: 12, marginBottom: 32 },
  itemsTitle: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold' },
  itemsSub: { color: Colors.dark.icon, fontSize: 12, marginTop: 4 },
  
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.secondary, paddingVertical: 18, borderRadius: 16, marginBottom: 16, gap: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resetBtn: { paddingVertical: 16, alignItems: 'center' },
  resetBtnText: { color: Colors.dark.icon, fontSize: 16, fontWeight: '600' }
});
