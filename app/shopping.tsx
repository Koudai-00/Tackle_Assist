import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../constants/theme';
import { useIdentity } from '../hooks/useIdentity';
import { CheckSquare, Square, ShoppingCart } from 'lucide-react-native';

export default function ShoppingListScreen() {
  const { uuid } = useIdentity();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShoppingList = async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/shopping?userId=${uuid}`);
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.warn("API Error (Shopping GET)", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchShoppingList();
    }, [uuid])
  );

  const togglePurchased = async (id: string, currentStatus: boolean) => {
    // 楽観的UI更新
    setItems((prev) => prev.map(item => item.id === id ? { ...item, isPurchased: !currentStatus } : item));
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      await fetch(`${baseUrl}/api/shopping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPurchased: !currentStatus })
      });
    } catch (error) {
       // ロールバック
       fetchShoppingList();
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => togglePurchased(item.id, item.isPurchased)}>
      <View style={{ marginRight: 12 }}>
        {item.isPurchased ? (
          <CheckSquare color={Colors.dark.secondary} size={28} />
        ) : (
          <Square color={Colors.dark.icon} size={28} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemName, item.isPurchased && styles.itemNamePurchased]}>
          {item.itemName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ShoppingCart color={Colors.dark.icon} size={48} />
            <Text style={styles.emptyTitle}>買い物リストは空です</Text>
            <Text style={styles.emptySub}>ルアーをロストした時など、補充が必要なアイテムがここに追加されます。</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.background },
  container: { flex: 1, backgroundColor: Colors.dark.background },
  listContainer: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border },
  itemName: { fontSize: 18, fontWeight: '600', color: Colors.dark.text },
  itemNamePurchased: { color: Colors.dark.icon, textDecorationLine: 'line-through' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.dark.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.dark.icon, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
