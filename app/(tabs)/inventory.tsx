import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, TextInput, Modal, Alert, Platform } from 'react-native';
import { useFocusEffect, useRouter, Tabs, Link } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useIdentity } from '../../hooks/useIdentity';
import { Search, Plus, Minus, Trash2, ShieldCheck, Box, PackageOpen, ShoppingCart, Settings } from 'lucide-react-native';
import DropdownBtn from '../components/DropdownBtn';

const CATEGORIES = [
  { id: 'all', label: 'すべて' },
  { id: 'rod', label: 'ロッド' },
  { id: 'reel', label: 'リール' },
  { id: 'lure', label: 'ルアー' },
  { id: 'worm', label: 'ワーム' },
  { id: 'hook', label: 'フック' },
  { id: 'sinker', label: 'シンカー' },
  { id: 'line', label: 'ライン' },
  { id: 'rig', label: '仕掛け' },
  { id: 'bait', label: 'エサ' },
  { id: 'wear', label: 'ウェア' },
  { id: 'bag', label: 'バッグ/収納' },
  { id: 'tool', label: 'プライヤー/ツール' },
  { id: 'other', label: 'その他' },
];

const SORT_OPTIONS = [
  { id: 'date', label: '新着順' },
  { id: 'name', label: '名前順' },
  { id: 'qty', label: '在庫少ない順' },
];

