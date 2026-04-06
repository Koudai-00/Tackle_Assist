import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Colors } from '../constants/theme';
import { useIdentity } from '../hooks/useIdentity';
import { CheckCircle2, Circle, Backpack, Calendar, ArrowLeft, Trophy } from 'lucide-react-native';

export default function TripPackingScreen() {
  const router = useRouter();
  const { uuid } = useIdentity();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [trip, setTrip] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTripDetail = async () => {
    if (!id || !uuid) return;
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/trips?userId=${uuid}&id=${id}`);
      const data = await res.json();
      if (data.trip) {
        setTrip(data.trip);
        setItems(data.items);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetail();
  }, [id, uuid]);

  const togglePacked = async (checklistItemId: string, currentStatus: boolean) => {
    // 楽観的更新
    setItems(prev => prev.map(i => i.id === checklistItemId ? { ...i, isPacked: !currentStatus } : i));
    
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      await fetch(`${baseUrl}/api/trips`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tripId: id,
          itemId: checklistItemId, 
          isPacked: !currentStatus 
        })
      });
    } catch (e) {
      console.error(e);
      fetchTripDetail();
    }
  };

  const handleCompleteTrip = async () => {
    setIsUpdating(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/trips`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tripId: id,
          isCompleted: true 
        })
      });
      if (res.ok) {
        setTrip(prev => ({ ...prev, isCompleted: true }));
        Alert.alert('お疲れ様です！', 'パッキングが完了しました。最高の釣行になりますように！');
        router.replace('/(tabs)');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const packedCount = items.filter(i => i.isPacked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (packedCount / totalCount) : 0;

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.dark.primary} size="large" /></View>;
  if (!trip) return <View style={styles.center}><Text style={{ color: '#fff' }}>釣行が見つかりません</Text></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: trip.name,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -4, padding: 12 }}>
            <View pointerEvents="none">
              <ArrowLeft color={Colors.dark.primary} size={28} />
            </View>
          </TouchableOpacity>
        )
      }} />

      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Calendar color={Colors.dark.primary} size={20} />
          <Text style={styles.dateText}>{trip.tripDate}</Text>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>{packedCount} / {totalCount} 完了</Text>
            <Text style={styles.percentText}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={it => it.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.itemCard, item.isPacked && styles.itemCardPacked]} 
            onPress={() => togglePacked(item.id, item.isPacked)}
          >
            <View style={styles.itemMain}>
              <View pointerEvents="none">
                {item.isPacked ? (
                  <CheckCircle2 color={Colors.dark.primary} size={28} />
                ) : (
                  <Circle color={Colors.dark.icon} size={28} />
                )}
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={[styles.itemName, item.isPacked && styles.itemNamePacked]}>{item.name}</Text>
                <Text style={styles.itemQty}>必要数: {item.requiredQuantity}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          packedCount === totalCount && !trip.isCompleted ? (
            <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteTrip} disabled={isUpdating}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} pointerEvents="none">
                <Trophy color="#fff" size={20} />
                <Text style={styles.completeBtnText}>準備完了を記録する</Text>
              </View>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: Colors.dark.icon }}>アイテムが登録されていません</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.background },
  
  header: { backgroundColor: Colors.dark.surface, padding: 20, borderBottomWidth: 1, borderColor: Colors.dark.border },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  dateText: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold' },
  
  progressSection: { gap: 8 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  progressText: { color: Colors.dark.text, fontSize: 14, fontWeight: '600' },
  percentText: { color: Colors.dark.primary, fontSize: 24, fontWeight: 'bold' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.dark.primary },

  listContainer: { padding: 16, paddingBottom: 100 },
  itemCard: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border },
  itemCardPacked: { opacity: 0.6, backgroundColor: 'rgba(14, 165, 233, 0.03)' },
  itemMain: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  itemTextContainer: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: '600', color: Colors.dark.text },
  itemNamePacked: { color: Colors.dark.icon, textDecorationLine: 'line-through' },
  itemQty: { fontSize: 12, color: Colors.dark.icon, marginTop: 4 },

  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.secondary, paddingVertical: 16, borderRadius: 12, marginTop: 20, gap: 10, shadowColor: Colors.dark.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  completeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  empty: { padding: 40, alignItems: 'center' }
});
