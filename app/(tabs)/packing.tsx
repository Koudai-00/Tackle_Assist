import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useIdentity } from '../../hooks/useIdentity';
import { Backpack, Sparkles, FolderOpen } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { uuid } = useIdentity();
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const renderSet = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FolderOpen color={Colors.dark.primary} size={24} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.setTitle}>{item.name}</Text>
          {item.description ? <Text style={styles.setDesc}>{item.description}</Text> : null}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sets}
        keyExtractor={(item) => item.id}
        renderItem={renderSet}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Backpack color={Colors.dark.icon} size={48} />
            <Text style={styles.emptyTitle}>登録されたセットが見つかりません</Text>
            <Text style={styles.emptySub}>よく行く釣りの道具をセットにして残すか、AIに選んでもらいましょう。</Text>
          </View>
        }
      />

      {/* AIアシストボタン */}
      <TouchableOpacity style={styles.aiButton} onPress={() => router.push('/ai-packing')}>
        <Sparkles color="#fff" size={24} />
        <Text style={styles.aiButtonText}>AIに相談してパッキング</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  listContainer: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  setTitle: { fontSize: 18, fontWeight: '600', color: Colors.dark.text },
  setDesc: { fontSize: 14, color: Colors.dark.icon, marginTop: 4 },
  aiButton: { position: 'absolute', bottom: 20, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.primary, paddingVertical: 18, borderRadius: 16, elevation: 6, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, gap: 12 },
  aiButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.dark.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.dark.icon, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