export default function InventoryScreen() {
  const router = useRouter();
  const { uuid } = useIdentity();
  
  const [items, setItems] = useState<any[]>([]);
  const [locationTags, setLocationTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLocation, setActiveLocation] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  
  // Decrease Modal State
  const [decreaseModalVisible, setDecreaseModalVisible] = useState(false);
  const [targetItem, setTargetItem] = useState<any>(null);
  const [decreaseAmount, setDecreaseAmount] = useState(1);
  const [isDecreasing, setIsDecreasing] = useState(false);

  const fetchItems = async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/inventory?userId=${uuid}`);
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
      
      const resLoc = await fetch(`${baseUrl}/api/locations?userId=${uuid}`);
      const locData = await resLoc.json();
      if (locData.tags) setLocationTags(locData.tags);
      
    } catch (err) {
      console.warn("API Error (Inventory GET)", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [uuid])
  );

  const filteredItems = useMemo(() => {
    const list = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.locationTag && item.locationTag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesLocation = activeLocation === 'all' || item.locationTag === activeLocation;
      return matchesSearch && matchesCategory && matchesLocation;
    });

    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    } else if (sortBy === 'qty') {
      list.sort((a, b) => a.quantity - b.quantity);
    }
    // date はもとからサーバー側で降順になっている
    return list;
  }, [items, searchQuery, activeCategory, activeLocation, sortBy]);

  const openDecreaseModal = (item: any) => {
    setTargetItem(item);
    setDecreaseAmount(1);
    setDecreaseModalVisible(true);
  };

  const handleDecreaseConfirm = async () => {
    if (!targetItem) return;
    setIsDecreasing(true);
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      const res = await fetch(`${baseUrl}/api/inventory/lost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uuid, itemId: targetItem.id, amount: decreaseAmount })
      });
      const result = await res.json();

      if (res.ok) {
        setDecreaseModalVisible(false);
        fetchItems();

        if (result.newQuantity === 0) {
          Alert.alert(
            '在庫が0になりました',
            `${targetItem.name} を買い物（補充）リストに追加しますか？`,
            [
              { text: '追加しない', style: 'cancel' },
              { text: '追加する', onPress: () => addToShoppingList(targetItem.id, targetItem.name) }
            ]
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDecreasing(false);
    }
  };

  const addToShoppingList = async (itemId: string, itemName: string) => {
    try {
      const baseUrl = require('@/utils/api').getBaseUrl();
      await fetch(`${baseUrl}/api/shopping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uuid, itemName, itemId })
      });
      Alert.alert('通知', '買い物リストに追加しました');
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isOutOfStock = item.quantity === 0;

    const openDetail = () => {
      router.push({
        pathname: '/inventory-detail' as any,
        params: {
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: String(item.quantity),
          locationTag: item.locationTag || '',
          imageUrl: item.imageUrl || '',
          barcode: item.barcode || '',
        },
      });
    };

    return (
      <TouchableOpacity style={[styles.card, isOutOfStock && styles.cardOutOfStock]} onPress={openDetail} activeOpacity={0.7}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Box color={isOutOfStock ? Colors.dark.danger : Colors.dark.icon} size={28} />
          </View>
        )}
        
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text style={[styles.itemName, isOutOfStock && styles.textOutOfStock]} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={[styles.badge, isOutOfStock && { backgroundColor: Colors.dark.danger }]}>
              <Text style={styles.badgeText}>{isOutOfStock ? '在庫切れ' : `残り ${item.quantity} 個`}</Text>
            </View>
          </View>
          
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>カテゴリ: {CATEGORIES.find(c => c.id === item.category)?.label || item.category}</Text>
            {item.locationTag && <Text style={styles.metaText}>保管場所: {item.locationTag}</Text>}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, isOutOfStock && styles.actionBtnDisabled]} 
              onPress={(e) => { e.stopPropagation(); openDecreaseModal(item); }}
              disabled={isOutOfStock}
            >
              <Trash2 color={Colors.dark.icon} size={16} />
              <Text style={styles.actionBtnText}>消費/ロスト</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ドロップダウン用の選択肢を作成
  const locationOptions = [
    { id: 'all', label: '全保管場所' },
    ...locationTags.map(t => ({ id: t.name, label: t.name }))
  ];

  return (
    <View style={styles.container}>
      <Tabs.Screen 
        options={{
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push('/location-tags')} style={{ marginLeft: 4, padding: 12 }}>
              <View pointerEvents="none">
                <Settings color={Colors.dark.text} size={24} />
              </View>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <Link href="/shopping" asChild>
              <TouchableOpacity style={{ marginRight: 4, padding: 12 }}>
                <View pointerEvents="none">
                  <ShoppingCart color={Colors.dark.text} size={24} />
                </View>
              </TouchableOpacity>
            </Link>
          )
        }} 
      />
      {/* 検索・フィルター領域（コンパクト） */}
      <View style={styles.headerSection}>
        <View style={styles.searchBar}>
          <Search color={Colors.dark.icon} size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="タックル名・保管場所で検索"
            placeholderTextColor={Colors.dark.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.dropdownRow}>
          <View style={{ flex: 1 }}>
            <DropdownBtn options={CATEGORIES} selectedValue={activeCategory} onSelect={setActiveCategory} label="カテゴリ" />
          </View>
          <View style={{ width: 6 }} />
          <View style={{ flex: 1 }}>
            <DropdownBtn options={locationOptions} selectedValue={activeLocation} onSelect={setActiveLocation} label="保管場所" />
          </View>
          <View style={{ width: 6 }} />
          <View style={{ flex: 1 }}>
            <DropdownBtn options={SORT_OPTIONS} selectedValue={sortBy} onSelect={setSortBy} label="並び替え" />
          </View>
        </View>
      </View>

      {/* メインリスト */}
      {loading ? (
        <View style={styles.centerContainer}><ActivityIndicator size="large" color={Colors.dark.primary} /></View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <PackageOpen color={Colors.dark.icon} size={64} />
              <Text style={styles.emptyTitle}>見つかりませんでした</Text>
              <Text style={styles.emptySub}>右下の＋ボタンから新しく釣具を登録してください</Text>
            </View>
          }
        />
      )}

      {/* 追加FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/inventory-add')}>
        <View pointerEvents="none">
          <Plus color="#ffffff" size={32} />
        </View>
      </TouchableOpacity>

      {/* 個数減算モーダル（消費・ロスト時） */}
      <Modal visible={decreaseModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>消費・ロスト数の入力</Text>
            <Text style={{ color: Colors.dark.icon, marginBottom: 16 }}>{targetItem?.name}</Text>
            
            <View style={styles.counterRow}>
              <TouchableOpacity style={styles.counterBtn} onPress={() => setDecreaseAmount(Math.max(1, decreaseAmount - 1))}>
                <Minus color={Colors.dark.primary} size={24} />
              </TouchableOpacity>
              
              <TextInput 
                style={styles.counterInput}
                keyboardType="number-pad"
                value={String(decreaseAmount)}
                onChangeText={(v) => setDecreaseAmount(parseInt(v) || 1)}
              />
              
              <TouchableOpacity style={styles.counterBtn} onPress={() => setDecreaseAmount(Math.min(targetItem?.quantity || 1, decreaseAmount + 1))}>
                <Plus color={Colors.dark.primary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.stockRemainingHint}>
              在庫 {targetItem?.quantity} → 残り {Math.max(0, (targetItem?.quantity || 0) - decreaseAmount)}
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDecreaseModalVisible(false)} disabled={isDecreasing}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleDecreaseConfirm} disabled={isDecreasing}>
                {isDecreasing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalConfirmText}>減らす</Text>}
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
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerSection: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8, backgroundColor: Colors.dark.background, zIndex: 10, borderBottomWidth: 1, borderColor: Colors.dark.border },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 8 },
  searchInput: { flex: 1, marginLeft: 8, color: Colors.dark.text, fontSize: 14 },
  dropdownRow: { flexDirection: 'row', width: '100%' },

  listContainer: { padding: 12, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: Colors.dark.surface, borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: Colors.dark.border },
  cardOutOfStock: { borderColor: Colors.dark.danger, backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  itemImage: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#000' },
  imagePlaceholder: { width: 64, height: 64, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  
  cardContent: { flex: 1, marginLeft: 16, justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { flex: 1, fontSize: 16, fontWeight: 'bold', color: Colors.dark.text, marginRight: 8 },
  textOutOfStock: { color: Colors.dark.danger },
  badge: { backgroundColor: 'rgba(14, 165, 233, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: Colors.dark.primary, fontSize: 12, fontWeight: 'bold' },
  
  metaRow: { marginTop: 8 },
  metaText: { fontSize: 12, color: Colors.dark.icon, marginBottom: 2 },
  
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.background, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.dark.border, gap: 6 },
  actionBtnDisabled: { opacity: 0.3 },
  actionBtnText: { color: Colors.dark.text, fontSize: 12, fontWeight: '600' },

  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.dark.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.dark.icon, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: Colors.dark.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.dark.border },
  modalTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 20, backgroundColor: Colors.dark.background, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: Colors.dark.border },
  counterBtn: { padding: 12, backgroundColor: 'rgba(14, 165, 233, 0.1)', borderRadius: 12 },
  counterInput: { flex: 1, color: Colors.dark.text, fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  stockRemainingHint: { textAlign: 'center', color: Colors.dark.icon, marginBottom: 24 },
  modalActionRow: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.dark.background, borderWidth: 1, borderColor: Colors.dark.border },
  modalCancelText: { color: Colors.dark.text, fontWeight: 'bold', fontSize: 16 },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.dark.danger },
  modalConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
