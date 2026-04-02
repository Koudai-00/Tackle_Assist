import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Platform, ScrollView } from 'react-native';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useIdentity } from '../../hooks/useIdentity';
import { Backpack, Sparkles, FolderOpen, Plus, MoreVertical, Edit3, Trash2, Calendar, CheckCircle2 } from 'lucide-react-native';

export default function PackingScreen() {
  const router = useRouter();
  const { uuid } = useIdentity();
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 釣行準備開始モーダル用
  const [prepModalVisible, setPrepModalVisible] = useState(false);
  const [targetSet, setTargetSet] = useState<any>(null);
  const [tripName, setTripName] = useState('');
  const [tripDate, setTripDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);

  const fetchSets = async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/sets?userId=${uuid}`);
      const data = await res.json();
      if (data.sets) setSets(data.sets);
    } catch (err) {
      console.warn("API Error (Sets GET)", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchSets(); }, [uuid]));

  const handleDeleteSet = (id: string, name: string) => {
    const doDelete = async () => {
      try {
        const baseUrl = require('@/utils/api').getBaseUrl();
        await fetch(`${baseUrl}/api/sets?id=${id}`, { method: 'DELETE' });
        fetchSets();
      } catch (e) {
        console.error(e);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`「${name}」を削除しますか？`)) doDelete();
    } else {
      Alert.alert('確認', `「${name}」を削除しますか？`, [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const openPrepModal = (set: any) => {
    setTargetSet(set);
    setTripName(`${set.name}での釣行`);
    setPrepModalVisible(true);
  };

  const handleStartPrep = async () => {
    if (!tripName.trim() || !targetSet) return;
    setIsCreatingTrip(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uuid,
          setId: targetSet.id,
          name: tripName.trim(),
          tripDate: tripDate,
          alertEnabled: true
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPrepModalVisible(false);
        // ホーム画面へ戻るか、チェックリスト詳細へ飛ばす
        router.replace('/(tabs)');
        Alert.alert('完了', 'チェックリストを作成しました。ホーム画面から確認できます。');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', '作成に失敗しました');
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const renderSet = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FolderOpen color={Colors.dark.primary} size={28} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.setTitle}>{item.name}</Text>
          {item.description ? <Text style={styles.setDesc} numberOfLines={1}>{item.description}</Text> : null}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/set-editor', params: { id: item.id } })} style={styles.iconBtn}>
            <Edit3 color={Colors.dark.icon} size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteSet(item.id, item.name)} style={styles.iconBtn}>
            <Trash2 color={Colors.dark.danger} size={20} />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity style={styles.prepBtn} onPress={() => openPrepModal(item)}>
        <CheckCircle2 color="#fff" size={18} />
        <Text style={styles.prepBtnText}>このセットで準備を開始</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/set-editor')} style={{ marginRight: 16 }}>
            <Plus color={Colors.dark.primary} size={28} />
          </TouchableOpacity>
        )
      }} />

      <FlatList
        data={sets}
        keyExtractor={(item) => item.id}
        renderItem={renderSet}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          sets.length > 0 ? (
            <TouchableOpacity style={styles.aiHero} onPress={() => router.push('/ai-packing')}>
              <View style={styles.aiHeroContent}>
                <Sparkles color="#fff" size={24} />
                <View>
                  <Text style={styles.aiHeroTitle}>AIに相談してパッキング</Text>
                  <Text style={styles.aiHeroSub}>持ち物をGeminiが提案します</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Backpack color={Colors.dark.icon} size={64} />
            <Text style={styles.emptyTitle}>まだセットがありません</Text>
            <Text style={styles.emptySub}>右上の「＋」からお気に入りの仕掛けセットを作るか、AIに相談してみましょう。</Text>
            <TouchableOpacity style={styles.aiEmptyBtn} onPress={() => router.push('/ai-packing')}>
              <Sparkles color="#fff" size={20} />
              <Text style={styles.aiEmptyBtnText}>AIに相談する</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* 準備開始モーダル */}
      <Modal visible={prepModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>釣行準備の開始</Text>
            
            <Text style={styles.label}>釣行名 / タイトル</Text>
            <TextInput 
              style={styles.input} 
              value={tripName} 
              onChangeText={setTripName}
              placeholder="例: 4/10 駿河湾ジギング"
              placeholderTextColor={Colors.dark.icon}
            />

            <Text style={styles.label}>予定日</Text>
            <TextInput 
              style={styles.input} 
              value={tripDate} 
              onChangeText={setTripDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.dark.icon}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPrepModalVisible(false)} disabled={isCreatingTrip}>
                <Text style={styles.cancelBtnText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleStartPrep} disabled={isCreatingTrip}>
                {isCreatingTrip ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>準備リストを作成</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  listContainer: { padding: 16, paddingBottom: 100 },
  
  aiHero: { backgroundColor: Colors.dark.primary, borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: Colors.dark.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  aiHeroContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  aiHeroTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  aiHeroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },

  card: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.dark.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  setTitle: { fontSize: 18, fontWeight: '600', color: Colors.dark.text },
  setDesc: { fontSize: 14, color: Colors.dark.icon, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },

  prepBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.secondary, paddingVertical: 12, borderRadius: 12, gap: 8 },
  prepBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark.text, marginTop: 20 },
  emptySub: { fontSize: 14, color: Colors.dark.icon, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  aiEmptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 24, gap: 8 },
  aiEmptyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // モーダル
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.dark.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.dark.border },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 24 },
  label: { fontSize: 12, color: Colors.dark.icon, marginBottom: 8 },
  input: { backgroundColor: Colors.dark.background, color: Colors.dark.text, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, fontSize: 16, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.dark.background, borderWidth: 1, borderColor: Colors.dark.border },
  cancelBtnText: { color: Colors.dark.text, fontWeight: '600' },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.dark.primary },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' }
});
